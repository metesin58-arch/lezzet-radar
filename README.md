# Lezzet Radar

Konumuna göre "ne yesem?" sorusuna cevap veren mobil öncelikli bir web sitesi. Bir yemek seçersin (çiğköfte, lahmacun, hamburger…), site sana en yakın ve en iyi puanlı mekanları Google Maps yorumlarıyla birlikte listeler.

Veriler açık kaynak [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper) ile Google Maps'ten çekilir.

| Ana sayfa | Liste | Detay | Yükleniyor |
|---|---|---|---|
| ![](docs/screenshots/ana-sayfa.png) | ![](docs/screenshots/gercek-hamburger-besiktas.png) | ![](docs/screenshots/mekan-detay.png) | ![](docs/screenshots/yukleniyor.png) |

## Nasıl çalışır?

```
Tarayıcı (Next.js) ──► /api/places ──► PostgreSQL + PostGIS
                         │ bölge hiç taranmamışsa iş açar     ▲
                         ▼                                    │
                    scrape_jobs ──► worker ──► docker run gosom/google-maps-scraper
```

- **İstanbul önceden doldurulur.** Şehir 2 km'lik karelere bölünür, her kare × her yemek bir kez taranır. Bu verilerle sonuçlar anında gelir.
- **Taranmamış bir yerde veya listede olmayan bir yemekte** worker o an tarama yapar. Bu sırada kullanıcı "Senin için en lezzetli noktaları buluyorum…" ekranını görür. Gerçek testte bir tarama ~20-25 saniye sürdü.
- **30 günden eski veri** gösterilmeye devam eder, arka planda yenilenir.
- **Sıralama:** az yorumlu 5,0'lık bir yer, binlerce yorumlu 4,7'lik bir yerin önüne geçmez (Bayes ortalaması). Mesafe arttıkça puan biraz düşer.
- **Yorumlar:** Google, giriş yapmamış kullanıcıya mekan başına en fazla 5 yorum gösteriyor. Detay sayfasında bu 5 yorum, yıldız dağılımı ve "Tüm yorumları Google Maps'te gör" linki bulunur.

## Telefonda uygulama gibi kullanma (PWA)

Site "ana ekrana eklenebilir": kendi ikonuyla, tarayıcı çubuğu olmadan tam ekran açılır. Mağaza gerekmez, ama sitenin `https` ile yayında olması gerekir.

- **iPhone (Safari):** Paylaş butonu → "Ana Ekrana Ekle"
- **Android (Chrome):** ⋮ menüsü → "Ana ekrana ekle" / "Uygulamayı yükle"

İkonlar `scripts/make-icons.py` ile üretilir (`public/icons/`, `src/app/icon.png`, `src/app/apple-icon.png`).

## Kurulum (sunucu / VPS)

Gereken: Docker ve Docker Compose. Scraper bir tarayıcı açarak çalıştığı için Vercel gibi serverless bir ortam yetmez.

```bash
git clone <bu repo> lezzet-radar && cd lezzet-radar
docker compose up -d --build
```

Site http://SUNUCU:3000 adresinde açılır. Veritabanı şeması `web` servisi başlarken otomatik kurulur.

İstanbul'u önceden doldurmak için:

```bash
docker compose exec worker npm run seed:istanbul
```

Bu komut ~3.100 iş kuyruğa ekler. Tek worker ile bitmesi yaklaşık 20-24 saat sürer; site bu sırada çalışmaya devam eder. Önce tek bir yemekle denemek için:

```bash
docker compose exec worker npm run seed:istanbul -- --only=lahmacun --limit=20
```

Daha hızlı doldurmak için worker sayısını artırabilirsin (her biri ayrı bir tarayıcı açar, Google engelleme riskini artırır):

```bash
docker compose up -d --scale worker=2
```

### Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `DATABASE_URL` | compose içinde ayarlı | PostgreSQL bağlantısı |
| `SCRAPE_DIR` | `/tmp/lezzet-scrape` | Scraper'ın geçici çıktı klasörü. Host'ta ve worker'da aynı yol olmalı. |
| `SCRAPER_IMAGE` | test edilen sürümün digest'i | Scraper imajı. Çıktı formatına bağımlıyız; güncellemeden önce `fixtures/` ile karşılaştırın. |
| `TRUST_PROXY` | `0` | nginx gibi bir ters proxy arkasındaysan `1` yap: canlı arama limiti IP başına (5/dk) uygulanır. `0` iken tüm siteye ortak 30/dk. |
| `SCRAPER_DEPTH` | `2` | Arama sonuçlarında kaç kez aşağı kaydırılacağı |
| `SCRAPER_EXTRA_DOCKER_ARGS` | boş | Scraper container'ına eklenecek `docker run` argümanları, ör. proxy için `-e HTTPS_PROXY=http://...` |

### Google engellemesi

Çok yoğun taramada Google IP'yi geçici olarak engelleyebilir. Worker art arda 3 hata alırsa beklemeye geçer (1 → 2 → 4 … en fazla 10 dk). Kalıcı çözüm için scraper'a proxy verebilirsin: `SCRAPER_EXTRA_DOCKER_ARGS="-e HTTPS_PROXY=http://kullanici:sifre@proxy:port"`.

> ⚠️ Google Maps'ten veri çekmek Google'ın kullanım şartlarına aykırı olabilir. Bu riski bilerek kullanın.

## Geliştirme

```bash
docker compose up -d db
npm install
cp .env.example .env.local      # DATABASE_URL vb.
npm run migrate
npm run dev                     # http://localhost:3000
npm run worker                  # ayrı terminalde
```

Testler:

```bash
npm test          # birim + veritabanı testleri (db servisi açık olmalı)
npm run e2e       # tarayıcı testleri (örnek verilerle, üretim build'i üzerinde)
```

Gerçek scraper ile uçtan uca test (`docker compose up` çalışırken):

```bash
FOOD=pizza npx playwright test -c e2e/real.config.ts
```

## Klasörler

- `src/app`: sayfalar (`/`, `/ara`, `/harita`, `/mekan/[id]`, `/favoriler`) ve API (`/api/places`, `/api/places/[id]`, `/api/jobs/[id]`)
- `src/lib`: arama, sıralama, açık/kapalı hesabı, scraper çıktısı okuma, veritabanı erişimi
- `src/worker`: kuyruktan iş alıp scraper'ı çalıştıran süreç
- `src/config`: yemek listesi (`foods.ts`) ve ilçeler. Yeni bir yemek eklemek için `foods.ts` dosyasına bir satır yeterli.
- `fixtures`: gerçek scraper çıktısından örnekler (testlerde kullanılır)
- `docs/superpowers`: tasarım dokümanı ve uygulama planı
