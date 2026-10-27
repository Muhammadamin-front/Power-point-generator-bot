import { STRINGS } from "../i18n";
import type { Deck } from "../types";

let deck: Deck;
export const setDeck = (value: Deck) => {
  deck = value;
};
export const useDeck = () => deck;
export const useT = () => STRINGS[deck.lang];
