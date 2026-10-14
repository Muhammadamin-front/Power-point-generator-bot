import PptxGenJS from "pptxgenjs";
import { clip, fitSize } from "../fit.js";
import { labelsFor } from "../labels.js";
import { finalizeDeck } from "./animate.js";
import { PREMIUM } from "./templates.js";

// Slayd: 16:9, 13.33 × 7.5 dyuym (PowerPoint'ning standart keng formati).
const W = 13.333;
const MX = 0.9;
const CW = W - MX * 2;
const TITLE_W = CW - 1.3; // o'ng yuqori burchak dekor uchun bo'sh qoladi
const BODY_Y = 1.95;
const BODY_B = 6.85;

const num = (i) => String(i + 1).padStart(2, "0");
// Gradient beriladigan matn belgisi: asl rangdan 1 birlikka farq qiladi, gradient qo'llanmasa ham to'g'ri ko'rinadi.
const marker = (hex) => hex.slice(0, 5) + (hex[5] === "F" ? "E" : "F");

// ---------- Slayd konteksti ----------

function newSlide(ctx, kind, master) {
  const slide = ctx.pres.addSlide({ masterName: master });
  const n = ctx.specs.length + 1;
  const spec = { transition: n === 1 ? "fade" : "morph", effects: [], patches: {} };
  ctx.specs.push(spec);
  const pal = ctx.t.palette[ctx.t.surfaces[kind]];
  // Yorug' va qorong'i fonda aksent rangi har xil bo'lishi mumkin (kontrast uchun)
  const s = { slide, spec, n, kind, pal, accent: pal.accent ?? ctx.t.accent, accent2: pal.accent2 ?? ctx.t.accent2 };
  s.name = (role) => `s${n}-${role}`;
  addDecor(ctx, s);
  return s;
}

function addDecor(ctx, s) {
  const { decor } = ctx.t;
  let frame = decor[s.kind];
  if (s.kind === "content") {
    frame = decor.content[ctx.contentIndex % decor.content.length];
    ctx.contentIndex += 1;
  }
  for (const [name, [x, y, size]] of Object.entries(frame)) {
    const image = decor.items?.[name];
    if (image) {
      s.slide.addImage({ path: image.img, x, y, w: size, h: size, transparency: image.alpha, objectName: name, altText: "" });
    } else {
      const shape = decor.shapes[name];
      s.slide.addShape("ellipse", {
        x, y, w: size, h: size, objectName: name,
        fill: shape.outline ? { type: "none" } : { color: shape.color },
        line: shape.outline ? { color: shape.color, width: shape.outline } : { type: "none" },
      });
    }
  }
}

function fx(s, name, kind, effect, delay, dur, extra = {}) {
  s.spec.effects.push({ name, kind, effect, delay, dur, ...extra });
}

function text(s, role, value, options) {
  const name = s.name(role);
  s.slide.addText(value, { isTextBox: true, margin: 0, valign: "top", objectName: name, ...options });
  return name;
}

function panel(ctx, s, role, x, y, w, h) {
  const p = s.pal;
  const name = s.name(role);
  s.slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: 0.14,
    fill: { color: p.panel, transparency: p.panelAlpha },
    line: { color: p.line, width: 0.75 },
    shadow: p.shadow ? { type: "outer", color: "1E293B", opacity: 0.1, blur: 16, offset: 5, angle: 90 } : undefined,
    objectName: name,
  });
  s.spec.patches[name] = { lineAlpha: p.lineAlpha };
  return name;
}

function rule(s, role, x, y, w) {
  const name = s.name(role);
  s.slide.addShape("line", { x, y, w, h: 0, line: { color: s.pal.line, width: 0.75 }, objectName: name });
  s.spec.patches[name] = { lineAlpha: s.pal.lineAlpha };
  return name;
}

function title(ctx, s, value) {
  const { t } = ctx;
  const v = t.upperTitles ? clip(value, 90).toUpperCase() : clip(value, 90);
  s.spec.titleName = s.name("title");
  s.slide.addText(v, {
    placeholder: "title",
    charSpacing: t.upperTitles ? 2 : 0,
    fontSize: fitSize(v, { w: TITLE_W, h: 1.1, max: t.upperTitles ? 30 : 34, min: 20, font: t.fonts.title, bold: t.titleBold, lineHeight: 1.1, upper: t.upperTitles }),
  });
  fx(s, s.spec.titleName, "text", "float", 0, 800);
}

function bulletList(ctx, s, role, points, box, { max = 21, min = 13, color } = {}) {
  const { t } = ctx;
  const size = fitSize(points, { ...box, max, min, font: t.fonts.body, gap: 12, indent: 0.35 });
  const name = s.name(role);
  s.slide.addText(
    points.map((value, i) => ({ text: value, options: { bullet: { code: t.bullet, indent: 22 }, breakLine: i < points.length - 1 } })),
    { ...box, isTextBox: true, margin: 0, valign: "top", fontFace: t.fonts.body, fontSize: size, color: color ?? s.pal.text, paraSpaceAfter: 12, objectName: name },
  );
  s.spec.patches[name] = { bulletColor: s.accent, bulletSize: 80000 };
  return name;
}

function defineMasters(pres, t) {
  const titleOptions = (kind, extra) => {
    const p = t.palette[t.surfaces[kind]];
    return {
      placeholder: {
        options: { name: "title", type: "title", margin: 0, fontFace: t.fonts.title, bold: Boolean(t.titleBold), color: p.text, ...extra },
        text: "",
      },
    };
  };
  const slideNumber = (kind) => ({ x: W - MX - 0.6, y: 6.95, w: 0.6, h: 0.3, fontFace: t.fonts.body, fontSize: 10, color: t.palette[t.surfaces[kind]].muted, align: "right" });

  pres.defineSlideMaster({
    title: "P_COVER",
    background: { path: t.bg.cover },
    objects: [{ placeholder: { options: { name: "title", type: "title", x: MX, y: 1.55, w: 8.4, h: 3.15, margin: 0, valign: "bottom", align: "left", fontFace: t.fonts.display }, text: "" } }],
  });
  pres.defineSlideMaster({
    title: "P_CONTENT",
    background: { path: t.bg.content },
    objects: [titleOptions("content", { x: MX, y: 0.5, w: TITLE_W, h: 1.15, valign: "middle", align: "left" })],
    slideNumber: slideNumber("content"),
  });
  pres.defineSlideMaster({
    title: "P_SECTION",
    background: { path: t.bg.section },
    objects: [titleOptions("section", { x: MX, y: 0.5, w: TITLE_W, h: 1.15, valign: "middle", align: "left" })],
    slideNumber: slideNumber("section"),
  });
  pres.defineSlideMaster({
    title: "P_END",
    background: { path: t.bg.end },
    objects: [titleOptions("end", { x: MX, y: 1.95, w: CW, h: 1.95, valign: "bottom", align: "center", fontFace: t.fonts.display })],
  });
}

// ---------- Slayd turlari ----------

function cover(ctx) {
  const { t, deck, L } = ctx;
  const s = newSlide(ctx, "cover", "P_COVER");
  const p = s.pal;
  if (deck.subject) {
    const label = text(s, "label", clip(deck.subject, 70).toUpperCase(), {
      x: MX, y: 1.0, w: 8.2, h: 0.4, fontFace: t.fonts.body, fontSize: 13, bold: true, color: s.accent, charSpacing: 4,
    });
    fx(s, label, "text", "fade", 0, 600);
  }

  const raw = clip(deck.title, 110);
  const value = t.upperCover ? raw.toUpperCase() : raw;
  const words = value.split(/\s+/);
  s.spec.titleName = s.name("title");
  const fit = { w: 8.4, h: 3.1, max: t.upperCover ? 46 : 58, min: 26, font: t.fonts.display, bold: Boolean(t.titleBold), lineHeight: 1.06, upper: Boolean(t.upperCover) };
  let runs;
  if (t.twoTone && words.length >= 3) {
    const k = Math.max(1, Math.round(words.length * 0.45));
    const first = words.slice(0, k).join(" ");
    const rest = words.slice(k).join(" ");
    const mark = marker(t.twoTone.lightStops[0]);
    runs = [
      { text: first, options: { fontFace: t.fonts.light, color: mark, breakLine: true } },
      { text: rest, options: { fontFace: t.fonts.display, color: p.text } },
    ];
    s.spec.patches[s.spec.titleName] = { gradientText: { marker: mark, stops: t.twoTone.lightStops } };
  } else if (t.goldTitle) {
    const mark = marker(t.goldTitle[0]);
    runs = [{ text: value, options: { color: mark, bold: Boolean(t.titleBold) } }];
    s.spec.patches[s.spec.titleName] = { gradientText: { marker: mark, stops: t.goldTitle } };
  } else if (t.italicAccent && words.length >= 2) {
    const k = Math.max(1, Math.round(words.length * (t.accentSplit ?? 0.6)));
    runs = [
      { text: `${words.slice(0, k).join(" ")} `, options: { color: p.text, bold: true } },
      { text: words.slice(k).join(" "), options: { color: s.accent, italic: true, bold: true } },
    ];
  } else {
    runs = [{ text: value, options: { color: p.text, bold: Boolean(t.titleBold), glow: t.titleGlow ? { ...t.titleGlow } : undefined } }];
  }
  const split = t.twoTone && words.length >= 3 ? Math.max(1, Math.round(words.length * 0.45)) : 0;
  const size = fitSize(split ? [words.slice(0, split).join(" "), words.slice(split).join(" ")] : value, fit);
  s.slide.addText(runs, { placeholder: "title", fontSize: size, charSpacing: t.upperCover ? 3 : 0, lineSpacingMultiple: 0.98 });
  const titleTime = t.letterTitle ? 300 * (1 + 0.06 * (value.length - 1)) : 900;
  fx(s, s.spec.titleName, "text", t.letterTitle ? "fade" : "float", 150, t.letterTitle ? 300 : 900, t.letterTitle ? { iterate: "lt" } : {});

  const sub = clip(deck.subtitle, 130);
  const subName = text(s, "subtitle", sub, {
    x: MX, y: 4.9, w: 7.8, h: 0.9, fontFace: t.fonts.body, color: p.muted,
    fontSize: fitSize(sub, { w: 7.8, h: 0.9, max: 20, min: 14, font: t.fonts.body }),
  });
  fx(s, subName, "text", "fade", 150 + titleTime * 0.55, 700);

  const pr = deck.profile ?? {};
  const lines = [];
  if (pr.name) lines.push(`${L.presenter}: ${L.student(pr.name, pr.group)}`);
  if (pr.university) lines.push(pr.university);
  if (pr.teacher) lines.push(`${L.checkedBy}: ${pr.teacher}`);
  if (lines.length) {
    const meta = text(
      s,
      "meta",
      lines.map((line, i) => ({ text: clip(line, 90), options: { breakLine: i < lines.length - 1 } })),
      { x: MX, y: 6.05, w: 8.4, h: 0.85, valign: "bottom", fontFace: t.fonts.body, fontSize: 12.5, color: p.muted },
    );
    fx(s, meta, "text", "fade", 300 + titleTime * 0.7, 700);
  }
}

function rows(ctx, s, items, { numbered = true, maxSize = 22 } = {}) {
  const { t } = ctx;
  const p = s.pal;
  const two = items.length > 4;
  const per = Math.ceil(items.length / (two ? 2 : 1));
  const colW = two ? (CW - 0.6) / 2 : CW - 1.3;
  const rowH = Math.min(1.12, (BODY_B - BODY_Y - 0.15) / per);
  const textW = colW - 1.3;
  const size = Math.min(maxSize, ...items.map((item) => fitSize(item, { w: textW, h: rowH - 0.16, max: maxSize, min: 13, font: t.fonts.body })));
  items.forEach((item, i) => {
    const col = Math.floor(i / per);
    const row = i % per;
    const x = MX + col * (colW + 0.6);
    const y = BODY_Y + 0.1 + row * rowH;
    const delay = 300 + i * 130;
    if (numbered) {
      const n = text(s, `n${i}`, num(i), {
        x, y, w: 1.15, h: rowH, valign: "middle", fontFace: t.fonts.number, fontSize: 30, bold: Boolean(t.titleBold), italic: Boolean(t.italicAccent), color: s.accent,
      });
      fx(s, n, "text", "fade", delay, 500);
    }
    const name = text(s, `t${i}`, item, { x: x + 1.3, y, w: textW, h: rowH, valign: "middle", fontFace: t.fonts.body, fontSize: size, color: p.text });
    fx(s, name, "text", "float", delay + 60, 700);
    if (row < per - 1 && i < items.length - 1) fx(s, rule(s, `r${i}`, x, y + rowH, colW), "shape", "wipe", delay + 120, 600);
  });
}

function agenda(ctx) {
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, ctx.L.agenda);
  rows(ctx, s, ctx.deck.outline.slice(0, 6).map((item) => clip(item, 64)));
}

function bulletsSlide(ctx, d, image) {
  const { t, L } = ctx;
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, d.title);
  const points = (d.points ?? []).slice(0, 5).map((point) => clip(point, 140));
  if (image) {
    const list = bulletList(ctx, s, "body", points, { x: MX, y: BODY_Y, w: 6.55, h: 4.75 });
    fx(s, list, "text", "float", 250, 700, { paragraphs: points.length, stagger: 160 });
    const pic = s.name("image");
    s.slide.addImage({ data: image, x: 7.95, y: 1.75, w: 4.48, h: 5.1, objectName: pic, altText: d.title });
    s.spec.patches[pic] = { round: 7000 };
    fx(s, pic, "pic", "zoom", 200, 900);
    return s;
  }
  const hl = clip(d.highlight || "", 180);
  if (!hl) {
    // "Asosiy fikr" bo'lmasa, ro'yxat butun kenglikni egallaydi.
    const full = bulletList(ctx, s, "body", points, { x: MX, y: BODY_Y, w: TITLE_W, h: 4.75 }, { max: 22 });
    fx(s, full, "text", "float", 250, 700, { paragraphs: points.length, stagger: 160 });
    return s;
  }
  const list = bulletList(ctx, s, "body", points, { x: MX, y: BODY_Y, w: 6.95, h: 4.75 });
  fx(s, list, "text", "float", 250, 700, { paragraphs: points.length, stagger: 160 });
  const box = panel(ctx, s, "panel", 8.35, BODY_Y, 4.08, 4.75);
  fx(s, box, "shape", "zoom", 350, 800);
  const label = text(s, "label", L.keyPoint.toUpperCase(), { x: 8.75, y: 2.4, w: 3.3, h: 0.4, fontFace: t.fonts.body, fontSize: 12, bold: true, color: s.accent, charSpacing: 3 });
  fx(s, label, "text", "fade", 650, 500);
  const hlName = text(s, "highlight", hl, {
    x: 8.75, y: 2.95, w: 3.3, h: 3.45, fontFace: t.fonts.light, italic: true, color: s.pal.text,
    fontSize: fitSize(hl, { w: 3.3, h: 3.45, max: 22, min: 14, font: t.fonts.light, lineHeight: 1.25 }), lineSpacingMultiple: 1.05,
  });
  fx(s, hlName, "text", "fade", 800, 800);
  return s;
}

function cardsSlide(ctx, d) {
  const { t } = ctx;
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, d.title);
  const items = (d.items ?? []).slice(0, 4);
  const gap = 0.3;
  const w = (CW - gap * (items.length - 1)) / items.length;
  const y = 2.05;
  const h = 4.55;
  const inner = w - 0.7;
  const heads = items.map((item) => clip(item.heading, 42));
  const texts = items.map((item) => clip(item.text, 150));
  const headSize = Math.min(...heads.map((v) => fitSize(v, { w: inner, h: 0.95, max: 21, min: 14, font: t.fonts.title, bold: Boolean(t.titleBold) })));
  const textSize = Math.min(...texts.map((v) => fitSize(v, { w: inner, h: h - 2.45, max: 16, min: 12, font: t.fonts.body, lineHeight: 1.25 })));
  items.forEach((_, i) => {
    const x = MX + i * (w + gap);
    const delay = 300 + i * 150;
    fx(s, panel(ctx, s, `c${i}`, x, y, w, h), "shape", "zoom", delay, 800);
    const n = text(s, `n${i}`, num(i), { x: x + 0.35, y: y + 0.32, w: inner, h: 0.7, fontFace: t.fonts.number, fontSize: 30, bold: Boolean(t.titleBold), italic: Boolean(t.italicAccent), color: s.accent });
    fx(s, n, "text", "fade", delay + 150, 500);
    const hd = text(s, `h${i}`, heads[i], { x: x + 0.35, y: y + 1.15, w: inner, h: 0.95, fontFace: t.fonts.title, bold: Boolean(t.titleBold), fontSize: headSize, color: s.pal.text });
    fx(s, hd, "text", "fade", delay + 220, 600);
    const tx = text(s, `x${i}`, texts[i], { x: x + 0.35, y: y + 2.15, w: inner, h: h - 2.45, fontFace: t.fonts.body, fontSize: textSize, color: s.pal.muted, lineSpacingMultiple: 1.05 });
    fx(s, tx, "text", "fade", delay + 300, 600);
  });
  return s;
}

function statsSlide(ctx, d) {
  const { t } = ctx;
  const s = newSlide(ctx, "section", "P_SECTION");
  title(ctx, s, d.title);
  const stats = (d.stats ?? []).slice(0, 4);
  const gap = 0.45;
  const w = (CW - gap * (stats.length - 1)) / stats.length;
  const values = stats.map((stat) => clip(stat.value, 10));
  const labels = stats.map((stat) => clip(stat.label, 80));
  const valueSize = Math.min(...values.map((v) => fitSize(v, { w, h: 1.5, max: 72, min: 36, font: t.fonts.display, bold: Boolean(t.titleBold) })));
  const labelSize = Math.min(...labels.map((v) => fitSize(v, { w, h: 1.2, max: 18, min: 12, font: t.fonts.body })));
  const mark = t.valueStops ? marker(t.valueStops[0]) : s.accent;
  stats.forEach((_, i) => {
    const x = MX + i * (w + gap);
    const delay = 300 + i * 170;
    const v = text(s, `v${i}`, values[i], { x, y: 2.3, w, h: 1.55, valign: "bottom", fontFace: t.fonts.display, bold: Boolean(t.titleBold), fontSize: valueSize, color: mark });
    if (t.valueStops) s.spec.patches[v] = { gradientText: { marker: mark, stops: t.valueStops } };
    fx(s, v, "text", "zoom", delay, 800);
    fx(s, rule(s, `r${i}`, x, 4.05, Math.min(w, 2.6)), "shape", "wipe", delay + 200, 600);
    const l = text(s, `l${i}`, labels[i], { x, y: 4.25, w, h: 1.25, fontFace: t.fonts.body, fontSize: labelSize, color: s.pal.text });
    fx(s, l, "text", "fade", delay + 260, 600);
  });
  if (d.note) {
    const note = clip(d.note, 150);
    const n = text(s, "note", note, { x: MX, y: 5.9, w: CW - 1.3, h: 0.7, fontFace: t.fonts.body, italic: true, color: s.pal.muted, fontSize: fitSize(note, { w: CW - 1.3, h: 0.7, max: 15, min: 11, font: t.fonts.body }) });
    fx(s, n, "text", "fade", 400 + stats.length * 170 + 300, 700);
  }
  return s;
}

function timelineSlide(ctx, d) {
  const { t } = ctx;
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, d.title);
  const steps = (d.steps ?? []).slice(0, 5);
  const colW = CW / steps.length;
  const lineY = 3.2;
  fx(s, rule(s, "axis", MX + colW / 2, lineY, CW - colW), "shape", "wipe", 250, 1000);
  const heads = steps.map((step) => clip(step.heading, 32));
  const texts = steps.map((step) => clip(step.text, 110));
  const inner = colW - 0.3;
  const headSize = Math.min(...heads.map((v) => fitSize(v, { w: inner, h: 0.7, max: 20, min: 13, font: t.fonts.title, bold: Boolean(t.titleBold) })));
  const textSize = Math.min(...texts.map((v) => fitSize(v, { w: inner, h: 2.3, max: 15, min: 11, font: t.fonts.body, lineHeight: 1.25 })));
  steps.forEach((_, i) => {
    const cx = MX + colW * i + colW / 2;
    const delay = 500 + i * 190;
    const halo = s.name(`halo${i}`);
    s.slide.addShape("ellipse", { x: cx - 0.31, y: lineY - 0.31, w: 0.62, h: 0.62, fill: { color: s.accent, transparency: 80 }, line: { type: "none" }, objectName: halo });
    fx(s, halo, "shape", "zoom", delay, 700);
    const dot = s.name(`dot${i}`);
    s.slide.addShape("ellipse", { x: cx - 0.15, y: lineY - 0.15, w: 0.3, h: 0.3, fill: { color: s.accent }, line: { type: "none" }, objectName: dot });
    fx(s, dot, "shape", "zoom", delay + 80, 600);
    const hd = text(s, `h${i}`, heads[i], { x: cx - inner / 2, y: lineY + 0.5, w: inner, h: 0.7, align: "center", fontFace: t.fonts.title, bold: Boolean(t.titleBold), fontSize: headSize, color: s.pal.text });
    fx(s, hd, "text", "float", delay + 120, 700);
    const tx = text(s, `x${i}`, texts[i], { x: cx - inner / 2, y: lineY + 1.25, w: inner, h: 2.3, align: "center", fontFace: t.fonts.body, fontSize: textSize, color: s.pal.muted });
    fx(s, tx, "text", "fade", delay + 220, 600);
  });
  return s;
}

function comparisonSlide(ctx, d) {
  const { t } = ctx;
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, d.title);
  const gap = 0.35;
  const w = (CW - gap) / 2;
  const cols = [d.left, d.right].map((c) => ({ heading: clip(c?.heading ?? "", 40), points: (c?.points ?? []).slice(0, 4).map((point) => clip(point, 100)) }));
  const headSize = Math.min(...cols.map((c) => fitSize(c.heading, { w: w - 0.8, h: 0.75, max: 24, min: 15, font: t.fonts.title, bold: Boolean(t.titleBold) })));
  cols.forEach((c, i) => {
    const x = MX + i * (w + gap);
    fx(s, panel(ctx, s, `p${i}`, x, BODY_Y, w, 4.85), "shape", i === 0 ? "flyLeft" : "flyRight", 200 + i * 150, 900);
    const hd = text(s, `h${i}`, c.heading, { x: x + 0.4, y: BODY_Y + 0.35, w: w - 0.8, h: 0.75, fontFace: t.fonts.title, bold: Boolean(t.titleBold), fontSize: headSize, color: i === 0 ? s.accent : s.accent2 });
    fx(s, hd, "text", "fade", 900 + i * 150, 600);
    const list = bulletList(ctx, s, `b${i}`, c.points, { x: x + 0.4, y: BODY_Y + 1.25, w: w - 0.8, h: 3.35 }, { max: 19, min: 12 });
    fx(s, list, "text", "float", 1000 + i * 150, 600, { paragraphs: c.points.length, stagger: 120 });
  });
  return s;
}

function quoteSlide(ctx, d) {
  const { t } = ctx;
  const s = newSlide(ctx, "section", "P_SECTION");
  const mark = text(s, "mark", "“", { x: MX - 0.05, y: 0.45, w: 2.2, h: 2.1, fontFace: t.fonts.display, fontSize: 150, bold: true, color: s.accent, transparency: 10 });
  fx(s, mark, "text", "zoom", 100, 700);
  const quote = clip(d.quote, 230);
  const qName = text(s, "quote", quote, {
    x: MX + 0.3, y: 2.1, w: CW - 1.3, h: 3.1, valign: "middle", fontFace: t.fonts.light, italic: true, color: s.pal.text,
    fontSize: fitSize(quote, { w: CW - 1.3, h: 3.1, max: 36, min: 20, font: t.fonts.light, lineHeight: 1.2 }),
  });
  fx(s, qName, "text", "fade", 350, 500, { iterate: "wd" });
  const words = quote.split(/\s+/).length;
  const author = text(s, "author", `— ${clip(d.author, 80)}`, { x: MX + 0.3, y: 5.4, w: CW - 1.3, h: 0.6, fontFace: t.fonts.body, fontSize: 18, bold: true, color: s.accent });
  fx(s, author, "text", "float", 350 + 500 * (1 + 0.12 * (words - 1)) + 200, 700);
  return s;
}

function conclusion(ctx) {
  if (!ctx.deck.conclusion?.length) return;
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, ctx.L.slideConclusion);
  rows(ctx, s, ctx.deck.conclusion.slice(0, 4).map((point) => clip(point, 140)), { maxSize: 20 });
}

function references(ctx) {
  const { t } = ctx;
  const s = newSlide(ctx, "content", "P_CONTENT");
  title(ctx, s, ctx.L.slideReferences);
  const refs = ctx.deck.references.slice(0, 6).map((ref) => clip(ref.replace(/^\s*\d+[.)]\s*/, ""), 180));
  const name = s.name("refs");
  const lines = refs.map((value, i) => `${i + 1}. ${value}`);
  s.slide.addText(
    lines.map((value, i) => ({ text: value, options: { breakLine: i < lines.length - 1 } })),
    {
      x: MX, y: BODY_Y, w: CW - 1.3, h: 4.75, isTextBox: true, margin: 0, valign: "top", fontFace: t.fonts.body, color: s.pal.muted, paraSpaceAfter: 8, objectName: name,
      fontSize: fitSize(lines, { w: CW - 1.3, h: 4.75, max: 16, min: 11, font: t.fonts.body, gap: 8 }),
    },
  );
  fx(s, name, "text", "fade", 250, 600, { paragraphs: refs.length, stagger: 110 });
}

function thanks(ctx) {
  const { t, deck, L } = ctx;
  const s = newSlide(ctx, "end", "P_END");
  s.spec.titleName = s.name("title");
  const thanksText = t.upperTitles ? L.thanks.toUpperCase() : L.thanks;
  s.slide.addText(thanksText, {
    placeholder: "title",
    charSpacing: t.upperTitles ? 2 : 0,
    fontSize: fitSize(thanksText, { w: CW, h: 1.9, max: 54, min: 28, font: t.fonts.display, bold: Boolean(t.titleBold), lineHeight: 1.08, upper: t.upperTitles }),
  });
  fx(s, s.spec.titleName, "text", "zoom", 200, 1000);
  const q = text(s, "questions", L.questions, { x: MX, y: 4.1, w: CW, h: 0.6, align: "center", fontFace: t.fonts.body, fontSize: 20, color: s.pal.muted });
  fx(s, q, "text", "fade", 900, 700);
  if (deck.profile?.name) {
    const name = text(s, "name", deck.profile.name, { x: MX, y: 4.8, w: CW, h: 0.5, align: "center", fontFace: t.fonts.body, fontSize: 15, bold: true, color: s.accent, charSpacing: 2 });
    fx(s, name, "text", "fade", 1150, 700);
  }
}

/**
 * Premium animatsiyali taqdimot yaratadi va Buffer qaytaradi.
 * deck: DeckSchema + { lang, theme (premium id), subject, profile }; images: slayd indeksi → "image/jpeg;base64,..."
 */
export async function buildPremiumPptx(deck, images = {}) {
  const t = PREMIUM[deck.theme];
  if (!t) throw new Error(`Premium shablon topilmadi: ${deck.theme}`);
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title = deck.title;
  if (deck.profile?.name) pres.author = deck.profile.name;
  pres.theme = { headFontFace: t.fonts.title, bodyFontFace: t.fonts.body };
  defineMasters(pres, t);

  const ctx = { pres, t, deck, L: labelsFor(deck.lang), specs: [], contentIndex: 0 };
  cover(ctx);
  agenda(ctx);
  deck.slides.forEach((d, i) => {
    let s;
    if (d.type === "cards" && d.items?.length >= 2) s = cardsSlide(ctx, d);
    else if (d.type === "stats" && d.stats?.length) s = statsSlide(ctx, d);
    else if (d.type === "timeline" && d.steps?.length >= 2) s = timelineSlide(ctx, d);
    else if (d.type === "comparison" && d.left?.points?.length && d.right?.points?.length) s = comparisonSlide(ctx, d);
    else if (d.type === "quote" && d.quote) s = quoteSlide(ctx, d);
    else {
      // Boshqa turdagi slayd ma'lumoti chala kelsa ham, mazmuni ro'yxat sifatida ko'rsatiladi.
      const fallback = [
        ...(d.points ?? []),
        ...(d.items ?? []).map((item) => `${item.heading}: ${item.text}`),
        ...(d.steps ?? []).map((step) => `${step.heading}: ${step.text}`),
        ...(d.stats ?? []).map((stat) => `${stat.value} — ${stat.label}`),
      ];
      const points = fallback.length ? fallback : [d.notes || d.title].filter(Boolean);
      s = bulletsSlide(ctx, { highlight: "", ...d, points }, images[i]);
    }
    if (d.notes) s.slide.addNotes(d.notes);
  });
  conclusion(ctx);
  if (deck.references?.length) references(ctx);
  thanks(ctx);

  const raw = await pres.write({ outputType: "nodebuffer" });
  return finalizeDeck(raw, ctx.specs);
}

