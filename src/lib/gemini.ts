import { GoogleGenAI } from "@google/genai";
import type { Audit, ExtractedProduct } from "./rules";

// Free-tier friendly chains, tried in order. Google no longer publishes per-model free limits
// (only the logged-in AI Studio console shows them); reports from Sep 2026 put Flash-Lite at about
// 500 requests a day and full Flash at about 20, so the chains stay on Flash-Lite. Flash-Lite also
// read the chits accurately in about 2 s in our tests. TTS models each have their own daily quota
// (about 100 a day reported for 3.8 Flash TTS), and the browser's own voice is the last fallback.
const list = (v: string | undefined, d: string[]) => (v ? v.split(",").map((x) => x.trim()) : d);
const READ_MODELS = list(process.env.GEMINI_MODEL, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
const TALK_MODELS = list(process.env.GEMINI_TALK_MODEL, ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]);
const TTS_MODELS = list(process.env.GEMINI_TTS_MODEL, ["gemini-3.8-flash-lite-tts", "gemini-3.1-flash-tts-preview", "gemini-3.8-flash-tts"]);

let client: GoogleGenAI | null = null;
function ai() {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

type GenArgs = Omit<Parameters<GoogleGenAI["models"]["generateContent"]>[0], "model">;

async function generate(models: string[], args: GenArgs) {
  let last: unknown;
  for (const model of models) {
    try {
      return await ai().models.generateContent({ ...args, model });
    } catch (e) {
      last = e;
      const msg = String((e as Error)?.message ?? e);
      // Overloaded, out of quota or retired: try the next model. Anything else is a real error.
      if (!/\b(429|500|503|404)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|NOT_FOUND|no longer available/i.test(msg)) throw e;
      console.warn(`gemini ${model} unavailable, trying next:`, msg.slice(0, 120));
    }
  }
  throw last;
}

export interface Extraction {
  isChit: boolean;
  products: ExtractedProduct[];
  problem: string | null; // pest or disease in plain English, if written or spoken
  cropSeen: string | null;
  dealer: string | null; // shop name if printed on the bill
}

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    isChit: { type: "boolean", description: "true if the image shows a pesticide prescription, shop bill, chit or pesticide pack/label" },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          written: { type: "string", description: "the product name and strength exactly as written on the image (brand plus strength and formulation such as 36 SL), transliterated to Latin script, WITHOUT the serial number or the dose" },
          brand: { type: ["string", "null"] },
          actives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "technical (common ISO) name in English, e.g. chlorpyrifos, lambda-cyhalothrin, imidacloprid" },
                percent: { type: ["number", "null"] },
              },
              required: ["name", "percent"],
            },
          },
          formulation: { type: ["string", "null"], description: "EC, SL, SC, WG, WP, SP, GR, CS, OD, ZC and so on" },
          dose: {
            type: ["object", "null"],
            properties: {
              amount: { type: ["number", "null"] },
              unit: { type: ["string", "null"], enum: ["ml", "g", "kg", "l", null] },
              per: { type: ["string", "null"], enum: ["litre", "pump", "acre", "hectare", "bigha", null] },
              pumpLitres: { type: ["number", "null"] },
            },
            required: ["amount", "unit", "per", "pumpLitres"],
          },
        },
        required: ["written", "brand", "actives", "formulation", "dose"],
      },
    },
    problem: { type: ["string", "null"], description: "pest or disease named on the chit or in the farmer's voice note, in English (e.g. thrips, fruit borer, blast)" },
    cropSeen: { type: ["string", "null"] },
    dealer: { type: ["string", "null"] },
  },
  required: ["isChit", "products", "problem", "cropSeen", "dealer"],
};

export async function extract(
  image: { data: string; mimeType: string },
  crop: string,
  audio?: { data: string; mimeType: string },
): Promise<Extraction> {
  const parts: object[] = [
    { inlineData: image },
    {
      text:
        `You are reading a pesticide dealer's handwritten chit (parchi), shop bill or a pesticide pack, from an Indian farmer growing ${crop}. ` +
        `It may be in Hindi, Marathi, Telugu, Kannada, Tamil, Gujarati, Punjabi, Bengali, Odia, Malayalam or English, often mixed, with local abbreviations. ` +
        `List every pesticide product. For each, give the technical active ingredient name in English. Dealers often write only the brand (Confidor, Coragen, Monocil, Karate, Ulala, Polo, Tracer...): ` +
        `in that case fill brand and give the active ingredient you know that brand contains. Read the strength (e.g. 17.8, 36, 5) and formulation (SL, EC...). ` +
        `Read the dose: amount, unit and what it is per (per litre of water, per pump/tank, per acre, per hectare, per bigha). "15 L pump" or "tanki" means per pump. ` +
        `Do not invent anything that is not written. Fertilisers and micronutrients are not pesticides: skip them.` +
        (audio ? ` The farmer also recorded a voice note describing the problem: use it to fill "problem".` : ""),
    },
  ];
  if (audio) parts.splice(1, 0, { inlineData: audio });

  const res = await generate(READ_MODELS, {
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json", responseJsonSchema: EXTRACT_SCHEMA, temperature: 0 },
  });
  return JSON.parse(res.text ?? "{}") as Extraction;
}

export interface Explanation {
  headline: string; // 3 to 6 words
  spoken: string; // what the phone says aloud
  products: { id: number; line: string }[];
  dealerCard: { local: string; english: string };
  whatToDo: string[];
}

const EXPLAIN_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    spoken: { type: "string" },
    products: {
      type: "array",
      items: { type: "object", properties: { id: { type: "integer" }, line: { type: "string" } }, required: ["id", "line"] },
    },
    dealerCard: {
      type: "object",
      properties: { local: { type: "string" }, english: { type: "string" } },
      required: ["local", "english"],
    },
    whatToDo: { type: "array", items: { type: "string" } },
  },
  required: ["headline", "spoken", "products", "dealerCard", "whatToDo"],
};

export async function explain(auditResult: Audit, languageName: string): Promise<Explanation> {
  const res = await generate(TALK_MODELS, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `A small farmer in India showed us the pesticide chit their dealer gave them. Our rule engine checked it against India's official CIB&RC records. ` +
              `Explain the result to the farmer in ${languageName}. The farmer may not read well, so write the way a kind, respected village elder talks: very short sentences, everyday words, ` +
              `no chemistry. Write every word in ${languageName} script except product names and strengths, which you copy exactly from the "written" field of the audit JSON. Never use a product name that is not in the JSON. Never mix in English words such as approved, banned, dose, spray or label: use the everyday ${languageName} word. Never add facts that are not in the audit JSON. Never say a product is safe or legal unless the audit has no flags for it.\n\n` +
              `Return:\n` +
              `- headline: 3 to 6 words in ${languageName}, the overall verdict.\n` +
              `- spoken: at most 4 short sentences in ${languageName} to be read aloud: the verdict, the most important danger, and exactly what to do next (including the safe harvest date if given).\n` +
              `- products: for each product id, one short line in ${languageName}: what is wrong, or that it matches the government record.\n` +
              `- dealerCard.local and dealerCard.english: a polite, firm note the farmer can show the dealer, in ${languageName} and in English. Name each flagged product and the reason, cite "CIB&RC, Government of India", ` +
              `and ask for an approved alternative. 2 to 4 sentences. No blame, no threats.\n` +
              `- whatToDo: 2 to 4 very short steps in ${languageName} (for example: return this bottle, ask for one of the listed alternatives, wear gloves and a mask, spray on the given date, do not pick for N days).\n\n` +
              `Audit JSON:\n${JSON.stringify(slim(auditResult))}`,
          },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseJsonSchema: EXPLAIN_SCHEMA, temperature: 0.3 },
  });
  return JSON.parse(res.text ?? "{}") as Explanation;
}

// Keep the prompt small: the model only needs verdicts and reasons, not source file names.
function slim(a: Audit) {
  return {
    crop: a.crop,
    problem: a.problem,
    overall: a.level,
    products: a.products.map((p) => ({
      id: p.id,
      written: p.written,
      actives: p.actives.map((x) => x.display),
      level: p.level,
      flags: p.flags.map((f) => f.detail),
      approvedFor: p.registeredPests.slice(0, 4),
      waitingDays: p.waitingDays,
    })),
    tankFlags: a.global.map((g) => g.detail),
    saferApprovedOptions: a.alternatives.map((x) => `${x.label} (for ${x.pest})`),
    // Spelled out so it is spoken naturally ("9 November"), not read as digits.
    safeToHarvestAfter: a.harvestAfter
      ? new Date(a.harvestAfter).toLocaleDateString("en-IN", { day: "numeric", month: "long" })
      : null,
    bestTimeToSpray: a.spray?.best?.start ?? null,
  };
}

// Gemini native text to speech. Returns a WAV file (base64) or null.
// Only the words to speak: current TTS models read any instruction aloud as part of the text.
// The language comes from the text itself.
export async function speak(text: string): Promise<string | null> {
  const res = await generate(TTS_MODELS, {
    contents: [{ role: "user", parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } },
    },
  });
  const part = res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) return null;
  const mime = part.inlineData.mimeType ?? "";
  // Newer TTS models return a finished WAV; older ones return raw 16-bit PCM that needs a header.
  if (/wav/i.test(mime)) return part.inlineData.data;
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
  return wav(pcm, rate).toString("base64");
}

function wav(pcm: Buffer, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
