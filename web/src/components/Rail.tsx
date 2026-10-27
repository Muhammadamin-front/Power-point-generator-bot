import { useEffect, useState } from "react";
import { ChartColumn, Flag, History, Home, Layers, Scale, Sparkles, TriangleAlert, BookOpen, type LucideIcon } from "lucide-react";
import { useDeck, useT } from "../lib/deck";
import { onScroll, scrollToId } from "../lib/scroll";
import { visibleSections } from "../lib/sections";
import { cn } from "../lib/utils";
import type { SectionId } from "../types";
import { Emblem } from "./Emblem";

const icons: Record<SectionId, LucideIcon> = {
  kirish: Home,
  mavzu: BookOpen,
  raqamlar: ChartColumn,
  tarix: History,
  tushunchalar: Layers,
  muammolar: TriangleAlert,
  kelajak: Sparkles,
  taqqoslash: Scale,
  xulosa: Flag,
};

const pad = (n: number) => String(n).padStart(2, "0");

function useActiveSection(ids: SectionId[]) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(
    () =>
      onScroll((y) => {
        const probe = y + window.innerHeight * 0.45;
        let idx = 0;
        ids.forEach((id, i) => {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top + y <= probe) idx = i;
        });
        setActive(idx);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? y / max : 0);
      }),
    [ids],
  );
  return { active, progress };
}

export function Rail() {
  const deck = useDeck();
  const t = useT();
  const ids = visibleSections(deck);
  const { active, progress } = useActiveSection(ids);
  const letter = deck.cover.title.trim().charAt(0);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--rail)] flex-col border-r border-mist bg-paper lg:flex">
        <a href="#kirish" onClick={(e) => (e.preventDefault(), scrollToId("kirish"))} className="flex flex-col items-center gap-2.5 px-6 pt-6 pb-5 text-center">
          <Emblem className="size-14" letter={letter} />
          <span className="label text-depth">{deck.brand}</span>
        </a>
        <nav aria-label={t.section} className="mx-5 flex-1 overflow-y-auto border-t border-mist pt-4">
          <ul className="flex flex-col gap-0.5">
            {ids.map((id, i) => {
              const Icon = icons[id];
              const on = i === active;
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={on ? "true" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToId(id);
                    }}
                    className={cn("group flex items-center gap-3.5 rounded-full py-1 pr-3 pl-1.5 transition-colors duration-300", on ? "text-depth" : "text-dilute hover:text-depth")}
                  >
                    <span className={cn("grid size-7 place-items-center rounded-full transition-colors duration-500", on ? "bg-ink text-paper" : "text-dilute group-hover:text-depth")}>
                      <Icon className="size-[15px]" strokeWidth={1.6} />
                    </span>
                    <span className="label !tracking-[0.14em]">{t.sections[id]}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mx-5 border-t border-mist py-4">
          <div className="flex items-baseline justify-between">
            <span className="label text-dilute">{t.section}</span>
            <span className="tnum text-sm text-depth">
              {pad(active + 1)} <span className="text-feather">/ {pad(ids.length)}</span>
            </span>
          </div>
          <div className="mt-3 h-px w-full bg-mist">
            <div className="h-px bg-ink transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
          </div>
          {deck.cover.name && <p className="mt-4 text-sm text-depth">{deck.cover.name}</p>}
          {deck.cover.group && <p className="text-xs text-dilute">{deck.cover.group}</p>}
          <p className="note mt-3">
            <kbd className="font-sans">←</kbd> <kbd className="font-sans">→</kbd> {t.keysShort}
          </p>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center gap-3 border-b border-mist bg-paper px-4 lg:hidden">
        <Emblem className="size-7" seal={false} />
        <span className="label text-depth">{t.sections[ids[active]]}</span>
        <span className="tnum ml-auto text-xs text-dilute">
          {pad(active + 1)} / {pad(ids.length)}
        </span>
        <div className="absolute inset-x-0 bottom-0 h-px bg-ink" style={{ width: `${progress * 100}%` }} />
      </header>
    </>
  );
}
