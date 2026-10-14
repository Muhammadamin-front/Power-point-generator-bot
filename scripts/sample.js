// AI chaqirmasdan namunaviy fayllar yaratadi — dizaynni tekshirish uchun.
// Ishlatish: node scripts/sample.js [mavzu_id]   (natija: data/samples/)
import fs from "node:fs";
import path from "node:path";
import { config } from "../src/config.js";
import { buildDocx } from "../src/generators/docx.js";
import { THEMES, buildPptx } from "../src/generators/pptx.js";
import { buildPremiumPptx } from "../src/generators/premium/build.js";
import { PREMIUM } from "../src/generators/premium/templates.js";
import { SAMPLE_DECK } from "../src/samples.js";

const outDir = path.join(config.dataDir, "samples");
fs.mkdirSync(outDir, { recursive: true });

const deck = SAMPLE_DECK;
const { profile } = SAMPLE_DECK;

const only = process.argv[2];
for (const theme of Object.keys(THEMES)) {
  if (only && only !== theme) continue;
  const buffer = await buildPptx({ ...deck, theme });
  fs.writeFileSync(path.join(outDir, `taqdimot-${theme}.pptx`), buffer);
}
for (const theme of Object.keys(PREMIUM)) {
  if (only && only !== theme) continue;
  const buffer = await buildPremiumPptx({ ...deck, theme });
  fs.writeFileSync(path.join(outDir, `premium-${theme}.pptx`), buffer);
  console.log(`premium-${theme}.pptx: ${Math.round(buffer.length / 1024)} KB`);
}
if (only) process.exit(0);

const paragraph =
  "Raqamli iqtisodiyot – bu axborot-kommunikatsiya texnologiyalari asosida yaratiladigan, saqlanadigan va almashinadigan maʼlumotlarga tayangan iqtisodiy faoliyat turidir. Oʻzbekistonda bu sohani rivojlantirish uchun «Raqamli Oʻzbekiston – 2030» strategiyasi qabul qilingan boʻlib, unda davlat xizmatlarini raqamlashtirish, internet tarmogʻini kengaytirish va IT kadrlarni tayyorlash asosiy yoʻnalishlar sifatida belgilangan.";
const text = (n) => Array(n).fill(paragraph).join("\n\n");

const referat = await buildDocx({
  service: "referat",
  lang: "uz",
  title: deck.title,
  subject: deck.subject,
  profile,
  intro: text(3),
  sections: deck.outline.slice(0, 3).map((title) => ({ title, text: `${text(3)}\n\n- birinchi bandi\n- ikkinchi bandi\n\n${text(2)}` })),
  conclusion: text(2),
  references: deck.references,
});
fs.writeFileSync(path.join(outDir, "referat.docx"), referat.buffer);

const kurs = await buildDocx({
  service: "kurs_ishi",
  lang: "uz",
  title: deck.title,
  subject: deck.subject,
  profile,
  intro: `**Mavzuning dolzarbligi.** ${paragraph}\n\n**Tadqiqotning maqsadi.** ${paragraph}`,
  sections: [
    { title: "Raqamli iqtisodiyotning nazariy asoslari", subsections: [{ title: "Tushuncha va mohiyat", text: text(6) }, { title: "Xorij tajribasi", text: text(6) }] },
    { title: "Oʻzbekistonda raqamli iqtisodiyot tahlili", subsections: [{ title: "Hozirgi holat", text: text(6) }, { title: "Muammolar va yechimlar", text: text(6) }] },
  ],
  conclusion: text(3),
  references: deck.references,
});
fs.writeFileSync(path.join(outDir, "kurs-ishi.docx"), kurs.buffer);

console.log(`Namunalar tayyor: ${outDir} (referat: ${referat.pages} bet, kurs ishi: ${kurs.pages} bet)`);
