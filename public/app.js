const tg = window.Telegram?.WebApp;
const inTelegram = Boolean(tg?.initData);

// ---------- Ikonkalar (bir xil chiziq qalinligidagi SVG) ----------

const ICON_PATHS = {
  taqdimot: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8.5 20h7M7 12.5l3-3 2.5 2 4-4"/>',
  referat: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5M9.5 12.5h6M9.5 16h6"/>',
  mustaqil_ish: '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5"/><path d="M14 3l5 5v3M14 3v5h5M9.5 12.5H13M9.5 16h2"/><path d="M19.6 13.4a1.4 1.4 0 0 1 2 2L17 20l-2.6.6.6-2.6z"/>',
  kurs_ishi: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.6c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11M21.5 9v5.5"/>',
  test: '<path d="M10.5 6.5h9M10.5 12h9M10.5 17.5h9"/><path d="m4 6.5 1.4 1.4L8 5.3M4 12l1.4 1.4L8 10.8"/><circle cx="5.8" cy="17.5" r="1.6"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12M12 8v12.5M12 8S10.8 3.5 8 3.8C6 4 6.4 7.6 9 8M12 8s1.2-4.5 4-4.2c2 .2 1.6 3.8-1 4.2"/>',
  star: '<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6.5 15h4"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  send: '<path d="M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-6.5-4z"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  retry: '<path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/>',
  inbox: '<path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 13.5h4.5l1 2h5l1-2H20"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  sparkle: '<path d="M12 3.5 13.9 9 19.5 11 13.9 13 12 18.5 10.1 13 4.5 11 10.1 9z"/><path d="M18.5 3.5v3M17 5h3"/>',
  tag: '<path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.4 1.4 0 0 1 0 2l-6.1 6.1a1.4 1.4 0 0 1-2 0z"/><circle cx="8.2" cy="8.2" r="1.4"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3.5"/><path d="M4 7.5v10A2.5 2.5 0 0 0 6.5 20H20V8.5H6.5A2.5 2.5 0 0 1 4 6"/><circle cx="16.3" cy="14.2" r="1.1"/>',
  arrowDown: '<path d="M12 5v14M6.5 13.5 12 19l5.5-5.5"/>',
  arrowUp: '<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5"/>',
};
const icon = (name, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] ?? ""}</svg>`;

// Har bir xizmat rangi — oq ikonka bilan kamida 3:1 kontrast beradi.
const SERVICE_TILE = {
  taqdimot: "#E8590C",
  referat: "#1C7ED6",
  mustaqil_ish: "#7048E8",
  kurs_ishi: "#099268",
  test: "#D6336C",
};
const tile = (name, color) => `<span class="tile" style="--tile:${color}">${icon(name)}</span>`;
const serviceTile = (id) => tile(id, SERVICE_TILE[id] ?? "var(--accent)");

const DURATION = {
  taqdimot: "1–3 daqiqa",
  test: "1–2 daqiqa",
  referat: "3–5 daqiqa",
  mustaqil_ish: "4–7 daqiqa",
  kurs_ishi: "6–12 daqiqa",
};
// Bosqichlar server yuboradigan progress foiziga mos (src/pipeline.js).
const STEPS = {
  taqdimot: [
    ["Slaydlar mazmuni", 75],
    ["Rasmlar va dizayn", 90],
    ["Taqdimotni yigʻish", 100],
  ],
  test: [
    ["Savollarni tuzish", 90],
    ["Hujjatni rasmiylashtirish", 100],
  ],
  document: [
    ["Reja tuzish", 12],
    ["Matnni yozish", 90],
    ["Hujjatni rasmiylashtirish", 100],
  ],
};
const STATUS_LABEL = { queued: "Navbatda", processing: "Tayyorlanmoqda", done: "Tayyor", failed: "Xatolik" };
const PROFILE_FIELDS = [
  ["name", "F.I.Sh.", "Familiya Ism"],
  ["group", "Guruh", "masalan, IQ-21"],
  ["university", "Oliygoh", "Universitet yoki institut nomi"],
  ["faculty", "Fakultet", "Fakultet yoki kafedra"],
  ["teacher", "Oʻqituvchi", "Familiya I.O."],
  ["city", "Shahar", "Toshkent"],
];

const state = {
  config: null,
  me: null,
  orders: [],
  view: "home",
  form: null,
  formError: "",
  orderId: null,
  cardRequested: false,
  transactions: null,
  pollTimer: null,
};

// ---------- Yordamchi funksiyalar ----------

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const groupDigits = (n) => Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ");
const som = (amount) => `${groupDigits(amount)} soʻm`;
const service = (id) => state.config.services.find((s) => s.id === id);
const stepsFor = (id) => STEPS[id] ?? STEPS.document;
const premiumTemplate = (id) => state.config.premium.find((t) => t.id === id);
const sizeOptions = (s, tier) => (tier === "premium" && s.premiumOptions ? s.premiumOptions : s.options);

function haptic(type = "light") {
  try {
    if (type === "success" || type === "error") tg?.HapticFeedback?.notificationOccurred(type);
    else if (type === "select") tg?.HapticFeedback?.selectionChanged();
    else tg?.HapticFeedback?.impactOccurred(type);
  } catch {}
}

function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), 2400);
}

async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(inTelegram ? { Authorization: `tma ${tg.initData}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Internet aloqasi yoʻq. Ulanishni tekshirib, qayta urinib koʻring.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Xatolik yuz berdi. Birozdan soʻng qayta urinib koʻring.");
    error.code = data.code;
    error.status = response.status;
    throw error;
  }
  return data;
}

// Telegram MainButton (brauzerda — oddiy tugma)
const mainButton = {
  handler: null,
  show(text, handler) {
    this.handler = handler;
    $("#view").classList.add("with-main-button");
    if (inTelegram) {
      tg.MainButton.setParams({ text, is_visible: true, is_active: true });
    } else {
      const button = $("#fallback-main");
      button.textContent = text;
      button.hidden = false;
      button.disabled = false;
    }
  },
  hide() {
    this.handler = null;
    $("#view").classList.remove("with-main-button");
    if (inTelegram) tg.MainButton.hide();
    else $("#fallback-main").hidden = true;
  },
  loading(on) {
    if (inTelegram) {
      if (on) tg.MainButton.showProgress(false);
      else tg.MainButton.hideProgress();
      tg.MainButton.setParams({ is_active: !on });
    } else {
      $("#fallback-main").disabled = on;
    }
  },
};

// ---------- Navigatsiya ----------

function go(view, params = {}) {
  clearInterval(state.pollTimer);
  state.view = view;
  state.formError = "";
  state.cardRequested = false;
  Object.assign(state, params);
  mainButton.hide();
  const isTab = ["home", "orders", "balance"].includes(view);
  $("#tabbar").hidden = !isTab;
  $$(".tab").forEach((tab) => {
    const active = tab.dataset.tab === view;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-current", active ? "page" : "false");
  });
  if (inTelegram) {
    if (isTab) tg.BackButton.hide();
    else tg.BackButton.show();
  }
  window.scrollTo(0, 0);
  render();
  if (view === "balance") {
    refreshTransactions()
      .then(() => state.view === "balance" && render())
      .catch(() => {});
  }
}

function goBack() {
  haptic();
  go(state.view === "order" ? "orders" : "home");
}

function render() {
  const views = { home: homeView, orders: ordersView, balance: balanceView, form: formView, order: orderView };
  $("#view").innerHTML = views[state.view]();
  bindView();
}

const refreshMe = async () => (state.me = await api("/me"));
const refreshOrders = async () => (state.orders = (await api("/orders")).orders);
const refreshTransactions = async () => (state.transactions = (await api("/transactions")).transactions);

// ---------- Umumiy bloklar ----------

function serviceRow(s) {
  const sizes = s.options.map((o) => o.size);
  const from = Math.min(...s.options.map((o) => o.price));
  const format = s.format === "pptx" ? "PowerPoint" : "Word";
  return `
    <button class="row" data-service="${s.id}">
      ${serviceTile(s.id)}
      <span class="row-main">
        <span class="row-title">${esc(s.title)}</span>
        <span class="row-sub">${format} · ${Math.min(...sizes)}–${Math.max(...sizes)} ${esc(s.unit)}</span>
      </span>
      <span class="row-meta num">${groupDigits(from)} dan</span>
      ${icon("chevron", "chevron")}
    </button>`;
}

function orderRow(order) {
  const s = service(order.service);
  const active = order.status === "processing" || order.status === "queued";
  const status = order.status === "processing" ? `${order.progress}%` : STATUS_LABEL[order.status];
  const date = new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return `
    <button class="row" data-order="${order.id}">
      ${serviceTile(order.service)}
      <span class="row-main">
        <span class="row-title">${esc(order.topic)}</span>
        <span class="row-sub">${esc(s?.title)} · ${order.size} ${esc(s?.unit)} · ${date}</span>
      </span>
      <span class="status-text ${order.status} num">${esc(status)}</span>
      ${active ? `<span class="live-bar"><i style="width:${Math.max(3, order.progress)}%"></i></span>` : ""}
    </button>`;
}

function skeletonView() {
  const row = `<div class="row"><span class="skeleton" style="width:40px;height:40px;border-radius:11px"></span>
    <span class="row-main"><span class="skeleton" style="width:46%;height:13px"></span><span class="skeleton" style="width:70%;height:11px;margin-top:7px"></span></span></div>`;
  return `
    <div class="top"><div style="flex:1"><span class="skeleton" style="display:block;width:55%;height:24px"></span>
    <span class="skeleton" style="display:block;width:75%;height:13px;margin-top:8px"></span></div></div>
    <div class="group-title"><span class="skeleton" style="display:block;width:80px;height:12px"></span></div>
    <div class="group">${row.repeat(5)}</div>`;
}

// ---------- Asosiy sahifa ----------

function premiumCarousel() {
  const premium = state.config.premium ?? [];
  if (!premium.length) return "";
  const from = Math.min(...service("taqdimot").premiumOptions.map((o) => o.price));
  return `
    <div class="showcase-head">
      <h2 class="group-title" style="margin:0">Premium shablonlar · animatsiyali</h2>
      <span class="sub num" style="margin:0; white-space:nowrap">${groupDigits(from)} soʻmdan</span>
    </div>
    <div class="showcase" role="list">
      ${premium
        .map(
          (t) => `<button class="shot" role="listitem" data-premium="${t.id}" aria-label="${esc(t.name)} shabloni bilan taqdimot">
            <img src="${t.preview}" alt="" decoding="async" />
            <span class="shot-label">${icon("sparkle")}${esc(t.name)}</span>
          </button>`,
        )
        .join("")}
    </div>`;
}

function homeView() {
  const { me, config } = state;
  const active = state.orders.filter((o) => o.status === "processing" || o.status === "queued");
  const recent = state.orders.filter((o) => !active.includes(o)).slice(0, 3);
  return `
    <header class="top">
      <div>
        <h1 class="title">Salom, ${esc(me.firstName || "talaba")}</h1>
        <p class="sub">Mavzuni yozing — tayyor fayl chatga keladi</p>
      </div>
      <button class="balance-chip num" data-go="balance" aria-label="Balans: ${som(me.balance)}. Toʻldirish">
        ${som(me.balance)}<span class="plus">${icon("plus")}</span>
      </button>
    </header>

    ${active.length ? `<h2 class="group-title">Tayyorlanmoqda</h2><div class="group">${active.map(orderRow).join("")}</div>` : ""}

    ${premiumCarousel()}

    <h2 class="group-title">Nima tayyorlaymiz?</h2>
    <div class="group">${config.services.map(serviceRow).join("")}</div>

    ${recent.length ? `<h2 class="group-title">Soʻnggi buyurtmalar</h2><div class="group">${recent.map(orderRow).join("")}</div>` : ""}

    ${
      config.referralBonus > 0
        ? `<div class="group" style="margin-top:22px">
            <button class="row" data-action="share">
              ${tile("gift", "#F08C00")}
              <span class="row-main">
                <span class="row-title">Doʻstlarni taklif qiling</span>
                <span class="row-sub">Har bir doʻstingiz uchun +${som(config.referralBonus)}</span>
              </span>
              ${icon("chevron", "chevron")}
            </button>
          </div>`
        : ""
    }`;
}

// ---------- Buyurtmalar ----------

function ordersView() {
  if (!state.orders.length) {
    return `
      <header class="top"><h1 class="title">Buyurtmalar</h1></header>
      <div class="group empty">
        ${tile("inbox", "var(--accent)")}
        <h2>Buyurtmalar shu yerda koʻrinadi</h2>
        <p>Xizmatni tanlang va mavzuni yozing. Fayl tayyor boʻlgach, uni shu yerdan yoki chatdan olasiz.</p>
        <button class="btn" data-go="home">Xizmatni tanlash</button>
      </div>`;
  }
  return `
    <header class="top"><h1 class="title">Buyurtmalar</h1></header>
    <div class="group">${state.orders.map(orderRow).join("")}</div>
    <p class="group-note">Fayllar chatga ham yuboriladi. Tayyorlanmagan buyurtma puli balansga avtomatik qaytadi.</p>`;
}

// ---------- Hisob ----------

function balanceView() {
  const { me, config } = state;
  const packs = config.starPacks
    .map(
      (p) => `
        <button class="row" data-pack="${p.id}">
          ${tile("star", "#F59F00")}
          <span class="row-main">
            <span class="row-title num">${p.stars} Stars</span>
            <span class="row-sub num">Balansga +${som(p.som)}</span>
          </span>
          ${p.bonus ? `<span class="badge num">+${p.bonus}%</span>` : ""}
          ${icon("chevron", "chevron")}
        </button>`,
    )
    .join("");

  let card = "";
  if (config.card) {
    const number = config.card.number.replace(/(\d{4})(?=\d)/g, "$1 ");
    const request = state.cardRequested
      ? `<div class="group-pad" style="padding-top:14px;border-top:1px solid var(--hairline)">
          <div class="alert ok" role="status" style="margin:0">Soʻrov yaratildi. Endi chatga oʻting va toʻlov chekining rasmini yuboring — admin tekshirgach, balans toʻldiriladi.</div>
          <div class="stack"><button class="btn" data-action="to-chat">Chatga oʻtish</button></div>
        </div>`
      : `<div class="field-row" style="border-top:1px solid var(--hairline)">
          <span>Summa</span>
          <input class="input num" id="card-amount" inputmode="numeric" autocomplete="off" placeholder="kamida ${groupDigits(config.card.min)}" />
        </div>
        <div class="amounts">
          ${[10000, 20000, 50000, 100000].map((a) => `<button class="num" data-amount="${a}">${groupDigits(a)}</button>`).join("")}
        </div>
        <ol class="how">
          <li>Kartaga pul oʻtkazing</li>
          <li>Summani kiritib, «Chek yuborish»ni bosing</li>
          <li>Chatga toʻlov chekining rasmini yuboring</li>
        </ol>
        <div class="group-pad"><div id="card-error"></div><button class="btn" data-action="card-topup">Chek yuborish</button></div>`;
    card = `
      <h2 class="group-title">Karta orqali</h2>
      <div class="group">
        <div class="row">
          ${tile("card", "#495057")}
          <span class="row-main">
            <span class="row-title card-number num">${esc(number)}</span>
            ${config.card.owner ? `<span class="row-sub">${esc(config.card.owner)}</span>` : ""}
          </span>
          <button class="btn plain" style="width:auto" data-copy="${esc(config.card.number)}" aria-label="Karta raqamidan nusxa olish">${icon("copy")}</button>
        </div>
        ${request}
      </div>`;
  }

  return `
    <header class="top balance-head">
      <div>
        <p class="sub" style="margin:0 0 2px">Balans</p>
        <h1 class="title num">${som(me.balance)}</h1>
      </div>
    </header>

    ${providerSection()}

    <h2 class="group-title">Telegram Stars</h2>
    <div class="group">${packs}</div>
    <p class="group-note">Toʻlov Telegram ichida, bir zumda. Katta paketlarda bonus koʻproq.</p>
    ${card}

    <h2 class="group-title">Promokod</h2>
    <div class="group">
      <div class="field-row">
        <span class="field-icon">${icon("tag")}</span>
        <input class="input" id="promo-code" autocomplete="off" autocapitalize="characters" maxlength="32" placeholder="Promokodni kiriting" />
        <button class="btn plain" style="width:auto" data-action="promo">Qoʻllash</button>
      </div>
    </div>
    <div id="promo-result"></div>

    ${historySection()}

    ${
      config.referralBonus > 0
        ? `<h2 class="group-title">Doʻstlarni taklif qilish</h2>
          <div class="group">
            <button class="row" data-action="share">
              ${tile("gift", "#F08C00")}
              <span class="row-main">
                <span class="row-title">Havolani ulashish</span>
                <span class="row-sub">Har bir doʻst uchun +${som(config.referralBonus)} · taklif qilganlar: ${me.referrals}</span>
              </span>
              ${icon("chevron", "chevron")}
            </button>
          </div>`
        : ""
    }
    ${config.support ? `<p class="group-note" style="text-align:center;margin-top:22px">Savollar boʻlsa: @${esc(config.support)}</p>` : ""}`;
}

function providerSection() {
  const provider = state.config.provider;
  if (!provider) return "";
  return `
    <h2 class="group-title">${esc(provider.name)} orqali</h2>
    <div class="group">
      <div class="row">
        ${tile("wallet", "#0E9F6E")}
        <span class="row-main">
          <span class="row-title">Uzcard · Humo · Visa</span>
          <span class="row-sub">Avtomatik, bir zumda balansga tushadi</span>
        </span>
      </div>
      <div class="amounts" style="border-top:1px solid var(--hairline); padding-top:12px">
        ${provider.packs.map((a) => `<button class="num" data-provider-amount="${a}">${groupDigits(a)}</button>`).join("")}
      </div>
      <div class="field-row" style="border-top:1px solid var(--hairline)">
        <span>Summa</span>
        <input class="input num" id="provider-amount" inputmode="numeric" autocomplete="off" placeholder="kamida ${groupDigits(provider.min)}" />
      </div>
      <div class="group-pad"><div id="provider-error"></div><button class="btn" data-action="provider-pay">Toʻlash</button></div>
    </div>`;
}

const TX_LABEL = {
  bonus: "Boshlangʻich bonus",
  referral: "Doʻst taklifi uchun bonus",
  promo: "Promokod",
  stars: "Telegram Stars",
  provider: "Karta orqali (avtomatik)",
  card: "Karta oʻtkazmasi",
  admin: "Admin tomonidan",
  order: "Buyurtma",
  refund: "Qaytarildi",
};

function historySection() {
  const list = state.transactions?.filter((t) => t.amount !== 0);
  if (!list?.length) return "";
  const rows = list
    .map((t) => {
      const income = t.amount > 0;
      const date = new Date(t.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      const title = t.kind === "order" ? `${service(t.note)?.title ?? "Buyurtma"}` : TX_LABEL[t.kind] ?? t.kind;
      return `<div class="row">
        <span class="tx-icon ${income ? "in" : "out"}">${icon(income ? "arrowDown" : "arrowUp")}</span>
        <span class="row-main"><span class="row-title">${esc(title)}</span><span class="row-sub num">${date}</span></span>
        <span class="tx-amount num ${income ? "in" : ""}">${income ? "+" : "−"}${groupDigits(Math.abs(t.amount))}</span>
      </div>`;
    })
    .join("");
  return `<h2 class="group-title">Toʻlovlar tarixi</h2><div class="group">${rows}</div>`;
}

// ---------- Buyurtma formasi ----------

function newForm(serviceId, presetTheme) {
  const s = service(serviceId);
  let last = {};
  try {
    last = JSON.parse(localStorage.getItem("lastForm") || "{}");
  } catch {}
  const theme = presetTheme ?? last.theme ?? state.config.premium?.[0]?.id ?? state.config.themes[0].id;
  const tier = premiumTemplate(theme) ? "premium" : "standard";
  return {
    service: serviceId,
    topic: "",
    subject: last.subject ?? "",
    size: s.defaultSize,
    lang: last.lang ?? "uz",
    tier,
    theme,
    extra: "",
    profile: { ...Object.fromEntries(PROFILE_FIELDS.map(([key]) => [key, ""])), ...state.me.profile },
  };
}

function profileSummary(profile) {
  return [profile.name, profile.group, profile.university].filter(Boolean).join(" · ");
}

function formView() {
  const f = state.form;
  const s = service(f.service);
  const summary = profileSummary(f.profile);
  return `
    <header class="form-head">
      ${serviceTile(s.id)}
      <div>
        <h1 class="title">${esc(s.title)}</h1>
        <p class="sub">${esc(s.description)}</p>
      </div>
    </header>

    <h2 class="group-title">Mavzu</h2>
    <div class="group">
      <div class="textarea-wrap">
        <textarea class="input" id="f-topic" rows="3" maxlength="300" aria-label="Mavzu"
          placeholder="Masalan: Raqamli iqtisodiyotning Oʻzbekistondagi rivojlanish istiqbollari">${esc(f.topic)}</textarea>
        <span class="counter num"><span id="topic-count">${f.topic.length}</span>/300</span>
      </div>
      <div class="hairline"></div>
      <input class="input" id="f-subject" maxlength="120" aria-label="Fan nomi" placeholder="Fan nomi (ixtiyoriy)" value="${esc(f.subject)}" />
    </div>

    <h2 class="group-title">Hajmi</h2>
    <div class="options" role="radiogroup" aria-label="Hajmi" data-pick="size">
      ${sizeOptions(s, f.tier)
        .map(
          (o) => `<button class="option" role="radio" aria-checked="${o.size === f.size}" data-value="${o.size}">
            <b class="num">${o.size} ${esc(s.unit)}</b><small class="num">${som(o.price)}</small></button>`,
        )
        .join("")}
    </div>

    <h2 class="group-title">Til</h2>
    <div class="segmented" role="radiogroup" aria-label="Til" data-pick="lang">
      ${state.config.languages
        .map((l) => `<button role="radio" aria-checked="${l.id === f.lang}" data-value="${l.id}">${esc(l.label)}</button>`)
        .join("")}
    </div>

    ${
      s.format === "pptx" ? designSection(f) : ""
    }

    <h2 class="group-title">Titul varaq</h2>
    <details class="group" id="f-profile"${summary ? "" : " open"}>
      <summary class="row">
        <span class="row-main">
          <span class="row-title">${summary ? esc(summary) : "Talaba va oliygoh maʼlumotlari"}</span>
          <span class="row-sub">${summary ? "Oʻzgartirish uchun bosing" : "Bir marta kiriting — keyin eslab qolinadi"}</span>
        </span>
        ${icon("chevron", "chevron")}
      </summary>
      ${PROFILE_FIELDS.map(
        ([key, label, placeholder]) => `<label class="field-row"><span>${label}</span>
          <input class="input" data-profile="${key}" maxlength="150" placeholder="${esc(placeholder)}" value="${esc(f.profile[key])}" /></label>`,
      ).join("")}
    </details>

    <h2 class="group-title">Qoʻshimcha talablar</h2>
    <div class="group">
      <textarea class="input" id="f-extra" rows="2" maxlength="500" aria-label="Qoʻshimcha talablar"
        placeholder="Ixtiyoriy. Masalan: koʻproq statistika va Oʻzbekiston misollari">${esc(f.extra)}</textarea>
    </div>

    <div class="form-footer">
      <span class="num">Balans: ${som(state.me.balance)}</span>
      <span>Narxi <b class="num" id="f-price"></b></span>
    </div>
    <div id="form-error">${state.formError ? `<div class="alert" role="alert">${esc(state.formError)}</div>` : ""}</div>`;
}

function formPrice() {
  const f = state.form;
  return sizeOptions(service(f.service), f.tier).find((o) => o.size === f.size)?.price ?? 0;
}

function designSection(f) {
  const premium = state.config.premium ?? [];
  const tiers = `
    <div class="segmented" role="radiogroup" aria-label="Dizayn turi" data-tier>
      <button role="radio" aria-checked="${f.tier === "premium"}" data-value="premium">${icon("sparkle", "seg-icon")}Premium · animatsiyali</button>
      <button role="radio" aria-checked="${f.tier === "standard"}" data-value="standard">Oddiy</button>
    </div>`;
  if (f.tier === "premium" && premium.length) {
    const selected = premiumTemplate(f.theme) ?? premium[0];
    return `
      <h2 class="group-title">Dizayn</h2>
      ${tiers}
      <div class="premium-grid" role="radiogroup" aria-label="Premium shablon" data-pick="theme">
        ${premium
          .map(
            (t) => `<button class="pcard" role="radio" aria-checked="${t.id === selected.id}" data-value="${t.id}">
              <img src="${t.preview}" alt="" decoding="async" />
              <span>${esc(t.name)}</span></button>`,
          )
          .join("")}
      </div>
      <p class="group-note">${esc(selected.description)}. Morph oʻtishlari va kirish animatsiyalari PowerPoint 2019 / 365 da ishlaydi.</p>
      <div class="stack" style="margin-top:8px">
        ${selected.demo ? `<button class="btn secondary" data-action="demo">${icon("sparkle")}Jonli namunani koʻrish</button>` : ""}
        <button class="btn plain" data-action="sample">${icon("download")}«${esc(selected.name)}» namunasini yuklab olish (.pptx)</button>
      </div>
      ${selected.demo ? `<p class="group-note">Jonli namuna — shu dizayn olingan veb-taqdimot. Sizga tayyor fayl PowerPoint (.pptx) koʻrinishida keladi.</p>` : ""}`;
  }
  return `
    <h2 class="group-title">Dizayn</h2>
    ${tiers}
    <div class="themes" role="radiogroup" aria-label="Dizayn" data-pick="theme" style="margin-top:10px">
      ${state.config.themes
        .map(
          (t) => `<button class="theme" role="radio" aria-checked="${t.id === f.theme}" data-value="${t.id}">
            <span class="slide" style="--dark:#${t.dark};--acc:#${t.accent}">
              <i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="t1"></i><i class="t2"></i><i class="t3"></i>
            </span>
            <small>${esc(t.name)}</small></button>`,
        )
        .join("")}
    </div>`;
}

function updateFormButton() {
  const price = formPrice();
  $("#f-price").textContent = som(price);
  if (state.me.balance < price) {
    mainButton.show(`Balansni toʻldirish · ${som(price - state.me.balance)} yetmaydi`, () => go("balance"));
  } else {
    mainButton.show(`Buyurtma berish · ${som(price)}`, submitOrder);
  }
}

function showFormError(message) {
  state.formError = message;
  const box = $("#form-error");
  if (!box) return;
  box.innerHTML = message ? `<div class="alert" role="alert">${esc(message)}</div>` : "";
  if (message) box.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function submitOrder() {
  const f = state.form;
  if (f.topic.trim().length < 3) {
    haptic("error");
    showFormError("Mavzuni yozing — kamida 3 ta belgi.");
    $("#f-topic")?.focus();
    return;
  }
  showFormError("");
  mainButton.loading(true);
  try {
    const { order } = await api("/orders", { method: "POST", body: f });
    try {
      localStorage.setItem("lastForm", JSON.stringify({ lang: f.lang, theme: f.theme, subject: f.subject }));
    } catch {}
    haptic("success");
    state.me.balance -= order.price;
    state.me.profile = f.profile;
    state.orders.unshift(order);
    mainButton.loading(false);
    go("order", { orderId: order.id });
  } catch (error) {
    haptic("error");
    mainButton.loading(false);
    if (error.code === "insufficient_funds") await refreshMe().catch(() => {});
    if (state.view === "form") {
      updateFormButton();
      showFormError(error.message);
      if (error.code === "subscribe_required" && state.config.requiredChannel) {
        const box = $("#form-error");
        box.insertAdjacentHTML(
          "beforeend",
          `<div class="stack"><button class="btn" data-action="subscribe">Kanalga obuna boʻlish</button><button class="btn secondary" data-action="recheck">Obuna boʻldim — davom etish</button></div>`,
        );
        $("[data-action=subscribe]", box).addEventListener("click", () => {
          const url = `https://t.me/${state.config.requiredChannel.replace(/^@/, "")}`;
          if (inTelegram) tg.openTelegramLink(url);
          else window.open(url, "_blank");
        });
        $("[data-action=recheck]", box).addEventListener("click", submitOrder);
      }
    }
  }
}

// ---------- Buyurtma holati ----------

const currentOrder = () => state.orders.find((o) => o.id === state.orderId);

/** "Yozilayotgan sahifa": progress bo'yicha qatorlar to'lib boradi. */
function progressSheet(order) {
  const ink = SERVICE_TILE[order.service] ?? "var(--accent)";
  const done = order.status === "done";
  const failed = order.status === "failed";
  const progress = done ? 100 : order.progress;
  const seal = done ? `<span class="seal">${icon("check")}</span>` : "";

  if (order.service === "taqdimot") {
    const total = 9;
    const filled = Math.floor((progress / 100) * total);
    const slides = Array.from({ length: total }, (_, i) => {
      const cls = i < filled ? "filled" : i === filled && !done && !failed ? "writing" : "";
      return `<span class="mini-slide ${cls}"></span>`;
    }).join("");
    return `<div class="sheet deck${failed ? " failed" : ""}" style="--ink:${ink}" aria-hidden="true">${slides}${seal}</div>`;
  }

  const total = 13;
  const widths = [100, 96, 100, 88, 100, 62, 100, 94, 100, 100, 79, 100, 55];
  const exact = (progress / 100) * total;
  const lines = Array.from({ length: total }, (_, i) => {
    const fill = Math.max(0, Math.min(1, exact - i));
    const writing = !done && !failed && i === Math.floor(exact);
    return `<span class="line${writing ? " writing" : ""}" style="width:${widths[i]}%"><i style="width:${writing ? 100 : fill * 100}%"></i></span>`;
  }).join("");
  return `<div class="sheet page${failed ? " failed" : ""}" style="--ink:${ink}" aria-hidden="true">
    <span class="line head"><i style="width:${progress > 4 ? 100 : 0}%"></i></span>${lines}${seal}</div>`;
}

function stepList(order) {
  const steps = stepsFor(order.service);
  const progress = order.status === "done" ? 100 : order.progress;
  let currentFound = false;
  return `<ol class="steps">${steps
    .map(([label, until]) => {
      const done = progress >= until;
      const current = !done && !currentFound && order.status !== "failed";
      if (current) currentFound = true;
      const detail = current && /\((\d+\/\d+)\)/.exec(order.stage ?? "")?.[1];
      return `<li class="${done ? "done" : current ? "current" : ""}">
        <span class="dot">${done ? icon("check") : ""}</span>${esc(label)}${detail ? ` <span class="num" style="color:var(--muted);font-weight:400">· ${detail}</span>` : ""}</li>`;
    })
    .join("")}</ol>`;
}

function orderView() {
  const order = currentOrder();
  if (!order) return skeletonView();
  const s = service(order.service);
  const lang = state.config.languages.find((l) => l.id === order.lang)?.label ?? order.lang;
  const result = order.stage?.includes("·") ? order.stage.split("·")[1].trim() : "";

  let head;
  let actions = "";
  if (order.status === "done") {
    head = `<h1 class="title">Tayyor</h1><p class="sub">Fayl chatga yuborildi${result ? ` · ${esc(result)}` : ""}</p>`;
    actions = `
      <div class="stack">
        <button class="btn" data-action="download">${icon("download")}Yuklab olish</button>
        <button class="btn secondary" data-action="resend">${icon("send")}Chatga qayta yuborish</button>
      </div>`;
  } else if (order.status === "failed") {
    head = `<h1 class="title">Tayyorlab boʻlmadi</h1><p class="sub">${order.price ? `${som(order.price)} balansingizga qaytarildi. ` : ""}Qayta urinib koʻring — odatda ikkinchi urinish muvaffaqiyatli boʻladi.</p>`;
    actions = `<div class="stack"><button class="btn" data-action="retry">${icon("retry")}Qayta urinish</button></div>`;
  } else {
    const waiting = order.status === "queued";
    head = `<h1 class="title">${waiting ? "Navbatda" : "Tayyorlanmoqda"}</h1>
      <p class="sub">${waiting && order.queuePosition ? `Navbatdagi oʻrningiz: ${order.queuePosition}. ` : ""}Odatda ${DURATION[order.service] ?? "bir necha daqiqa"}. Ilovani yopsangiz ham fayl chatga keladi.</p>`;
  }

  return `
    <div class="group progress-stage">
      ${progressSheet(order)}
      ${head}
      ${order.status === "failed" ? "" : stepList(order)}
      ${actions}
    </div>

    <h2 class="group-title">Buyurtma #${order.id}</h2>
    <div class="group">
      <div class="row-static"><span>Mavzu</span><span>${esc(order.topic)}</span></div>
      <div class="row-static"><span>Xizmat</span><span>${esc(s?.title)} · ${order.size} ${esc(s?.unit)}</span></div>
      <div class="row-static"><span>Til</span><span>${esc(lang)}</span></div>
      ${
        order.theme && order.service === "taqdimot"
          ? `<div class="row-static"><span>Dizayn</span><span>${
              premiumTemplate(order.theme) ? `${esc(premiumTemplate(order.theme).name)} · premium` : esc(state.config.themes.find((t) => t.id === order.theme)?.name ?? order.theme)
            }</span></div>`
          : ""
      }
      <div class="row-static"><span>Narxi</span><span class="num">${som(order.price)}</span></div>
    </div>
    ${order.status === "done" ? `<div class="stack"><button class="btn plain" data-go="home">Yangi buyurtma berish</button></div>` : ""}`;
}

function startPolling() {
  clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    if (state.view !== "order") return clearInterval(state.pollTimer);
    try {
      const { order } = await api(`/orders/${state.orderId}`);
      const index = state.orders.findIndex((o) => o.id === order.id);
      const previous = state.orders[index];
      if (index >= 0) state.orders[index] = order;
      else state.orders.unshift(order);
      if (order.status === "done" || order.status === "failed") {
        clearInterval(state.pollTimer);
        haptic(order.status === "done" ? "success" : "error");
        if (order.status === "failed") refreshMe().catch(() => {});
        render();
      } else if (!previous || previous.progress !== order.progress || previous.stage !== order.stage || previous.status !== order.status) {
        render();
      }
    } catch {}
  }, 2500);
}

function downloadUrl(url, fileName) {
  if (inTelegram && tg.isVersionAtLeast?.("8.0") && tg.downloadFile) {
    tg.downloadFile({ url, file_name: fileName });
  } else if (inTelegram) {
    tg.openLink(url);
  } else {
    window.location.href = url;
  }
}

function downloadOrder(order) {
  if (order.downloadUrl) downloadUrl(order.downloadUrl, order.fileName);
}

// ---------- Hodisalar ----------

async function copyText(text, message = "Nusxa olindi") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  haptic();
  toast(message);
}

function shareReferral() {
  haptic();
  const text = "Referat, taqdimot va kurs ishlarini bir necha daqiqada tayyorlab beradigan bot";
  const url = `https://t.me/share/url?url=${encodeURIComponent(state.me.referralLink)}&text=${encodeURIComponent(text)}`;
  if (inTelegram) tg.openTelegramLink(url);
  else copyText(state.me.referralLink, "Havoladan nusxa olindi");
}

async function buyStars(packId, button) {
  haptic();
  button.disabled = true;
  try {
    const { link } = await api("/topup/stars", { method: "POST", body: { pack: packId } });
    if (!inTelegram) return toast("Stars bilan toʻlov faqat Telegram ichida ishlaydi");
    tg.openInvoice(link, (status) => {
      if (status !== "paid") return;
      haptic("success");
      toast("Toʻlov qabul qilindi");
      // Balans bot to'lovni qayd etgandan keyin yangilanadi.
      setTimeout(async () => {
        await refreshMe().catch(() => {});
        if (state.view === "balance") render();
      }, 1500);
    });
  } catch (error) {
    toast(error.message);
  } finally {
    button.disabled = false;
  }
}

async function providerPay(button) {
  const box = $("#provider-error");
  const amount = Number(String($("#provider-amount").value).replace(/\D/g, ""));
  const min = state.config.provider.min;
  if (!amount || amount < min) {
    haptic("error");
    box.innerHTML = `<div class="alert" role="alert" style="margin:0 0 12px">Summani tanlang yoki kiriting — kamida ${som(min)}.</div>`;
    return;
  }
  box.innerHTML = "";
  button.disabled = true;
  try {
    const { link } = await api("/topup/provider", { method: "POST", body: { amount } });
    if (!inTelegram) return toast("Toʻlov faqat Telegram ichida ishlaydi");
    tg.openInvoice(link, (status) => {
      if (status !== "paid") return;
      haptic("success");
      toast("Toʻlov qabul qilindi");
      setTimeout(async () => {
        await Promise.all([refreshMe(), refreshTransactions()]).catch(() => {});
        if (state.view === "balance") render();
      }, 1500);
    });
  } catch (error) {
    box.innerHTML = `<div class="alert" role="alert" style="margin:0 0 12px">${esc(error.message)}</div>`;
  } finally {
    button.disabled = false;
  }
}

async function applyPromo(button) {
  const input = $("#promo-code");
  const box = $("#promo-result");
  const code = input.value.trim();
  if (code.length < 3) {
    haptic("error");
    box.innerHTML = `<div class="alert" role="alert">Promokodni kiriting.</div>`;
    return;
  }
  button.disabled = true;
  try {
    const { amount, balance } = await api("/promo", { method: "POST", body: { code } });
    haptic("success");
    state.me.balance = balance;
    await refreshTransactions().catch(() => {});
    render();
    $("#promo-result").innerHTML = `<div class="alert ok" role="status">Promokod qabul qilindi: balansga +${som(amount)} qoʻshildi.</div>`;
  } catch (error) {
    haptic("error");
    box.innerHTML = `<div class="alert" role="alert">${esc(error.message)}</div>`;
    button.disabled = false;
  }
}

async function cardTopup(button) {
  const errorBox = $("#card-error");
  const amount = Number(String($("#card-amount").value).replace(/\D/g, ""));
  if (!amount || amount < state.config.card.min) {
    haptic("error");
    errorBox.innerHTML = `<div class="alert" role="alert" style="margin:0 0 12px">Eng kam summa — ${som(state.config.card.min)}.</div>`;
    return;
  }
  button.disabled = true;
  try {
    await api("/topup/card", { method: "POST", body: { amount } });
    haptic("success");
    state.cardRequested = true;
    render();
  } catch (error) {
    errorBox.innerHTML = `<div class="alert" role="alert" style="margin:0 0 12px">${esc(error.message)}</div>`;
    button.disabled = false;
  }
}

function bindView() {
  const view = $("#view");

  $$("[data-go]", view).forEach((el) => el.addEventListener("click", () => (haptic(), go(el.dataset.go))));
  $$("[data-service]", view).forEach((el) =>
    el.addEventListener("click", () => {
      haptic();
      go("form", { form: newForm(el.dataset.service) });
    }),
  );
  $$("[data-premium]", view).forEach((el) =>
    el.addEventListener("click", () => {
      haptic();
      go("form", { form: newForm("taqdimot", el.dataset.premium) });
    }),
  );
  $$("[data-order]", view).forEach((el) =>
    el.addEventListener("click", () => {
      haptic();
      go("order", { orderId: Number(el.dataset.order) });
    }),
  );
  $$("[data-action=share]", view).forEach((el) => el.addEventListener("click", shareReferral));
  $$("[data-copy]", view).forEach((el) => el.addEventListener("click", () => copyText(el.dataset.copy, "Karta raqamidan nusxa olindi")));
  $$("[data-pack]", view).forEach((el) => el.addEventListener("click", () => buyStars(el.dataset.pack, el)));
  $$("[data-amount]", view).forEach((el) =>
    el.addEventListener("click", () => {
      haptic("select");
      $("#card-amount").value = groupDigits(Number(el.dataset.amount));
    }),
  );
  $("#card-amount", view)?.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = digits ? groupDigits(Number(digits)) : "";
  });
  $("[data-action=card-topup]", view)?.addEventListener("click", (e) => cardTopup(e.currentTarget));
  $$("[data-provider-amount]", view).forEach((el) =>
    el.addEventListener("click", () => {
      haptic("select");
      $("#provider-amount").value = groupDigits(Number(el.dataset.providerAmount));
    }),
  );
  $("#provider-amount", view)?.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = digits ? groupDigits(Number(digits)) : "";
  });
  $("[data-action=provider-pay]", view)?.addEventListener("click", (e) => providerPay(e.currentTarget));
  $("[data-action=promo]", view)?.addEventListener("click", (e) => applyPromo(e.currentTarget));
  $("#promo-code", view)?.addEventListener("keydown", (e) => e.key === "Enter" && applyPromo($("[data-action=promo]")));
  $("[data-action=to-chat]", view)?.addEventListener("click", () => (inTelegram ? tg.close() : toast("Chatga oʻting")));

  if (state.view === "form") bindForm(view);
  if (state.view === "order") bindOrder(view);
}

function bindForm(view) {
  const f = state.form;
  const topic = $("#f-topic", view);
  topic.addEventListener("input", () => {
    f.topic = topic.value;
    $("#topic-count").textContent = topic.value.length;
    if (state.formError && f.topic.trim().length >= 3) showFormError("");
  });
  $("#f-subject", view).addEventListener("input", (e) => (f.subject = e.target.value));
  $("#f-extra", view).addEventListener("input", (e) => (f.extra = e.target.value));
  $$("[data-profile]", view).forEach((input) => input.addEventListener("input", () => (f.profile[input.dataset.profile] = input.value)));

  $("[data-tier]", view)?.querySelectorAll("[role=radio]").forEach((option) =>
    option.addEventListener("click", () => {
      const tier = option.dataset.value;
      if (tier === f.tier) return;
      haptic("select");
      f.tier = tier;
      const premium = state.config.premium ?? [];
      if (tier === "premium" && !premiumTemplate(f.theme)) f.theme = premium[0]?.id ?? f.theme;
      if (tier === "standard" && premiumTemplate(f.theme)) f.theme = state.config.themes[0].id;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }),
  );
  $("[data-action=demo]", view)?.addEventListener("click", () => {
    haptic();
    const template = premiumTemplate(f.theme);
    if (!template?.demo) return;
    if (inTelegram) tg.openLink(template.demo);
    else window.open(template.demo, "_blank");
  });
  $("[data-action=sample]", view)?.addEventListener("click", () => {
    haptic();
    const template = premiumTemplate(f.theme);
    if (template) downloadUrl(template.sample, `Namuna - ${template.name}.pptx`);
  });

  $$("[data-pick]", view).forEach((group) => {
    const key = group.dataset.pick;
    $$("[role=radio]", group).forEach((option) =>
      option.addEventListener("click", () => {
        haptic("select");
        f[key] = key === "size" ? Number(option.dataset.value) : option.dataset.value;
        $$("[role=radio]", group).forEach((other) => other.setAttribute("aria-checked", String(other === option)));
        if (key === "theme" && f.tier === "premium") {
          // Tavsif va namuna tugmasi tanlangan shablonga mos bo'lishi uchun
          const y = window.scrollY;
          render();
          window.scrollTo(0, y);
          return;
        }
        updateFormButton();
      }),
    );
  });
  updateFormButton();
}

function bindOrder(view) {
  const order = currentOrder();
  if (!order) {
    api(`/orders/${state.orderId}`)
      .then(({ order: loaded }) => {
        state.orders.unshift(loaded);
        render();
      })
      .catch(() => go("orders"));
    return;
  }
  if (order.status === "queued" || order.status === "processing") startPolling();
  $("[data-action=download]", view)?.addEventListener("click", async () => {
    haptic();
    // Havola muddatli, shuning uchun yangisini olamiz.
    const { order: fresh } = await api(`/orders/${order.id}`).catch(() => ({ order }));
    downloadOrder(fresh);
  });
  $("[data-action=resend]", view)?.addEventListener("click", async (e) => {
    const button = e.currentTarget;
    button.disabled = true;
    try {
      await api(`/orders/${order.id}/resend`, { method: "POST" });
      haptic("success");
      toast("Fayl chatga yuborildi");
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  $("[data-action=retry]", view)?.addEventListener("click", () => {
    haptic();
    const form = newForm(order.service);
    Object.assign(form, { topic: order.topic, size: order.size, lang: order.lang });
    go("form", { form });
  });
}

// ---------- Ishga tushirish ----------

async function init() {
  $("#view").innerHTML = skeletonView();
  if (inTelegram) {
    document.documentElement.classList.add("tg");
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor("secondary_bg_color");
      tg.setBackgroundColor("secondary_bg_color");
      tg.disableVerticalSwipes?.();
    } catch {}
    tg.MainButton.onClick(() => mainButton.handler?.());
    tg.BackButton.onClick(goBack);
  }
  $("#fallback-main").addEventListener("click", () => mainButton.handler?.());
  $$(".tab").forEach((tab) =>
    tab.addEventListener("click", async () => {
      haptic("select");
      go(tab.dataset.tab);
      const refresh = tab.dataset.tab === "orders" ? refreshOrders : tab.dataset.tab === "balance" ? refreshMe : null;
      if (refresh) {
        await refresh().catch(() => {});
        if (state.view === tab.dataset.tab) render();
      }
    }),
  );

  try {
    const [config, me, orders] = await Promise.all([api("/config"), api("/me"), api("/orders")]);
    state.config = config;
    state.me = me;
    state.orders = orders.orders;
  } catch (error) {
    $("#view").innerHTML = `
      <div class="group empty" style="margin-top:24px">
        ${tile("lock", "var(--accent)")}
        <h2>Ilovani ochib boʻlmadi</h2>
        <p>${esc(error.message)}</p>
        <button class="btn" id="reload">Qayta urinish</button>
      </div>`;
    $("#reload").addEventListener("click", () => location.reload());
    return;
  }

  // Havolalar: #balance, #orders, #service=taqdimot, #order=12
  const start = location.hash.replace("#", "");
  const link = new URLSearchParams(start);
  const serviceId = link.get("service");
  const orderId = Number(link.get("order"));
  if (serviceId && service(serviceId)) go("form", { form: newForm(serviceId, link.get("theme") || undefined) });
  else if (orderId) go("order", { orderId });
  else go(["orders", "balance"].includes(start) ? start : "home");
}

init();
