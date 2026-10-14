import fs from "node:fs";
import path from "node:path";
import { assertConfig, config } from "./config.js";

// Sozlamalar to'g'riligini boshqa modullar yuklanishidan oldin tekshiramiz.
try {
  assertConfig();
} catch (error) {
  console.error(`❌ ${error.message}\n   .env.example faylini .env deb nusxalab, to'ldiring.`);
  process.exit(1);
}

const { bot, orderNotifier, setupBot } = await import("./bot.js");
const { providerEnabled, refreshCurrencyLimits } = await import("./payments.js");
const { getSampleDeck } = await import("./samples.js");
const { PREMIUM_IDS } = await import("./generators/premium/templates.js");
const { FILES_DIR } = await import("./pipeline.js");
const { resumeQueue, setNotifier } = await import("./queue.js");
const { createServer } = await import("./server.js");

const me = await setupBot();
setNotifier(orderNotifier);

const server = createServer().listen(config.port, () => {
  console.log(`🌐 Mini App: ${config.webAppUrl} (lokal port ${config.port})`);
});

resumeQueue();

// Click/Payme uchun minimal summa kurs bilan o'zgaradi — kuniga ikki marta yangilanadi.
if (providerEnabled()) {
  refreshCurrencyLimits().then((min) => console.log(`💳 Click/Payme: eng kam summa ${min} soʻm`));
  setInterval(refreshCurrencyLimits, 12 * 60 * 60 * 1000).unref();
}

// Premium namunalarini qaytadan tayyorlaymiz (shablon yangilangan bo'lsa ham eskisi qolmasin).
fs.rmSync(path.join(config.dataDir, "samples-premium"), { recursive: true, force: true });
(async () => {
  for (const id of PREMIUM_IDS) await getSampleDeck(id).catch((error) => console.warn(`Namuna ${id}:`, error.message));
})();
bot.start({
  allowed_updates: ["message", "callback_query", "pre_checkout_query"],
  onStart: () => console.log(`🤖 @${me.username} ishga tushdi`),
});

// Eski fayllarni kuniga bir marta tozalaymiz, disk to'lib qolmasligi uchun.
function cleanupFiles() {
  const cutoff = Date.now() - config.fileTtlDays * 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(FILES_DIR)) {
    const file = path.join(FILES_DIR, name);
    try {
      if (fs.statSync(file).mtimeMs < cutoff) fs.rmSync(file);
    } catch {}
  }
}
cleanupFiles();
setInterval(cleanupFiles, 24 * 60 * 60 * 1000).unref();

async function shutdown(signal) {
  console.log(`${signal}: toʻxtatilmoqda...`);
  await bot.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
