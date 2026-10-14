// Matnni slayddagi qutiga sig'dirish uchun taxminiy o'lchovlar (dyuym va pt'da).

// Shriftdagi o'rtacha harf kengligi (shrift o'lchamiga nisbatan), biroz zaxira bilan.
const CHAR_WIDTH = {
  Calibri: 0.5,
  Cambria: 0.54,
  Arial: 0.55,
  Georgia: 0.56,
  Consolas: 0.56,
  "Segoe UI": 0.54,
  "Segoe UI Light": 0.51,
  "Segoe UI Semibold": 0.56,
  "Segoe UI Black": 0.63,
  "Bodoni MT": 0.55,
  "Bodoni MT Black": 0.7,
  "Gill Sans MT": 0.5,
};

export function charWidth(font, bold = false) {
  return (CHAR_WIDTH[font] ?? 0.56) * (bold ? 1.06 : 1);
}

export function countLines(text, perLine) {
  let lines = 0;
  for (const paragraph of String(text).split("\n")) {
    let length = 0;
    let count = 1;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (length === 0) length = word.length;
      else if (length + 1 + word.length <= perLine) length += 1 + word.length;
      else {
        count += 1;
        length = word.length;
      }
      while (length > perLine) {
        count += 1;
        length -= perLine;
      }
    }
    lines += count;
  }
  return lines;
}

/** Matnlar berilgan qutiga sig'adigan eng katta shrift o'lchamini (pt) topadi. */
export function fitSize(texts, { w, h, max, min, font = "Calibri", bold = false, lineHeight = 1.2, gap = 0, indent = 0, upper = false }) {
  const list = Array.isArray(texts) ? texts : [texts];
  // Bosh harflar o'rtacha ~20% kengroq (harflar orasidagi masofa bilan)
  const cw = charWidth(font, bold) * (upper ? 1.22 : 1);
  for (let pt = max; pt > min; pt -= 1) {
    const perLine = Math.max(6, Math.floor(((w - indent) * 72) / (pt * cw)));
    const lines = list.reduce((sum, text) => sum + countLines(text, perLine), 0);
    const height = (lines * pt * lineHeight + gap * (list.length - 1)) / 72;
    if (height <= h) return pt;
  }
  return min;
}

/** Matnning berilgan shrift o'lchamidagi taxminiy balandligi (dyuym). */
export function textHeight(texts, w, pt, { gap = 0, font = "Calibri", bold = false, lineHeight = 1.2, indent = 0 } = {}) {
  const list = Array.isArray(texts) ? texts : [texts];
  const perLine = Math.max(6, Math.floor(((w - indent) * 72) / (pt * charWidth(font, bold))));
  const lines = list.reduce((sum, text) => sum + countLines(text, perLine), 0);
  return (lines * pt * lineHeight + gap * (list.length - 1)) / 72;
}

/** Juda uzun matnni so'z chegarasida qisqartiradi. */
export function clip(text, max) {
  const value = String(text ?? "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
}
