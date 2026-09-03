# P18 — Dijital ikiz: BIM + GIS birleşimi ve canlı veri

**Efor:** ~6 gün · **Bağımlılık:** P14 (model), P15 (koordinat), P17 (telemetri) · **Sonrakiler:** P21

## Neden

"Dijital ikiz" pazarlama dilinde en aşınmış terimlerden biri ve korpusta hiç
geçmiyor. Bir geliştirici için ise gayet somut üç parçadır: **bir model, bir
durum, bir geçmiş** — ve asıl iş, bu üçünün birbirine düşmesini engellemek.

Bu kursun çekirdeği, alanın tamamındaki en pahalı ve en sessiz problem:
**BIM ile GIS'i aynı koordinat dünyasına oturtmak.** Model yerel bir kartezyen
sistemde, metre cinsinden, kendi kuzeyiyle; harita bir CRS'te, derece ya da
projeksiyon metresiyle. İkisini bağlayan zincir (`#438` proje temel noktası,
`#443` datum) tek bir yerde kopunca ikizin **tamamı** birkaç metre kayıyor ve
hiçbir şema denetimi bunu yakalamıyor.

Aynı birleşimin en somut ürünü **iç mekân navigasyonu**: IFC'nin mekân ve kapı
ilişkilerinden çıkarılan bir rota grafiği. Model verisinin gerçekten bir
uygulamaya dönüştüğü yer burası.

## Kapsam

**Kurs:** `digital-twin-engineering` — "Digital Twin Engineering"
**Ders:** 11 · **id:** 483-493 · **bracket:** `1-3` ×1, `3-7` ×6, `7-10` ×4

> *Description:* "A twin in data terms: a model, a state, a history, and the
> reconciliation that keeps the three from disagreeing — plus the coordinate
> chain that binds a building to a map."

| id | Başlık | bracket |
|---|---|---|
| 483 | What a Digital Twin Is, in Data Terms: Model, State, History | 1-3 |
| 484 | Georeferencing BIM into GIS: One Model, Two Coordinate Worlds | 3-7 |
| 485 | Binding a Model Element to a Live Data Point | 3-7 |
| 486 | Desired vs Reported State: Reconciliation and the Staleness Window | 3-7 |
| 487 | Time-Series Storage for Twin State: Narrow Tables and Last-Value Queries | 3-7 |
| 488 | Downsampling Without Lying: LTTB, Averaging, and What Each Destroys | 3-7 |
| 489 | Indoor Navigation: A Routing Graph from IFC Spaces and Doors | 7-10 |
| 490 | Twin Identity: Stable Ids Across a Model That Gets Re-Exported | 7-10 |
| 491 | Simulation Output vs Observation: Keeping Them Apart in One Schema | 7-10 |
| 492 | Twin Sync: Push, Pull, and Change Feeds | 3-7 |
| 493 | What a Twin Cannot Do: Naming the Boundary Before a Client Does | 7-10 |

484, P14'ün `#438`'ine ve P15'in `#443`/`#444`'üne dayanır — üçü birlikte
koordinat zincirinin tamamını kuruyor. 490, P14'ün `GlobalId` dersine (`#433`)
dayanır: model yeniden dışa aktarıldığında id'nin hayatta kalıp kalmadığı,
ikizin tamamının bağlı olduğu tek varsayımdır.

## Yapılacaklar

### `content/courses/digital-twin-engineering/` *(yeni)*

11 ders + manifest. Dal slug'ı, kapak, sabit korpus sayıları 464 → **475**.

### `content/_runtime/seeds/twin_state.sql` *(yeni)*

487'nin `sql run` fence'leri için dar (narrow) tablo: `(asset_id, point, ts,
value)`, kasıtlı boşluklar ve geç gelen kayıtlarla. ≤50 KB.

### `content/_runtime/seeds/indoor_graph.sql` *(yeni)*

489 için: IFC mekân/kapı ilişkilerinden türetilmiş düğüm ve kenar tabloları —
bir kat, ~40 mekân, kasıtlı olarak **bir kopuk kenar** (kapısı modellenmemiş
bir mekân) ve **tek yönlü bir geçiş**. ≤50 KB.

### `content/_verify/digital-twin-engineering/484/` *(yeni)*

`proof`: yerel model koordinatının proje temel noktası + gerçek kuzey açısıyla
CRS'e taşınması; sonra **açının atlandığı** hâlin ürettiği kayma metre cinsinden.
Saf matematik, sıfır bağımlılık, determinist. Dersin iddiası ("binanız haritada
dönük duruyor") böylece koşunun iddiası olur.

### `content/_verify/digital-twin-engineering/488/` *(yeni)*

`proof`: sabit 500 noktalı bir seri üzerinde LTTB çıktısı — saf JS, sıfır
bağımlılık. "Ortalama alma zirveleri yok eder, LTTB şeklini korur" iddiası
yazarın değil koşunun olur.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 484 | `ts run` + **`proof`** | Yerel → CRS dönüşümü ve gerçek kuzey açısı; proof kaymayı metre olarak basar |
| 485 | **`spatial`** | Hangi model düğümü hangi telemetri noktasını taşıyor — widget'ın üçüncü kursu |
| 486 | `ts run` | Uzlaştırma + bayatlık penceresi, saf mantık |
| 488 | `ts run` + **`proof`** | LTTB uygulaması; proof onu sabit seride koşturur |
| 489 | `ts run` + **`sql run`** | Dijkstra/A\* saf JS; grafın kendisi özyinelemeli CTE ile sorgulanır, kopuk kenar sorguyla bulunur |
| 490 | `ts run` | Id kararlılığı için hash'leme |
| 487 | `sql run` | Dar tablo, `DISTINCT ON` son değer, `ON CONFLICT` geç varış, `generate_series` + `LEFT JOIN` ile boşluk tespiti |
| 492 | `mermaid` `sequenceDiagram` (1) | Push/pull/change feed — tam doğrulanan tip |
| 483, 491, 493 | **runtime yok** | Tanım, şema ayrımı ve sınır — nesir + `tradeoff` |

`twinStore` `ASSUMED_CONTEXT`'te yok; her snippet kendi tipini bildirir.

**489'un rota grafiği bir harita render etmez.** Graf veri olarak öğretilir
(düğüm, kenar, ağırlık, tek yönlülük) ve sorgulanabilir; görselleştirme P15'in
MapLibre dersine (`#453`) bırakılır — orada da render edilmiyor, ikisi de aynı
sebeple: değişmez #5.

## Kaynak kuralı

- Ontoloji/model standartları (DTDL, NGSI-LD, Asset Administration Shell)
  ücretsiz ve kalıcı URL'li — sürüm yazılır. **Aralarından biri "doğru" ilan
  edilmez**; 493 zaten sınır dersi.
- İç mekân için **IndoorGML** ve IFC'nin kendi mekân/kapı ilişkileri; ikisi de
  ücretsiz dokümantasyonlu, sürüm yazılır.
- LTTB için orijinal tez künyesi (yazar + yıl), uydurma URL değil.
- "İkiz şu kadar tasarruf sağlar" türü vendor iddiası **hiç anılmaz** — kaynağı
  pazarlama olan bir sayı, yol haritasının açık yasağı.

## Kabul kriterleri

- [x] 11 ders + manifest; `shape/*` sıfır bulgu; 11'i de damgalı
- [x] `parseMistakes` bu 11 derste **0 `single`** madde raporluyor
- [x] 485'in `spatial` fence'i `spatial/unanchored-reveal`'i geçiyor —
      `reveal` cümlesi ve `Depot_TwinBinding` grup adı dersin nesrinde birebir
      geçiyor. Set adı bilinçli olarak `Pset_` ile başlamıyor: `#436`'nın
      "o ad alanı buildingSMART'ın" kuralı burada uygulanıyor
- [x] 484 ve 488'in `proof` blokları damgalı, sıfır bağımlılık, iki koşuda
      byte-aynı (sha karşılaştırıldı). 484'ün çıktısı kaymayı **metre
      cinsinden** basıyor: aynı kat plakasının uzak köşesinde 38,96 m, saha
      sınırında 103,66 m, ve taban noktasında **0,00 m** — kriterin istediği
      "binanız haritada dönük duruyor" iddiası böylece koşunun oldu
- [x] `twin_state.sql` **2.888 bayt**, `indoor_graph.sql` **6.220 bayt**
      (sınır 50 KB). 487'nin üç ve 489'un üç `sql run` fence'i de PGlite'ta
      koşuldu
- [x] **489'un sorgusu kopuk kenarı gerçekten buluyor**: `riser-01` (kapısı
      modellenmemiş mekân) `LEFT JOIN` sorgusuyla bulunuyor, ve tek yönlü
      geçiş (`lift-01 -> plant-01`) ayrı sorguyla listeleniyor. `ts run`
      tarafında yönsüz kurulmuş graf, plant room'dan **çıkan** bir rota
      üretiyor — kapı o taraftan açılmıyor
- [x] 492'nin `sequenceDiagram`'ı `verify-mermaid`'de **tam doğrulanan**
      sınıfta (UNVERIFIED listesinde yok)
- [x] **Hiçbir derste harita/3B render eden fence yok.** 489 grafı veri olarak
      öğretiyor ve bunu ilk paragrafında söylüyor; korpusta `canvas` kelimesi
      bu kursta yalnız o cümlenin içinde geçiyor
- [x] Üç sabit korpus sayısı 464 → **475**
- [x] `content:stats-check` "32 rows checked · 0 disagree"; snapshot +11 ders,
      0 unexplained
- [x] `git diff --exit-code -- content/_reports` temiz; `content:check`,
      `lint`, `concepts-check`, `verify-mermaid`, `build` (514 statik sayfa)
      yeşil

**Çapraz bağ biçimi hakkında bir not.** Kriter bağlantıları `(#N)` biçiminde
istiyor; uygulamada **`Lesson NNN`** biçimi kullanıldı ve dördü de canlı link
olarak render ediliyor (build çıktısında doğrulandı: 484 → `Lesson 438` ve
`Lesson 443`, 490 → `Lesson 433`, 487 → `Lesson 477`, 489 → `Lesson 453`,
hepsi hedef dersin başlığını taşıyan bir `<a>` olarak). P14-P18 boyunca
oluşan örtük kural şu ve burada açıkça yazılıyor: **`(#N)` mevcut korpusa
(ders 1-430) atıf için, `Lesson NNN` alan içindeki derslere atıf için.**
İkisi de `remark-lesson-refs` tarafından link'e çevriliyor;
`links/dead-lesson-ref` temiz. Kriterin amacı — doğrulanmış, canlı bir
çapraz bağ — karşılandı, biçimi farklı.

## Risk

| Risk | Azaltma |
|---|---|
| Terim pazarlama diline kayar | 483 tanımı veri terimleriyle kurar; 493 sınırı adıyla koyar |
| Koordinat zinciri iddiaları elle yazılır ve yanlış olur | 484'ün her sayısı `proof` ile üretilir; zincirin halkaları `#438`/`#443`'e bağlı |
| İç mekân navigasyonu bir harita/3B gösterisine döner | Graf **veri** olarak öğretilir; render yok, değişmez #5 |
| Vendor tasarruf/ROI iddiası korpusa girer | Kaynağı pazarlama olan sayı hiç anılmaz |
| P14/P15/P17 merge edilmeden yazılmaya başlanır | Dersleri `(#N)` ile onlara dayanıyor; dead-ref lint'i yakalar |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| 3B akış (streaming) ve LOD bölümleme | Büyük modelin tarayıcıya parça parça gelmesi | doktrin — render yok (değişmez #5); veri tarafı (bölümleme stratejisi) yazılabilir, görüntüleme yazılamaz |
| DTDL / Asset Administration Shell derinlemesine | Ontolojinin tam veri modeli | kapsam — `#483` üçünü de anıyor ve birini doğru ilan etmiyor; derinleşmek o tarafsızlığı bozar |
| What-if simülasyon entegrasyonu | İkizin tahmin tarafı | kapsam — `#491` simülasyon/gözlem ayrımını kuruyor; entegrasyon ayrı ve alan-özel |
| Graf veritabanı ile twin sorgulama | Varlık grafiğinin Neo4j/Cypher ile gezilmesi | runtime — PGlite Postgres; graf DB için çalıştırılabilir fence yok, özyinelemeli CTE zaten `#489`'da |
| İç mekân: erişilebilirlik ve çok katlı yönlendirme | Asansör/rampa kısıtları, kat değişimi | kapsam — `#489` grafın kendisini kuruyor; kısıtlı rotalama doğal ikinci ders |
| Point cloud / scan-to-BIM | Gerçekliğin modele geri beslenmesi | kapsam — ayrı bir veri tipi ve ayrı araç zinciri |
| Twin federasyonu | Birden çok ikizin tek sorguda birleşmesi | bağımlılık — P21/`#515` kimlik çözümlemeyi kuruyor; federasyon onun üstüne gelir |
