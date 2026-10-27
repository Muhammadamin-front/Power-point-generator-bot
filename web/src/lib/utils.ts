import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Paydo bo‘lish kechikishi: style={delay(120)} */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** So‘z indeksi: style={wordIndex(0)} */
export const wordIndex = (i: number) => ({ "--i": i }) as CSSProperties;

/** 1234.5 → «1 234,5» (o‘zbekcha yozuv) */
export const fmt = (v: number, digits = 1) =>
  v.toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Diagramma qiymati: butun son — butun, 10 dan kichik — 2 xonagacha, qolgani — 1 xonagacha (ortiqcha nollarsiz) */
export const fmtValue = (v: number) => {
  const digits = Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 2 : 1;
  return fmt(v, digits).replace(/,(\d*?)0+$/, (_, d) => (d ? `,${d}` : ""));
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
