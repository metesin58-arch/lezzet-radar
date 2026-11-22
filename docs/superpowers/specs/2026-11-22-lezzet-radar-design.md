# Lezzet Radar — Tasarım Dokümanı

Tarih: 2026-11-22 · Durum: Onaylandı (2026-11-22) · Çalışma adı: "Lezzet Radar" (değiştirilebilir)

## 1. Amaç ve neden

Kullanıcı bir şehirde (ilk aşamada İstanbul) ne yemek istediğini seçiyor: çiğköfte, lahmacun, hamburger vb. Site ona **en yakındaki en yüksek puanlı mekanları yorumlarıyla birlikte** gösteriyor. Bu bir **seçim kolaylaştırma** aracı, sipariş uygulaması değil. Başarı ölçütü: kullanıcı siteyi açtıktan sonra birkaç saniyede güvenebileceği 3-5 seçeneği görüp karar verebiliyor.

Veri, açık kaynak **gosom/google-maps-scraper** (MIT, Go) ile Google Maps'ten çekilir.

## 2. Hedefler / Hedef dışı / Anti-hedefler

**Hedefler**
- Mobilde uygulama gibi hissettiren bir web sitesi (referans: kullanıcının gönderdiği iki Dribbble görseli; beyaz zemin, yuvarlak kartlar, kategori ikonları, siyah vurgu butonlar).
- Konuma göre, kategoriye göre sıralı mekan listesi: puan, yorum sayısı, mesafe, açık/kapalı.
- Mekan detay sayfası: fotoğraf, puan, adres, çalışma saatleri, fiyat aralığı, **yorumlar**, "Yol tarifi" (Google Maps linki) ve "Ara" butonları.
- İstanbul'un önceden doldurulmuş olması: İstanbul'da sonuçlar genelde anında gelir.
- Kapsam dışı bir bölgede veya serbest metinle aramada canlı çekim. Bu sırada "Senin için en lezzetli noktaları buluyorum…" yükleme ekranı gösterilir.

**Hedef dışı (bu sürümde yok)**
- Sipariş, sepet, ödeme. Görsellerdeki sepet ve "Add to cart" öğeleri alınmayacak. *(benim kararım)*
- Kullanıcı hesabı, giriş. Favoriler sadece tarayıcıda (localStorage) tutulur. *(benim kararım)*
- Kullanıcının kendi yorum yazması.
- Native mobil uygulama.

**Anti-hedefler (çalışsa bile başarısızlık sayılır)**
- Açılış ekranının yavaş gelmesi. Ana sayfa her zaman veritabanından anında dolmalı, scraper beklenmemeli.
- Alakasız sonuçlar, örneğin "lahmacun" listesinde lahmacunu olmayan genel bir restoran.
- Kalıcı olarak kapanmış mekanların listelenmesi.
- Az yorumlu bir mekanın sırf 5.0 puanı var diye en üste çıkması.

## 3. Kısıtlar

- **Öncelik: doğruluk > hız (kullanıcı kararı).** Scraper'ın doğru ve eksiksiz veri getirmesi şart; kullanıcının ne kadar beklediği önemli değil. Bu yüzden `-depth` gerektiği kadar yüksek tutulur; worker çıktıyı doğrular (koordinat, puan, kategori eşleşmesi) ve eksik/bozuk sonuçta işi yeniden dener. Gerçek scraper çıktısıyla uçtan uca test zorunludur.

- **Scraper anlık çalışmaz.** Gerçek bir Chromium açar. README'ye göre `-c 8 -depth 1` ile dakikada yaklaşık 120 mekan çeker, web modunda sonuçların görünmesi en az 3 dakika sürer. Kullanıcı isteğine bağlı her çekim dakikalar alır.
- **Google engelleme riski.** Yoğun kullanımda IP engellenebilir. Scraper `-proxies` desteği sunuyor; MVP'de proxy kullanılmayacak, ama mimari buna açık kalacak.
- **Google ToS.** Scraping, Google'ın kullanım şartlarına aykırı bir gri alan. Proje sahibi bu riski bilerek ilerliyor.
- **Barındırma.** Scraper Docker + Chromium istediği için site sadece Vercel benzeri serverless bir ortamda çalışamaz. Docker çalıştırabilen bir sunucu (VPS) gerekir.
- **Fotoğraflar** Google'ın CDN linkleri (`thumbnail`, `images`) olarak gösterilir, kendimiz barındırmayız. Linkler zamanla bozulabilir; bozulursa yer tutucu görsel gösterilir.
- **Dil.** Arayüz Türkçe, scraper `-lang tr` ile çalışır.

## 4. Değerlendirilen yaklaşımlar

| | Yaklaşım | Artı | Eksi |
|---|---|---|---|
| **A ✅** | **Karma:** İstanbul önceden çekilir, eksik veya bayat bölge/kategoride canlı çekim + yükleme ekranı | İstanbul'da hızlı, başka şehirlere doğal olarak açılır | Dört parça (site, API, DB, scraper worker), kurulumu daha fazla iş |
| B | Her aramada canlı çekim | En basit kurulum, veri hep taze | Her arama 1-3+ dk sürer, Google hızla engeller |
| C | Sadece önceden çekilmiş veri | Her şey anında | İstanbul dışında ve listede olmayan yemekte sonuç yok |

**Seçilen: A.** Kullanıcı "beklemek sorun değil, yeter ki güzel bir yükleme ekranı olsun" dedi ve İstanbul'la başlamak istiyor.

## 5. Mimari (benim kararlarım)

```
[Tarayıcı: Next.js arayüzü]
        │  /api/places?lat&lng&category  /api/jobs/:id
        ▼
[Next.js API route'ları] ──► [PostgreSQL + PostGIS]
        │ eksik/bayat ise iş ekler          ▲
        ▼                                   │ sonuçları yazar
[scrape_jobs tablosu] ──► [Worker (Node)] ──► docker run gosom/google-maps-scraper … -json
```

- **Arayüz ve API:** Next.js (App Router) + TypeScript + Tailwind CSS. API, aynı uygulamanın route handler'larında çalışır.
- **Veritabanı:** PostgreSQL + PostGIS. "Bana en yakın" sorgusu `ST_DWithin` / `ST_Distance` ile yapılır.
- **İş kuyruğu:** Postgres'te `scrape_jobs` tablosu. İşler `FOR UPDATE SKIP LOCKED` ile alınır; Redis kullanılmaz.
- **Worker:** Ayrı bir Node süreci. Kuyruktan iş alır, scraper'ı **CLI modunda** çalıştırır (ör. `-input q.txt -json -results out.json -lang tr -geo "lat,lon" -zoom 15 -radius 2000 -depth 1 -exit-on-inactivity 2m`), çıktıyı okuyup DB'ye upsert eder.
  - *Neden REST/web modu değil:* README'deki REST tablosu (`/api/v1/jobs`) ile repodaki kod (`POST /api/v1/scrape`) birbirini tutmuyor. CLI + JSON çıktı daha öngörülebilir. Builder, imaj üzerinde web modunun REST API'sinin gerçekten çalıştığını doğrularsa ona geçebilir.
- **Paketleme:** `docker-compose`: `web`, `worker`, `db` (postgis/postgis). Worker, scraper imajını Docker soketi üzerinden çalıştırır. Builder, scraper binary'sini worker imajına gömmeyi de seçebilir.
- **Harita:** Leaflet + OpenStreetMap karoları (ücretsiz, API anahtarı gerektirmez).

## 6. Veri modeli (taslak)

- `places`: `place_id` (PK), `cid`, `title`, `category` (Google'ın kategorisi), `address`, `phone`, `website`, `location geography(Point)`, `rating`, `review_count`, `reviews_per_rating` (jsonb), `price_range`, `open_hours` (jsonb), `thumbnail`, `images` (jsonb), `link`, `status`, `raw` (jsonb, tam scraper çıktısı), `scraped_at`.
- `reviews`: `id`, `place_id`, `author`, `rating`, `text`, `published_at`/`relative_time`, `source` (`user_reviews` | `user_reviews_extended`).
- `food_categories`: `slug`, `name`, `icon`, `search_terms` (ör. "lahmacun", "lahmacun salonu"), `synonyms`.
- `place_food_categories`: `place_id`, `food_slug`, `matched_by` (`scrape_query` | `google_category` | `name`).
- `coverage`: `cell_id`, `food_slug` veya `keyword`, `last_scraped_at`, `status`. Bir bölgede bir kategorinin ne zaman çekildiğini tutar.
- `scrape_jobs`: `id`, `cell_id`, `lat`, `lng`, `keyword`, `food_slug?`, `status` (`pending|running|done|failed`), `attempts`, `error`, `created_at`, `finished_at`.

Not: `user_reviews` JSON yapısının tam alan adları README'de yazmıyor. Builder bunu ilk gerçek çıktıdan doğrulamalı.

## 7. Kapsama ve tazelik

- **Hücre:** İstanbul yaklaşık **2 km × 2 km** grid hücrelerine bölünür. Önceden çekim önce yoğun ilçelerden (Kadıköy, Beşiktaş, Şişli, Beyoğlu, Fatih, Üsküdar, Bakırköy, Ataşehir…) başlar, sonra yayılır. *(benim kararım; hücre boyutu builder'a bırakılabilir)*
- **Başlangıç kategorileri (~20):** Çiğköfte, Lahmacun, Pide, Döner, Kebap, İskender, Köfte, Hamburger, Pizza, Tantuni, Kokoreç, Midye, Balık, Mantı, Esnaf lokantası / Ev yemekleri, Kahvaltı, Börek, Sushi, Baklava / Tatlı, Kumpir. *(benim kararım; liste config dosyasında durur)*
- **Tazelik:** Bir hücre×kategori 30 günden eskiyse bayat sayılır. Bayat veri yine anında gösterilir, arka planda yenileme işi kuyruğa girer.
- **Ön çekim scripti:** `npm run seed:istanbul` tüm hücre×kategori işlerini kuyruğa ekler. Kabaca hesapla birkaç yüz hücre × 20 kategori olur ve bu bir-iki günde tamamlanır; worker bunu arka planda yavaş yavaş eritir.

## 8. Arama ve sıralama akışı

1. Kullanıcı konum verir: tarayıcı Geolocation API'si. İzin vermezse İstanbul ilçe listesinden seçer.
2. `GET /api/places?lat&lng&food=lahmacun&sort=onerilen`
   - Önce **2 km** içinde ara. 8'den az sonuç çıkarsa **5 km**, sonra **10 km** yarıçapa genişlet.
   - Kalıcı kapanmış mekanlar (`status`) elenir.
   - Kullanıcının hücresi×kategori **hiç çekilmemişse** iş kuyruğa eklenir (aynı iş zaten varsa yeniden eklenmez). Yanıtta `{ places: [...varsa], job: { id, status } }` döner.
3. Frontend'de `job` varsa ve liste boşsa tam ekran yükleme gösterilir. Liste doluysa üstte ince bir "Daha fazla yer arıyorum…" bandı çıkar. `/api/jobs/:id` her 3 saniyede sorgulanır; iş bitince liste yenilenir.
4. **Serbest metin ("Ne yemek istiyorsun?"):** Önce kategori ad ve eş anlamlılarıyla eşleştirilir ("çiğ köfte" → çiğköfte). Eşleşme yoksa metin keyword olarak canlı çekime gider (ör. "kumru", "su böreği").

**"Önerilen" sıralaması** *(benim kararım)*:
- Bayes ortalaması: `skor = (v/(v+m))·R + (m/(v+m))·C`. Burada `v` yorum sayısı, `R` mekanın puanı, `C` bölge ortalaması (~4.2), `m` = 50.
- Mesafe cezası: `final = skor − 0.15 · mesafe_km`.

Ek sıralama çipleri: **En yakın**, **En yüksek puan**, **En çok yorum**. Filtre çipleri: **Şu an açık**, **Fiyat ($/$$/$$$)**.

## 9. Ekranlar

**Ana sayfa**
```
 📍 Kadıköy, İstanbul ▾                     ♡
 Bugün ne yemek istiyorsun?
 [🔍 Lahmacun, çiğköfte, burger…        ]
 [🌯Çiğköfte][🫓Lahmacun][🍔Burger][🍕Pizza]
 [🥙Döner ][🍢Kebap  ][🐟Balık ][  Tümü ]
 Yakınındaki en iyiler
 ┌──────────┐┌──────────┐
 │  foto  ♡ ││  foto  ♡ │
 │Halil Usta││Burger X  │
 │★4.7 (2.1k)·650 m      │
 └──────────┘└──────────┘
 [ 🏠 ][ 🔍 ][ 🗺 ][ ♡ ]   (alt menü)
```
- Varsayılan liste: kategori seçilmeden, yakındaki tüm yemek mekanları "önerilen" sırasıyla.

**Sonuç listesi** (kategori seçilince): başlık "Lahmacun · Kadıköy", sıralama ve filtre çipleri, dikey kartlar (foto, ad, ★ puan (yorum sayısı), mesafe ve yürüme süresi, açık/kapalı, fiyat, öne çıkan kısa yorum). Sağ üstte **Liste/Harita** geçişi var.

**Harita görünümü**: Leaflet haritası, kullanıcı konumu ve mekan pinleri, altta yatay kaydırılan kartlar (görsel 1'in 3. ekranı gibi).

**Mekan detay**: büyük fotoğraf, ad, ★ puan, yorum sayısı, puan dağılımı çubukları (`reviews_per_rating`), adres, mesafe, çalışma saatleri, fiyat, telefon. **Yorumlar** listesi (puan, metin, tarih), en yeni ve en faydalı olanlar üstte. Altta sabit iki buton: **[Yol tarifi]** (Google Maps linkine gider) ve **[Ara]**.

**Yükleme ekranı**: "Senin için en lezzetli noktaları buluyorum…" metni, animasyonlu bir ikon ve dönüşümlü kısa mesajlar ("Lahmacuncuları kokluyorum…", "Yorumları okuyorum…"). Tahmini süre "1-3 dakika" olarak gösterilir.

**Favoriler**: localStorage'da tutulur.

**Görsel dil:** Görsel 1'in temiz beyaz ve siyah vurgulu stili temel alınır, görsel 2'den sıcak kırmızı/turuncu vurgu rengi eklenir. Kategori ikonları emoji veya basit SVG olur, stok fotoğraf kullanılmaz.

## 10. Hata durumları

- Konum izni yok → ilçe seçici açılır.
- Scraper işi başarısız → 2 kez yeniden denenir. Hâlâ olmazsa "Şu an bu bölgede arama yapamadım, biraz sonra tekrar dene" mesajı, varsa eldeki sonuçlarla birlikte gösterilir.
- Google engeli (art arda başarısızlık) → worker yavaşlar (backoff) ve log'a yazar. Kullanıcı tarafında yukarıdaki mesaj gösterilir.
- Canlı çekim kötüye kullanımına karşı IP başına dakikada sınırlı sayıda yeni iş açılabilir (rate limit).

## 11. Builder'a bırakılanlar

- Klasör yapısı, ORM seçimi (Drizzle/Prisma/düz SQL), migration aracı.
- Scraper'ı `docker run` ile mi, worker imajına gömülü binary ile mi çalıştıracağı.
- `-zoom`, `-radius`, `-depth`, `-extra-reviews` değerlerinin, ilk gerçek çekimde süre ve sonuç kalitesine bakılarak ayarlanması. `-extra-reviews` KAPALI: gerçek testte hiçbir ek yorum getirmedi (bkz. §13) ve işi ~3 kat yavaşlattı.
- Kategori eşleştirme kuralları: alakasız mekanları elemek için Google kategorisi + isim + arama sorgusu birlikte kullanılabilir.
- Test stratejisi: sıralama, kapsama ve kuyruk mantığı için birim testler; scraper çıktısı için kaydedilmiş örnek JSON fixture'ları.

## 12. Doğrulanması gerekenler (build başında)

- `user_reviews` JSON yapısı ve varsayılan çekimde kaç yorum geldiği.
- Tek bir geo + keyword işinin gerçek süresi.
- Geliştirme ortamının ağının Google Maps'e erişip erişemediği. Erişemiyorsa geliştirme kayıtlı fixture'larla yapılır, gerçek çekim kullanıcının sunucusunda test edilir.

## 13. Gerçek scraper testi (2026-11-22)

Komut: `docker run --network host gosom/google-maps-scraper -input q.txt -json -lang tr -geo "40.9905,29.0290" -zoom 15 -radius 2000 -depth 1 -exit-on-inactivity 2m -c 2` (bu geliştirme ortamında ayrıca proxy env + CA mount gerekti; üretimde gerekmez).

- "lahmacun" @ Kadıköy: **16 mekan, ~17 sn**. Puan, yorum sayısı, koordinat, adres, saatler, telefon doğru ve dolu.
- **Çıktı JSON Lines** (satır başına bir mekan), tek bir JSON dizisi değil.
- Önemli alanlar: `title, category, categories[], address, complete_address{borough,city,...}, latitude, longitude, review_rating, review_count, reviews_per_rating{"1".."5"}, open_hours{"Pazartesi":["11:30–20:30"]|["Kapalı"]}, phone, web_site, thumbnail, place_id, cid, data_id, link, status, price_range, user_reviews[]`.
- `user_reviews[]` öğesi: `{Name, ProfilePicture, Rating, Description, Images[], When}` (büyük harfli anahtarlar).
- **Yorum sınırı:** Her mekan için **en fazla 5 yorum** geliyor. `-extra-reviews` ile denendi: süre 17 sn → 57 sn, ek yorum 0 (`review_collection.status = "partial", reason = "no_more_reviews"`). Google'ın girişsiz görünümü yorumları kısıtlıyor. **Karar:** Detay sayfasında 5 yorum + puan dağılımı (`reviews_per_rating`) + "Tüm yorumları Google Maps'te gör" linki gösterilir.
- `images[]` boş geldi; görsel olarak `thumbnail` kullanılır.
- Şüpheli puanlar var (ör. 182 yorumun 177'si 5 yıldız). Bayes sıralaması bunları kısmen bastırır. Ek olarak, yorum sayısı < 30 ise rozet "Yeni / az yorum" gösterilir.
- Kategori eşleşmesi: arama "lahmacun" olsa da Google kategorileri "Restoran", "Pideci", "Fırın"… geliyor. Eşleştirme = arama sorgusu (birincil) + isim/kategori anahtar kelimeleri (ikincil).
- Örnek çıktılar: `fixtures/lahmacun-kadikoy.jsonl`, `fixtures/lahmacun-kadikoy-extra-reviews.jsonl`.
