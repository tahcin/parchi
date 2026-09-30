import { extract, explain, isBusy } from "@/lib/gemini";
import { fallbackWords } from "@/lib/fallback";
import { SAMPLE_READINGS } from "@/lib/samples";
import { audit } from "@/lib/rules";
import { sprayWindow } from "@/lib/weather";
import { district } from "@/lib/geo";
import { saveReport } from "@/lib/store";
import { getLanguage } from "@/lib/i18n";
import { CROP_LIST } from "@/lib/crops";

export const maxDuration = 60;

// Same photo, crop, language and voice note: reuse the Gemini output instead of spending free-tier
// quota again (judges and demos mostly re-run the sample chits). Per server instance, bounded.
const cache = new Map<string, { ex: Awaited<ReturnType<typeof extract>>; words: Awaited<ReturnType<typeof explain>> | null }>();
async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Buffer.from(d).toString("hex");
}

interface Body {
  image: string; // data URL
  audio?: string; // data URL
  crop: string;
  lang: string;
  lat?: number;
  lon?: number;
  pumpsPerAcre?: number; // the farmer's answer to "how many tanks per acre?"
  recheck?: boolean; // same chit re-checked after that answer: don't count it twice
  sample?: string; // the built-in example chit ("chilli" or "paddy"), not a real farmer's chit
}

function splitDataUrl(u: string) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(u);
  return m ? { mimeType: m[1], data: m[2] } : null;
}

// About 6 MB of photo and 4 MB of voice note as base64. The app sends a 1600 px JPEG (well under 1 MB).
const MAX_IMAGE = 8_000_000;
const MAX_AUDIO = 6_000_000;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "bad_json" }, { status: 400 });
  const image = typeof body.image === "string" ? splitDataUrl(body.image) : null;
  if (!image || !image.mimeType.startsWith("image/") || !image.data) return Response.json({ error: "no_image" }, { status: 400 });
  if (image.data.length > MAX_IMAGE) return Response.json({ error: "image_too_large" }, { status: 413 });
  const audio = typeof body.audio === "string" ? splitDataUrl(body.audio) ?? undefined : undefined;
  if (audio && audio.data.length > MAX_AUDIO) return Response.json({ error: "audio_too_large" }, { status: 413 });
  const crop = (CROP_LIST as string[]).includes(body.crop) ? body.crop : "other";
  const lang = getLanguage(body.lang);
  const hasLoc = Number.isFinite(body.lat) && Number.isFinite(body.lon);
  const sample = body.sample === "chilli" || body.sample === "paddy" ? body.sample : null;

  // Set when a fallback stood in for Gemini, so that answer isn't cached over a real one later.
  let stoodIn = false;
  const key = await hash(`${crop}|${lang.code}|${image.data}|${audio?.data ?? ""}`);
  const hit = cache.get(key);

  // Reading the chit and fetching weather and district run in parallel.
  let ex: Awaited<ReturnType<typeof extract>>;
  let spray: Awaited<ReturnType<typeof sprayWindow>>;
  let place: Awaited<ReturnType<typeof district>>;
  try {
    [ex, spray, place] = await Promise.all([
      hit
        ? Promise.resolve(hit.ex)
        : extract(image, crop, audio).catch((e) => {
            // The example chit must work even when the free quota is spent: fall back to what
            // Gemini read from this same chit earlier.
            if (sample && !audio) {
              stoodIn = true;
              return SAMPLE_READINGS[sample];
            }
            throw e;
          }),
      hasLoc ? sprayWindow(body.lat!, body.lon!) : Promise.resolve(null),
      hasLoc ? district(body.lat!, body.lon!) : Promise.resolve({ state: null, district: null }),
    ]);
  } catch (e) {
    console.error("read failed", e);
    if (isBusy(e)) return Response.json({ error: "busy" }, { status: 503 });
    return Response.json({ error: "read_failed" }, { status: 502 });
  }

  // Keep only well-formed products, so a half-filled model answer can't crash the rule engine.
  const products = (Array.isArray(ex?.products) ? ex.products : [])
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      ...p,
      written: typeof p.written === "string" ? p.written : p.brand ?? "",
      actives: (Array.isArray(p.actives) ? p.actives : []).filter((a) => a && typeof a.name === "string" && a.name.trim()),
    }))
    .filter((p) => p.actives.length || p.brand);
  if (!ex?.isChit || !products.length) {
    return Response.json({ error: "not_a_chit", extraction: ex }, { status: 422 });
  }
  ex = { ...ex, products };

  const pumps = Number(body.pumpsPerAcre);
  const farm = pumps > 0 && pumps <= 60 ? { pumpsPerAcre: pumps } : undefined;
  let result: ReturnType<typeof audit>;
  let words: Awaited<ReturnType<typeof explain>>;
  // Reuse the explanation only if every product got the same flags (the pump answer can change them).
  let signature: string;
  try {
    result = audit(crop, ex.problem, products, spray, farm);
    signature = result.products.map((p) => p.flags.map((f) => f.code).join(",")).join("|") + `|${result.level}`;
    // The words follow the flags, so only reuse them when every flag is unchanged.
    words =
      hit?.words && (hit as { signature?: string }).signature === signature
        ? hit.words
        : await explain(result, lang.english).catch((e) => {
            // The verdict is the rule engine's, so show it in plainer words rather than failing.
            console.error("explain failed, using plain words", e);
            stoodIn = true;
            return fallbackWords(result, lang);
          });
    // The result screen maps over these, so a model answer missing a field must not crash it.
    words = {
      headline: String(words?.headline ?? ""),
      spoken: String(words?.spoken ?? ""),
      products: Array.isArray(words?.products) ? words.products.filter((p) => p && typeof p.id === "number") : [],
      dealerCard: { local: String(words?.dealerCard?.local ?? ""), english: String(words?.dealerCard?.english ?? "") },
      whatToDo: Array.isArray(words?.whatToDo) ? words.whatToDo.map(String) : [],
    };
  } catch (e) {
    console.error("audit failed", e);
    return Response.json({ error: "audit_failed" }, { status: 502 });
  }
  if (!stoodIn) {
    if (cache.size > 200) cache.delete(cache.keys().next().value!);
    cache.set(key, Object.assign({ ex, words }, { signature }));
  }

  const flaggedProducts = result.products.filter((p) => p.flags.length);
  // Only real chits go on the open map: not re-checks, and not the built-in examples.
  if (!body.recheck && !sample) await saveReport({
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    state: place.state,
    district: place.district,
    lat: hasLoc ? Math.round(body.lat! * 10) / 10 : null,
    lon: hasLoc ? Math.round(body.lon! * 10) / 10 : null,
    crop,
    level: result.level,
    flags: [...new Set([...result.products.flatMap((p) => p.flags.map((f) => f.code)), ...result.global.map((g) => g.code)])],
    actives: result.products.flatMap((p) => p.actives.map((a) => a.display)),
    flagged: flaggedProducts.flatMap((p) => p.actives.map((a) => a.display)),
    seed: false,
  }).catch((e) => console.error("save failed", e));

  return Response.json({ extraction: ex, audit: result, words, place });
}
