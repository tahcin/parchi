"use client";

// Shrink camera photos before upload: cheap phones take 12 MP pictures and rural data is slow.
export async function compressImage(file: Blob, maxSide = 1600, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Record a short voice note and return it as a 16 kHz mono WAV data URL (a format Gemini accepts
// from every browser, unlike webm).
export async function startRecording(): Promise<() => Promise<string | null>> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return () =>
    new Promise((resolve) => {
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        try {
          const buf = await new Blob(chunks).arrayBuffer();
          const ctx = new AudioContext();
          const decoded = await ctx.decodeAudioData(buf);
          const rate = 16000;
          const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * rate), rate);
          const src = off.createBufferSource();
          src.buffer = decoded;
          src.connect(off.destination);
          src.start();
          const out = await off.startRendering();
          resolve(toWavDataUrl(out.getChannelData(0), rate));
        } catch {
          resolve(null);
        }
      };
      rec.stop();
    });
}

function toWavDataUrl(samples: Float32Array, rate: number): string {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  w(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

// Instant speech for short UI prompts, using the phone's own voices.
export function sayNow(text: string, bcp47: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = bcp47;
    u.rate = 0.9;
    const voice = synth.getVoices().find((v) => v.lang.replace("_", "-").startsWith(bcp47.slice(0, 2)));
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch {
    /* speech is a nice-to-have */
  }
}
