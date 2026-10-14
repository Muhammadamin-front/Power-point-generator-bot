import fs from "node:fs";
import path from "node:path";
import express from "express";
import { z } from "zod";
import { fileToken, validateInitData, verifyFileToken } from "./auth.js";
import { askForReceipt, bot, isSubscribed, notifyReferrer, sendOrderFile } from "./bot.js";
import { ROOT, config } from "./config.js";
import {
  AppError,
  countReferrals,
  createCardTopup,
  createOrder,
  ensureUser,
  getOrder,
  getUser,
  listOrders,
  listTransactions,
  redeemPromo,
  saveProfile,
} from "./db.js";
import { THEMES } from "./generators/pptx.js";
import { PREMIUM, PREMIUM_IDS } from "./generators/premium/templates.js";
import {
  STAR_PACKS,
  createProviderInvoice,
  createStarsInvoice,
  getStarPack,
  providerEnabled,
  providerMinimum,
  providerPacks,
} from "./payments.js";
import { getSampleDeck } from "./samples.js";
import { enqueue, queuePosition } from "./queue.js";
import { LANGUAGES, SERVICES, formatSom, priceFor } from "./services.js";

const ProfileSchema = z.object({
  name: z.string().trim().max(100).default(""),
  group: z.string().trim().max(40).default(""),
  university: z.string().trim().max(150).default(""),
  faculty: z.string().trim().max(150).default(""),
  teacher: z.string().trim().max(100).default(""),
  city: z.string().trim().max(60).default(""),
});

const OrderInput = z.object({
  service: z.enum(Object.keys(SERVICES)),
  topic: z.string().trim().min(3, "Mavzu juda qisqa").max(300, "Mavzu 300 belgidan oshmasin"),
  subject: z.string().trim().max(120).default(""),
  size: z.number().int(),
  lang: z.enum(Object.keys(LANGUAGES)),
  theme: z.enum([...Object.keys(THEMES), ...PREMIUM_IDS]).default("midnight"),
  extra: z.string().trim().max(500).default(""),
  profile: ProfileSchema.default({}),
});

function publicOrder(order) {
  return {
    id: order.id,
    service: order.service,
    topic: order.topic,
    size: order.params.size,
    lang: order.params.lang,
    theme: order.params.theme,
    price: order.price,
    status: order.status,
    progress: order.progress,
    stage: order.stage,
    error: order.status === "failed" ? "Buyurtma bajarilmadi, mablagʻ balansga qaytarildi" : null,
    fileName: order.file_name,
    downloadUrl: order.status === "done" ? `${config.webAppUrl}/files/${fileToken(order.id)}` : null,
    queuePosition: order.status === "queued" ? queuePosition(order.id) : 0,
    createdAt: order.created_at,
  };
}

/** Telegram initData orqali foydalanuvchini aniqlaydi. */
function auth(req, res, next) {
  const header = req.get("authorization") ?? "";
  const initData = header.startsWith("tma ") ? header.slice(4) : "";
  let session = initData ? validateInitData(initData) : null;
  if (!session && !initData && config.devUserId) {
    session = { user: { id: config.devUserId, first_name: getUser(config.devUserId)?.first_name ?? "Dev" }, start_param: "" };
  }
  if (!session) return res.status(401).json({ error: "Ilovani Telegram orqali oching" });

  const ref = /^ref_(\d+)$/.exec(session.start_param)?.[1];
  const { user, referrerId } = ensureUser(session.user, ref ? Number(ref) : null);
  if (referrerId) notifyReferrer(referrerId, user).catch(() => {});
  req.user = user;
  next();
}

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message ?? "Notoʻgʻri maʼlumot" });
    }
    if (error instanceof AppError) {
      return res.status(error.code === "insufficient_funds" ? 402 : 409).json({ error: error.message, code: error.code });
    }
    console.error(`${req.method} ${req.path}:`, error);
    res.status(500).json({ error: "Serverda xatolik. Birozdan soʻng qayta urinib koʻring." });
  }
};

export function createServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", true);
  app.use(express.json({ limit: "32kb" }));
  // index.html har doim yangi; app.js/styles.css versiya bilan — yangilanishdan keyin Telegram WebView eski faylni ko'rsatmaydi.
  const version = Date.now().toString(36);
  const indexHtml = fs
    .readFileSync(path.join(ROOT, "public", "index.html"), "utf8")
    .replace('src="/app.js"', `src="/app.js?v=${version}"`)
    .replace('href="/styles.css"', `href="/styles.css?v=${version}"`);
  app.get(["/", "/index.html"], (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.type("html").send(indexHtml);
  });
  // Jonli veb-taqdimot namunalari (premium shablonlar shu saytlar uslubida)
  app.use("/demo", express.static(path.join(ROOT, "public", "demo"), { maxAge: "1d" }));
  app.use(express.static(path.join(ROOT, "public"), { maxAge: "7d", index: false }));

  // Imzolangan havola orqali faylni yuklab olish (Telegram.WebApp.downloadFile uchun).
  app.get("/files/:token", (req, res) => {
    const order = getOrder(verifyFileToken(req.params.token) ?? 0);
    if (!order?.file_path || !fs.existsSync(order.file_path)) return res.status(404).send("Fayl topilmadi yoki havola eskirgan");
    res.set("Access-Control-Allow-Origin", "https://web.telegram.org");
    res.download(order.file_path, order.file_name);
  });

  // Premium shablon namunasi (AI'siz, hamma uchun ochiq)
  app.get("/samples/:theme.pptx", async (req, res) => {
    try {
      const file = await getSampleDeck(req.params.theme);
      if (!file) return res.status(404).send("Namuna topilmadi");
      res.set("Access-Control-Allow-Origin", "https://web.telegram.org");
      res.download(file, `Namuna - ${PREMIUM[req.params.theme].name}.pptx`);
    } catch (error) {
      console.error("Namuna yaratilmadi:", error);
      res.status(500).send("Namunani tayyorlab boʻlmadi");
    }
  });

  const api = express.Router();
  api.use(auth);

  api.get(
    "/config",
    handle((req, res) => {
      res.json({
        botUsername: bot.botInfo.username,
        services: Object.values(SERVICES),
        languages: Object.entries(LANGUAGES).map(([id, lang]) => ({ id, label: lang.label })),
        themes: Object.entries(THEMES).map(([id, t]) => ({ id, name: t.name, dark: t.dark, accent: t.accent, tint: t.tint })),
        premium: Object.values(PREMIUM).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          preview: `/premium/${t.id}-sm.jpg`,
          sample: `${config.webAppUrl}/samples/${t.id}.pptx`,
          demo: t.demo ? `${config.webAppUrl}${t.demo}` : null,
        })),
        starPacks: STAR_PACKS,
        provider: providerEnabled() ? { name: config.provider.name, packs: providerPacks(), min: providerMinimum() } : null,
        requiredChannel: config.requiredChannel || null,
        card: config.card.number ? { number: config.card.number, owner: config.card.owner, min: config.minCardTopup } : null,
        referralBonus: config.referralBonus,
        support: config.supportUsername,
      });
    }),
  );

  api.get(
    "/me",
    handle((req, res) => {
      const { user } = req;
      res.json({
        id: user.id,
        firstName: user.first_name,
        balance: user.balance,
        profile: user.profile,
        referrals: countReferrals(user.id),
        referralLink: `https://t.me/${bot.botInfo.username}?start=ref_${user.id}`,
      });
    }),
  );

  api.put(
    "/me/profile",
    handle((req, res) => {
      const profile = ProfileSchema.parse(req.body ?? {});
      saveProfile(req.user.id, profile);
      res.json({ profile });
    }),
  );

  api.get(
    "/orders",
    handle((req, res) => {
      res.json({ orders: listOrders(req.user.id).map(publicOrder) });
    }),
  );

  api.post(
    "/orders",
    handle(async (req, res) => {
      const input = OrderInput.parse(req.body ?? {});
      const price = priceFor(input.service, input.size, input.theme);
      if (price === null) return res.status(400).json({ error: "Bunday hajm mavjud emas" });
      if (!(await isSubscribed(req.user.id))) {
        return res.status(403).json({
          error: `Buyurtma berish uchun ${config.requiredChannel} kanaliga obuna boʻling`,
          code: "subscribe_required",
          channel: config.requiredChannel,
        });
      }

      saveProfile(req.user.id, input.profile);
      const order = createOrder({
        userId: req.user.id,
        service: input.service,
        topic: input.topic,
        price,
        params: {
          size: input.size,
          lang: input.lang,
          theme: input.theme,
          subject: input.subject,
          extra: input.extra,
          profile: input.profile,
        },
      });
      enqueue(order.id);
      res.status(201).json({ order: publicOrder(getOrder(order.id)) });
    }),
  );

  const ownOrder = (req, res) => {
    const order = getOrder(Number(req.params.id));
    if (!order || order.user_id !== req.user.id) {
      res.status(404).json({ error: "Buyurtma topilmadi" });
      return null;
    }
    return order;
  };

  api.get(
    "/orders/:id",
    handle((req, res) => {
      const order = ownOrder(req, res);
      if (order) res.json({ order: publicOrder(order) });
    }),
  );

  api.post(
    "/orders/:id/resend",
    handle(async (req, res) => {
      const order = ownOrder(req, res);
      if (!order) return;
      if (order.status !== "done" || !fs.existsSync(order.file_path)) return res.status(409).json({ error: "Fayl hali tayyor emas" });
      await sendOrderFile(order);
      res.json({ ok: true });
    }),
  );

  api.post(
    "/topup/stars",
    handle(async (req, res) => {
      const pack = getStarPack(String(req.body?.pack ?? ""));
      if (!pack) return res.status(400).json({ error: "Paket topilmadi" });
      const link = await createStarsInvoice(bot.api, req.user.id, pack);
      res.json({ link });
    }),
  );

  api.post(
    "/topup/provider",
    handle(async (req, res) => {
      if (!providerEnabled()) return res.status(400).json({ error: "Bu toʻlov usuli yoqilmagan" });
      const amount = z
        .number({ error: "Summani kiriting" })
        .int()
        .min(providerMinimum(), `Eng kam summa: ${formatSom(providerMinimum())}`)
        .max(10_000_000, "Summa juda katta")
        .parse(req.body?.amount);
      res.json({ link: await createProviderInvoice(bot.api, req.user.id, amount) });
    }),
  );

  api.post(
    "/promo",
    handle((req, res) => {
      const code = z.string().trim().min(3, "Promokodni kiriting").max(32).parse(req.body?.code ?? "");
      res.json(redeemPromo(req.user.id, code));
    }),
  );

  api.get(
    "/transactions",
    handle((req, res) => {
      res.json({ transactions: listTransactions(req.user.id) });
    }),
  );

  api.post(
    "/topup/card",
    handle(async (req, res) => {
      if (!config.card.number) return res.status(400).json({ error: "Karta orqali toʻlov yoqilmagan" });
      const amount = z
        .number({ error: "Summani kiriting" })
        .int()
        .min(config.minCardTopup, `Eng kam summa: ${formatSom(config.minCardTopup)}`)
        .max(10_000_000, "Summa juda katta")
        .parse(req.body?.amount);
      const topup = createCardTopup(req.user.id, amount);
      await askForReceipt(req.user.id, topup);
      res.json({ ok: true });
    }),
  );

  app.use("/api", api);
  app.use("/api", (req, res) => res.status(404).json({ error: "Topilmadi" }));
  return app;
}
