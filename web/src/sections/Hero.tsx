import { useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { useMarble } from "../components/marbling";
import { Emblem } from "../components/Emblem";
import { useDeck, useT } from "../lib/deck";
import { scrollToId } from "../lib/scroll";
import { delay, wordIndex } from "../lib/utils";

/** Titul sahifa: mavzu, taqdimotchi va guruh — foydalanuvchi kiritgan ma'lumotlardan */
export function Hero() {
  const deck = useDeck();
  const t = useT();
  const { cover, readouts } = deck;
  const marble = useMarble("ink", 360, 90, 5);
  const rings = useRef<SVGSVGElement>(null);

  // Sichqoncha siljishi bilan halqalar sekin siljiydi
  useEffect(() => {
    const el = rings.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 28;
        const y = (e.clientY / window.innerHeight - 0.5) * 28;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const words = cover.title.split(" ");
  const longTitle = cover.title.length > 38;
  const author = [
    cover.name && { label: t.presenter, value: cover.name },
    cover.group && { label: t.group, value: cover.group },
    cover.teacher && { label: t.teacher, value: cover.teacher },
  ].filter(Boolean) as { label: string; value: string }[];
  const place = [cover.university, cover.faculty, [cover.city, deck.year].filter(Boolean).join(", ")].filter(Boolean);

  return (
    <section id="kirish" data-stop aria-label={t.sections.kirish} className="relative min-h-svh overflow-hidden">
      <svg
        ref={rings}
        aria-hidden="true"
        viewBox="-300 -300 600 600"
        className="pointer-events-none absolute top-1/2 right-[-6%] size-[min(110vh,68vw)] -translate-y-1/2 transition-transform duration-[1200ms] ease-out max-lg:right-[-35%] max-lg:opacity-60"
      >
        {[280, 232, 184, 136, 88, 40].map((r, i) => (
          <circle key={r} r={r} fill={i === 5 ? "var(--color-ink)" : "var(--color-mist)"} fillOpacity={i === 5 ? 0.9 : 0.35 + (i % 2) * 0.25} />
        ))}
        {[0, 1, 2].map((i) => (
          <circle key={i} r="40" fill="none" stroke="var(--color-ink)" strokeOpacity="0.4" strokeWidth="1.5" className="hero-ripple" style={{ animationDelay: `${i * 1.6}s` }} />
        ))}
      </svg>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--color-paper)_0%,var(--color-paper)_24%,color-mix(in_srgb,var(--color-paper)_80%,transparent)_38%,transparent_54%)] max-lg:bg-[linear-gradient(180deg,var(--color-paper)_0%,color-mix(in_srgb,var(--color-paper)_88%,transparent)_70%,transparent_100%)]" />

      <div className="relative flex min-h-svh flex-col px-[clamp(1.25rem,5vw,5rem)] pt-20 pb-8 lg:pt-12">
        <div className="my-auto flex items-stretch gap-[clamp(1.25rem,3vw,3rem)] py-8">
          <div className="hidden flex-col items-center gap-4 sm:flex">
            <span className="vn text-[clamp(1.2rem,1.8vw,1.8rem)] leading-none tracking-[0.22em] whitespace-nowrap text-ink [writing-mode:vertical-rl]">{deck.brand}</span>
            <span className="w-px flex-1 bg-feather" />
            <Emblem className="size-9" letter={cover.title.charAt(0)} />
          </div>
          <div className="max-w-[44rem]">
            {cover.kicker && (
              <p className="label mb-6 text-dilute" data-rev>
                {cover.kicker}
              </p>
            )}
            <h1
              className={`${longTitle ? "text-[clamp(2.2rem,4.4vw,4.2rem)]" : "text-[clamp(2.8rem,6.2vw,5.6rem)]"} leading-[1.02] font-[250] tracking-[-0.03em] text-depth`}
              data-words=""
            >
              {words.map((w, i) => (
                <span key={i}>
                  <span className="w" style={wordIndex(i)}>
                    {w}
                  </span>
                  {i < words.length - 1 ? " " : null}
                </span>
              ))}
            </h1>
            {cover.subtitle && (
              <p className="mt-7 max-w-[40ch] text-[clamp(1.05rem,1.45vw,1.35rem)] leading-relaxed text-dilute" data-rev style={delay(260)}>
                {cover.subtitle}
              </p>
            )}
            <div className="mt-9 flex flex-wrap items-center gap-4" data-rev style={delay(420)}>
              <button
                type="button"
                onClick={() => scrollToId("mavzu")}
                className="group inline-flex h-14 items-center gap-4 rounded-full bg-depth bg-[length:180%_auto] bg-[position:0%_50%] pr-3 pl-7 text-paper transition-[background-position] duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[position:100%_50%] active:scale-[0.98]"
                style={marble ? { backgroundImage: `url(${marble})` } : undefined}
              >
                <span className="label !tracking-[0.16em]">{t.start}</span>
                <span className="grid size-9 place-items-center rounded-full border border-paper/25 transition-transform duration-500 group-hover:translate-y-0.5">
                  <ArrowDown className="size-4" strokeWidth={1.6} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => scrollToId("xulosa")}
                className="inline-flex h-14 items-center rounded-full border border-feather px-7 text-depth transition-colors duration-300 hover:border-depth"
              >
                <span className="label !tracking-[0.16em]">{t.toEnd}</span>
              </button>
            </div>
          </div>
        </div>

        {(author.length > 0 || place.length > 0) && (
          <footer className="mt-4 border-t border-mist pt-5" data-rev style={delay(600)}>
            <dl className="flex flex-wrap gap-x-10 gap-y-3">
              {author.map((a) => (
                <div key={a.label}>
                  <dt className="label text-dilute">{a.label}</dt>
                  <dd className="mt-0.5 text-[1.05rem] text-depth">{a.value}</dd>
                </div>
              ))}
            </dl>
            {place.length > 0 && <p className="note mt-3">{place.join(" · ")}</p>}
          </footer>
        )}
      </div>

      {readouts.length > 0 && (
        <dl className="pointer-events-none absolute top-1/2 right-[clamp(1rem,2.5vw,2.5rem)] hidden -translate-y-1/2 flex-col gap-5 border-l border-mist pl-5 xl:flex">
          {readouts.map((s, i) => (
            <div key={i}>
              <dt className="label text-dilute">{s.label}</dt>
              <dd className="mt-1 text-lg text-depth">{s.value}</dd>
              {s.note && <dd className="note">{s.note}</dd>}
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
