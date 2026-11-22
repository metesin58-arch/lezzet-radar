import type { Food } from "../config/foods";
import { normalizeTr } from "./text/normalize";

export function isClosedPermanently(status: string): boolean {
  return /kapan|closed/i.test(status);
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
