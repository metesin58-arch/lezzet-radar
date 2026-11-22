import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseScraperOutput } from "../src/lib/scraper/parse";
import { upsertPlaces } from "../src/lib/repo/places";
import { markCovered } from "../src/lib/repo/coverage";
import { cellIdFor } from "../src/lib/geo/grid";
import { FOODS, FOOD_BY_SLUG } from "../src/config/foods";

export const KADIKOY = { latitude: 40.9905, longitude: 29.029 };
export const ANKARA = { latitude: 39.92, longitude: 32.85 };

export const fixture = () =>
  parseScraperOutput(readFileSync(join(__dirname, "../fixtures/lahmacun-kadikoy.jsonl"), "utf8")).places;

/** Kadıköy: lahmacun places from the fixture; every popular food marked covered (so no live jobs). */
export async function seedFixture() {
  await upsertPlaces(fixture(), "lahmacun", FOOD_BY_SLUG.lahmacun);
  const cell = cellIdFor(KADIKOY.latitude, KADIKOY.longitude);
  for (const f of FOODS) await markCovered(cell, f.slug, f.slug === "lahmacun" ? 16 : 0);
}
