# Data sources: Dealer Prescription Auditor

All files were built on 2026-09-30 from official documents downloaded that day. Nothing was typed in by hand except `aliases.json` (brand names, which CIB&RC does not publish) and the transcription of the banned list (checked line by line against the PDF). The raw PDFs are not included in this repo; every file is linked below.

## 1. `registered_uses.json` (2,721 records)

**Source:** CIB&RC, Directorate of Plant Protection, Quarantine & Storage, "Major Uses of Pesticides (Registered under the Insecticides Act, 1968)", upto 31.03.2026, based on certificates issued.
Page: https://ppqs.gov.in/divisions/cib-rc/major-uses-of-pesticides (accessed 2026-09-30)

| File | Used for | Records |
|---|---|---|
| `updated_mup_insecticide_as_on_31.03.2026_c.pdf` (109 pp) | Agricultural insecticides, single and combination (pp. 2-89). Public health, household and locust sections skipped. | 1,155 |
| `2._chemical_mup_fungicide_as_on_31.03.2026_0.pdf` (83 pp) | Fungicides, single and combination | 945 |
| `4._herbicides_mup_as_on_31.03.2026.pdf` | Herbicides | 389 |
| `6._mup_bio_insecticide_31.03.2026.pdf` | Bio-insecticides (neem/azadirachtin, Bt, Beauveria, Metarhizium, Lecanicillium, NPV and others) | 157 |
| `3._bio_pesticide_mup_biofungicide_as_on_31.03.2026.pdf` | Bio-fungicides (Trichoderma, Pseudomonas, Bacillus subtilis, Ampelomyces) | 75 |

Base URL for all files: `https://ppqs.gov.in/sites/default/files/<file name>`. The PGR file (`5._pgr_mup_as_on_31.03.2026.pdf`) was not used.

**Coverage:** 309 distinct active ingredients in 938 distinct product labels, all crops. The app's 22 crops, matched on the printed crop text through the `crop_group` field, have 2,210 tagged records: rice/paddy 441, cotton 221, chilli 221, tomato 175, grapes 125, soybean 110, groundnut 108, wheat 105, potato 90, brinjal 89, okra 77, maize 70, sugarcane 61, cabbage 54, chickpea 51, onion 45, red gram 44, mango 36, black gram 34, sorghum 22, cauliflower 17, mustard 14. The first five were tagged when the file was built; the other 17 were added the same day by a separate tagging script that matches spelling variants (Redgram, Arhar, Bhindi, Soyabean, Rapeseed & Mustard) and excludes look-alikes (black gram is not chickpea, sweet potato is not potato). All ~40 priority actives are covered except **phorate and triazophos**. Both are banned in India and do not appear in the 2026 Major Uses lists at all. Monocrotophos appears only as 15% SG; the 36% SL is being phased out and is not in the list.

**Fields:** as requested, plus these extras:
- `active_ingredients`: an array, so combination products can be matched component by component
- `is_combination`
- `product_label`: the exact heading text from the PDF
- `pesticide_type`
- `crop_group`
- `waiting_period_raw`
- `application_note`
- `parse_quality`

`source` includes the PDF file name and page number.

**Parsing caveats (read before relying on a value):**
- Parsing used pdfplumber table extraction. Dose, water and waiting-period strings are kept **exactly as printed**, including typos in the source (for example acephate 75% SP on rice shows formulation "666 -100"). Units vary: g, ml, kg, %, "per kg seed". Do not do arithmetic on these strings without checking the units.
- `waiting_period_days` is a number only when the source gives a single integer. It is null for "-", "NA", ranges, "seed dresser" and similar. The original text is always in `waiting_period_raw` (838 records have null).
- Crop names are kept as printed ("Paddy (Rice)", "Transplanted Rice", etc.). Use `crop_group` for matching.
- 118 records have `parse_quality: "raw_text"`, mostly bio-fungicides and some bio-insecticides. Their tables are free text (seed treatment, root dip, soil application instructions), so dose fields are null and the printed instructions are in `application_note`.
- About 180 chemical rows could not be split into the standard 5 columns and were **left out** rather than guessed. Examples: seed-dresser rows such as thiamethoxam 30% FS / 70% WS, metalaxyl-M 31.8% ES and some penoxsulam rows, plus some rows that span a page break. Anything not found in this file should be treated as "not confirmed", not as "not registered". Cross-check against `registered_actives.json`.
- Active names were normalised to lowercase with a few spelling fixes: chlorpyriphos to chlorpyrifos, thaimethoxam to thiamethoxam, difenconazole to difenoconazole, and "x methyl/ethyl" written as "x-methyl".
- The one em dash in the source text was replaced with a hyphen.

## 2. `registered_actives.json` (371 actives; extra file)

**Source:** CIB&RC, "Insecticides/Pesticides Registered under section 9(3) of the Insecticides Act, 1968 for use in the Country" (as on 31.03.2026).
https://ppqs.gov.in/sites/default/files/list_of_pesticides_as_on_31.03.2026.pdf, linked from https://ppqs.gov.in/divisions/cib-rc/registered-products (accessed 2026-09-30).

Names are as printed. The source numbering runs to 372 but skips no. 277. Use this list for a quick "is this active registered at all" check.

## 3. `banned_restricted.json`

**Source:** CIB&RC, "List of pesticides which are banned, refused registration and restricted in use", updated on 31.07.2026.
https://ppqs.gov.in/sites/default/files/list_of_pesticides_which_are_banned_refused_registration_and_restricted_in_use.pdf (accessed 2026-09-30)

**Counts:**
- `banned`: 54 entries. That is 49 banned for manufacture, import and use, plus 5 banned for use but still made for export (dichlorvos, phorate and triazophos appear in both groups).
- `refused`: 18
- `restricted`: 16. Crop-specific bans are in `banned_on_crops`. Carbofuran's only permitted formulation (3% CG) is in `only_allowed_formulations`.
- `withdrawn`: 8

**October 2023 final order, S.O. 4294(E) dated 03.10.2023, as recorded in the official list:**
- Banned outright: dicofol, dinocap, methomyl.
- Restricted: carbofuran (3% CG only), chlorpyrifos (not on ber, citrus, tobacco), dimethoate (not on fruit or vegetables eaten raw), malathion (14 crops including brinjal and tomato), mancozeb (not on guava, jowar, tapioca), monocrotophos (36% SL phased out; already banned on vegetables since 2005), oxyfluorfen (not on potato, groundnut) and quinalphos (not on jute, cardamom, sorghum).

`draft_2020_27_pesticides` records the outcome for each of the 27 actives in the 2020 draft order. The other 16 (acephate, atrazine, carbendazim, 2,4-D and so on) are not banned or restricted in the 2026 list. This block is marked `"uncertain": true` for one reason only: the list of 27 and the draft order number (S.O. 1512(E), May 2020) come from secondary sources, which are:
- https://en.wikipedia.org/wiki/List_of_banned_and_restricted_pesticides_in_India
- the ASHA Kisan Swaraj page on the S.O. 1512(E) draft (URL returned 404 when fetched)

The outcomes themselves come from the official list.

## 4. `hazard_class.json` (333 entries plus `_meta`)

**Source:** WHO, "The WHO Recommended Classification of Pesticides by Hazard and Guidelines to Classification, 2019 edition", ISBN 978-92-4-000566-2.
- Record: https://iris.who.int/handle/10665/332193
- PDF: https://iris.who.int/server/api/core/bitstreams/36c193cd-2362-46d1-be00-fef570d80037/content
- Corrigenda: https://cdn.who.int/media/docs/default-source/chemical-safety/pesticides/9789240005662_corrigenda_en.pdf. These say the corrections are already in the electronic file.

All accessed 2026-09-30.

**Coverage:** every active in `registered_uses.json` (309 entries), plus 24 banned or restricted actives (phorate, triazophos, dichlorvos, methyl parathion and others) so the app can alert on them. These extras have `in_registered_uses: false`.

**Classes:** Ia 6, Ib 11, II 105, III 60, U 61, O (Table 6, obsolete) 1, null 89.

**Caveats:**
- Classes were extracted automatically from WHO Tables 1-6. Each name is anchored on the CAS number that follows it. The key actives were spot-checked against the PDF: monocrotophos Ib, carbofuran Ib, phorate Ia, abamectin Ib, imidacloprid II, thiamethoxam II, mancozeb U, chlorantraniliprole U.
- `matched_via_parent: true` means WHO lists only the parent compound. Examples: 2,4-D for its salts, cartap for cartap hydrochloride, glyphosate for its salts, Bacillus thuringiensis for all Bt varieties, and quizalofop for quizalofop-ethyl. Treat these classes as indicative.
- `who_class: null` (89 entries) means the name was not found. These are mostly biopesticides, newer actives and some esters (pyraclostrobin, spiromesifen, tolfenpyrad, sulfosulfuron, clodinafop-propargyl and others). Null means unknown, not safe.
- Fumigants in WHO Table 8 were not parsed. That is why aluminium phosphide and methyl bromide are null.

## 5. `aliases.json` (56 brands)

**Source:** CIB&RC does not publish brand names. The mappings come from general knowledge of the Indian market. The following were spot-checked by web search on 2026-09-30:
- Polo: diafenthiuron 50% WP, Syngenta (https://www.syngenta.co.in/product/crop-protection/insecticide/polo)
- Monocil: monocrotophos 36% SL, Insecticides (India) Ltd (https://www.bighaat.com/products/monocil-insecticide)
- Takumi: flubendiamide 20% WG, Rallis (https://agribegri.com/products/buy-tata-rallis-takumi-flubendiamide-20-wdg.php)
- Padan 50 SP: cartap hydrochloride 50% SP (https://www.tradeindia.com/products/padan-50-sp-cartap-hydrochloride-50-sp-3677100.html)
- Pride: several unrelated acetamiprid 20% SP products share the name, so this entry is marked uncertain (https://www.indiamart.com/proddetail/acetamiprid-20-sp-universal-pride-25517433133.html)

**How to use it:**
- `uncertain: true` is set wherever the company or the exact strength was not verified.
- `formulation_found_in_cibrc_mup` is an automated check that the same active and strength appears in the 2026 Major Uses data. It is false for five brands:
  - Monocil and Nuvacron: the 36% SL is being phased out.
  - Thimet: phorate is banned.
  - Cruiser: the 70% WS seed-treatment rows were not parsed.
  - Virtako: the formulation is unverified.
- A brand match should only prefill a guess. The app should still confirm the active ingredient printed on the pack.

## 6. `kcc_layer.json` (Kisan Call Centre layer for the inspector map)

**What it is:** district counts of Kisan Call Centre (KCC) calls in which a banned, crop-restricted or WHO Class Ia/Ib pesticide is named, either by the farmer (QueryText) or by the KCC adviser (KccAns). Built by `scripts/kcc_layer.py` on 2026-09-30 and served at `/api/v1/kcc`.

**Source:** Ministry of Agriculture & Farmers Welfare, "Kisan Call Centre (KCC): Transcripts of farmers queries & answers", Open Government Data Platform India, GODL-India licence.
https://www.data.gov.in/resource/kisan-call-centre-kcc-transcripts-farmers-queries-answers (API resource id `cef25fe2-9231-4128-8aec-2c948fedd43f`).

**How the rows were obtained:** on 2026-09-30 `api.data.gov.in` refused TCP connections from this machine (with and without the public sample key), so the rows were read from a public Hugging Face mirror of the official file: https://huggingface.co/datasets/Omegaindebt/Kisan_Call_Centre_Transcripts (1,000,000 rows, official column names StateName, DistrictName, BlockName, Season, Sector, Category, Crop, QueryType, QueryText, KccAns, CreatedOn). The mirror's rows were not re-checked against the live API. Once `DATA_GOV_IN_KEY` is in `.env.local` and the API is reachable, `python scripts/kcc_layer.py --api` pulls from data.gov.in directly (that path was not exercised on the build date).

**What it covers:** every mirror row dated 2022-02-22 to 2024-05-18. The mirror is a sample of scattered months, not a full series: rows exist for 2022-02, 2022-04, 2022-09, 2022-10, 2023-02, 2023-05, 2023-09, 2023-10, 2023-11, 2024-02 and 2024-05 (the two 2024 months have 36 rows between them). 226,203 calls from 35 states and UTs; 44,301 of them are plant-protection calls in 631 districts.

**Method:**
- Plant-protection calls: QueryType "Plant Protection", "Disease Management" or "Weed Management".
- Names searched: every active in `banned_restricted.json` (banned, refused, withdrawn, restricted) and every WHO Ia/Ib active in `hazard_class.json`, plus single-active brand names from `aliases.json` and a short hand list of common misspellings and brands in the script (e.g. monocrotofos, chlorpyriphos, forate, Thimet, Furadan, Nuvan, Metacid). Word-boundary regex on lowercased text.
- Flagged: banned/refused/withdrawn, WHO Ia or Ib, or a crop-restricted active named in a call whose Crop field is one of its banned crops (e.g. malathion on brinjal). Restricted actives on other crops are not flagged.
- Counts are calls, not words. `flagged_mentions` and `by_active`: farmer's question. `answer_mentions` and `answer_by_active`: KCC answer. `calls_with_flagged`: either. `actives[*].answer_calls_after_ban` compares the call date with the latest order date printed against that active in the CIB&RC list.
- Centroids: computed from datameet's Census 2011 district boundaries (https://raw.githubusercontent.com/datameet/maps/master/website/docs/data/geojson/dists11.geojson, CC BY 2.5 IN). KCC district names were matched by name, a rename table and fuzzy matching. 53 districts created after 2011 are placed at their parent 2011 district (`approx_location: true`); 8 rows with district "0" or "9999" have no location.

**Result:** 426 calls in 195 districts name a flagged pesticide: 20 in the farmer's question, 415 in the KCC answer (a few in both). Most named in answers: carbofuran (WHO Ib; 3% CG is the only formulation still allowed), dichlorvos, monocrotophos, phorate, triazophos. Answers naming dichlorvos (56), phorate (30) and triazophos (23) are all dated after those products' 2020 orders.

**Caveats:**
- A sample of call records, not a count of sales or use. A name in an answer can be a recommendation or a warning; the answers checked by hand were recommendations.
- Rules are today's (31.07.2026 list), so some products were still legal on the date of the call (e.g. dicofol before its October 2023 ban). Use `answer_calls_after_ban` for the stricter view.
- Only Latin-script names are matched. Answers written wholly in Hindi, Telugu, Tamil and so on are missed, so states whose advisers write English names (Andhra Pradesh, Telangana, Odisha, Uttar Pradesh) are over-represented. Some Indic text in the mirror is damaged encoding.
- Rows with state "NA" or "0" were dropped.

## 7. Field conditions (live lookups, nothing stored)

`src/lib/field.ts`, served at `GET /api/field?lat=&lon=`, rounded to about 1 km.

- **Soil:** ISRIC SoilGrids v2.0 REST API (`rest.isric.org/soilgrids/v2.0/properties/query`), mean values of `phh2o`, `soc`, `sand` and `clay` for 0 to 5, 5 to 15 and 15 to 30 cm, averaged by layer thickness. CC BY 4.0. A 250 m modelled map, not a lab test: it tends to read organic carbon high for Indian soils, so the app calls it an estimate. Towns and water are masked and return no data.
- **Rain and soil wetness:** NASA POWER daily point API (`power.larc.nasa.gov/api/temporal/daily/point`, community `AG`), `PRECTOTCORR` (bias-corrected precipitation, mm/day) and `GWETTOP` (surface soil wetness, 0 to 1), from satellite observations and the MERRA-2 model. The newest two or three days are still being processed (`-999`) and are skipped.
- **Tips:** organic carbon below 0.75% (the top of the Soil Health Card "medium" band) gets "add compost or farmyard manure, don't burn crop leftovers", otherwise "keep adding compost". Sand at 60% or more gets the well-water warning. More than 40 mm of rain in 7 days, or surface wetness of 0.8 or more, is noted as "very wet" under "more"; it is not shown as a farmer tip, because the live forecast sets the spray time.

## General

- Dates: the documents are dated 31.03.2026 (Major Uses, registered list) and 31.07.2026 (banned list). All were accessed on 2026-09-30.
- Disclaimer carried over from CIB&RC: "The document has been compiled on the basis of available information for guidance and not for legal purposes." The same applies to this dataset.
