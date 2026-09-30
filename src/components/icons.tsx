// Parchi icon set. Two families:
// 1. Crop illustrations: flat, two or three colours, thick carbon-ink outline, 64x64.
// 2. UI icons: single-colour line icons on a 24x24 grid that inherit currentColor.
// Everything is decorative (aria-hidden); the button or text next to it carries the meaning.

import type { CropId } from "@/lib/crops";
import type { Level } from "@/lib/rules";

const INK = "#1f2a44";

type SvgProps = { size?: number; className?: string };

/* ------------------------------------------------------------------ */
/* Crop illustrations                                                  */
/* ------------------------------------------------------------------ */

// Outline trick for overlapping blobs: draw every shape with a double-width ink stroke first,
// then draw the same shapes again filled with no stroke. Only the outer silhouette keeps its line.
function Blobs({ children, fill }: { children: React.ReactNode; fill: string }) {
  return (
    <>
      <g fill={INK} stroke={INK} strokeWidth="6" strokeLinejoin="round">
        {children}
      </g>
      <g fill={fill}>{children}</g>
    </>
  );
}

function Paddy({ size = 64, className }: SvgProps) {
  // A paddy plant: long leaves from the base and a ripe panicle drooping under the weight of grain.
  const grains: [number, number, number][] = [
    [30.5, 30, -12],
    [36.5, 27, 18],
    [32, 22, -20],
    [38.5, 19.5, 26],
    [35, 14, -8],
    [42, 13.5, 40],
    [45.5, 19.5, 70],
    [49.5, 16, 55],
    [50.5, 23.5, 80],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M31 60 C26 48 17 40 7 36 C18 36 28 43 34 57 Z" fill="#4f8f3a" />
        <path d="M34 60 C38 47 46 39 57 35 C48 42 41 50 38 60 Z" fill="#6aa84a" />
        <path d="M32 60 C32 44 32 30 36 18 C39 11 46 9 51 14 C54 18 53 24 51 28" fill="none" />
      </g>
      <g stroke={INK} strokeWidth="2.2" fill="#e8b43a">
        {grains.map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx="3" ry="5" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
    </svg>
  );
}

function Cotton({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <path d="M32 62 V50" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" fill="#9a6a3a">
        <path d="M32 52 L12 50 L20 40 Z" />
        <path d="M32 52 L52 50 L44 40 Z" />
        <path d="M32 54 L24 42 L40 42 Z" />
      </g>
      <Blobs fill="#fffaf0">
        <circle cx="20" cy="31" r="11" />
        <circle cx="44" cy="31" r="11" />
        <circle cx="32" cy="19" r="12" />
        <circle cx="32" cy="36" r="11" />
      </Blobs>
      <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.55">
        <path d="M24 26 C27 29 29 30 32 30" />
        <path d="M40 26 C37 29 35 30 32 30" />
        <path d="M32 30 V38" />
      </g>
    </svg>
  );
}

function Chilli({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M17 20 C12 36 26 55 58 58 C42 49 34 36 33 20 Z" fill="#d9453a" />
        <path d="M21 26 C21 36 28 45 38 50" fill="none" stroke="#f3a08a" strokeWidth="3" />
        <path d="M13 20 C18 12 32 12 37 20 C31 24 19 24 13 20 Z" fill="#4f8f3a" />
        <path d="M25 15 C24 9 28 5 34 5" fill="none" />
      </g>
    </svg>
  );
}

function Tomato({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 18 C14 16 6 28 8 40 C10 52 21 59 32 59 C43 59 54 52 56 40 C58 28 50 16 32 18 Z" fill="#d9453a" />
        <path d="M15 34 C16 28 20 25 24 24" fill="none" stroke="#f3a08a" strokeWidth="3.5" />
        <path d="M32 22 L24 26 L26 19 L18 16 L27 14 L32 8 L37 14 L46 16 L38 19 L40 26 Z" fill="#4f8f3a" />
        <path d="M32 12 C32 8 34 5 38 4" fill="none" />
      </g>
    </svg>
  );
}

function Brinjal({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M24 22 C10 30 8 50 20 58 C32 64 50 56 50 40 C50 30 44 22 36 19 Z" fill="#6f3f94" />
        <path d="M17 42 C17 36 19 32 22 30" fill="none" stroke="#a984c8" strokeWidth="3.5" />
        <path d="M20 24 C22 16 30 12 40 14 C44 18 44 22 42 26 L36 22 L32 28 L28 22 Z" fill="#4f8f3a" />
        <path d="M34 14 C35 9 39 6 44 6" fill="none" />
      </g>
    </svg>
  );
}

function Sprout({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M8 58 C12 46 22 42 32 42 C42 42 52 46 56 58 Z" fill="#9a6a3a" />
        <path d="M32 44 V26" fill="none" />
        <path d="M32 30 C30 18 20 12 8 14 C9 26 18 32 32 30 Z" fill="#4f8f3a" />
        <path d="M32 26 C33 14 42 8 56 9 C55 22 46 28 32 26 Z" fill="#6aa84a" />
        <path d="M14 18 C20 20 25 24 29 28" fill="none" strokeWidth="2" opacity="0.5" />
      </g>
    </svg>
  );
}

function Wheat({ size = 64, className }: SvgProps) {
  // An ear of wheat: paired grains up a stalk, each with a long bristle (awn).
  const rows = [30, 23, 16];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 62 V28" fill="none" />
        <path d="M32 52 C24 48 17 41 13 32 C21 34 28 40 32 46 Z" fill="#6aa84a" />
      </g>
      <g stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none">
        {rows.map((y) => (
          <path key={y} d={`M26 ${y - 3} L18 ${y - 13} M38 ${y - 3} L46 ${y - 13}`} />
        ))}
        <path d="M32 6 V1" />
      </g>
      <g stroke={INK} strokeWidth="2.2" fill="#e8b43a">
        {rows.map((y) => (
          <g key={y}>
            <ellipse cx="28" cy={y} rx="3.6" ry="5.5" transform={`rotate(-28 28 ${y})`} />
            <ellipse cx="36" cy={y} rx="3.6" ry="5.5" transform={`rotate(28 36 ${y})`} />
          </g>
        ))}
        <ellipse cx="32" cy="10" rx="3.4" ry="5.2" />
      </g>
    </svg>
  );
}

function Maize({ size = 64, className }: SvgProps) {
  // A corn cob with its kernels showing between two green husks.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 6 C30 3 27 2 24 3 M32 6 C34 3 37 2 40 3" fill="none" />
        <path d="M32 6 C40 6 44 16 44 30 C44 44 39 52 32 52 C25 52 20 44 20 30 C20 16 24 6 32 6 Z" fill="#f2c230" />
      </g>
      <g stroke={INK} strokeWidth="1.6" opacity="0.5" fill="none">
        <path d="M25 14 H39 M23 20 H41 M22 26 H42 M22 32 H42 M23 38 H41" />
        <path d="M27.5 10 V46 M32 7 V48 M36.5 10 V46" />
      </g>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 61 C18 57 10 45 12 22 C18 34 24 42 32 48 Z" fill="#6aa84a" />
        <path d="M32 61 C46 57 54 45 52 22 C46 34 40 42 32 48 Z" fill="#4f8f3a" />
      </g>
    </svg>
  );
}

function Soybean({ size = 64, className }: SvgProps) {
  // A ripe, fuzzy soybean pod with three beans, on a stem with one leaf.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M44 24 C48 18 50 12 52 5" fill="none" />
        <path d="M50 12 C42 4 30 4 24 10 C32 14 42 16 50 12 Z" fill="#4f8f3a" />
      </g>
      <Blobs fill="#c9b36a">
        <circle cx="19" cy="46" r="8.5" />
        <circle cx="29" cy="37" r="8.5" />
        <circle cx="39" cy="28" r="8.5" />
        <ellipse cx="12" cy="54" rx="4" ry="3" transform="rotate(-40 12 54)" />
      </Blobs>
      <g fill="#e4d49a">
        <circle cx="17" cy="44" r="3" />
        <circle cx="27" cy="35" r="3" />
        <circle cx="37" cy="26" r="3" />
      </g>
      <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5">
        <path d="M24 42 L26 44 M34 33 L36 35 M14 50 L16 52" />
      </g>
    </svg>
  );
}

function Groundnut({ size = 64, className }: SvgProps) {
  // A peanut shell with its net pattern, and two red-skinned kernels beside it.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <Blobs fill="#d9a86a">
        <circle cx="22" cy="38" r="12" />
        <circle cx="38" cy="22" r="12" />
        <ellipse cx="30" cy="30" rx="8" ry="7" transform="rotate(-45 30 30)" />
      </Blobs>
      <g stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.45">
        <path d="M14 34 C18 38 22 42 26 46 M18 30 C22 34 26 38 30 42 M30 18 C34 22 38 26 42 30 M34 14 C38 18 42 22 46 26" />
        <path d="M16 42 L28 30 M34 26 L44 16" />
      </g>
      <g stroke={INK} strokeWidth="2.6" fill="#c9604a">
        <ellipse cx="46" cy="51" rx="6.5" ry="4.5" transform="rotate(-25 46 51)" />
        <ellipse cx="55" cy="42" rx="5" ry="6.5" transform="rotate(-25 55 42)" />
      </g>
    </svg>
  );
}

function Sugarcane({ size = 64, className }: SvgProps) {
  // Three jointed canes with long leaves at the top.
  const canes: [number, number, number][] = [
    [18, 16, -10],
    [30, 12, 0],
    [42, 16, 10],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      {canes.map(([x, y, r]) => (
        <g key={x} transform={`rotate(${r} ${x + 4} 40)`} stroke={INK} strokeWidth="3" strokeLinejoin="round">
          <rect x={x} y={y} width="8" height={62 - y} rx="3" fill="#c7c24e" />
          <path d={`M${x} 26 H${x + 8} M${x} 38 H${x + 8} M${x} 50 H${x + 8}`} strokeWidth="2.4" />
        </g>
      ))}
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M33 14 C27 5 17 2 7 5 C16 7 24 11 30 18 Z" fill="#4f8f3a" />
        <path d="M35 14 C41 5 51 2 59 7 C50 8 43 11 38 18 Z" fill="#6aa84a" />
        <path d="M34 14 C34 9 35 5 37 1" fill="none" />
      </g>
    </svg>
  );
}

function RedGram({ size = 64, className }: SvgProps) {
  // Tur (arhar) pods: flat, beaded green pods with maroon streaks.
  const pod = (x: number, y: number) => [0, 1, 2, 3].map((i) => <circle key={i} cx={x + i * 8} cy={y - i * 8} r="6.5" />);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <Blobs fill="#a7c85a">{pod(10, 44)}</Blobs>
      <Blobs fill="#8fb84a">{pod(28, 50)}</Blobs>
      <g stroke="#8a3a4a" strokeWidth="2.6" strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M${8 + i * 8} ${42 - i * 8} l3 3`} />
            <path d={`M${26 + i * 8} ${48 - i * 8} l3 3`} />
          </g>
        ))}
      </g>
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M37 21 L42 15 M55 27 L60 21" />
      </g>
    </svg>
  );
}

function Chickpea({ size = 64, className }: SvgProps) {
  // Three chana seeds, each with its little beak and crease.
  const seed = "M0 -11 C7 -11 11 -5 11 1 C11 7 6 11 0 11 C-7 11 -11 6 -11 0 C-11 -5 -7 -8 -3 -9 L-1 -14 Z";
  const seeds: [number, number, number][] = [
    [32, 22, 8],
    [20, 43, -24],
    [44, 44, 20],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      {seeds.map(([x, y, r]) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${r})`} stroke={INK} strokeLinejoin="round" strokeLinecap="round">
          <path d={seed} fill="#e2bf85" strokeWidth="3" />
          <path d="M-4 -6 C1 -3 2 4 -1 8" fill="none" strokeWidth="2" opacity="0.5" />
          <path d="M5 -4 C7 -1 7 2 6 4" fill="none" stroke="#f4dcae" strokeWidth="2.6" />
        </g>
      ))}
    </svg>
  );
}

function BlackGram({ size = 64, className }: SvgProps) {
  // Urad: small black seeds with a white eye, in front of a three-part bean leaf.
  const seeds: [number, number, number][] = [
    [20, 44, -20],
    [34, 49, 10],
    [48, 42, 30],
    [27, 33, 5],
    [41, 32, -15],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M32 26 C24 22 18 14 20 4 C28 8 32 16 32 26 Z" fill="#4f8f3a" />
        <path d="M32 26 C26 24 14 24 8 16 C18 12 28 18 32 26 Z" fill="#6aa84a" />
        <path d="M32 26 C38 24 50 24 56 16 C46 12 36 18 32 26 Z" fill="#6aa84a" />
      </g>
      {seeds.map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="7" ry="5.5" fill="#2e2a36" stroke={INK} strokeWidth="3" />
          <path d={`M${x - 3} ${y - 1.5} H${x + 3}`} stroke="#fffaf0" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function Mustard({ size = 64, className }: SvgProps) {
  // Mustard in bloom: a stalk with clusters of small four-petal yellow flowers.
  const flowers: [number, number][] = [
    [32, 11],
    [17, 20],
    [47, 17],
    [24, 32],
    [42, 30],
  ];
  const offsets: [number, number][] = [
    [0, -4],
    [4, 0],
    [0, 4],
    [-4, 0],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none">
        <path d="M32 62 V14 M32 44 L18 22 M32 38 L46 20 M32 50 L24 34 M32 46 L42 32" />
      </g>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M31 60 C22 60 12 54 8 44 C18 44 26 50 31 56 Z" fill="#6aa84a" />
      </g>
      <Blobs fill="#f2c230">
        {flowers.flatMap(([x, y]) =>
          offsets.map(([dx, dy]) => <circle key={`${x}-${dx}-${dy}`} cx={x + dx} cy={y + dy} r="4.2" />),
        )}
      </Blobs>
      <g fill="#c98a0c">
        {flowers.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.8" />
        ))}
      </g>
    </svg>
  );
}

function Sorghum({ size = 64, className }: SvgProps) {
  // Jowar: a tall stalk with broad leaves and a compact head of red-brown grain.
  const head: [number, number][] = [
    [32, 7], [27, 12], [37, 12], [25, 18], [32, 17], [39, 18], [27, 24], [37, 24], [32, 28],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M32 62 V28" fill="none" />
        <path d="M32 54 C24 48 14 46 5 48 C13 41 24 41 32 48 Z" fill="#6aa84a" />
        <path d="M32 44 C40 38 50 36 59 38 C51 31 40 31 32 38 Z" fill="#4f8f3a" />
      </g>
      <Blobs fill="#c0662f">
        {head.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="5.2" />
        ))}
      </Blobs>
      <g fill="#e39a6a">
        <circle cx="29" cy="11" r="1.6" />
        <circle cx="27" cy="18" r="1.6" />
        <circle cx="34" cy="16" r="1.6" />
      </g>
    </svg>
  );
}

function Potato({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M10 34 C8 22 20 12 34 14 C48 15 58 24 55 37 C53 49 42 56 30 54 C18 53 11 45 10 34 Z" fill="#c8955a" />
        <path d="M17 32 C18 26 22 22 28 20" fill="none" stroke="#e6c28f" strokeWidth="3.5" />
      </g>
      <g stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M24 38 q2 -2 4 0 M38 26 q2 -2 4 0 M42 42 q2 -2 4 0 M32 47 q2 -2 4 0" />
      </g>
    </svg>
  );
}

function Onion({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M31 18 C29 11 25 6 19 3 C25 3 31 8 34 15 Z" fill="#6aa84a" />
        <path d="M33 18 C35 10 39 5 46 3 C41 7 38 12 36 18 Z" fill="#4f8f3a" />
        <path d="M32 16 C24 24 11 30 11 43 C11 54 21 60 32 60 C43 60 53 54 53 43 C53 30 40 24 32 16 Z" fill="#b0487a" />
        <path d="M19 42 C19 36 22 31 26 28" fill="none" stroke="#e39ac0" strokeWidth="3.5" />
        <path d="M28 60 l-2 3 M32 60 v3 M36 60 l2 3" fill="none" strokeWidth="2.2" />
      </g>
      <g stroke={INK} strokeWidth="1.8" fill="none" opacity="0.45">
        <path d="M32 20 C26 30 25 46 30 59 M32 20 C38 30 39 46 34 59" />
      </g>
    </svg>
  );
}

function Okra({ size = 64, className }: SvgProps) {
  // Bhindi: a long, ridged green pod with its cap and stalk.
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M20 16 C15 32 22 50 48 61 C39 47 36 31 38 16 Z" fill="#6aa84a" />
        <path d="M22 26 C22 36 26 44 32 50" fill="none" stroke="#b5d98a" strokeWidth="3" />
        <path d="M18 16 C20 9 36 9 40 16 C33 19 25 19 18 16 Z" fill="#4f8f3a" />
        <path d="M29 11 C28 7 30 3 35 2" fill="none" />
      </g>
      <g stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5">
        <path d="M29 19 C28 34 33 48 45 59 M34 19 C33 33 37 47 47 59" />
      </g>
    </svg>
  );
}

function Cabbage({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="32" cy="30" r="21" fill="#b5d98a" />
        <path d="M18 24 C24 16 40 16 46 24 M23 32 C28 27 36 27 41 32" fill="none" strokeWidth="2.2" opacity="0.55" />
        <path d="M5 30 C7 50 19 61 32 61 C45 61 57 50 59 30 C51 37 44 39 38 37 C34 43 30 43 26 37 C20 39 13 37 5 30 Z" fill="#5f9e3f" />
      </g>
      <g stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M32 58 V46 M20 55 L14 44 M44 55 L50 44" />
      </g>
    </svg>
  );
}

function Cauliflower({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <Blobs fill="#fffaf0">
        <circle cx="21" cy="28" r="9.5" />
        <circle cx="32" cy="21" r="10.5" />
        <circle cx="43" cy="28" r="9.5" />
        <circle cx="26" cy="37" r="9.5" />
        <circle cx="38" cy="37" r="9.5" />
      </Blobs>
      <g stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4">
        <path d="M27 20 q3 -3 6 0 M17 28 q3 -3 6 0 M39 27 q3 -3 6 0 M29 33 q3 -3 6 0" />
      </g>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M3 25 C5 44 17 58 32 61 C24 51 20 43 22 36 C15 36 9 32 3 25 Z" fill="#4f8f3a" />
        <path d="M61 25 C59 44 47 58 32 61 C40 51 44 43 42 36 C49 36 55 32 61 25 Z" fill="#6aa84a" />
      </g>
    </svg>
  );
}

function Grapes({ size = 64, className }: SvgProps) {
  const berries: [number, number][] = [
    [20, 24], [31, 23], [42, 24], [25, 34], [36, 34], [47, 33], [30, 44], [41, 44], [35, 54],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M31 17 C31 11 34 6 39 3" fill="none" />
        <path d="M30 14 C24 5 13 5 8 11 C12 12 14 15 12 20 C19 21 26 19 30 14 Z" fill="#6aa84a" />
      </g>
      <Blobs fill="#7b4a9e">
        {berries.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6.3" />
        ))}
      </Blobs>
      <g fill="#b592d4">
        {berries.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x - 2} cy={y - 2} r="1.6" />
        ))}
      </g>
    </svg>
  );
}

function Mango({ size = 64, className }: SvgProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M41 9 C46 3 55 2 61 6 C55 11 47 11 41 9 Z" fill="#4f8f3a" />
        <path d="M38 12 C53 14 59 30 53 44 C47 56 31 61 20 55 C9 49 7 36 13 28 C19 20 27 22 31 17 C33 14 35 12 38 12 Z" fill="#f2b233" />
        <path d="M44 18 C51 22 54 30 52 38" fill="none" stroke="#e8763a" strokeWidth="4" />
        <path d="M18 42 C18 37 20 33 24 31" fill="none" stroke="#f9dc8a" strokeWidth="3.5" />
        <path d="M38 12 C38 8 39 6 41 4" fill="none" />
      </g>
    </svg>
  );
}

export const CROP_ART: Record<CropId, (p: SvgProps) => React.ReactElement> = {
  paddy: Paddy,
  cotton: Cotton,
  chilli: Chilli,
  tomato: Tomato,
  brinjal: Brinjal,
  wheat: Wheat,
  maize: Maize,
  soybean: Soybean,
  groundnut: Groundnut,
  sugarcane: Sugarcane,
  redgram: RedGram,
  chickpea: Chickpea,
  blackgram: BlackGram,
  mustard: Mustard,
  sorghum: Sorghum,
  potato: Potato,
  onion: Onion,
  okra: Okra,
  cabbage: Cabbage,
  cauliflower: Cauliflower,
  grapes: Grapes,
  mango: Mango,
  other: Sprout,
};

export function CropIcon({ crop, size = 64, className }: { crop: CropId } & SvgProps) {
  const Art = CROP_ART[crop] ?? Sprout;
  return <Art size={size} className={className} />;
}

/* ------------------------------------------------------------------ */
/* UI icons                                                            */
/* ------------------------------------------------------------------ */

function Line({ size = 28, className, children, width = 2.2 }: SvgProps & { children: React.ReactNode; width?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const CameraIcon = (p: SvgProps) => (
  <Line {...p} width={1.9}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="4" />
    <path d="M18 11h.01" strokeWidth="2.6" />
  </Line>
);

export const GalleryIcon = (p: SvgProps) => (
  <Line {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="9.5" r="1.8" />
    <path d="M3.5 17.5 9 12.5l3.5 3.2L16 12l4.5 4.5" />
  </Line>
);

export const MicIcon = (p: SvgProps) => (
  <Line {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
  </Line>
);

export const StopIcon = (p: SvgProps) => (
  <Line {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
  </Line>
);

export const SpeakerIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />
  </Line>
);

export const SpeakerOffIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" fill="currentColor" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </Line>
);

export const HistoryIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
    <path d="M3 4v4h4M12 7.5V12l3 2" />
  </Line>
);

export const TrashIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Line>
);

export const ChitIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Line>
);

export const PhoneIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4z" />
  </Line>
);

export const ChatIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.8" />
  </Line>
);

export const BasketIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M3 10h18l-2 9.5a1.5 1.5 0 0 1-1.5 1.2h-11A1.5 1.5 0 0 1 5 19.5z" />
    <path d="M7.5 10 11 4M16.5 10 13 4M9 14v3M12 14v3M15 14v3" />
  </Line>
);

export const RainIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M7 15a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 6.5a4.2 4.2 0 0 1 .5 8.5z" />
    <path d="m8 18-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
  </Line>
);

export const SunCloudIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M9 3v1.5M3.5 9H5M4.9 4.9 6 6M13.1 4.9 12 6" />
    <path d="M6.3 11.5A3.5 3.5 0 1 1 12.4 8" />
    <path d="M9 20a3.5 3.5 0 0 1-.3-7 5 5 0 0 1 9.4-1.4A3.8 3.8 0 0 1 18 20z" />
  </Line>
);

export const LeafIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M5 19C4 11 9 5 20 4c0 11-6 16-13 15z" />
    <path d="M5 19c3-5 6-8 10-10" />
  </Line>
);

export const CheckIcon = (p: SvgProps) => (
  <Line {...p} width={3}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Line>
);

export const CrossIcon = (p: SvgProps) => (
  <Line {...p} width={3}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Line>
);

export const AlertIcon = (p: SvgProps) => (
  <Line {...p} width={3}>
    <path d="M12 5v9" />
    <path d="M12 19h.01" strokeWidth="3.6" />
  </Line>
);

export const ChevronDownIcon = (p: SvgProps) => (
  <Line {...p} width={2.6}>
    <path d="m6 9 6 6 6-6" />
  </Line>
);

export const PencilIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M15.5 4.5l4 4L9 19H5v-4z" />
    <path d="M13 7l4 4" />
  </Line>
);

export const ArrowLeftIcon = (p: SvgProps) => (
  <Line {...p} width={2.6}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Line>
);

export const ArrowRightIcon = (p: SvgProps) => (
  <Line {...p} width={2.6}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Line>
);

export const ExternalIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Line>
);

export const LedgerIcon = (p: SvgProps) => (
  <Line {...p}>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6M9 11h6" />
  </Line>
);

// A photo of a chit that could not be read: a curled, blurred sheet with a question mark.
export function BlurryChitArt({ size = 132 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <g transform="rotate(-6 60 60)">
        <path d="M28 14h56l8 8v80l-6-4-6 4-6-4-6 4-6-4-6 4-6-4-6 4-6-4-6 4V18a4 4 0 0 1 4-4z" fill="#fffaf0" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <g stroke="#9aa3b8" strokeWidth="5" strokeLinecap="round" opacity="0.8" style={{ filter: "blur(1.6px)" }}>
          <path d="M36 32h40M36 46h32M36 60h38M36 74h24" />
        </g>
      </g>
      <circle cx="88" cy="84" r="22" fill="var(--stamp-amber, #c98a0c)" stroke={INK} strokeWidth="3.5" />
      <path d="M81 78.5a7 7 0 1 1 9.5 6.5c-1.6.7-2.5 1.8-2.5 3.5v1" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="88" cy="96" r="2.6" fill="#fff" />
    </svg>
  );
}

export function LevelIcon({ level, size = 24, className }: { level: Level } & SvgProps) {
  if (level === "ok") return <CheckIcon size={size} className={className} />;
  if (level === "careful") return <AlertIcon size={size} className={className} />;
  return <CrossIcon size={size} className={className} />;
}
