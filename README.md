# Parchi: a second opinion on every spray chit

**Track 04, Agricultural Intelligence.** Google Build with AI: Code for Communities, 2026.

A farmer photographs the pesticide dealer's handwritten chit (*parchi*). Gemini reads it, a rule engine checks every product against India's official CIB&RC pesticide records, and the farmer hears the verdict in their own language: what is banned, what is not approved for their crop, what is overdosed, when it is safe to harvest, and a polite note to show the dealer with approved alternatives. Every audit feeds an anonymised, open dataset that state pesticide inspectors can use to find where banned and off-label products are being sold.

## How Parchi meets Track 04

| The track asks for | What Parchi does |
|---|---|
| Real-time, localised agro-advisories using AI | Gemini reads the farmer's chit (and voice note) and explains the verdict aloud in 11 Indian languages, for the farmer's crop and district |
| Weather forecasting | The next 48 hours of rain, wind and heat (Open-Meteo) set the best time to spray |
| Satellite data and soil health | NASA POWER rain and soil wetness (satellite and model data) and the ISRIC SoilGrids soil map (pH, organic carbon, texture) for the farmer's own field |
| Regenerative recommendations | Approved biological and low-hazard alternatives offered first; a soil tip (add compost, don't burn crop leftovers, extra care on sandy soil); no overdosing |
| A diagnostic tool | Diagnoses the treatment the farmer was sold: banned, off-label, overdosed or unsafe to harvest, each flag cited to CIB&RC |
| An interoperable network states can share | Every check feeds an anonymised open dataset (CC BY 4.0) and API; the inspector map adds real Kisan Call Centre data across 35 states and UTs |
| A scalable digital public good | Apache 2.0 code, public data, one serverless app, no state-specific setup; other BRICS countries swap in their own register |

## Why

- Government extension staff reach about **6.8%** of farmers (1 per 1,162 holdings against a norm of 1 per 750). [ICRISAT](https://oar.icrisat.org/11401/1/Agriculture-Extension-System-in-India-A-Meta-analysis.pdf)
- So the dealer, who has sales targets, writes the prescription, and **55%** of farmers don't read the label. [Scroll](https://scroll.in/article/875774/indian-farmers-spray-a-toxic-cocktail-of-pesticides-because-the-government-lacks-staff-to-guide-them), [JFMPC](https://www.ovid.com/jnls/jfmpc/fulltext/10.4103/jfmpc.jfmpc_405_22~agricultural-pesticide-use-and-misuse-a-study-to-assess-the)
- **118 of 339** registered pesticides are highly hazardous, and they make up 42% of the volume used. [LSE South Asia, Dec 2025](https://blogs.lse.ac.uk/southasia/2025/12/01/pesticide-suicides-in-india-failures-and-solutions/)
- Crop apps diagnose a disease and suggest a product. None of them check what the dealer actually sold.

## How it works

```
photo of chit (+ optional voice note)
        │
        ▼
Gemini 3.5 Flash-Lite (multimodal) ──► products, active ingredients, strength, dose, problem
        │
        ▼
Rule engine (deterministic, cited) ◄── CIB&RC approved uses (31.03.2026)
        │                          ◄── CIB&RC banned / restricted list (31.07.2026)
        │                          ◄── WHO hazard classes (2019)
        │                          ◄── Open-Meteo 48h forecast (spray window)
        ▼
Gemini ──► verdict in the farmer's language + dealer note ──► Gemini TTS (spoken)
        │                    ▲
        │                    └── "tanks per acre?" answer re-checks the dose
        │
        ▼
Anonymised record ──► Firestore ──► Inspector dashboard + open API (CC BY 4.0)

farmer's location (or the example farm) ──► ISRIC SoilGrids (soil, 250 m)
                                        └──► NASA POWER (rain and soil wetness, satellite and model data)
                                              ──► "Your field": one regenerative tip under the verdict
```

The model reads and explains. It never decides whether a product is legal: that comes from the rule engine over official data, with the source shown for every flag.

### Checks

| Check | Source |
|---|---|
| Banned, refused or withdrawn in India | CIB&RC list, 31.07.2026 |
| Banned on this crop (e.g. monocrotophos on vegetables, malathion on tomato) | CIB&RC list, S.O. 4294(E) |
| Stopped formulations (monocrotophos 36% SL, carbofuran other than 3% CG) | CIB&RC list, S.O. 4294(E) |
| Not approved for this crop, or for this pest | CIB&RC Major Uses |
| Dose above the highest approved dose (using the farmer's tanks per acre when given) | CIB&RC Major Uses |
| Waiting period before harvest, as a date | CIB&RC Major Uses |
| WHO Class Ia / Ib | WHO 2019 |
| Same active twice, same mode-of-action group, 3+ product cocktails | IRAC / FRAC groups |
| Rain, wind or heat in the spray window | Open-Meteo |

## For farmers

- 11 languages: Hindi, Marathi, Telugu, Kannada, Tamil, Gujarati, Punjabi, Bengali, Odia, Malayalam, English
- 22 crops as picture tiles (five on the home screen, the rest one tap away)
- One action per screen, everything read aloud (with an off switch), traffic-light stamp verdicts
- One picture question when it matters: "how many spray tanks per acre?", so the dose check uses the farmer's real spraying. Asked once, remembered on the phone.
- "Show this to the dealer" card, one-tap Kisan Call Centre (1800-180-1551), WhatsApp share
- Past checks saved on the phone, and an installable app that opens without internet
- "Your field": one quiet line under the actions with a regenerative tip for the farmer's own soil (add compost, don't burn crop leftovers; a warning on sandy soil, where poison reaches well water fast) and a plain facts line (soil type, last week's rain). It loads after the verdict and is simply left out if the soil or satellite service doesn't answer. The numbers (pH, organic carbon, sand and clay, soil wetness) are under "more", for helpers.

## For states

- `/inspector`: two layers on one district map: live audits from the app and real Kisan Call Centre call data. Most flagged products and a cross-state early warning. No synthetic data.
- `GET /api/v1/reports?state=&crop=`: anonymised open feed (district, rounded location, crop, verdict, flag codes, actives). No names, phone numbers or photos. Stored in Firestore with append-only, schema-checked security rules (`firestore.rules`).
- `GET /api/v1/kcc`: the Kisan Call Centre layer as JSON.
- `GET /api/field?lat=&lon=`: soil (SoilGrids) and the last week of rain and soil wetness (NASA POWER) for a point in India, with the tip codes the app shows. Cached for 12 hours; nothing is stored.

## Run it

```bash
cd app
npm install
cp .env.example .env.local   # add GEMINI_API_KEY (free from Google AI Studio)
npm run dev
```

Optional: `FIREBASE_PROJECT_ID` and `FIREBASE_API_KEY` to store audits in Firestore (deploy `firestore.rules` with `firebase deploy --only firestore:rules`). Without them, audits are kept in memory.

### Gemini models (all on the free tier)

| Job | Model | Fallback |
|---|---|---|
| Read the chit (image and voice note) | `gemini-3.5-flash-lite` | `gemini-3.1-flash-lite` |
| Explain in the farmer's language | `gemini-3.5-flash-lite` | `gemini-3.1-flash-lite` |
| Speak it | `gemini-3.8-flash-lite-tts` | `gemini-3.1-flash-tts-preview`, `gemini-3.8-flash-tts`, then the phone's own voice |

Flash-Lite read our test chits correctly in about 2 seconds and has the most generous free quota. Results and audio are cached, so repeat checks of the same photo don't spend quota. Override with `GEMINI_MODEL`, `GEMINI_TALK_MODEL` and `GEMINI_TTS_MODEL` (comma-separated lists).

When the free quota runs out: each chain pauses and retries once for per-minute limits. If the explanation still can't be written, the app shows the rule engine's verdict in plainer words (level labels in the farmer's language, the English details on the dealer note) instead of an error. The built-in example chits fall back to Gemini's earlier reading of the same chit (`src/lib/samples.ts`), and a real photo gets a "busy, try again in a minute" message rather than "take a clearer photo". Example checks are never added to the open map.

## Data and limits

See [`data/SOURCES.md`](data/SOURCES.md). Detailed crop rules cover 22 crops (2,210 approved uses); ban and hazard checks work for every crop. "Not found" means "not confirmed", and the app says so.

The inspector map also has a real-data layer from the Ministry of Agriculture's Kisan Call Centre transcripts (data.gov.in, GODL-India): 226,203 calls dated 2022 to 2024 (a sample of 11 months with data, 35 states and UTs), of which 426 plant-protection calls in 195 districts name a banned, crop-restricted or WHO Class Ia/Ib pesticide, mostly in the adviser's answer. Products that were already banned on the date of the call were named 135 times in advisers' answers (dichlorvos 56, phorate 30, triazophos 23, carbaryl 10 and others; one answer can name more than one). The rows come from a public mirror of the official file because api.data.gov.in was unreachable on the build date. `scripts/kcc_layer.py` rebuilds `data/kcc_layer.json`; method and caveats are in `data/SOURCES.md` section 6. It shows where these products are still being talked about, not sales.

Field conditions: soil from [ISRIC SoilGrids](https://soilgrids.org) v2.0 (250 m, thickness-weighted over the top 30 cm) and daily rain (`PRECTOTCORR`) and surface soil wetness (`GWETTOP`) from [NASA POWER](https://power.larc.nasa.gov), both free with no key. SoilGrids is a modelled map, not a field test, and tends to read organic carbon high for Indian soils, so the app labels it an estimate and points to the Soil Health Card test. Towns and water bodies are masked in SoilGrids, so some points get no soil data. NASA POWER lags by two or three days, so the live Open-Meteo forecast, not this data, sets the spray time. See `data/SOURCES.md` section 7.

Inspector map: state boundaries from [datameet/maps](https://github.com/datameet/maps) (simplified with mapshaper), drawn without a tile server.

## Beyond India

The engine only needs a national register of approved uses and a banned list. Brazil (Agrofit), South Africa (Act 36 register) and China (ICAMA) publish both, so the same design fits other BRICS countries by swapping the data files.

## Licence

Code: Apache 2.0. Open data feed: CC BY 4.0. Government data remains with its publishers.
