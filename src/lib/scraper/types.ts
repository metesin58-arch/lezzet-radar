export type ScrapedReview = {
  author: string;
  authorPhoto: string | null;
  rating: number;
  text: string;
  relativeTime: string | null;
  publishedAt: string | null;
  images: string[];
};

export type RatingDist = Record<"1" | "2" | "3" | "4" | "5", number>;

export type ScrapedPlace = {
  placeId: string;
  cid: string | null;
  dataId: string | null;
  title: string;
  category: string | null;
  categories: string[];
  address: string | null;
  district: string | null;
  phone: string | null;
  website: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number;
  reviewsPerRating: RatingDist | null;
  priceRange: string | null;
  openHours: Record<string, string[]> | null;
  thumbnail: string | null;
  link: string | null;
  status: string;
  reviews: ScrapedReview[];
  raw: unknown;
};
