// The Parchi mark: a shopkeeper's rubber-stamp roundel with the Devanagari "प" (first letter of
// पर्ची) in the middle, and a carbon-ink tick struck across its edge, the way a checked bill is
// ticked. The glyph is drawn as strokes, so it renders the same with or without web fonts.

const RED = "#c8302b";
const INK = "#1f2a44";
const PAPER = "#f6efdf";

export function LogoMark({ size = 48, rough = true, className }: { size?: number; rough?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      {rough && (
        <defs>
          {/* Worn rubber: knock small random voids out of the red ink. Identical in every instance. */}
          <filter id="parchi-worn" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 4.2" result="m" />
            <feComposite in="SourceGraphic" in2="m" operator="in" />
          </filter>
        </defs>
      )}
      <g transform="rotate(-9 32 32)" filter={rough ? "url(#parchi-worn)" : undefined}>
        <circle cx="32" cy="32" r="28.5" fill="none" stroke={RED} strokeWidth="3.6" />
        <circle cx="32" cy="32" r="23" fill="none" stroke={RED} strokeWidth="1.6" />
        <g fill={RED}>
          <circle cx="6.5" cy="32" r="1.6" />
          <circle cx="57.5" cy="32" r="1.6" />
        </g>
        {/* प: headline (shirorekha), the right stem, and the bowl joining it. */}
        <g fill="none" stroke={RED} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 21.5H46.5" />
          <path d="M40 21.5V46" />
          <path d="M24.5 21.5V30.5C24.5 35.5 27.5 38.5 32.5 38.5H40" />
        </g>
      </g>
      {/* The tick, in carbon ink, with a paper halo so it sits on top of the stamp. */}
      <path d="M38.5 50.5 44 56 59 37" fill="none" stroke={PAPER} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38.5 50.5 44 56 59 37" fill="none" stroke={INK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Mark plus the name in Latin and Devanagari.
export function Logo({ size = 44, sub, className = "", textClassName = "" }: { size?: number; sub?: string; className?: string; textClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className={`flex flex-col ${textClassName}`}>
        <span className="text-[1.65rem] leading-[1.05] font-extrabold tracking-tight text-ink">
          Parchi
          {sub && <span className="ml-1.5 text-danger">{sub}</span>}
        </span>
        <span className="text-[0.95rem] leading-[1.3] font-bold text-danger" lang="hi">
          पर्ची
        </span>
      </span>
    </span>
  );
}
