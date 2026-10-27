import { useEffect, useRef, useState } from "react";
import { useDeck, useT } from "../lib/deck";
import { trackStage } from "../lib/scroll";
import { cn } from "../lib/utils";

const YEAR = /^\d{4}$/;

export function Timeline() {
  const { timeline } = useDeck();
  const t = useT();
  const steps = timeline.steps;
  const N = steps.length;
  const stops = steps.map((_, i) => ((i + 0.5) / N).toFixed(3)).join(",");
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let last = -1;
    return trackStage(el, (p) => {
      const i = Math.min(N - 1, Math.floor(p * N));
      if (i !== last) {
        last = i;
        setActive(i);
      }
    });
  }, [N]);

  const year = steps[active].year;
  const reached = steps.map((_, i) => i).filter((i) => i <= active);
  const big = YEAR.test(year);

  return (
    <section id="tarix" aria-label={t.sections.tarix}>
      <div ref={stage} data-stop data-stops={stops} className="stage" style={{ height: `${N * 100 + 60}svh` }}>
        <div className="stage__pin bg-paper">
          <div className="wrap-page flex h-full flex-col pt-16 pb-10 lg:pt-10">
            <div className="flex items-baseline justify-between gap-6">
              <h2 className="text-[clamp(1.4rem,2.3vw,2.2rem)] font-light text-depth">{timeline.heading}</h2>
              <span className="tnum text-sm whitespace-nowrap text-dilute">
                {steps[0].year} — <span className="text-depth">{year}</span>
              </span>
            </div>
            <div className="grid flex-1 items-center gap-10 py-6 lg:grid-cols-[1.05fr_1fr]">
              <div className="relative grid place-items-center">
                <svg viewBox="-260 -260 520 520" aria-hidden="true" className="absolute size-[min(66vh,42vw)] overflow-visible max-lg:size-[30vh]">
                  <defs>
                    <filter id="ink-edge" x="-20%" y="-20%" width="140%" height="140%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" />
                      <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" />
                      <feGaussianBlur stdDeviation="0.6" />
                    </filter>
                    <radialGradient id="now-drop">
                      <stop offset="0" stopColor="var(--color-ink)" stopOpacity="0.26" />
                      <stop offset="0.55" stopColor="var(--color-ink)" stopOpacity="0.16" />
                      <stop offset="0.85" stopColor="var(--color-ink)" stopOpacity="0.07" />
                      <stop offset="1" stopColor="var(--color-ink)" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <g filter="url(#ink-edge)">
                    {reached
                      .slice()
                      .reverse()
                      .map((age) => {
                        const fade = age / Math.max(1, N - 1);
                        const s = Math.sqrt(age + 1);
                        return (
                          <g
                            key={active - age}
                            style={{ transform: `scale(${s})`, transformBox: "view-box", transformOrigin: "0 0" }}
                            className="transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                          >
                            {[0, 0.94, 0.86].map((k, j) => (
                              <circle
                                key={j}
                                r={age === 0 && j === 0 ? 104 : 96 * (k || 1)}
                                fill={age === 0 && j === 0 ? "url(#now-drop)" : "none"}
                                stroke={age === 0 && j === 0 ? "none" : age === 0 ? "var(--color-ink)" : "var(--color-dilute)"}
                                strokeOpacity={(age === 0 ? 0.7 : 0.55 - fade * 0.35) * (j === 0 ? 1 : 0.5)}
                                strokeWidth={j === 0 ? 1.4 : 0.8}
                                vectorEffect="non-scaling-stroke"
                              />
                            ))}
                          </g>
                        );
                      })}
                  </g>
                </svg>
                <p
                  className={cn("num relative text-center leading-none font-[200] tracking-[-0.045em] text-depth", big ? "text-[clamp(5rem,13vw,11.5rem)]" : "text-[clamp(2.4rem,6vw,5.4rem)] px-4")}
                  aria-live="polite"
                >
                  {big ? (
                    <>
                      <span className="text-dilute">{year.slice(0, 2)}</span>
                      <span>{year.slice(2)}</span>
                    </>
                  ) : (
                    year
                  )}
                </p>
              </div>
              <ol className="flex flex-col">
                {steps.map((s, i) => (
                  <li
                    key={i}
                    className={cn(
                      "relative border-t border-mist py-3 transition-[opacity,padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] last:border-b",
                      i <= active ? "pl-4 opacity-100" : "opacity-30",
                    )}
                  >
                    {i === active && <span aria-hidden="true" className="absolute top-[1.3rem] left-0 size-1.5 rounded-full bg-ink" />}
                    <div className="flex items-baseline gap-4">
                      <span className="tnum w-14 shrink-0 text-sm text-dilute">{s.year}</span>
                      <div>
                        <h3 className="text-[1.1rem] leading-snug font-normal text-depth">{s.title}</h3>
                        <p
                          className={cn(
                            "overflow-hidden text-[0.93rem] leading-relaxed text-dilute transition-[max-height,opacity,margin] duration-700",
                            i === active ? "mt-1.5 max-h-44 opacity-100" : "max-h-0 opacity-0",
                          )}
                        >
                          {s.text}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="h-[2px] w-full bg-mist" aria-hidden="true">
              <div className="h-full bg-ink" style={{ width: "calc(var(--p) * 100%)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
