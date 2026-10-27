import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clamp, prefersReducedMotion } from "./utils";

gsap.registerPlugin(ScrollTrigger);

type Stage = { el: HTMLElement; cb?: (p: number) => void; last: number };

let lenis: Lenis | null = null;
const stages = new Set<Stage>();
const listeners = new Set<(y: number) => void>();
let queued = false;

function tick() {
  queued = false;
  const vh = window.innerHeight;
  for (const s of stages) {
    const r = s.el.getBoundingClientRect();
    const travel = r.height - vh;
    const p = travel > 0 ? clamp(-r.top / travel) : r.top <= 0 ? 1 : 0;
    if (Math.abs(p - s.last) > 5e-4) {
      s.last = p;
      s.el.style.setProperty("--p", p.toFixed(4));
      s.cb?.(p);
    }
  }
  const y = window.scrollY;
  for (const fn of listeners) fn(y);
}

function request() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(tick);
}

/** Lenis silliq scroll + GSAP ticker + scroll registri */
export function initScroll() {
  if (!prefersReducedMotion() && !lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  request();
  return () => {
    window.removeEventListener("scroll", request);
    window.removeEventListener("resize", request);
    lenis?.destroy();
    lenis = null;
  };
}

/** Sticky sahna: elementga --p (0…1) yozadi */
export function trackStage(el: HTMLElement, cb?: (p: number) => void) {
  const s: Stage = { el, cb, last: -1 };
  stages.add(s);
  request();
  return () => {
    stages.delete(s);
  };
}

export function onScroll(fn: (y: number) => void) {
  listeners.add(fn);
  fn(window.scrollY);
  return () => {
    listeners.delete(fn);
  };
}

export function scrollToY(y: number, immediate = false) {
  if (lenis) {
    lenis.scrollTo(y, {
      duration: immediate ? 0 : 1.35,
      immediate,
      easing: (t) => 1 - (1 - t) ** 4,
    });
  } else {
    window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
}

/** Taqdimot «qadamlari»: [data-stop] elementlari (+ data-stops ichki nuqtalari) */
function collectStops() {
  const out: number[] = [];
  const vh = window.innerHeight;
  document.querySelectorAll<HTMLElement>("[data-stop]").forEach((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const inner = el.dataset.stops;
    if (inner) {
      const travel = el.offsetHeight - vh;
      for (const f of inner.split(",")) out.push(Math.round(top + parseFloat(f) * travel));
    } else out.push(Math.round(top));
  });
  return Array.from(new Set(out)).sort((a, b) => a - b);
}

export function step(dir: 1 | -1) {
  const stops = collectStops();
  const cur = lenis ? lenis.targetScroll : window.scrollY;
  const next =
    dir === 1 ? stops.find((y) => y > cur + 6) : [...stops].reverse().find((y) => y < cur - 6);
  if (next !== undefined) scrollToY(next);
}

export { gsap, ScrollTrigger };
