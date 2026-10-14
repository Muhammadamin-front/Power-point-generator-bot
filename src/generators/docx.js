import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { estimatePageNumbersWith, layoutDocument } from "docx/layout";
import { labelsFor } from "./labels.js";

// O'zbekiston OTMlarida qabul qilingan rasmiylashtirish: A4, Times New Roman 14,
// 1.5 interval, maydonlar: chap 30 mm, o'ng 15 mm, yuqori va past 20 mm, xatboshi 1.25 sm.
const FONT = "Times New Roman";
const mm = (value) => Math.round(value * 56.7);
const PAGE = {
  size: { width: 11906, height: 16838 },
  margin: { top: mm(20), bottom: mm(20), left: mm(30), right: mm(15), footer: mm(10) },
};
const TEXT_WIDTH = PAGE.size.width - PAGE.margin.left - PAGE.margin.right;
const LINE_15 = 360;
const LINE_1 = 276;
const INDENT = 709;

const DEFAULT_CITY = { uz: "Toshkent", uz_cyrl: "Тошкент", ru: "Ташкент", en: "Tashkent" };

const pageNumbers = estimatePageNumbersWith({ guess: true });

const bold = (text, extra = {}) => new TextRun({ text, bold: true, ...extra });
const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
const quoted = (text, lang) => (lang === "ru" ? `«${text}»` : `“${text}”`);

function center(children, { before = 0, after = 0, line = LINE_1 } = {}) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before, after, line }, children });
}

/** "**qalin**" belgilarini qalin matnga aylantiradi. */
function inlineRuns(text) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith("**") && chunk.endsWith("**")
        ? new TextRun({ text: chunk.slice(2, -2), bold: true })
        : new TextRun(chunk.replace(/\*\*/g, "")),
    );
}

/** AI yozgan matnni xatboshilar va ro'yxatlarga ajratadi. */
function bodyParagraphs(text) {
  const paragraphs = [];
  for (const raw of String(text ?? "").split("\n")) {
    const line = raw.replace(/^#{1,6}\s+/, "").trim();
    if (!line) continue;
    const item = line.match(/^[-•*–]\s+(.+)$/);
    if (item) {
      paragraphs.push(
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: LINE_15 },
          children: inlineRuns(item[1]),
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: INDENT },
          spacing: { line: LINE_15 },
          children: inlineRuns(line),
        }),
      );
    }
  }
  return paragraphs;
}

const heading1 = (text, pageBreakBefore = false) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore, children: [new TextRun(text)] });
const heading2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

function titlePage(content, L) {
  const { profile = {}, lang } = content;
  const out = L.ministry.map((line) => center([bold(line)]));
  if (profile.university) out.push(center([bold(profile.university.toUpperCase())], { before: 240 }));
  if (profile.faculty) out.push(center([new TextRun(`${profile.faculty}`)], { before: 120 }));

  out.push(center([bold(L.kinds[content.service], { size: 56, characterSpacing: 40 })], { before: 2800, after: 360 }));
  if (content.subject) {
    out.push(center([bold(`${L.subject}: `), new TextRun(content.subject)], { line: LINE_15 }));
  }
  out.push(center([bold(`${L.topic}: `), bold(quoted(content.title, lang))], { before: 120, line: LINE_15 }));

  const right = (children, before = 0) =>
    new Paragraph({ indent: { left: 4900 }, spacing: { before, line: LINE_15 }, children });
  out.push(
    right([bold(`${L.doneBy}: `), new TextRun(L.student(profile.name || "____________________", profile.group))], 2800),
  );
  out.push(right([bold(`${L.checkedBy}: `), new TextRun(profile.teacher || "____________________")]));
  return out;
}

function planPage(content, L) {
  const item = (text, level = 0) =>
    new Paragraph({
      indent: { left: INDENT + level * 567 },
      spacing: { line: LINE_15 },
      children: [new TextRun(text)],
    });
  const out = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true,
      spacing: { after: 240 },
      children: [bold(`${L.plan}:`)],
    }),
    item(titleCase(L.intro)),
  ];
  content.sections.forEach((section, i) => out.push(item(`${i + 1}. ${section.title}`)));
  out.push(item(titleCase(L.conclusion)), item(titleCase(L.references)));
  return out;
}

function contentsPage(L) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true,
      spacing: { after: 240 },
      children: [bold(L.contents)],
    }),
    new TableOfContents(L.contents, { hyperlink: true, headingStyleRange: "1-2" }),
  ];
}

function mainBody(content, L) {
  const isCourse = content.service === "kurs_ishi";
  const out = [heading1(L.intro, true), ...bodyParagraphs(content.intro)];

  content.sections.forEach((section, i) => {
    if (isCourse) {
      out.push(heading1(`${L.chapter(i + 1)} ${section.title.toUpperCase()}`, true));
      section.subsections.forEach((sub, j) => {
        out.push(heading2(`${i + 1}.${j + 1}. ${sub.title}`), ...bodyParagraphs(sub.text));
      });
    } else {
      out.push(heading1(`${i + 1}. ${section.title}`), ...bodyParagraphs(section.text));
    }
  });

  out.push(heading1(L.conclusion, isCourse), ...bodyParagraphs(content.conclusion));
  out.push(heading1(L.references, true));
  for (const reference of content.references) {
    out.push(
      new Paragraph({
        numbering: { reference: "references", level: 0 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: LINE_15 },
        children: [new TextRun(reference.replace(/^\s*\d+[.)]\s*/, ""))],
      }),
    );
  }
  return out;
}

const KEY_PAIRS = 5;
const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "808080" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function answerKeyTable(questions, L) {
  const rows = Math.ceil(questions.length / KEY_PAIRS);
  const columnWidth = Math.floor(TEXT_WIDTH / (KEY_PAIRS * 2));
  const cell = (text, { header = false } = {}) =>
    new TableCell({
      width: { size: columnWidth, type: WidthType.DXA },
      borders: cellBorders,
      verticalAlign: VerticalAlign.CENTER,
      shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: "E7E6E6" } : undefined,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40, line: LINE_1 },
          children: [new TextRun({ text, bold: header, size: 24 })],
        }),
      ],
    });

  const header = new TableRow({
    tableHeader: true,
    children: Array.from({ length: KEY_PAIRS }, () => [cell("№", { header: true }), cell(L.answer, { header: true })]).flat(),
  });
  const body = Array.from({ length: rows }, (_, r) =>
    new TableRow({
      children: Array.from({ length: KEY_PAIRS }, (_, p) => {
        const index = p * rows + r;
        const question = questions[index];
        return question ? [cell(String(index + 1)), cell(question.answer)] : [cell(""), cell("")];
      }).flat(),
    }),
  );
  return new Table({
    width: { size: columnWidth * KEY_PAIRS * 2, type: WidthType.DXA },
    columnWidths: Array(KEY_PAIRS * 2).fill(columnWidth),
    rows: [header, ...body],
  });
}

function testBody(content, L) {
  const { profile = {}, lang } = content;
  const out = [];
  if (profile.university) out.push(center([bold(profile.university.toUpperCase())]));
  out.push(center([bold(L.kinds.test, { size: 32 })], { before: 120, after: 120 }));
  if (content.subject) out.push(center([bold(`${L.subject}: `), new TextRun(content.subject)]));
  out.push(center([bold(`${L.topic}: `), new TextRun(quoted(content.title, lang))], { after: 360 }));

  content.questions.forEach((q, i) => {
    out.push(
      new Paragraph({
        keepNext: true,
        keepLines: true,
        spacing: { before: 200, line: LINE_1 },
        children: [bold(`${i + 1}. ${q.question}`)],
      }),
    );
    q.options.forEach((option, j) => {
      out.push(
        new Paragraph({
          keepNext: j < q.options.length - 1,
          indent: { left: INDENT },
          spacing: { line: LINE_1 },
          children: [new TextRun(`${"ABCD"[j]}) ${option}`)],
        }),
      );
    });
  });

  out.push(
    new Paragraph({ alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 240 }, children: [bold(L.answers)] }),
    answerKeyTable(content.questions, L),
  );
  return out;
}

const pageNumberFooter = () =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 24 })],
      }),
    ],
  });

function buildDocument(content) {
  const L = labelsFor(content.lang);
  const isTest = content.service === "test";
  const city = content.profile?.city || DEFAULT_CITY[content.lang] || DEFAULT_CITY.uz;
  const year = new Date().getFullYear();

  const children = isTest
    ? testBody(content, L)
    : [
        ...titlePage(content, L),
        ...(content.service === "kurs_ishi" ? contentsPage(L) : planPage(content, L)),
        ...mainBody(content, L),
      ];

  const footers = isTest
    ? { default: pageNumberFooter() }
    : {
        first: new Footer({ children: [center([bold(`${city} – ${year}`)])] }),
        default: pageNumberFooter(),
      };

  return new Document({
    creator: content.profile?.name || "Student",
    title: content.title,
    pageNumbers,
    styles: {
      default: {
        document: { run: { font: FONT, size: 28 }, paragraph: { spacing: { line: LINE_15 } } },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: 28, bold: true, color: "000000" },
          paragraph: {
            alignment: AlignmentType.CENTER,
            keepNext: true,
            spacing: { before: 240, after: 240, line: LINE_15 },
            outlineLevel: 0,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: FONT, size: 28, bold: true, color: "000000" },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: INDENT },
            keepNext: true,
            spacing: { before: 240, after: 120, line: LINE_15 },
            outlineLevel: 1,
          },
        },
        { id: "TOC1", name: "toc 1", basedOn: "Normal", run: { font: FONT, size: 28 }, paragraph: { spacing: { line: LINE_15 } } },
        {
          id: "TOC2",
          name: "toc 2",
          basedOn: "Normal",
          run: { font: FONT, size: 28 },
          paragraph: { indent: { left: 440 }, spacing: { line: LINE_15 } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "–",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: INDENT + 360, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "references",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 567, hanging: 567 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: { page: { ...PAGE }, titlePage: !isTest },
        footers,
        children,
      },
    ],
  });
}

/**
 * Word hujjatini yaratadi. Qaytaradi: { buffer, pages }.
 *
 * content: { service, lang, title, subject, profile, sections, intro, conclusion, references }
 *   referat / mustaqil_ish: sections = [{ title, text }]
 *   kurs_ishi:              sections = [{ title, subsections: [{ title, text }] }]
 *   test:                   { service: "test", lang, title, subject, profile, questions: [{ question, options, answer }] }
 */
export async function buildDocx(content) {
  const document = buildDocument(content);
  let pages = null;
  try {
    pages = layoutDocument(buildDocument(content), { guess: true }).pages.length;
  } catch {
    // Sahifa soni faqat ma'lumot uchun; hisoblab bo'lmasa ham hujjat yaratiladi.
  }
  const buffer = await Packer.toBuffer(document);
  return { buffer, pages };
}
