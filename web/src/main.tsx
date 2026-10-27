import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { setDeck } from "./lib/deck";
import { applyTheme } from "./theme";
import type { Deck } from "./types";

/** Server mazmunni <script id="deck"> ichiga JSON qilib joylaydi. `npm run dev` da namunaviy mazmun ishlatiladi. */
async function load(): Promise<Deck> {
  const raw = document.getElementById("deck")?.textContent?.trim() ?? "";
  if (raw && raw !== "__DECK_JSON__") return JSON.parse(raw) as Deck;
  if (import.meta.env.DEV) return (await import("../samples/full.json")).default as unknown as Deck;
  throw new Error("Taqdimot mazmuni topilmadi");
}

load().then((deck) => {
  setDeck(deck);
  applyTheme(deck.theme.primary, deck.theme.accent);
  document.documentElement.lang = deck.lang === "uz_cyrl" ? "uz-Cyrl" : deck.lang;
  document.title = deck.cover.title;
  createRoot(document.getElementById("root")!).render(<App />);
});
