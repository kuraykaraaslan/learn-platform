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
| `run project` (turf/proj4) | P9'un tarayıcı boot'u doğrulanmadıysa merge edilmedi — **bu fazda son karar verilir ve yazılır** |

### Lint kurallarının terfisi

Değişmez #6: kural `warn` doğar, korpus temizlenince `error`'a terfi eder.
Bu fazda değerlendirilir:

- `code/unverified-language` — **`warn` kalır.** Korpusta 10 `java` fence'i var
  ve bu program onları temizlemedi; kural yaratmadığı bir backlog'a takılamaz.
- `sources/*` warn'ları — yeni alanda sıfıra çekildiyse kaydedilir; korpus
  genelinde terfi ayrı bir karar.

## Kabul kriterleri

- [ ] Yeni kurslar arası ve mevcut korpusa çapraz `(#N)` bağları kuruldu;
      `links/dead-lesson-ref` **0 bulgu**, `links/unlinked-lesson-ref` 0 warn
- [ ] `npm run content:concepts` raporu okundu; **0 gölgeleme** (`shadowed`),
      0 `case-mismatch`; kalan `never-linked` kayıtların her birinin sebebi
      raporda yazılı ve doğru davranış
- [ ] `cap-starved` ders sayısı ölçüldü ve README'ye/bu dosyaya yazıldı
- [ ] Arama indeksi gz boyutu **ölçüldü ve yazıldı**; `MAX_INDEX_GZ_BYTES`
      altında, ya da gerekçesiyle ölçüme dayalı olarak yükseltildi
- [ ] Review indeksi boyutu raporlandı
- [ ] `Ölçülen zemin` + `Alan bloğu` + widget tabloları son değerlerinde;
      `npm run content:stats-check` **"0 disagree"**
- [ ] P13-P22 `Durum` hücreleri ölçülmüş kanıt taşıyor
- [ ] `## Ship etmediklerimiz` tablosu dolu; `run project` kararı yazılı
- [ ] Korpus **504 ders / 31 kurs**; üç sabit sayı da 504
- [ ] `npm run content:check`, `content:concepts-check`,
      `content:verify-mermaid`, `stamp-verify --check`, `npm run lint`,
      `npm run build` yeşil
- [ ] `git diff --exit-code -- content/_reports` temiz

## Risk

| Risk | Azaltma |
|---|---|
| Kavram gölgelemesi okurun gördüğü yanlış tooltip üretir | P3'ün `BASE` vakası emsal; sebebe göre rapor + gölgeleme taraması bu fazın kabul kriteri |
| Arama indeksi bütçeyi aşar ve build kırılır | Bu fazda ölçülür; aşılırsa sınır **ölçümle** yükseltilir, tahminle değil |
| Çapraz bağlar "mavi çorba" üretir | `(#N)` bağı yalnız gerçekten dayanılan derse; kavram linki bütçesi (4/ders) zaten sert sınır |
| Ship edilmeyenler kayıtsız kalır, altı ay sonra yeniden tartışılır | `## Ship etmediklerimiz` tablosu gerekçeleriyle bu dosyada |
