import { Butterfly } from "../components/charts";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { delay } from "../lib/utils";

export function Compare() {
  const { compare } = useDeck();
  const t = useT();
  const columns = [
    { title: t.similar, items: compare.similar, dot: "bg-feather" },
    { title: t.different, items: compare.different, dot: "bg-ink" },
  ].filter((c) => c.items.length > 0);
  return (
    <section id="taqqoslash" aria-label={t.sections.taqqoslash} className="bg-paper">
      <div data-stop className="slide wrap-page py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Words as="h2" className="section-title text-depth" text={compare.heading} />
          {compare.lead && (
            <p className="lede" data-rev style={delay(120)}>
              {compare.lead}
            </p>
          )}
        </div>
        <figure className="mt-14">
          <Butterfly rows={compare.rows} left={compare.left} right={compare.right} />
        </figure>
      </div>

      {columns.length > 0 && (
        <div data-stop className="slide bg-wash py-20">
          <div className="wrap-page">
            <div className={`grid gap-px bg-mist ${columns.length > 1 ? "md:grid-cols-2" : ""}`}>
              {columns.map((col, c) => (
                <article key={col.title} className="bg-wash py-10 md:px-10 md:first:pl-0" data-rev style={delay(120 * c)}>
                  <h3 className="label text-dilute">{col.title}</h3>
                  <ul className="mt-6 flex flex-col">
                    {col.items.map((text, i) => (
                      <li key={i} className="flex gap-4 border-t border-mist py-4 leading-relaxed text-depth">
                        <span aria-hidden="true" className={`mt-2.5 size-2 shrink-0 rounded-full ${col.dot}`} />
                        {text}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {compare.lessons.length > 0 && (
        <div data-stop className="slide wrap-page py-20">
          <Words as="h2" className="section-title max-w-[20ch] text-depth" text={compare.lessonsTitle} />
          <ol className="mt-16 grid gap-12 md:grid-cols-2 xl:grid-cols-4" data-rev>
            {compare.lessons.map((l, i) => (
              <li key={i}>
                <svg viewBox="0 0 320 40" className="w-full overflow-visible" aria-hidden="true">
                  <path className="draw" pathLength={1} d="M4 20 H300" stroke="var(--color-uz)" strokeWidth="1.6" fill="none" style={{ transitionDelay: `${i * 220}ms` }} />
                  <path className="draw" pathLength={1} d="M286 8 L306 20 L286 32" stroke="var(--color-uz)" strokeWidth="1.6" fill="none" style={{ transitionDelay: `${i * 220 + 500}ms` }} />
                </svg>
                <div className="mt-6 flex items-baseline gap-4">
                  <span className="vn text-[2.4rem] leading-none text-uz">{i + 1}</span>
                  <h3 className="text-[1.3rem] leading-tight font-light text-depth">{l.title}</h3>
                </div>
                <p className="mt-3 leading-relaxed text-dilute">{l.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
