// Xizmatlar katalogi: narxlar (so'mda), hajm variantlari va tavsiflar.
// Narxlarni o'zgartirish uchun shu faylni tahrirlang.
import { isWeb } from "./generators/web/meta.js";
import { isPremium } from "./generators/premium/templates.js";

export const SERVICES = {
  taqdimot: {
    id: "taqdimot",
    title: "Taqdimot",
    icon: "📊",
    format: "pptx",
    unit: "slayd",
    description: "PowerPoint taqdimot: tayyor dizayn, reja, xulosa va maʼruzachi uchun izohlar",
    defaultSize: 10,
    options: [
      { size: 8, price: 4000 },
      { size: 10, price: 5000 },
      { size: 12, price: 6000 },
      { size: 15, price: 7500 },
      { size: 20, price: 9000 },
    ],
    // Premium animatsiyali shablonlar (Morph o'tishlari, kirish animatsiyalari, maxsus fonlar)
    premiumOptions: [
      { size: 8, price: 7000 },
      { size: 10, price: 8000 },
      { size: 12, price: 9500 },
      { size: 15, price: 11500 },
      { size: 20, price: 14000 },
    ],
    // Premium 3D veb-taqdimot (bitta .html fayl + onlayn havola). Hajm — bo'limlar soni, AI sarfi doimiy.
    // Narxni shu yerda o'zgartiring (AI xarajati ~$0.3–0.5 ≈ 4–6 ming so'm).
    webOptions: [{ size: 9, price: 15000 }],
  },
  referat: {
    id: "referat",
    title: "Referat",
    icon: "📄",
    format: "docx",
    unit: "bet",
    description: "Word hujjat: titul varaq, reja, kirish, asosiy qism, xulosa va adabiyotlar",
    defaultSize: 10,
    options: [
      { size: 8, price: 6000 },
      { size: 10, price: 7000 },
      { size: 12, price: 8000 },
      { size: 15, price: 10000 },
    ],
  },
  mustaqil_ish: {
    id: "mustaqil_ish",
    title: "Mustaqil ish",
    icon: "📝",
    format: "docx",
    unit: "bet",
    description: "Kengaytirilgan mustaqil ish: chuqurroq tahlil, misollar va adabiyotlar roʻyxati",
    defaultSize: 12,
    options: [
      { size: 10, price: 7000 },
      { size: 12, price: 8000 },
      { size: 15, price: 10000 },
      { size: 20, price: 13000 },
    ],
  },
  kurs_ishi: {
    id: "kurs_ishi",
    title: "Kurs ishi",
    icon: "🎓",
    format: "docx",
    unit: "bet",
    description: "Boblar va paragraflar, mundarija (sahifa raqamlari bilan), kirish va xulosa",
    defaultSize: 30,
    options: [
      { size: 25, price: 25000 },
      { size: 30, price: 30000 },
      { size: 35, price: 35000 },
      { size: 40, price: 40000 },
    ],
  },
  test: {
    id: "test",
    title: "Test savollari",
    icon: "✅",
    format: "docx",
    unit: "savol",
    description: "4 variantli test savollari va alohida javoblar kaliti",
    defaultSize: 20,
    options: [
      { size: 10, price: 3000 },
      { size: 20, price: 4000 },
      { size: 30, price: 5000 },
      { size: 50, price: 7000 },
    ],
  },
};

export const LANGUAGES = {
  uz: { label: "Oʻzbekcha", ai: "Uzbek, modern Latin script" },
  uz_cyrl: { label: "Ўзбекча", ai: "Uzbek, Cyrillic script" },
  ru: { label: "Русский", ai: "Russian" },
  en: { label: "English", ai: "English" },
};

export function getService(id) {
  return Object.hasOwn(SERVICES, id) ? SERVICES[id] : null;
}

export function priceFor(serviceId, size, theme) {
  const service = getService(serviceId);
  const options = isWeb(theme)
    ? service?.webOptions
    : service?.premiumOptions && isPremium(theme)
      ? service.premiumOptions
      : service?.options;
  const option = options?.find((o) => o.size === size);
  return option ? option.price : null;
}

export function formatSom(amount) {
  return `${Math.round(amount).toLocaleString("ru-RU").replace(/ /g, " ")} soʻm`;
}
