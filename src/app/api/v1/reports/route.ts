import { allReports } from "@/lib/store";

// Open data feed for states and partner platforms. Anonymised by design.
// Query: ?state=Andhra%20Pradesh&crop=chilli&live=1 (live=1 leaves out the demo seed)
export async function GET(req: Request) {
  const u = new URL(req.url);
  const state = u.searchParams.get("state");
  const crop = u.searchParams.get("crop");
  const liveOnly = u.searchParams.get("live") === "1";
  let rows = await allReports(!liveOnly);
  if (state) rows = rows.filter((r) => r.state?.toLowerCase() === state.toLowerCase());
  if (crop) rows = rows.filter((r) => r.crop === crop);
  return Response.json(
    {
      license: "CC BY 4.0",
      schema: "https://github.com/tahcin/parchi#for-states",
      note: "Rows with seed=true are a labelled synthetic demo seed, not real reports.",
      count: rows.length,
      reports: rows,
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
