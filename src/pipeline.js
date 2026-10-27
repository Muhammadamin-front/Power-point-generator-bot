import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AIError, generate } from "./ai/index.js";
import { WEB_SYSTEM_PROMPT, WebDeckSchema, normalizeWebDeck, visibleSectionCount, webDeckPrompt } from "./ai/webdeck.js";
import {
  DeckSchema,
  OutlineSchema,
  SYSTEM_PROMPT,
  TestSchema,
  deckPrompt,
  outlinePrompt,
  partPrompt,
  testPrompt,
} from "./ai/prompts.js";
import { config } from "./config.js";
import { normalizeColors } from "./generators/colors.js";
import { buildDocx } from "./generators/docx.js";
import { fetchLandscapeImage, fetchSlideImages } from "./generators/images.js";
import { labelsFor } from "./generators/labels.js";
import { buildPptx } from "./generators/pptx.js";
import { buildPremiumPptx } from "./generators/premium/build.js";
import { isPremium } from "./generators/premium/templates.js";
import { DEFAULT_FONTS, FONTS, buildWebDeck } from "./generators/web/build.js";
import { isWeb } from "./generators/web/meta.js";
import { getService } from "./services.js";

export const FILES_DIR = path.join(config.dataDir, "files");
fs.mkdirSync(FILES_DIR, { recursive: true });

// Times New Roman 14, 1.5 interval, standart maydonlar bilan bir betdagi so'zlar soni
// (docx/layout yordamida o'lchangan).
const WORDS_PER_PAGE = { uz: 210, uz_cyrl: 210, ru: 215, en: 295 };
// Titul, reja/mundarija, adabiyotlar va bob boshidagi bo'sh joylar egallaydigan betlar.
const OVERHEAD_PAGES = { referat: 3, mustaqil_ish: 3, kurs_ishi: 4.5 };
// Gemini bepul tarifida daqiqalik so'rov limiti past, shuning uchun parallel so'rovlar kamroq.
const PART_CONCURRENCY = config.ai.provider === "claude" ? 4 : 2;

const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Model noto'g'ri formatdagi javob qaytarsa, bir marta qayta so'raydi. */
async function generateWithRetry(options) {
  try {
    return await generate(options);
  } catch (error) {
    if (!(error instanceof AIError) || error.message.includes("rad etdi")) throw error;
    console.warn("AI javobi yaroqsiz, qayta urinilmoqda:", error.message);
    return generate(options);
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- Taqdimot ----------

/** Titul sahifa ma'lumotlari: AI'dan emas, foydalanuvchi kiritganidan (mavzu, F.I.Sh., guruh va h.k.). */
function coverFrom(order, subject) {
  const profile = order.params.profile ?? {};
  const topic = order.topic.replace(/\s+/g, " ").trim();
  return {
    kicker: subject ?? "",
    title: topic.charAt(0).toUpperCase() + topic.slice(1),
    name: profile.name ?? "",
    group: profile.group ?? "",
    university: profile.university ?? "",
    faculty: profile.faculty ?? "",
    teacher: profile.teacher ?? "",
    city: profile.city ?? "",
  };
}

/** Premium 3D veb-taqdimot: AI faqat mazmun yozadi, dizayn va 3D effektlar tayyor shablonda. */
async function runWebPresentation(order, request, progress) {
  const { lang, subject, colors, fonts } = order.params;

  progress(8, "Veb-taqdimot mazmuni yozilmoqda");
  const ai = await generateWithRetry({
    system: WEB_SYSTEM_PROMPT,
    prompt: webDeckPrompt(request),
    schema: WebDeckSchema,
    maxTokens: 32000,
  });

  progress(72, "Rasm tanlanmoqda");
  const image = await fetchLandscapeImage(ai.overview?.image_query);

  progress(88, "3D taqdimot yigʻilmoqda");
  const { primary, accent } = normalizeColors(colors);
  const deck = normalizeWebDeck(ai, {
    cover: { ...coverFrom(order, subject), subtitle: "" },
    lang,
    year: new Date().getFullYear(),
    theme: { primary, accent },
    image,
  });
  const body = FONTS[fonts?.body] ? fonts.body : DEFAULT_FONTS.body;
  const display = FONTS[fonts?.display] ? fonts.display : DEFAULT_FONTS.display;
  const buffer = buildWebDeck(deck, { body, display });
  return { buffer, ext: "html", title: deck.cover.title, summary: `${visibleSectionCount(deck)} ta boʻlim` };
}

async function runPresentation(order, request, progress) {
  if (isWeb(order.params.theme)) return runWebPresentation(order, request, progress);
  const { size, lang, theme, subject, profile, colors, fonts } = order.params;
  const contentSlides = Math.max(3, size - 4);

  progress(10, "Slaydlar mazmuni yozilmoqda");
  const deck = await generateWithRetry({
    system: SYSTEM_PROMPT,
    prompt: deckPrompt(request, contentSlides),
    schema: DeckSchema,
    maxTokens: 64000,
  });
  const slides = deck.slides.slice(0, contentSlides);

  const premium = isPremium(theme);
  progress(75, "Rasmlar tanlanmoqda");
  const images = await fetchSlideImages(slides, premium ? "premium" : "standard");

  progress(90, premium ? "Animatsiyalar qoʻshilmoqda" : "Taqdimot yigʻilmoqda");
  const build = premium ? buildPremiumPptx : buildPptx;
  const buffer = await build({ ...deck, slides, lang, theme, colors, fonts, subject, profile }, images);
  const slideCount = slides.length + 4 + (deck.references.length ? 1 : 0);
  return { buffer, ext: "pptx", title: deck.title, summary: `${slideCount} ta slayd` };
}

// ---------- Referat / mustaqil ish / kurs ishi ----------

function normalizeOutline(outline, service) {
  const isCourse = service === "kurs_ishi";
  const sections = outline.sections.slice(0, isCourse ? 3 : 5).map((section) => ({
    title: section.title.trim().replace(/\.$/, ""),
    subsections: isCourse
      ? (section.subsections.length ? section.subsections : [section.title]).slice(0, 3).map((s) => s.trim().replace(/\.$/, ""))
      : [],
  }));
  if (!sections.length) throw new AIError("Reja boʻsh qaytdi");
  return { ...outline, sections };
}

async function runDocument(order, request, progress) {
  const { service, params } = order;
  const { size, lang, subject, profile } = params;
  const L = labelsFor(lang);

  progress(5, "Reja tuzilmoqda");
  const outline = normalizeOutline(
    await generateWithRetry({ system: SYSTEM_PROMPT, prompt: outlinePrompt(request, service), schema: OutlineSchema, maxTokens: 16000 }),
    service,
  );

  // So'zlar hajmini qismlarga taqsimlaymiz: kirish ~10%, xulosa ~8%, qolgani asosiy qismga.
  const totalWords = Math.round(Math.max(2, size - OVERHEAD_PAGES[service]) * WORDS_PER_PAGE[lang] * 1.05);
  const introWords = Math.round(totalWords * 0.1);
  const conclusionWords = Math.round(totalWords * 0.08);
  const parts = [{ kind: "intro", title: titleCase(L.intro), words: introWords }];
  const mainUnits = outline.sections.flatMap((section, i) =>
    service === "kurs_ishi"
      ? section.subsections.map((sub, j) => ({ kind: "section", title: `${i + 1}.${j + 1}. ${sub}`, label: `subsection ${i + 1}.${j + 1} (chapter ${i + 1}: "${section.title}")`, path: [i, j] }))
      : [{ kind: "section", title: `${i + 1}. ${section.title}`, label: `section ${i + 1}`, path: [i] }],
  );
  const mainWords = Math.round((totalWords - introWords - conclusionWords) / mainUnits.length);
  parts.push(...mainUnits.map((unit) => ({ ...unit, words: mainWords })));
  parts.push({ kind: "conclusion", title: titleCase(L.conclusion), words: conclusionWords });

  let done = 0;
  progress(12, `Matn yozilmoqda (0/${parts.length})`);
  const texts = await mapLimit(parts, PART_CONCURRENCY, async (part) => {
    const text = await generateWithRetry({
      system: SYSTEM_PROMPT,
      prompt: partPrompt({ request, service, outline, labels: L, part, words: part.words }),
      maxTokens: 32000,
    });
    done += 1;
    progress(12 + Math.round((done / parts.length) * 78), `Matn yozilmoqda (${done}/${parts.length})`);
    return text;
  });

  progress(93, "Hujjat rasmiylashtirilmoqda");
  const textOf = (predicate) => texts[parts.findIndex(predicate)];
  const sections = outline.sections.map((section, i) =>
    service === "kurs_ishi"
      ? {
          title: section.title,
          subsections: section.subsections.map((title, j) => ({
            title,
            text: textOf((p) => p.path?.[0] === i && p.path?.[1] === j),
          })),
        }
      : { title: section.title, text: textOf((p) => p.path?.[0] === i) },
  );
  const { buffer, pages } = await buildDocx({
    service,
    lang,
    title: outline.title,
    subject,
    profile,
    intro: texts[0],
    sections,
    conclusion: texts[texts.length - 1],
    references: outline.references,
  });
  return { buffer, ext: "docx", title: outline.title, summary: pages ? `${pages} bet` : "" };
}

// ---------- Test ----------

async function runTest(order, request, progress) {
  const { size, lang, subject, profile } = order.params;
  progress(10, "Savollar tuzilmoqda");
  const data = await generateWithRetry({ system: SYSTEM_PROMPT, prompt: testPrompt(request, size), schema: TestSchema, maxTokens: 64000 });

  // To'g'ri javob o'rnini tasodifiy tanlaymiz, shunda javoblar A–D bo'ylab teng taqsimlanadi.
  const questions = data.questions
    .filter((q) => q.question && q.correct && q.wrong.length >= 3)
    .slice(0, size)
    .map((q) => {
      const options = shuffle([q.correct, ...q.wrong.slice(0, 3)]);
      return { question: q.question, options, answer: "ABCD"[options.indexOf(q.correct)] };
    });
  if (questions.length < Math.min(5, size)) throw new AIError("Savollar yetarli emas");

  progress(90, "Hujjat rasmiylashtirilmoqda");
  const { buffer } = await buildDocx({ service: "test", lang, title: data.title, subject, profile, questions });
  return { buffer, ext: "docx", title: data.title, summary: `${questions.length} ta savol` };
}

// ---------- Kirish nuqtasi ----------

function fileNameFor(topic, ext) {
  const base = topic
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70)
    .trim();
  return `${base || "fayl"}.${ext}`;
}

/**
 * Buyurtmani bajaradi: AI matn yozadi, fayl yaratiladi va diskka saqlanadi.
 * progress(percent, stage) — holatni yangilash uchun.
 */
export async function runOrder(order, progress) {
  const { topic, service, params } = order;
  if (!getService(service)) throw new Error(`Nomaʼlum xizmat: ${service}`);
  const request = { topic, subject: params.subject, lang: params.lang, extra: params.extra };

  const run = service === "taqdimot" ? runPresentation : service === "test" ? runTest : runDocument;
  const result = await run(order, request, progress);

  const fileName = fileNameFor(topic, result.ext);
  const filePath = path.join(FILES_DIR, `${order.id}-${crypto.randomBytes(6).toString("hex")}.${result.ext}`);
  await fs.promises.writeFile(filePath, result.buffer);
  return { filePath, fileName, title: result.title, summary: result.summary };
}
