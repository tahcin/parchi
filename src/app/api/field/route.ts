import { field } from "@/lib/field";

export const maxDuration = 30;

// Soil and satellite data change slowly, so keep answers per server instance and let the CDN
// cache them too. Coordinates arrive rounded to about 1 km, which also keeps them anonymous.
const cache = new Map<string, Awaited<ReturnType<typeof field>>>();

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lon = Number(q.get("lon"));
  // India's bounding box, roughly.
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 6 || lat > 38 || lon < 68 || lon > 98) {
    return Response.json({ error: "bad_location" }, { status: 400 });
  }
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  let data = cache.get(key);
  if (!data) {
    data = await field(Number(lat.toFixed(2)), Number(lon.toFixed(2)));
    // Don't keep an empty answer: the services may just have been slow this time.
    if (data.soil || data.sat) {
      if (cache.size > 500) cache.delete(cache.keys().next().value!);
      cache.set(key, data);
    }
  }
  const cacheable = data.soil && data.sat;
  return Response.json(data, {
    headers: { "cache-control": cacheable ? "public, s-maxage=43200, stale-while-revalidate=86400" : "no-store" },
  });
}
