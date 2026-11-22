import type { Food } from "../config/foods";

export function foodVerb(food: Food): string {
  // "lahmacun" → "Lahmacuncuları"; Turkish vowel harmony for the -cı/-ci/-cu/-cü suffix
  const n = food.name.toLocaleLowerCase("tr");
  const last = [...n].reverse().find((c) => "aıoueiöü".includes(c)) ?? "a";
  const hard = /[çfhkpsşt]$/.test(n); // consonant hardening: kebap → kebapçı
  const suf = (hard ? "ç" : "c") + { a: "ı", ı: "ı", o: "u", u: "u", e: "i", i: "i", ö: "ü", ü: "ü" }[last as "a"];
  const base = n + suf;
  return base.charAt(0).toLocaleUpperCase("tr") + base.slice(1) + (/[ıu]$/.test(suf) ? "ları" : "leri");
}
