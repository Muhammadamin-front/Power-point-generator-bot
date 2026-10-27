import { AuroraBackground } from "../components/marbling";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { cn, delay } from "../lib/utils";

export function Future() {
  const { future } = useDeck();
  const t = useT();
  const items = future.items;
  return (
    <section id="kelajak" aria-label={t.sections.kelajak}>
      <AuroraBackground>
        <div data-stop className="slide wrap-page py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
            <Words as="h2" className="section-title text-depth" text={future.heading} />
            {future.lead && (
              <p className="lede" data-rev style={delay(120)}>
                {future.lead}
              </p>
            )}
          </div>
          <ul className="mt-16 grid gap-x-10 md:grid-cols-6">
            {items.map((f, i) => {
              const small = items.length >= 5 ? i < items.length - 2 : items.length === 3 || items.length === 6;
              return (
                <li key={i} className={cn("border-t border-feather/60 py-8", small ? "md:col-span-2" : "md:col-span-3")} data-rev style={delay(90 * i)}>
                  {f.tag && <span className="label text-ink">{f.tag}</span>}
                  <h3 className={cn("mt-3 leading-tight font-light text-depth", small ? "text-[1.5rem]" : "text-[1.9rem]")}>{f.title}</h3>
                  <p className="mt-3 max-w-[48ch] leading-relaxed text-depth/80">{f.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </AuroraBackground>
    </section>
  );
}
