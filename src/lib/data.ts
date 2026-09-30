import fs from "node:fs";
import path from "node:path";
import { CROP_GROUP } from "./crops";

// Official reference data, extracted from CIB&RC (Directorate of Plant Protection,
// Quarantine & Storage) and the WHO hazard classification. See data/SOURCES.md.

export interface RegisteredUse {
  active_ingredient: string;
  active_ingredients: string[];
  is_combination: boolean;
  formulation: string;
  product_label: string;
  pesticide_type: string;
  crop_group: string[];
  waiting_period_raw: string | null;
  application_note: string | null;
  crop: string;
  pest: string;
  dose_formulation_per_ha: string;
  dose_ai_g_per_ha: string;
  water_l_per_ha: string;
  waiting_period_days: number | null;
  source: string;
}

export interface ListEntry {
  active_ingredient: string;
  note?: string;
  restriction?: string;
  banned_on_crops?: string[];
  only_allowed_formulations?: string[];
  uncertain?: boolean;
}

interface BannedFile {
  banned: ListEntry[];
  refused?: ListEntry[];
  restricted: ListEntry[];
  withdrawn?: ListEntry[];
  source?: string;
  as_of?: string;
}

interface AliasEntry {
  brand: string;
  active_ingredient: string;
  formulation?: string;
  uncertain?: boolean;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z]/g, "");
}

// Common spellings seen on handwritten chits and labels.
const SPELLING: Record<string, string> = {
  chlorpyriphos: "chlorpyrifos",
  chloropyriphos: "chlorpyrifos",
  chloropyrifos: "chlorpyrifos",
  lamdacyhalothrin: "lambdacyhalothrin",
  lambdacyhalothrine: "lambdacyhalothrin",
  emamectin: "emamectinbenzoate",
  emamectinbenzoat: "emamectinbenzoate",
  cartap: "cartaphydrochloride",
  cartaphcl: "cartaphydrochloride",
  imidachloprid: "imidacloprid",
  imidaclopride: "imidacloprid",
  monocrotophas: "monocrotophos",
  profenophos: "profenofos",
  quinolphos: "quinalphos",
  mancozab: "mancozeb",
  copperoxychlorid: "copperoxychloride",
  neem: "azadirachtin",
  neemoil: "azadirachtin",
  bt: "bacillusthuringiensis",
  btk: "bacillusthuringiensis",
};

let cache: ReturnType<typeof build> | null = null;

function build() {
  const uses = readJson<RegisteredUse[]>("registered_uses.json", []);
  const banned = readJson<BannedFile>("banned_restricted.json", { banned: [], restricted: [] });
  const hazard = readJson<Record<string, { who_class: string | null; note?: string }>>("hazard_class.json", {});
  const aliases = readJson<{ aliases: AliasEntry[] }>("aliases.json", { aliases: [] });

  // Index every use under each of its actives, so a combination product like
  // "chlorantraniliprole + lambda-cyhalothrin" also counts as a registered use of each part.
  const byActive = new Map<string, RegisteredUse[]>();
  const displayName = new Map<string, string>();
  for (const u of uses) {
    const keys = new Set([norm(u.active_ingredient), ...u.active_ingredients.map(norm)]);
    for (const k of keys) {
      if (!byActive.has(k)) byActive.set(k, []);
      byActive.get(k)!.push(u);
    }
    for (const a of u.active_ingredients) if (!displayName.has(norm(a))) displayName.set(norm(a), a);
  }
  const hazardByKey = new Map<string, { who_class: string | null; note?: string }>();
  for (const [k, v] of Object.entries(hazard)) if (k !== "_meta") hazardByKey.set(norm(k), v);
  const aliasByKey = new Map<string, AliasEntry>();
  for (const a of aliases.aliases) aliasByKey.set(norm(a.brand), a);

  const listMap = (xs: ListEntry[] | undefined) => {
    const m = new Map<string, ListEntry>();
    for (const x of xs ?? []) m.set(norm(x.active_ingredient), x);
    return m;
  };

  return {
    uses,
    byActive,
    displayName,
    hazardByKey,
    aliasByKey,
    banned: listMap(banned.banned),
    refused: listMap(banned.refused),
    restricted: listMap(banned.restricted),
    withdrawn: listMap(banned.withdrawn),
    bannedSource: banned.source ?? "CIB&RC list of pesticides banned, refused registration and restricted in use",
    bannedAsOf: banned.as_of ?? "",
  };
}

export function db() {
  if (!cache) cache = build();
  return cache;
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// Map whatever Gemini read ("Chloropyriphos 20 EC", "Coragen") to a key in our data.
export function resolveActive(name: string): string | null {
  const d = db();
  let k = norm(name);
  if (!k) return null;
  k = SPELLING[k] ?? k;
  const alias = d.aliasByKey.get(k);
  if (alias) k = norm(alias.active_ingredient);
  const known = new Set<string>([
    ...d.byActive.keys(),
    ...d.banned.keys(),
    ...d.restricted.keys(),
    ...d.refused.keys(),
    ...d.withdrawn.keys(),
    ...d.hazardByKey.keys(),
  ]);
  if (known.has(k)) return k;
  for (const cand of known) if (cand.length > 5 && (k.startsWith(cand) || cand.startsWith(k))) return cand;
  let best: string | null = null;
  let bestD = 99;
  for (const cand of known) {
    const dist = editDistance(k, cand);
    if (dist < bestD) {
      bestD = dist;
      best = cand;
    }
  }
  return best && bestD <= Math.max(2, Math.floor(k.length / 6)) ? best : null;
}

export function pretty(key: string): string {
  const d = db();
  const n = d.displayName.get(key) ?? d.banned.get(key)?.active_ingredient ?? d.restricted.get(key)?.active_ingredient ?? key;
  return n.charAt(0).toUpperCase() + n.slice(1);
}

// Our crop ids map to the crop_group tags in registered_uses.json (see crops.ts).
const cropGroupOf = (crop: string): string | undefined => (CROP_GROUP as Record<string, string | undefined>)[crop];

export function hasCropData(crop: string): boolean {
  return cropGroupOf(crop) !== undefined;
}

export function usesFor(activeKey: string, crop: string): RegisteredUse[] {
  const g = cropGroupOf(crop);
  const all = db().byActive.get(activeKey) ?? [];
  if (!g) return all;
  return all.filter((u) => u.crop_group.includes(g));
}

export function usesForCrop(crop: string): RegisteredUse[] {
  const g = cropGroupOf(crop);
  if (!g) return [];
  return db().uses.filter((u) => u.crop_group.includes(g));
}

export function aliasFor(brand: string) {
  return db().aliasByKey.get(norm(brand)) ?? null;
}

// Mode of action groups (IRAC for insecticides, FRAC for fungicides). Two products from
// the same group in one tank add dose without adding control, and speed up resistance.
const GROUPS: Record<string, string[]> = {
  "Organophosphate (IRAC 1B)": ["acephate", "chlorpyrifos", "monocrotophos", "profenofos", "dimethoate", "quinalphos", "triazophos", "phorate", "malathion", "dichlorvos", "phosphamidon", "methylparathion", "phosalone", "ethion", "oxydemetonmethyl", "fenitrothion", "phenthoate"],
  "Carbamate (IRAC 1A)": ["carbofuran", "thiodicarb", "carbaryl", "methomyl", "carbosulfan", "fenobucarb"],
  "Pyrethroid (IRAC 3A)": ["cypermethrin", "lambdacyhalothrin", "deltamethrin", "fenvalerate", "fenpropathrin", "bifenthrin", "alphacypermethrin", "betacyfluthrin", "etofenprox", "permethrin"],
  "Neonicotinoid (IRAC 4A)": ["imidacloprid", "thiamethoxam", "acetamiprid", "clothianidin", "dinotefuran", "thiacloprid"],
  "Phenylpyrazole (IRAC 2B)": ["fipronil", "ethiprole"],
  "Diamide (IRAC 28)": ["chlorantraniliprole", "flubendiamide", "cyantraniliprole", "tetraniliprole", "broflanilide"],
  "Avermectin (IRAC 6)": ["emamectinbenzoate", "abamectin"],
  "Spinosyn (IRAC 5)": ["spinosad", "spinetoram"],
  "Benzoylurea (IRAC 15)": ["novaluron", "lufenuron", "diflubenzuron", "triflumuron"],
  "Tetronic acid (IRAC 23)": ["spiromesifen", "spirotetramat"],
  "Triazole (FRAC 3)": ["hexaconazole", "propiconazole", "tebuconazole", "difenoconazole", "flusilazole"],
  "Strobilurin (FRAC 11)": ["azoxystrobin", "kresoximmethyl", "pyraclostrobin", "trifloxystrobin"],
  "Benzimidazole (FRAC 1)": ["carbendazim", "thiophanatemethyl"],
};

export function groupOf(activeKey: string): string | null {
  for (const [g, members] of Object.entries(GROUPS)) if (members.includes(activeKey)) return g;
  return null;
}

const BIO = ["bacillusthuringiensis", "beauveriabassiana", "metarhiziumanisopliae", "azadirachtin", "trichodermaviride", "trichodermaharzianum", "pseudomonasfluorescens", "verticilliumlecanii", "lecanicilliumlecanii", "npv", "hanpv", "slnpv", "bacillussubtilis"];

export function isBio(activeKey: string): boolean {
  return BIO.some((b) => activeKey.startsWith(b)) || /bacillus|beauveria|metarhizium|trichoderma|pseudomonas|verticillium|lecanicillium|polyhedrosis|azadirachtin|neem/.test(activeKey);
}
