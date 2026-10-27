import { ClothGrid } from "../components/ClothGrid";
import { ParallaxHero } from "../components/ParallaxHero";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { delay } from "../lib/utils";

export function Overview() {
  const { overview } = useDeck();
  const t = useT();
  return (
    <section id="mavzu" aria-label={t.sections.mavzu} className="relative bg-paper">
      <div data-stop>
        {overview.image ? (
          <ParallaxHero
            image={overview.image}
            alt={overview.imageAlt || overview.heading}
            title={
              <span className="vn mt-2 max-w-[18ch] text-[clamp(2.6rem,7vw,6.5rem)] leading-[1.02] text-depth [text-shadow:0_2px_30px_color-mix(in_srgb,var(--color-paper)_60%,transparent)]">
                {overview.heading}
              </span>
            }
          />
        ) : (
          <ClothGrid className="h-svh min-h-[560px]">
            <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-[70%] w-[min(900px,90%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,var(--color-paper)_35%,color-mix(in_srgb,var(--color-paper)_75%,transparent)_65%,transparent)]" />
              <span className="vn relative max-w-[16ch] text-[clamp(2.6rem,7vw,6.5rem)] leading-[1.02] text-depth">{overview.heading}</span>
            </div>
          </ClothGrid>
        )}
      </div>
      <div data-stop className="slide wrap-page grid gap-x-20 gap-y-14 py-24 lg:grid-cols-[1.15fr_1fr]">
        <div>
          {overview.pull && (
            <Words as="h2" className="max-w-[20ch] text-[clamp(2rem,3.6vw,3.4rem)] leading-[1.08] font-[250] tracking-[-0.02em] text-depth" text={overview.pull} />
          )}
          {overview.lead && (
            <p className={`lede ${overview.pull ? "mt-8" : ""}`} data-rev style={delay(120)}>
              {overview.lead}
            </p>
          )}
        </div>
        <dl className="self-end border-t border-mist">
          {overview.facts.map((f, i) => (
            <div key={i} className="grid items-baseline gap-2 border-b border-mist py-5 sm:grid-cols-[minmax(8.5rem,auto)_1fr] sm:gap-6" data-rev style={delay(80 * i)}>
              <dt className="text-[clamp(1.4rem,2.1vw,1.9rem)] leading-tight font-light text-depth">{f.value}</dt>
              <dd className="text-dilute">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
