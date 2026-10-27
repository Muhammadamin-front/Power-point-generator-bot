// Foydalanuvchi tanlaydigan ranglar va shriftlar: tayyor to'plamlar va ixtiyoriy (custom) ranglar.
// Matn va fon orasidagi kontrast (WCAG AA, 4.5:1) hosil qilingan ranglarda ham saqlanadi.

export const COLOR_PRESETS = [
  { id: "navy", name: "Tungi koʻk", primary: "#1E2D4A", accent: "#C23B22" },
  { id: "emerald", name: "Zumrad", primary: "#14532D", accent: "#D97706" },
  { id: "burgundy", name: "Bordo", primary: "#5B1A2E", accent: "#B8860B" },
  { id: "teal", name: "Firuza", primary: "#0F4C5C", accent: "#E36414" },
  { id: "graphite", name: "Grafit", primary: "#27272A", accent: "#E8A317" },
  { id: "indigo", name: "Indigo", primary: "#312E81", accent: "#E11D48" },
];
export const DEFAULT_COLORS = { primary: COLOR_PRESETS[0].primary, accent: COLOR_PRESETS[0].accent };

// PowerPoint faylga veb-shrift joylab bo'lmaydi, shuning uchun .pptx uchun faqat Office bilan keladigan shriftlar
// (hammasida oʻzbek lotin/kirill, rus va ingliz harflari bor). Veb-taqdimot uchun bepul shriftlar: web/build.js → FONTS.
export const PPTX_FONTS = [
  { id: "calibri", name: "Calibri" },
  { id: "cambria", name: "Cambria" },
  { id: "arial", name: "Arial" },
  { id: "georgia", name: "Georgia" },
  { id: "times", name: "Times New Roman" },
];

export const isHex = (value) => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

/** Buyurtmadagi ranglarni tekshiradi; noto'g'ri bo'lsa standart ranglar qaytadi. */
export function normalizeColors(colors) {
  if (!isHex(colors?.primary) || !isHex(colors?.accent)) return { ...DEFAULT_COLORS };
  // Urg'u rangi oq fonda deyarli ko'rinmay qolmasligi uchun
  const accent = ensure(colors.accent, "#FFFFFF", 1.8, "#000000");
  return { primary: colors.primary.toUpperCase(), accent: accent.toUpperCase() };
}

const toRgb = (hex) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
export const mix = (a, b, t) => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
const channel = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** color ni toward (qora yoki oq) tomonga kerakli kontrastgacha suradi */
const ensure = (color, bg, min, toward) => {
  let out = color;
  for (let i = 0; i < 40 && contrast(out, bg) < min; i++) out = mix(out, toward, 0.08);
  return out;
};

const noHash = (hex) => hex.replace("#", "").toUpperCase();

/**
 * Oddiy (.pptx) taqdimot uchun THEMES formatidagi mavzu: ikki rangdan hosil qilinadi.
 * Sarlavha/matn oq fonda ham, to'q fonda ham o'qiladigan bo'ladi.
 */
export function customPptxTheme(colors, fonts = {}) {
  const { primary, accent } = normalizeColors(colors);
  const dark = ensure(primary, "#FFFFFF", 7, "#000000"); // to'q fon: oq matn uchun kontrast >= 7
  const accentOnDark = ensure(accent, dark, 4.5, "#FFFFFF"); // to'q fondagi urg'u (raqamlar, kichik sarlavhalar)
  const onAccent = contrast("#FFFFFF", accentOnDark) >= contrast(dark, accentOnDark) ? "#FFFFFF" : dark;
  const font = PPTX_FONTS.find((f) => f.id === fonts.body) ?? PPTX_FONTS[0];
  const head = PPTX_FONTS.find((f) => f.id === fonts.head) ?? font;
  return {
    name: "Moslashtirilgan",
    dark: noHash(dark),
    accent: noHash(accentOnDark),
    onAccent: noHash(onAccent),
    tint: noHash(mix(primary, "#FFFFFF", 0.93)),
    tint2: noHash(mix(primary, "#FFFFFF", 0.84)),
    darkSub: noHash(ensure(mix(dark, "#FFFFFF", 0.72), dark, 4.5, "#FFFFFF")),
    head: head.name,
    body: font.name,
  };
}
