import fs from "node:fs";
import path from "node:path";
import { Bot, GrammyError, InlineKeyboard, InputFile } from "grammy";
import { viewToken } from "./auth.js";
import { ROOT, config } from "./config.js";
import {
  AppError,
  activeUserIds,
  addBalance,
  addPayment,
  attachReceipt,
  countReferrals,
  createPromo,
  ensureUser,
  getAwaitingTopup,
  getUser,
  listPromos,
  redeemPromo,
  resolveTopup,
  setBlocked,
  stats,
  usageSince,
} from "./db.js";
import { PREMIUM } from "./generators/premium/templates.js";
import { parsePaymentPayload } from "./payments.js";
import { RateLimitError, guardPromo, limits } from "./ratelimit.js";
import { getSampleDeck } from "./samples.js";
import { SERVICES, formatSom, getService } from "./services.js";

export const bot = new Bot(config.botToken);

const isAdmin = (id) => config.adminIds.includes(id);

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

const appUrl = (hash = "") => `${config.webAppUrl}/${hash ? `#${hash}` : ""}`;
const referralLink = (userId) => `https://t.me/${bot.botInfo.username}?start=ref_${userId}`;
const supportLine = () => (config.supportUsername ? `\n\nSavollar boʻlsa: @${escapeHtml(config.supportUsername)}` : "");

const PREVIEWS = path.join(ROOT, "public", "premium");
// Bir marta yuklangan rasm/fayllarning Telegram file_id'lari — qayta yuklamaslik uchun.
const fileIds = new Map();

function mainMenu() {
  return new InlineKeyboard()
    .webApp("📱 Ilovani ochish", appUrl())
    .row()
    .text("🎨 Premium namunalar", "samples")
    .text("💰 Balans", "balance")
    .row()
    .text("👥 Doʻstlarni taklif qilish", "invite")
    .text("ℹ️ Yordam", "help");
}

/** Majburiy obuna yoqilgan bo'lsa, foydalanuvchi kanalga a'zomi. Tekshirib bo'lmasa sotuvni to'xtatmaydi. */
const subscriptions = new Map();
export async function isSubscribed(userId) {
  if (!config.requiredChannel) return true;
  const cached = subscriptions.get(userId);
  if (cached && Date.now() - cached < 10 * 60 * 1000) return true;
  try {
    const member = await bot.api.getChatMember(config.requiredChannel, userId);
    const ok = ["creator", "administrator", "member"].includes(member.status) || (member.status === "restricted" && member.is_member);
    if (ok) subscriptions.set(userId, Date.now());
    return ok;
  } catch (error) {
    console.warn(`Obunani tekshirib boʻlmadi (${config.requiredChannel}) — bot kanalda admin ekanini tekshiring:`, error.message);
    return true;
  }
}

/** Foydalanuvchiga xabar yuboradi; botni bloklagan bo'lsa belgilab qo'yadi. */
async function safeSend(userId, send) {
  try {
    return await send();
  } catch (error) {
    if (error instanceof GrammyError && (error.error_code === 403 || error.description.includes("chat not found"))) {
      setBlocked(userId, true);
      return null;
    }
    throw error;
  }
}

/** Do'st havola orqali qo'shilganda. Bonus unga emas, do'st birinchi marta pul to'laganda beriladi. */
export async function notifyReferrer(referrerId, newUser) {
  if (config.referralBonus <= 0) return;
  const name = escapeHtml(newUser.first_name || "Doʻstingiz");
  await safeSend(referrerId, () =>
    bot.api.sendMessage(
      referrerId,
      `🎉 <b>${name}</b> sizning havolangiz orqali qoʻshildi!\nU birinchi marta balansini toʻldirganda sizga <b>${formatSom(config.referralBonus)}</b> qoʻshiladi.`,
      { parse_mode: "HTML" },
    ),
  );
}

/** Taklif qilingan do'st birinchi marta pul to'lab, bonus berilganda. */
async function notifyReferralReward(referrerId, friendId) {
  const name = escapeHtml(getUser(friendId)?.first_name || "Doʻstingiz");
  await safeSend(referrerId, () =>
    bot.api.sendMessage(
      referrerId,
      `🎁 <b>${name}</b> balansini toʻldirdi — balansingizga <b>${formatSom(config.referralBonus)}</b> qoʻshildi!`,
      { parse_mode: "HTML" },
    ),
  );
}

// ---------- Foydalanuvchi buyruqlari ----------

bot.command("start", async (ctx) => {
  const ref = /^ref_(\d+)$/.exec(ctx.match ?? "")?.[1];
  const { user, isNew, referrerId } = ensureUser(ctx.from, ref ? Number(ref) : null);
  if (referrerId) notifyReferrer(referrerId, user).catch(() => {});

  const services = Object.values(SERVICES)
    .map((s) => `${s.icon} ${s.title}`)
    .join("\n");
  const bonus = isNew && config.startBonus > 0 ? `\n🎁 Sizga <b>${formatSom(config.startBonus)}</b> boshlangʻich bonus berildi!\n` : "";
  const text =
    `👋 Assalomu alaykum, <b>${escapeHtml(ctx.from.first_name)}</b>!\n\n` +
    `Mavzuni yozasiz — bir necha daqiqada tayyor fayl olasiz:\n\n${services}\n\n` +
    `✨ <b>Yangi:</b> Morph oʻtishlari va animatsiyalari bor premium taqdimot shablonlari.\n` +
    `${bonus}\n💰 Balansingiz: <b>${formatSom(user.balance)}</b>\n\n` +
    `Boshlash uchun «Ilovani ochish» tugmasini bosing 👇`;
  const showcase = path.join(PREVIEWS, "showcase.jpg");
  if (!fs.existsSync(showcase)) {
    await ctx.reply(text, { parse_mode: "HTML", reply_markup: mainMenu() });
    return;
  }
  const message = await ctx.replyWithPhoto(fileIds.get("showcase") ?? new InputFile(showcase), {
    caption: text,
    parse_mode: "HTML",
    reply_markup: mainMenu(),
  });
  fileIds.set("showcase", message.photo.at(-1).file_id);
});

async function showSamples(ctx) {
  const templates = Object.values(PREMIUM);
  const media = templates.map((t) => ({
    type: "photo",
    media: fileIds.get(`preview:${t.id}`) ?? new InputFile(path.join(PREVIEWS, `${t.id}.jpg`)),
    caption: `✨ <b>${t.name}</b> — ${escapeHtml(t.description)}`,
    parse_mode: "HTML",
  }));
  const sent = await ctx.replyWithMediaGroup(media);
  sent.forEach((m, i) => m.photo && fileIds.set(`preview:${templates[i].id}`, m.photo.at(-1).file_id));
  const keyboard = new InlineKeyboard();
  templates.forEach((t, i) => {
    keyboard.text(`⬇️ ${t.name}`, `sample:${t.id}`);
    if (i % 3 === 2) keyboard.row();
  });
  keyboard.row().webApp("✨ Premium taqdimot buyurtma qilish", appUrl("service=taqdimot"));
  const from = getService("taqdimot").premiumOptions[0].price;
  await ctx.reply(
    `🎬 <b>Premium animatsiyali taqdimotlar</b>\n\n` +
      `• Slayddan slaydga silliq <b>Morph</b> oʻtishlari\n• Sarlavha va punktlarning ketma-ket paydo boʻlishi\n• Maxsus chizilgan fonlar va 16:9 keng format\n\n` +
      `Narxi: <b>${formatSom(from)}</b> dan. Namunani yuklab, PowerPoint'da slayd-shou rejimida koʻring 👇`,
    { parse_mode: "HTML", reply_markup: keyboard },
  );
}

bot.callbackQuery("samples", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showSamples(ctx);
});
bot.command("samples", showSamples);

bot.callbackQuery(/^sample:(\w+)$/, async (ctx) => {
  const template = PREMIUM[ctx.match[1]];
  if (!template) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery({ text: "Namuna tayyorlanmoqda..." });
  const key = `sample:${template.id}`;
  const document = fileIds.get(key) ?? new InputFile(await getSampleDeck(template.id), `Namuna - ${template.name}.pptx`);
  const message = await ctx.replyWithDocument(document, {
    caption: `✨ <b>${template.name}</b> namunasi. Animatsiyalarni koʻrish uchun PowerPoint'da slayd-shouni yoqing (F5).`,
    parse_mode: "HTML",
    reply_markup: (() => {
      const keyboard = new InlineKeyboard();
      if (template.demo) keyboard.url("🌐 Jonli namuna (veb)", `${config.webAppUrl}${template.demo}`).row();
      return keyboard.webApp("Shu dizaynda buyurtma berish", appUrl(`service=taqdimot&theme=${template.id}`));
    })(),
  });
  fileIds.set(key, message.document.file_id);
});

async function showBalance(ctx) {
  const user = getUser(ctx.from.id) ?? ensureUser(ctx.from).user;
  const ways = [config.provider.token && config.provider.name, "Telegram Stars", config.card.number && "karta"].filter(Boolean).join(", ");
  await ctx.reply(`💰 Balansingiz: <b>${formatSom(user.balance)}</b>\n\nBalansni ${ways} orqali toʻldirishingiz mumkin.`, {
    parse_mode: "HTML",
    reply_markup: new InlineKeyboard().webApp("➕ Balansni toʻldirish", appUrl("balance")),
  });
}

async function showInvite(ctx) {
  ensureUser(ctx.from);
  const link = referralLink(ctx.from.id);
  const count = countReferrals(ctx.from.id);
  const share = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
    "Referat, taqdimot va kurs ishlarini bir necha daqiqada tayyorlab beradigan bot 👇",
  )}`;
  await ctx.reply(
    `👥 Doʻstlaringizni taklif qiling: har bir doʻstingiz birinchi marta balansini toʻldirganda <b>${formatSom(config.referralBonus)}</b> olasiz!\n\n` +
      `Sizning havolangiz:\n<code>${link}</code>\n\nTaklif qilganlar: <b>${count}</b> ta`,
    { parse_mode: "HTML", reply_markup: new InlineKeyboard().url("📤 Ulashish", share) },
  );
}

async function showHelp(ctx) {
  const prices = Object.values(SERVICES)
    .map((s) => `${s.icon} ${s.title} — ${formatSom(s.options[0].price)} dan`)
    .concat(`✨ Premium animatsiyali taqdimot — ${formatSom(getService("taqdimot").premiumOptions[0].price)} dan`)
    .join("\n");
  await ctx.reply(
    `ℹ️ <b>Qanday ishlaydi?</b>\n\n` +
      `1. «Ilovani ochish» tugmasini bosing\n` +
      `2. Xizmatni tanlang va mavzuni yozing\n` +
      `3. Hajm, til va titul varaq maʼlumotlarini kiriting\n` +
      `4. Bir necha daqiqada tayyor fayl shu chatga keladi\n\n` +
      `<b>Narxlar:</b>\n${prices}\n\n` +
      `Agar fayl tayyorlanmasa, pul avtomatik ravishda balansga qaytariladi.${supportLine()}`,
    { parse_mode: "HTML", reply_markup: new InlineKeyboard().webApp("📱 Ilovani ochish", appUrl()) },
  );
}

bot.command("promo", async (ctx) => {
  ensureUser(ctx.from);
  const code = ctx.match?.trim();
  if (!code) return ctx.reply("Promokodni shunday yuboring: /promo KOD");
  try {
    const { amount, balance } = guardPromo(ctx.from.id, () => redeemPromo(ctx.from.id, code));
    await ctx.reply(`🎉 Promokod qabul qilindi! Balansga <b>${formatSom(amount)}</b> qoʻshildi.\n💰 Balans: <b>${formatSom(balance)}</b>`, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().webApp("📱 Buyurtma berish", appUrl()),
    });
  } catch (error) {
    if (!(error instanceof AppError || error instanceof RateLimitError)) throw error;
    await ctx.reply(`❌ ${error.message}`);
  }
});

bot.command("balance", showBalance);
bot.command("invite", showInvite);
bot.command("help", showHelp);
bot.command("paysupport", (ctx) =>
  ctx.reply(
    `💳 Toʻlov boʻyicha muammo boʻlsa, toʻlov vaqti va summasini yozib yuboring — tez orada javob beramiz.${supportLine()}`,
    { parse_mode: "HTML" },
  ),
);
bot.command("terms", (ctx) =>
  ctx.reply(
    "📜 Shartlar: balansga tushgan mablagʻ faqat bot xizmatlari uchun ishlatiladi. Buyurtma bajarilmasa, mablagʻ avtomatik qaytariladi. Tayyorlangan materiallar oʻquv maqsadida yordam sifatida beriladi — topshirishdan oldin oʻqib chiqing va kerak boʻlsa tahrirlang.",
  ),
);

bot.callbackQuery("balance", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showBalance(ctx);
});
bot.callbackQuery("invite", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showInvite(ctx);
});
bot.callbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showHelp(ctx);
});

// ---------- Telegram Stars va Click / Payme (Telegram Payments) ----------

bot.on("pre_checkout_query", async (ctx) => {
  const query = ctx.preCheckoutQuery;
  const payment = parsePaymentPayload(query.invoice_payload, query.from.id, query.currency, query.total_amount);
  if (payment) await ctx.answerPreCheckoutQuery(true);
  else await ctx.answerPreCheckoutQuery(false, { error_message: "Toʻlov maʼlumotlari notoʻgʻri. Qaytadan urinib koʻring." });
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;
  const parsed = parsePaymentPayload(payment.invoice_payload, ctx.from.id, payment.currency, payment.total_amount);
  if (!parsed) {
    console.error("Notoʻgʻri toʻlov payload:", payment);
    return;
  }
  ensureUser(ctx.from);
  try {
    const note = payment.provider_payment_charge_id ? `${parsed.note} · ${payment.provider_payment_charge_id}` : parsed.note;
    const { balance, referrerId } = addPayment(ctx.from.id, parsed.som, parsed.kind, payment.telegram_payment_charge_id, note);
    if (referrerId) notifyReferralReward(referrerId, ctx.from.id).catch(() => {});
    await ctx.reply(`✅ Toʻlov qabul qilindi! Balansga <b>${formatSom(parsed.som)}</b> qoʻshildi.\n💰 Balans: <b>${formatSom(balance)}</b>`, {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().webApp("📱 Buyurtma berish", appUrl()),
    });
  } catch (error) {
    if (!(error instanceof AppError && error.code === "duplicate")) throw error;
  }
});

// ---------- Karta orqali to'lov: chek rasmi ----------

export async function askForReceipt(userId, topup) {
  const card = config.card.number ? `\n💳 Karta: <code>${escapeHtml(config.card.number)}</code>` : "";
  const owner = config.card.owner ? `\n👤 ${escapeHtml(config.card.owner)}` : "";
  await safeSend(userId, () =>
    bot.api.sendMessage(
      userId,
      `🧾 <b>${formatSom(topup.amount)}</b> toʻlov soʻrovi yaratildi.${card}${owner}\n\n` +
        `Pulni oʻtkazganingizdan soʻng <b>toʻlov chekining rasmini (skrinshotini) shu chatga yuboring</b>. ` +
        `Admin tekshirgach, balansingiz toʻldiriladi.`,
      { parse_mode: "HTML" },
    ),
  );
}

async function handleReceipt(ctx, fileId) {
  const topup = getAwaitingTopup(ctx.from.id);
  if (!topup) {
    await ctx.reply("Rasm qabul qilinmadi. Karta orqali toʻlash uchun avval ilovada summani tanlang.", {
      reply_markup: new InlineKeyboard().webApp("➕ Balansni toʻldirish", appUrl("balance")),
    });
    return;
  }
  attachReceipt(topup.id, fileId);
  if (!config.adminIds.length) console.warn("ADMIN_IDS koʻrsatilmagan — chekni tasdiqlaydigan admin yoʻq!");

  const user = escapeHtml([ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" "));
  const username = ctx.from.username ? ` (@${escapeHtml(ctx.from.username)})` : "";
  const caption =
    `🧾 <b>Toʻlov #${topup.id}</b>\n` +
    `👤 ${user}${username}\n🆔 <code>${ctx.from.id}</code>\n` +
    `💰 Summa: <b>${formatSom(topup.amount)}</b>`;
  const keyboard = new InlineKeyboard().text("✅ Tasdiqlash", `topup:ok:${topup.id}`).text("❌ Rad etish", `topup:no:${topup.id}`);
  for (const adminId of config.adminIds) {
    await bot.api
      .sendPhoto(adminId, fileId, { caption, parse_mode: "HTML", reply_markup: keyboard })
      .catch((error) => console.error(`Admin ${adminId} ga yuborilmadi:`, error.message));
  }
  await ctx.reply("✅ Chek qabul qilindi. Admin tekshirgach, balansingiz toʻldiriladi (odatda 5–30 daqiqa).");
}

bot.on("message:photo", (ctx) => handleReceipt(ctx, ctx.message.photo.at(-1).file_id));
bot.on("message:document", async (ctx, next) => {
  if (!ctx.message.document.mime_type?.startsWith("image/")) return next();
  await handleReceipt(ctx, ctx.message.document.file_id);
});

bot.callbackQuery(/^topup:(ok|no):(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.answerCallbackQuery({ text: "Faqat admin uchun" });
  const approve = ctx.match[1] === "ok";
  const result = resolveTopup(Number(ctx.match[2]), approve, ctx.from.id);
  if (!result) return ctx.answerCallbackQuery({ text: "Bu toʻlov allaqachon koʻrib chiqilgan" });

  const { topup, balance, referrerId } = result;
  if (referrerId) notifyReferralReward(referrerId, topup.user_id).catch(() => {});
  await ctx.answerCallbackQuery({ text: approve ? "Tasdiqlandi" : "Rad etildi" });
  const status = approve ? `✅ Tasdiqlandi (${escapeHtml(ctx.from.first_name)})` : `❌ Rad etildi (${escapeHtml(ctx.from.first_name)})`;
  await ctx
    .editMessageCaption({ caption: `${ctx.callbackQuery.message?.caption ?? ""}\n\n${status}`, reply_markup: { inline_keyboard: [] } })
    .catch(() => {});

  await safeSend(topup.user_id, () =>
    bot.api.sendMessage(
      topup.user_id,
      approve
        ? `✅ Toʻlovingiz tasdiqlandi! Balansga <b>${formatSom(topup.amount)}</b> qoʻshildi.\n💰 Balans: <b>${formatSom(balance)}</b>`
        : `❌ Toʻlov #${topup.id} tasdiqlanmadi. Chek notoʻgʻri yoki pul tushmagan boʻlishi mumkin.${supportLine()}`,
      { parse_mode: "HTML", reply_markup: approve ? new InlineKeyboard().webApp("📱 Buyurtma berish", appUrl()) : undefined },
    ),
  );
});

// ---------- Admin buyruqlari ----------

bot.command("admin", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  await ctx.reply(
    "🛠 <b>Admin buyruqlari</b>\n\n" +
      "/stats — statistika\n" +
      "/user &lt;id&gt; — foydalanuvchi maʼlumoti\n" +
      "/add &lt;id&gt; &lt;summa&gt; — balansga qoʻshish (manfiy summa — yechish)\n" +
      "/newpromo &lt;KOD&gt; &lt;summa&gt; [limit] [kun] — promokod yaratish\n" +
      "/promos — promokodlar roʻyxati\n" +
      "/usage — AI sarfi (soʻrovlar, tokenlar, narx)\n" +
      "/broadcast — biror xabarga javob (reply) qilib yozing, oʻsha xabar hammaga yuboriladi",
    { parse_mode: "HTML" },
  );
});

bot.command("stats", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const s = stats();
  const byService = s.byService.map((row) => `  ${getService(row.service)?.title ?? row.service}: ${row.n}`).join("\n") || "  —";
  await ctx.reply(
    `📊 <b>Statistika</b>\n\n` +
      `👥 Foydalanuvchilar: <b>${s.users}</b> (bugun +${s.usersToday}, bloklagan: ${s.blocked})\n` +
      `📦 Buyurtmalar: tayyor <b>${s.ordersDone}</b>, jarayonda ${s.ordersActive}, xato ${s.ordersFailed} (bugun ${s.ordersToday})\n` +
      `💰 Tushum: <b>${formatSom(s.revenue)}</b> (bugun ${formatSom(s.revenueToday)})\n\n` +
      `Xizmatlar boʻyicha:\n${byService}\n\n` +
      `🧠 AI bugun: ${usageSince(new Date().setHours(0, 0, 0, 0)).reduce((n, r) => n + r.requests, 0)} soʻrov — batafsil /usage`,
    { parse_mode: "HTML" },
  );
});

// Taxminiy narx ($ / 1M token). Gemini bepul tarifda $0.
const AI_PRICES = { "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10], "claude-haiku-5-5": [0.1, 0.5] };
const tokens = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

function usageBlock(title, rows) {
  if (!rows.length) return `<b>${title}:</b> soʻrov yoʻq`;
  const lines = rows.map((r) => {
    const [pin, pout] = AI_PRICES[r.model] ?? [0, 0];
    const cost = (r.input * pin + r.output * pout) / 1e6;
    const price = r.provider === "gemini" ? "bepul" : `~$${cost.toFixed(2)}`;
    return `  ${escapeHtml(r.model)}: ${r.requests} soʻrov${r.failed ? ` (${r.failed} xato)` : ""}, ↓${tokens(r.input)} ↑${tokens(r.output)} · ${price}`;
  });
  return `<b>${title}:</b>\n${lines.join("\n")}`;
}

bot.command("usage", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const day = 24 * 60 * 60 * 1000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const model = config.ai.provider === "claude" ? config.ai.model : config.ai.geminiModel;
  await ctx.reply(
    `🧠 <b>AI sarfi</b> (hozir: ${escapeHtml(model)})\n\n` +
      `${usageBlock("Bugun", usageSince(today.getTime()))}\n\n` +
      `${usageBlock("7 kun", usageSince(Date.now() - 7 * day))}\n\n` +
      `${usageBlock("30 kun", usageSince(Date.now() - 30 * day))}\n\n` +
      `↓ kirish, ↑ chiqish (fikrlash tokenlari bilan). Gemini bepul tarifining kunlik limiti: aistudio.google.com → Usage.`,
    { parse_mode: "HTML" },
  );
});

bot.command("newpromo", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const [code, amount, limit, days] = ctx.match.split(/\s+/);
  const sum = Number(amount);
  if (!code || !Number.isInteger(sum) || sum <= 0) return ctx.reply("Format: /newpromo KOD SUMMA [LIMIT] [KUN]\nMasalan: /newpromo BAHOR 5000 100 7");
  try {
    const promo = createPromo({ code, amount: sum, maxUses: Number(limit) || 100, days: Number(days) || null, adminId: ctx.from.id });
    const until = promo.expires_at ? `, ${new Date(promo.expires_at).toLocaleDateString("ru-RU")} gacha` : "";
    await ctx.reply(
      `✅ Promokod tayyor: <code>${escapeHtml(promo.code)}</code>\n💰 ${formatSom(promo.amount)} · ${promo.max_uses} ta foydalanish${until}\n\n` +
        `Foydalanuvchilar ilovadagi «Hisob» boʻlimida yoki /promo ${escapeHtml(promo.code)} buyrugʻi bilan ishlatadi.`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    await ctx.reply(`❌ ${error.message}`);
  }
});

bot.command("promos", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const rows = listPromos()
    .map((p) => `<code>${escapeHtml(p.code)}</code> — ${formatSom(p.amount)}, ${p.uses}/${p.max_uses}${p.expires_at && p.expires_at < Date.now() ? " (muddati tugagan)" : ""}`)
    .join("\n");
  await ctx.reply(rows || "Promokodlar yoʻq", { parse_mode: "HTML" });
});

bot.command("user", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const user = getUser(Number(ctx.match));
  if (!user) return ctx.reply("Foydalanuvchi topilmadi");
  await ctx.reply(
    `👤 <b>${escapeHtml(user.first_name)}</b>${user.username ? ` @${escapeHtml(user.username)}` : ""}\n` +
      `🆔 <code>${user.id}</code>\n💰 ${formatSom(user.balance)}\n👥 Taklif qilganlar: ${countReferrals(user.id)}\n` +
      `📅 ${new Date(user.created_at).toLocaleString("ru-RU")}`,
    { parse_mode: "HTML" },
  );
});

bot.command("add", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const [id, amount, ...note] = ctx.match.split(/\s+/);
  const userId = Number(id);
  const sum = Number(amount);
  if (!getUser(userId) || !Number.isInteger(sum) || sum === 0) return ctx.reply("Format: /add <id> <summa> [izoh]");
  try {
    const balance = addBalance(userId, sum, "admin", null, note.join(" ") || `admin ${ctx.from.id}`);
    await ctx.reply(`✅ Bajarildi. Yangi balans: ${formatSom(balance)}`);
    if (sum > 0) {
      await safeSend(userId, () =>
        bot.api.sendMessage(userId, `🎁 Balansingizga <b>${formatSom(sum)}</b> qoʻshildi.\n💰 Balans: <b>${formatSom(balance)}</b>`, {
          parse_mode: "HTML",
        }),
      );
    }
  } catch (error) {
    await ctx.reply(`❌ ${error.message}`);
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Xabarni nusxalaydi; Telegram limitiga (429) tushsa, aytilgan vaqtcha kutib qayta urinadi. */
async function copyTo(userId, fromChatId, messageId) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await safeSend(userId, () => bot.api.copyMessage(userId, fromChatId, messageId));
    } catch (error) {
      const wait = error instanceof GrammyError && error.error_code === 429 ? error.parameters?.retry_after : 0;
      if (!wait) return null;
      await sleep(wait * 1000);
    }
  }
  return null;
}

// Yuborish daqiqalar davom etadi. grammY yangilanishlarni ketma-ket ishlagani uchun, handler ichida kutib turilsa,
// bot shu vaqt davomida hech narsaga (jumladan to'lovlarning pre_checkout so'roviga) javob bera olmaydi.
// Shuning uchun yuborish handlerdan alohida, fonda bajariladi.
let broadcasting = false;

bot.command("broadcast", async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  const source = ctx.message.reply_to_message;
  if (!source) return ctx.reply("Yuboriladigan xabarga javob (reply) qilib /broadcast yozing.");
  if (broadcasting) return ctx.reply("Oldingi xabar hali yuborilmoqda. Tugashini kuting.");
  const adminChat = ctx.chat.id;
  const ids = activeUserIds();
  broadcasting = true;
  (async () => {
    try {
      await bot.api.sendMessage(adminChat, `📤 ${ids.length} ta foydalanuvchiga yuborilmoqda...`);
      let sent = 0;
      for (const userId of ids) {
        if (await copyTo(userId, adminChat, source.message_id)) sent += 1;
        await sleep(50); // Telegram limiti: ~30 xabar/soniya
      }
      await bot.api.sendMessage(adminChat, `✅ Yuborildi: ${sent} / ${ids.length}`);
    } catch (error) {
      console.error("Broadcast xatosi:", error);
      await bot.api.sendMessage(adminChat, "❌ Yuborish xato bilan toʻxtadi. Server logini tekshiring.").catch(() => {});
    } finally {
      broadcasting = false;
    }
  })();
});

// ---------- Buyurtma natijalari ----------

export async function sendOrderFile(order) {
  const service = getService(order.service);
  const detail = order.stage?.startsWith("Tayyor · ") ? `📄 ${escapeHtml(order.stage.replace("Tayyor · ", ""))}\n` : "";
  const isWeb = order.file_name?.endsWith(".html");
  const caption = isWeb
    ? `🌐 <b>Premium 3D taqdimot</b>\n📌 ${escapeHtml(order.topic)}\n${detail}\n✅ Tayyor! Telefonda — pastdagi «Onlayn koʻrish» tugmasi. ` +
      `Kompyuterda faylni brauzerda (Chrome) oching: <b>F</b> — toʻliq ekran, <b>←</b> <b>→</b> — qadamlar.`
    : `${service.icon} <b>${service.title}</b>\n📌 ${escapeHtml(order.topic)}\n${detail}\n✅ Tayyor! Topshirishdan oldin oʻqib chiqing va kerak boʻlsa tahrirlang.`;
  const keyboard = new InlineKeyboard();
  if (isWeb) keyboard.url("🌐 Onlayn koʻrish", `${config.webAppUrl}/v/${viewToken(order.id)}`).row();
  keyboard.webApp("➕ Yangi buyurtma", appUrl());
  return safeSend(order.user_id, () =>
    bot.api.sendDocument(order.user_id, new InputFile(order.file_path, order.file_name), {
      caption,
      parse_mode: "HTML",
      reply_markup: keyboard,
    }),
  );
}

export const orderNotifier = {
  done: (order) => sendOrderFile(order),
  failed: (order, balance) =>
    safeSend(order.user_id, () =>
      bot.api.sendMessage(
        order.user_id,
        `❌ Afsuski, «${escapeHtml(order.topic)}» boʻyicha buyurtmani tayyorlab boʻlmadi.\n\n` +
          `💰 <b>${formatSom(order.price)}</b> balansingizga qaytarildi (balans: ${formatSom(balance)}). Iltimos, qaytadan urinib koʻring.${supportLine()}`,
        { parse_mode: "HTML", reply_markup: new InlineKeyboard().webApp("🔁 Qayta urinish", appUrl()) },
      ),
    ),
};

// ---------- Tushunilmagan xabarlar ----------
// Boshqa barcha handlerlardan keyin ro'yxatdan o'tadi: buyruq, to'lov va chek rasmlari bu yerga yetib kelmaydi.

/** Telegram "web_app" tugmasi URL'iga mavzuni qo'shamiz; juda uzun bo'lsa, qo'shmaymiz. */
const topicHash = (service, topic) => {
  const encoded = encodeURIComponent(topic);
  return `service=${service}${encoded.length <= 900 ? `&topic=${encoded}` : ""}`;
};

const hintAllowed = (userId) => {
  if (limits.hints.retryAfter(userId)) return false;
  limits.hints.hit(userId);
  return true;
};

bot.on("message:text", async (ctx) => {
  if (ctx.chat.type !== "private" || !hintAllowed(ctx.from.id)) return;
  ensureUser(ctx.from);
  const text = ctx.message.text.trim();

  if (getAwaitingTopup(ctx.from.id)) {
    return ctx.reply("🧾 Toʻlov chekining <b>rasmini (skrinshotini)</b> yuboring — matn qabul qilinmaydi.", { parse_mode: "HTML" });
  }

  if (text.startsWith("/")) {
    return ctx.reply("Bunday buyruq yoʻq. Quyidagi tugmalardan foydalaning yoki /help ni bosing.", { reply_markup: mainMenu() });
  }

  if (text.length < 3 || text.length > 300) {
    return ctx.reply(
      "✍️ Mavzuni 3–300 belgi oraligʻida yozing, masalan: «Raqamli iqtisodiyot». Yoki ilovani oching 👇",
      { reply_markup: new InlineKeyboard().webApp("📱 Ilovani ochish", appUrl()) },
    );
  }

  const shown = text.length > 100 ? `${text.slice(0, 100)}…` : text;
  const keyboard = new InlineKeyboard();
  Object.values(SERVICES).forEach((service, i) => {
    keyboard.webApp(`${service.icon} ${service.title}`, appUrl(topicHash(service.id, text)));
    if (i % 2 === 1) keyboard.row();
  });
  await ctx.reply(`📝 Mavzu: <b>${escapeHtml(shown)}</b>\n\nNima tayyorlaymiz? Xizmatni tanlang 👇`, { parse_mode: "HTML", reply_markup: keyboard });
});

bot.on(
  [
    "message:document",
    "message:voice",
    "message:audio",
    "message:video",
    "message:video_note",
    "message:sticker",
    "message:animation",
    "message:contact",
    "message:location",
  ],
  async (ctx) => {
    if (ctx.chat.type !== "private" || !hintAllowed(ctx.from.id)) return;
    await ctx.reply(
      "Men faqat matn (mavzu) va toʻlov chekining rasmini qabul qilaman. Buyurtma berish uchun mavzuni yozing yoki ilovani oching 👇",
      { reply_markup: new InlineKeyboard().webApp("📱 Ilovani ochish", appUrl()) },
    );
  },
);

bot.catch((error) => {
  console.error(`Bot xatosi (update ${error.ctx?.update?.update_id}):`, error.error);
});

export async function setupBot() {
  await bot.init();
  await bot.api.setMyCommands([
    { command: "start", description: "Bosh menyu" },
    { command: "samples", description: "Premium shablon namunalari" },
    { command: "balance", description: "Balans va toʻldirish" },
    { command: "promo", description: "Promokodni ishlatish" },
    { command: "invite", description: "Doʻstlarni taklif qilish" },
    { command: "help", description: "Yordam va narxlar" },
    { command: "paysupport", description: "Toʻlov boʻyicha yordam" },
    { command: "terms", description: "Foydalanish shartlari" },
  ]);
  await bot.api.setChatMenuButton({
    menu_button: { type: "web_app", text: "Ochish", web_app: { url: appUrl() } },
  });
  return bot.botInfo;
}
