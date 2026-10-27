import type { Deck, SectionId } from "../types";

/** Bo'sh bo'limlar ko'rsatilmaydi: AI ixtiyoriy bo'limlarni bo'sh qoldirishi mumkin */
export function visibleSections(d: Deck): SectionId[] {
  const out: SectionId[] = ["kirish", "mavzu"];
  if (d.numbers.stats.length >= 2 || d.numbers.chart.bars.length >= 2) out.push("raqamlar");
  if (d.timeline.steps.length >= 3) out.push("tarix");
  if (d.concepts.cards.length >= 2) out.push("tushunchalar");
  if (d.problems.items.length >= 2) out.push("muammolar");
  if (d.future.items.length >= 2) out.push("kelajak");
  if (d.compare.rows.length >= 2) out.push("taqqoslash");
  out.push("xulosa");
  return out;
}
