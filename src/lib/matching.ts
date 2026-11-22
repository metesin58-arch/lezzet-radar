import type { Food } from "../config/foods";
import { normalizeTr } from "./text/normalize";

// The status field sometimes holds Google's short summary ("…late-closing tavern"), so match the exact phrases only.
export const CLOSED_PATTERN_SQL = "(kalıcı|geçici) olarak kapa|permanently closed|temporarily closed";
const CLOSED_RE = new RegExp(CLOSED_PATTERN_SQL, "i");

export function isClosedPermanently(status: string): boolean {
  return CLOSED_RE.test(status.toLocaleLowerCase("tr"));
}

const NON_FOOD = /market|süpermarket|otel|benzin|eczane|banka|kuaför/i;

/** False only when every category is a non-food one. */
export function isFoodPlace(categories: string[]): boolean {
  if (!categories.length) return true;
  return !categories.every((c) => NON_FOOD.test(c));
}

export function nameMatchesFood(place: { title: string; categories?: string[] }, food: Food): boolean {
  const hay = normalizeTr([place.title, ...(place.categories ?? [])].join(" ")).replace(/ /g, "");
  return food.keywords.some((k) => hay.includes(normalizeTr(k).replace(/ /g, "")));
}
