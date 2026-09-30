"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { CheckIcon, ChevronDownIcon } from "./icons";

// Header language switch: a pill showing the current language in its own script that opens a
// list of all eleven. Closes on outside tap, Escape or Tab; arrow keys move, Enter picks.
export function LanguagePicker({ lang, onPick }: { lang: Language; onPick: (l: Language) => void }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const opts = useRef<(HTMLLIElement | null)[]>([]);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const i = Math.max(0, LANGUAGES.findIndex((l) => l.code === lang.code));
    opts.current[i]?.focus();
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, lang.code]);

  // Close faster than it opens: a 100 ms fade-out, then unmount.
  function close(refocus = true) {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 100);
    if (refocus) trigger.current?.focus();
  }

  function pick(l: Language) {
    onPick(l);
    close();
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    const n = LANGUAGES.length;
    const go = (j: number) => opts.current[(j + n) % n]?.focus();
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(n - 1);
    else if (e.key === "Enter" || e.key === " ") pick(LANGUAGES[i]);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") return close(false);
    else return;
    e.preventDefault();
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${lang.s.chooseLanguage}: ${lang.name}`}
        className={`press-sm flex min-h-12 items-center gap-1.5 rounded-full border-2 border-ink py-1 pr-2 pl-1.5 text-lg font-bold ${open ? "bg-ink text-paper" : "bg-white"}`}
      >
        <span
          aria-hidden
          className={`flex h-8 w-8 items-center justify-center rounded-full text-[0.95rem] max-[370px]:hidden leading-none font-extrabold ${open ? "bg-paper text-ink" : "bg-ink text-paper"}`}
        >
          अ
        </span>
        <span className="max-w-[6rem] truncate py-0.5 leading-[1.4]">{lang.name}</span>
        <ChevronDownIcon size={20} className={`chev ${open && !closing ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`${closing ? "drop-out" : "drop-in"} absolute top-full right-0 z-50 mt-3 w-[min(19rem,calc(100vw-2.5rem))] origin-top-right overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[6px_6px_0_0_var(--ink)]`}>
          <p className="border-b-2 border-dashed border-rule px-4 pt-3 pb-2 text-base font-bold text-ink-soft">{lang.s.chooseLanguage}</p>
          <ul id={listId} role="listbox" aria-label={lang.s.chooseLanguage} className="max-h-[min(40rem,calc(100dvh-7rem))] overflow-y-auto overscroll-contain py-1">
            {LANGUAGES.map((l, i) => {
              const on = l.code === lang.code;
              return (
                <li
                  key={l.code}
                  ref={(el) => {
                    opts.current[i] = el;
                  }}
                  role="option"
                  aria-selected={on}
                  tabIndex={-1}
                  lang={l.speech}
                  onClick={() => pick(l)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`mx-1.5 flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-xl px-3 outline-none focus-visible:bg-ink focus-visible:text-paper hover:bg-paper-2 ${on ? "bg-paper-2" : ""}`}
                >
                  <span className="flex-1 py-1 text-[1.35rem] leading-[1.35] font-bold">{l.name}</span>
                  {l.english !== l.name && <span className="text-sm opacity-70">{l.english}</span>}
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${on ? "bg-ok text-white" : "border-2 border-rule"}`}
                  >
                    {on && <CheckIcon size={18} />}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
