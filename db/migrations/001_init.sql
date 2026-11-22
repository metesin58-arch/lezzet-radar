create extension if not exists postgis;
create extension if not exists pgcrypto;

create table places (
  place_id text primary key,
  cid text,
  data_id text,
  title text not null,
  category text,
  categories text[] not null default '{}',
  address text,
  district text,
  phone text,
  website text,
  location geography(Point, 4326) not null,
  rating numeric(2,1),
  review_count int not null default 0,
  reviews_per_rating jsonb,
  price_range text,
  open_hours jsonb,
  thumbnail text,
  link text,
  status text not null default '',
  raw jsonb,
  scraped_at timestamptz not null default now()
);
create index places_location_idx on places using gist (location);

create table reviews (
  id bigserial primary key,
  place_id text not null references places(place_id) on delete cascade,
  author text not null default '',
  author_photo text,
  rating smallint not null,
  text text not null default '',
  relative_time text,
  images text[] not null default '{}',
  unique (place_id, author, text)
);

create table place_foods (
  place_id text not null references places(place_id) on delete cascade,
  food_key text not null,
  name_match boolean not null default false,
  primary key (place_id, food_key)
);
create index place_foods_food_idx on place_foods (food_key);

create table coverage (
  cell_id text not null,
  food_key text not null,
  last_scraped_at timestamptz not null,
  result_count int not null default 0,
  primary key (cell_id, food_key)
);

create table scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  cell_id text not null,
  food_key text not null,
  keyword text not null,
  lat float8 not null,
  lng float8 not null,
  priority int not null default 0,
  status text not null default 'pending' check (status in ('pending','running','done','failed')),
  attempts int not null default 0,
  error text,
  result_count int,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create unique index scrape_jobs_active_uniq on scrape_jobs (cell_id, food_key)
  where status in ('pending','running');
create index scrape_jobs_claim_idx on scrape_jobs (status, priority desc, created_at);
