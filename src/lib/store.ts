import fs from "node:fs";
import path from "node:path";

// One anonymised record per audit. No name, phone number, photo or exact location:
// only the district and a location rounded to about 10 km.
export interface Report {
  id: string;
  ts: string;
  state: string | null;
  district: string | null;
  lat: number | null;
  lon: number | null;
  crop: string;
  level: "ok" | "careful" | "danger";
  flags: string[]; // flag codes
  actives: string[]; // active ingredients on the chit
  flagged: string[]; // active ingredients that got a flag
  seed: boolean; // true for the labelled demo seed, false for live audits
}

const PROJECT = process.env.FIREBASE_PROJECT_ID;
const KEY = process.env.FIREBASE_API_KEY;
const BASE = PROJECT
  ? `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`
  : null;

const memory: Report[] = [];

type FsValue =
  | { stringValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FsValue[] } };

function toFs(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs) } };
  return { stringValue: String(v) };
}

function fromFs(v: Record<string, unknown>): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("doubleValue" in v) return v.doubleValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("arrayValue" in v) return ((v.arrayValue as { values?: Record<string, unknown>[] }).values ?? []).map(fromFs);
  return null;
}

export async function saveReport(r: Report): Promise<void> {
  if (!BASE) {
    memory.push(r);
    return;
  }
  const fields = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, toFs(v)]));
  const res = await fetch(`${BASE}/audits?documentId=${r.id}&key=${KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fields }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    console.error("firestore save failed", res.status, await res.text());
    memory.push(r);
  }
}

async function liveReports(): Promise<Report[]> {
  if (!BASE) return memory;
  const out: Report[] = [];
  let token = "";
  for (let page = 0; page < 10; page++) {
    const res = await fetch(`${BASE}/audits?pageSize=300&key=${KEY}${token ? `&pageToken=${token}` : ""}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) break;
    const j = await res.json();
    for (const doc of j.documents ?? []) {
      const f = doc.fields ?? {};
      out.push(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromFs(v as Record<string, unknown>)])) as unknown as Report);
    }
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return [...out, ...memory];
}

let seedCache: Report[] | null = null;
function seedReports(): Report[] {
  if (!seedCache) {
    try {
      seedCache = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "seed_reports.json"), "utf8"));
    } catch {
      seedCache = [];
    }
  }
  return seedCache!;
}

export async function allReports(includeSeed = true): Promise<Report[]> {
  const live = await liveReports().catch(() => memory);
  return includeSeed ? [...live, ...seedReports()] : live;
}
