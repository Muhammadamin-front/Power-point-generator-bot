import { z } from "zod";
import { config } from "../config.js";
import { recordUsage } from "../db.js";
import { generateClaude } from "./claude.js";
import { AIError } from "./errors.js";
import { generateGemini } from "./gemini.js";

export { AIError };

/** zod sxemasini JSON Schema'ga o'giradi (enum/const cheklovlari saqlanadi). */
function toJsonSchema(schema) {
  const { $schema, ...json } = z.toJSONSchema(schema);
  return json;
}

/**
 * Tanlangan AI'ga (AI_PROVIDER: gemini | claude) so'rov yuboradi. `schema` (zod) berilsa, javob shu
 * sxemaga mos JSON bo'ladi va tekshirilgan obyekt qaytariladi; aks holda oddiy matn qaytariladi.
 * Har bir so'rovning token sarfi bazaga yoziladi (admin: /usage).
 */
export async function generate({ system, prompt, schema, maxTokens = 32000, effort }) {
  const provider = config.ai.provider === "claude" ? "claude" : "gemini";
  const onUsage = (usage) => {
    try {
      recordUsage({ provider, ...usage });
    } catch (error) {
      console.warn("Sarfni yozib boʻlmadi:", error.message);
    }
    if (usage.ok !== false) console.log(`AI ${usage.model}: ${usage.input} kirish / ${usage.output} chiqish token`);
  };
  const run = provider === "claude" ? generateClaude : generateGemini;
  const text = await run({ system, prompt, jsonSchema: schema ? toJsonSchema(schema) : null, maxTokens, effort, onUsage });
  if (!schema) return text;

  let json;
  try {
    json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw new AIError("Model noto'g'ri JSON qaytardi");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new AIError(`Javob sxemaga mos emas: ${parsed.error.message.slice(0, 300)}`);
  return parsed.data;
}
