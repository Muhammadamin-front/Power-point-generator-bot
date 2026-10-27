import crypto from "node:crypto";
import { config } from "./config.js";

const MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Mini App'dan kelgan initData imzosini tekshiradi
 * (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * To'g'ri bo'lsa { user, start_param } qaytaradi, aks holda null.
 */
export function validateInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(config.botToken).digest();
  const expected = crypto.createHmac("sha256", secret).update(dataCheckString).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(hash, "hex"))) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  try {
    const user = JSON.parse(params.get("user") ?? "null");
    if (!user?.id) return null;
    return { user, start_param: params.get("start_param") ?? "" };
  } catch {
    return null;
  }
}

// ---------- Yuklab olish havolalari ----------

const sign = (value) => crypto.createHmac("sha256", config.fileSecret).update(value).digest("base64url");

/** Buyurtma fayli uchun muddatli (standart 1 soat) imzolangan token. */
export function fileToken(orderId, ttlSeconds = 3600) {
  const value = `${orderId}.${Math.floor(Date.now() / 1000) + ttlSeconds}`;
  return `${value}.${sign(value)}`;
}

/** Onlayn ko'rish havolasi uchun uzoq muddatli token (fayl saqlanadigan muddatga teng; yuklab olish havolasi — 1 soat). */
export const viewToken = (orderId) => fileToken(orderId, config.fileTtlDays * 24 * 60 * 60);

/** Token to'g'ri va muddati o'tmagan bo'lsa buyurtma ID'sini qaytaradi. */
export function verifyFileToken(token) {
  const [orderId, expires, signature] = String(token).split(".");
  if (!orderId || !expires || !signature) return null;
  const expected = Buffer.from(sign(`${orderId}.${expires}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  if (Number(expires) < Date.now() / 1000) return null;
  return Number(orderId);
}
