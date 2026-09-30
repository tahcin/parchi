// "Your field": soil from ISRIC SoilGrids (250 m soil map) and the last week of rain and soil
// wetness from NASA POWER (satellite and model data). Both are free and need no key. The card is
// shown next to the verdict, so it must never slow the audit down or break it: every lookup has a
// timeout and returns null on failure.

export type Texture = "sandy" | "loamy" | "clayey";
export type FieldTip = "addCarbon" | "keepCarbon" | "sandy" | "wet";

export interface FieldData {
  soil: { ph: number | null; carbon: number | null; sand: number | null; clay: number | null; texture: Texture | null } | null;
  sat: { rain7: number; wet: number | null; asOf: string } | null;
  tips: FieldTip[];
}

// Organic carbon in % (g/kg ÷ 10). Soil Health Card bands: below 0.5 low, 0.5–0.75 medium, above high.
const CARBON_GOOD = 0.75;
const SANDY = 60; // % sand in the top 30 cm
const CLAYEY = 40; // % clay
const WET_RAIN = 40; // mm in the last 7 days
const WET_SOIL = 0.8; // NASA POWER surface soil wetness, 0 (dry) to 1 (saturated)

async function soil(lat: number, lon: number): Promise<FieldData["soil"]> {
  const url =
    `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}` +
    `&property=phh2o&property=soc&property=clay&property=sand&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const j = await res.json();
    // Thickness-weighted mean over the plough layer (0–30 cm), in the layer's target units.
    const get = (name: string) => {
      const layer = (j.properties?.layers ?? []).find((l: { name: string }) => l.name === name);
      if (!layer) return null;
      const d = layer.unit_measure?.d_factor || 1;
      let sum = 0;
      let w = 0;
      for (const x of layer.depths ?? []) {
        const v = x.values?.mean;
        if (typeof v !== "number") continue;
        const t = x.range.bottom_depth - x.range.top_depth;
        sum += (v / d) * t;
        w += t;
      }
      return w ? sum / w : null;
    };
    const ph = get("phh2o");
    const soc = get("soc"); // g/kg
    const sand = get("sand"); // %
    const clay = get("clay"); // %
    if (ph == null && soc == null && sand == null) return null; // masked (towns, water) or no data
    const texture: Texture | null = sand == null || clay == null ? null : sand >= SANDY ? "sandy" : clay >= CLAYEY ? "clayey" : "loamy";
    return {
      ph: ph == null ? null : Math.round(ph * 10) / 10,
      carbon: soc == null ? null : Math.round(soc * 10) / 100, // g/kg to %, two decimals
      sand: sand == null ? null : Math.round(sand),
      clay: clay == null ? null : Math.round(clay),
      texture,
    };
  } catch {
    return null;
  }
}

async function sat(lat: number, lon: number): Promise<FieldData["sat"]> {
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const end = new Date(Date.now() - 86400000);
  const start = new Date(end.getTime() - 13 * 86400000);
  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR,GWETTOP&community=AG` +
    `&longitude=${lon}&latitude=${lat}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = await res.json();
    const p = j.properties?.parameter ?? {};
    // The newest two or three days are still being processed and come back as -999.
    const days = Object.keys(p.PRECTOTCORR ?? {})
      .filter((k) => p.PRECTOTCORR[k] > -900)
      .sort();
    if (!days.length) return null;
    const last7 = days.slice(-7);
    const rain7 = last7.reduce((a, k) => a + p.PRECTOTCORR[k], 0);
    const lastDay = days[days.length - 1];
    const wet = p.GWETTOP?.[lastDay] > -900 ? p.GWETTOP[lastDay] : null;
    return {
      rain7: Math.round(rain7),
      wet: wet == null ? null : Math.round(wet * 100) / 100,
      asOf: `${lastDay.slice(0, 4)}-${lastDay.slice(4, 6)}-${lastDay.slice(6, 8)}`,
    };
  } catch {
    return null;
  }
}

export async function field(lat: number, lon: number): Promise<FieldData> {
  const [s, w] = await Promise.all([soil(lat, lon), sat(lat, lon)]);
  const tips: FieldTip[] = [];
  if (w && (w.rain7 >= WET_RAIN || (w.wet ?? 0) >= WET_SOIL)) tips.push("wet");
  if (s?.texture === "sandy") tips.push("sandy");
  if (s?.carbon != null) tips.push(s.carbon >= CARBON_GOOD ? "keepCarbon" : "addCarbon");
  return { soil: s, sat: w, tips };
}
