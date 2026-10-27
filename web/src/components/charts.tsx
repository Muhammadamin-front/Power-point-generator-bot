import { useState, type ReactNode } from "react";
import { cn, fmt, fmtValue } from "../lib/utils";
import { useT } from "../lib/deck";

/** Ochiladigan jadval — diagrammaning matnli nusxasi */
export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  const t = useT();
  return (
    <details className="group mt-6 text-sm text-dilute">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-mist px-3.5 py-1.5 transition-colors hover:border-feather hover:text-depth">
        <span className="transition-transform group-open:rotate-45">+</span> {t.tableView}
      </summary>
      <table className="mt-4 w-full max-w-lg table-fixed border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-mist">
            {head.map((h, i) => (
              <th key={i} className="py-2 pr-4 font-medium text-depth">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-mist/70">
              {r.map((c, j) => (
                <td key={j} className={cn("tnum py-2 pr-4 [overflow-wrap:anywhere]", j === 0 && "text-depth")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Gorizontal ustunlar (eng kattasi 100%) */
export function HBarList({ bars, unit, label }: { bars: { label: string; value: number; highlight: boolean }[]; unit: string; label: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1e-9);
  return (
    <ul className="flex flex-col gap-2.5" aria-label={label} data-rev>
      {bars.map((d, i) => (
        <li key={i} className="grid grid-cols-[minmax(6.5rem,10.5rem)_1fr_minmax(4.5rem,7rem)] items-center max-sm:grid-cols-[6rem_1fr_4.5rem]">
          <span className={cn("min-w-0 pr-4 text-right text-[0.95rem] leading-tight [overflow-wrap:anywhere]", d.highlight ? "font-medium text-depth" : "text-dilute")}>{d.label}</span>
          <span className="h-7">
            <span
              className="hbar block h-full rounded-r-[4px]"
              style={{ width: `${Math.max(1.5, (d.value / max) * 100)}%`, background: d.highlight ? "var(--color-ink)" : "var(--color-feather)", transitionDelay: `${i * 90}ms` }}
            />
          </span>
          <span className={cn("tnum min-w-0 overflow-hidden pl-3 text-[0.95rem] text-ellipsis whitespace-nowrap", d.highlight ? "font-medium text-depth" : "text-dilute")} title={`${fmtValue(d.value)}${unit ? ` ${unit}` : ""}`}>
            {fmtValue(d.value)}
            {unit ? ` ${unit}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Row = { label: string; left: string; right: string; leftValue: number; rightValue: number };

/** «Kapalak» diagramma: chapda bir tomon, o‘ngda ikkinchisi. Raqamli qiymati bo‘lmagan qator faqat matn bilan chiqadi */
export function Butterfly({ rows, left, right }: { rows: Row[]; left: string; right: string }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const hasNumbers = (r: Row) => r.leftValue > 0 && r.rightValue > 0;
  return (
    <div data-rev>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 border-b border-mist pb-5 sm:gap-4">
        <span className="min-w-0 text-right text-[clamp(1.05rem,2vw,1.9rem)] leading-tight font-light text-depth">{left}</span>
        <span className="label pb-2 text-feather">{t.vs}</span>
        <span className="min-w-0 text-[clamp(1.05rem,2vw,1.9rem)] leading-tight font-light text-uz">{right}</span>
      </div>
      <ul aria-label={`${left} ${t.vs} ${right}`}>
        {rows.map((r, i) => {
          const numeric = hasNumbers(r);
          const m = Math.max(r.leftValue, r.rightValue);
          const ratio = numeric ? (r.leftValue >= r.rightValue ? r.leftValue / r.rightValue : r.rightValue / r.leftValue) : 0;
          const leader = r.leftValue >= r.rightValue ? left : right;
          const on = hover === i;
          return (
            <li
              key={i}
              tabIndex={0}
              aria-label={`${r.label}: ${left} ${r.left}, ${right} ${r.right}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className={cn("relative border-b border-mist py-3 outline-none transition-colors duration-300", on && "bg-wash")}
            >
              <div className="mb-1.5 flex flex-wrap items-baseline justify-center gap-2 text-center">
                <span className={cn("text-[0.9rem]", on ? "text-depth" : "text-dilute")}>{r.label}</span>
                {numeric && ratio >= 1.05 && (
                  <span className={cn("tnum rounded-full px-2 text-xs transition-opacity duration-300", on ? "bg-depth text-paper opacity-100" : "opacity-0")}>
                    {leader}: ×{fmt(ratio, ratio < 10 ? 1 : 0)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-[1fr_1fr] items-center gap-1.5">
                <div className="flex items-center justify-end gap-3 px-2">
                  <span className="text-right text-[clamp(0.95rem,1.25vw,1.15rem)] leading-tight text-depth">{r.left}</span>
                  {numeric && (
                    <span className="h-5 w-[min(55%,26rem)] shrink-0 max-sm:w-[30%]">
                      <span
                        className="hbar hbar--rtl ml-auto block h-full rounded-l-[4px]"
                        style={{ width: `${(r.leftValue / m) * 100}%`, background: "var(--color-ink)", transitionDelay: `${i * 80}ms` }}
                      />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 px-2">
                  {numeric && (
                    <span className="h-5 w-[min(55%,26rem)] shrink-0 max-sm:w-[30%]">
                      <span
                        className="hbar block h-full rounded-r-[4px]"
                        style={{ width: `${(r.rightValue / m) * 100}%`, background: "var(--color-uz)", transitionDelay: `${i * 80 + 40}ms` }}
                      />
                    </span>
                  )}
                  <span className="text-[clamp(0.95rem,1.25vw,1.15rem)] leading-tight text-depth">{r.right}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
