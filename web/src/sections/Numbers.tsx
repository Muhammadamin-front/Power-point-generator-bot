import { DataTable, HBarList } from "../components/charts";
import { Counter } from "../components/Counter";
import { Words } from "../components/text";
import { useDeck, useT } from "../lib/deck";
import { delay, fmtValue } from "../lib/utils";

export function Numbers() {
  const { numbers } = useDeck();
  const t = useT();
  const { stats, chart } = numbers;
  const hasChart = chart.bars.length >= 2;
  return (
    <section id="raqamlar" aria-label={t.sections.raqamlar} className="bg-wash">
      <div data-stop className="slide wrap-page py-20">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_1fr]">
          <Words as="h2" className="section-title text-depth" text={numbers.heading} />
          {numbers.lead && (
            <p className="lede lg:justify-self-end" data-rev style={delay(120)}>
              {numbers.lead}
            </p>
          )}
        </div>
        {hasChart && (
          <figure className="mt-14">
            {chart.title && <figcaption className="mb-6 text-[1.05rem] text-depth">{chart.title}</figcaption>}
            <HBarList bars={chart.bars} unit={chart.unit} label={chart.title} />
            {chart.note && <p className="note mt-5">{chart.note}</p>}
            <DataTable caption={chart.title} head={[chart.title || "", chart.unit || ""]} rows={chart.bars.map((b) => [b.label, fmtValue(b.value)])} />
          </figure>
        )}
      </div>
      {stats.length >= 2 && (
        <div data-stop className="slide wrap-page py-20">
          <dl className="grid border-t border-feather/60 md:grid-cols-2 md:gap-x-16">
            {stats.map((s, i) => (
              <div key={i} className="grid items-baseline gap-3 border-b border-feather/40 py-7 sm:grid-cols-[minmax(0,auto)_1fr] sm:gap-6" data-rev style={delay(70 * i)}>
                <dd className="order-first max-w-full min-w-0 overflow-hidden text-[clamp(2rem,3.2vw,3.1rem)] leading-none font-light text-depth">
                  <Counter value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                </dd>
                <dt>
                  <span className="block text-[1.02rem] leading-snug text-depth">{s.label}</span>
                  {s.note && <span className="note mt-1.5 block">{s.note}</span>}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
