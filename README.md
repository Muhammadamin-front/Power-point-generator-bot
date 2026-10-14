# Talaba Yordamchi — Telegram bot + Mini App

Talabalar uchun **taqdimot (PowerPoint), referat, mustaqil ish, kurs ishi va test savollari**ni bir necha daqiqada tayyorlab beradigan Telegram bot. Matnni Claude yozadi, fayllar O'zbekiston OTMlarida qabul qilingan talablar bo'yicha rasmiylashtiriladi.

## Imkoniyatlar

| Xizmat | Fayl | Nima bor |
|---|---|---|
| 📊 Taqdimot | `.pptx` | 6 ta oddiy + **6 ta premium animatsiyali** dizayn, 7 xil slayd turi (ro'yxat, kartalar, raqamlar, vaqt chizig'i, taqqoslash, iqtibos), reja, xulosa, adabiyotlar, ma'ruzachi uchun izohlar, ixtiyoriy rasmlar |
| 📄 Referat | `.docx` | Titul varaq, reja, kirish, 3–4 bo'lim, xulosa, adabiyotlar |
| 📝 Mustaqil ish | `.docx` | Referatdan chuqurroq, 4–5 bo'lim |
| 🎓 Kurs ishi | `.docx` | Boblar va paragraflar, **sahifa raqamli mundarija**, kirishda dolzarblik/maqsad/vazifalar/obyekt/predmet |
| ✅ Test | `.docx` | 4 variantli savollar + alohida javoblar kaliti (to'g'ri javoblar A–D bo'ylab teng taqsimlanadi) |

- **Tillar:** oʻzbekcha (lotin), ўзбекча (kirill), русский, English
- **Rasmiylashtirish:** A4, Times New Roman 14, 1.5 interval, maydonlar 30/15/20/20 mm, xatboshi 1.25 sm, sahifa raqamlari, titul varaqda vazirlik/OTM/talaba/o'qituvchi
- **Mini App:** xizmat tanlash, buyurtma berish, jonli holat, buyurtmalar tarixi, yuklab olish, balans. Telegram mavzusiga (yorug'/qorong'i) o'zi moslashadi
- **To'lov:** Click / Payme (Uzcard, Humo, Visa — avtomatik, Telegram Payments orqali), Telegram Stars va karta o'tkazmasi (chek → admin tasdiqlaydi)
- **Sotuv:** bot va Mini App'da premium shablonlar vitrinasi, har bir shablonning yuklab olinadigan namunasi, promokodlar, to'lovlar tarixi, ixtiyoriy majburiy obuna
- **Bonuslar:** yangi foydalanuvchiga boshlang'ich bonus, do'st taklif qilganlik uchun referal bonus
- **Ishonchlilik:** buyurtma bajarilmasa pul avtomatik qaytadi; server qayta ishga tushsa tugallanmagan buyurtmalar davom etadi; bitta to'lov ikki marta hisoblanmaydi

## Premium animatsiyali shablonlar

`Desktop/Prompt`dagi veb-effektlar asosida yaratilgan 6 ta shablon (16:9 keng format, 13.33 × 7.5"):

| Shablon | Ilhom manbai | Uslub |
|---|---|---|
| **Aura** | `shader.md` | Qora fon, oqib turgan cyan va to'q sariq shader nuri, gradient sarlavha |
| **Neon** | `Hero animate.md` | Yonib turgan neon trubkalar, pushti/binafsha/yashil |
| **Kinetic** | `kinetic.md`, `kinetic-grid` | Perspektivali neon-yashil to'r, monospace yozuvlar, harfma-harf chiquvchi sarlavha |
| **Aurora** | `prompt-background-light.md` | Yorug', ko'k-binafsha shimol yog'dusi |
| **Cosmos** | `animated-planets.md` | Yulduzlar va slayddan slaydga suzib o'tuvchi sayyoralar |
| **Editorial** | `scroll-web.md` (Glacier) | Siyoh/qog'oz, signal to'q sariq, ko'rgazma plakati uslubi |

**Animatsiyalar PowerPoint'ning o'zida ishlaydi** (video yoki GIF emas):
- slayddan slaydga **Morph** o'tishi — dekor (nur, sayyora, disk) silliq suzib o'tadi; PowerPoint 2016 va undan eskilarida avtomatik Fade bilan almashadi;
- sarlavha, punktlar, kartalar, raqamlar va vaqt chizig'i slayd ochilishi bilan ketma-ket paydo bo'ladi (Float In, Fade+Zoom, Wipe, Fly In) — taqdimotchi qo'shimcha bosishi shart emas;
- kinetic sarlavhasi harfma-harf, iqtiboslar so'zma-so'z chiqadi.

Har bir fayl PowerPoint'ning PresentationML sxemasi (`pml.xsd`) bo'yicha tekshirilgan. Fon va dekor rasmlari oldindan chizilgan (`assets/premium/`), serverda Chrome kerak emas. Ularni o'zgartirish uchun `scripts/bake/art.html` ni tahrirlab, macOS + Google Chrome'da `npm run bake` ni ishga tushiring.

## O'rnatish

Talab: **Node.js 22.13+** (bazasi uchun Node'ning ichki `node:sqlite` moduli ishlatiladi — alohida baza o'rnatish shart emas).

```bash
npm install
cp .env.example .env     # keyin .env ni to'ldiring
npm run sample           # ixtiyoriy: AI'siz namunaviy fayllar → data/samples/
npm start
```

### `.env` ni to'ldirish

1. **BOT_TOKEN** — [@BotFather](https://t.me/BotFather) → `/newbot`.
2. **WEBAPP_URL** — server ochiq bo'ladigan **HTTPS** manzil. Telegram Mini App faqat HTTPS bilan ishlaydi.
3. **ANTHROPIC_API_KEY** — [console.anthropic.com](https://console.anthropic.com) dan.
4. **ADMIN_IDS** — o'zingizning Telegram ID'ingiz ([@userinfobot](https://t.me/userinfobot)). Karta cheklari shu adminlarga keladi.
5. **PAYMENT_PROVIDER_TOKEN** — Click / Payme orqali avtomatik to'lov uchun (pastga qarang).
6. Ixtiyoriy: **CARD_NUMBER / CARD_OWNER** (karta orqali qo'lda to'lov), **PEXELS_API_KEY** (slaydlarga rasmlar), **SUPPORT_USERNAME**, **REQUIRED_CHANNEL** (majburiy obuna).

Bot ishga tushganda menyu tugmasi ("Ochish") va buyruqlar avtomatik o'rnatiladi. Telegram Stars uchun BotFather'da qo'shimcha sozlash kerak emas.

### Click / Payme ulash

1. Click yoki Payme bilan merchant (biznes) shartnomasini tuzing.
2. [@BotFather](https://t.me/BotFather) → botingiz → **Bot Settings → Payments** → *Click (Uzbekistan)* yoki *Payme (Uzbekistan)* ni tanlab ulang. BotFather avval **TEST** token beradi — uni `PAYMENT_PROVIDER_TOKEN` ga yozib sinab ko'ring, so'ng LIVE tokenga almashtiring.
3. Telegram har bir valyuta uchun minimal summa qo'yadi (UZS uchun ≈ $1, hozir ~13 000 so'm). Bot uni [currencies.json](https://core.telegram.org/bots/payments/currencies.json) dan kuniga ikki marta yangilab, kichik paketlarni o'zi yashiradi.
4. Agar provayder fiskal chek uchun qo'shimcha maʼlumot (`provider_data`) talab qilsa, uni JSON qatori ko'rinishida `PAYMENT_PROVIDER_DATA` ga yozing — aniq formatni provayderingizdan so'rang.

To'lov foydalanuvchi balansiga avtomatik tushadi; har bir to'lov `telegram_payment_charge_id` bo'yicha faqat bir marta hisoblanadi, summasi yoki egasi mos kelmagan to'lov rad etiladi.

### Lokal sinov (HTTPS tunnel bilan)

```bash
npm run dev
# boshqa terminalda:
cloudflared tunnel --url http://localhost:3000     # yoki: ngrok http 3000
```

Tunnel bergan `https://...` manzilni `WEBAPP_URL` ga yozib, botni qayta ishga tushiring.

Mini App dizaynini Telegramsiz brauzerda ko'rish uchun `.env` ga `DEV_USER_ID=123` qo'shib, `http://localhost:3000` ni oching (productionda bu o'chadi).

### Serverga joylash

Istalgan VPS (Ubuntu + nginx + certbot) yoki Railway / Render kabi platforma mos keladi. `NODE_ENV=production` qo'ying va `data/` papkasini doimiy diskda saqlang — unda baza (`bot.db`) va tayyor fayllar turadi. Jarayonni `pm2` yoki `systemd` bilan boshqaring:

```bash
NODE_ENV=production pm2 start npm --name talaba-bot -- start
```

## Admin buyruqlari (botda)

| Buyruq | Vazifasi |
|---|---|
| `/admin` | Buyruqlar ro'yxati |
| `/stats` | Foydalanuvchilar, buyurtmalar, tushum |
| `/user <id>` | Foydalanuvchi ma'lumoti |
| `/add <id> <summa> [izoh]` | Balansga qo'shish (manfiy — yechish) |
| `/newpromo <KOD> <summa> [limit] [kun]` | Promokod yaratish, masalan `/newpromo BAHOR 5000 100 7` |
| `/promos` | Promokodlar va ishlatilish soni |
| `/usage` | AI sarfi: soʻrovlar, tokenlar, xatolar, narx |
| `/broadcast` | Biror xabarga *reply* qilib yozing — o'sha xabar barcha foydalanuvchilarga yuboriladi |

Karta to'lovlari: foydalanuvchi Mini App'da summani tanlaydi → botga chek rasmini yuboradi → adminga **✅ Tasdiqlash / ❌ Rad etish** tugmalari bilan keladi.

Foydalanuvchilar uchun: `/samples` — premium shablonlar vitrinasi va namunaviy fayllar, `/promo KOD` — promokodni ishlatish (Mini App'dagi «Hisob» bo'limida ham bor).

## Narxlar va sozlamalar

- Xizmat narxlari va hajm variantlari: [src/services.js](src/services.js) (premium taqdimot narxlari — `premiumOptions`)
- Premium shablonlar (ranglar, shriftlar, dekor yo'llari): [src/generators/premium/templates.js](src/generators/premium/templates.js)
- Stars paketlari va bonus foizlari: [src/payments.js](src/payments.js) (`STAR_PRICE_SOM` bilan 1 ⭐ = necha so'm)
- Taqdimot dizaynlari (ranglar, shriftlar): [src/generators/pptx.js](src/generators/pptx.js) → `THEMES`
- AI promptlari: [src/ai/prompts.js](src/ai/prompts.js)

### AI provayder: Gemini (bepul) yoki Claude

`.env` dagi `AI_PROVIDER` bilan tanlanadi:
- **`gemini`** — [Google AI Studio](https://aistudio.google.com/apikey) kaliti (`GEMINI_API_KEY`), bepul tarif. Standart model `gemini-3.5-flash-lite`: taqdimot ~7 s, referat ~10 s. Bepul tarifda "flash" modellar koʻpincha band (503) yoki 2–4 daqiqalab javob beradi, shuning uchun ular standart emas. Asosiy model band yoki limitga yetsa, avtomatik `GEMINI_FALLBACK_MODEL` ishlatiladi.
- **`claude`** — sifati yuqoriroq, pullik (`ANTHROPIC_API_KEY`).

Har bir AI soʻrovining tokenlari bazaga yoziladi. Admin botda **`/usage`** buyrugʻi bilan bugungi, 7 va 30 kunlik sarfni (soʻrovlar, xatolar, tokenlar, Claude uchun taxminiy narx) koʻradi; `/stats` da ham bugungi soʻrovlar soni chiqadi.

### AI xarajati (taxminiy, Claude uchun)

Standart model — `claude-opus-5-5` ($4 / $20 har 1M kirish/chiqish tokeni uchun). Taxminiy xarajat bitta buyurtmaga: taqdimot ~$0.1–0.2, referat ~$0.2–0.4, kurs ishi ~$0.6–1.0. Har bir AI so'rovining token soni server logida chiqadi — haqiqiy xarajatni [console.anthropic.com](https://console.anthropic.com) da kuzatib, narxlarni shunga moslang. Arzonroq variant: `AI_MODEL=claude-sonnet-5-5` (taxminan 2 baravar arzon).

Agar Claude xavfsizlik filtri so'rovni rad etsa, API uni avtomatik boshqa modelda qayta bajaradi (`fallbacks: "default"`); baribir bajarilmasa, pul foydalanuvchiga qaytariladi.

## Loyiha tuzilishi

```
src/
  index.js            ishga tushirish (bot + server + navbat)
  config.js           .env sozlamalari
  bot.js              Telegram bot: buyruqlar, to'lovlar, admin panel, fayl yuborish
  server.js           Mini App API (Telegram initData imzosi tekshiriladi)
  auth.js             initData tekshiruvi, imzolangan yuklab olish havolalari
  db.js               SQLite: foydalanuvchilar, buyurtmalar, tranzaksiyalar, to'lovlar
  queue.js            buyurtmalar navbati
  pipeline.js         buyurtmani bajarish: reja → matn → fayl
  services.js         xizmatlar va narxlar
  payments.js         Telegram Stars, Click/Payme invoice'lari
  samples.js          premium shablonlarning namunaviy fayllari
  ai/claude.js        Claude API (structured outputs, streaming)
  ai/prompts.js       promptlar va javob sxemalari
  generators/pptx.js  taqdimot generatori (pptxgenjs)
  generators/docx.js  Word generatori (docx, mundarija sahifa raqamlari bilan)
  generators/images.js  Pexels rasmlari
  generators/labels.js  hujjatdagi yozuvlar (4 tilda)
  generators/premium/   premium shablonlar: templates.js, build.js (maket), animate.js (Morph + animatsiya XML)
assets/premium/       oldindan chizilgan fon va dekor rasmlari
public/               Mini App (HTML/CSS/JS, build bosqichisiz); public/premium — shablon ko'rinishlari
scripts/sample.js     AI'siz namunaviy fayllar (oddiy va premium)
scripts/bake/         fon/dekor rasmlari va ko'rinishlarni chizuvchi skriptlar (macOS + Chrome)
```

## Eslatma

Tayyorlangan materiallar o'quv maqsadida yordam sifatida beriladi. Botda foydalanuvchilarga faylni topshirishdan oldin o'qib chiqish va kerak bo'lsa tahrirlash tavsiya qilinadi. Adabiyotlar ro'yxatini AI tuzadi — mavjud manbalarni yozishga ko'rsatma berilgan, ammo muhim ishlarda tekshirib chiqish tavsiya etiladi.
# Power-point-generator-bot
