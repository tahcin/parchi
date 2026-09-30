// Development-only fixture so the result, dealer, checking and error screens can be reviewed
// without a Gemini key: open /?mock=result (or dealer, details, checking, error).
// page.tsx only reads it when NODE_ENV is not "production".

import type { Audit } from "@/lib/rules";
import type { Explanation, Extraction } from "@/lib/gemini";

export type MockStep = "result" | "dealer" | "details" | "checking" | "error";

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const tomorrowAt = (h: number) => {
  const t = new Date(Date.now() + 86400000);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

const CIB = "CIB&RC Major Uses of Pesticides (31.03.2026)";
const BAN = "CIB&RC List of pesticides banned, refused registration and restricted in use (31.07.2026)";

export function mockResult(): { extraction: Extraction; audit: Audit; words: Explanation } {
  const audit: Audit = {
    crop: "chilli",
    problem: "thrips",
    level: "danger",
    products: [
      {
        id: 0,
        written: "Monocil 36 SL",
        brand: "Monocil",
        actives: [{ name: "monocrotophos", key: "monocrotophos", display: "Monocrotophos", percent: 36, whoClass: "Ib" }],
        level: "danger",
        flags: [
          { code: "RESTRICTED_CROP", level: "danger", detail: "Monocrotophos is banned for use on this crop. Not to be used on vegetables.", source: BAN },
          { code: "FORMULATION_STOPPED", level: "danger", detail: "Monocrotophos 36% SL registrations were cancelled after S.O. 4294(E) of 03.10.2023. Any stock sold now is old stock.", source: BAN },
          { code: "HAZARD_IB", level: "careful", detail: "Monocrotophos is WHO Class Ib, highly hazardous. Use full protection: gloves, mask, long sleeves. Keep away from children and water.", source: "WHO Recommended Classification of Pesticides by Hazard, 2019" },
        ],
        registeredPests: [],
        approvedDose: null,
        waitingDays: null,
        sources: [],
      },
      {
        id: 1,
        written: "Confidor 17.8 SL",
        brand: "Confidor",
        actives: [{ name: "imidacloprid", key: "imidacloprid", display: "Imidacloprid", percent: 17.8, whoClass: "II" }],
        level: "careful",
        flags: [
          { code: "OVERDOSE", level: "careful", detail: "The dose on the chit is about 2.5 times the highest approved dose of Imidacloprid for this crop (about 111 g of active ingredient per ha, against 44.5 g approved).", source: CIB },
        ],
        registeredPests: ["Aphids", "Jassids", "Thrips"],
        approvedDose: "250 (g or ml) per ha of Imidacloprid 17.8% SL, in 500 L water",
        waitingDays: 40,
        sources: [CIB],
      },
      {
        id: 2,
        written: "Karate 5 EC",
        brand: "Karate",
        actives: [{ name: "lambda-cyhalothrin", key: "lambda-cyhalothrin", display: "Lambda-cyhalothrin", percent: 5, whoClass: "II" }],
        level: "ok",
        flags: [],
        registeredPests: ["Thrips", "Fruit borer", "Mites"],
        approvedDose: "300 (g or ml) per ha of Lambda-cyhalothrin 5% EC, in 400-600 L water",
        waitingDays: 5,
        sources: [CIB],
      },
      {
        id: 3,
        written: "Cypermethrin 10 EC",
        brand: null,
        actives: [{ name: "cypermethrin", key: "cypermethrin", display: "Cypermethrin", percent: 10, whoClass: "II" }],
        level: "careful",
        flags: [
          { code: "NOT_FOR_CROP", level: "careful", detail: "Cypermethrin is not approved for this crop in the CIB&RC list of approved uses. Using a pesticide on a crop it is not approved for is not allowed under the Insecticides Act, 1968.", source: CIB },
        ],
        registeredPests: [],
        approvedDose: null,
        waitingDays: null,
        sources: [],
      },
    ],
    global: [{ code: "COCKTAIL", level: "careful", detail: "4 products in one tank. Tank mixes that are not on the label are not tested for safety or effect." }],
    alternatives: [
      { label: "Beauveria bassiana 1.15% WP", pest: "Thrips", dose: "2500 g per ha in 500 L water", waitingDays: null, bio: true, source: CIB },
      { label: "Azadirachtin 1% EC (10000 ppm)", pest: "Thrips, Mites", dose: "1000-1500 ml per ha in 500 L water", waitingDays: null, bio: true, source: CIB },
      { label: "Spinosad 45% SC", pest: "Thrips", dose: "160 ml per ha in 500 L water", waitingDays: 3, bio: false, source: CIB },
    ],
    waterAssumed: true,
    pumpsPerAcre: null,
    harvestAfter: inDays(40),
    spray: { rainSoon: false, windyNow: false, hotNow: false, best: { start: tomorrowAt(6), end: tomorrowAt(9) }, hours: [] },
    dataAsOf: "CIB&RC approved uses 31.03.2026; banned and restricted list 2026-07-31",
  };

  const words: Explanation = {
    headline: "मोनोसिल बिल्कुल न छिड़कें",
    spoken:
      "रुकिए। मोनोसिल 36 एसएल सब्ज़ियों पर प्रतिबंधित है, इसे न छिड़कें। कॉन्फिडोर की मात्रा ढाई गुना ज़्यादा लिखी है। साइपरमेथ्रिन मिर्च के लिए मंज़ूर नहीं है। कराटे ठीक है।",
    products: [
      { id: 0, line: "सब्ज़ियों पर प्रतिबंधित और बहुत ज़हरीली। वापस करें।" },
      { id: 1, line: "मात्रा सरकारी सीमा से ढाई गुना ज़्यादा है। लेबल जितनी ही डालें।" },
      { id: 2, line: "मिर्च पर मंज़ूर है। लेबल वाली मात्रा ही डालें।" },
      { id: 3, line: "मिर्च के लिए मंज़ूर नहीं है। दूसरी दवा माँगें।" },
    ],
    dealerCard: {
      local:
        "कृपया मोनोसिल 36 एसएल और साइपरमेथ्रिन 10 ईसी की जगह मिर्च के लिए सरकार से मंज़ूर दवा दें, और कॉन्फिडोर की मात्रा लेबल के अनुसार लिखें।",
      english:
        "Please replace Monocil 36 SL (monocrotophos, banned on vegetables) and Cypermethrin 10 EC (not approved on chilli) with a product approved for chilli by CIB&RC, and write the Confidor dose as per the label.",
    },
    whatToDo: [
      "मोनोसिल दुकान पर वापस करें। इसे न छिड़कें।",
      "कॉन्फिडोर लेबल पर लिखी मात्रा में ही डालें।",
      "छिड़काव के समय दस्ताने और मास्क पहनें।",
    ],
  };

  const extraction: Extraction = { isChit: true, products: [], problem: "thrips", cropSeen: "chilli", dealer: "Sri Lakshmi Agro Agencies" };
  return { extraction, audit, words };
}
