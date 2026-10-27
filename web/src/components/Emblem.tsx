import { cn } from "../lib/utils";

/** Logotip: suvga tushgan tomchi halqalari + muhr (mavzuning bosh harfi) */
export function Emblem({ className, seal = true, letter = "" }: { className?: string; seal?: boolean; letter?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("shrink-0", className)}>
      <circle cx="30" cy="30" r="24" fill="none" stroke="var(--color-feather)" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="16.5" fill="none" stroke="var(--color-dilute)" strokeWidth="2.5" />
      <circle cx="30" cy="30" r="9" fill="var(--color-ink)" />
      {seal && (
        <g>
          <rect x="44" y="44" width="18" height="18" rx="2.5" fill="var(--color-seal)" />
          <text x="53" y="57.4" textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff" fontFamily="var(--font-disp)">
            {letter.slice(0, 1).toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}
