import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { AIError } from "./errors.js";

let client;
const getClient = () => (client ??= new GoogleGenAI({ apiKey: config.ai.geminiKey }));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini'ning JSON sxemasi "const" ni qo'llamasligi mumkin — bitta qiymatli enum'ga aylantiramiz.
function adaptSchema(node) {
  if (Array.isArray(node)) return node.map(adaptSchema);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "const") out.enum = [value];
    else out[key] = adaptSchema(value);
  }
  return out;
}

/** Gemini'ga so'rov: matn qaytaradi. Bepul tarifdagi 429 (limit) va 5xx xatolarida kutib qayta urinadi. */
export async function generateGemini({ system, prompt, jsonSchema, maxTokens, onUsage }) {
  if (!config.ai.geminiKey) throw new AIError("GEMINI_API_KEY koʻrsatilmagan");
  const models = [...new Set([config.ai.geminiModel, config.ai.geminiFallbackModel].filter(Boolean))];
  let model = models[0];
  const request = {
    contents: prompt,
    config: {
      systemInstruction: system,
      maxOutputTokens: Math.min(maxTokens, 65536),
      ...(jsonSchema && { responseMimeType: "application/json", responseJsonSchema: adaptSchema(jsonSchema) }),
    },
  };

  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await getClient().models.generateContent({ ...request, model });
      break;
    } catch (error) {
      const retryable = error?.status === 429 || error?.status >= 500;
      onUsage({ model, ok: false });
      if (!retryable || attempt >= 5) {
        if (error?.status === 429) throw new AIError("Gemini bepul limiti tugadi (429) — birozdan soʻng qayta urinib koʻring");
        throw error;
      }
      // Avval zaxira modelga o'tamiz, ikkalasi ham band bo'lsa kutamiz: 5s, 10s, 20s...
      model = models[(models.indexOf(model) + 1) % models.length];
      if (attempt >= models.length - 1) await sleep(5_000 * 2 ** (attempt - models.length + 1));
    }
  }

  const usage = response.usageMetadata ?? {};
  onUsage({ model, input: usage.promptTokenCount ?? 0, output: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0) });

  const finish = response.candidates?.[0]?.finishReason;
  if (finish === "MAX_TOKENS") throw new AIError("Javob juda uzun bo'lib ketdi (MAX_TOKENS)");
  if (["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(finish) || response.promptFeedback?.blockReason) {
    throw new AIError(`Model so'rovni rad etdi (${finish ?? response.promptFeedback?.blockReason})`);
  }
  const text = (response.text ?? "").trim();
  if (!text) throw new AIError("Gemini boʻsh javob qaytardi");
  return text;
}
