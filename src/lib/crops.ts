// Crops Parchi knows in detail. Each one maps to a crop_group tag in data/registered_uses.json,
// which was tagged by matching the crop text printed in the CIB&RC "Major Uses of Pesticides"
// tables (spelling variants included: "Soyabean", "Bhindi (Okra)", "Pigeon pea", "Bengal gram").

import type { LangCode } from "./i18n";

export type CropId =
  | "paddy" | "cotton" | "chilli" | "tomato" | "brinjal"
  | "wheat" | "maize" | "soybean" | "groundnut" | "sugarcane"
  | "redgram" | "chickpea" | "blackgram" | "mustard" | "sorghum"
  | "potato" | "onion" | "okra" | "cabbage" | "cauliflower"
  | "grapes" | "mango"
  | "other";

// Order shown on the crop screen: the original five first, then the most widely grown,
// "other" always last.
export const CROP_LIST: CropId[] = [
  "paddy", "cotton", "chilli", "tomato", "brinjal",
  "wheat", "maize", "soybean", "groundnut", "sugarcane",
  "redgram", "chickpea", "blackgram", "mustard", "sorghum",
  "potato", "onion", "okra", "cabbage", "cauliflower",
  "grapes", "mango",
  "other",
];

// App crop id to the crop_group tag in registered_uses.json. "other" has no data.
export const CROP_GROUP: Record<Exclude<CropId, "other">, string> = {
  paddy: "rice",
  cotton: "cotton",
  chilli: "chilli",
  tomato: "tomato",
  brinjal: "brinjal",
  wheat: "wheat",
  maize: "maize",
  soybean: "soybean",
  groundnut: "groundnut",
  sugarcane: "sugarcane",
  redgram: "redgram",
  chickpea: "chickpea",
  blackgram: "blackgram",
  mustard: "mustard",
  sorghum: "sorghum",
  potato: "potato",
  onion: "onion",
  okra: "okra",
  cabbage: "cabbage",
  cauliflower: "cauliflower",
  grapes: "grapes",
  mango: "mango",
};

// Crops caught by restrictions worded "banned on vegetables" (monocrotophos).
export const VEG_CROPS: CropId[] = ["tomato", "brinjal", "chilli", "potato", "onion", "okra", "cabbage", "cauliflower"];

// Crops caught by "fruits and vegetables consumed raw" (dimethoate). Kept to crops that are
// commonly eaten raw in India: tomato, onion and cabbage in salads and kachumber, grapes and
// mango as fruit. Left out on purpose: brinjal, okra, potato and cauliflower are cooked before
// eating, and CIB&RC still lists dimethoate as approved on okra, potato and cauliflower, so
// flagging them would contradict the official approved-use list. Chilli is left out too,
// since it is mostly dried or cooked.
export const RAW_EATEN_CROPS: CropId[] = ["tomato", "onion", "cabbage", "grapes", "mango"];

// Crop words used in the restricted list (banned_restricted.json banned_on_crops) and on
// chits, mapped to our ids. Keys are lowercase.
export const CROP_ALIASES: Record<string, CropId> = {
  rice: "paddy",
  paddy: "paddy",
  cotton: "cotton",
  chilli: "chilli",
  chillies: "chilli",
  chili: "chilli",
  tomato: "tomato",
  brinjal: "brinjal",
  eggplant: "brinjal",
  wheat: "wheat",
  maize: "maize",
  corn: "maize",
  soybean: "soybean",
  soyabean: "soybean",
  groundnut: "groundnut",
  peanut: "groundnut",
  sugarcane: "sugarcane",
  "red gram": "redgram",
  redgram: "redgram",
  "pigeon pea": "redgram",
  pigeonpea: "redgram",
  arhar: "redgram",
  tur: "redgram",
  chickpea: "chickpea",
  "chick pea": "chickpea",
  "bengal gram": "chickpea",
  gram: "chickpea",
  "black gram": "blackgram",
  blackgram: "blackgram",
  urd: "blackgram",
  urad: "blackgram",
  mustard: "mustard",
  rapeseed: "mustard",
  "rapeseed & mustard": "mustard",
  sorghum: "sorghum",
  jowar: "sorghum",
  potato: "potato",
  onion: "onion",
  okra: "okra",
  bhindi: "okra",
  "lady's finger": "okra",
  cabbage: "cabbage",
  cauliflower: "cauliflower",
  grape: "grapes",
  grapes: "grapes",
  mango: "mango",
};

// Names farmers use for each crop, in every app language. The first six match i18n.ts.
export const CROP_NAMES: Record<LangCode, Record<CropId, string>> = {
  hi: {
    paddy: "धान", cotton: "कपास", chilli: "मिर्च", tomato: "टमाटर", brinjal: "बैंगन",
    wheat: "गेहूं", maize: "मक्का", soybean: "सोयाबीन", groundnut: "मूंगफली", sugarcane: "गन्ना",
    redgram: "अरहर (तुअर)", chickpea: "चना", blackgram: "उड़द", mustard: "सरसों", sorghum: "ज्वार",
    potato: "आलू", onion: "प्याज", okra: "भिंडी", cabbage: "पत्ता गोभी", cauliflower: "फूल गोभी",
    grapes: "अंगूर", mango: "आम", other: "अन्य",
  },
  mr: {
    paddy: "भात", cotton: "कापूस", chilli: "मिरची", tomato: "टोमॅटो", brinjal: "वांगी",
    wheat: "गहू", maize: "मका", soybean: "सोयाबीन", groundnut: "भुईमूग", sugarcane: "ऊस",
    redgram: "तूर", chickpea: "हरभरा", blackgram: "उडीद", mustard: "मोहरी", sorghum: "ज्वारी",
    potato: "बटाटा", onion: "कांदा", okra: "भेंडी", cabbage: "कोबी", cauliflower: "फुलकोबी",
    grapes: "द्राक्ष", mango: "आंबा", other: "इतर",
  },
  te: {
    paddy: "వరి", cotton: "పత్తి", chilli: "మిరప", tomato: "టమాటా", brinjal: "వంకాయ",
    wheat: "గోధుమ", maize: "మొక్కజొన్న", soybean: "సోయాబీన్", groundnut: "వేరుశనగ", sugarcane: "చెరకు",
    redgram: "కంది", chickpea: "శనగ", blackgram: "మినుము", mustard: "ఆవాలు", sorghum: "జొన్న",
    potato: "బంగాళదుంప", onion: "ఉల్లి", okra: "బెండ", cabbage: "క్యాబేజీ", cauliflower: "కాలీఫ్లవర్",
    grapes: "ద్రాక్ష", mango: "మామిడి", other: "ఇతర",
  },
  kn: {
    paddy: "ಭತ್ತ", cotton: "ಹತ್ತಿ", chilli: "ಮೆಣಸಿನಕಾಯಿ", tomato: "ಟೊಮೆಟೊ", brinjal: "ಬದನೆ",
    wheat: "ಗೋಧಿ", maize: "ಮೆಕ್ಕೆಜೋಳ", soybean: "ಸೋಯಾಬೀನ್", groundnut: "ಶೇಂಗಾ", sugarcane: "ಕಬ್ಬು",
    redgram: "ತೊಗರಿ", chickpea: "ಕಡಲೆ", blackgram: "ಉದ್ದು", mustard: "ಸಾಸಿವೆ", sorghum: "ಜೋಳ",
    potato: "ಆಲೂಗಡ್ಡೆ", onion: "ಈರುಳ್ಳಿ", okra: "ಬೆಂಡೆ", cabbage: "ಎಲೆಕೋಸು", cauliflower: "ಹೂಕೋಸು",
    grapes: "ದ್ರಾಕ್ಷಿ", mango: "ಮಾವು", other: "ಇತರೆ",
  },
  ta: {
    paddy: "நெல்", cotton: "பருத்தி", chilli: "மிளகாய்", tomato: "தக்காளி", brinjal: "கத்தரி",
    wheat: "கோதுமை", maize: "மக்காச்சோளம்", soybean: "சோயா", groundnut: "நிலக்கடலை", sugarcane: "கரும்பு",
    redgram: "துவரை", chickpea: "கொண்டைக்கடலை", blackgram: "உளுந்து", mustard: "கடுகு", sorghum: "சோளம்",
    potato: "உருளைக்கிழங்கு", onion: "வெங்காயம்", okra: "வெண்டை", cabbage: "முட்டைக்கோஸ்", cauliflower: "காலிஃபிளவர்",
    grapes: "திராட்சை", mango: "மாம்பழம்", other: "மற்றவை",
  },
  gu: {
    paddy: "ડાંગર", cotton: "કપાસ", chilli: "મરચું", tomato: "ટામેટા", brinjal: "રીંગણ",
    wheat: "ઘઉં", maize: "મકાઈ", soybean: "સોયાબીન", groundnut: "મગફળી", sugarcane: "શેરડી",
    redgram: "તુવેર", chickpea: "ચણા", blackgram: "અડદ", mustard: "રાઈ", sorghum: "જુવાર",
    potato: "બટાટા", onion: "ડુંગળી", okra: "ભીંડા", cabbage: "કોબીજ", cauliflower: "ફૂલાવર",
    grapes: "દ્રાક્ષ", mango: "કેરી", other: "અન્ય",
  },
  pa: {
    paddy: "ਝੋਨਾ", cotton: "ਕਪਾਹ", chilli: "ਮਿਰਚ", tomato: "ਟਮਾਟਰ", brinjal: "ਬੈਂਗਣ",
    wheat: "ਕਣਕ", maize: "ਮੱਕੀ", soybean: "ਸੋਇਆਬੀਨ", groundnut: "ਮੂੰਗਫਲੀ", sugarcane: "ਗੰਨਾ",
    redgram: "ਅਰਹਰ", chickpea: "ਛੋਲੇ", blackgram: "ਮਾਂਹ", mustard: "ਸਰ੍ਹੋਂ", sorghum: "ਜਵਾਰ",
    potato: "ਆਲੂ", onion: "ਪਿਆਜ਼", okra: "ਭਿੰਡੀ", cabbage: "ਬੰਦ ਗੋਭੀ", cauliflower: "ਫੁੱਲ ਗੋਭੀ",
    grapes: "ਅੰਗੂਰ", mango: "ਅੰਬ", other: "ਹੋਰ",
  },
  bn: {
    paddy: "ধান", cotton: "তুলা", chilli: "লঙ্কা", tomato: "টমেটো", brinjal: "বেগুন",
    wheat: "গম", maize: "ভুট্টা", soybean: "সয়াবিন", groundnut: "চিনাবাদাম", sugarcane: "আখ",
    redgram: "অড়হর", chickpea: "ছোলা", blackgram: "মাষকলাই", mustard: "সরষে", sorghum: "জোয়ার",
    potato: "আলু", onion: "পেঁয়াজ", okra: "ঢেঁড়স", cabbage: "বাঁধাকপি", cauliflower: "ফুলকপি",
    grapes: "আঙুর", mango: "আম", other: "অন্যান্য",
  },
  or: {
    paddy: "ଧାନ", cotton: "କପା", chilli: "ଲଙ୍କା", tomato: "ଟମାଟୋ", brinjal: "ବାଇଗଣ",
    wheat: "ଗହମ", maize: "ମକା", soybean: "ସୋୟାବିନ", groundnut: "ଚିନାବାଦାମ", sugarcane: "ଆଖୁ",
    redgram: "ହରଡ଼", chickpea: "ବୁଟ", blackgram: "ବିରି", mustard: "ସୋରିଷ", sorghum: "ଜୁଆର",
    potato: "ଆଳୁ", onion: "ପିଆଜ", okra: "ଭେଣ୍ଡି", cabbage: "ବନ୍ଧାକୋବି", cauliflower: "ଫୁଲକୋବି",
    grapes: "ଅଙ୍ଗୁର", mango: "ଆମ୍ବ", other: "ଅନ୍ୟ",
  },
  ml: {
    paddy: "നെല്ല്", cotton: "പരുത്തി", chilli: "മുളക്", tomato: "തക്കാളി", brinjal: "വഴുതന",
    wheat: "ഗോതമ്പ്", maize: "ചോളം", soybean: "സോയാബീൻ", groundnut: "നിലക്കടല", sugarcane: "കരിമ്പ്",
    redgram: "തുവര", chickpea: "കടല", blackgram: "ഉഴുന്ന്", mustard: "കടുക്", sorghum: "മണിച്ചോളം",
    potato: "ഉരുളക്കിഴങ്ങ്", onion: "ഉള്ളി", okra: "വെണ്ട", cabbage: "കാബേജ്", cauliflower: "കോളിഫ്ലവർ",
    grapes: "മുന്തിരി", mango: "മാവ്", other: "മറ്റുള്ളവ",
  },
  en: {
    paddy: "Paddy", cotton: "Cotton", chilli: "Chilli", tomato: "Tomato", brinjal: "Brinjal",
    wheat: "Wheat", maize: "Maize", soybean: "Soybean", groundnut: "Groundnut", sugarcane: "Sugarcane",
    redgram: "Red gram (tur)", chickpea: "Chickpea (chana)", blackgram: "Black gram (urad)", mustard: "Mustard", sorghum: "Sorghum (jowar)",
    potato: "Potato", onion: "Onion", okra: "Okra (bhindi)", cabbage: "Cabbage", cauliflower: "Cauliflower",
    grapes: "Grapes", mango: "Mango", other: "Other",
  },
};

export function isCropId(x: string): x is CropId {
  return (CROP_LIST as string[]).includes(x);
}
