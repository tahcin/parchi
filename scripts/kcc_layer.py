"""Build data/kcc_layer.json: district counts of Kisan Call Centre (KCC) calls that name a
banned, crop-restricted or WHO Class Ia/Ib pesticide.

Usage (from the app folder):
    python scripts/kcc_layer.py                      # default: HF mirror of the data.gov.in KCC file
    python scripts/kcc_layer.py --source my.parquet  # any CSV or parquet with the official KCC columns
    python scripts/kcc_layer.py --api --max-rows 200000   # pull from api.data.gov.in instead

Input columns (official KCC schema): StateName, DistrictName, BlockName, Season, Sector, Category,
Crop, QueryType, QueryText, KccAns, CreatedOn.

Method, in short:
  1. Keep calls on or after --since (default 2022-01-01).
  2. Plant-protection calls = QueryType "Plant Protection", "Disease Management" or "Weed Management".
  3. In those calls, look for pesticide names (active ingredients, common misspellings and brand
     names) separately in the farmer's question (QueryText) and in the KCC answer (KccAns).
  4. A mention is "flagged" if the active is banned, refused or withdrawn in India
     (CIB&RC list, 31.07.2026), is WHO Class Ia or Ib (WHO 2019), or is a crop-restricted active
     named on a crop it is banned for (e.g. malathion on brinjal).
  5. District centroids come from datameet's Census 2011 district boundaries.
Only Latin-script text is matched: a name written in Devanagari, Tamil and so on is not counted.
Raw downloads are cached in --cache (keep it outside the repo).
"""

from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import pandas as pd

APP = Path(__file__).resolve().parent.parent
DATA = APP / "data"
MIRROR = "https://huggingface.co/datasets/Omegaindebt/Kisan_Call_Centre_Transcripts/resolve/main/data/train-00000-of-00001.parquet"
MIRROR_PAGE = "https://huggingface.co/datasets/Omegaindebt/Kisan_Call_Centre_Transcripts"
OFFICIAL = "https://www.data.gov.in/resource/kisan-call-centre-kcc-transcripts-farmers-queries-answers"
RESOURCE_ID = "cef25fe2-9231-4128-8aec-2c948fedd43f"
GEO = "https://raw.githubusercontent.com/datameet/maps/master/website/docs/data/geojson/dists11.geojson"
PP_TYPES = {"plant protection", "weed management", "disease management"}

# Extra spellings and brand names seen in KCC text, on top of data/aliases.json. Brand names are
# general Indian market knowledge (CIB&RC does not publish brands).
EXTRA_TERMS = {
    "monocrotophos": ["monocrotofos", "monocrotophas", "monocrotopos", "monochrotophos", "mono crotophos", "monocrotophose", "monocil", "nuvacron"],
    "phorate": ["phoret", "forate", "thimet"],
    "carbofuran": ["carbofuron", "carbofuraan", "furadan"],
    "triazophos": ["triazofos", "triazophas", "hostathion"],
    "endosulfan": ["endosulphan", "thiodan", "endocel"],
    "methyl parathion": ["methyl-parathion", "metacid", "folidol"],
    "ethyl parathion": ["ethyl-parathion"],
    "dichlorvos": ["dichlorovos", "ddvp", "nuvan"],
    "chlorpyrifos": ["chlorpyriphos", "chloropyriphos", "chloropyrifos", "chlorpyriphose", "chlorpyrephos", "dursban"],
    "carbaryl": ["sevin"],
    "phosphamidon": ["dimecron"],
    "methomyl": ["lannate"],
    "dicofol": ["kelthane"],
    "dinocap": ["karathane"],
    "oxydemeton-methyl": ["oxydemeton methyl", "oxydemeton", "metasystox"],
    "ediphenphos": ["edifenphos", "hinosan"],
    "beta-cyfluthrin": ["beta cyfluthrin"],
    "benzene hexachloride": ["bhc"],
    "lindane (gamma-hch)": ["lindane"],
    "quinalphos": ["quinolphos", "quinalfos", "ekalux"],
    "malathion": ["malathian", "malathione"],
    "mancozeb": ["mancozab", "dithane m-45", "dithane m 45", "indofil m-45", "indofil m 45"],
    "aluminium phosphide": ["aluminum phosphide", "celphos", "quickphos"],
}
# Names that are too ambiguous to match on their own.
SKIP_TERMS = {"sirmate", "tca", "edb", "epn"}

# Restricted actives that are flagged on every mention in farm use.
RESTRICTED_ALWAYS = {"ddt", "fenitrothion"}

CROP_WORDS = {  # banned_on_crops value -> words that identify it in the KCC Crop field
    "ber": ["ber"], "citrus": ["citrus", "orange", "lemon", "lime", "mosambi", "kinnow", "sweet orange", "mandarin"],
    "tobacco": ["tobacco"], "tea": ["tea"], "guava": ["guava"], "jowar": ["jowar", "sorghum"], "sorghum": ["jowar", "sorghum"],
    "tapioca": ["tapioca", "cassava"], "potato": ["potato"], "groundnut": ["groundnut"], "jute": ["jute"],
    "cardamom": ["cardamom"], "pea": ["pea"], "soybean": ["soybean", "soyabean"], "castor": ["castor"],
    "sunflower": ["sunflower"], "bhindi": ["bhindi", "okra", "ladies finger", "ladyfinger"], "brinjal": ["brinjal", "eggplant"],
    "cauliflower": ["cauliflower"], "radish": ["radish"], "turnip": ["turnip"], "tomato": ["tomato"], "apple": ["apple"],
    "mango": ["mango"], "grape": ["grape"], "vegetables": [],
}


def load_rules():
    br = json.loads((DATA / "banned_restricted.json").read_text(encoding="utf-8"))
    hz = json.loads((DATA / "hazard_class.json").read_text(encoding="utf-8"))
    al = json.loads((DATA / "aliases.json").read_text(encoding="utf-8"))
    cat: dict[str, str] = {}
    ban_date: dict[str, str] = {}
    for group in ("banned", "refused", "withdrawn"):
        for e in br[group]:
            a = e["active_ingredient"]
            if a.startswith("captafol"):
                continue  # captafol 80% powder: handled as restricted + WHO Ia
            cat[a] = "banned"
            ds = re.findall(r"(\d{2})\.(\d{2})\.(\d{4})", e.get("note", ""))
            if ds:
                ban_date[a] = max(f"{y}-{m}-{d}" for d, m, y in ds)
    restricted = {}
    for e in br["restricted"]:
        a = e["active_ingredient"]
        restricted[a] = e.get("banned_on_crops", [])
        cat.setdefault(a, "restricted")
    for a, v in hz.items():
        if a != "_meta" and isinstance(v, dict) and v.get("who_class") in ("Ia", "Ib"):
            if cat.get(a) != "banned":
                cat[a] = f"who_{v['who_class'].lower()}" if a not in restricted else cat[a]
    who = {a: v["who_class"] for a, v in hz.items() if a != "_meta" and isinstance(v, dict) and v.get("who_class") in ("Ia", "Ib")}

    terms: dict[str, set[str]] = defaultdict(set)
    for a in cat:
        base = re.sub(r"\s*\(.*?\)", "", a).strip()
        terms[a].add(base)
        for abbr in re.findall(r"\((.*?)\)", a):
            terms[a].add(abbr.strip())
    for x in al["aliases"]:
        act = x["active_ingredient"]
        if act in cat:  # single-active brands only
            terms[act].add(x["brand"].lower())
    for a, extra in EXTRA_TERMS.items():
        if a in cat:
            terms[a].update(extra)
    patterns = []
    for a, ts in terms.items():
        ts = {t for t in ts if t and t not in SKIP_TERMS and len(t) >= 3}
        if not ts:
            continue
        alt = "|".join(sorted((re.escape(t).replace(r"\ ", r"[\s-]*").replace(r"\-", r"[\s-]*") for t in ts), key=len, reverse=True))
        patterns.append((a, re.compile(rf"(?<![a-z])(?:{alt})(?![a-z])")))
    return cat, who, restricted, ban_date, patterns


def crop_hit(crop: str, category: str, banned_on: list[str]) -> bool:
    c = f" {crop.lower()} "
    for b in banned_on:
        if b == "vegetables" and category.lower().startswith("vegetable"):
            return True
        for w in CROP_WORDS.get(b, [b]):
            if re.search(rf"(?<![a-z]){re.escape(w)}(?![a-z])", c):
                return True
    return False


def load_env_key() -> str | None:
    key = os.environ.get("DATA_GOV_IN_KEY")
    env = APP / ".env.local"
    if not key and env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("DATA_GOV_IN_KEY="):
                key = line.split("=", 1)[1].strip().strip('"')
    return key


def fetch_api(max_rows: int, cache: Path) -> pd.DataFrame:
    """Page through api.data.gov.in. Not exercised on 2026-09-30: api.data.gov.in refused connections."""
    key = load_env_key() or "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"  # public sample key
    rows, offset = [], 0
    while offset < max_rows:
        q = urllib.parse.urlencode({"api-key": key, "format": "json", "limit": 1000, "offset": offset})
        with urllib.request.urlopen(f"https://api.data.gov.in/resource/{RESOURCE_ID}?{q}", timeout=60) as r:
            recs = json.load(r).get("records", [])
        if not recs:
            break
        rows.extend(recs)
        offset += len(recs)
    df = pd.DataFrame(rows)
    df.to_parquet(cache / "kcc_api.parquet")
    return df


def load_source(src: str, cache: Path) -> pd.DataFrame:
    if src.startswith("http"):
        local = cache / Path(urllib.parse.urlparse(src).path).name
        if not local.exists():
            print(f"downloading {src}", file=sys.stderr)
            urllib.request.urlretrieve(src, local)
        src = str(local)
    return pd.read_parquet(src) if src.endswith(".parquet") else pd.read_csv(src, low_memory=False)


def norm(s: str) -> str:
    return re.sub(r"[^a-z]", "", str(s).lower())


def district_centroids(cache: Path):
    local = cache / "dists11.geojson"
    if not local.exists():
        urllib.request.urlretrieve(GEO, local)
    g = json.loads(local.read_text(encoding="utf-8"))
    out: dict[str, dict[str, tuple[float, float]]] = defaultdict(dict)
    for f in g["features"]:
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        A = cx = cy = 0.0
        for poly in polys:
            ring = poly[0]
            for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
                cr = x0 * y1 - x1 * y0
                A += cr
                cx += (x0 + x1) * cr
                cy += (y0 + y1) * cr
        if A == 0:
            continue
        p = f["properties"]
        out[norm(p["ST_NM"])][norm(p["DISTRICT"])] = (round(cy / (3 * A), 3), round(cx / (3 * A), 3))
    return out


STATE_FIX = {"telangana": ["andhrapradesh"], "tamilnadu": ["tamilnadu"], "chattisgarh": ["chhattisgarh"],
             "jharkand": ["jharkhand"], "orissa": ["odisha"], "odisha": ["odisha", "orissa"], "uttarakhand": ["uttarakhand", "uttaranchal"],
             "ladakh": ["jammukashmir", "jammuandkashmir"], "jammuandkashmir": ["jammukashmir", "jammuandkashmir"],
             "aandnislands": ["andamannicobarisland", "andamanandnicobarislands"], "delhi": ["nctofdelhi", "delhi"]}


# KCC district name -> Census 2011 name. RENAMED keeps the exact place; PARENT maps a district created
# after 2011 to the 2011 district it was carved from, so its dot is approximate.
RENAMED = {"balasore": "baleshwar", "hooghly": "hugli", "nellore": "sripottisriramulunellore", "hathras": "mahamayanagar",
           "shivasti": "shrawasti", "kanpurcity": "kanpurnagar", "nawapara": "nuapada", "sonepur": "subarnapur",
           "eastmedinipur": "purbamedinipur", "westmedinipur": "pashchimmedinipur", "kaimur": "kaimurbhabua",
           "westsinghbhum": "pashchimisinghbhum", "eastsinghbhum": "purbisinghbhum", "northdinajpur": "uttardinajpur",
           "howrah": "haora", "saran": "saranchhapra", "beed": "bid", "trivandrum": "thiruvananthapuram", "chennaimadras": "chennai",
           "amroha": "jyotibaphulenagar", "dahod": "dohad", "seraikela": "saraikelakharsawan", "goasouth": "southgoa",
           "goanorth": "northgoa", "eastdistrict": "east", "westdistrict": "west", "northdistrict": "north", "southdistrict": "south"}
PARENT = {"charkidadri": "bhiwani", "shamli": "muzaffarnagar", "fazilka": "firozpur", "pathankot": "gurdaspur", "hapur": "ghaziabad",
          "sambal": "moradabad", "sambhal": "moradabad", "amethi": "sultanpur", "palghar": "thane", "alipurduar": "jalpaiguri",
          "mahabubabad": "warangal", "jayashankarbhupalapally": "warangal", "jangaon": "warangal", "warangalrural": "warangal",
          "warangalurban": "warangal", "peddapalli": "karimnagar", "rajannasircilla": "karimnagar", "jagtial": "karimnagar",
          "nirmal": "adilabad", "mancherial": "adilabad", "kumarambheemasifabad": "adilabad", "jogulambagadwal": "mahbubnagar",
          "nagarkurnool": "mahbubnagar", "wanaparthy": "mahbubnagar", "suryapet": "nalgonda", "yadadribhuvanagiri": "nalgonda",
          "bhadradrikothagudem": "khammam", "kamareddy": "nizamabad", "siddipet": "medak", "vikarabad": "hyderabad",
          "medchalmalkajgiri": "hyderabad", "girsomnath": "junagadh", "devbhoomidwarka": "jamnagar", "morbi": "rajkot",
          "botad": "bhavnagar", "aravalli": "sabarkantha", "mahisagar": "panchmahals", "chhotaudaipur": "vadodara",
          "bemetara": "durg", "balod": "durg", "balodabazar": "raipur", "gariyaband": "raipur", "mungeli": "bilaspur",
          "chhattisgarh:balrampur": "surguja", "surajpur": "surguja", "kondagaon": "bastar", "sukma": "dakshinbastardantewada",
          "tenkasi": "tirunelveli", "kallakurichi": "viluppuram", "ranipet": "vellore", "tirupathur": "vellore",
          "mayiladuthurai": "nagappattinam", "chengalpattu": "kancheepuram", "sepahijela": "westtripura", "khowai": "westtripura",
          "gomati": "southtripura"}


def locate(cent, state: str, district: str):
    """Return (lat, lon, approx) or None."""
    s = norm(state)
    cands = STATE_FIX.get(s, []) + [s]
    pool = {}
    for c in cands:
        for k in cent:
            if k == c or difflib.SequenceMatcher(None, k, c).ratio() > 0.85:
                pool.update(cent[k])
    d = norm(re.sub(r"\(.*?\)", "", district))
    if not pool or not d:
        return None
    parent = PARENT.get(f"{s}:{d}") or PARENT.get(d)
    approx = parent is not None
    d = parent or RENAMED.get(d) or d
    if d in pool:
        return (*pool[d], approx)
    m = difflib.get_close_matches(d, list(pool), n=1, cutoff=0.75)
    return (*pool[m[0]], approx) if m else None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", default=MIRROR)
    ap.add_argument("--api", action="store_true", help="pull from api.data.gov.in instead of --source")
    ap.add_argument("--max-rows", type=int, default=200_000)
    ap.add_argument("--since", default="2022-01-01")
    ap.add_argument("--cache", default=os.environ.get("KCC_CACHE", str(Path(os.environ.get("TEMP", "/tmp")) / "kcc")))
    ap.add_argument("--out", default=str(DATA / "kcc_layer.json"))
    args = ap.parse_args()
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)

    cat, who, restricted, ban_date, patterns = load_rules()
    df = fetch_api(args.max_rows, cache) if args.api else load_source(args.source, cache)
    df.columns = [c.strip() for c in df.columns]
    df["CreatedOn"] = df["CreatedOn"].astype(str)
    df = df[df["CreatedOn"] >= args.since].copy()
    df = df[~df["StateName"].astype(str).str.strip().isin(["NA", "0", ""])]
    for c in ("QueryType", "QueryText", "KccAns", "Crop", "Category", "StateName", "DistrictName"):
        df[c] = df[c].fillna("").astype(str).str.strip()
    df["pp"] = df["QueryType"].str.lower().isin(PP_TYPES)

    def scan(text: str, crop: str, category: str) -> list[str]:
        t = text.lower()
        hits = []
        for a, rx in patterns:
            if not rx.search(t):
                continue
            c = cat[a]
            if c == "restricted" and a not in who and a not in RESTRICTED_ALWAYS:
                if a == "trifluralin":
                    if "wheat" in crop.lower():
                        continue
                elif not crop_hit(crop, category, restricted.get(a, [])):
                    continue
            hits.append(a)
        return hits

    cent = district_centroids(cache)
    dist = {}
    q_all, a_all, a_after = Counter(), Counter(), Counter()
    examples: dict[str, list] = defaultdict(list)
    for (st, dn), g in df.groupby(["StateName", "DistrictName"], sort=False):
        pp = g[g["pp"]]
        q_by, a_by = Counter(), Counter()
        fq = fa = fany = 0
        for row in pp.itertuples(index=False):
            qh = scan(row.QueryText, row.Crop, row.Category)
            ah = scan(row.KccAns, row.Crop, row.Category)
            fany += bool(qh or ah)
            if qh:
                fq += 1
                q_by.update(set(qh))
            if ah:
                fa += 1
                a_by.update(set(ah))
                for a in set(ah):
                    if a in ban_date and row.CreatedOn[:10] > ban_date[a]:
                        a_after[a] += 1
                    if len(examples[a]) < 3:
                        examples[a].append({"date": row.CreatedOn[:10], "state": st.title(), "crop": row.Crop, "answer": row.KccAns[:220]})
        q_all.update(q_by)
        a_all.update(a_by)
        if not len(pp):
            continue
        loc = locate(cent, st, dn)
        dist[(st, dn)] = {
            "state": st.title(), "district": dn.title(),
            "lat": loc[0] if loc else None, "lon": loc[1] if loc else None,
            **({"approx_location": True} if loc and loc[2] else {}),
            "calls_scanned": int(len(g)), "pest_calls": int(len(pp)),
            "flagged_mentions": fq, "by_active": dict(q_by.most_common()),
            "answer_mentions": fa, "answer_by_active": dict(a_by.most_common()),
            "calls_with_flagged": fany,
        }

    months = sorted(df["CreatedOn"].str[:7].unique())
    districts = sorted(dist.values(), key=lambda d: (-d["calls_with_flagged"], -d["flagged_mentions"], -d["pest_calls"]))
    out = {
        "source": {
            "name": "Kisan Call Centre (KCC): transcripts of farmers' queries and answers, Ministry of Agriculture & Farmers Welfare, via data.gov.in (GODL-India)",
            "official": OFFICIAL,
            "retrieved_from": "api.data.gov.in" if args.api else (MIRROR_PAGE if args.source == MIRROR else args.source),
            "note": "Rows were read from a public 1,000,000-row mirror of the official file with the official column names. api.data.gov.in refused connections on the build date, so rows were not re-checked against the live API." if not args.api else "",
            "geo": "District centroids computed from datameet Census 2011 district boundaries (CC BY 2.5 IN), " + GEO,
            "rules": "data/banned_restricted.json (CIB&RC, 31.07.2026) and data/hazard_class.json (WHO 2019)",
        },
        "resource_ids": [RESOURCE_ID],
        "fetched_on": date.today().isoformat(),
        "period": {"from": df["CreatedOn"].min()[:10], "to": df["CreatedOn"].max()[:10], "months_present": months},
        "records_scanned": int(len(df)),
        "plant_protection_calls": int(df["pp"].sum()),
        "states": int(df["StateName"].nunique()),
        "method": (
            "Calls with QueryType Plant Protection, Disease Management or Weed Management were searched for pesticide names (active ingredients, "
            "common misspellings, brand names) in the farmer's question and, separately, in the KCC answer. A mention counts as "
            "flagged if the active is banned, refused or withdrawn in India (CIB&RC list of 31.07.2026), is WHO Class Ia or Ib, or "
            "is a crop-restricted active named on a crop it is banned for. flagged_mentions and by_active count calls (not words) "
            "with a flagged name in the question; answer_mentions counts calls with one in the KCC answer; calls_with_flagged counts calls with either. Rules are today's, so "
            "some products were still legal on the date of the call. Only Latin-script text is matched."
        ),
        "actives": {
            a: {"category": cat[a], "who_class": who.get(a), "ban_date": ban_date.get(a), "question_calls": q_all[a],
                "answer_calls": a_all[a], "answer_calls_after_ban": a_after[a] if a in ban_date else None,
                "answer_examples": examples.get(a, [])[:2]}
            for a in sorted(set(q_all) | set(a_all), key=lambda k: -(q_all[k] + a_all[k]))
        },
        "unlocated_districts": sum(1 for d in districts if d["lat"] is None),
        "districts": districts,
    }
    Path(args.out).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(df)} calls, {out['plant_protection_calls']} plant protection, {len(districts)} districts "
          f"({out['unlocated_districts']} without a centroid), {sum(q_all.values())} question and {sum(a_all.values())} answer mentions "
          f"-> {args.out} ({Path(args.out).stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
