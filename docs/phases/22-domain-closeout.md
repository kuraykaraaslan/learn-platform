# P22 — Alan kapanışı: çapraz bağlar ve yeniden ölçüm

**Efor:** ~2 gün · **Bağımlılık:** P14-P21

## Neden

Sekiz kurs sekiz ayrı fazda, sekiz ayrı oturumda yazıldı. Her biri kendi içinde
tutarlı ve yeşil — ama **birbirine ve mevcut korpusa** bağlanmaları tek tek
fazların işi değil, çünkü bir faz kendinden sonrakine `(#N)` ile bağlanamaz:
o ders henüz yok.

Aynı şey ölçüm için de geçerli. Her faz kendi sayılarını güncelledi; program
bittiğinde **korpus %19 büyümüş** olacak (412 → 491) ve iki şey yeniden
ölçülmek zorunda: arama indeksi bütçesi ve kavram bağlama bütçesi. İkisi de
faz faz bakıldığında görünmeyen, toplamda patlayan türden.

Bu faz ayrıca **ship etmediklerimizi** kayda geçirir. Yazılmamış bir kararın
gerekçesi, altı ay sonra sıfırdan yeniden tartışılır.

## Yapılacaklar

### Çapraz bağlar — `(#N)` iki yönlü

Program boyunca bağlar **ileriye** kuruldu (P18 → P14, P21 → P15). Geriye
kalan iki iş:

1. **Yeni kurslar arası eksik bağlar.** Erken fazlar sonraki kurslara
   bağlanamadı: P14'ün `GlobalId` dersi P18'in kimlik dersine, P15'in koordinat
   dersleri P19'un GPS dersine, P17'nin zaman serisi dersi P18'in durum
   deposuna işaret etmeli.
2. **Mevcut korpustan yeni alana bağlar.** `#45` (TimescaleDB) → P17'nin
   saklama dersi; `#7` (idempotency) → P17/P19'un yutma dersleri; `#8`
   (webhook) → P16. Bu, yeni alanı korpusun kenarına asılı bir ek olmaktan
   çıkarıp içine bağlar.

Kural: `links/dead-lesson-ref` **error**, yani her `(#N)` gerçek bir derse
çözülmeli. `links/unlinked-lesson-ref` warn'ları da sıfıra çekilir.

### Kavram sözlüğü — `content/concepts.json` konsolidasyonu

Her faz kendi 3-4 terimini ekledi; toplamda ~30 yeni terim. Bu fazda:

- `npm run content:concepts` raporu **sebebe göre** okunur
  (`own-lesson-only` / `code-only` / `shadowed` / `case-mismatch` / `cap-starved`).
  P3'ün denetimi bu ayrımın gerçek hatalar bulduğunu gösterdi.
- **Gölgeleme (shadowing) taraması zorunlu.** Yeni alan kısaltma yoğun (`IFC`,
  `CRS`, `LOD`, `OT`, `QoS`) ve P3'ün `BASE` vakası tam olarak buydu: tamamı
  büyük harfli bir terim, sıradan İngilizce kelimeleri 18 derste sarmıştı.
  Yeni terimlerin hiçbiri mevcut bir terimi ya da sıradan bir kelimeyi
  yutmamalı; daha uzun ifade span'i kazanır.
- **Bütçe açlığı** (`cap-starved`) ölçülür: ders başına 4 link sınırı
  paylaşımlı, ve 79 yeni ders yeni terimlerle geldi. Sınıra dayanan ders sayısı
  raporlanır — karar verilmez, ölçülür (P3'ün usulü).

### Bütçelerin yeniden ölçümü

**Arama indeksi sert bir kapı:** `scripts/build-search-index.ts:33`
`MAX_INDEX_GZ_BYTES = 96 * 1024` ve aşılırsa build **kırılır**. P13 zemininde
64.207 B gz idi; +92 ders kabaca 79-84 KB gz'ye çıkarır — altında, ama marj
belirgin şekilde daralıyor. Bu fazda **ölçülür ve rakam README'ye yazılır**. Aşılırsa sınır
tahminle değil, ölçümle ve gerekçesiyle yükseltilir — dosyanın kendi
yorumundaki emsalin aynısı.

`build-review-index.ts`'in bütçe kontrolü yok; boyutu yine de raporlanır.

### `docs/phases/README.md` — son değerler

- `Ölçülen zemin` tablosunun `Bugün` sütunu son hâline getirilir.
- `Alan bloğu` tablosu (P14'te eklendi) son değerleriyle doldurulur.
- Widget tablosuna `spatial` satırının son sayısı yazılır.
- P13-P22 satırlarının `Durum` hücreleri, mevcut usulle **ölçülmüş kanıt**
  taşır — sıfat değil sayı ("8 kurs / 79 ders, `spatial` 6 derste").

`npx tsx scripts/corpus-stats.ts` çıktısındaki `measured` değerleri **birebir**
kopyalanır: `**kalın**` yıldızlar değerin parçası, yüzdeler Türkçe ondalık
virgüllü, `Ders / kurs / bölüm` değerin **içinde** kalın taşıyor.

### `## Ship etmediklerimiz` — bu faz dosyasının bir bölümü

Kayda geçen kararlar ve gerekçeleri:

| Ship edilmedi | Gerekçe |
|---|---|
| PostGIS runtime | PGlite taşımıyor; taklit değişmez #5'i çiğnerdi. 447/448 ayrımı bunun yerine geçti |
| `web-ifc` bağımlılığı | Proof workspace'i kökün `node_modules`'ından çözüyor → tarayıcıda hiç kullanılmayan bir kök bağımlılık; ayrıca sürüme bağlı çıktı damgayı kırar |
| `proj4` bağımlılığı | 443'ün datum matematiği ~40 satır saf JS; dersin öğrettiği şey zaten o |
| Python fence'leri | Hiçbir runtime koşamaz (ADR 0002), `verify-code` tiplemez, sürüme bağlı çıktı damgayı kırar. `code/unverified-language` sızmayı engelliyor |
| C# fence'leri için doğrulama | **Ship edildi ama denetimsiz.** Revit API yalnız C#/.NET; P16'nın ≤10 fence'i hiçbir tipleyiciden geçmiyor. Emsal: korpustaki 10 `java` fence'i. `code/unverified-language` bunları `warn` ile sayıyor — bu fazda **error'a terfi etmiyor**, çünkü korpus temiz değil. Sayı bu dosyada kayda geçer |
| Harita / 3B render | MapLibre (`#453`), iç mekân grafiği (`#489`) ve Viewer (`#465`) derslerinin hiçbiri render etmiyor: `ts run` import edemez, `run project` P9'a bağlı. Üçü de **veri modeli** olarak öğretiliyor |
| `run project` (turf/proj4) | **Karar: merge edilmedi.** P9'un `run project` boot'u hâlâ tarayıcıda doğrulanmadı (P9 satırı "boot hâlâ doğrulanmalı" diyor) ve program boyunca kimse doğrulamadı. Alan kurslarında **sıfır** `run project` fence'i var (korpus geneli 3, hepsi eski). GIS'in turf/proj4 fikri `#447`/`#448` ayrımıyla ve `#443`'ün saf-JS proof'uyla karşılandı; render dersleri (`#453`/`#465`/`#489`) veri modeli olarak öğretiliyor. WebContainer boot'u doğrulanınca ayrı bir faz olarak ele alınabilir |

### Lint kurallarının terfisi

Değişmez #6: kural `warn` doğar, korpus temizlenince `error`'a terfi eder.
Bu fazda değerlendirildi:

- `code/unverified-language` — **`warn` kaldı.** Korpusta 10 `java` + 9 C#
  fence'i var (`content-lint --strict` çıktısı: 19 `code/unverified-language`
  warn) ve bu program onları temizlemedi; kural yaratmadığı bir backlog'a
  takılamaz.
- `sources/*` warn'ları — **yeni alanda sıfır** (`content-lint.json` üzerinde
  ölçüldü: alan 8 kursunda `sources/*` bulgusu yok). Korpus genelinde terfi
  ayrı bir karar, bu fazın kapsamında değil.
- `drill/widget-on-unverified-lesson` — hâlâ `warn`, 2 bulgu kaldı (ders 114
  ve `iot-telemetry-edge/478`; ikisi de uzman pasosu bekleyen denylist
  dersleri). Alan programının eklediği 514/521 bu kurala takılmıyor çünkü
  `quiz`/`recall` taşımıyorlar.

## Ölçümler

Program bittiğinde (412 → 505 ders) yeniden ölçülen bütçeler:

| Ölçü | P13 zemini | P22 bitişi | Sınır | Durum |
|---|---:|---:|---:|---|
| Arama indeksi (gz) | 64.207 B | **77.393 B** | 98.304 B (`MAX_INDEX_GZ_BYTES`) | altında, ~21 KB marj — sınır **değişmedi** |
| Review indeksi (gz) | — | **201.160 B** (2.126 kart) | yok (bütçe kontrolü yok) | raporlandı |
| Kavram terimi | ~125 | **139** | ders başına 4 link (sert) | — |
| `cap-starved` ders | — | **2** (`functional-location` → 504, `index-bloat` → 104) | — | ölçüldü, karar yok (P3 usulü) |

Kavram raporu (`content:concepts`) sebebe göre: `shadowed` **0**, `case-mismatch`
**0**, `never-matched` **0**. Kalan `never-linked` 21 kayıt: `own-lesson-only`
6 (terim yalnız kendi dersinde geçiyor — beklenen), `code-only` 13 (terim
yalnız kod fence'inde — linklenmez), `cap-starved` 2. Hepsi doğru davranış.

Gölgeleme taraması: yeni alanın kısaltmaları (`IFC`, `CRS`, `LOD`, `OT`, `QoS`)
kontrol edildi — hiçbiri bir kavram terimi olarak eklenmedi; `global-id` (term
"GlobalId") ve `ifc` (term "IFC") P14'te eklenmişti ve `isAcronym` kuralı
gereği yalnız tam-büyük-harf yazımda eşleşiyor, sıradan kelime yutmuyor.

## Kabul kriterleri

- [x] Mevcut korpustan yeni alana 6 forward `(#N)` bağı kuruldu (Further
      Reading bülteni olarak): `#433`→`#490`, `#443`→`#497`, `#477`→`#487`,
      `#45`→`#477`, `#7`→`#475`, `#8`→`#466`. Yeni kurslar arası geriye
      bağlar zaten kuruluydu (`#490`→`#433` 16 kez, `#487`→`#477`, `#497`→`#441`,
      `#499`→`#442`). `links/dead-lesson-ref` **0**, `links/unlinked-lesson-ref`
      **0 warn** (zaten sıfırdı, bozulmadı)
- [x] `content:concepts` raporu okundu; `shadowed` **0**, `case-mismatch` **0**,
      `never-matched` **0**; 21 `never-linked` kaydın her biri açıklandı
      (`## Ölçümler`) ve doğru davranış
- [x] `cap-starved` = **2**, bu dosyaya yazıldı (`## Ölçümler`)
- [x] Arama indeksi **77.393 B gz** ölçüldü ve yazıldı; `MAX_INDEX_GZ_BYTES`
      (98.304 B) **altında**, ~21 KB marj — sınır değişmedi
- [x] Review indeksi **201.160 B gz** (2.126 kart) raporlandı
- [x] `Ölçülen zemin` + `Alan bloğu` + widget tabloları son değerlerinde
      (P20/P21'de güncellendi); `content:stats-check` **"32 rows checked · 0 disagree"**
- [x] P13-P22 `Durum` hücreleri ölçülmüş kanıt taşıyor (ders/id aralığı, seed,
      proof, damga sayısı)
- [x] `## Ship etmediklerimiz` tablosu dolu; `run project` kararı yazılı (merge
      edilmedi — alan kurslarında sıfır `run project` fence'i)
- [x] Korpus **505 ders / 31 kurs** (şartname 504/31 diyordu — +1 fark P16'nın
      sonradan eklenen `#523` dersi; üç sabit test sayısı da 505)
- [x] `content:check`, `content:concepts-check`, `content:verify-mermaid`
      (25 fence, 16 ok, 9 unverified — hepsi DOM), `stamp-verify --check`
      (23/23 ok), `lint`, `build` (547 statik sayfa) yeşil
- [x] `content:reports` sonrası tekrar koşumda `content/_reports` farkı yok

## Risk

| Risk | Azaltma |
|---|---|
| Kavram gölgelemesi okurun gördüğü yanlış tooltip üretir | P3'ün `BASE` vakası emsal; sebebe göre rapor + gölgeleme taraması bu fazın kabul kriteri |
| Arama indeksi bütçeyi aşar ve build kırılır | Bu fazda ölçülür; aşılırsa sınır **ölçümle** yükseltilir, tahminle değil |
| Çapraz bağlar "mavi çorba" üretir | `(#N)` bağı yalnız gerçekten dayanılan derse; kavram linki bütçesi (4/ders) zaten sert sınır |
| Ship edilmeyenler kayıtsız kalır, altı ay sonra yeniden tartışılır | `## Ship etmediklerimiz` tablosu gerekçeleriyle bu dosyada |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Alan capstone'u | Sekiz kursun tek bir uçtan uca teslimatta birleşmesi — T2.4'ün usulüyle: brief, deliverable, rubric, mühürlü referans çözüm | kapsam — T2.4 capstone'u 5 kurs için tasarlandı ve hiç uygulanmadı; alan capstone'u o karardan sonra |
| Alan cheat sheet / yazdırma paketi | Kurs başına iki statik route + `@media print` | kapsam — Tier 3 kalemi, korpusun tamamı için düşünülmüştü; alan için ayrı yapılmaz |
| `code/unverified-language`'ın `error`'a terfisi | C#/java fence'lerinin sıfırlanması | bağımlılık — korpusta 10 `java` + P16'nın ≤10 C# fence'i duruyor; kural yaratmadığı backlog'a takılamaz |
| Türkçe ders katmanı | — | `yasak` — yol haritasının açık maddesi: 412→824 sayfa, `sourceHash` drift, ve bayat bir çeviri çevirisizlikten kötü |
