export type Food = {
  slug: string;
  name: string;
  emoji: string;
  /** Google Maps'te aranacak metin */
  query: string;
  /** normalizeTr + boşluksuz eşleşme kökleri */
  keywords: string[];
  popular: boolean;
};

export const FOODS: Food[] = [
  { slug: "cigkofte", name: "Çiğköfte", emoji: "🌯", query: "çiğ köfte", keywords: ["cigkofte"], popular: true },
  { slug: "lahmacun", name: "Lahmacun", emoji: "🫓", query: "lahmacun", keywords: ["lahmacun"], popular: true },
  { slug: "pide", name: "Pide", emoji: "🥖", query: "pide", keywords: ["pide"], popular: false },
  { slug: "doner", name: "Döner", emoji: "🥙", query: "döner", keywords: ["doner", "durum"], popular: true },
  { slug: "kebap", name: "Kebap", emoji: "🍢", query: "kebap", keywords: ["kebap", "kebab", "adana", "urfa", "ocakbasi"], popular: true },
  { slug: "iskender", name: "İskender", emoji: "🍖", query: "iskender", keywords: ["iskender"], popular: false },
  { slug: "kofte", name: "Köfte", emoji: "🧆", query: "köfteci", keywords: ["kofte"], popular: false },
  { slug: "hamburger", name: "Hamburger", emoji: "🍔", query: "hamburger", keywords: ["hamburger", "burger"], popular: true },
  { slug: "pizza", name: "Pizza", emoji: "🍕", query: "pizza", keywords: ["pizza", "pizzeria"], popular: true },
  { slug: "tantuni", name: "Tantuni", emoji: "🌮", query: "tantuni", keywords: ["tantuni"], popular: false },
  { slug: "kokorec", name: "Kokoreç", emoji: "🥪", query: "kokoreç", keywords: ["kokorec"], popular: false },
  { slug: "midye", name: "Midye", emoji: "🦪", query: "midye", keywords: ["midye"], popular: false },
  { slug: "balik", name: "Balık", emoji: "🐟", query: "balık restoranı", keywords: ["balik", "deniz urunleri", "meyhane"], popular: true },
  { slug: "manti", name: "Mantı", emoji: "🥟", query: "mantı", keywords: ["manti"], popular: false },
  { slug: "esnaf-lokantasi", name: "Esnaf Lokantası", emoji: "🍲", query: "esnaf lokantası", keywords: ["esnaf lokantasi", "ev yemek", "lokanta"], popular: false },
  { slug: "kahvalti", name: "Kahvaltı", emoji: "🍳", query: "kahvaltı", keywords: ["kahvalti", "serpme"], popular: false },
  { slug: "borek", name: "Börek", emoji: "🥐", query: "börek", keywords: ["borek"], popular: false },
  { slug: "sushi", name: "Sushi", emoji: "🍣", query: "sushi", keywords: ["sushi", "suşi"], popular: false },
  { slug: "tatli", name: "Tatlı", emoji: "🍰", query: "baklava tatlıcı", keywords: ["tatli", "baklava", "kunefe", "sutlac", "pastane"], popular: false },
  { slug: "kumpir", name: "Kumpir", emoji: "🥔", query: "kumpir", keywords: ["kumpir"], popular: false },
];

export const FOOD_BY_SLUG: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.slug, f]));
