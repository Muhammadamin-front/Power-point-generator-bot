import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";

fs.mkdirSync(config.dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(config.dataDir, "bot.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY,
    username    TEXT,
    first_name  TEXT,
    balance     INTEGER NOT NULL DEFAULT 0,
    referred_by INTEGER,
    profile     TEXT NOT NULL DEFAULT '{}',
    is_blocked  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    service    TEXT NOT NULL,
    topic      TEXT NOT NULL,
    params     TEXT NOT NULL,
    price      INTEGER NOT NULL,
    status     TEXT NOT NULL,            -- queued | processing | done | failed
    progress   INTEGER NOT NULL DEFAULT 0,
    stage      TEXT,
    file_path  TEXT,
    file_name  TEXT,
    error      TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, id);
  CREATE INDEX IF NOT EXISTS orders_status ON orders(status);

  -- Balansdagi har bir o'zgarish shu yerda yoziladi. (kind, ref) takrorlanmaydi,
  -- shuning uchun bitta to'lov ikki marta hisoblanmaydi.
  CREATE TABLE IF NOT EXISTS transactions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    amount     INTEGER NOT NULL,
    kind       TEXT NOT NULL,            -- bonus | referral | promo | stars | provider | card | admin | order | refund
    ref        TEXT,
    note       TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS transactions_ref ON transactions(kind, ref) WHERE ref IS NOT NULL;

  -- Har bir AI so'rovining token sarfi (admin /usage uchun)
  CREATE TABLE IF NOT EXISTS ai_usage (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    provider      TEXT NOT NULL,
    model         TEXT NOT NULL,
    input_tokens  INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    ok            INTEGER NOT NULL DEFAULT 1,
    created_at    INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS ai_usage_time ON ai_usage(created_at);

  CREATE TABLE IF NOT EXISTS promo_codes (
    code       TEXT PRIMARY KEY,
    amount     INTEGER NOT NULL,
    max_uses   INTEGER NOT NULL,
    uses       INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    created_by INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_uses (
    code       TEXT NOT NULL,
    user_id    INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (code, user_id)
  );

  CREATE TABLE IF NOT EXISTS topups (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    amount        INTEGER NOT NULL,
    status        TEXT NOT NULL,         -- awaiting_receipt | pending | approved | rejected | cancelled
    photo_file_id TEXT,
    resolved_by   INTEGER,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
`);

export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const now = () => Date.now();

export function tx(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

// ---------- Foydalanuvchilar ----------

function hydrateUser(row) {
  if (!row) return null;
  return { ...row, profile: JSON.parse(row.profile || "{}") };
}

export function getUser(id) {
  return hydrateUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
}

/**
 * Foydalanuvchini yaratadi yoki ma'lumotlarini yangilaydi.
 * Yangi foydalanuvchiga boshlang'ich bonus, taklif qilganga referal bonus beriladi.
 */
export function ensureUser({ id, username, first_name }, referrerId = null) {
  return tx(() => {
    const inserted = db
      .prepare("INSERT OR IGNORE INTO users (id, username, first_name, created_at) VALUES (?, ?, ?, ?)")
      .run(id, username ?? null, first_name ?? null, now());

    if (inserted.changes === 0) {
      db.prepare("UPDATE users SET username = ?, first_name = ?, is_blocked = 0 WHERE id = ?").run(
        username ?? null,
        first_name ?? null,
        id,
      );
      return { user: getUser(id), isNew: false, referrerId: null };
    }

    const referrer = referrerId && referrerId !== id ? getUser(referrerId) : null;
    if (referrer) {
      db.prepare("UPDATE users SET referred_by = ? WHERE id = ?").run(referrer.id, id);
    }
    if (config.startBonus > 0) {
      applyBalance(id, config.startBonus, "bonus", `start:${id}`, "Boshlang'ich bonus");
    }
    if (referrer && config.referralBonus > 0) {
      applyBalance(referrer.id, config.referralBonus, "referral", `ref:${id}`, `Taklif qilingan: ${id}`);
    }
    return { user: getUser(id), isNew: true, referrerId: referrer?.id ?? null };
  });
}

export function saveProfile(userId, profile) {
  db.prepare("UPDATE users SET profile = ? WHERE id = ?").run(JSON.stringify(profile), userId);
}

export function setBlocked(userId, blocked) {
  db.prepare("UPDATE users SET is_blocked = ? WHERE id = ?").run(blocked ? 1 : 0, userId);
}

export function countReferrals(userId) {
  return db.prepare("SELECT COUNT(*) AS n FROM users WHERE referred_by = ?").get(userId).n;
}

export function activeUserIds() {
  return db
    .prepare("SELECT id FROM users WHERE is_blocked = 0")
    .all()
    .map((row) => row.id);
}

// ---------- Balans ----------

// Faqat tx() ichida chaqiriladi.
function applyBalance(userId, amount, kind, ref, note) {
  try {
    db.prepare("INSERT INTO transactions (user_id, amount, kind, ref, note, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      userId,
      amount,
      kind,
      ref ?? null,
      note ?? null,
      now(),
    );
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) throw new AppError("duplicate", "Bu operatsiya allaqachon bajarilgan");
    throw error;
  }
  const result = db
    .prepare("UPDATE users SET balance = balance + ? WHERE id = ? AND balance + ? >= 0")
    .run(amount, userId, amount);
  if (result.changes === 0) {
    throw new AppError(getUser(userId) ? "insufficient_funds" : "no_user", "Balans yetarli emas");
  }
}

/** Balansni o'zgartiradi va yangi balansni qaytaradi. */
export function addBalance(userId, amount, kind, ref = null, note = null) {
  return tx(() => {
    applyBalance(userId, amount, kind, ref, note);
    return getUser(userId).balance;
  });
}

// ---------- Buyurtmalar ----------

function hydrateOrder(row) {
  if (!row) return null;
  return { ...row, params: JSON.parse(row.params) };
}

export function getOrder(id) {
  return hydrateOrder(db.prepare("SELECT * FROM orders WHERE id = ?").get(id));
}

export function listOrders(userId, limit = 30) {
  return db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit)
    .map(hydrateOrder);
}

/** Buyurtma yaratadi va narxini balansdan yechadi (bitta tranzaksiyada). */
export function createOrder({ userId, service, topic, params, price }) {
  return tx(() => {
    const { n: active } = db
      .prepare("SELECT COUNT(*) AS n FROM orders WHERE user_id = ? AND status IN ('queued', 'processing')")
      .get(userId);
    if (active >= config.maxActiveOrders) {
      throw new AppError(
        "too_many_active",
        `Bir vaqtda ${config.maxActiveOrders} tadan ortiq buyurtma bajarilmaydi. Avvalgisi tugashini kuting.`,
      );
    }
    const t = now();
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO orders (user_id, service, topic, params, price, status, stage, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'queued', 'Navbatda', ?, ?)`,
      )
      .run(userId, service, topic, JSON.stringify(params), price, t, t);
    const id = Number(lastInsertRowid);
    applyBalance(userId, -price, "order", `order:${id}`, service);
    return getOrder(id);
  });
}

const ORDER_FIELDS = new Set(["status", "progress", "stage", "file_path", "file_name", "error"]);

export function updateOrder(id, patch) {
  const keys = Object.keys(patch).filter((key) => ORDER_FIELDS.has(key));
  if (!keys.length) return;
  const sets = keys.map((key) => `${key} = ?`).join(", ");
  db.prepare(`UPDATE orders SET ${sets}, updated_at = ? WHERE id = ?`).run(...keys.map((key) => patch[key]), now(), id);
}

/** Bajarilmagan buyurtma pulini qaytaradi. Ikki marta chaqirilsa ham bir marta qaytaradi. */
export function refundOrder(order) {
  try {
    return addBalance(order.user_id, order.price, "refund", `refund:${order.id}`, `Buyurtma #${order.id}`);
  } catch (error) {
    if (error.code === "duplicate") return getUser(order.user_id)?.balance ?? 0;
    throw error;
  }
}

/** Server qayta ishga tushganda tugallanmagan buyurtmalarni navbatga qaytaradi. */
export function recoverOrders() {
  db.prepare("UPDATE orders SET status = 'queued', stage = 'Navbatda', progress = 0 WHERE status = 'processing'").run();
  return db.prepare("SELECT * FROM orders WHERE status = 'queued' ORDER BY id").all().map(hydrateOrder);
}

export function listTransactions(userId, limit = 20) {
  return db
    .prepare("SELECT id, amount, kind, note, created_at FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, limit);
}

// ---------- Promokodlar ----------

const normalizeCode = (code) => String(code ?? "").trim().toUpperCase();

export function createPromo({ code, amount, maxUses = 100, days = null, adminId = null }) {
  const value = normalizeCode(code);
  if (!/^[A-Z0-9_-]{3,32}$/.test(value)) throw new AppError("bad_code", "Promokod 3–32 ta lotin harf yoki raqamdan iborat boʻlsin");
  db.prepare(
    "INSERT OR REPLACE INTO promo_codes (code, amount, max_uses, uses, expires_at, created_by, created_at) VALUES (?, ?, ?, COALESCE((SELECT uses FROM promo_codes WHERE code = ?), 0), ?, ?, ?)",
  ).run(value, amount, maxUses, value, days ? now() + days * 24 * 60 * 60 * 1000 : null, adminId, now());
  return db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(value);
}

export function listPromos(limit = 20) {
  return db.prepare("SELECT * FROM promo_codes ORDER BY created_at DESC LIMIT ?").all(limit);
}

/** Promokodni qo'llaydi. Har bir foydalanuvchi bitta kodni bir marta ishlatadi. */
export function redeemPromo(userId, code) {
  const value = normalizeCode(code);
  return tx(() => {
    const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ?").get(value);
    if (!promo) throw new AppError("promo_not_found", "Bunday promokod topilmadi");
    if (promo.expires_at && promo.expires_at < now()) throw new AppError("promo_expired", "Promokod muddati tugagan");
    if (promo.uses >= promo.max_uses) throw new AppError("promo_exhausted", "Promokod limiti tugagan");
    const used = db.prepare("INSERT OR IGNORE INTO promo_uses (code, user_id, created_at) VALUES (?, ?, ?)").run(value, userId, now());
    if (used.changes === 0) throw new AppError("promo_used", "Bu promokodni allaqachon ishlatgansiz");
    db.prepare("UPDATE promo_codes SET uses = uses + 1 WHERE code = ?").run(value);
    applyBalance(userId, promo.amount, "promo", `promo:${value}:${userId}`, `Promokod ${value}`);
    return { amount: promo.amount, balance: getUser(userId).balance };
  });
}

// ---------- Karta orqali to'lovlar ----------

export function getTopup(id) {
  return db.prepare("SELECT * FROM topups WHERE id = ?").get(id) ?? null;
}

export function createCardTopup(userId, amount) {
  return tx(() => {
    const t = now();
    db.prepare(
      "UPDATE topups SET status = 'cancelled', updated_at = ? WHERE user_id = ? AND status = 'awaiting_receipt'",
    ).run(t, userId);
    const { lastInsertRowid } = db
      .prepare(
        "INSERT INTO topups (user_id, amount, status, created_at, updated_at) VALUES (?, ?, 'awaiting_receipt', ?, ?)",
      )
      .run(userId, amount, t, t);
    return getTopup(Number(lastInsertRowid));
  });
}

export function getAwaitingTopup(userId) {
  const dayAgo = now() - 24 * 60 * 60 * 1000;
  return (
    db
      .prepare(
        "SELECT * FROM topups WHERE user_id = ? AND status = 'awaiting_receipt' AND created_at > ? ORDER BY id DESC LIMIT 1",
      )
      .get(userId, dayAgo) ?? null
  );
}

export function attachReceipt(topupId, photoFileId) {
  db.prepare("UPDATE topups SET status = 'pending', photo_file_id = ?, updated_at = ? WHERE id = ?").run(
    photoFileId,
    now(),
    topupId,
  );
  return getTopup(topupId);
}

/** Admin karta to'lovini tasdiqlaydi yoki rad etadi. Faqat 'pending' holatdagisi o'zgaradi. */
export function resolveTopup(topupId, approve, adminId) {
  return tx(() => {
    const result = db
      .prepare("UPDATE topups SET status = ?, resolved_by = ?, updated_at = ? WHERE id = ? AND status = 'pending'")
      .run(approve ? "approved" : "rejected", adminId, now(), topupId);
    if (result.changes === 0) return null;
    const topup = getTopup(topupId);
    if (approve) applyBalance(topup.user_id, topup.amount, "card", `topup:${topup.id}`, "Karta orqali");
    return { topup, balance: getUser(topup.user_id).balance };
  });
}

// ---------- AI sarfi ----------

export function recordUsage({ provider, model, input = 0, output = 0, ok = true }) {
  db.prepare("INSERT INTO ai_usage (provider, model, input_tokens, output_tokens, ok, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    provider, model, input, output, ok ? 1 : 0, now(),
  );
}

/** since (ms) dan beri: model bo'yicha so'rovlar soni, tokenlar va xatolar. */
export function usageSince(since = 0) {
  return db
    .prepare(
      `SELECT provider, model, COUNT(*) AS requests, SUM(1 - ok) AS failed,
              COALESCE(SUM(input_tokens), 0) AS input, COALESCE(SUM(output_tokens), 0) AS output
       FROM ai_usage WHERE created_at >= ? GROUP BY provider, model ORDER BY requests DESC`,
    )
    .all(since);
}

// ---------- Statistika ----------

export function stats() {
  const dayAgo = now() - 24 * 60 * 60 * 1000;
  const one = (sql, ...args) => Object.values(db.prepare(sql).get(...args))[0] ?? 0;
  return {
    users: one("SELECT COUNT(*) FROM users"),
    usersToday: one("SELECT COUNT(*) FROM users WHERE created_at > ?", dayAgo),
    blocked: one("SELECT COUNT(*) FROM users WHERE is_blocked = 1"),
    ordersDone: one("SELECT COUNT(*) FROM orders WHERE status = 'done'"),
    ordersFailed: one("SELECT COUNT(*) FROM orders WHERE status = 'failed'"),
    ordersActive: one("SELECT COUNT(*) FROM orders WHERE status IN ('queued', 'processing')"),
    ordersToday: one("SELECT COUNT(*) FROM orders WHERE created_at > ?", dayAgo),
    revenue: one("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE kind IN ('stars', 'provider', 'card')"),
    revenueToday: one(
      "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE kind IN ('stars', 'provider', 'card') AND created_at > ?",
      dayAgo,
    ),
    byService: db
      .prepare("SELECT service, COUNT(*) AS n FROM orders WHERE status = 'done' GROUP BY service ORDER BY n DESC")
      .all(),
  };
}
