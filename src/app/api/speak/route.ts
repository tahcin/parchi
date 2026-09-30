import { speak } from "@/lib/gemini";
import { getLanguage } from "@/lib/i18n";

export const maxDuration = 60;

// TTS quotas are the tightest (about 100 a day per model), so keep recent audio per server instance.
const cache = new Map<string, string>();

export async function POST(req: Request) {
  let text: unknown, lang: unknown;
  try {
    ({ text, lang } = (await req.json()) as { text: string; lang: string });
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) return Response.json({ error: "no_text" }, { status: 400 });
  if (text.length > 4000) return Response.json({ error: "text_too_long" }, { status: 413 });
  const key = `${lang}|${text}`;
  const cached = cache.get(key);
  if (cached) return Response.json({ audio: cached });
  try {
    const audio = await speak(text.slice(0, 800), getLanguage(typeof lang === "string" ? lang : undefined).english);
    if (!audio) return Response.json({ error: "no_audio" }, { status: 502 });
    const url = `data:audio/wav;base64,${audio}`;
    if (cache.size > 60) cache.delete(cache.keys().next().value!);
    cache.set(key, url);
    return Response.json({ audio: url });
  } catch (e) {
    console.error("tts failed", e);
    return Response.json({ error: "tts_failed" }, { status: 502 });
  }
}
