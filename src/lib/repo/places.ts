import type { Food } from "../../config/foods";
import { query, withTx } from "../db";
import { isFoodPlace, nameMatchesFood } from "../matching";
import type { RatingDist, ScrapedPlace, ScrapedReview } from "../scraper/types";
import { normalizeTr } from "../text/normalize";

export type TopReview = { author: string; rating: number; text: string };

export type NearbyRow = {
  placeId: string;
  title: string;
  category: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number;
  distanceM: number;
  thumbnail: string | null;
  priceRange: string | null;
  openHours: Record<string, string[]> | null;
  status: string;
  address: string | null;
  nameMatch: boolean;
  topReview: TopReview | null;
};

export type PlaceDetail = Omit<NearbyRow, "distanceM"> & {
  phone: string | null;
  website: string | null;
  link: string | null;
  reviewsPerRating: RatingDist | null;
  categories: string[];
  reviews: ScrapedReview[];
};

function nameMatchFor(p: ScrapedPlace, foodKey: string, food: Food | null): boolean {
  if (food) return nameMatchesFood(p, food);
  if (!foodKey.startsWith("q:")) return false;
  const hay = normalizeTr([p.title, ...p.categories].join(" "));
  return hay.includes(foodKey.slice(2));
}

/** Upserts places and their reviews and food links in one transaction. Returns the number written. */
export async function upsertPlaces(places: ScrapedPlace[], foodKey: string, food: Food | null): Promise<number> {
  return withTx(async (c) => {
    let n = 0;
    for (const p of places) {
      if (!isFoodPlace(p.categories)) continue;
      await query(
        `insert into places (place_id, cid, data_id, title, category, categories, address, district, phone, website,
            location, rating, review_count, reviews_per_rating, price_range, open_hours, thumbnail, link, status, raw, scraped_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, ST_SetSRID(ST_MakePoint($12,$11),4326)::geography,
            $13,$14,$15,$16,$17,$18,$19,$20,$21, now())
         on conflict (place_id) do update set
            cid=excluded.cid, data_id=excluded.data_id, title=excluded.title, category=excluded.category,
            categories=excluded.categories, address=excluded.address, district=excluded.district, phone=excluded.phone,
            website=excluded.website, location=excluded.location, rating=excluded.rating, review_count=excluded.review_count,
            reviews_per_rating=excluded.reviews_per_rating, price_range=excluded.price_range, open_hours=excluded.open_hours,
            thumbnail=coalesce(excluded.thumbnail, places.thumbnail), link=excluded.link, status=excluded.status,
            raw=excluded.raw, scraped_at=now()`,
        [
          p.placeId, p.cid, p.dataId, p.title, p.category, p.categories, p.address, p.district, p.phone, p.website,
          p.lat, p.lng, p.rating, p.reviewCount, p.reviewsPerRating ? JSON.stringify(p.reviewsPerRating) : null,
          p.priceRange, p.openHours ? JSON.stringify(p.openHours) : null, p.thumbnail, p.link, p.status, JSON.stringify(p.raw),
        ],
        c,
      );
      for (const r of p.reviews) {
        await query(
          `insert into reviews (place_id, author, author_photo, rating, text, relative_time, published_at, images)
           values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (place_id, author, text) do update set
             relative_time=excluded.relative_time, rating=excluded.rating`,
          [p.placeId, r.author, r.authorPhoto, r.rating, r.text, r.relativeTime, r.publishedAt, r.images],
          c,
        );
      }
      await query(
        `insert into place_foods (place_id, food_key, name_match) values ($1,$2,$3)
         on conflict (place_id, food_key) do update set name_match = excluded.name_match`,
        [p.placeId, foodKey, nameMatchFor(p, foodKey, food)],
        c,
      );
      n++;
    }
    return n;
  });
}

const PLACE_COLS = `p.place_id, p.title, p.category, ST_Y(p.location::geometry) lat, ST_X(p.location::geometry) lng,
  p.rating::float8 rating, p.review_count, p.thumbnail, p.price_range, p.open_hours, p.status, p.address,
  (select json_build_object('author', r.author, 'rating', r.rating, 'text', r.text) from reviews r
     where r.place_id = p.place_id and r.rating >= 4 and r.text <> '' order by length(r.text) desc limit 1) top_review`;

type Row = Record<string, unknown>;

function mapBase(r: Row): Omit<NearbyRow, "distanceM" | "nameMatch"> {
  return {
    placeId: r.place_id as string,
    title: r.title as string,
    category: (r.category as string) ?? null,
    lat: Number(r.lat),
    lng: Number(r.lng),
    rating: r.rating === null ? null : Number(r.rating),
    reviewCount: Number(r.review_count),
    thumbnail: (r.thumbnail as string) ?? null,
    priceRange: (r.price_range as string) ?? null,
    openHours: (r.open_hours as Record<string, string[]>) ?? null,
    status: (r.status as string) ?? "",
    address: (r.address as string) ?? null,
    topReview: (r.top_review as TopReview) ?? null,
  };
}

export async function findNearby(o: {
  lat: number;
  lng: number;
  radiusM: number;
  foodKey?: string;
  foodKeys?: string[];
  limit?: number;
}): Promise<NearbyRow[]> {
  const keys = o.foodKey ? [o.foodKey] : (o.foodKeys ?? []);
  const rows = await query<Row>(
    `select ${PLACE_COLS},
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography) distance_m,
        bool_or(pf.name_match) name_match
     from places p join place_foods pf on pf.place_id = p.place_id and pf.food_key = any($4)
     where ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography, $3)
       and p.status !~* '(kapan|closed)'
     group by p.place_id
     order by distance_m
     limit $5`,
    [o.lat, o.lng, o.radiusM, keys, o.limit ?? 60],
  );
  return rows.map((r) => ({ ...mapBase(r), distanceM: Number(r.distance_m), nameMatch: Boolean(r.name_match) }));
}

export async function getPlace(placeId: string): Promise<PlaceDetail | null> {
  const [r] = await query<Row>(
    `select ${PLACE_COLS}, p.phone, p.website, p.link, p.reviews_per_rating, p.categories,
        coalesce((select bool_or(name_match) from place_foods where place_id = p.place_id), false) name_match
     from places p where p.place_id = $1`,
    [placeId],
  );
  if (!r) return null;
  const reviews = await query<Row>(
    `select author, author_photo, rating, text, relative_time, published_at, images from reviews
     where place_id = $1 order by published_at desc nulls last, id`,
    [placeId],
  );
  return {
    ...mapBase(r),
    nameMatch: Boolean(r.name_match),
    phone: (r.phone as string) ?? null,
    website: (r.website as string) ?? null,
    link: (r.link as string) ?? null,
    reviewsPerRating: (r.reviews_per_rating as RatingDist) ?? null,
    categories: (r.categories as string[]) ?? [],
    reviews: reviews.map((x) => ({
      author: x.author as string,
      authorPhoto: (x.author_photo as string) ?? null,
      rating: Number(x.rating),
      text: x.text as string,
      relativeTime: (x.relative_time as string) ?? null,
      publishedAt: x.published_at ? new Date(x.published_at as string).toISOString() : null,
      images: (x.images as string[]) ?? [],
    })),
  };
}
