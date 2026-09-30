"use client";

// Saved checks, kept only on this phone (localStorage), so a farmer can reopen a past result
// without data or a new check. Newest first, at most 20. Voice notes are never stored.

import type { LangCode } from "@/lib/i18n";
import type { CropId } from "@/lib/crops";
import type { Audit } from "@/lib/rules";
import type { Explanation, Extraction } from "@/lib/gemini";

export interface Result {
  extraction: Extraction;
  audit: Audit;
  words: Explanation;
}

export interface SavedCheck {
  id: string;
  ts: number;
  crop: CropId;
  lang: LangCode;
  thumb: string; // small JPEG data URL
  result: Result;
  // Where the "Your field" line looked (rounded to about 1 km), so a reopened check shows it too.
  // Older saved checks don't have it.
  field?: { lat: number; lon: number; place?: string };
}

const KEY = "parchi.history";
const MAX = 20;

export function loadHistory(): SavedCheck[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedCheck[]) : [];
    return Array.isArray(list) ? list.filter((x) => x && x.id && x.result && x.thumb) : [];
  } catch {
    return [];
  }
}

// Write the list; if the browser runs out of space, drop the oldest entries and try again.
function write(list: SavedCheck[]): SavedCheck[] {
  let l = list.slice(0, MAX);
  while (l.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(l));
      return l;
    } catch {
      l = l.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  return [];
}

export function addHistory(entry: SavedCheck): SavedCheck[] {
  return write([entry, ...loadHistory().filter((x) => x.id !== entry.id)]);
}

export function removeHistory(id: string): SavedCheck[] {
  return write(loadHistory().filter((x) => x.id !== id));
}

// A 320 px wide JPEG (about 15 to 25 KB) of the photo for the history strip.
export async function makeThumb(src: string, width = 320, quality = 0.6): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const scale = Math.min(1, width / img.width);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", quality);
}
