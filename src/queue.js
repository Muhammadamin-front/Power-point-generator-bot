import { config } from "./config.js";
import { getOrder, recoverOrders, refundOrder, updateOrder } from "./db.js";
import { runOrder } from "./pipeline.js";

// Oddiy jarayon ichidagi navbat: bir vaqtda QUEUE_CONCURRENCY ta buyurtma bajariladi.
const waiting = [];
let running = 0;
let notifier = { done: async () => {}, failed: async () => {} };

export function setNotifier(value) {
  notifier = value;
}

export function enqueue(orderId) {
  if (!waiting.includes(orderId)) waiting.push(orderId);
  pump();
}

/** Navbatdagi o'rni (1 dan boshlab); bajarilayotgan bo'lsa 0. */
export function queuePosition(orderId) {
  return waiting.indexOf(orderId) + 1;
}

export function resumeQueue() {
  const orders = recoverOrders();
  for (const order of orders) enqueue(order.id);
  if (orders.length) console.log(`Navbatga qaytarildi: ${orders.length} ta buyurtma`);
}

function pump() {
  while (running < config.queueConcurrency && waiting.length) {
    const id = waiting.shift();
    running += 1;
    processOrder(id)
      .catch((error) => console.error(`Buyurtma #${id}: kutilmagan xato`, error))
      .finally(() => {
        running -= 1;
        pump();
      });
  }
}

async function processOrder(id) {
  const order = getOrder(id);
  if (!order || order.status !== "queued") return;
  updateOrder(id, { status: "processing", progress: 2, stage: "Boshlandi" });

  let result;
  try {
    result = await runOrder(order, (progress, stage) => updateOrder(id, { progress, stage }));
  } catch (error) {
    console.error(`Buyurtma #${id} bajarilmadi:`, error);
    updateOrder(id, { status: "failed", stage: "Xatolik", error: String(error?.message ?? error).slice(0, 500) });
    const balance = refundOrder(order);
    await notifier.failed(getOrder(id), balance).catch((e) => console.error("Xabar yuborilmadi:", e.message));
    return;
  }

  updateOrder(id, {
    status: "done",
    progress: 100,
    stage: result.summary ? `Tayyor · ${result.summary}` : "Tayyor",
    file_path: result.filePath,
    file_name: result.fileName,
  });
  await notifier.done(getOrder(id), result).catch((e) => console.error("Fayl yuborilmadi:", e.message));
}
