import kcc from "../../../../../data/kcc_layer.json";

// Real government signal: Kisan Call Centre calls, by district, that name a banned, crop-restricted
// or WHO Class Ia/Ib pesticide. Built offline by scripts/kcc_layer.py; see data/SOURCES.md.
export const dynamic = "force-static";

export function GET() {
  return Response.json(kcc, {
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
