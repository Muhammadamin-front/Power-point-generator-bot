/* Serverdan keladigan taqdimot mazmuni (index.html ichidagi <script id="deck">).
   Server tomondagi sxema: ../../src/ai/webdeck.js — ikkalasini birga o'zgartiring. */

export type Lang = "uz" | "uz_cyrl" | "ru" | "en";

export type Deck = {
  lang: Lang;
  year: number;
  theme: { primary: string; accent: string };
  /** Titul sahifa: foydalanuvchi kiritgan ma'lumotlardan (AI emas) */
  cover: {
    kicker: string;
    title: string;
    subtitle: string;
    name: string;
    group: string;
    university: string;
    faculty: string;
    teacher: string;
    city: string;
  };
  brand: string;
  readouts: { label: string; value: string; note: string }[];
  overview: { heading: string; lead: string; pull: string; facts: { value: string; label: string }[]; image: string; imageAlt: string };
  numbers: {
    heading: string;
    lead: string;
    stats: { value: number; prefix: string; suffix: string; decimals: number; label: string; note: string }[];
    chart: { title: string; unit: string; note: string; bars: { label: string; value: number; highlight: boolean }[] };
  };
  timeline: { heading: string; lead: string; steps: { year: string; title: string; text: string }[] };
  concepts: { heading: string; lead: string; cards: { label: string; word: string; meaning: string; text: string }[]; keywords: string[] };
  problems: { heading: string; lead: string; items: { figure: string; title: string; text: string }[] };
  future: { heading: string; lead: string; items: { tag: string; title: string; text: string }[] };
  compare: {
    heading: string;
    lead: string;
    left: string;
    right: string;
    rows: { label: string; left: string; right: string; leftValue: number; rightValue: number }[];
    similar: string[];
    different: string[];
    lessonsTitle: string;
    lessons: { title: string; text: string }[];
  };
  conclusion: { heading: string; points: string[] };
  sources: string[];
};

export type SectionId = "kirish" | "mavzu" | "raqamlar" | "tarix" | "tushunchalar" | "muammolar" | "kelajak" | "taqqoslash" | "xulosa";
