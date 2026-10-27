import { FlipCard } from "../components/FlipCard";
import { Marquee } from "../components/Marquee";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { delay } from "../lib/utils";

export function Concepts() {
  const { concepts } = useDeck();
  const t = useT();
  return (
    <section id="tushunchalar" aria-label={t.sections.tushunchalar} className="bg-paper">
      {concepts.keywords.length >= 3 && (
        <div data-stop className="pt-24 max-md:pt-20">
          <Marquee items={concepts.keywords} />
        </div>
      )}
      <div data-stop className="slide wrap-page py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Words as="h2" className="section-title text-depth" text={concepts.heading} />
          {concepts.lead && (
            <p className="lede" data-rev style={delay(120)}>
              {concepts.lead}
            </p>
          )}
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {concepts.cards.map((c, i) => (
            <div key={i} data-rev style={delay(90 * i)}>
              <FlipCard {...c} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
