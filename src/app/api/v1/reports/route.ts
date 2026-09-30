import { allReports } from "@/lib/store";

// Open data feed for states and partner platforms. Anonymised by design: every row is a real
// check made in the app.
// Query: ?state=Andhra%20Pradesh&crop=chilli
export async function GET(req: Request) {
  const u = new URL(req.url);
  const state = u.searchParams.get("state");
  const crop = u.searchParams.get("crop");
  let rows = await allReports();
  if (state) rows = rows.filter((r) => r.state?.toLowerCase() === state.toLowerCase());
  if (crop) rows = rows.filter((r) => r.crop === crop);
  return Response.json(
    {
      license: "CC BY 4.0",
      schema: "https://github.com/tahcin/parchi#for-states",
      count: rows.length,
      reports: rows,
    },
    { headers: { "access-control-allow-origin": "*" } },
  );
}
