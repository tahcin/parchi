"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { KCC_NUMBER, LANGUAGES, getLanguage, type Language } from "@/lib/i18n";
import { CROP_LIST, CROP_NAMES, type CropId } from "@/lib/crops";
import { compressImage, sayNow, startRecording } from "@/lib/client";
import type { Audit, Level } from "@/lib/rules";
import { Logo, LogoMark } from "@/components/Logo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { SprayerIcon } from "@/components/SprayerIcon";
import { addHistory, loadHistory, makeThumb, removeHistory, type Result, type SavedCheck } from "@/components/history";
import {
  AlertIcon, ArrowLeftIcon, ArrowRightIcon, BasketIcon, BlurryChitArt, CameraIcon, ChatIcon, CheckIcon, ChevronDownIcon,
  ChitIcon, CropIcon, CrossIcon, GalleryIcon, HistoryIcon, LedgerIcon, LeafIcon, LevelIcon, MicIcon, PencilIcon, PhoneIcon,
  RainIcon, SpeakerIcon, SpeakerOffIcon, StopIcon, SunCloudIcon, TrashIcon,
} from "@/components/icons";

type Step = "lang" | "crop" | "snap" | "checking" | "result" | "dealer" | "error";

const LEVEL_COLOR: Record<Level, string> = { ok: "text-ok", careful: "text-careful", danger: "text-danger" };
const LEVEL_BG: Record<Level, string> = { ok: "bg-ok", careful: "bg-careful", danger: "bg-danger" };
const LEVEL_TINT: Record<Level, string> = { ok: "bg-ok/10", careful: "bg-careful/10", danger: "bg-danger/10" };

// Verdict choreography (ms from the result screen mounting). Keep in step with globals.css.
const STAMP_LANDS = 700; // photo settles (280) + pause (150) + stamp press (~270)
const AFTER_STAMP = 760; // headline, then rows, then everything else
const at = (ms: number) => ({ animationDelay: `${ms}ms` });
const clock = () => performance.now();

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
  return null;
}

export default function Home() {
  // Nothing language-dependent renders until the saved language has been read, so a returning
  // farmer never sees the language screen flash. Server HTML and the first client render match.
  const [ready, setReady] = useState(false);
  const [lang, setLang] = useState<Language>(LANGUAGES[0]);
  const [step, setStep] = useState<Step>("lang");
  const [crop, setCrop] = useState<CropId | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [voice, setVoice] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [history, setHistory] = useState<SavedCheck[]>([]);
  const [checkPhase, setCheckPhase] = useState(0);
  const [camTapped, setCamTapped] = useState(false);
  const [allCrops, setAllCrops] = useState(false);
  // The farmer's spray tanks per acre, remembered on the phone so we only ask once.
  const [pumps, setPumps] = useState<number | null>(null);
  const [askPumps, setAskPumps] = useState(false);
  const lastRun = useRef<{ img: string; crop: CropId; audio?: string; histId?: string } | null>(null);
  const runId = useRef(0); // a newer check (or going home) makes an older answer stale
  const [fresh, setFresh] = useState(false); // result came from a photo just taken, not a saved check
  // Automatic speaking (screen prompts and the verdict). Tapping a speaker button always speaks.
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceRef = useRef(true);
  const resultLang = useRef<string>(LANGUAGES[0].code);
  const [resultBcp, setResultBcp] = useState(LANGUAGES[0].speech); // language the result words are in
  const stampAt = useRef(0);
  const loc = useRef<{ lat: number; lon: number } | null>(null);
  const stopRec = useRef<null | (() => Promise<string | null>)>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const player = useRef<HTMLAudioElement>(null);
  const s = lang.s;

  useEffect(() => {
    // localStorage is only available after hydration.
    const id = requestAnimationFrame(() => {
      if (store("parchi.voice") === "off") {
        voiceRef.current = false;
        setVoiceOn(false);
      }
      const saved = store("parchi.lang");
      if (saved) {
        setLang(getLanguage(saved));
        setStep("crop");
      }
      setHistory(loadHistory());
      const savedPumps = Number(store("parchi.pumps"));
      if (savedPumps > 0) setPumps(savedPumps);
      // Dev-only: /?mock=result|dealer|details|checking|error renders a fixture without Gemini.
      const m = process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search).get("mock") : null;
      if (!m) return setReady(true);
      import("./mock").then(({ mockResult }) => {
        const l = getLanguage(new URLSearchParams(window.location.search).get("lang") ?? "hi");
        setLang(l);
        resultLang.current = l.code;
        setResultBcp(l.speech);
        setCrop("chilli");
        setPhoto("/samples/chit-chilli.png");
        setResult(mockResult());
        setShowMore(m === "details");
        setStep(m === "details" ? "result" : (m as Step));
        setReady(true);
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Checking: three honest stages. Reading the chit takes most of the wait, then the records
  // check, then Gemini writes the answer. The last stage holds until the result arrives.
  useEffect(() => {
    if (step !== "checking") return;
    const t1 = setTimeout(() => setCheckPhase(1), 2600);
    const t2 = setTimeout(() => setCheckPhase(2), 4400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

  // Every new screen starts at the top (e.g. opening a past check from low on the crop screen).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Speak a screen prompt only when automatic speaking is on.
  function prompt(text: string, bcp47: string) {
    if (voiceRef.current) sayNow(text, bcp47);
  }

  function toggleAutoVoice() {
    const on = !voiceRef.current;
    voiceRef.current = on;
    setVoiceOn(on);
    store("parchi.voice", on ? "on" : "off");
    if (!on) {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* no speech engine */
      }
      player.current?.pause();
    }
  }

  function pickLang(l: Language) {
    setLang(l);
    store("parchi.lang", l.code);
    setStep("crop");
    prompt(l.s.whichCrop, l.speech);
  }

  function switchLang(l: Language) {
    setLang(l);
    store("parchi.lang", l.code);
    prompt(l.name, l.speech);
  }

  function pickCrop(c: CropId) {
    setCrop(c);
    setCamTapped(false);
    setStep("snap");
    prompt(s.takePhoto, lang.speech);
    navigator.geolocation?.getCurrentPosition(
      (p) => (loc.current = { lat: p.coords.latitude, lon: p.coords.longitude }),
      () => {},
      { timeout: 8000, maximumAge: 600000 },
    );
  }

  async function toggleVoice() {
    if (recording) {
      setRecording(false);
      const data = await stopRec.current?.();
      if (data) setVoice(data);
      return;
    }
    try {
      stopRec.current = await startRecording();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  async function onFile(input: HTMLInputElement) {
    const f = input.files?.[0];
    // Clear the picker so choosing the same photo again (after an error) still fires onChange.
    input.value = "";
    if (!f) return;
    let img: string;
    try {
      img = await compressImage(f);
    } catch {
      setStep("error");
      prompt(s.errRead, lang.speech);
      return;
    }
    run(img);
  }

  async function useExample() {
    const blob = await (await fetch(`/samples/chit-${crop === "paddy" ? "paddy" : "chilli"}.png`)).blob();
    if (crop !== "paddy") setCrop("chilli");
    run(await compressImage(blob), crop === "paddy" ? "paddy" : "chilli");
  }

  function showResult(r: Result, speechLang: string) {
    resultLang.current = speechLang;
    setResultBcp(getLanguage(speechLang).speech);
    stampAt.current = clock() + STAMP_LANDS;
    setResult(r);
    setAudioUrl(null);
    setShowMore(false);
    setStep("result");
    if (voiceRef.current) speakResult(r.words.spoken, true);
  }

  async function run(img: string, cropOverride?: CropId, pumpsOverride?: number, audioOverride?: string) {
    const cropNow = cropOverride ?? crop ?? "other";
    const audio = audioOverride ?? voice ?? undefined;
    const id = ++runId.current;
    // A re-check of the same photo (the tanks answer) replaces its saved copy instead of adding one.
    const histId = pumpsOverride != null && lastRun.current?.img === img ? lastRun.current.histId : undefined;
    lastRun.current = { img, crop: cropNow, audio, histId };
    setPhoto(img);
    setResult(null);
    setAudioUrl(null);
    setShowMore(false);
    setCheckPhase(0);
    setStep("checking");
    prompt(s.checking, lang.speech);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: img,
          audio,
          crop: cropNow,
          lang: lang.code,
          pumpsPerAcre: pumpsOverride ?? pumps ?? undefined,
          recheck: pumpsOverride != null,
          ...(loc.current ?? {}),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const r = (await res.json()) as Result;
      if (id !== runId.current) return;
      setVoice(null);
      setFresh(true);
      showResult(r, lang.code);
      // Keep a copy on this phone so the farmer can reopen it later without data.
      makeThumb(img)
        .then((thumb) => {
          const hid = histId ?? Date.now().toString(36);
          if (lastRun.current?.img === img) lastRun.current.histId = hid;
          setHistory(addHistory({ id: hid, ts: Date.now(), crop: cropNow, lang: lang.code, thumb, result: r }));
        })
        .catch(() => {});
    } catch {
      if (id !== runId.current) return;
      setStep("error");
      prompt(s.errRead, lang.speech);
    }
  }

  function answerPumps(n: number) {
    setPumps(n);
    setAskPumps(false);
    store("parchi.pumps", String(n));
    // Re-check with the farmer's own tanks per acre. The chit reading is cached on the server,
    // so this is quick and doesn't read the photo again.
    if (lastRun.current) run(lastRun.current.img, lastRun.current.crop, n, lastRun.current.audio);
  }

  function openPast(h: SavedCheck) {
    lastRun.current = null;
    setFresh(false);
    setCrop(h.crop);
    setPhoto(h.thumb);
    showResult(h.result, h.lang);
  }

  function deletePast(id: string) {
    setHistory(removeHistory(id));
  }

  async function speakResult(text: string, auto = false) {
    const code = resultLang.current;
    const bcp47 = getLanguage(code).speech;
    // Start speaking as the stamp lands, not before.
    const wait = () => new Promise((r) => setTimeout(r, Math.max(0, stampAt.current - clock())));
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang: code }),
      });
      if (!res.ok) throw new Error();
      const { audio } = await res.json();
      setAudioUrl(audio);
      await wait();
      // The farmer may have turned automatic speaking off while the voice was being made.
      if (auto && !voiceRef.current) return;
      setTimeout(() => player.current?.play().catch(() => {}), 50);
    } catch {
      await wait();
      if (auto && !voiceRef.current) return;
      sayNow(text, bcp47);
    }
  }

  function listenAgain() {
    if (audioUrl && player.current) {
      player.current.currentTime = 0;
      player.current.play().catch(() => sayNow(result?.words.spoken ?? "", getLanguage(resultLang.current).speech));
    } else if (result) {
      stampAt.current = 0;
      speakResult(result.words.spoken);
    }
  }

  function shareText() {
    if (!result) return "";
    const lines = [
      `*${result.words.headline}*`,
      ...result.words.products.map((p) => `• ${result.audit.products[p.id]?.written ?? ""}: ${p.line}`),
      "",
      ...result.words.whatToDo.map((x) => `- ${x}`),
      "",
      `Parchi: ${typeof window !== "undefined" ? window.location.origin : ""}`,
    ];
    return lines.join("\n");
  }

  if (!ready) {
    return (
      <main className="ruled grain flex min-h-dvh items-center justify-center" aria-busy="true">
        <LogoMark size={96} />
      </main>
    );
  }

  const level = result?.audit.level ?? "ok";
  const stampWord = level === "danger" ? s.stop : level === "careful" ? s.careful : s.ok;
  const nProducts = result?.words.products.length ?? 0;
  const afterRows = AFTER_STAMP + 80 + Math.min(nProducts, 4) * 50;

  return (
    <main className="ruled grain relative flex min-h-dvh flex-col" lang={lang.speech}>
      <audio ref={player} src={audioUrl ?? undefined} preload="auto" />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target)} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target)} />

      <header className="relative z-20 flex h-16 items-center justify-between gap-2 px-3 min-[400px]:h-[72px] min-[400px]:px-4">
        <button
          onClick={() => {
            runId.current++;
            setStep(step === "lang" ? "lang" : "crop");
          }}
          className="-ml-1 rounded-xl p-1"
          aria-label="Parchi: home"
        >
          <Logo size={46} textClassName="max-[419px]:hidden" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoVoice}
            aria-pressed={voiceOn}
            aria-label={s.readAloud}
            title={s.readAloud}
            className={`press-sm relative flex h-12 w-[4.25rem] shrink-0 items-center rounded-full border-2 border-ink px-1 ${voiceOn ? "bg-ok/15" : "bg-paper-2"}`}
          >
            <span
              className={`knob flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink ${voiceOn ? "translate-x-[1.35rem] bg-ok text-white" : "bg-white text-ink-soft"}`}
            >
              {voiceOn ? <SpeakerIcon size={20} /> : <SpeakerOffIcon size={20} />}
            </span>
          </button>
          {step !== "lang" && <LanguagePicker lang={lang} onPick={switchLang} />}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-3 pb-6 min-[400px]:px-4">
        {step === "lang" && (
          <section className="screen">
            <h1 className="mt-1 mb-5 text-[1.85rem] leading-tight font-extrabold" lang="hi">
              अपनी भाषा चुनें
              <span className="block text-lg font-semibold text-ink-soft" lang="en">
                Choose your language
              </span>
            </h1>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => pickLang(l)}
                  lang={l.speech}
                  className="press flex min-h-[4.75rem] flex-col justify-center rounded-2xl border-2 border-ink bg-white/80 px-4 py-2 text-left last:odd:col-span-2"
                >
                  <span className="block text-[1.6rem] leading-tight font-bold">{l.name}</span>
                  {l.english !== l.name && (
                    <span className="text-sm font-semibold text-ink-soft" lang="en">
                      {l.english}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "crop" && (
          <section className="screen">
            <Prompt text={s.whichCrop} listen={s.listen} onSpeak={() => sayNow(s.whichCrop, lang.speech)} />
            <div className="grid grid-cols-3 gap-2.5 min-[400px]:gap-3">
              {(allCrops ? CROP_LIST : CROP_LIST.slice(0, 5)).map((c) => (
                <button
                  key={c}
                  onClick={() => pickCrop(c)}
                  className="press flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-ink bg-white/85 px-1"
                >
                  <CropIcon crop={c} size={58} />
                  <span className="text-center text-[clamp(0.95rem,4.4vw,1.2rem)] leading-tight font-bold">{CROP_NAMES[lang.code][c]}</span>
                </button>
              ))}
              {!allCrops && (
                <button
                  onClick={() => setAllCrops(true)}
                  className="press flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink bg-paper-2 px-1"
                >
                  <MoreCropsIcon />
                  <span className="text-center text-[clamp(0.95rem,4.4vw,1.2rem)] leading-tight font-bold">{s.moreCrops}</span>
                </button>
              )}
            </div>
            {history.length > 0 && (
              <PastChecks items={history} lang={lang} onOpen={openPast} onDelete={deletePast} />
            )}
          </section>
        )}

        {step === "snap" && crop && (
          <section className="screen flex flex-1 flex-col">
            <button
              onClick={() => setStep("crop")}
              className="press-sm mb-1 flex min-h-12 items-center gap-2 self-start rounded-full border-2 border-ink bg-white py-1 pr-4 pl-1.5 text-lg font-bold"
              aria-label={`${s.whichCrop} ${CROP_NAMES[lang.code][crop]}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-2">
                <CropIcon crop={crop} size={32} />
              </span>
              {CROP_NAMES[lang.code][crop]}
              <PencilIcon size={18} className="text-ink-soft" />
            </button>
            <Prompt text={s.takePhoto} listen={s.listen} onSpeak={() => sayNow(s.takePhoto, lang.speech)} />

            <div className="mx-auto mt-2 rounded-full p-2.5 ring-[10px] ring-leaf/15">
              <button
                onClick={() => {
                  setCamTapped(true);
                  camRef.current?.click();
                }}
                className={`press-big flex h-[min(58vw,34svh,14rem)] w-[min(58vw,34svh,14rem)] flex-col items-center justify-center rounded-full border-4 border-ink bg-leaf text-white ${camTapped ? "" : "breathe"}`}
                aria-label={s.takePhoto}
              >
                <CameraIcon size={64} />
                <span className="mt-1 px-6 text-center text-[clamp(0.95rem,4.4vw,1.25rem)] leading-tight font-bold">{s.takePhoto}</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => galRef.current?.click()} className="press flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-ink bg-white/85 p-3">
                <GalleryIcon size={34} />
                <span className="text-base leading-tight font-bold">{s.gallery}</span>
              </button>
              <button
                onClick={toggleVoice}
                aria-pressed={recording}
                className={`press flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-ink p-3 ${recording ? "bg-danger text-white" : voice ? "bg-ok text-white" : "bg-white/85"}`}
              >
                <span className="relative flex h-[34px] items-center">
                  {recording ? <StopIcon size={34} /> : voice ? <CheckIcon size={34} /> : <MicIcon size={34} />}
                  {recording && <span className="rec-dot absolute -top-1 -right-3 h-3 w-3 rounded-full bg-white" />}
                </span>
                <span className="text-base leading-tight font-bold">{recording ? s.stop : s.sayProblem}</span>
              </button>
            </div>

            <button
              onClick={useExample}
              className="mx-auto mt-auto flex min-h-12 items-center gap-2 pt-6 text-lg font-bold text-ink-soft underline decoration-dotted decoration-2 underline-offset-[6px]"
            >
              {s.example}
              <ArrowRightIcon size={20} />
            </button>
          </section>
        )}

        {step === "checking" && photo && (
          <section className="screen mt-1" aria-busy="true">
            <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[6px_6px_0_0_var(--ink)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="max-h-[42vh] w-full object-cover object-top" />
              <span className="corner top-3 left-3 border-t-4 border-l-4" />
              <span className="corner top-3 right-3 border-t-4 border-r-4" />
              <span className="corner bottom-3 left-3 border-b-4 border-l-4" />
              <span className="corner right-3 bottom-3 border-r-4 border-b-4" />
              <div className="scan pointer-events-none absolute inset-0" aria-hidden>
                <div className="h-1 w-full bg-leaf/80" />
                <div className="h-10 w-full bg-gradient-to-b from-leaf/25 to-transparent" />
              </div>
            </div>
            <ol className="mt-6 space-y-2" aria-live="polite">
              {[s.stepRead, s.checking, s.stepAnswer].map((label, i) => {
                const state = i < checkPhase ? "done" : i === checkPhase ? "now" : "todo";
                const Icon = [ChitIcon, LedgerIcon, SpeakerIcon][i];
                return (
                  <li
                    key={i}
                    aria-current={state === "now" ? "step" : undefined}
                    className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-3 py-2 transition-opacity duration-300 ${
                      state === "now" ? "border-ink bg-white" : state === "done" ? "border-transparent" : "border-transparent opacity-45"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                        state === "done" ? "pop border-ok bg-ok text-white" : state === "now" ? "border-ink bg-ink text-paper" : "border-ink-soft text-ink-soft"
                      }`}
                    >
                      {state === "done" ? <CheckIcon size={22} /> : <Icon size={22} />}
                    </span>
                    <span className={`text-lg leading-snug ${state === "now" ? "font-extrabold" : "font-semibold"}`}>{label}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 flex items-center gap-1.5 pl-3 text-sm font-semibold text-ink-soft" lang="en">
              <LedgerIcon size={16} /> CIB&amp;RC · Govt. of India
            </p>
          </section>
        )}

        {step === "error" && (
          <section className="screen mt-2 flex flex-1 flex-col items-center text-center">
            <div className="mt-4">
              <BlurryChitArt size={150} />
            </div>
            <div className="mt-4 flex w-full items-center gap-3 text-left">
              <p className="flex-1 text-[1.65rem] leading-tight font-extrabold" role="alert">
                {s.errRead}
              </p>
              <SpeakButton label={s.listen} onClick={() => sayNow(s.errRead, lang.speech)} />
            </div>
            <button
              onClick={() => setStep("snap")}
              className="press-big mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-ink bg-leaf py-4 text-2xl font-bold text-white"
            >
              <CameraIcon size={34} />
              {s.takePhoto}
            </button>
          </section>
        )}

        {step === "result" && result && photo && (
          <section className="screen mt-1">
            <div className="thud relative overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[6px_6px_0_0_var(--ink)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-[clamp(10rem,32svh,16rem)] w-full object-cover object-top opacity-60 grayscale-[35%]" />
              <div className="absolute inset-0 bg-gradient-to-b from-paper/10 via-paper/40 to-paper/10" />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className={`stamp flex max-w-full items-center gap-3 ${LEVEL_COLOR[level]}`} role="img" aria-label={stampWord}>
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white ${LEVEL_BG[level]}`}>
                    <LevelIcon level={level} size={38} />
                  </span>
                  <span className="py-1 text-[clamp(2.1rem,11vw,3.1rem)] leading-[1.15]">{stampWord}</span>
                </div>
              </div>
            </div>

            <div className="reveal mt-6 flex items-center gap-3" style={at(AFTER_STAMP)}>
              <h2 className={`flex-1 text-[clamp(1.5rem,7vw,2rem)] leading-[1.2] font-extrabold ${LEVEL_COLOR[level]}`}>{result.words.headline}</h2>
              <button
                onClick={listenAgain}
                className={`press flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink text-white ${LEVEL_BG[level]}`}
                aria-label={s.listen}
              >
                <SpeakerIcon size={32} />
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {result.words.products.map((p, i) => {
                const prod = result.audit.products[p.id];
                if (!prod) return null;
                return (
                  <li
                    key={p.id}
                    style={at(AFTER_STAMP + 80 + Math.min(i, 3) * 50)}
                    className="reveal relative flex gap-3 overflow-hidden rounded-2xl border-2 border-ink bg-white/90 py-3 pr-3 pl-4"
                  >
                    <span className={`absolute inset-y-0 left-0 w-1.5 ${LEVEL_BG[prod.level]}`} aria-hidden />
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${LEVEL_BG[prod.level]}`}>
                      <LevelIcon level={prod.level} size={24} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg leading-snug font-extrabold" lang="en">
                        {prod.written}
                      </p>
                      <p className="text-lg leading-snug">{p.line}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="reveal" style={at(afterRows)}>
              {fresh && (result.audit.waterAssumed || askPumps) && (
                <PumpQuestion s={s} current={pumps} onSpeak={() => sayNow(s.pumpQuestion, lang.speech)} onPick={answerPumps} />
              )}
              {fresh && result.audit.pumpsPerAcre && !askPumps && (
                <button
                  onClick={() => setAskPumps(true)}
                  className="press-sm mt-4 flex min-h-12 items-center gap-2 rounded-full border-2 border-ink bg-white py-1 pr-4 pl-2 text-base font-bold"
                  aria-label={s.pumpQuestion}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-2">
                    <SprayerIcon size={22} />
                  </span>
                  {result.audit.pumpsPerAcre} {s.tanks}
                  <PencilIcon size={16} className="text-ink-soft" />
                </button>
              )}
              {(result.audit.harvestAfter || result.audit.spray) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {result.audit.harvestAfter && (
                    <Fact icon={<BasketIcon size={24} />} tone="bg-careful" top={fmtDate(result.audit.harvestAfter, lang.speech)} bottom={s.pickAfter} />
                  )}
                  {result.audit.spray && (
                    <Fact
                      icon={result.audit.spray.rainSoon ? <RainIcon size={24} /> : <SunCloudIcon size={24} />}
                      tone={result.audit.spray.rainSoon ? "bg-ink-soft" : "bg-leaf"}
                      top={result.audit.spray.best ? fmtTime(result.audit.spray.best.start, lang.speech) : "–"}
                      bottom={s.sprayTime}
                    />
                  )}
                </div>
              )}

              {result.words.whatToDo.length > 0 && (
                <ol className="mt-4 space-y-3 rounded-2xl border-2 border-dashed border-ink/40 bg-paper-2/80 p-4">
                  {result.words.whatToDo.map((x, i) => (
                    <li key={i} className="flex gap-3 text-lg leading-snug">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-leaf text-base font-extrabold text-leaf">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{x}</span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Action icon={<ChitIcon size={34} />} label={s.showDealer} onClick={() => setStep("dealer")} strong />
                <Action icon={<PhoneIcon size={32} />} label={s.callKcc} href={`tel:${KCC_NUMBER}`} />
                <Action icon={<ChatIcon size={32} />} label={s.share} href={`https://wa.me/?text=${encodeURIComponent(shareText())}`} />
                <Action
                  icon={<CameraIcon size={34} />}
                  label={s.again}
                  onClick={() => {
                    setCamTapped(false);
                    setStep("snap");
                  }}
                />
              </div>

              <button
                onClick={() => setShowMore((v) => !v)}
                aria-expanded={showMore}
                aria-controls="more-details"
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-soft py-2 text-lg font-bold text-ink-soft"
              >
                {s.more}
                <ChevronDownIcon size={22} className={`chev ${showMore ? "rotate-180" : ""}`} />
              </button>
              {showMore && <Details audit={result.audit} />}
            </div>
          </section>
        )}

        {step === "dealer" && result && (
          <section className="screen mt-1">
            <div className="perforated lined relative rounded-b-2xl border-2 border-t-0 border-ink bg-[#fffdf6] px-4 pt-7 pb-5 min-[400px]:px-5 shadow-[8px_8px_0_0_var(--ink)]">
              <div className="flex items-center gap-3">
                <LogoMark size={52} />
                <p className="text-sm leading-tight font-bold tracking-widest text-ink-soft uppercase" lang="en">
                  Parchi
                  <span className="block tracking-wide normal-case">CIB&amp;RC, Govt. of India</span>
                </p>
              </div>
              <p className="mt-4 text-[clamp(1.25rem,5.6vw,1.55rem)] leading-snug font-bold" lang={resultBcp}>
                {result.words.dealerCard.local}
              </p>
              <hr className="my-4 border-t-2 border-dashed border-rule" />
              <p className="text-xl leading-snug" lang="en">
                {result.words.dealerCard.english}
              </p>
              <ul className="mt-4 space-y-2" lang="en">
                {result.audit.products
                  .filter((p) => p.level !== "ok")
                  .map((p) => (
                    <li key={p.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-lg font-bold ${LEVEL_COLOR[p.level]} ${LEVEL_TINT[p.level]}`}>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${LEVEL_BG[p.level]}`}>
                        <LevelIcon level={p.level} size={18} />
                      </span>
                      {p.written}
                    </li>
                  ))}
              </ul>
              {result.audit.alternatives.length > 0 && (
                <div className="mt-4 rounded-xl border-2 border-ok/40 bg-ok/5 p-3" lang="en">
                  <p className="text-base font-extrabold text-ok">Approved for this crop (CIB&amp;RC):</p>
                  <ul className="mt-1.5 space-y-1 text-base">
                    {result.audit.alternatives.map((a) => (
                      <li key={a.label} className="flex items-start gap-2">
                        {a.bio ? (
                          <LeafIcon size={18} className="mt-1 shrink-0 text-ok" />
                        ) : (
                          <span className="mt-2.5 ml-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                        )}
                        <span className={a.bio ? "" : "pl-1"}>{a.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setStep("result")}
              className="press mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-white py-3 text-xl font-bold"
            >
              <ArrowLeftIcon size={24} />
              {s.back}
            </button>
          </section>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-1 pb-3 text-sm text-ink-soft" lang="en">
        <Link href="/inspector" className="inline-flex min-h-11 items-center px-2 underline underline-offset-2">
          For state officials
        </Link>
        <span aria-hidden>·</span>
        <Link href="/about" className="inline-flex min-h-11 items-center px-2 underline underline-offset-2">
          About &amp; data sources
        </Link>
      </footer>
    </main>
  );
}

// Saved checks on the home (crop) screen: a sideways strip of small chits with their verdict.
function PastChecks({
  items,
  lang,
  onOpen,
  onDelete,
}: {
  items: SavedCheck[];
  lang: Language;
  onOpen: (h: SavedCheck) => void;
  onDelete: (id: string) => void;
}) {
  const [asking, setAsking] = useState<string | null>(null);
  const s = lang.s;
  return (
    <div className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold">
        <HistoryIcon size={24} />
        {s.pastChecks}
      </h2>
      <ul className="-mr-4 flex snap-x gap-3 overflow-x-auto pr-4 pb-4">
        {items.map((h) => {
          const lv = h.result.audit.level;
          const when = new Date(h.ts).toLocaleDateString(lang.speech, { day: "numeric", month: "short" });
          const word = lv === "danger" ? s.stop : lv === "careful" ? s.careful : s.ok;
          return (
            <li key={h.id} className="relative w-36 shrink-0 snap-start">
              <button
                onClick={() => onOpen(h)}
                aria-label={`${word}, ${CROP_NAMES[lang.code][h.crop]}, ${when}`}
                className="press flex w-full flex-col overflow-hidden rounded-2xl border-2 border-ink bg-white text-left"
              >
                <span className="relative block h-24 w-full border-b-2 border-ink bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.thumb} alt="" className="h-full w-full object-cover object-top opacity-80" />
                  <span className={`absolute bottom-1.5 left-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white ${LEVEL_BG[lv]}`}>
                    <LevelIcon level={lv} size={22} />
                  </span>
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1.5">
                  <CropIcon crop={h.crop} size={30} />
                  <span className="text-base leading-tight font-bold">{when}</span>
                </span>
              </button>
              <button
                onClick={() => setAsking(h.id)}
                aria-label={s.deleteCheck}
                className="absolute -top-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-white text-ink">
                  <CrossIcon size={14} />
                </span>
              </button>
              {asking === h.id && (
                <div
                  role="alertdialog"
                  aria-label={s.deleteCheck}
                  className="fade absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-paper p-2 text-center"
                >
                  <p className="text-sm leading-tight font-bold">{s.deleteCheck}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setAsking(null);
                        onDelete(h.id);
                      }}
                      aria-label={s.deleteCheck}
                      className="press-sm flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-danger text-white"
                    >
                      <TrashIcon size={22} />
                    </button>
                    <button
                      onClick={() => setAsking(null)}
                      aria-label={s.back}
                      className="press-sm flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-white"
                      autoFocus
                    >
                      <ArrowLeftIcon size={22} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// One picture question that turns a "2 ml per litre" chit into a real dose: how many knapsack
// tanks does this farmer spray on one acre?
const PUMP_CHOICES = [5, 8, 10, 12, 15, 20];
function PumpQuestion({ s, current, onSpeak, onPick }: { s: Language["s"]; current: number | null; onSpeak: () => void; onPick: (n: number) => void }) {
  return (
    <div className="fade mt-4 rounded-2xl border-2 border-ink bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-careful text-white">
          <SprayerIcon size={28} />
        </span>
        <p className="flex-1 text-lg leading-snug font-extrabold">{s.pumpQuestion}</p>
        <SpeakButton label={s.listen} onClick={onSpeak} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {PUMP_CHOICES.map((n) => (
          <button
            key={n}
            onClick={() => onPick(n)}
            aria-pressed={current === n}
            className={`press-sm flex min-h-14 flex-col items-center justify-center rounded-xl border-2 border-ink ${current === n ? "bg-ink text-paper" : "bg-paper"}`}
          >
            <span className="text-2xl leading-none font-extrabold">{n}</span>
            <span className="text-sm leading-tight font-semibold">{s.tanks}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Three small tiles stacked, with a plus: "there are more crops in here".
function MoreCropsIcon() {
  return (
    <svg width={58} height={58} viewBox="0 0 64 64" aria-hidden>
      <rect x="10" y="10" width="19" height="19" rx="5" fill="#fff" stroke="#1f2a44" strokeWidth="3" />
      <rect x="35" y="10" width="19" height="19" rx="5" fill="#fff" stroke="#1f2a44" strokeWidth="3" />
      <rect x="10" y="35" width="19" height="19" rx="5" fill="#fff" stroke="#1f2a44" strokeWidth="3" />
      <circle cx="44.5" cy="44.5" r="10.5" fill="#2f6b3a" stroke="#1f2a44" strokeWidth="3" />
      <path d="M44.5 39v11M39 44.5h11" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function SpeakButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press-sm flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white" aria-label={label}>
      <SpeakerIcon size={28} />
    </button>
  );
}

function Prompt({ text, listen, onSpeak }: { text: string; listen: string; onSpeak: () => void }) {
  return (
    <div className="mt-1 mb-5 flex items-center gap-3">
      <h1 className="flex-1 text-[clamp(1.5rem,7.2vw,2rem)] leading-[1.2] font-extrabold">{text}</h1>
      <SpeakButton label={listen} onClick={onSpeak} />
    </div>
  );
}

function Fact({ icon, tone, top, bottom }: { icon: React.ReactNode; tone: string; top: string; bottom: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-ink bg-white/90 p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${tone}`}>{icon}</span>
        <p className="text-sm leading-tight font-semibold text-ink-soft">{bottom}</p>
      </div>
      <p className="text-[1.4rem] leading-tight font-extrabold">{top}</p>
    </div>
  );
}

function Action({ icon, label, onClick, href, strong }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string; strong?: boolean }) {
  const cls = `press flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-ink p-3 text-center ${strong ? "bg-ink text-paper" : "bg-white/90"}`;
  const inner = (
    <>
      {icon}
      <span className="text-base leading-tight font-bold">{label}</span>
    </>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Details({ audit }: { audit: Audit }) {
  return (
    <div id="more-details" className="fade mt-3 divide-y-2 divide-dashed divide-rule rounded-2xl border-2 border-ink bg-white/95 text-base leading-snug" lang="en">
      {audit.products.map((p) => (
        <div key={p.id} className="p-4">
          <p className="flex items-start gap-2 font-extrabold">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${LEVEL_BG[p.level]}`}>
              <LevelIcon level={p.level} size={15} />
            </span>
            <span>
              {p.id + 1}. {p.written}
              <span className="block text-sm font-semibold text-ink-soft">
                {p.actives.map((a) => `${a.display}${a.percent ? ` ${a.percent}%` : ""}${a.whoClass ? `, WHO ${a.whoClass}` : ""}`).join(" + ")}
              </span>
            </span>
          </p>
          {p.flags.length === 0 && (
            <p className="mt-2 flex items-center gap-2 text-ok">
              <CheckIcon size={18} className="shrink-0" /> Matches the CIB&amp;RC approved uses for this crop.
            </p>
          )}
          <ul className="mt-2 space-y-2">
            {p.flags.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className={`mt-0.5 shrink-0 ${LEVEL_COLOR[f.level]}`}>
                  <LevelIcon level={f.level} size={18} />
                </span>
                <span>
                  {f.detail}
                  {f.source && <span className="mt-0.5 block text-sm text-ink-soft">Source: {f.source.split(", http")[0]}</span>}
                </span>
              </li>
            ))}
          </ul>
          {(p.registeredPests.length > 0 || p.approvedDose || p.waitingDays != null) && (
            <dl className="mt-2 space-y-0.5 rounded-lg bg-paper-2/70 px-3 py-2 text-sm">
              {p.registeredPests.length > 0 && <Row k="Approved on this crop for" v={p.registeredPests.slice(0, 4).join("; ")} />}
              {p.approvedDose && <Row k="Approved dose" v={p.approvedDose} />}
              {p.waitingDays != null && <Row k="Waiting period before harvest" v={`${p.waitingDays} days`} />}
            </dl>
          )}
        </div>
      ))}
      {audit.global.length > 0 && (
        <ul className="space-y-2 p-4">
          {audit.global.map((g, i) => (
            <li key={i} className="flex gap-2">
              <AlertIcon size={18} className="mt-0.5 shrink-0 text-careful" />
              {g.detail}
            </li>
          ))}
        </ul>
      )}
      {audit.alternatives.length > 0 && (
        <div className="p-4">
          <p className="font-extrabold">Safer approved options for this crop</p>
          <ul className="mt-2 space-y-2">
            {audit.alternatives.map((a) => (
              <li key={a.label} className="flex gap-2">
                {a.bio ? <LeafIcon size={18} className="mt-0.5 shrink-0 text-ok" /> : <span className="mt-2 mr-1 ml-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />}
                <span>
                  <strong>{a.label}</strong>: {a.pest}. {a.dose}
                  {a.waitingDays != null && `. Wait ${a.waitingDays} days before harvest`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="p-4 text-sm text-ink-soft">Checked against: {audit.dataAsOf}. Gemini reads the chit; the verdict comes from the government records above.</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline font-bold">{k}: </dt>
      <dd className="inline">{v}</dd>
    </div>
  );
}

function fmtDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function fmtTime(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, { weekday: "short", hour: "numeric" });
  } catch {
    return iso;
  }
}
