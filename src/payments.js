import crypto from "node:crypto";
import { config } from "./config.js";
import { formatSom } from "./services.js";

// ---------- Telegram Stars ----------

// Katta paketlarda bonus foizi ko'proq.
export const STAR_PACKS = [
  { id: "s50", stars: 50, bonus: 0 },
  { id: "s100", stars: 100, bonus: 5 },
  { id: "s250", stars: 250, bonus: 10 },
  { id: "s500", stars: 500, bonus: 15 },
].map((pack) => ({
  ...pack,
  som: Math.round((pack.stars * config.starPriceSom * (1 + pack.bonus / 100)) / 100) * 100,
}));

export function getStarPack(id) {
  return STAR_PACKS.find((pack) => pack.id === id) ?? null;
}

const showcase = () => ({
  photo_url: `${config.webAppUrl}/premium/showcase.jpg`,
  photo_width: 1600,
  photo_height: 448,
});

export function createStarsInvoice(api, userId, pack) {
  return api.createInvoiceLink(
    `Balansni toʻldirish: ${formatSom(pack.som)}`,
    `${pack.stars} ⭐ evaziga balansingizga ${formatSom(pack.som)} qoʻshiladi`,
    `stars:${pack.id}:${userId}`,
    "", // Telegram Stars uchun provider_token bo'sh qoldiriladi
    "XTR",
    [{ label: formatSom(pack.som), amount: pack.stars }],
    showcase(),
  );
}

// ---------- Click / Payme (Telegram Payments, so'mda) ----------

// Telegram har bir valyuta uchun minimal summani belgilaydi (taxminan $1). U kurs bilan o'zgaradi,
// shuning uchun https://core.telegram.org/bots/payments/currencies.json dan vaqti-vaqti bilan olinadi.
let uzsMinimum = 15000;

export async function refreshCurrencyLimits() {
  try {
    const response = await fetch("https://core.telegram.org/bots/payments/currencies.json", { signal: AbortSignal.timeout(10_000) });
    const { UZS } = await response.json();
    // Summalar tiyinda keladi (exp = 2); 1000 so'mgacha yuqoriga yaxlitlaymiz.
    if (UZS?.min_amount) uzsMinimum = Math.ceil(Number(UZS.min_amount) / 100 / 1000) * 1000;
  } catch (error) {
    console.warn("UZS limitlarini olib bo'lmadi:", error.message);
  }
  return uzsMinimum;
}

export const providerEnabled = () => Boolean(config.provider.token);
export const providerMinimum = () => uzsMinimum;
export const providerPacks = () => [15000, 30000, 50000, 100000].filter((amount) => amount >= uzsMinimum);

export function createProviderInvoice(api, userId, amount) {
  const nonce = crypto.randomBytes(4).toString("hex");
  return api.createInvoiceLink(
    `Balansni toʻldirish: ${formatSom(amount)}`,
    `Talaba Yordamchi balansiga ${formatSom(amount)} qoʻshiladi`,
    `uzs:${amount}:${userId}:${nonce}`,
    config.provider.token,
    "UZS",
    [{ label: "Balansni toʻldirish", amount: amount * 100 }],
    { ...showcase(), ...(config.provider.data ? { provider_data: config.provider.data } : {}) },
  );
}

/** Invoice payload'ini tekshiradi: { kind: "stars" | "uzs", som } yoki null. */
export function parsePaymentPayload(payload, userId, currency, totalAmount) {
  const [kind, value, payloadUserId] = String(payload).split(":");
  if (Number(payloadUserId) !== userId) return null;
  if (kind === "stars" && currency === "XTR") {
    const pack = getStarPack(value);
    if (!pack || (totalAmount !== undefined && totalAmount !== pack.stars)) return null;
    return { kind: "stars", som: pack.som, note: `${pack.stars} ⭐` };
  }
  if (kind === "uzs" && currency === "UZS") {
    const som = Number(value);
    if (!Number.isInteger(som) || som <= 0 || (totalAmount !== undefined && totalAmount !== som * 100)) return null;
    return { kind: "provider", som, note: config.provider.name };
  }
  return null;
}
