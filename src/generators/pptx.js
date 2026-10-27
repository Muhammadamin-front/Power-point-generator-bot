import PptxGenJS from "pptxgenjs";
import { clip, fitSize, textHeight } from "./fit.js";
import { customPptxTheme } from "./colors.js";
import { labelsFor } from "./labels.js";

// Slayd o'lchami: 16:9, 10 × 5.625 dyuym.
const W = 10;
const H = 5.625;
const MX = 0.6; // chap/o'ng chekka
const CW = W - MX * 2; // kontent kengligi

const TEXT = "1F2937";
const MUTED = "64748B";

export const THEMES = {
  midnight: { name: "Tungi koʻk", dark: "1E2761", accent: "F4A261", onAccent: "1E2761", tint: "EEF1FB", tint2: "D9E0F5", darkSub: "C9D3F2", head: "Cambria", body: "Calibri" },
  forest: { name: "Oʻrmon", dark: "1F4D2C", accent: "8DC26F", onAccent: "1F4D2C", tint: "EFF6EA", tint2: "D6E9CB", darkSub: "CFE3C4", head: "Cambria", body: "Calibri" },
  coral: { name: "Marjon", dark: "2F3C7E", accent: "F96167", onAccent: "FFFFFF", tint: "FFF1F1", tint2: "FCD9DA", darkSub: "D3D8F0", head: "Calibri", body: "Calibri" },
  teal: { name: "Firuza", dark: "05445E", accent: "02C39A", onAccent: "05445E", tint: "EAF8F5", tint2: "C8EEE5", darkSub: "BFE3EA", head: "Calibri", body: "Calibri" },
  berry: { name: "Gilos", dark: "6D2E46", accent: "E8A87C", onAccent: "6D2E46", tint: "FAF1F3", tint2: "F0DAE1", darkSub: "E8CDD6", head: "Cambria", body: "Calibri" },
  charcoal: { name: "Grafit", dark: "2B2D31", accent: "FFB400", onAccent: "2B2D31", tint: "F4F4F5", tint2: "E4E4E7", darkSub: "D4D4D8", head: "Arial", body: "Arial" },
};

// ---------- Slayd qurilmalari ----------

function defineLayouts(pres, t) {
  const title = (w, color) => ({
    placeholder: {
      options: { name: "title", type: "title", x: MX, y: 0.32, w, h: 0.85, fontFace: t.head, bold: true, color, align: "left", valign: "middle", margin: 0 },
      text: "",
    },
  });
  const slideNumber = (color) => ({ x: W - MX - 0.6, y: H - 0.45, w: 0.6, h: 0.3, fontFace: t.body, fontSize: 10, color, align: "right" });

  pres.defineSlideMaster({ title: "LIGHT", background: { color: "FFFFFF" }, objects: [title(CW, t.dark)], slideNumber: slideNumber(MUTED) });
  pres.defineSlideMaster({ title: "SPLIT", background: { color: "FFFFFF" }, objects: [title(5.2, t.dark)], slideNumber: slideNumber(MUTED) });
  pres.defineSlideMaster({ title: "DARK", background: { color: t.dark }, objects: [title(CW, "FFFFFF")], slideNumber: slideNumber(t.darkSub) });
  pres.defineSlideMaster({ title: "COVER", background: { color: t.dark }, objects: [] });
}

function addTitle(slide, text, width = CW) {
  const value = clip(text, 90);
  slide.addText(value, { placeholder: "title", fontSize: fitSize(value, { w: width, h: 0.85, max: 28, min: 20, bold: true }) });
}

/** Raqamli doira — taqdimot bo'ylab takrorlanadigan asosiy belgi. */
function numberCircle(slide, t, n, x, y, d = 0.5) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: t.accent }, line: { type: "none" } });
  slide.addText(String(n), {
    x, y, w: d, h: d, margin: 0, align: "center", valign: "middle",
    fontFace: t.head, fontSize: Math.round(d * 30), bold: true, color: t.onAccent, isTextBox: true,
  });
}

function coverCircles(slide, t, mirrored = false) {
  const x = (v, w) => (mirrored ? W - v - w : v);
  slide.addShape("ellipse", { x: x(6.5, 4.8), y: -1.3, w: 4.8, h: 4.8, fill: { color: "FFFFFF", transparency: 93 }, line: { type: "none" } });
  slide.addShape("ellipse", { x: x(7.7, 3.4), y: 3.1, w: 3.4, h: 3.4, fill: { color: t.darkSub, transparency: 86 }, line: { type: "none" } });
  slide.addShape("ellipse", { x: x(6.15, 0.55), y: 3.75, w: 0.55, h: 0.55, fill: { color: t.accent }, line: { type: "none" } });
}

// ---------- Slayd turlari ----------

function coverSlide(pres, t, deck, L) {
  const slide = pres.addSlide({ masterName: "COVER" });
  coverCircles(slide, t);
  if (deck.subject) {
    slide.addText(clip(deck.subject, 60).toUpperCase(), {
      x: MX, y: 0.55, w: 6, h: 0.35, margin: 0, fontFace: t.body, fontSize: 12, bold: true, color: t.accent, charSpacing: 2, isTextBox: true,
    });
  }
  const title = clip(deck.title, 110);
  slide.addText(title, {
    x: MX, y: 1.15, w: 6.2, h: 2.05, margin: 0, valign: "bottom", fontFace: t.head, bold: true, color: "FFFFFF", isTextBox: true,
    fontSize: fitSize(title, { w: 6.2, h: 2.05, max: 40, min: 24, font: t.head, bold: true, lineHeight: 1.15 }),
  });
  const subtitle = clip(deck.subtitle, 120);
  slide.addText(subtitle, {
    x: MX, y: 3.35, w: 6.0, h: 0.7, margin: 0, valign: "top", fontFace: t.body, color: t.darkSub, isTextBox: true,
    fontSize: fitSize(subtitle, { w: 6.0, h: 0.7, max: 16, min: 12 }),
  });

  const p = deck.profile ?? {};
  const lines = [];
  if (p.name) lines.push(`${L.presenter}: ${L.student(p.name, p.group)}`);
  if (p.university) lines.push(p.university);
  if (p.teacher) lines.push(`${L.checkedBy}: ${p.teacher}`);
  if (lines.length) {
    slide.addText(lines.map((text, i) => ({ text: clip(text, 80), options: { breakLine: i < lines.length - 1 } })), {
      x: MX, y: 4.3, w: 6.0, h: 0.95, margin: 0, valign: "bottom", fontFace: t.body, fontSize: 11, color: t.darkSub, isTextBox: true,
    });
  }
}

function numberedRows(slide, t, items, { x, y, w, rowH, max = 18, min = 12 }) {
  const textW = w - 0.75;
  const fontSize = Math.min(max, ...items.map((item) => fitSize(item, { w: textW, h: rowH - 0.1, max, min })));
  items.forEach((item, i) => {
    const top = y + i * rowH;
    numberCircle(slide, t, i + 1, x, top + (rowH - 0.5) / 2);
    slide.addText(item, {
      x: x + 0.72, y: top, w: textW, h: rowH, margin: 0, valign: "middle", fontFace: t.body, fontSize, color: TEXT, isTextBox: true,
    });
  });
}

function agendaSlide(pres, t, deck, L) {
  const slide = pres.addSlide({ masterName: "LIGHT" });
  addTitle(slide, L.agenda);
  const items = deck.outline.slice(0, 6).map((item) => clip(item, 60));
  if (items.length <= 4) {
    numberedRows(slide, t, items, { x: MX, y: 1.45, w: CW, rowH: 0.85, max: 20 });
  } else {
    const half = Math.ceil(items.length / 2);
    const colW = (CW - 0.4) / 2;
    numberedRows(slide, t, items.slice(0, half), { x: MX, y: 1.45, w: colW, rowH: 1.0, max: 18 });
    const right = items.slice(half);
    right.forEach((item, i) => {
      const top = 1.45 + i * 1.0;
      numberCircle(slide, t, half + i + 1, MX + colW + 0.4, top + 0.25);
    });
    const textW = colW - 0.75;
    const fontSize = Math.min(18, ...right.map((item) => fitSize(item, { w: textW, h: 0.9, max: 18, min: 12 })));
    right.forEach((item, i) => {
      slide.addText(item, {
        x: MX + colW + 0.4 + 0.72, y: 1.45 + i * 1.0, w: textW, h: 1.0, margin: 0, valign: "middle",
        fontFace: t.body, fontSize, color: TEXT, isTextBox: true,
      });
    });
  }
}

function bulletsSlide(pres, t, s, L, image) {
  const slide = pres.addSlide({ masterName: image ? "SPLIT" : "LIGHT" });
  addTitle(slide, s.title, image ? 5.2 : CW);
  const points = s.points.slice(0, 5).map((point) => clip(point, 140));
  const textW = image ? 5.2 : 5.5;
  const boxH = 3.55;
  const fontSize = fitSize(points, { w: textW, h: boxH, max: 18, min: 12, gap: 10, indent: 0.3 });
  slide.addText(
    points.map((text, i) => ({ text, options: { bullet: { indent: 18 }, breakLine: i < points.length - 1 } })),
    { x: MX, y: 1.4, w: textW, h: boxH, margin: 0, valign: "top", fontFace: t.body, fontSize, color: TEXT, paraSpaceAfter: 10, isTextBox: true },
  );

  if (image) {
    slide.addImage({ data: image, x: 6.2, y: 0, w: W - 6.2, h: H, altText: s.title });
  } else {
    const cardX = 6.45;
    const cardW = W - MX - cardX;
    slide.addShape("roundRect", { x: cardX, y: 1.4, w: cardW, h: 3.55, rectRadius: 0.12, fill: { color: t.tint }, line: { type: "none" } });
    slide.addShape("ellipse", { x: cardX + 0.3, y: 1.7, w: 0.5, h: 0.5, fill: { color: t.accent }, line: { type: "none" } });
    slide.addText("!", {
      x: cardX + 0.3, y: 1.7, w: 0.5, h: 0.5, margin: 0, align: "center", valign: "middle",
      fontFace: t.head, fontSize: 18, bold: true, color: t.onAccent, isTextBox: true,
    });
    slide.addText(L.keyPoint.toUpperCase(), {
      x: cardX + 0.95, y: 1.7, w: cardW - 1.15, h: 0.5, margin: 0, valign: "middle",
      fontFace: t.body, fontSize: 11, bold: true, color: t.dark, charSpacing: 1, isTextBox: true,
    });
    const highlight = clip(s.highlight, 170);
    slide.addText(highlight, {
      x: cardX + 0.3, y: 2.4, w: cardW - 0.6, h: 2.35, margin: 0, valign: "top", fontFace: t.head, italic: true, color: t.dark, isTextBox: true,
      fontSize: fitSize(highlight, { w: cardW - 0.6, h: 2.35, max: 17, min: 12, font: t.head }),
    });
  }
  return slide;
}

function cardsSlide(pres, t, s) {
  const slide = pres.addSlide({ masterName: "LIGHT" });
  addTitle(slide, s.title);
  const items = s.items.slice(0, 4);
  const gap = 0.25;
  const cardW = (CW - gap * (items.length - 1)) / items.length;
  const cardY = 1.4;
  const inner = cardW - 0.5;
  const headings = items.map((item) => clip(item.heading, 40));
  const texts = items.map((item) => clip(item.text, 150));
  const headSize = Math.min(...headings.map((h) => fitSize(h, { w: inner, h: 0.65, max: 16, min: 12, bold: true })));
  const textSize = Math.min(...texts.map((text) => fitSize(text, { w: inner, h: 1.95, max: 16, min: 11 })));
  const textH = Math.min(1.95, Math.max(...texts.map((text) => textHeight([text], inner, textSize))) + 0.1);
  const cardH = 1.55 + textH + 0.25;

  items.forEach((_, i) => {
    const x = MX + i * (cardW + gap);
    slide.addShape("roundRect", { x, y: cardY, w: cardW, h: cardH, rectRadius: 0.12, fill: { color: t.tint }, line: { type: "none" } });
    numberCircle(slide, t, i + 1, x + 0.25, cardY + 0.25);
    slide.addText(headings[i], {
      x: x + 0.25, y: cardY + 0.9, w: inner, h: 0.65, margin: 0, valign: "top", fontFace: t.head, fontSize: headSize, bold: true, color: t.dark, isTextBox: true,
    });
    slide.addText(texts[i], {
      x: x + 0.25, y: cardY + 1.55, w: inner, h: textH, margin: 0, valign: "top", fontFace: t.body, fontSize: textSize, color: TEXT, isTextBox: true,
    });
  });
  return slide;
}

function statsSlide(pres, t, s) {
  const slide = pres.addSlide({ masterName: "DARK" });
  addTitle(slide, s.title);
  const stats = s.stats.slice(0, 4);
  const gap = 0.3;
  const colW = (CW - gap * (stats.length - 1)) / stats.length;
  const values = stats.map((stat) => clip(stat.value, 10));
  const valueSize = Math.min(...values.map((v) => fitSize(v, { w: colW, h: 1.0, max: 48, min: 28, font: t.head, bold: true })));
  const labels = stats.map((stat) => clip(stat.label, 80));
  const labelSize = Math.min(...labels.map((label) => fitSize(label, { w: colW, h: 1.0, max: 15, min: 11 })));

  stats.forEach((_, i) => {
    const x = MX + i * (colW + gap);
    slide.addShape("ellipse", { x, y: 1.6, w: 0.22, h: 0.22, fill: { color: t.accent }, line: { type: "none" } });
    slide.addText(values[i], {
      x, y: 1.95, w: colW, h: 1.0, margin: 0, valign: "middle", fontFace: t.head, fontSize: valueSize, bold: true, color: t.accent, isTextBox: true,
    });
    slide.addText(labels[i], {
      x, y: 3.0, w: colW, h: 1.0, margin: 0, valign: "top", fontFace: t.body, fontSize: labelSize, color: "FFFFFF", isTextBox: true,
    });
  });
  if (s.note) {
    const note = clip(s.note, 150);
    slide.addText(note, {
      x: MX, y: 4.3, w: CW - 0.8, h: 0.6, margin: 0, valign: "top", fontFace: t.body, italic: true, color: t.darkSub, isTextBox: true,
      fontSize: fitSize(note, { w: CW - 0.8, h: 0.6, max: 13, min: 10 }),
    });
  }
  return slide;
}

function timelineSlide(pres, t, s) {
  const slide = pres.addSlide({ masterName: "LIGHT" });
  addTitle(slide, s.title);
  const steps = s.steps.slice(0, 5);
  const colW = CW / steps.length;
  const lineY = 1.95;
  const d = 0.55;
  slide.addShape("line", { x: MX + colW / 2, y: lineY, w: CW - colW, h: 0, line: { color: t.tint2, width: 3 } });
  const inner = colW - 0.2;
  const headings = steps.map((step) => clip(step.heading, 32));
  const texts = steps.map((step) => clip(step.text, 110));
  const headSize = Math.min(...headings.map((h) => fitSize(h, { w: inner, h: 0.62, max: 15, min: 11, bold: true })));
  const textSize = Math.min(...texts.map((text) => fitSize(text, { w: inner, h: 2.1, max: 14, min: 10 })));
  steps.forEach((_, i) => {
    const cx = MX + colW * i + colW / 2;
    numberCircle(slide, t, i + 1, cx - d / 2, lineY - d / 2, d);
    slide.addText(headings[i], {
      x: cx - inner / 2, y: lineY + 0.5, w: inner, h: 0.62, margin: 0, align: "center", valign: "top",
      fontFace: t.head, fontSize: headSize, bold: true, color: t.dark, isTextBox: true,
    });
    slide.addText(texts[i], {
      x: cx - inner / 2, y: lineY + 1.15, w: inner, h: 2.1, margin: 0, align: "center", valign: "top",
      fontFace: t.body, fontSize: textSize, color: TEXT, isTextBox: true,
    });
  });
  return slide;
}

function comparisonSlide(pres, t, s) {
  const slide = pres.addSlide({ masterName: "LIGHT" });
  addTitle(slide, s.title);
  const gap = 0.3;
  const colW = (CW - gap) / 2;
  const columns = [s.left, s.right].map((column) => ({
    heading: clip(column.heading, 40),
    points: column.points.slice(0, 4).map((point) => clip(point, 100)),
  }));
  const pointsW = colW - 0.6;
  const headSize = Math.min(...columns.map((c) => fitSize(c.heading, { w: colW - 1.2, h: 0.6, max: 18, min: 13, bold: true })));
  const pointSize = Math.min(...columns.map((c) => fitSize(c.points, { w: pointsW, h: 2.45, max: 18, min: 11, gap: 8, indent: 0.3 })));
  // Kartaning balandligi matn hajmiga moslashadi, shunda pastda ortiqcha bo'sh joy qolmaydi.
  const pointsH = Math.min(2.45, Math.max(...columns.map((c) => textHeight(c.points, pointsW - 0.3, pointSize, { gap: 8 }))) + 0.15);
  const cardH = 0.95 + pointsH + 0.25;

  columns.forEach((column, i) => {
    const x = MX + i * (colW + gap);
    slide.addShape("roundRect", {
      x, y: 1.4, w: colW, h: cardH, rectRadius: 0.12, fill: { color: i === 0 ? t.tint : t.tint2 }, line: { type: "none" },
    });
    numberCircle(slide, t, i === 0 ? "A" : "B", x + 0.3, 1.65);
    slide.addText(column.heading, {
      x: x + 0.95, y: 1.6, w: colW - 1.2, h: 0.6, margin: 0, valign: "middle", fontFace: t.head, fontSize: headSize, bold: true, color: t.dark, isTextBox: true,
    });
    slide.addText(
      column.points.map((text, j) => ({ text, options: { bullet: { indent: 16 }, breakLine: j < column.points.length - 1 } })),
      { x: x + 0.3, y: 2.35, w: pointsW, h: pointsH, margin: 0, valign: "top", fontFace: t.body, fontSize: pointSize, color: TEXT, paraSpaceAfter: 8, isTextBox: true },
    );
  });
  return slide;
}

function quoteSlide(pres, t, s) {
  const slide = pres.addSlide({ masterName: "COVER" });
  coverCircles(slide, t, true);
  slide.addText("“", {
    x: MX + 0.6, y: 0.45, w: 1.2, h: 1.2, margin: 0, fontFace: t.head, fontSize: 110, bold: true, color: t.accent, isTextBox: true,
  });
  const quote = clip(s.quote, 230);
  slide.addText(quote, {
    x: MX + 0.6, y: 1.55, w: 7.6, h: 2.3, margin: 0, valign: "middle", fontFace: t.head, italic: true, color: "FFFFFF", isTextBox: true,
    fontSize: fitSize(quote, { w: 7.6, h: 2.3, max: 28, min: 16, font: t.head, lineHeight: 1.2 }),
  });
  slide.addText(`— ${clip(s.author, 80)}`, {
    x: MX + 0.6, y: 4.0, w: 7.6, h: 0.5, margin: 0, fontFace: t.body, fontSize: 16, color: t.darkSub, isTextBox: true,
  });
  return slide;
}

function conclusionSlide(pres, t, deck, L) {
  const slide = pres.addSlide({ masterName: "LIGHT" });
  addTitle(slide, L.slideConclusion);
  const points = deck.conclusion.slice(0, 4).map((point) => clip(point, 140));
  const rowH = Math.min(0.9, 3.6 / Math.max(points.length, 1));
  numberedRows(slide, t, points, { x: MX, y: 1.4, w: CW, rowH, max: 18, min: 12 });
}

function referencesSlide(pres, t, deck, L) {
  const slide = pres.addSlide({ masterName: "LIGHT" });
  addTitle(slide, L.slideReferences);
  const refs = deck.references.slice(0, 6).map((ref) => clip(ref.replace(/^\s*\d+[.)]\s*/, ""), 180));
  slide.addText(
    refs.map((text, i) => ({ text, options: { bullet: { type: "number", indent: 22 }, breakLine: i < refs.length - 1 } })),
    {
      x: MX, y: 1.4, w: CW, h: 3.6, margin: 0, valign: "top", fontFace: t.body, color: TEXT, paraSpaceAfter: 6, isTextBox: true,
      fontSize: fitSize(refs, { w: CW, h: 3.6, max: 15, min: 10, gap: 6, indent: 0.35 }),
    },
  );
}

function thanksSlide(pres, t, deck, L) {
  const slide = pres.addSlide({ masterName: "COVER" });
  coverCircles(slide, t, true);
  slide.addText(L.thanks, {
    x: 3.2, y: 1.6, w: 6.2, h: 1.6, margin: 0, align: "right", valign: "bottom", fontFace: t.head, bold: true, color: "FFFFFF", isTextBox: true,
    fontSize: fitSize(L.thanks, { w: 6.2, h: 1.6, max: 40, min: 26, font: t.head, bold: true }),
  });
  slide.addText(L.questions, {
    x: 3.2, y: 3.35, w: 6.2, h: 0.5, margin: 0, align: "right", fontFace: t.body, fontSize: 18, color: t.darkSub, isTextBox: true,
  });
  if (deck.profile?.name) {
    slide.addText(deck.profile.name, {
      x: 3.2, y: 4.6, w: 6.2, h: 0.4, margin: 0, align: "right", fontFace: t.body, fontSize: 13, color: t.accent, isTextBox: true,
    });
  }
}

/**
 * Taqdimot yaratadi va Buffer qaytaradi.
 * deck: DeckSchema + { lang, theme, subject, profile }; images: slayd indeksi → "image/jpeg;base64,..."
 */
export async function buildPptx(deck, images = {}) {
  // "custom" — foydalanuvchi tanlagan ranglar va shrift (deck.colors, deck.fonts)
  const t = deck.theme === "custom" ? customPptxTheme(deck.colors, deck.fonts) : (THEMES[deck.theme] ?? THEMES.midnight);
  const L = labelsFor(deck.lang);
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.title = deck.title;
  if (deck.profile?.name) pres.author = deck.profile.name;
  pres.theme = { headFontFace: t.head, bodyFontFace: t.body };
  defineLayouts(pres, t);

  coverSlide(pres, t, deck, L);
  agendaSlide(pres, t, deck, L);

  deck.slides.forEach((s, i) => {
    let slide;
    switch (s.type) {
      case "cards":
        slide = s.items?.length ? cardsSlide(pres, t, s) : null;
        break;
      case "stats":
        slide = s.stats?.length ? statsSlide(pres, t, s) : null;
        break;
      case "timeline":
        slide = s.steps?.length ? timelineSlide(pres, t, s) : null;
        break;
      case "comparison":
        slide = s.left && s.right ? comparisonSlide(pres, t, s) : null;
        break;
      case "quote":
        slide = s.quote ? quoteSlide(pres, t, s) : null;
        break;
      default:
        slide = null;
    }
    if (!slide) {
      const points = s.points?.length ? s.points : [s.notes].filter(Boolean);
      slide = bulletsSlide(pres, t, { highlight: "", ...s, points }, L, images[i]);
    }
    if (s.notes) slide.addNotes(s.notes);
  });

  conclusionSlide(pres, t, deck, L);
  if (deck.references?.length) referencesSlide(pres, t, deck, L);
  thanksSlide(pres, t, deck, L);

  return pres.write({ outputType: "nodebuffer" });
}
