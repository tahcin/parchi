"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Report } from "@/lib/store";
import type { Spot } from "@/components/HotspotMap";
import { Logo } from "@/components/Logo";
import { AlertIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon } from "@/components/icons";

const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="h-[420px] rounded-2xl border-2 border-ink bg-paper-2" />,
});

const FLAG_LABEL: Record<string, string> = {
  BANNED: "Banned in India",
  RESTRICTED_CROP: "Banned on this crop",
  FORMULATION_STOPPED: "Formulation stopped",
  NOT_FOR_CROP: "Not approved for crop",
  NOT_FOR_PEST: "Not approved for pest",
  OVERDOSE: "Above approved dose",
  HAZARD_IA: "WHO Ia",
  HAZARD_IB: "WHO Ib",
  SAME_GROUP: "Same-group tank mix",
  DUPLICATE: "Duplicate active",
  COCKTAIL: "3+ product cocktail",
  UNKNOWN: "Unidentified product",
  RAIN: "Rain forecast",
  WIND: "Windy",
  HEAT: "Heat",
};

const ILLEGAL = ["BANNED", "RESTRICTED_CROP", "FORMULATION_STOPPED"];
const WEATHER = ["RAIN", "WIND", "HEAT"];

type Layer = "live" | "kcc" | "seed";

const LAYERS: { id: Layer; label: string }[] = [
  { id: "live", label: "Live audits" },
  { id: "kcc", label: "KCC calls (real, gov data)" },
  { id: "seed", label: "Demo seed" },
];

// Shape of data/kcc_layer.json (built by scripts/kcc_layer.py, served at /api/v1/kcc).
interface KccDistrict {
  state: string;
  district: string;
  lat: number | null;
  lon: number | null;
  approx_location?: boolean;
  calls_scanned: number;
  pest_calls: number;
  flagged_mentions: number;
  by_active: Record<string, number>;
  answer_mentions: number;
  answer_by_active: Record<string, number>;
  calls_with_flagged: number;
}

interface KccActive {
  category: string;
  who_class: string | null;
  ban_date: string | null;
  question_calls: number;
  answer_calls: number;
  answer_calls_after_ban: number | null;
}

interface KccLayer {
  source: { official: string; retrieved_from: string; note: string };
  fetched_on: string;
  period: { from: string; to: string; months_present: string[] };
  records_scanned: number;
  plant_protection_calls: number;
  states: number;
  actives: Record<string, KccActive>;
  districts: KccDistrict[];
}

type KccView = {
  calls: number;
  pest: number;
  flagged: number;
  districts: number;
  spots: Spot[];
  question: [string, number][];
  answer: [string, number][];
  afterBan: [string, KccActive][];
};

const KCC_CATEGORY: Record<string, string> = { banned: "banned", restricted: "restricted", who_ia: "WHO Ia", who_ib: "WHO Ib" };

function kccTag(a: string, info?: KccActive) {
  if (!info) return a;
  const bits = [KCC_CATEGORY[info.category] ?? info.category];
  if (info.who_class && info.category !== `who_${info.who_class.toLowerCase()}`) bits.push(`WHO ${info.who_class}`);
  return `${a} (${bits.join(", ")})`;
}

function count<T>(xs: T[]): [T, number][] {
  const m = new Map<T, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function sumInto(m: Map<string, number>, rec: Record<string, number>) {
  for (const [k, n] of Object.entries(rec)) m.set(k, (m.get(k) ?? 0) + n);
}

function sorted(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export default function Inspector() {
  const [rows, setRows] = useState<Report[]>([]);
  // null until we know whether the KCC layer has data; it is the default layer when it does.
  const [layer, setLayer] = useState<Layer | null>(null);
  const [kcc, setKcc] = useState<KccLayer | null>(null);
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  // Fixed when the page opens, so the 14-day window does not shift between renders.
  const [now] = useState(() => Date.now());
  const showSeed = layer === "seed";
  const isKcc = layer === "kcc" && kcc !== null;

  function pickLayer(l: Layer) {
    if (l === layer) return;
    if (l !== "kcc") setLoading(true);
    setLayer(l);
  }

  useEffect(() => {
    fetch("/api/v1/kcc")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((j: KccLayer | null) => {
        const ok = !!j?.districts?.length;
        setKcc(ok ? j : null);
        setLayer((l) => l ?? (ok ? "kcc" : "seed"));
      });
  }, []);

  useEffect(() => {
    if (layer === null || layer === "kcc") return;
    fetch(`/api/v1/reports${showSeed ? "" : "?live=1"}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setRows(j.reports ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [layer, showSeed]);

  const states = useMemo(
    () =>
      isKcc
        ? [...new Set(kcc!.districts.map((d) => d.state))].sort()
        : [...new Set(rows.map((r) => r.state).filter(Boolean) as string[])].sort(),
    [rows, isKcc, kcc],
  );
  // A state picked on one layer may not exist on another; fall back to all states there.
  const shownState = states.includes(state) ? state : "";
  const view = useMemo(() => (shownState ? rows.filter((r) => r.state === shownState) : rows), [rows, shownState]);
  const live = rows.filter((r) => !r.seed).length;

  const stats = useMemo(() => {
    const flaggedChits = view.filter((r) => r.flags.some((f) => !WEATHER.includes(f))).length;
    const illegal = view.filter((r) => r.flags.some((f) => ILLEGAL.includes(f))).length;
    const byDistrict = new Map<string, Report[]>();
    for (const r of view) {
      const k = `${r.district ?? "Unknown"}|${r.state ?? ""}`;
      if (!byDistrict.has(k)) byDistrict.set(k, []);
      byDistrict.get(k)!.push(r);
    }
    const spots: Spot[] = [];
    for (const [k, rs] of byDistrict) {
      const withLoc = rs.filter((r) => r.lat != null && r.lon != null);
      if (!withLoc.length) continue;
      spots.push({
        key: k,
        label: k.replace("|", ", "),
        lat: withLoc.reduce((a, r) => a + r.lat!, 0) / withLoc.length,
        lon: withLoc.reduce((a, r) => a + r.lon!, 0) / withLoc.length,
        total: rs.length,
        danger: rs.filter((r) => r.flags.some((f) => ILLEGAL.includes(f))).length,
        top: count(rs.flatMap((r) => r.flagged))[0]?.[0] ?? null,
      });
    }
    const topProducts = count(view.flatMap((r) => r.flagged)).slice(0, 8);
    const topFlags = count(view.flatMap((r) => r.flags)).slice(0, 8);
    // Cross-state early warning: a flagged active seen in more than one state in the last 14 days.
    const since = now - 14 * 86400000;
    const statesByActive = new Map<string, Set<string>>();
    for (const r of rows) {
      if (Date.parse(r.ts) < since) continue;
      for (const a of r.flagged) {
        if (!statesByActive.has(a)) statesByActive.set(a, new Set());
        if (r.state) statesByActive.get(a)!.add(r.state);
      }
    }
    const warnings = [...statesByActive.entries()]
      .filter(([, s]) => s.size >= 2)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 6);
    return { flaggedChits, illegal, spots, topProducts, topFlags, warnings };
  }, [view, rows, now]);

  const kccView = useMemo<KccView | null>(() => {
    if (!kcc) return null;
    const inKcc = kcc.districts.some((d) => d.state === state);
    const ds = inKcc ? kcc.districts.filter((d) => d.state === state) : kcc.districts;
    const q = new Map<string, number>();
    const a = new Map<string, number>();
    for (const d of ds) {
      sumInto(q, d.by_active);
      sumInto(a, d.answer_by_active);
    }
    const spots: Spot[] = ds
      .filter((d) => d.lat != null && d.lon != null && d.calls_with_flagged > 0)
      .map((d) => {
        const share = d.pest_calls ? d.calls_with_flagged / d.pest_calls : 0;
        const both = new Map<string, number>();
        sumInto(both, d.by_active);
        sumInto(both, d.answer_by_active);
        const top = sorted(both)[0]?.[0] ?? null;
        return {
          key: `${d.district}|${d.state}`,
          label: `${d.district}, ${d.state}${d.approx_location ? " (approx. location)" : ""}`,
          lat: d.lat!,
          lon: d.lon!,
          total: d.pest_calls,
          danger: d.calls_with_flagged,
          top,
          radius: 5 + Math.sqrt(d.calls_with_flagged) * 4,
          fill: share >= 0.05 ? "#c8302b" : share >= 0.02 ? "#c98a0c" : "#e0b04a",
          tip: [
            `${d.pest_calls} plant-protection calls, ${d.calls_with_flagged} naming a flagged pesticide (${(share * 100).toFixed(1)}%)`,
            `In the farmer's question: ${d.flagged_mentions}. In the KCC answer: ${d.answer_mentions}`,
            ...(top ? [`Most named: ${top}`] : []),
          ],
        };
      });
    return {
      // The district list leaves out districts with no plant-protection call, so use the file total when unfiltered.
      calls: inKcc ? ds.reduce((n, d) => n + d.calls_scanned, 0) : kcc.records_scanned,
      pest: ds.reduce((n, d) => n + d.pest_calls, 0),
      flagged: ds.reduce((n, d) => n + d.calls_with_flagged, 0),
      districts: ds.filter((d) => d.calls_with_flagged > 0).length,
      spots,
      question: sorted(q).slice(0, 8),
      answer: sorted(a).slice(0, 8),
      afterBan: Object.entries(kcc.actives)
        .filter(([, v]) => (v.answer_calls_after_ban ?? 0) > 0)
        .sort((x, y) => (y[1].answer_calls_after_ban ?? 0) - (x[1].answer_calls_after_ban ?? 0))
        .slice(0, 6),
    };
  }, [kcc, state]);

  return (
    <main className="ruled grain min-h-dvh">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <Link href="/" className="inline-block rounded-xl" aria-label="Parchi home">
              <Logo size={52} sub="Network" />
            </Link>
            <p className="mt-2 max-w-xl text-lg leading-snug text-ink-soft">
              For state pesticide inspectors and agriculture departments. Anonymised: no names, phone numbers or photos.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Filter by state</span>
            <select
              value={shownState}
              onChange={(e) => setState(e.target.value)}
              className="press-sm h-12 min-w-52 cursor-pointer appearance-none rounded-xl border-2 border-ink bg-white py-2 pr-11 pl-4 text-base font-bold"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDownIcon size={20} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
          </label>
        </header>

        <fieldset className="mt-4">
          <legend className="sr-only">Data layer</legend>
          <div className="press-sm inline-flex flex-wrap gap-1 rounded-xl border-2 border-ink bg-white p-1">
            {LAYERS.filter((l) => l.id !== "kcc" || kcc).map((l) => (
              <label
                key={l.id}
                className="flex min-h-10 cursor-pointer items-center rounded-lg px-4 text-base font-bold has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"
              >
                <input type="radio" name="layer" value={l.id} checked={layer === l.id} onChange={() => pickLayer(l.id)} className="sr-only" />
                {l.label}
              </label>
            ))}
          </div>
        </fieldset>

        {isKcc && kccView ? (
          <KccSection kcc={kcc!} v={kccView} state={shownState} />
        ) : (
          <>
            {showSeed && (
              <p className="mt-4 flex gap-3 rounded-xl border-2 border-careful bg-careful/10 px-4 py-2.5 text-base">
                <AlertIcon size={20} className="mt-0.5 shrink-0 text-careful" />
                <span>
                  <strong>Demo seed:</strong> {rows.length - live} of these rows are synthetic, generated to show how the dashboard works at scale.{" "}
                  {live} {live === 1 ? "is a live audit" : "are live audits"} from the app. Pick &quot;Live audits&quot; to see live data only.
                </span>
              </p>
            )}

            <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="Chits checked" value={view.length} />
              <Kpi label="Chits with a problem" value={view.length ? `${Math.round((stats.flaggedChits / view.length) * 100)}%` : "0%"} />
              <Kpi label="Chits with a banned or stopped product" value={stats.illegal} tone="danger" />
              <Kpi label="Districts reporting" value={stats.spots.length} />
            </section>

            <section className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
              <div>
                {loading || layer === null ? (
                  <div className="h-[420px] rounded-2xl border-2 border-ink bg-paper-2" />
                ) : (
                  <HotspotMap spots={stats.spots} />
                )}
                <p className="mt-2 text-sm text-ink-soft">
                  Circle size: chits checked. Colour: share of chits with a banned or stopped product (red over 50%, amber over 25%).
                </p>
              </div>
              <div className="space-y-5">
                <Panel title="Cross-state early warning">
                  {stats.warnings.length === 0 && <p className="text-ink-soft">Nothing flagged in more than one state in the last 14 days.</p>}
                  <ul className="space-y-2">
                    {stats.warnings.map(([a, s]) => (
                      <li key={a}>
                        <span className="font-bold text-danger">{a}</span> flagged in {s.size} states: {[...s].join(", ")}
                      </li>
                    ))}
                  </ul>
                </Panel>
                <Panel title="Most flagged products">
                  <Bars items={stats.topProducts} />
                </Panel>
              </div>
            </section>

            <section className="mt-5 grid gap-5 md:grid-cols-2">
              <Panel title="What went wrong">
                <Bars items={stats.topFlags.map(([f, n]) => [FLAG_LABEL[f] ?? f, n] as [string, number])} />
              </Panel>
              <Panel title="Open data API (CC BY 4.0)">
                <p>Any state, Krishi Vigyan Kendra or research group can pull the same anonymised feed:</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-ink p-3 text-sm text-paper">GET /api/v1/reports?state=Andhra%20Pradesh&amp;crop=chilli&amp;live=1</pre>
                <p className="mt-2 text-sm text-ink-soft">
                  Fields: district, state, location rounded to about 10 km, crop, verdict, flag codes and active ingredients. Checked against CIB&amp;RC approved
                  uses (31.03.2026) and the banned and restricted list (31.07.2026).
                </p>
                <a href="/api/v1/reports?live=1" className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-bold underline underline-offset-2">
                  Open live JSON <ArrowRightIcon size={18} />
                </a>
              </Panel>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function KccSection({ kcc, v, state }: { kcc: KccLayer; v: KccView; state: string }) {
  const where = state || "this sample";
  return (
    <>
      <p className="mt-4 flex gap-3 rounded-xl border-2 border-ok bg-ok/10 px-4 py-2.5 text-base">
        <CheckIcon size={20} className="mt-0.5 shrink-0 text-ok" />
        <span>
          <strong>Real government data:</strong> Kisan Call Centre call records, {kcc.period.from} to {kcc.period.to} ({kcc.period.months_present.length}{" "}
          months with data, {kcc.states} states and UTs). Each circle is a district where a farmer or a KCC adviser named a banned, crop-restricted or WHO
          Class Ia/Ib pesticide. A sample of calls, not a count of sales. Rows come from a{" "}
          <a href="https://huggingface.co/datasets/Omegaindebt/Kisan_Call_Centre_Transcripts" className="underline" target="_blank" rel="noreferrer">
            public mirror
          </a>{" "}
          of the official data.gov.in KCC transcripts.
        </span>
      </p>

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="KCC calls scanned" value={v.calls.toLocaleString("en-IN")} />
        <Kpi label="Plant-protection calls" value={v.pest.toLocaleString("en-IN")} />
        <Kpi label="Calls naming a banned or highly hazardous pesticide" value={v.flagged} tone="danger" />
        <Kpi label="Districts with such a call" value={v.districts} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div>
          <HotspotMap spots={v.spots} />
          <p className="mt-2 text-sm text-ink-soft">
            Circle size: calls naming a flagged pesticide. Colour: share of the district&apos;s plant-protection calls that do (red 5% or more, amber 2% or
            more, yellow under 2%). Districts created after 2011 sit on their parent district.
          </p>
        </div>
        <div className="space-y-5">
          <Panel title="Named in KCC answers">
            {v.answer.length ? (
              <Bars items={v.answer.map(([a, n]) => [kccTag(a, kcc.actives[a]), n] as [string, number])} />
            ) : (
              <p className="text-ink-soft">None in {where}.</p>
            )}
          </Panel>
          <Panel title="Named by farmers">
            {v.question.length ? (
              <Bars items={v.question.map(([a, n]) => [kccTag(a, kcc.actives[a]), n] as [string, number])} />
            ) : (
              <p className="text-ink-soft">No farmer question in {where} names one.</p>
            )}
            <p className="mt-2 text-sm text-ink-soft">Farmers mostly describe the pest, not the product, so this count is low.</p>
          </Panel>
        </div>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <Panel title="Advice given after a ban (all states)">
          <p className="mb-2">KCC answers that name a pesticide on a date after its ban order:</p>
          <ul className="space-y-2">
            {v.afterBan.map(([a, info]) => (
              <li key={a}>
                <span className="font-bold text-danger">{a}</span>: {info.answer_calls_after_ban} {info.answer_calls_after_ban === 1 ? "answer" : "answers"}{" "}
                after {info.ban_date}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-soft">
            Ban date is the latest order date printed against the active in the CIB&amp;RC list. A lead for adviser training, not proof of a sale.
          </p>
        </Panel>
        <Panel title="Method and source">
          <p>
            Calls tagged Plant Protection, Disease Management or Weed Management were searched for pesticide names, common misspellings and brand names, in
            the farmer&apos;s question and the adviser&apos;s answer separately, then checked against the CIB&amp;RC banned and restricted list (31.07.2026)
            and WHO hazard classes. Only Latin-script names are counted, so states whose answers use English names show up more.
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {kcc.records_scanned.toLocaleString("en-IN")} calls from {kcc.period.months_present.join(", ")}. Built {kcc.fetched_on}. {kcc.source.note}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-5">
            <a href={kcc.source.official} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-bold underline underline-offset-2">
              KCC on data.gov.in <ArrowRightIcon size={18} />
            </a>
            <a href="/api/v1/kcc" className="inline-flex min-h-11 items-center gap-1.5 font-bold underline underline-offset-2">
              Open KCC JSON <ArrowRightIcon size={18} />
            </a>
          </div>
        </Panel>
      </section>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "danger" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-ink bg-white/90 p-4 ${tone === "danger" ? "shadow-[4px_4px_0_0_var(--stamp-red)]" : "shadow-[4px_4px_0_0_var(--ink)]"}`}>
      <p className={`text-[2.6rem] leading-none font-extrabold tabular-nums ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
      <p className="mt-2 text-base leading-tight font-semibold text-ink-soft">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white/90 p-4 text-base shadow-[4px_4px_0_0_var(--ink)]">
      <h2 className="mb-3 border-b-2 border-dashed border-rule pb-2 text-xl font-extrabold">{title}</h2>
      {children}
    </div>
  );
}

function Bars({ items }: { items: [string, number][] }) {
  const max = Math.max(1, ...items.map((x) => x[1]));
  return (
    <ul className="space-y-1.5">
      {items.map(([k, n]) => (
        <li key={k} className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="relative h-8 overflow-hidden rounded-md bg-paper-2">
            <div className="absolute inset-y-0 left-0 border-r-2 border-danger bg-danger/20" style={{ width: `${(n / max) * 100}%` }} />
            <span className="relative truncate px-2 leading-8 font-bold">{k}</span>
          </div>
          <span className="w-10 text-right font-extrabold tabular-nums">{n}</span>
        </li>
      ))}
    </ul>
  );
}
