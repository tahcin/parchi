// The verdict comes from these deterministic checks over official data, not from the model.
// Gemini reads the chit and explains the result; it never decides whether a product is legal.

import {
  db, resolveActive, pretty, usesFor, usesForCrop, hasCropData, groupOf, isBio, norm,
  type RegisteredUse,
} from "./data";
import type { SprayWindow } from "./weather";
import { CROP_ALIASES, RAW_EATEN_CROPS, VEG_CROPS } from "./crops";

export type Level = "ok" | "careful" | "danger";

export type FlagCode =
  | "BANNED" | "RESTRICTED_CROP" | "FORMULATION_STOPPED" | "NOT_FOR_CROP" | "NOT_FOR_PEST"
  | "HAZARD_IA" | "HAZARD_IB" | "OVERDOSE" | "DUPLICATE" | "SAME_GROUP" | "UNKNOWN"
  | "COCKTAIL" | "RAIN" | "WIND" | "HEAT";

export interface Flag {
  code: FlagCode;
  level: Level;
  detail: string; // plain English, used by Gemini to explain and shown under "more"
  source?: string;
}

// What Gemini read off the chit, one entry per product.
export interface ExtractedProduct {
  written: string; // exactly as written on the chit
  brand: string | null;
  actives: { name: string; percent: number | null }[];
  formulation: string | null; // EC, SL, SC, WG, WP, GR...
  dose: { amount: number | null; unit: "ml" | "g" | "kg" | "l" | null; per: "litre" | "pump" | "acre" | "hectare" | "bigha" | null; pumpLitres: number | null } | null;
}

export interface AuditedProduct {
  id: number;
  written: string;
  brand: string | null;
  actives: { name: string; key: string | null; display: string; percent: number | null; whoClass: string | null }[];
  level: Level;
  flags: Flag[];
  registeredPests: string[];
  approvedDose: string | null;
  waitingDays: number | null;
  sources: string[];
}

export interface Alternative {
  label: string;
  pest: string;
  dose: string;
  waitingDays: number | null;
  bio: boolean;
  source: string;
}

export interface Audit {
  crop: string;
  problem: string | null;
  level: Level;
  products: AuditedProduct[];
  global: Flag[];
  alternatives: Alternative[];
  harvestAfter: string | null; // ISO date when the longest waiting period ends
  // A dose was given per litre or per pump, so the check depends on how much water the farmer
  // sprays per acre. When the farmer hasn't told us, we assumed the label's water volume.
  waterAssumed: boolean;
  pumpsPerAcre: number | null;
  spray: SprayWindow | null;
  dataAsOf: string;
}

const rank: Record<Level, number> = { ok: 0, careful: 1, danger: 2 };
const worst = (levels: Level[]): Level => levels.reduce<Level>((a, b) => (rank[b] > rank[a] ? b : a), "ok");

// A restricted-list crop word ("bhindi", "grape", "rice") matches our crop id via its alias.
function bannedOnCrop(cropsBanned: string[], crop: string): boolean {
  const isVeg = (VEG_CROPS as string[]).includes(crop);
  const isRaw = (RAW_EATEN_CROPS as string[]).includes(crop);
  return cropsBanned.some((c) =>
    c === crop ||
    CROP_ALIASES[c] === crop ||
    (isVeg && c === "vegetables") ||
    (isRaw && c.includes("consumed raw")),
  );
}

function minNumber(s: string | null | undefined): number | null {
  if (!s || /%/.test(s)) return null;
  const nums = (s.match(/\d+(\.\d+)?/g) ?? []).map(Number).filter((n) => n > 0);
  return nums.length ? Math.min(...nums) : null;
}

function maxNumber(s: string | null | undefined): number | null {
  if (!s || /%/.test(s)) return null;
  const nums = (s.match(/\d+(\.\d+)?/g) ?? []).map(Number).filter((n) => n > 0);
  return nums.length ? Math.max(...nums) : null;
}

// Rough active-ingredient grams per hectare from the chit's dose. Returns null when the
// chit doesn't say enough to estimate.
// The farmer's own spraying, when they have told us: knapsack tanks per acre.
export interface Farm {
  pumpsPerAcre?: number | null;
  pumpLitres?: number | null;
}

const ACRES_PER_HA = 2.471;

function aiGramsPerHa(p: ExtractedProduct, percent: number | null, labelWaterLPerHa: number, farm?: Farm): number | null {
  const d = p.dose;
  if (!d || d.amount == null || !d.unit || !d.per || percent == null) return null;
  let qty = d.amount; // ml or g of product
  if (d.unit === "kg" || d.unit === "l") qty *= 1000;
  const pumpL = d.pumpLitres || farm?.pumpLitres || 15;
  const pumpsPerHa = farm?.pumpsPerAcre ? farm.pumpsPerAcre * ACRES_PER_HA : null;
  const waterLPerHa = pumpsPerHa ? pumpsPerHa * pumpL : labelWaterLPerHa;
  let perHa: number;
  switch (d.per) {
    case "litre": perHa = qty * waterLPerHa; break;
    case "pump": perHa = pumpsPerHa ? qty * pumpsPerHa : (qty / pumpL) * waterLPerHa; break;
    case "acre": perHa = qty * 2.471; break;
    case "bigha": perHa = qty * 4; break; // varies by state; about 0.25 ha is a common value
    case "hectare": perHa = qty; break;
    default: return null;
  }
  return (perHa * percent) / 100; // treats 1 ml of liquid formulation as about 1 g
}

function pestMatches(problem: string, pestField: string): boolean {
  const stop = new Set(["and", "the", "of", "pest", "pests", "insect", "insects", "disease", "attack"]);
  const words = problem.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !stop.has(w));
  const field = (pestField ?? "").toLowerCase(); // a few biological entries have no pest
  return words.some((w) => field.includes(w) || field.includes(w.replace(/s$/, "")));
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function audit(
  crop: string,
  problem: string | null,
  extracted: ExtractedProduct[],
  spray: SprayWindow | null,
  farm?: Farm,
): Audit {
  const waterDependent = extracted.some((p) => p.dose?.per === "litre" || p.dose?.per === "pump");
  const d = db();
  const cropKnown = hasCropData(crop);
  const products: AuditedProduct[] = [];
  const seenActives = new Map<string, number>();
  const seenGroups = new Map<string, number>();

  extracted.forEach((p, id) => {
    const flags: Flag[] = [];
    const sources: string[] = [];
    let registeredPests: string[] = [];
    let approvedDose: string | null = null;
    let waitingDays: number | null = null;

    // Fall back to the brand name when the chit gives no active ingredient.
    let actives = p.actives ?? [];
    if (!actives.length && p.brand) actives = [{ name: p.brand, percent: null }];

    const resolved = actives.map((a) => {
      const key = resolveActive(a.name) ?? (p.brand ? resolveActive(p.brand) : null);
      const hz = key ? d.hazardByKey.get(key) : undefined;
      return { name: a.name, key, display: key ? pretty(key) : a.name, percent: a.percent, whoClass: hz?.who_class ?? null };
    });

    for (const a of resolved) {
      if (!a.key) {
        flags.push({ code: "UNKNOWN", level: "careful", detail: `Could not match "${a.name}" to any pesticide in the government list. Ask the dealer for the technical name printed on the pack.` });
        continue;
      }
      const name = a.display;
      const banned = d.banned.get(a.key) ?? d.refused.get(a.key) ?? d.withdrawn.get(a.key);
      if (banned) {
        flags.push({ code: "BANNED", level: "danger", detail: `${name} is banned in India. ${banned.note ?? ""}`.trim(), source: d.bannedSource });
      }
      const restricted = d.restricted.get(a.key);
      if (restricted) {
        const cropsBanned = (restricted.banned_on_crops ?? []).map((c) => c.toLowerCase());
        if (bannedOnCrop(cropsBanned, crop)) {
          flags.push({ code: "RESTRICTED_CROP", level: "danger", detail: `${name} is banned for use on this crop. ${restricted.restriction ?? ""}`.trim(), source: d.bannedSource });
        }
        const allowed = restricted.only_allowed_formulations;
        if (allowed?.length) {
          const f = `${a.percent ?? ""} ${p.formulation ?? ""}`.toLowerCase();
          const ok = allowed.some((x) => norm(f).includes(norm(x)) || (p.formulation ?? "").toUpperCase().includes(x.split(" ").pop()!.toUpperCase()));
          if (!ok) flags.push({ code: "FORMULATION_STOPPED", level: "danger", detail: `Only ${allowed.join(", ")} of ${name} may still be used. ${restricted.restriction ?? ""}`.trim(), source: d.bannedSource });
        }
        if (a.key === "monocrotophos" && (a.percent === 36 || /36/.test(p.written))) {
          flags.push({ code: "FORMULATION_STOPPED", level: "danger", detail: "Monocrotophos 36% SL registrations were cancelled after S.O. 4294(E) of 03.10.2023. Any stock sold now is old stock.", source: d.bannedSource });
        }
      }
      if (a.whoClass === "Ia") flags.push({ code: "HAZARD_IA", level: "danger", detail: `${name} is WHO Class Ia, extremely hazardous.`, source: "WHO Recommended Classification of Pesticides by Hazard, 2019" });
      if (a.whoClass === "Ib") flags.push({ code: "HAZARD_IB", level: "careful", detail: `${name} is WHO Class Ib, highly hazardous. Use full protection: gloves, mask, long sleeves. Keep away from children and water.`, source: "WHO Recommended Classification of Pesticides by Hazard, 2019" });

      if (seenActives.has(a.key) && seenActives.get(a.key) !== id) {
        flags.push({ code: "DUPLICATE", level: "careful", detail: `${name} is already in product ${seenActives.get(a.key)! + 1} on this chit. You would be paying twice and spraying a double dose.` });
      } else {
        seenActives.set(a.key, id);
        const g = groupOf(a.key);
        if (g && seenGroups.has(g) && seenGroups.get(g) !== id) {
          flags.push({ code: "SAME_GROUP", level: "careful", detail: `${name} works the same way (${g}) as product ${seenGroups.get(g)! + 1}. Mixing them adds cost and poison, not control, and pests become resistant faster.` });
        } else if (g) seenGroups.set(g, id);
      }
    }

    // Registration is per product: the same set of actives, for this crop. Seed treatments
    // (FS, WS, DS) are a different use and don't count for a spray.
    const keys = resolved.map((a) => a.key).filter((k): k is string => !!k);
    const anyBanned = flags.some((f) => f.code === "BANNED" || f.code === "RESTRICTED_CROP");
    if (cropKnown && keys.length === resolved.length && keys.length > 0 && !anyBanned) {
      const name = resolved.map((a) => a.display).join(" + ");
      const sameSet = (u: RegisteredUse) => {
        const k = u.active_ingredients.map(norm);
        return k.length === keys.length && keys.every((x) => k.includes(x));
      };
      const uses = usesFor(keys[0], crop).filter(sameSet).filter((u) => !/\b(FS|WS|DS)\b/i.test(u.formulation ?? ""));
      if (!uses.length) {
        const elsewhere = (d.byActive.get(keys[0]) ?? []).filter(sameSet).length > 0;
        const onlyInMix = !elsewhere && usesFor(keys[0], crop).length > 0;
        flags.push({
          code: "NOT_FOR_CROP",
          level: "careful",
          detail: onlyInMix
            ? `${name} on its own is not approved for this crop. It is approved only as part of a ready-made combination product. Using a pesticide on a crop it is not approved for is not allowed under the Insecticides Act, 1968.`
            : elsewhere
              ? `${name} is not approved for this crop in the CIB&RC list of approved uses. Using a pesticide on a crop it is not approved for is not allowed under the Insecticides Act, 1968.`
              : `${name} was not found in the CIB&RC list of approved uses.`,
          source: "CIB&RC Major Uses of Pesticides (31.03.2026)",
        });
      } else {
        // Prefer uses with the same strength as the chit (e.g. 17.8% SL, not 70% WG).
        const pct = resolved[0].percent;
        const strengthOf = (u: RegisteredUse) => ((u.formulation ?? "").match(/\d+(\.\d+)?/g) ?? []).map(Number);
        const same = pct != null ? uses.filter((u) => strengthOf(u).some((n) => Math.abs(n - pct) < 0.2)) : [];
        const pool = same.length ? same : uses;
        registeredPests = uniq(uses.map((u) => u.pest).filter(Boolean)).slice(0, 8);
        sources.push(...uniq(pool.map((u) => u.source)).slice(0, 2));
        const matching = problem ? pool.filter((u) => pestMatches(problem, u.pest)) : pool;
        if (problem && !uses.some((u) => pestMatches(problem, u.pest))) {
          flags.push({ code: "NOT_FOR_PEST", level: "careful", detail: `${name} is approved on this crop only for: ${registeredPests.join("; ")}. It is not approved for "${problem}".`, source: "CIB&RC Major Uses of Pesticides (31.03.2026)" });
        }
        const ref = (matching.length ? matching : pool)[0];
        approvedDose = ref.dose_formulation_per_ha
          ? `${ref.dose_formulation_per_ha} (g or ml) per ha of ${ref.product_label}, in ${ref.water_l_per_ha ?? 500} L water`
          : null;
        const w = (matching.length ? matching : pool).map((u) => u.waiting_period_days).filter((x): x is number => x != null);
        if (w.length) waitingDays = Math.max(...w);

        // Dose, for single-active products: active ingredient per hectare vs the highest approved.
        if (keys.length === 1) {
          const maxAi = Math.max(0, ...pool.map((u) => maxNumber(u.dose_ai_g_per_ha) ?? 0));
          // Low end of the label's water range: assuming more water would inflate a per-litre dose
          // and flag normal spraying as an overdose before the farmer has told us their tanks per acre.
          const water = minNumber(ref.water_l_per_ha) ?? 500;
          const est = aiGramsPerHa(p, pct, water, farm);
          if (maxAi > 0 && est != null && est > maxAi * 1.5) {
            const times = est / maxAi;
            flags.push({
              code: "OVERDOSE",
              level: times > 3 ? "danger" : "careful",
              detail: `The dose on the chit is about ${times.toFixed(1)} times the highest approved dose of ${name} for this crop (about ${Math.round(est)} g of active ingredient per ha, against ${maxAi} g approved).`,
              source: "CIB&RC Major Uses of Pesticides (31.03.2026)",
            });
          }
        }
      }
    }

    products.push({
      id,
      written: p.written,
      brand: p.brand,
      actives: resolved,
      level: worst(flags.map((f) => f.level)),
      flags,
      registeredPests,
      approvedDose,
      waitingDays,
      sources: uniq(sources),
    });
  });

  const global: Flag[] = [];
  if (extracted.length >= 3) {
    global.push({ code: "COCKTAIL", level: "careful", detail: `${extracted.length} products in one tank. Tank mixes that are not on the label are not tested for safety or effect.` });
  }
  if (spray?.rainSoon) global.push({ code: "RAIN", level: "careful", detail: "Rain is likely in the next 12 hours. It will wash the spray off." });
  if (spray?.windyNow) global.push({ code: "WIND", level: "careful", detail: "It is windy now. The spray will drift onto you, your neighbours and water." });
  if (spray?.hotNow) global.push({ code: "HEAT", level: "careful", detail: "It is very hot now. Spray in the early morning or evening." });

  // Safer options: approved for this crop (and the problem, if known), biological or low hazard,
  // and not already on the chit.
  const onChit = new Set(products.flatMap((p) => p.actives.map((a) => a.key)).filter(Boolean) as string[]);
  const cands = usesForCrop(crop).filter((u) => {
    if (u.active_ingredients.some((a) => onChit.has(norm(a)))) return false;
    const keys = u.active_ingredients.map(norm);
    const bio = keys.every(isBio);
    const lowHazard = keys.every((k) => ["III", "U"].includes(d.hazardByKey.get(k)?.who_class ?? ""));
    return bio || lowHazard;
  });
  const relevant = problem ? cands.filter((u) => pestMatches(problem, u.pest)) : [];
  const pick = (relevant.length ? relevant : cands)
    .sort((a, b) => Number(b.active_ingredients.map(norm).every(isBio)) - Number(a.active_ingredients.map(norm).every(isBio)));
  const alternatives: Alternative[] = [];
  const seenLabel = new Set<string>();
  for (const u of pick as RegisteredUse[]) {
    if (seenLabel.has(u.active_ingredient)) continue;
    seenLabel.add(u.active_ingredient);
    alternatives.push({
      label: u.product_label,
      pest: u.pest ?? "",
      dose: u.dose_formulation_per_ha ? `${u.dose_formulation_per_ha} per ha in ${u.water_l_per_ha} L water` : (u.application_note ?? ""),
      waitingDays: u.waiting_period_days,
      bio: u.active_ingredients.map(norm).every(isBio),
      source: u.source,
    });
    if (alternatives.length >= 4) break;
  }

  const maxWait = Math.max(0, ...products.map((p) => p.waitingDays ?? 0));
  const harvestAfter = maxWait > 0 ? new Date(Date.now() + maxWait * 86400000).toISOString().slice(0, 10) : null;

  return {
    crop,
    problem,
    level: worst([...products.map((p) => p.level), ...global.map((g) => g.level)]),
    products,
    global,
    alternatives,
    harvestAfter,
    waterAssumed: waterDependent && !farm?.pumpsPerAcre,
    pumpsPerAcre: farm?.pumpsPerAcre ?? null,
    spray,
    dataAsOf: `CIB&RC approved uses 31.03.2026; banned and restricted list ${d.bannedAsOf.slice(0, 10)}`,
  };
}
