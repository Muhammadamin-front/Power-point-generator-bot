// Oddiy xotiradagi tezlik cheklovchi (sliding window). Jarayon qayta ishga tushsa, hisoblagichlar tozalanadi.

export class RateLimitError extends Error {
  constructor(retryAfter, message) {
    super(message ?? `Juda koʻp soʻrov. ${retryAfter} soniyadan soʻng qayta urinib koʻring.`);
    this.retryAfter = retryAfter;
  }
}

export function createLimiter({ max, windowMs }) {
  const hits = new Map(); // kalit -> urinishlar vaqti (ms)

  const recent = (key, t) => {
    const list = (hits.get(key) ?? []).filter((time) => t - time < windowMs);
    if (list.length) hits.set(key, list);
    else hits.delete(key);
    return list;
  };

  setInterval(() => {
    const t = Date.now();
    for (const key of [...hits.keys()]) recent(key, t);
  }, Math.max(windowMs, 60_000)).unref();

  return {
    /** Limitga yetgan bo'lsa, qancha soniyadan keyin ruxsat berilishi; aks holda 0. Hisobga olmaydi. */
    retryAfter(key) {
      const t = Date.now();
      const list = recent(key, t);
      return list.length >= max ? Math.max(1, Math.ceil((list[0] + windowMs - t) / 1000)) : 0;
    },
    /** Urinishni hisobga qo'shadi. */
    hit(key) {
      const t = Date.now();
      hits.set(key, [...recent(key, t), t]);
    },
    /** Limitni tekshiradi va urinishni hisobga qo'shadi; limitga yetgan bo'lsa RateLimitError tashlaydi. */
    consume(key, message) {
      const wait = this.retryAfter(key);
      if (wait) throw new RateLimitError(wait, message);
      this.hit(key);
    },
  };
}

const minutes = (seconds) => Math.ceil(seconds / 60);

export const limits = {
  // Mini App'ning barcha so'rovlari (buyurtma holati har 2.5 soniyada so'raladi)
  api: createLimiter({ max: 240, windowMs: 60_000 }),
  // Buyurtma berish va to'lov havolalarini yaratish
  orders: createLimiter({ max: 6, windowMs: 60_000 }),
  topups: createLimiter({ max: 10, windowMs: 10 * 60_000 }),
  resend: createLimiter({ max: 5, windowMs: 60_000 }),
  // Faqat xato urinishlar hisoblanadi
  promoFails: createLimiter({ max: 5, windowMs: 15 * 60_000 }),
  // Botning "tushunmadim" javoblari
  hints: createLimiter({ max: 6, windowMs: 60_000 }),
};

/**
 * Promokodni tekshirish/qo'llash funksiyasini xato urinishlar bo'yicha cheklaydi:
 * 15 daqiqada 5 ta xato urinishdan keyin shu foydalanuvchi uchun vaqtincha bloklanadi.
 */
export function guardPromo(userId, fn) {
  const key = `promo:${userId}`;
  const wait = limits.promoFails.retryAfter(key);
  if (wait) {
    throw new RateLimitError(wait, `Juda koʻp xato urinish. ${minutes(wait)} daqiqadan soʻng qayta urinib koʻring.`);
  }
  try {
    return fn();
  } catch (error) {
    limits.promoFails.hit(key);
    throw error;
  }
}
