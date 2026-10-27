import { useEffect } from "react";
import { KeyboardHelp } from "./components/KeyboardHelp";
import { Rail } from "./components/Rail";
import { useDeck, useT } from "./lib/deck";
import { initScroll } from "./lib/scroll";
import { visibleSections } from "./lib/sections";
import { Closing } from "./sections/Closing";
import { Compare } from "./sections/Compare";
import { Concepts } from "./sections/Concepts";
import { Future } from "./sections/Future";
import { Hero } from "./sections/Hero";
import { Numbers } from "./sections/Numbers";
import { Overview } from "./sections/Overview";
import { Problems } from "./sections/Problems";
import { Timeline } from "./sections/Timeline";

/** [data-rev] va [data-words] elementlariga ko‘rinishga kirganda .is-in qo‘shadi */
function useReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) document.documentElement.classList.add("motion");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll("[data-rev], [data-words]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function App() {
  const deck = useDeck();
  const t = useT();
  const shown = new Set(visibleSections(deck));
  useEffect(() => initScroll(), []);
  useReveal();
  return (
    <>
      <a href="#mavzu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-depth focus:px-4 focus:py-2 focus:text-paper">
        {t.skip}
      </a>
      <Rail />
      <main className="pt-12 lg:pt-0 lg:pl-[var(--rail)]">
        <Hero />
        <Overview />
        {shown.has("raqamlar") && <Numbers />}
        {shown.has("tarix") && <Timeline />}
        {shown.has("tushunchalar") && <Concepts />}
        {shown.has("muammolar") && <Problems />}
        {shown.has("kelajak") && <Future />}
        {shown.has("taqqoslash") && <Compare />}
        <Closing />
      </main>
      <KeyboardHelp />
    </>
  );
}
