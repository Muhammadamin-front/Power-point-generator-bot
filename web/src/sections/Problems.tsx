import { ParticleFlow } from "../components/ParticleFlow";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { delay } from "../lib/utils";

export function Problems() {
  const { problems } = useDeck();
  const t = useT();
  return (
    <section id="muammolar" aria-label={t.sections.muammolar} className="bg-paper">
      <div data-stop>
        <ParticleFlow density="medium" className="h-svh min-h-[560px]">
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 h-[60%] w-[min(820px,92%)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,var(--color-paper)_40%,color-mix(in_srgb,var(--color-paper)_70%,transparent)_70%,transparent)]" />
            <Words as="h2" className="section-title relative text-depth" text={problems.heading} />
            {problems.lead && (
              <p className="lede relative mt-6 max-w-[48ch]" data-rev style={delay(160)}>
                {problems.lead}
              </p>
            )}
          </div>
        </ParticleFlow>
      </div>
      <div data-stop className="slide wrap-page py-20">
        <div className="grid gap-px bg-mist md:grid-cols-2">
          {problems.items.map((r, i) => (
            <article key={i} className="bg-paper py-14 md:px-10 md:odd:pl-0" data-rev style={delay(100 * i)}>
              {r.figure && <p className="text-[clamp(2.4rem,4.2vw,4rem)] leading-none font-light text-depth">{r.figure}</p>}
              <h3 className="mt-5 text-[1.4rem] leading-snug font-light text-depth">{r.title}</h3>
              <p className="mt-3 max-w-[46ch] leading-relaxed text-dilute">{r.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
