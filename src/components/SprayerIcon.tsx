// Knapsack sprayer (the 15 to 16 litre tank a farmer carries on their back), in the same
// 24x24 line style as the UI icons in icons.tsx.
export function SprayerIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 6.5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3V19a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 5 19z" />
      <path d="M5 10h8" />
      <path d="M9 3.5V2.5" />
      <path d="M13 16c2.5 0 3.5-1 4.5-3.5L19 8" />
      <path d="m19 8 2.5-1.5" />
      <path d="M21.5 4.5v.01M22.5 7.5v.01M20.5 3.5v.01" strokeWidth={2.4} />
    </svg>
  );
}
