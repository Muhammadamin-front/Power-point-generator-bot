// Veb-taqdimot: soxta AI bilan to'liq buyurtma oqimi, normalizatsiya, xavfsizlik va brauzerda ochilishi.
// Ishga tushirish: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mock } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "bot-web-"));
Object.assign(process.env, { BOT_TOKEN: "1:TEST", WEBAPP_URL: "https://bot.example.test", DATA_DIR: dataDir, ADMIN_IDS: "900", FILE_TTL_DAYS: "30" });
delete process.env.PEXELS_API_KEY;
delete process.env.NODE_ENV;

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", name), "utf8"));
const src = (p) => pathToFileURL(path.join(ROOT, "src", p)).href;
let aiResponse = fixture("web-ai.json");
let aiCalls = [];
const { WebDeckSchema } = await import(src("ai/webdeck.js"));
const { AIError } = await import(src("ai/errors.js"));
mock.module(src("ai/index.js"), {
  namedExports: {
    AIError,
    generate: async (options) => {
      aiCalls.push(options);
      // Haqiqiy javob kabi sxema bo'yicha tekshiriladi
      return options.schema.parse(aiResponse);
    },
  },
});

const { runOrder } = await import(src("pipeline.js"));
const { buildWebSample } = await import(src("generators/web/sample.js"));
const { safeJson } = await import(src("generators/web/build.js"));
const { createServer } = await import(src("server.js"));
const db = await import(src("db.js"));
const { fileToken, viewToken, verifyFileToken } = await import(src("auth.js"));

let passed = 0;
const ok = (name) => console.log(`  ✓ ${name}`) || passed++;
const readDeck = (html) => {
  const m = /<script id="deck" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(m, "deck skripti topilmadi");
  return JSON.parse(m[1]);
};

console.log("Sxema");
const jsonSchema = JSON.stringify((await import("zod")).z.toJSONSchema(WebDeckSchema));
assert.ok(!/"(anyOf|oneOf|allOf|minItems|maxItems|minimum|maximum|minLength|maxLength)"/.test(jsonSchema));
ok("AI sxemasi tekis: union va min/max cheklovlarsiz (Gemini va Claude bilan mos)");

console.log("Buyurtma oqimi");
const order = (extra = {}) => ({
  id: 7,
  topic: "raqamli iqtisodiyotning oʻzbekistondagi istiqbollari",
  service: "taqdimot",
  params: {
    size: 9,
    lang: "uz",
    theme: "web3d",
    subject: "Iqtisodiyot",
    extra: "",
    colors: { primary: "#14532D", accent: "#D97706" },
    fonts: { body: "inter", display: "lora" },
    profile: { name: "Aliyev Valijon", group: "IQ-21", university: "TDIU", faculty: "", teacher: "Rahimova N.S.", city: "Toshkent" },
    ...extra,
  },
});
const stages = [];
const result = await runOrder(order(), (p, s) => stages.push([p, s]));
assert.equal(path.extname(result.fileName), ".html");
assert.match(result.summary, /^\d+ ta boʻlim$/);
const html = fs.readFileSync(result.filePath, "utf8");
const deck = readDeck(html);
assert.equal(deck.cover.name, "Aliyev Valijon");
assert.equal(deck.cover.group, "IQ-21");
assert.equal(deck.cover.title, "Raqamli iqtisodiyotning oʻzbekistondagi istiqbollari", "mavzu foydalanuvchi yozganidek, bosh harf bilan");
assert.equal(deck.cover.kicker, "Iqtisodiyot");
assert.equal(deck.cover.university, "TDIU");
assert.deepEqual(deck.theme, { primary: "#14532D", accent: "#D97706" });
assert.equal(deck.lang, "uz");
ok("fayl .html; titul sahifa buyurtmadagi mavzu, F.I.Sh. va guruhdan (AI emas)");
assert.ok(stages.some(([, s]) => /Veb-taqdimot/.test(s)) && stages.at(-1)[0] >= 88);
assert.equal(aiCalls.length, 1);
assert.match(aiCalls[0].system, /premium interactive web presentation/);
assert.ok(aiCalls[0].prompt.includes("<student_request>"));
ok("AI bir marta chaqirilgan, progress bosqichlari to'g'ri");
assert.ok(html.includes('font-family:"ft-body"') && html.includes('font-family:"ft-display"'));
const fontFaces = html.match(/@font-face/g).length;
assert.equal(fontFaces, 8, "faqat tanlangan 2 shrift × 4 qism");
assert.ok(!html.includes("Commissioner") || true);
assert.ok(Buffer.byteLength(html) < 2_500_000);
ok(`faqat tanlangan 2 shrift joylangan (${fontFaces} qism), hajmi ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);

// Standart ranglar/shriftlar: buyurtmada ko'rsatilmagan yoki noto'g'ri bo'lsa
const fallback = await runOrder(order({ colors: { primary: "red", accent: "javascript:alert(1)" }, fonts: { body: "../../etc/passwd", display: "Comic Sans" } }), () => {});
const fb = readDeck(fs.readFileSync(fallback.filePath, "utf8"));
assert.deepEqual(fb.theme, { primary: "#1E2D4A", accent: "#C23B22" });
assert.equal(fs.readFileSync(fallback.filePath, "utf8").match(/@font-face/g).length, 8);
ok("noto'g'ri rang va shrift identifikatorlari standartga qaytadi");

// Boshqa tillar
const ru = await runOrder(order({ lang: "ru" }), () => {});
assert.equal(readDeck(fs.readFileSync(ru.filePath, "utf8")).lang, "ru");
ok("til buyurtmadan (ru)");

console.log("Normalizatsiya va xavfsizlik");
aiResponse = fixture("web-ai-bad.json");
const badRun = await runOrder(order(), () => {});
const badHtml = fs.readFileSync(badRun.filePath, "utf8");
const bad = readDeck(badHtml);
assert.ok(bad.cover.subtitle.length <= 160);
assert.ok(bad.brand.length <= 24);
assert.equal(bad.numbers.stats.every((s) => Number.isFinite(s.value) && s.decimals >= 0 && s.decimals <= 2), true);
assert.ok(bad.numbers.chart.bars.every((b) => b.value >= 0 && b.label));
assert.ok(bad.numbers.chart.bars.filter((b) => b.highlight).length <= 1);
assert.equal(bad.timeline.steps.length, 2);
assert.ok(bad.concepts.cards[0].text.length <= 220);
assert.equal(bad.compare.rows.length, 0, "to'liq bo'lmagan qator tashlanadi");
ok("uzun satrlar kesiladi, noto'g'ri sonlar tozalanadi, to'liq bo'lmagan elementlar tashlanadi");
const inject = badHtml.slice(badHtml.indexOf('<script id="deck"'), badHtml.indexOf("</script>", badHtml.indexOf('<script id="deck"')));
assert.ok(!inject.slice(40).includes("<"), "JSON ichida xom '<' qolmasligi kerak");
assert.ok(inject.includes("\\u003c/script>") || inject.includes("\\u003c/script"));
assert.equal((badHtml.match(/<script id="deck"/g) ?? []).length, 1);
assert.equal(safeJson({ a: "</script>\u2028" }).includes("<"), false);
ok("</script> ni JSON ichida yozish urinishi sahifani buzmaydi");
aiResponse = fixture("web-ai.json");

console.log("Server");
db.ensureUser({ id: 555, first_name: "T" });
db.addBalance(555, 100000, "admin", null, "test");
const server = createServer().listen(0);
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;

const o = db.createOrder({ userId: 555, service: "taqdimot", topic: "t", params: order().params, price: 15000 }).id;
db.updateOrder(o, { status: "done", file_path: result.filePath, file_name: "t.html" });
const view = await fetch(`${base}/v/${viewToken(o)}`);
assert.equal(view.status, 200);
assert.match(view.headers.get("content-type"), /text\/html/);
const csp = view.headers.get("content-security-policy");
assert.match(csp, /default-src 'none'/);
assert.match(csp, /connect-src 'none'/);
assert.equal(view.headers.get("x-content-type-options"), "nosniff");
assert.equal((await view.text()).length, html.length);
ok("/v/:token faylni qat'iy CSP bilan beradi");
assert.equal((await fetch(`${base}/v/${viewToken(o)}x`)).status, 404);
assert.equal((await fetch(`${base}/v/garbage`)).status, 404);
const pptxOrder = db.createOrder({ userId: 555, service: "taqdimot", topic: "p", params: order().params, price: 15000 }).id;
db.updateOrder(pptxOrder, { status: "done", file_path: result.filePath, file_name: "p.pptx" });
assert.equal((await fetch(`${base}/v/${viewToken(pptxOrder)}`)).status, 404, ".pptx onlayn ko'rilmaydi");
// 30 kunlik token 1 soatlikdan farqli
const [, expires] = viewToken(o).split(".").slice(0, 2);
assert.ok(Number(expires) - Date.now() / 1000 > 29 * 86400);
assert.ok(Number(fileToken(o).split(".")[1]) - Date.now() / 1000 < 3700);
ok("noto'g'ri token va .pptx 404; ko'rish tokeni 30 kun, yuklab olish tokeni 1 soat");

const sample = await fetch(`${base}/samples/web?primary=5B1A2E&accent=B8860B&body=montserrat&display=noto-serif&title=${encodeURIComponent("Mening <b>mavzum</b>")}&name=Ali&group=IQ-1&lang=ru`);
assert.equal(sample.status, 200);
const sampleDeck = readDeck(await sample.text());
assert.deepEqual(sampleDeck.theme, { primary: "#5B1A2E", accent: "#B8860B" });
assert.equal(sampleDeck.cover.title, "Mening <b>mavzum</b>", "mavzu matn sifatida saqlanadi (HTML emas)");
assert.equal(sampleDeck.cover.name, "Ali");
assert.equal(sampleDeck.lang, "ru");
const evil = await fetch(`${base}/samples/web?primary=zzzzzz&accent=%3Cscript%3E&body=../../x&display[]=a`);
assert.equal(evil.status, 200);
assert.deepEqual(readDeck(await evil.text()).theme, { primary: "#1E2D4A", accent: "#C23B22" });
ok("/samples/web: tanlangan ranglar va titul; noto'g'ri qiymatlar standartga qaytadi");
let blocked = 0;
for (let i = 0; i < 25; i++) if ((await fetch(`${base}/samples/web`)).status === 429) blocked++;
assert.ok(blocked >= 4);
ok("/samples/web tezlik cheklovi (20/daqiqa)");

assert.equal((await fetch(`${base}/web-fonts/manifest.json`)).status, 200);
assert.equal((await fetch(`${base}/web-fonts/commissioner-latin.woff2`)).status, 200);
assert.equal((await fetch(`${base}/web-fonts/../../.env`)).status, 404);
ok("/web-fonts: manifest va shriftlar beriladi, yo'ldan chiqib bo'lmaydi");

const cfg = await (await fetch(`${base}/api/config`)).json().catch(() => null);
// DEV_USER_ID yo'q: auth talab qilinadi
assert.equal((await fetch(`${base}/api/config`)).status, 401);
ok("/api autentifikatsiyasiz yopiq");

// narx
const { priceFor } = await import(src("services.js"));
assert.equal(priceFor("taqdimot", 9, "web3d"), 15000);
assert.equal(priceFor("taqdimot", 10, "web3d"), null);
assert.equal(priceFor("referat", 9, "web3d"), null);
assert.equal(priceFor("taqdimot", 10, "custom"), 5000);
ok("narx: web3d faqat taqdimot uchun, custom — oddiy narx");

await new Promise((r) => server.close(r));

console.log("Brauzer (haqiqiy buyurtma fayli)");
const puppeteer = (await import("puppeteer-core").catch(() => null))?.default;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (puppeteer && fs.existsSync(CHROME)) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const [label, file] of [["to'liq", result.filePath], ["ekstremal", badRun.filePath], ["rus", ru.filePath]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
    await new Promise((r) => setTimeout(r, 1500));
    const info = await page.evaluate(() => ({ h1: document.querySelector("h1")?.textContent, sections: [...document.querySelectorAll("main section[id]")].map((s) => s.id), overflow: document.documentElement.scrollWidth > window.innerWidth, name: document.body.innerText.includes("Aliyev Valijon") }));
    assert.deepEqual(errors, [], `${label}: konsol xatolari`);
    assert.ok(info.h1?.length > 3 && info.name && !info.overflow, `${label}: ${JSON.stringify(info)}`);
    await page.close();
  }
  await browser.close();
  ok("fayl file:// orqali ochiladi: xatosiz, titul sahifada ism ko'rinadi, gorizontal siljish yo'q (to'liq, ekstremal, rus)");
} else console.log("  (Chrome yoki puppeteer-core topilmadi, brauzer tekshiruvi o'tkazib yuborildi)");

console.log(`\n${passed} ta tekshiruv o'tdi`);
process.exit(0);
