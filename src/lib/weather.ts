// 48-hour spray window from Open-Meteo (free, no key). Spraying before rain washes the
// product off and the farmer sprays again; spraying in wind drifts it onto people and water.

export interface SprayWindow {
  rainSoon: boolean; // meaningful rain in the next 12 hours
  windyNow: boolean;
  hotNow: boolean;
  best: { start: string; end: string } | null; // local ISO times (Asia/Kolkata)
  hours: { time: string; rainProb: number; rainMm: number; windKmh: number; tempC: number }[];
}

const RAIN_PROB = 50;
const RAIN_MM = 1;
const WIND_MAX = 15; // km/h, common label advice is to avoid spraying above 10–15 km/h
const HOT = 35;

export async function sprayWindow(lat: number, lon: number): Promise<SprayWindow | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=precipitation_probability,precipitation,wind_speed_10m,temperature_2m` +
    `&forecast_hours=48&timezone=Asia%2FKolkata`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const j = await res.json();
    const h = j.hourly;
    const hours = (h.time as string[]).map((t, i) => ({
      time: t,
      rainProb: h.precipitation_probability[i] ?? 0,
      rainMm: h.precipitation[i] ?? 0,
      windKmh: h.wind_speed_10m[i] ?? 0,
      tempC: h.temperature_2m[i] ?? 0,
    }));
    const wet = (x: (typeof hours)[number]) => x.rainProb >= RAIN_PROB || x.rainMm >= RAIN_MM;
    const rainSoon = hours.slice(0, 12).some(wet);
    const windyNow = (hours[0]?.windKmh ?? 0) > WIND_MAX;
    const hotNow = (hours[0]?.tempC ?? 0) > HOT;

    // A good hour: morning (6–10) or evening (16–18), calm, not hot, and dry for the next 6 hours.
    let best: SprayWindow["best"] = null;
    for (let i = 0; i < hours.length - 6; i++) {
      const hr = Number(hours[i].time.slice(11, 13));
      const goodHour = (hr >= 6 && hr <= 9) || (hr >= 16 && hr <= 17);
      if (!goodHour) continue;
      const x = hours[i];
      if (x.windKmh > WIND_MAX || x.tempC > HOT) continue;
      if (hours.slice(i, i + 6).some(wet)) continue;
      best = { start: x.time, end: hours[i + 2].time };
      break;
    }
    return { rainSoon, windyNow, hotNow, best, hours };
  } catch {
    return null;
  }
}
