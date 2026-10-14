// Namunaviy taqdimot: AI chaqirmasdan shablon dizaynini ko'rsatish uchun (bot va Mini App'dagi "Namuna").
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { buildPremiumPptx } from "./generators/premium/build.js";
import { isPremium } from "./generators/premium/templates.js";

const profile = {
  name: "Aliyev Sardor",
  group: "IQ-21",
  university: "Toshkent davlat iqtisodiyot universiteti",
  faculty: "Raqamli iqtisodiyot fakulteti",
  teacher: "Karimova N.A.",
  city: "",
};

export const SAMPLE_DECK = {
  lang: "uz",
  subject: "Iqtisodiyot nazariyasi",
  profile,
  title: "Raqamli iqtisodiyot va uning Oʻzbekistondagi rivojlanishi",
  subtitle: "Tushuncha, asosiy yoʻnalishlar, xorij tajribasi va istiqbollar",
  outline: ["Raqamli iqtisodiyot tushunchasi", "Asosiy tarkibiy qismlar", "Rivojlanish bosqichlari", "Oʻzbekistondagi holat", "Afzallik va xavflar"],
  slides: [
    {
      type: "bullets",
      title: "Raqamli iqtisodiyot nima?",
      points: [
        "Maʼlumotlar asosiy ishlab chiqarish omiliga aylangan iqtisodiy faoliyat",
        "Internet, bulutli texnologiyalar va sunʼiy intellektga tayanadi",
        "Tovar va xizmatlar onlayn platformalar orqali yetkaziladi",
        "Tranzaksiya xarajatlarini kamaytiradi va bozorlarni kengaytiradi",
      ],
      highlight: "Raqamli iqtisodiyot — raqamli maʼlumotlar asosiy resurs boʻlgan xoʻjalik faoliyati.",
      notes: "Bu slaydda raqamli iqtisodiyot tushunchasini izohlayman.",
      image_query: "digital economy",
    },
    {
      type: "cards",
      title: "Raqamli iqtisodiyotning tarkibiy qismlari",
      items: [
        { heading: "Infratuzilma", text: "Keng polosali internet, maʼlumotlar markazlari va mobil aloqa tarmoqlari" },
        { heading: "Elektron tijorat", text: "Onlayn savdo platformalari, raqamli toʻlov tizimlari va logistika" },
        { heading: "Elektron hukumat", text: "Davlat xizmatlarining onlayn koʻrsatilishi: my.gov.uz portali" },
        { heading: "Inson kapitali", text: "IT mutaxassislarni tayyorlash va aholining raqamli savodxonligi" },
      ],
      notes: "",
      image_query: "network",
    },
    {
      type: "timeline",
      title: "Oʻzbekistonda raqamlashtirish bosqichlari",
      steps: [
        { heading: "2012", text: "Elektron hukumat toʻgʻrisidagi qonun ishlab chiqildi" },
        { heading: "2015", text: "Yagona interaktiv davlat xizmatlari portali ishga tushdi" },
        { heading: "2019", text: "IT Park rezidentlari uchun soliq imtiyozlari joriy etildi" },
        { heading: "2020", text: "«Raqamli Oʻzbekiston – 2030» strategiyasi qabul qilindi" },
      ],
      notes: "",
      image_query: "timeline",
    },
    {
      type: "stats",
      title: "Raqamlarda",
      stats: [
        { value: "2030", label: "Raqamli Oʻzbekiston strategiyasining yakuniy yili" },
        { value: "1 mln", label: "Dasturchilar dasturi doirasida oʻqitish maqsadi" },
        { value: "500+", label: "Onlayn koʻrsatiladigan davlat xizmatlari" },
      ],
      note: "Maʼlumotlar rasmiy manbalar asosida umumlashtirilgan.",
      notes: "",
      image_query: "statistics",
    },
    {
      type: "comparison",
      title: "Afzalliklar va xavflar",
      left: { heading: "Afzalliklar", points: ["Xizmatlar tezligi va qulayligi oshadi", "Korrupsiya xavfi kamayadi", "Yangi ish oʻrinlari yaratiladi"] },
      right: { heading: "Xavflar", points: ["Kiberxavfsizlik tahdidlari", "Raqamli tengsizlik", "Shaxsiy maʼlumotlar himoyasi muammosi"] },
      notes: "",
      image_query: "balance",
    },
    {
      type: "quote",
      title: "Iqtibos",
      quote: "Kelajak allaqachon yetib keldi — u shunchaki notekis taqsimlangan.",
      author: "Uilyam Gibson",
      notes: "",
      image_query: "future",
    },
  ],
  conclusion: [
    "Raqamli iqtisodiyot iqtisodiy oʻsishning asosiy drayveriga aylanmoqda",
    "Oʻzbekistonda infratuzilma va elektron hukumat jadal rivojlanmoqda",
    "Kadrlar tayyorlash va kiberxavfsizlik ustuvor vazifa boʻlib qolmoqda",
  ],
  references: [
    "«Raqamli Oʻzbekiston – 2030» strategiyasi. – T., 2020.",
    "Gulyamov S.S. va boshq. Raqamli iqtisodiyotda blokcheyn texnologiyalari. – T., 2019.",
    "www.lex.uz",
  ],
};


const dir = path.join(config.dataDir, "samples-premium");
const building = new Map();

/** Premium shablon namunasini qaytaradi (birinchi so'rovda yaratiladi va diskda saqlanadi). */
export async function getSampleDeck(theme) {
  if (!isPremium(theme)) return null;
  const file = path.join(dir, `${theme}.pptx`);
  if (fs.existsSync(file)) return file;
  if (!building.has(theme)) {
    building.set(
      theme,
      (async () => {
        fs.mkdirSync(dir, { recursive: true });
        const buffer = await buildPremiumPptx({ ...SAMPLE_DECK, theme });
        await fs.promises.writeFile(file, buffer);
        return file;
      })().finally(() => building.delete(theme)),
    );
  }
  return building.get(theme);
}
