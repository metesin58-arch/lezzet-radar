# Lezzet Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mobil-öncelikli bir web sitesi kurmak. Kullanıcı konumuna ve seçtiği yemeğe göre İstanbul'daki en yakın, en iyi puanlı mekanları yorumlarıyla listeler. Veri gosom/google-maps-scraper ile Google Maps'ten çekilir.

**Architecture:** Arayüz ve JSON API tek bir Next.js uygulamasında. PostgreSQL + PostGIS hem mekanları hem iş kuyruğunu (`scrape_jobs`) tutar. Ayrı bir Node worker kuyruktan iş alır ve `docker run gosom/google-maps-scraper` ile JSON Lines çıktı üretir. Çıktı doğrulanıp DB'ye yazılır. İstanbul önceden çekilir (seed). Hiç çekilmemiş bölge×yemek için canlı iş açılır, bu sırada arayüz yükleme ekranı gösterip sonucu sorgular (polling).

**Tech Stack:** Node 22, Next.js 15 (App Router, TypeScript), Tailwind CSS 4, `pg`, PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`), Vitest, `tsx`, react-leaflet + Leaflet (OSM karoları), Playwright (E2E), Docker Compose.

**Spec:** `docs/superpowers/specs/2026-11-22-lezzet-radar-design.md` (özellikle §13'teki gerçek test bulguları)

## Global Constraints

- Tüm arayüz metinleri Türkçe. Scraper her zaman `-lang tr` ile çalışır.
- Scraper komutu: `-json -lang tr -geo "<lat>,<lng>" -zoom 15 -radius 2000 -depth ${SCRAPER_DEPTH:-2} -exit-on-inactivity 3m -c 2`. `-extra-reviews` **kullanılmaz** (spec §13: 0 ek yorum, 3 kat yavaş).
- Scraper çıktısı JSON Lines'tır (her satır bir mekan). Yorum anahtarları büyük harflidir: `Name, ProfilePicture, Rating, Description, Images, When`.
- Öncelik doğruluk: doğrulanamayan satır DB'ye yazılmaz. Başarısız iş en fazla 3 deneme (2 retry) yapar ve hiçbir koşulda mevcut veriyi silmez.
- Grid hücresi 2 km. Tazelik süresi 30 gün. Yarıçap merdiveni 2000 → 5000 → 10000 m. Bir sonraki basamağa geçme eşiği: 8'den az sonuç.
- Sıralama: `bayes = (v/(v+50))·R + (50/(v+50))·4.2`, `final = bayes − 0.15·km + 0.1·(isim/kategori eşleşmesi ? 1 : 0)`.
- "Az yorum" rozeti: `review_count < 30`.
- İş önceliği: canlı = 10, yenileme = 5, seed = 0. Frontend iş durumunu 3 sn'de bir sorgular.
- Canlı iş açma limiti: IP başına dakikada 5.
- Kalıcı/geçici kapalı mekanlar (`status` alanı `/kapan|closed/i`) listelenmez.
- Yükleme metni birebir şu: "Senin için en lezzetli noktaları buluyorum…"
- Görseller Google CDN'den düz `<img>` ile gelir. `onError` durumunda `/placeholder.svg` gösterilir. `images[]` boş geldiği için `thumbnail` kullanılır.
- Görsel dil: beyaz zemin, `rounded-2xl` kartlar, siyah birincil buton, vurgu rengi `#E8452C`.

## Review Focus

1. **Türkçe metin normalizasyonu:** "Çiğ Köfte", "CIGKOFTE", "çiğköfteci", "LAHMACUN" doğru yemeğe eşleşmeli. `İ/ı` için `toLocaleLowerCase('tr')` kullanılmalı. Test: Task 2 `normalize.test.ts`.
2. **Çalışma saatlerinde uç durumlar:** gece yarısını aşan aralık ("18:00–03:00"), "24 saat açık", "Kapalı", birden fazla aralık, alanın hiç olmaması (→ `null`). Test: Task 4 `openNow.test.ts`.
3. **Bozuk veya kısmi scraper çıktısı:** son satır kesik, 0 satır, exit code ≠ 0, koordinatı 0/0 olan satır. Hiçbiri mevcut veriyi bozmamalı; iş yeniden denenmeli. Test: Task 3 `parse.test.ts`, Task 6 `worker.test.ts`.
4. **Aynı anda aynı arama:** aynı hücre×yemek için 20 eşzamanlı istek tek bir iş açmalı. Test: Task 5 `jobs.test.ts`.
5. **Hücre sınırında veya İstanbul dışında kullanıcı:** komşu hücredeki mekanlar da gelmeli. İstanbul dışında (ör. Ankara) canlı iş açılmalı. Test: Task 7 `search.test.ts`.

---

## File Structure

```
docker-compose.yml            db (5433), web, worker
Dockerfile                    web (next build + start)
Dockerfile.worker             node:22 + docker CLI (COPY --from=docker:27-cli)
db/migrations/001_init.sql
scripts/migrate.ts            migration'ları sırayla uygular (schema_migrations tablosu)
scripts/seed-istanbul.ts
src/config/foods.ts           yemek listesi (DB'de tablo yok, spec §6'dan sapma: config kodda)
src/config/districts.ts       39 ilçe + merkez koordinatı
src/lib/db.ts                 pg Pool, query<T>()
src/lib/text/normalize.ts     Türkçe normalize + serbest metin → yemek eşleştirme
src/lib/geo/grid.ts           hücre hesapları
src/lib/scraper/types.ts      ScrapedPlace, ScrapedReview
src/lib/scraper/parse.ts      JSONL → doğrulanmış ScrapedPlace[]
src/lib/scraper/run.ts        docker run sarmalayıcı
src/lib/ranking.ts
src/lib/openNow.ts
src/lib/matching.ts           mekan ↔ yemek ilgisi, yemek dışı kategori filtresi
src/lib/repo/places.ts
src/lib/repo/jobs.ts
src/lib/repo/coverage.ts
src/lib/search.ts             yarıçap merdiveni + iş açma
src/lib/rateLimit.ts
src/worker/processJob.ts
src/worker/index.ts
src/app/api/places/route.ts
src/app/api/places/[id]/route.ts
src/app/api/jobs/[id]/route.ts
src/app/(ui)… sayfalar ve components/ (Task 9-11)
tests/… her modülün yanında *.test.ts; DB testleri tests/db/*.test.ts
e2e/smoke.spec.ts
```

---

### Task 1: Proje iskeleti, DB ve migration

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `docker-compose.yml` (şimdilik sadece `db`), `db/migrations/001_init.sql`, `scripts/migrate.ts`, `src/lib/db.ts`, `.env.example`, `tests/db/setup.ts`
- Test: `tests/db/migrate.test.ts`

**Interfaces:**
- Produces: `query<T>(sql: string, params?: unknown[]): Promise<T[]>`, `pool: Pool`, `withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T>`. Env: `DATABASE_URL`. Testler `DATABASE_URL_TEST=postgres://lezzet:lezzet@localhost:5433/lezzet_test` kullanır.
- Produces tablolar:
  - `places(place_id text pk, cid text, data_id text, title text not null, category text, categories text[], address text, district text, phone text, website text, location geography(Point,4326) not null, rating numeric(2,1), review_count int, reviews_per_rating jsonb, price_range text, open_hours jsonb, thumbnail text, link text, status text, raw jsonb, scraped_at timestamptz)`. GIST indeksi `location` üzerinde.
  - `reviews(id bigserial, place_id text fk on delete cascade, author text, author_photo text, rating smallint, text text, relative_time text, images text[], unique(place_id, author, text))`
  - `place_foods(place_id text fk, food_key text, name_match boolean, primary key(place_id, food_key))`. `food_key` bir yemek slug'ı ya da `q:<normalize edilmiş serbest metin>`.
  - `coverage(cell_id text, food_key text, last_scraped_at timestamptz, result_count int, primary key(cell_id, food_key))`
  - `scrape_jobs(id uuid pk default gen_random_uuid(), cell_id text, food_key text, keyword text, lat float8, lng float8, priority int, status text check in ('pending','running','done','failed'), attempts int default 0, error text, result_count int, created_at, started_at, finished_at)`. Ayrıca kısmi benzersiz indeks: `(cell_id, food_key) where status in ('pending','running')`.

- [ ] **Step 1:** `npx create-next-app@15 . --ts --tailwind --app --src-dir --eslint --no-import-alias` ile iskeleti kur. Ardından `pg tsx vitest @types/pg` paketlerini ekle. `docker-compose.yml` içine `db` servisini (`postgis/postgis:16-3.4`, port 5433, kullanıcı/şifre/db `lezzet`) ekle. `npm test` = `vitest run`.
- [ ] **Step 2: Failing test** `tests/db/migrate.test.ts`: test DB'yi drop/create eder, `migrate()` çalıştırır ve `information_schema.tables` sorgusunda `places, reviews, place_foods, coverage, scrape_jobs, schema_migrations` tablolarının olduğunu doğrular. `migrate()` ikinci kez çalıştığında hata vermemeli (idempotent).
- [ ] **Step 3:** `docker compose up -d db && npm test -- tests/db/migrate` çalıştır. Beklenen: FAIL (`migrate` tanımlı değil).
- [ ] **Step 4:** `001_init.sql` dosyasını yaz (`create extension if not exists postgis; pgcrypto`). `scripts/migrate.ts` içinde `export async function migrate(url?: string): Promise<void>` tanımla. CLI olarak `npm run migrate` ile çalışır.
- [ ] **Step 5:** Test PASS olmalı. Commit: `feat: proje iskeleti ve veritabanı şeması`.

### Task 2: Yemek config'i, ilçeler, metin normalizasyonu, grid

**Files:**
- Create: `src/config/foods.ts`, `src/config/districts.ts`, `src/lib/text/normalize.ts`, `src/lib/geo/grid.ts`
- Test: `src/lib/text/normalize.test.ts`, `src/lib/geo/grid.test.ts`

**Interfaces:**
- Produces:
  - `type Food = { slug: string; name: string; emoji: string; query: string; keywords: string[]; popular: boolean }`, `FOODS: Food[]`
    - 20 yemek, spec §7 sırasıyla: cigkofte, lahmacun, pide, doner, kebap, iskender, kofte, hamburger, pizza, tantuni, kokorec, midye, balik, manti, esnaf-lokantasi, kahvalti, borek, sushi, tatli, kumpir.
    - `popular=true` olanlar: cigkofte, lahmacun, hamburger, pizza, doner, kebap, balik.
    - `query` Google'da aranacak Türkçe metin (ör. `"çiğ köfte"`, `"esnaf lokantası"`, `"baklava tatlıcı"`).
    - `keywords` normalize edilmiş eşleşme kökleri (ör. çiğköfte için `["cigkofte","cig kofte"]`).
  - `District = { name: string; lat: number; lng: number }`, `DISTRICTS` (39 ilçe). `nearestDistrict(lat, lng): District`.
  - `normalizeTr(s: string): string`: `toLocaleLowerCase('tr')`, ardından ç→c ğ→g ı→i ö→o ş→s ü→u eşlemesi, noktalama silinir, boşluklar sıkıştırılır.
  - `matchFood(input: string): Food | null`: normalize edilmiş girdi, boşluklar çıkarılmış hâliyle bir keyword'ü içeriyorsa o yemeği döner.
  - `foodKeyForQuery(input: string): string`: eşleşen yemek varsa slug'ını, yoksa `"q:" + normalizeTr(input)` döner.
  - Grid sabitleri: `LAT_STEP = 2/111.32`, `lngStep(row) = 2/(111.32·cos(rowCenterLat))`.
  - `cellIdFor(lat, lng): string` (format `"r:c"`), `cellCenter(cellId): {lat, lng}`, `neighborCells(cellId): string[]` (8 komşu), `cellsInBBox(minLat, minLng, maxLat, maxLng): string[]`.
- [ ] **Step 1: Failing tests:**
  - `matchFood("Çiğ Köfte")?.slug === "cigkofte"`, `matchFood("CIGKOFTE")`, `matchFood("çiğköfteci")` → `"cigkofte"`.
  - `matchFood("LAHMACUN")` → `"lahmacun"`. `matchFood("İskender")` → `"iskender"`.
  - `matchFood("kumru")` → `null`. `foodKeyForQuery("Su Böreği ")` → `"q:su boregi"`.
  - `cellCenter(cellIdFor(41.0,29.0))` noktası (41.0, 29.0)'a ≤ 1.5 km mesafede olmalı.
  - `cellIdFor` aynı hücredeki iki nokta için aynı değeri dönmeli. `neighborCells` 8 farklı id dönmeli.
  - `nearestDistrict(40.9905, 29.0290).name === "Kadıköy"`.
- [ ] **Step 2:** Testler FAIL olmalı. **Step 3:** Fonksiyonları yaz. **Step 4:** Testler PASS olmalı. **Step 5:** Commit: `feat: yemek listesi, ilçeler, normalize, grid`.

### Task 3: Scraper çıktısı parser'ı ve doğrulama

**Files:**
- Create: `src/lib/scraper/types.ts`, `src/lib/scraper/parse.ts`
- Test: `src/lib/scraper/parse.test.ts` (`fixtures/lahmacun-kadikoy.jsonl` kullanır)

**Interfaces:**
- Produces:
  - `ScrapedReview = { author: string; authorPhoto: string|null; rating: number; text: string; relativeTime: string|null; images: string[] }`
  - `ScrapedPlace = { placeId; cid; dataId; title; category; categories: string[]; address; district: string|null /* complete_address.city */; phone; website /* web_site */; lat; lng; rating: number|null; reviewCount: number; reviewsPerRating: Record<'1'|'2'|'3'|'4'|'5', number>|null; priceRange: string|null; openHours: Record<string,string[]>|null; thumbnail: string|null; link; status: string; reviews: ScrapedReview[]; raw: unknown }`
  - `parseScraperOutput(jsonl: string): { places: ScrapedPlace[]; rejected: { line: number; reason: string }[] }`
- Doğrulama kuralları: JSON parse edilemiyorsa reddet ("invalid_json"). `place_id` ya da `title` boşsa reddet. lat ∉ [-90,90], lng ∉ [-180,180] ya da lat=lng=0 ise reddet. `review_rating` ∉ [0,5] ise reddet. `review_count` < 0 ise 0'a çevir. Aynı `place_id` iki kez gelirse sonuncusu kalır. Boş metinli ve 0 puanlı yorumlar atılır.
- [ ] **Step 1: Failing tests:**
  - Fixture'dan 16 mekan gelmeli, `rejected` boş olmalı.
  - "Halil Lahmacun" için `rating 4.1`, `reviewCount 3214`, `reviews.length 5`, `reviews[0].author "onur cora"`, `reviews[0].rating 3`, `district "Kadıköy"`, `openHours.Pazartesi` = `["Kapalı"]`.
  - Son satırı yarıya kesilmiş girdi: 15 mekan + 1 `invalid_json` red.
  - Boş string girdi: `places=[]`.
  - lat=0,lng=0 olan satır: `invalid_coords` ile reddedilmeli.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. **Step 5:** Commit: `feat: scraper çıktısı parser ve doğrulama`.

### Task 4: Sıralama, "şu an açık", yemek eşleşmesi

**Files:**
- Create: `src/lib/ranking.ts`, `src/lib/openNow.ts`, `src/lib/matching.ts`
- Test: `src/lib/ranking.test.ts`, `src/lib/openNow.test.ts`, `src/lib/matching.test.ts`

**Interfaces:**
- Produces:
  - `bayesScore(rating: number|null, reviewCount: number): number` (rating null → 4.2 kabul edilir)
  - `finalScore(p: { rating; reviewCount; distanceM; nameMatch: boolean }): number`
  - `type SortKey = 'onerilen'|'yakin'|'puan'|'yorum'`, `sortPlaces<T extends {...}>(list: T[], key: SortKey): T[]`
  - `isOpenNow(openHours: Record<string,string[]>|null, now: Date): boolean|null`. `now` Europe/Istanbul saatine çevrilir. Gün anahtarları: Pazartesi…Pazar.
  - `isClosedPermanently(status: string): boolean` (`/kapan|closed/i`)
  - `isFoodPlace(categories: string[]): boolean`. Kategoriler sadece yemek dışı kalıplardan oluşuyorsa false döner: `/market|süpermarket|otel|benzin|eczane|banka|kuaför/i`.
  - `nameMatchesFood(place: {title; categories}, food: Food): boolean`
- [ ] **Step 1: Failing tests:**
  - `bayesScore(5, 16) < bayesScore(4.7, 1053)` ve `bayesScore(5,182) > bayesScore(4.1,3214)`.
  - Aynı puanda 300 m uzaktaki mekan, 3 km uzaktakinden önde.
  - `isOpenNow({Pazartesi:["Kapalı"]}, <Pzt 13:00 TR>) === false`.
  - `{Cuma:["18:00–03:00"], ...}`: Cumartesi 01:30 için `true` (önceki günün aralığı devam ediyor), Cuma 17:00 için `false`.
  - `["24 saat açık"]` → `true`. `["11:30–15:00","18:00–22:00"]` ile 16:00 → `false`. `null` girdi → `null`.
  - Aralık ayırıcısı hem `–` (en dash) hem `-` olabilir.
  - `isClosedPermanently("Kalıcı olarak kapandı") === true`, `""` → false.
  - `nameMatchesFood({title:"Filfil Lahmacun"}, lahmacun) === true`, `{title:"Çinili Taş Fırın Moda", categories:["Restoran"]}` → false.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. **Step 5:** Commit: `feat: sıralama, açık/kapalı, eşleşme`.

### Task 5: Repository katmanı (places, coverage, jobs)

**Files:**
- Create: `src/lib/repo/places.ts`, `src/lib/repo/coverage.ts`, `src/lib/repo/jobs.ts`
- Test: `tests/db/places.test.ts`, `tests/db/jobs.test.ts`, `tests/db/coverage.test.ts`

**Interfaces:**
- Consumes: `ScrapedPlace` (Task 3), `nameMatchesFood`, `isFoodPlace` (Task 4), `query/withTx` (Task 1)
- Produces:
  - `upsertPlaces(places: ScrapedPlace[], foodKey: string, food: Food|null): Promise<number>`: tek transaction. Mekanı upsert eder, yorumları `on conflict do nothing` ile ekler, `place_foods`'a `(place_id, foodKey, nameMatch)` yazar. `isFoodPlace=false` olanları atlar. Dönüş değeri yazılan mekan sayısıdır.
  - `findNearby(o: { lat; lng; radiusM; foodKey?: string; foodKeys?: string[]; limit?: number }): Promise<NearbyRow[]>`. Burada `NearbyRow = { placeId; title; category; lat; lng; rating; reviewCount; distanceM; thumbnail; priceRange; openHours; status; address; nameMatch: boolean; topReview: {author; rating; text}|null }`. Sorgu `ST_DWithin` + `ST_Distance` kullanır; `topReview` en uzun 4-5 yıldızlı yorumdur. Kapalı mekanlar SQL'de elenir. Varsayılan limit 60.
  - `getPlace(placeId): Promise<PlaceDetail|null>`. `PlaceDetail = NearbyRow` (distanceM hariç) `& { phone; website; link; reviewsPerRating; categories; reviews: ScrapedReview[] }`
  - `getCoverage(cellId, foodKey): Promise<{ lastScrapedAt: Date; resultCount: number } | null>`, `markCovered(cellId, foodKey, resultCount)`
  - `enqueueJob(j: { cellId; foodKey; keyword; lat; lng; priority }): Promise<{ id: string; status: JobStatus; created: boolean }>`. Aynı `(cellId, foodKey)` için aktif bir iş varsa onu döner (`insert … on conflict do nothing` ardından select). Mevcut işin önceliği daha düşükse yükseltir.
  - `claimJob(): Promise<Job|null>`: `FOR UPDATE SKIP LOCKED`, `order by priority desc, created_at`. Status `running`, `attempts+1`, `started_at` güncellenir.
  - `completeJob(id, resultCount)`, `failJob(id, error, maxAttempts=3)`: attempts < 3 ise tekrar `pending`, değilse `failed`. `getJob(id)`.
  - `requeueStale(minutes=15)`: 15 dakikadan uzun süredir `running` olan işleri `pending`'e döndürür (worker çökmesi için).
- [ ] **Step 1: Failing tests:**
  - Fixture upsert edildikten sonra `findNearby({lat:40.9905,lng:29.0290,radiusM:2000,foodKey:'lahmacun'})` 16 satır dönmeli. Her `distanceM` ≤ 2000 olmalı. "Filfil Lahmacun" satırında `nameMatch=true` olmalı.
  - Aynı fixture ikinci kez upsert edilince `reviews` sayısı değişmemeli. Rating değiştirilmiş fixture upsert edilince yeni değer görünmeli.
  - Status'u "Kalıcı olarak kapandı" olan mekan `findNearby` sonucunda yer almamalı.
  - **Eşzamanlılık:** `Promise.all` ile 20 `enqueueJob` çağrısı → `scrape_jobs` tablosunda tek aktif satır olmalı, tüm çağrılar aynı `id`'yi dönmeli.
  - `claimJob` iki paralel çağrıda farklı işler (ya da biri `null`) dönmeli. `failJob` 3. denemede `failed` yapmalı.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. **Step 5:** Commit: `feat: places/coverage/jobs repository`.

### Task 6: Scraper çalıştırıcı ve worker

**Files:**
- Create: `src/lib/scraper/run.ts`, `src/worker/processJob.ts`, `src/worker/index.ts`
- Test: `tests/db/worker.test.ts`

**Interfaces:**
- Consumes: Task 3, 5
- Produces:
  - `type ScrapeRunner = (o: { keyword: string; lat: number; lng: number }) => Promise<{ exitCode: number; stdout: string /* jsonl */; log: string }>`
  - `dockerRunner: ScrapeRunner`:
    - `$SCRAPE_DIR/<uuid>/` altında `q.txt` oluşturur, `docker run --rm` çalıştırır (`-v $SCRAPE_DIR/<uuid>:/work`, Global Constraints'teki argümanlar, `-results /work/out.jsonl`, `-e DISABLE_TELEMETRY=1`). Ardından dosyayı okuyup klasörü siler.
    - `SCRAPER_EXTRA_DOCKER_ARGS` env'i (boşlukla ayrılmış) docker argümanlarına eklenir. Bu sadece geliştirme ortamı içindir: proxy env + CA mount.
    - Zaman aşımı 10 dk. Aşılırsa process öldürülür ve exitCode -1 döner.
  - `processJob(job: Job, runner: ScrapeRunner): Promise<void>`:
    - exit≠0 → `failJob`.
    - Parse sonucu 0 mekan: ilk iki denemede `failJob("empty")`, 3. denemede `completeJob(0)` + `markCovered(…,0)`. Gerçekten sonuç olmayan bölge bu şekilde kapanır.
    - Aksi hâlde: `upsertPlaces` → `markCovered(cellId, foodKey, n)` → `completeJob(n)`.
    - Reddedilen satır sayısı loglanır.
  - `src/worker/index.ts`: döngü `requeueStale` → `claimJob`. İş yoksa 2 sn bekler. Art arda 3 hata alırsa 1 → 2 → 4 … en fazla 10 dk backoff uygular. SIGTERM gelince mevcut işi bitirip çıkar. `npm run worker` ile başlatılır.
- [ ] **Step 1: Failing tests** (sahte runner ile):
  - Fixture'ı dönen runner ile iş `done` olmalı, `result_count=16`, coverage yazılmalı.
  - exitCode 1 → iş `pending`, `attempts=1`, DB'deki mevcut mekanlar değişmemeli.
  - Boş çıktı üç kez gelirse iş `done`, `result_count=0`.
  - Yarım son satır: 15 mekan yazılır, iş `done`.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS.
- [ ] **Step 5: Gerçek doğrulama** (zorunlu, kullanıcı şartı):
  - `npm run migrate && npm run worker &` başlat ve `enqueueJob` ile `{keyword:"lahmacun", lat:40.9905, lng:29.0290}` işini ekle.
  - Beklenen: iş ≤ 3 dk içinde `done` olmalı, `result_count ≥ 10` olmalı.
  - `select title, rating, review_count from places` sorgusunu çalıştırıp 3 mekanı fixture değerleriyle karşılaştır.
  - Bu ortamda `SCRAPER_EXTRA_DOCKER_ARGS="--network host -e HTTPS_PROXY=http://127.0.0.1:40411 -v <nssdb>:/root/.pki/nssdb -v /root/.ccr/ca-bundle.crt:/etc/ssl/certs/ca-certificates.crt:ro"` kullanılır.
- [ ] **Step 6:** Commit: `feat: scraper worker`.

### Task 7: Arama servisi ve API route'ları

**Files:**
- Create: `src/lib/search.ts`, `src/lib/rateLimit.ts`, `src/app/api/places/route.ts`, `src/app/api/places/[id]/route.ts`, `src/app/api/jobs/[id]/route.ts`
- Test: `tests/db/search.test.ts`, `src/lib/rateLimit.test.ts`

**Interfaces:**
- Consumes: Task 2, 4, 5
- Produces:
  - `PlaceSummary = { id; title; category; lat; lng; rating; reviewCount; distanceM; thumbnail; priceRange; address; openNow: boolean|null; fewReviews: boolean; topReview: {author;rating;text}|null }`
  - `SearchResponse = { places: PlaceSummary[]; radiusM: number; foodKey: string|null; job: { id: string; status: JobStatus } | null; refreshing: boolean }`
  - `searchPlaces(o: { lat; lng; food?: string; q?: string; sort?: SortKey; openNow?: boolean; price?: string; allowLive: boolean }): Promise<SearchResponse>`:
    1. Önce `foodKey` belirlenir: `food` slug'ı ya da `foodKeyForQuery(q)`. İkisi de yoksa `null` olur; bu durumda `foodKeys` = tüm yemek slug'ları.
    2. Yarıçap merdiveni 2000/5000/10000 uygulanır. 8 sonuca ulaşılınca ya da son basamakta durulur. Ardından filtreler (`openNow`, `price`) ve sıralama uygulanır.
    3. Kullanıcının hücresi ve 8 komşusu için coverage kontrol edilir.
       - Kullanıcının hücresinde coverage yoksa ve `allowLive` true ise canlı iş açılır (öncelik 10). `foodKey=null` ise popüler 7 yemeğin hepsi için iş açılır ve ilki `job` olarak döner.
       - Coverage 30 günden eskiyse yenileme işi açılır (öncelik 5), yanıtta `refreshing:true` döner, `job:null` olur.
    4. Serbest metin (`q:` key) için iş `keyword=q` ile açılır, yemek eşleşmişse `keyword=food.query` kullanılır.
  - `GET /api/places?lat&lng&food|q&sort&openNow&price` → `SearchResponse`. lat/lng geçersizse 400 döner. Rate limit aşılırsa `allowLive=false` olur, istek reddedilmez.
  - `GET /api/places/:id` → `PlaceDetail` (Task 5) + `openNow`. Bulunamazsa 404.
  - `GET /api/jobs/:id` → `{ id; status; resultCount; error }`. Bulunamazsa 404.
  - `rateLimit(key: string, limit=5, windowMs=60000): boolean`: bellek içi sliding window.
- [ ] **Step 1: Failing tests:**
  - Fixture + coverage(Kadıköy hücresi) ile `searchPlaces({lat:40.9905,lng:29.0290,food:'lahmacun',allowLive:true})` → `job === null`, `places.length ≥ 8`, `radiusM === 2000`, ilk sonuç `sort=onerilen` sırasıyla.
  - Hücre sınırı: fixture mekanlarının olduğu hücrenin hemen komşusundaki bir nokta → sonuçlar dolu gelmeli (yarıçap komşu hücreyi kapsıyor).
  - Ankara (39.92, 32.85), food=lahmacun → `places=[]`, `job.status==='pending'`, `scrape_jobs` tablosunda keyword `"lahmacun"` olan bir iş var.
  - `q="kumru"` → foodKey `"q:kumru"`, keyword `"kumru"` olan iş açılmış.
  - 31 gün önce coverage yazılmış hücre → `refreshing:true`, `job:null`, places dolu.
  - `allowLive:false` → iş açılmamış.
  - `rateLimit` 6. çağrıda false döner, pencere geçince tekrar true.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS.
- [ ] **Step 5:** `npm run dev` çalışırken `curl "localhost:3000/api/places?lat=40.9905&lng=29.0290&food=lahmacun"` geçerli JSON dönmeli. Commit: `feat: arama servisi ve API`.

### Task 8: İstanbul seed scripti

**Files:**
- Create: `scripts/seed-istanbul.ts`
- Test: `tests/db/seed.test.ts`

**Interfaces:**
- Produces: `planSeedJobs(): SeedJob[]` ve CLI `npm run seed:istanbul [-- --only=lahmacun --limit=N]`.
  - 1. dalga (öncelik 0): merkez bbox `40.96,28.85 – 41.12,29.15` içindeki tüm hücreler × 20 yemek.
  - 2. dalga (öncelik 0, daha geç `created_at`): `DISTRICTS` merkezlerinin hücreleri × 20 yemek, 1. dalgadakiler hariç.
  - Coverage'ı taze (< 30 gün) olan hücre×yemek atlanır.
- [ ] **Step 1: Failing test:** `planSeedJobs()` sonucunda tekrar eden (cell, food) çifti olmamalı. Kadıköy merkez hücresi × lahmacun listede olmalı. Toplam iş sayısı 1500–4000 arasında olmalı. Aynı scripti iki kez çalıştırınca aktif iş sayısı artmamalı.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. **Step 5:** Commit: `feat: istanbul seed`.

### Task 9: Arayüz temeli ve ana sayfa

**Files:**
- Create: `src/app/layout.tsx`, `src/app/globals.css` (tasarım token'ları), `src/app/page.tsx`, `src/components/BottomNav.tsx`, `LocationHeader.tsx`, `DistrictPicker.tsx`, `SearchBar.tsx`, `CategoryGrid.tsx`, `PlaceCard.tsx`, `Rating.tsx`, `public/placeholder.svg`, `src/hooks/useLocation.ts`, `src/hooks/useFavorites.ts`, `src/hooks/usePlaces.ts`, `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Consumes: `SearchResponse`, `PlaceSummary` (Task 7), `FOODS`, `DISTRICTS`, `nearestDistrict` (Task 2)
- Produces:
  - `useLocation(): { status: 'idle'|'asking'|'ok'|'denied'; lat?; lng?; label?: string; setManual(d: District): void }`. İlk açılışta geolocation istenir. Sonuç localStorage `lr:loc` anahtarına kaydedilir. İzin reddedilirse `DistrictPicker` sheet'i açılır.
  - `useFavorites(): { ids: string[]; toggle(id): void; has(id): boolean }`, localStorage `lr:favs` anahtarını kullanır. Tüm localStorage erişimleri try/catch içinde olmalı.
  - `usePlaces(params): { data?: SearchResponse; loading; job; refetch }`. `job` varsa `/api/jobs/:id` 3 sn'de bir sorgulanır. Durum `done` olunca refetch edilir, `failed` olunca `error` set edilir.
  - `formatDistance(m): string` ("650 m", "1,2 km"), `walkMinutes(m): number` (80 m/dk), `formatCount(n): string` ("3,2B").
- Sayfa içeriği spec §9 ana sayfa taslağıyla birebir aynı olmalı:
  - Üstte konum satırı ve favori ikonu.
  - Başlık "Bugün ne yemek istiyorsun?".
  - SearchBar. Submit edince `/ara?q=…`, eşleşen yemek varsa `/ara?food=slug` adresine gider.
  - 4×2 CategoryGrid: ilk 7 popüler yemek + "Tümü". "Tümü" tüm listeyi açar.
  - "Yakınındaki en iyiler" bölümü: yatay kaydırılan PlaceCard'lar, `food` parametresi olmadan.
  - Altta sabit BottomNav: Ana sayfa / Ara / Harita / Favoriler.
- [ ] **Step 1: Failing test:** `formatDistance(650)==="650 m"`, `formatDistance(1234)==="1,2 km"`, `walkMinutes(800)===10`, `formatCount(3214)==="3,2B"`.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. Bileşenleri yaz.
- [ ] **Step 5:** `npm run dev`. Playwright ile iPhone 14 emülasyonunda, geolocation izni verilmiş hâlde (40.9905, 29.0290) ana sayfanın ekran görüntüsünü al. Başlık, 8 kategori kutusu ve en az 1 kart görünmeli, yatay sayfa kaydırması olmamalı.
- [ ] **Step 6:** Commit: `feat: ana sayfa`.

### Task 10: Sonuç listesi, yükleme ekranı, harita

**Files:**
- Create: `src/app/ara/page.tsx`, `src/app/harita/page.tsx`, `src/components/SortChips.tsx`, `FilterChips.tsx`, `LoadingFinder.tsx`, `SearchingBanner.tsx`, `MapView.tsx` (react-leaflet, `dynamic(..., {ssr:false})`)

**Interfaces:**
- Consumes: `usePlaces`, `PlaceCard`, `SortKey`
- Davranış:
  - Başlık "<Yemek adı ya da q> · <ilçe>".
  - Sıralama çipleri: Önerilen / En yakın / En yüksek puan / En çok yorum.
  - Filtre çipleri: Şu an açık, $, $$, $$$.
  - Kartlar dikey listelenir. Kartta foto, ad, ★ puan (yorum sayısı), mesafe · yürüme süresi, açık/kapalı rozeti, "Az yorum" rozeti ve `topReview` metninden 2 satır gösterilir.
  - Liste boş ve `job` varsa tam ekran `LoadingFinder` gösterilir:
    - Metin birebir "Senin için en lezzetli noktaları buluyorum…".
    - Altında 4 sn'de bir değişen yardımcı mesajlar: "Yorumları okuyorum…", "Puanları karşılaştırıyorum…", "<yemek>cıları kokluyorum…" (son mesaj sadece yemek eşleşmişse).
    - "Bu 1-3 dakika sürebilir" notu.
  - Liste doluysa ve `job` varsa ya da `refreshing` true ise üstte ince `SearchingBanner` gösterilir.
  - İş `failed` olursa metin "Şu an bu bölgede arama yapamadım, biraz sonra tekrar dene" olur ve "Tekrar dene" butonu refetch yapar.
  - Sağ üstteki Liste/Harita geçişi (ve `/harita` sayfası) `MapView`'ı açar: kullanıcı konumu mavi nokta, mekanlar pin olarak görünür, altta yatay kart şeridi olur, pine tıklayınca ilgili karta kaydırılır.
- [ ] **Step 1: E2E test** `e2e/results.spec.ts` (fixture seed'li test DB):
  - `/ara?food=lahmacun` → ≥ 8 kart görünmeli.
  - "En yakın" çipine tıklayınca ilk kartın mesafesi ≤ ikinci kartın mesafesi olmalı.
  - `/ara?food=lahmacun` Ankara koordinatıyla açılınca "Senin için en lezzetli noktaları buluyorum…" metni görünmeli.
  - İş DB'de elle `done` yapılıp mekan eklenince ≤ 5 sn içinde kart görünmeli.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. **Step 5:** Commit: `feat: sonuç listesi, yükleme, harita`.

### Task 11: Mekan detay ve favoriler

**Files:**
- Create: `src/app/mekan/[id]/page.tsx`, `src/app/favoriler/page.tsx`, `src/components/RatingBars.tsx`, `ReviewList.tsx`, `ActionBar.tsx`

**Interfaces:**
- Consumes: `GET /api/places/:id`, `useFavorites`
- Davranış:
  - Sayfada şunlar yer alır: büyük `thumbnail`, geri butonu ve ♡ butonu, ad, ★ puan, yorum sayısı, kategori, fiyat, mesafe (konum varsa).
  - `RatingBars`: `reviewsPerRating` değerleriyle 5→1 sıralı yatay çubuklar.
  - Adres, çalışma saatleri (bugün kalın), telefon.
  - `ReviewList`: en fazla 5 yorum (avatar, ad, yıldız, metin, `relativeTime`). Uzun metinlerde "Devamını oku" seçeneği olur. Listenin sonunda "Tüm yorumları Google Maps'te gör →" linki `link` alanına gider.
  - Altta sabit `ActionBar`: siyah "Yol tarifi" butonu `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&destination_place_id=<placeId>` adresine gider. "Ara" butonu `tel:` linkidir, telefon yoksa gizlenir.
  - `/favoriler`: favori id'leri için detaylar ayrı ayrı çekilir ve kartlar listelenir. Favori yoksa "Henüz favorin yok" mesajı gösterilir.
- [ ] **Step 1: E2E test:**
  - "Halil Lahmacun" detay sayfasında 5 yorum ve 5 rating çubuğu görünmeli. "Yol tarifi" href'i `destination_place_id=ChIJ1eAEvGe4yhQRXF1jGd_AmPs` içermeli.
  - ♡'ye tıklandıktan sonra `/favoriler` sayfasında bu mekan görünmeli.
- [ ] **Step 2-4:** FAIL, ardından implementasyon, ardından PASS. **Step 5:** Commit: `feat: mekan detay ve favoriler`.

### Task 12: Tam stack, compose ve gerçek uçtan uca doğrulama

**Files:**
- Create: `Dockerfile`, `Dockerfile.worker`, `README.md`
- Modify: `docker-compose.yml`

**Interfaces:**
- `docker compose up -d` ile `db`, `web` (:3000) ve `worker` ayağa kalkar.
  - `web` başlangıçta `npm run migrate` çalıştırır.
  - `worker`, `/var/run/docker.sock` ve `${SCRAPE_DIR:-/tmp/lezzet-scrape}` klasörünü **aynı yolla** mount eder. Bu şart, çünkü worker kardeş container'a host yolu verir.
- README içeriği (Türkçe): kurulum (VPS + Docker), `.env` değişkenleri, `npm run seed:istanbul`, seed'in tahmini süresi, proxy ekleme (`SCRAPER_EXTRA_DOCKER_ARGS`), Google ToS uyarısı.
- [ ] **Step 1:** `docker compose up -d --build` çalıştır. `curl localhost:3000/api/places?lat=40.9905&lng=29.0290` 200 dönmeli.
- [ ] **Step 2: Gerçek E2E** (fixture yok, boş DB):
  - Playwright ile `/ara?food=pizza` sayfasını Beşiktaş (41.0430, 29.0070) konumunda aç.
  - Yükleme ekranı görünmeli, ≤ 5 dk içinde ≥ 8 gerçek pizza mekanı listelenmeli.
  - Bir detaya girildiğinde yorumlar görünmeli.
  - Mobil ekran görüntüleri (ana sayfa, liste, harita, detay, yükleme) `docs/screenshots/` altına kaydedilir.
- [ ] **Step 3:** `npm run seed:istanbul -- --only=lahmacun --limit=5` çalıştır. 5 iş de `done` olmalı.
- [ ] **Step 4:** `npm test` ve `npx playwright test --trace off` tamamen yeşil olmalı. Commit: `feat: docker compose ve uçtan uca doğrulama`.
