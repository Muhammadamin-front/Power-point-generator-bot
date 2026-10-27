import { useEffect, useRef, useState } from "react";
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react";
import { Emblem } from "../components/Emblem";
import { FlipText } from "../components/FlipText";
import { SplashButton } from "../components/SplashButton";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { scrollToY } from "../lib/scroll";
import { blend, palette } from "../theme";
import { delay } from "../lib/utils";

/** Har safar ko‘rinishga kirganda hisoblagich oshadi — animatsiya qayta ishga tushadi */
function useReplay() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setCount((c) => c + 1), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, count };
}

function Seal({ ring, letter }: { ring: string; letter: string }) {
  const p = palette();
  return (
    <div className="relative grid size-40 place-items-center">
      <PulsingBorder
        colors={[p.sealOnDark, blend(p.sealOnDark, "#ffffff", 0.35), p.ink, p.paper]}
        colorBack="#00000000"
        speed={1.2}
        roundness={1}
        thickness={0.08}
        softness={0.3}
        intensity={0.5}
        spots={4}
        spotSize={0.12}
        pulse={0.12}
        smoke={0.4}
        smokeSize={3}
        style={{ width: 96, height: 96, borderRadius: "50%" }}
        className="absolute"
      />
      <Emblem className="relative size-12" letter={letter} />
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 size-full animate-[spin_28s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id="seal-ring" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
        </defs>
        <text className="fill-feather text-[7px] tracking-[0.24em] uppercase">
          <textPath href="#seal-ring">{ring}</textPath>
        </text>
      </svg>
    </div>
  );
}

export function Closing() {
  const deck = useDeck();
  const t = useT();
  const replay = useReplay();
  const p = palette();
  const { cover } = deck;
  const ring = `${deck.brand} · ${deck.year} · ${t.thanks.replace("!", "")} · `.repeat(2);
  return (
    <>
      <section id="xulosa" aria-label={t.sections.xulosa} className="relative isolate overflow-hidden bg-depth text-paper">
        <MeshGradient className="absolute inset-0 -z-10 h-full w-full" colors={[p.depth, blend(p.ink, p.seal, 0.3), p.sumi, blend(p.ink, "#ffffff", 0.08)]} distortion={0.85} swirl={0.25} speed={0.22} />
        <div data-stop className="slide wrap-page py-20">
          <Words as="h2" className="section-title text-paper" text={deck.conclusion.heading || t.conclusion} />
          <ul className="mt-14 grid gap-10 md:grid-cols-3">
            {deck.conclusion.points.map((c, i) => (
              <li key={i} className="border-t border-white/20 pt-6 text-[clamp(1.05rem,1.4vw,1.3rem)] leading-relaxed font-light text-mist" data-rev style={delay(120 * i)}>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div ref={replay.ref} data-stop className="flex min-h-svh flex-col items-center justify-center px-6 pb-24 text-center">
          <Seal ring={ring} letter={cover.title.charAt(0)} />
          <h2 className="mt-10 text-[clamp(3.6rem,11vw,9.5rem)] leading-none font-extralight tracking-[-0.04em] text-paper">
            {replay.count > 0 ? <FlipText key={replay.count}>{t.thanks}</FlipText> : t.thanks}
          </h2>
          <p className="lede mt-6 !text-mist">{t.thanksLine}</p>
          {cover.name && (
            <p className="mt-2 text-mist">
              {cover.name}
              {cover.group && <span className="text-feather"> · {cover.group}</span>}
            </p>
          )}
          <SplashButton className="splash-btn--light mt-12" label={t.back} hoverLabel={t.backHover} onClick={() => scrollToY(0)} />
        </div>
      </section>

      {deck.sources.length > 0 && (
        <section id="manbalar" data-stop aria-label={t.sources} className="slide bg-paper py-20">
          <div className="wrap-page grid gap-10 lg:grid-cols-[0.6fr_1.4fr]">
            <div>
              <h2 className="text-[1.8rem] font-light text-depth">{t.sources}</h2>
              <p className="note mt-3 max-w-[32ch]">{t.sourcesNote}</p>
            </div>
            <ul className="grid gap-x-10 sm:grid-cols-2">
              {deck.sources.map((s, i) => (
                <li key={i} className="border-b border-mist py-3 text-[0.95rem] text-depth">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
