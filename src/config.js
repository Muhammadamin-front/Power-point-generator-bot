import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const str = (key, fallback = "") => process.env[key]?.trim() || fallback;
const int = (key, fallback) => {
  const value = Number.parseInt(str(key), 10);
  return Number.isFinite(value) ? value : fallback;
};

const botToken = str("BOT_TOKEN");
const isProduction = process.env.NODE_ENV === "production";

export const config = {
  botToken,
  isProduction,
  // Mini App ochiladigan ommaviy HTTPS manzil (masalan, https://bot.example.uz)
  webAppUrl: str("WEBAPP_URL").replace(/\/+$/, ""),
  port: int("PORT", 3000),
  adminIds: str("ADMIN_IDS")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter(Boolean),
  supportUsername: str("SUPPORT_USERNAME").replace(/^@/, ""),

  ai: {
    // gemini (bepul tarif) yoki claude. Ko'rsatilmasa: Claude kaliti bo'lsa claude, aks holda gemini.
    provider: str("AI_PROVIDER", process.env.ANTHROPIC_API_KEY ? "claude" : "gemini").toLowerCase(),
    geminiKey: str("GEMINI_API_KEY"),
    // Bepul tarifda "flash-lite" bir necha soniyada javob beradi; "flash" modellar ko'pincha band va daqiqalab kutadi.
    geminiModel: str("GEMINI_MODEL", "gemini-3.5-flash-lite"),
    geminiFallbackModel: str("GEMINI_FALLBACK_MODEL", "gemini-flash-lite-latest"),
    model: str("AI_MODEL", "claude-opus-5-5"),
    effort: ["low", "medium", "high", "xhigh", "max"].includes(str("AI_EFFORT")) ? str("AI_EFFORT") : "medium",
  },
  pexelsKey: str("PEXELS_API_KEY"),

  // Click / Payme va boshqa provayderlar: @BotFather → Bot Settings → Payments orqali olingan token
  provider: {
    token: str("PAYMENT_PROVIDER_TOKEN"),
    name: str("PAYMENT_PROVIDER_NAME", "Click / Payme"),
    // Ixtiyoriy: provayder talab qilsa (masalan, fiskal chek uchun) JSON ko'rinishidagi provider_data
    data: str("PAYMENT_PROVIDER_DATA"),
  },
  card: {
    number: str("CARD_NUMBER"),
    owner: str("CARD_OWNER"),
  },
  minCardTopup: int("MIN_CARD_TOPUP", 5000),
  starPriceSom: int("STAR_PRICE_SOM", 200),
  startBonus: int("START_BONUS", 2000),
  referralBonus: int("REFERRAL_BONUS", 2000),

  // Ixtiyoriy majburiy obuna: buyurtma berishdan oldin shu kanalga a'zo bo'lish kerak (bot kanalda admin bo'lishi shart)
  requiredChannel: str("REQUIRED_CHANNEL").replace(/^https:\/\/t\.me\//, "@"),

  maxActiveOrders: int("MAX_ACTIVE_ORDERS", 2),
  queueConcurrency: int("QUEUE_CONCURRENCY", 3),

  dataDir: path.resolve(ROOT, str("DATA_DIR", "data")),
  // Tayyor fayllar shuncha kundan keyin o'chiriladi
  fileTtlDays: int("FILE_TTL_DAYS", 30),
  // Yuklab olish havolalarini imzolash uchun kalit
  fileSecret: str("FILE_SECRET") || crypto.createHash("sha256").update(`files:${botToken}`).digest("hex"),
  // Faqat lokal sinov uchun: Mini App'ni Telegramsiz brauzerda ochish
  devUserId: isProduction ? 0 : int("DEV_USER_ID", 0),
};

export function assertConfig() {
  const missing = [];
  if (!config.botToken) missing.push("BOT_TOKEN");
  if (!config.webAppUrl) missing.push("WEBAPP_URL");
  if (missing.length) {
    throw new Error(`.env faylida quyidagilar to'ldirilmagan: ${missing.join(", ")}`);
  }
  if (config.ai.provider === "gemini" && !config.ai.geminiKey) {
    console.warn("⚠️  GEMINI_API_KEY topilmadi — buyurtmalarni bajarib bo'lmaydi.");
  } else if (config.ai.provider === "claude" && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.warn("⚠️  ANTHROPIC_API_KEY topilmadi — buyurtmalarni bajarib bo'lmaydi.");
  }
  console.log(`🧠 AI: ${config.ai.provider === "gemini" ? config.ai.geminiModel : config.ai.model}`);
  if (config.devUserId) {
    console.warn(`⚠️  DEV_USER_ID=${config.devUserId}: Mini App Telegram imzosisiz ham ochiladi. Productionda o'chiring!`);
  }
}
