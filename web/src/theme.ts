/* Foydalanuvchi tanlagan ikki rangdan (asosiy + urg'u) butun dizayn tokenlari hosil qilinadi.
   Matn va fon orasidagi kontrast WCAG AA (4.5:1) dan past tushmasligi kafolatlanadi. */

type RGB = [number, number, number];

export const toRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const toHex = ([r, g, b]: RGB) =>
  `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

const mix = (a: string, b: string, t: number) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
export const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** `color` ni `toward` tomonga (qora yoki oq) kerakli kontrastgacha suradi */
function ensure(color: string, bg: string, min: number, toward: string) {
  let out = color;
  for (let i = 0; i < 40 && contrast(out, bg) < min; i++) out = mix(out, toward, 0.08);
  return out;
}

export type Tokens = ReturnType<typeof deriveTokens>;

export function deriveTokens(primary: string, accent: string) {
  const white = "#ffffff";
  const black = "#000000";
  const paper = mix(primary, white, 0.965);
  const ink = ensure(primary, paper, 7, black);
  const depth = ensure(mix(ink, black, 0.5), paper, 12, black);
  const sumi = mix(ink, black, 0.78);
  const wash = mix(primary, white, 0.925);
  const mist = mix(primary, white, 0.86);
  const feather = mix(primary, white, 0.66);
  const dilute = ensure(mix(primary, white, 0.3), paper, 4.8, black);
  const seal = ensure(accent, paper, 3, black);
  // To'q fonda (xulosa bo'limi) urg'u rangi yetarli yorqin bo'lishi kerak
  const sealOnDark = ensure(accent, depth, 4.5, white);
  const uz = ensure(accent, paper, 4.5, black);
  return { paper, ink, depth, sumi, wash, mist, feather, dilute, seal, sealOnDark, uz };
}

/** CSS o'zgaruvchilarni :root ga yozadi va canvas/shader effektlari uchun palitrani qaytaradi */
export function applyTheme(primary: string, accent: string) {
  const t = deriveTokens(primary, accent);
  const root = document.documentElement.style;
  for (const key of ["paper", "ink", "depth", "sumi", "wash", "mist", "feather", "dilute", "seal", "uz"] as const) {
    root.setProperty(`--color-${key}`, t[key]);
  }
  root.setProperty("--color-seal-dark", t.sealOnDark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.paper);
  current = t;
  return t;
}

let current: Tokens = deriveTokens("#1e2d4a", "#c23b22");
export const palette = () => current;

export function rgbString(hex: string) {
  return toRgb(hex).join(", ");
}

export function hsl(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map((v) => v / 255) as RGB;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

export const blend = mix;
