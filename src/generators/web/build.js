import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../../config.js";

// Premium 3D veb-taqdimot: web/ loyihasidan yig'ilgan shablon (assets/web/template.html) ichiga mazmun (JSON)
// va tanlangan shriftlar joylanadi. Natija — bitta o'z-o'zidan yetarli .html fayl (file:// orqali ham ochiladi).
const DIR = path.join(ROOT, "assets", "web");
const TEMPLATE = path.join(DIR, "template.html");
const FONT_DIR = path.join(DIR, "fonts");

/** id -> { name, kind: "sans" | "serif", faces: [{ file, weight, range }] } */
export const FONTS = JSON.parse(fs.readFileSync(path.join(FONT_DIR, "manifest.json"), "utf8"));
export const DEFAULT_FONTS = { body: "commissioner", display: "cormorant-garamond" };

let template;
const faceCache = new Map();

function faces(id, family) {
  const font = FONTS[id];
  return font.faces
    .map((face) => {
      const key = face.file;
      if (!faceCache.has(key)) faceCache.set(key, fs.readFileSync(path.join(FONT_DIR, face.file)).toString("base64"));
      return `@font-face{font-family:"${family}";font-style:normal;font-display:swap;font-weight:${face.weight};src:url(data:font/woff2;base64,${faceCache.get(key)}) format("woff2");unicode-range:${face.range}}`;
    })
    .join("");
}

/** Faqat tanlangan ikki shrift fayl ichiga joylanadi */
export function fontCss({ body, display }) {
  const b = FONTS[body] ? body : DEFAULT_FONTS.body;
  const d = FONTS[display] ? display : DEFAULT_FONTS.display;
  return faces(b, "ft-body") + faces(d, "ft-display");
}

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** JSON'ni <script type="application/json"> ichiga xavfsiz joylash: "<" belgisi hech qachon teg ochmaydi */
export function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/** deck — web/src/types.ts dagi Deck; fonts — { body, display } shrift identifikatorlari. Buffer qaytaradi. */
export function buildWebDeck(deck, fonts = DEFAULT_FONTS) {
  template ??= fs.readFileSync(TEMPLATE, "utf8");
  const html = template
    .replace("<title>Taqdimot</title>", () => `<title>${escapeHtml(deck.cover?.title ?? "Taqdimot")}</title>`)
    .replace("<!--FONTS-->", () => `<style>${fontCss(fonts)}</style>`)
    .replace('<script id="deck" type="application/json">__DECK_JSON__</script>', () => `<script id="deck" type="application/json">${safeJson(deck)}</script>`);
  if (!html.includes('type="application/json">{')) throw new Error("Shablonda mazmun joyi topilmadi (assets/web/template.html ni qayta yig'ing: cd web && npm run build)");
  return Buffer.from(html, "utf8");
}
