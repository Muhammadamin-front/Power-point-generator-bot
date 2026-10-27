import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "bot-verify-"));
Object.assign(process.env, {
  BOT_TOKEN: "123456:TESTTOKEN",
  WEBAPP_URL: "https://bot.example.test",
  DATA_DIR: dataDir,
  ADMIN_IDS: "900",
  START_BONUS: "2000",
  REFERRAL_BONUS: "2000",
  DEV_USER_ID: "555",
  MIN_CARD_TOPUP: "5000",
  CARD_NUMBER: "8600000000000000",
});
delete process.env.NODE_ENV;

const db = await import(`${ROOT}/src/db.js`);
const { guardPromo, RateLimitError, limits } = await import(`${ROOT}/src/ratelimit.js`);
const botMod = await import(`${ROOT}/src/bot.js`);
const { createServer } = await import(`${ROOT}/src/server.js`);

botMod.bot.botInfo = { id: 1, is_bot: true, first_name: "Bot", username: "testbot", can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false };
let passed = 0;
const ok = (name) => console.log(`  ✓ ${name}`) || passed++;

// ---------- 1. Referal: faqat birinchi pullik to'lovdan keyin ----------
console.log("DB / referal");
const A = db.ensureUser({ id: 1, first_name: "A" }).user;
const B = db.ensureUser({ id: 2, first_name: "B" }, 1);
assert.equal(B.referrerId, 1);
assert.equal(db.getUser(1).balance, 2000, "taklif qilganga qo'shilishda bonus berilmasligi kerak");
assert.equal(db.getUser(2).balance, 2000);
ok("do'st qo'shilganda taklif qilgan bonus olmaydi");

db.addBalance(2, 1000, "promo", "promo:X:2", "x");
db.addBalance(2, 1000, "admin", null, "x");
assert.equal(db.getUser(1).balance, 2000);
ok("promokod/admin qo'shishi bonus bermaydi");

const p1 = db.addPayment(2, 10000, "stars", "charge-1", "50 ⭐");
assert.equal(p1.referrerId, 1);
assert.equal(db.getUser(1).balance, 4000);
assert.equal(p1.balance, 2000 + 2000 + 10000);
ok("birinchi Stars to'lovi → taklif qilganga +2000");

const p2 = db.addPayment(2, 5000, "provider", "charge-2", "x");
assert.equal(p2.referrerId, null);
assert.equal(db.getUser(1).balance, 4000);
ok("ikkinchi to'lov bonus bermaydi");

assert.throws(() => db.addPayment(2, 10000, "stars", "charge-1", "x"), (e) => e.code === "duplicate");
assert.equal(db.getUser(1).balance, 4000);
assert.equal(db.getUser(2).balance, 2000 + 2000 + 10000 + 5000);
ok("takroriy charge_id: balans ham, bonus ham o'zgarmaydi");

db.ensureUser({ id: 3, first_name: "C" }, 1);
const t1 = db.createCardTopup(3, 6000);
db.attachReceipt(t1.id, "file");
const rejected = db.resolveTopup(t1.id, false, 900);
assert.equal(rejected.referrerId, null);
assert.equal(db.getUser(1).balance, 4000);
const t2 = db.createCardTopup(3, 6000);
db.attachReceipt(t2.id, "file");
const approved = db.resolveTopup(t2.id, true, 900);
assert.equal(approved.referrerId, 1);
assert.equal(db.getUser(1).balance, 6000);
assert.equal(db.resolveTopup(t2.id, true, 900), null);
assert.equal(db.getUser(1).balance, 6000);
ok("karta: rad etilsa bonus yo'q, tasdiqlansa +2000, qayta tasdiqlash bonus bermaydi");

db.ensureUser({ id: 4, first_name: "D" }); // taklifsiz
assert.equal(db.addPayment(4, 10000, "stars", "charge-4", "x").referrerId, null);
const self = db.ensureUser({ id: 5, first_name: "E" }, 5);
assert.equal(self.referrerId, null);
ok("taklifsiz va o'zini o'zi taklif qilgan foydalanuvchi bonus bermaydi");

// eski tizimda bonus allaqachon berilgan bo'lsa, ikki marta berilmaydi
db.ensureUser({ id: 6, first_name: "F" }, 1);
db.addBalance(1, 2000, "referral", "ref:6", "old");
const before = db.getUser(1).balance;
assert.equal(db.addPayment(6, 10000, "stars", "charge-6", "x").referrerId, null);
assert.equal(db.getUser(1).balance, before);
ok("eski tizimda berilgan bonus qayta berilmaydi");

// ---------- 2. Promokod cheklovi ----------
console.log("Tezlik cheklovi");
db.createPromo({ code: "BAHOR", amount: 1000, maxUses: 100 });
const attempt = (userId, code) => guardPromo(userId, () => db.redeemPromo(userId, code));
for (let i = 0; i < 5; i++) assert.throws(() => attempt(7, `WRONG${i}`), (e) => e.code === "promo_not_found");
assert.throws(() => attempt(7, "BAHOR"), (e) => e instanceof RateLimitError && e.retryAfter > 800);
ok("5 ta xato urinishdan keyin to'g'ri kod ham bloklanadi (15 daqiqa)");
db.ensureUser({ id: 8, first_name: "G" });
assert.equal(attempt(8, "BAHOR").amount, 1000);
assert.throws(() => attempt(8, "BAHOR"), (e) => e.code === "promo_used");
assert.throws(() => attempt(8, "BAHOR"), (e) => e.code === "promo_used");
ok("muvaffaqiyatli urinish hisoblanmaydi, boshqa foydalanuvchi bloklanmaydi");

// ---------- 3. Express server ----------
console.log("Server");
const server = createServer().listen(0);
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
const call = (p, body, method = body ? "POST" : "GET") =>
  fetch(base + p, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

for (let i = 0; i < 5; i++) assert.equal((await call("/api/promo", { code: `NOPE${i}` })).status, 409);
const blocked = await call("/api/promo", { code: "BAHOR" });
assert.equal(blocked.status, 429);
assert.ok(Number(blocked.headers.get("retry-after")) > 0);
assert.equal((await blocked.json()).code, "rate_limited");
ok("/api/promo: 5 xatodan keyin 429 + Retry-After");

const order = { service: "test", topic: "Sinov mavzusi", size: 10, lang: "uz" };
const statuses = [];
for (let i = 0; i < 8; i++) statuses.push((await call("/api/orders", order)).status);
assert.deepEqual(statuses.slice(0, 6).filter((s) => s === 429), []);
assert.deepEqual(statuses.slice(6), [429, 429]);
ok(`/api/orders: 6 tadan keyin 429 (${statuses.join(",")})`);

assert.equal((await call("/api/me")).status, 200);
for (let i = 0; i < 12; i++) await call("/api/topup/card", { amount: 6000 });
assert.equal((await call("/api/topup/card", { amount: 6000 })).status, 429);
ok("/api/topup/*: limitdan keyin 429");
await new Promise((r) => server.close(r));

// ---------- 4. Bot handlerlari (soxta Telegram API) ----------
console.log("Bot");
const { bot } = botMod;
const calls = [];
let copyDelay = 0;
bot.api.config.use(async (prev, method, payload) => {
  calls.push({ method, payload });
  if (method === "copyMessage") await new Promise((r) => setTimeout(r, copyDelay));
  return { ok: true, result: method === "sendMessage" ? { message_id: 1, date: 0, chat: { id: 1, type: "private" } } : true };
});

let updateId = 1;
const private_chat = (id) => ({ id, type: "private", first_name: "U" });
const msg = (from, extra) => ({ update_id: updateId++, message: { message_id: updateId, date: 0, chat: private_chat(from), from: { id: from, is_bot: false, first_name: "U" }, ...extra } });
const cmd = (from, text, extra = {}) => msg(from, { text, entities: [{ type: "bot_command", offset: 0, length: text.split(" ")[0].length }], ...extra });
const last = (method) => calls.filter((c) => c.method === method).at(-1)?.payload;

await bot.handleUpdate(msg(100, { text: "Raqamli iqtisodiyot" }));
let reply = last("sendMessage");
assert.match(reply.text, /Raqamli iqtisodiyot/);
const buttons = reply.reply_markup.inline_keyboard.flat();
assert.equal(buttons.length, 5);
const url = new URL(buttons[0].web_app.url);
assert.equal(url.origin, "https://bot.example.test");
assert.equal(new URLSearchParams(url.hash.slice(1)).get("topic"), "Raqamli iqtisodiyot");
assert.equal(new URLSearchParams(url.hash.slice(1)).get("service"), "taqdimot");
ok("oddiy matn → mavzu bilan xizmat tanlash tugmalari (web_app URL'da topic)");

await bot.handleUpdate(msg(100, { text: "<b>&x</b> & Мавзу" }));
assert.match(last("sendMessage").text, /&lt;b&gt;&amp;x&lt;\/b&gt;/);
ok("mavzu HTML'da ekranlanadi");

await bot.handleUpdate(msg(101, { text: "ab" }));
assert.match(last("sendMessage").text, /3–300/);
await bot.handleUpdate(cmd(101, "/qwerty"));
assert.match(last("sendMessage").text, /Bunday buyruq yoʻq/);
await bot.handleUpdate(msg(101, { voice: { file_id: "v", file_unique_id: "v", duration: 1 } }));
assert.match(last("sendMessage").text, /faqat matn/i);
await bot.handleUpdate(msg(101, { sticker: { file_id: "s", file_unique_id: "s", type: "regular", width: 1, height: 1, is_animated: false, is_video: false } }));
await bot.handleUpdate(msg(101, { document: { file_id: "d", file_unique_id: "d", mime_type: "application/pdf" } }));
assert.match(last("sendMessage").text, /faqat matn/i);
ok("qisqa matn, noma'lum buyruq, ovoz, stiker, PDF — hammasiga javob beriladi");

const before2 = calls.length;
for (let i = 0; i < 10; i++) await bot.handleUpdate(msg(102, { text: "spam mavzu" }));
assert.equal(calls.length - before2, 6);
ok("spam: 1 daqiqada 6 tadan ortiq javob yuborilmaydi");

// chek kutayotgan foydalanuvchi
db.ensureUser({ id: 103, first_name: "H" });
db.createCardTopup(103, 6000);
await bot.handleUpdate(msg(103, { text: "salom" }));
assert.match(last("sendMessage").text, /chekining/);
// chek rasmi hali ham ishlaydi
await bot.handleUpdate(msg(103, { photo: [{ file_id: "p", file_unique_id: "p", width: 1, height: 1 }] }));
assert.equal(last("sendPhoto").chat_id, 900);
ok("chek kutilganda matn → eslatma; chek rasmi adminga ketadi (eski oqim buzilmagan)");

// guruhda javob bermaydi
const n = calls.length;
await bot.handleUpdate({ update_id: updateId++, message: { message_id: 1, date: 0, chat: { id: -5, type: "group", title: "g" }, from: { id: 104, is_bot: false, first_name: "U" }, text: "mavzu" } });
assert.equal(calls.length, n);
ok("guruhda jim");

// /promo bot orqali: 5 xato → blok
db.ensureUser({ id: 105, first_name: "I" });
for (let i = 0; i < 5; i++) await bot.handleUpdate(cmd(105, `/promo ZZZ${i}`));
await bot.handleUpdate(cmd(105, "/promo BAHOR"));
assert.match(last("sendMessage").text, /Juda koʻp xato urinish/);
ok("/promo botda ham bloklanadi");

// to'lov → referal xabari
db.ensureUser({ id: 201, first_name: "Ref" });
db.ensureUser({ id: 202, first_name: "Friend" }, 201);
const balBefore = db.getUser(201).balance;
const payload = "stars:s50:202";
await bot.handleUpdate({ update_id: updateId++, message: { message_id: 9, date: 0, chat: private_chat(202), from: { id: 202, is_bot: false, first_name: "Friend" }, successful_payment: { currency: "XTR", total_amount: 50, invoice_payload: payload, telegram_payment_charge_id: "tg-1", provider_payment_charge_id: "" } } });
await new Promise((r) => setTimeout(r, 20));
assert.equal(db.getUser(201).balance - balBefore, 2000);
const notice = calls.filter((c) => c.method === "sendMessage" && c.payload.chat_id === 201).at(-1);
assert.match(notice.payload.text, /Friend/);
assert.match(notice.payload.text, /qoʻshildi/);
ok("Stars to'lovi → taklif qilganga +2000 va xabar");

// ---------- 5. Broadcast handlerni bloklamaydi ----------
for (let i = 300; i < 306; i++) db.ensureUser({ id: i, first_name: "B" });
copyDelay = 120;
const started = Date.now();
await bot.handleUpdate(cmd(900, "/broadcast", { reply_to_message: { message_id: 77, date: 0, chat: private_chat(900), text: "e'lon" } }));
const handlerTime = Date.now() - started;
assert.ok(handlerTime < 100, `handler ${handlerTime}ms davom etdi`);
ok(`/broadcast handleri darhol tugaydi (${handlerTime}ms), yuborish fonda`);

// shu paytda pre_checkout_query javobsiz qolmaydi
const t0 = Date.now();
await bot.handleUpdate({ update_id: updateId++, pre_checkout_query: { id: "pc1", from: { id: 202, is_bot: false, first_name: "F" }, currency: "XTR", total_amount: 50, invoice_payload: payload } });
assert.ok(Date.now() - t0 < 100);
assert.equal(last("answerPreCheckoutQuery").ok, true);
ok("broadcast paytida pre_checkout_query darhol javob oladi");

await bot.handleUpdate(cmd(900, "/broadcast", { reply_to_message: { message_id: 77, date: 0, chat: private_chat(900), text: "e'lon" } }));
assert.match(last("sendMessage").text, /hali yuborilmoqda/);
ok("ikkinchi parallel broadcast rad etiladi");

const total = db.activeUserIds().length;
await new Promise((r) => setTimeout(r, total * 190 + 500));
assert.equal(calls.filter((c) => c.method === "copyMessage").length, total);
assert.match(last("sendMessage").text, new RegExp(`Yuborildi: ${total} / ${total}`));
await bot.handleUpdate(cmd(900, "/broadcast", { reply_to_message: { message_id: 77, date: 0, chat: private_chat(900), text: "e'lon" } }));
assert.match(calls.filter((c) => c.method === "sendMessage").at(-1).payload.text, /yuborilmoqda/);
ok(`broadcast hammaga yetib bordi (${total}/${total}), tugagach yangi broadcast mumkin`);

console.log(`\n${passed} ta tekshiruv o'tdi`);
process.exit(0);
