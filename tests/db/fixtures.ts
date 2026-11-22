import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseScraperOutput } from "../../src/lib/scraper/parse";

export const FIXTURE_JSONL = readFileSync(join(__dirname, "../../fixtures/lahmacun-kadikoy.jsonl"), "utf8");
export const fixturePlaces = () => parseScraperOutput(FIXTURE_JSONL).places;
export const KADIKOY = { lat: 40.9905, lng: 29.029 };
