# Kategori görselleri için prompt'lar

20 yemeğin hepsi **aynı stilde** üretilmeli; ana sayfadaki kutucuklarda yan yana duruyorlar. Her prompt aynı stil cümlesiyle başlıyor, sadece yemek kısmı değişiyor.

**Teknik istekler**
- Kare (1:1), en az 1024×1024
- **Şeffaf arka plan** (PNG). Araç şeffaflığı desteklemiyorsa düz beyaz arka plan da olur; ben temizlerim.
- Yazı, logo, tabak deseni olmasın; tek obje ortada dursun.
- Dosya adı yemeğin kısa adı olsun: `cigkofte.png`, `lahmacun.png` … (aşağıdaki başlıklar)

**Araçlara göre**
- **ChatGPT / DALL·E:** Prompt'u olduğu gibi yapıştır, sonuna "transparent background PNG" ekle.
- **Midjourney:** Sonuna `--ar 1:1 --style raw --v 7` ekle. İlk görseli beğenince `--sref <ilk görselin linki>` ile diğerlerini aynı stilde üret.
- **Leonardo / Ideogram:** Prompt'u yapıştır, "Transparent background" seçeneğini aç.

**Ortak stil cümlesi** (her prompt'un başında var):
> 3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1

---

### cigkofte
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish çiğ köfte — four hand-squeezed oval spicy red bulgur patties with finger marks, on a fresh crisp lettuce leaf, a lemon wedge and a sprig of parsley beside them
```

### lahmacun
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish lahmacun — a thin round crispy flatbread with a thin layer of red minced-meat topping, a little parsley and onion and a lemon wedge on top
```

### pide
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish pide — a boat-shaped golden flatbread with twisted ends, filled with melted kaşar cheese and minced meat, brushed with butter
```

### doner
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish döner — a small vertical rotisserie cone of browned layered meat on a skewer, with a few thin sliced pieces falling beside it
```

### kebap
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish Adana kebab — a long minced-meat kebab on a flat metal skewer, with a charred grilled tomato and a long green pepper next to it
```

### iskender
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish İskender kebab — thin döner slices over cubes of pide bread, glossy tomato sauce poured on top, a scoop of white yogurt on the side, melted butter drizzle, on a small round plate
```

### kofte
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish ızgara köfte — five small oval grilled meatballs with grill marks, a grilled green pepper and a slice of tomato beside them
```

### hamburger
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: a classic cheeseburger — sesame bun, juicy beef patty, melted cheddar, lettuce, tomato and red onion
```

### pizza
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: a single triangular slice of pizza with stretchy melted mozzarella, tomato sauce, basil leaves and a puffy charred crust
```

### tantuni
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish tantuni — a thin lavash wrap rolled tight and cut in half, showing finely chopped stir-fried beef with diced tomato and parsley inside
```

### kokorec
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish kokoreç sandwich — a half loaf of crusty bread filled with finely chopped crispy grilled kokoreç sprinkled with oregano and red pepper flakes, a pickled pepper on the side
```

### midye
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish midye dolma — three glossy black mussel shells, one open showing spiced rice filling, with a lemon wedge
```

### balik
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: a whole grilled sea bass with crispy silver skin and grill marks, lemon slices and a few arugula leaves beside it
```

### manti
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish mantı — a small bowl of tiny meat-filled dumplings covered with white garlic yogurt, drizzled with red pepper butter and sprinkled with dried mint
```

### esnaf-lokantasi
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish home-style lokanta meal — a small copper bowl of kuru fasulye bean stew in tomato sauce next to a small mound of buttery pilaf rice
```

### kahvalti
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish breakfast — a sesame simit ring, a tulip-shaped glass of red Turkish tea on a small saucer, a few olives and a cube of white cheese
```

### borek
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish börek — a square slice of flaky layered golden pastry with visible thin layers and a white cheese and parsley filling, sprinkled with black sesame seeds
```

### sushi
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: two salmon nigiri sushi pieces and one maki roll, with a small mound of wasabi and pickled ginger
```

### tatli
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish baklava — three diamond-shaped pieces of golden flaky baklava glistening with syrup, topped with bright green ground pistachio
```

### kumpir
```
3D clay-style food icon, soft studio lighting, three-quarter top-down angle, single dish centered with generous empty space around it, warm natural colors, smooth rounded shapes, subtle soft shadow under the object, isolated on a transparent background, no text, no logo, no table, app category icon, 1:1. Subject: Turkish kumpir — a large baked potato split open and mashed with butter and cheese, loaded with colorful toppings: corn, pickles, olives, red cabbage and sausage slices
```
