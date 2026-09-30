import Link from "next/link";
import { Logo, LogoMark } from "@/components/Logo";

export const metadata = { title: "About Parchi: method and data sources" };

export default function About() {
  return (
    <main className="ruled grain min-h-dvh">
      <article className="mx-auto max-w-2xl px-5 py-8 text-lg leading-relaxed">
        <Link href="/" className="inline-block rounded-xl" aria-label="Parchi home">
          <Logo size={52} />
        </Link>
        <div className="mt-6 flex items-center gap-5 border-y-2 border-ink py-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-[2.1rem] leading-tight font-extrabold">A second opinion on every spray chit</h1>
            <p className="mt-2 text-ink-soft">
              The mark is a shopkeeper&apos;s rubber stamp with <span lang="hi" className="font-bold text-danger">प</span>, the first letter of{" "}
              <span lang="hi" className="font-bold text-danger">पर्ची</span> (parchi, the chit), ticked in carbon ink.
            </p>
          </div>
          <LogoMark size={116} className="hidden shrink-0 sm:block" />
        </div>

        <h2 className="mt-8 text-2xl font-extrabold">Why</h2>
        <p>
          Government extension staff reach about 6.8% of Indian farmers (1 worker per 1,162 holdings, against a norm of 1 per 750; ICRISAT meta-analysis). So the
          pesticide dealer, who has sales targets, writes the prescription. More than half of farmers do not read the label. 118 of 339 registered pesticides are
          highly hazardous and make up 42% of the volume used (LSE South Asia, Dec 2025). Crop apps diagnose a disease and suggest a product. None of them check
          what the dealer actually sold.
        </p>

        <h2 className="mt-8 text-2xl font-extrabold">How it works</h2>
        <ol className="list-decimal space-y-2 pl-6">
          <li>The farmer picks a language and one of 22 crops, and photographs the dealer&apos;s chit, bill or the pack. They can also say the problem out loud.</li>
          <li>
            <strong>Gemini</strong> reads the handwriting (any Indian language, mixed scripts, brand names) and the voice note, and returns each product&apos;s
            active ingredient, strength, formulation and dose as structured data.
          </li>
          <li>
            A <strong>deterministic rule engine</strong> checks each product against official records: banned or restricted in India, banned on this crop,
            stopped formulations, approved for this crop and pest, dose against the highest approved dose, waiting period before harvest, WHO hazard class,
            duplicate ingredients and same-group tank mixes. The model never decides whether a product is legal.
          </li>
          <li>
            If a dose is written per litre or per pump, the app asks one picture question: how many spray tanks per acre? The answer turns the chit into a
            real dose per hectare. It is asked once and remembered on the phone.
          </li>
          <li>The next 48 hours of rain, wind and heat (Open-Meteo) give the best time to spray.</li>
          <li>
            <strong>Gemini</strong> explains the verdict in the farmer&apos;s language, reads it aloud, and writes a polite note to show the dealer, with approved
            alternatives from the same government list (biological options first).
          </li>
          <li>
            An anonymised record (district, crop, verdict, flag codes, active ingredients) goes to the shared <Link href="/inspector" className="underline">Parchi
            Network</Link>, where state pesticide inspectors see hotspots, and to an open API any state can read.
          </li>
        </ol>

        <h2 className="mt-8 text-2xl font-extrabold">Data sources</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            CIB&amp;RC (Directorate of Plant Protection, Quarantine &amp; Storage), <em>Major Uses of Pesticides</em>, insecticides, fungicides, herbicides and
            biopesticides, as on 31.03.2026: 2,721 approved crop and pest uses, 2,210 of them tagged to the app&apos;s 22 crops.
          </li>
          <li>CIB&amp;RC, <em>List of pesticides banned, refused registration and restricted in use</em>, updated 31.07.2026, including S.O. 4294(E) of 03.10.2023.</li>
          <li>WHO Recommended Classification of Pesticides by Hazard, 2019 edition.</li>
          <li>Open-Meteo hourly forecast. BigDataCloud reverse geocoding for the district.</li>
          <li>
            Kisan Call Centre transcripts (Ministry of Agriculture, data.gov.in, GODL-India) for the inspector map&apos;s real-data layer: 226,203 calls from 2022
            to 2024, read from a public mirror of the official file because the data.gov.in API was unreachable on the build date.
          </li>
          <li>State boundaries from datameet (Survey of India alignment), drawn without a map tile service.</li>
          <li>Gemini 3.5 Flash-Lite reads and explains; Gemini 3.8 Flash-Lite TTS speaks. All on the free tier.</li>
          <li>Brand to active ingredient mappings are from public product pages and retailer listings; the app asks for the pack&apos;s technical name when unsure.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-extrabold">Limits we are open about</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Detailed crop rules cover 22 crops today. Ban and hazard checks work for every crop.</li>
          <li>About 180 source rows (mostly seed treatments) could not be parsed reliably and were left out, so &quot;not found&quot; means &quot;not confirmed&quot;, not &quot;illegal&quot;. The app words it that way.</li>
          <li>Dose checks for per-litre doses use the farmer&apos;s tanks per acre once they tell us; until then they assume the label&apos;s water volume and say so.</li>
          <li>
            The Kisan Call Centre layer is a sample (11 months) and only matches product names written in English letters, so states whose advisers write in
            English show up more.
          </li>
          <li>Parchi is a second opinion, not a legal ruling. The Kisan Call Centre (1800-180-1551) is one tap away.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-extrabold">Beyond India</h2>
        <p>
          The rule engine only needs a national pesticide register and a banned list. Brazil (Agrofit), South Africa (Act 36 register) and China (ICAMA) publish
          both, so the same design fits other BRICS countries by swapping the data files.
        </p>

        <p className="mt-8 text-base text-ink-soft">
          Open source under the Apache 2.0 licence. Open data under CC BY 4.0. Built for Google&apos;s Build with AI: Code for Communities, 2026.
        </p>
      </article>
    </main>
  );
}
