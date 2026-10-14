import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { AIError } from "./errors.js";

// Kalit (ANTHROPIC_API_KEY) birinchi so'rovda o'qiladi, shuning uchun kalitsiz ham server ishga tushadi.
let client;
const getClient = () => (client ??= new Anthropic({ maxRetries: 4 }));

// Server tomonidagi `fallbacks: "default"` faqat shu modellarda ishlaydi: xavfsizlik filtri
// so'rovni rad etsa, API uni avtomatik ravishda boshqa modelda qayta bajaradi.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5", "claude-fable-5-1"]);

/** Claude'ga so'rov: { text, input, output } qaytaradi. jsonSchema berilsa javob shu sxemaga mos JSON. */
export async function generateClaude({ system, prompt, jsonSchema, maxTokens, effort = config.ai.effort, onUsage }) {
  const { model } = config.ai;
  const stream = getClient().beta.messages.stream({
    model,
    max_tokens: maxTokens,
    ...(FALLBACK_MODELS.has(model) && { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }),
    system,
    messages: [{ role: "user", content: prompt }],
    output_config: { effort, ...(jsonSchema && { format: { type: "json_schema", schema: jsonSchema } }) },
  });
  const message = await stream.finalMessage();
  onUsage({ model, input: message.usage.input_tokens, output: message.usage.output_tokens });

  if (message.stop_reason === "refusal") {
    throw new AIError(`Model so'rovni rad etdi (${message.stop_details?.category ?? "nomaʼlum sabab"})`);
  }
  if (message.stop_reason === "max_tokens") throw new AIError("Javob juda uzun bo'lib ketdi (max_tokens)");
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}
