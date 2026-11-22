import { FOODS, type Food } from "../../config/foods";

const MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFC")
    .replace(/[çğıöşüâîû]/g, (ch) => MAP[ch])
    .replace(/i̇/g, "i")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const compact = (s: string) => normalizeTr(s).replace(/ /g, "");

/** Girdinin içerdiği en uzun anahtar kelimeye sahip yemeği döner. */
export function matchFood(input: string): Food | null {
  const c = compact(input);
  if (!c) return null;
  let best: Food | null = null;
  let bestLen = 0;
  for (const f of FOODS) {
    for (const k of f.keywords) {
      const kc = compact(k);
      if (kc.length > bestLen && c.includes(kc)) {
        best = f;
        bestLen = kc.length;
      }
    }
  }
  return best;
}

export function foodKeyForQuery(input: string): string {
  return matchFood(input)?.slug ?? `q:${normalizeTr(input)}`;
}
