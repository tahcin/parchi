"use client";

import { useSyncExternalStore } from "react";

// A slim, calm strip at the top while the phone has no data. It says only what still works:
// past checks are stored on the phone, so they open without internet.

const MESSAGES: Record<string, string> = {
  hi: "इंटरनेट नहीं है। पिछली जाँचें देख सकते हैं।",
  mr: "इंटरनेट नाही. मागील तपासण्या पाहू शकता.",
  te: "ఇంటర్నెట్ లేదు. గత తనిఖీలను చూడవచ్చు.",
  kn: "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ. ಹಿಂದಿನ ಪರಿಶೀಲನೆಗಳನ್ನು ನೋಡಬಹುದು.",
  ta: "இணையம் இல்லை. முந்தைய சோதனைகளைப் பார்க்கலாம்.",
  gu: "ઇન્ટરનેટ નથી. અગાઉની તપાસ જોઈ શકો છો.",
  pa: "ਇੰਟਰਨੈੱਟ ਨਹੀਂ ਹੈ। ਪਿਛਲੀਆਂ ਜਾਂਚਾਂ ਦੇਖ ਸਕਦੇ ਹੋ।",
  bn: "ইন্টারনেট নেই। আগের পরীক্ষাগুলো দেখতে পারেন।",
  or: "ଇଣ୍ଟରନେଟ୍ ନାହିଁ। ପୂର୍ବ ଯାଞ୍ଚ ଦେଖିପାରିବେ।",
  ml: "ഇന്റർനെറ്റ് ഇല്ല. മുമ്പത്തെ പരിശോധനകൾ കാണാം.",
  en: "No internet. You can still see past checks.",
};

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// The language the farmer picked, saved by the home screen. Falls back to English.
function savedLang(): string {
  try {
    const code = localStorage.getItem("parchi.lang");
    return code && code in MESSAGES ? code : "en";
  } catch {
    return "en";
  }
}

// Snapshot is "online" or the language code to show; re-read on every connectivity change.
function snapshot(): string {
  return navigator.onLine ? "online" : savedLang();
}

export function OfflineBanner() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "online");
  if (state === "online") return null;
  return (
    <div
      role="status"
      aria-live="polite"
      lang={state}
      className="drop-in sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-rule bg-paper-2 px-4 pt-[max(0.4rem,env(safe-area-inset-top))] pb-1.5 text-[0.95rem] leading-snug font-semibold text-ink-soft"
    >
      <CloudOff />
      <span>{MESSAGES[state]}</span>
    </div>
  );
}

// A cloud with a slash through it, drawn to match the app's stroke icons.
function CloudOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M7.5 8.2A5.5 5.5 0 0 0 5.6 18.5H16" />
      <path d="M10.3 6.4A5.5 5.5 0 0 1 17 9.2h.6a3.9 3.9 0 0 1 2.9 6.6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}
