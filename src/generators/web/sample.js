import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../../config.js";
import { normalizeColors } from "../colors.js";
import { DEFAULT_FONTS, FONTS, buildWebDeck } from "./build.js";

const LANGS = new Set(["uz", "uz_cyrl", "ru", "en"]);
const text = (value, max) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

let base;

/**
 * Jonli namuna: tayyor mazmun + foydalanuvchining tanlagan ranglari, shriftlari, sarlavhasi va ismi.
 * Kiruvchi qiymatlar faqat matn sifatida ishlatiladi (rang va shrift ro'yxatdan tekshiriladi).
 */
export function buildWebSample(query = {}) {
  base ??= JSON.parse(fs.readFileSync(path.join(ROOT, "assets", "web", "sample.json"), "utf8"));
  const deck = structuredClone(base);
  const { primary, accent } = normalizeColors({ primary: `#${text(query.primary, 6)}`, accent: `#${text(query.accent, 6)}` });
  deck.theme = { primary, accent };
  if (LANGS.has(query.lang)) deck.lang = query.lang;
  const title = text(query.title, 120);
  if (title.length >= 3) deck.cover.title = title.charAt(0).toUpperCase() + title.slice(1);
  for (const key of ["name", "group"]) if (text(query[key], 100)) deck.cover[key] = text(query[key], key === "group" ? 40 : 100);
  const fonts = {
    body: FONTS[query.body] ? query.body : DEFAULT_FONTS.body,
    display: FONTS[query.display] ? query.display : DEFAULT_FONTS.display,
  };
  return buildWebDeck(deck, fonts);
}
