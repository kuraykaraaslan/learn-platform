# P15 — GIS ve mekânsal veri

**Efor:** ~5 gün · **Bağımlılık:** P14 (arketip) · **Sonrakiler:** P19, P21

## Neden

Koordinat hataları, şema denetiminden **geçen** hatalardır. `[41.0, 29.0]` ile
`[29.0, 41.0]` ikisi de geçerli JSON, ikisi de geçerli GeoJSON, biri İstanbul
biri Irak-İran sınırı. Korpusta bu sınıf hatayı ele alan tek ders yok —
`GIS`, `geospatial`, `PostGIS`, `EPSG` terimlerinin 412 derste eşleşmesi sıfır.

Bu kurs koordinatı bir sayı çifti değil, **taşıdığı referans sistemiyle
birlikte anlamlı bir değer** olarak öğretir. P19 (saha verisi) ve P21 (akıllı
altyapı) buraya geri başvuracak.

## Kapsam

**Kurs:** `gis-spatial-data` — "GIS & Spatial Data"
**Ders:** 14 · **id:** 441-454 · **bracket:** `1-3` ×2, `3-7` ×10, `7-10` ×2

> *Description:* "Coordinates, projections, spatial SQL and tiles for developers:
> what a lon/lat pair does not tell you, and the bugs that survive every schema
> check."

| id | Başlık | bracket |
|---|---|---|
| 441 | Coordinates Are Not Numbers: Geographic vs Projected | 1-3 |
| 442 | Axis Order: The lon/lat Swap That Passes Every Schema Check | 1-3 |
| 443 | EPSG Codes and Datums: What "WGS 84" Does Not Tell You | 3-7 |
| 444 | Web Mercator: The Projection Your Map Library Already Assumed | 3-7 |
| 445 | GeoJSON: Ring Winding, Closed Rings, and Invalid Geometry | 3-7 |
| 446 | Distance and Area on a Sphere: Haversine, Planar Error, and When Each Lies | 3-7 |
| 447 | Spatial Indexing Without a Spatial Extension: Bounding Boxes, Geohash, Quadkeys | 3-7 |
| 448 | PostGIS: The Geometry Type, the Index, and What the Extension Costs | 3-7 |
| 449 | Spatial SQL: Predicates, Joins, and the Query That Scans Everything | 3-7 |
| 450 | Tile Addressing: z/x/y, the TMS y-Flip, and the Map That Comes Out Mirrored | 3-7 |
| 451 | Vector Tiles: Zoom-Dependent Simplification and the Feature That Disappears | 7-10 |
| 452 | MBTiles and PMTiles: Packaging a Tileset as One File | 3-7 |
| 453 | MapLibre: Style Spec, Sources, and the Client-Side Budget | 3-7 |
| 454 | Rasters and DEMs: Sampling an Elevation Correctly | 7-10 |

**PostGIS ve Spatial SQL iki derse ayrıldı** (448/449): biri uzantının ne
getirdiği ve neye mal olduğu, diğeri sorgunun kendisi. İkisi de Run düğmesi
almıyor — sebebi aşağıda.

## Yapılacaklar

### `content/courses/gis-spatial-data/` *(yeni)*

14 ders + `manifest.json` (`{id, file, title, bracket, category}` — `minutes`
ve `prereqs` kullanılmaz). Ders şekli P14'ün arketipi.

### `modules/course_content/course_content.sections.ts` *(değişiyor)*

`built-environment` dalının `slugs`'ına `'gis-spatial-data'` eklenir.

### `scripts/generate-covers.ts` *(değişiyor)* + kapak

`SUBJECTS`'e giriş — yoksa script fırlatır (satır 86).

### `content/_runtime/seeds/asset_points.sql` *(yeni)*

447'nin `sql run` fence'leri için tohum: gerçek bir noktalar tablosu, btree
indeksli `lat`/`lon` ve bir `geohash` sütunu. **≤50 KB** (`run/missing-seed-file`
sınırı).

### `content/_verify/gis-spatial-data/450/` *(yeni)*

`proof`: aynı kutunun z/x/y, TMS ve quadkey adreslerinin yan yana basılması, ve
y-flip uygulanmadığında çıkan **yanlış** kutu. Saf Node, sıfır bağımlılık, tam
determinist — dersin iddiası ("haritanız dikey aynalanmış çıkar") böylece
yazarın değil koşunun iddiası olur.

### `content/_verify/gis-spatial-data/443/` *(yeni)*

Datum kayması büyüklük tablosu. Sıfır bağımlılık: Molodensky ya da sabit
7-parametreli Helmert ~40 satır saf matematik — ki dersin öğrettiği şey de bu.
**`proj4` kök bağımlılığı eklenmez**; gerçekten yetkili EPSG parametreleri
gerekirse bu, faz dosyasında gerekçelendirilmesi gereken ayrı bir karardır.

### Sabit korpus sayıları *(değişiyor)*

422 → **436**, üç dosyada: `course_content.sections.test.ts:52`,
`course_content.service.test.ts:46`, `remark-lesson-refs.test.ts:30`.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 442 | `ts run` | lon/lat takasının sonucu sayı olarak basılır — dersin tamamı bu |
| 444 | `ts run` | Mercator ileri/geri dönüşüm, saf matematik |
| 445 | `ts run` | Ayakkabı bağı (shoelace) ile sarım yönü + halka kapanış denetimi |
| 446 | `ts run` | Haversine vs düzlemsel hata, enleme göre |
| 447 | `ts run` + **`sql run`** | Geohash/quadkey kodlayıcı; sonra gerçek Postgres'te bbox ön-süzme ve `LIKE 'u09tv%'` önek indeksi, ikisinde de `EXPLAIN ANALYZE` |
| 450 | `ts run` + **`proof`** | z/x/y ⇄ TMS ⇄ quadkey dönüşümü; proof y-flip hatasını görünür kılar |
| 452 | `ts run` | MBTiles'ın `tiles(zoom_level, tile_column, tile_row)` şeması üzerinde adres hesabı — **`sql run` değil**: MBTiles SQLite, PGlite ise Postgres |
| 453 | `ts run` | Style spec'in `layers`/`sources` grafiğini gezip katman bütçesini sayan saf fonksiyon |
| 443 | **`proof`** | Datum kayması büyüklüğü, determinist |
| 441 | `mermaid` (1) | Kursun tek diyagramı |
| **448, 449** | **runtime yok** | Aşağıya bakınız |
| 451, 454 | runtime yok | Tile üretimi ve raster örnekleme |

**MBTiles SQLite'tır, PGlite Postgres.** 452 bir `sql run` fence'i alamaz;
şema düz `sql` fence'i olarak gösterilir, çalıştırılabilir olan kısım (adres
aritmetiği) `ts run`'a düşer. Bu, değişmez #5'in bu kurstaki ikinci uygulaması.

**MapLibre bir tarayıcı kütüphanesi.** 453'te harita render edilmez: ne `ts run`
import edebilir (`run/not-self-contained`), ne de P9 doğrulanmadan `run project`
merge edilebilir. Öğretilen şey style spec'in **veri modeli** ve katman/kaynak
bütçesi — ki asıl performans hatası da orada doğuyor.

### PostGIS'siz mekânsal SQL — dürüst çözüm

PGlite **PostGIS taşımıyor** (`@electric-sql/pglite`, uzantı paketi yok).
Değişmez #5 gereği taklit edilmez. Öğretim ikiye ayrılır ve **ikisi de daha iyi
ders olur**:

- **447 gerçek `sql run` alır**, çünkü öğrettiği teknikler PostGIS'ten önce de
  vardı ve ondan sonra da var olacak: btree indeksli `lat`/`lon` üzerinde bbox
  ön-süzme; o ön-süzmenin antimeridyende ve yüksek enlemde neden yanlış
  olduğu; ve `WHERE geohash LIKE 'u09tv%'` önek indeksi — üretimde mekânsal
  aramanın epeyce büyük bir kısmı böyle çalışıyor. Artefakt, iki şekil üzerinde
  `EXPLAIN ANALYZE` (ders 18'in usulü).
- **448 ve 449'un Run düğmesi yok ve bunu kendi nesirlerinde söylüyorlar.** Runtime'ın
  sınırını adıyla koyan bir cümle, gri bir düğmeden daha inandırıcıdır ve
  değişmezin kendisidir. Her `ST_*` çağrısı düz `sql` fence'i. Sayı gerekiyorsa
  (indeks seçiciliği, `ST_DWithin` vs bbox sonuç sayıları) `proof` ile
  hesaplanır ya da **sayı verilmez**.

P10'un kendi çerçevesi bunu destekliyor: *"PGlite mevcut içeriğe açılan bir
anahtar değil — yeni içerik yazmayı mümkün kılan bir araçtır."*

### `run project` — koşullu teslimat

Turf + proj4 bu korpusun en iyi `run project` adayları: saf JS, native eklenti
yok, `run/needs-native` denylist'inde değil. Ama **P9 tamamlanmadı** — pilotun
WebContainer boot'u hâlâ tarayıcıda doğrulanmamış.

**Sert kural: P9 doğrulanana kadar yeni `run project` fence'i merge edilmez.**
445 için bir turf fence'i (poligon geçerliliği + sarım) **yazılır ve koşullu
tutulur**; P9 aynı pencerede doğrulanırsa merge edilir, doğrulanmazsa P22'ye
tek satırlık notla ertelenir. Çalışmayan bir Run düğmesi ship edilmez.

## Kaynak kuralı

- EPSG kayıtları için **EPSG Dataset'in kendi kayıt sayfası** (kalıcı, ücretsiz);
  kod + sürüm yazılır.
- OGC spesifikasyonları ücretsiz ve kalıcı URL'li — doğrudan link, sürüm yazılı.
- PostGIS/PROJ dokümantasyonu **sürüm sabitlenerek** anılır (`PostGIS 3.4`),
  "latest" linki verilmez.
- Further Reading madde sayısı 3-5 arasında **gerçekten değişir**
  (`sources/quota-signature`).

## Kabul kriterleri

- [ ] 14 ders + manifest; `shape/*` sıfır bulgu; 14'ü de `stamp-verified.ts`
      ile damgalı
- [ ] `parseMistakes` bu 14 derste **0 `single`** madde raporluyor
- [ ] `asset_points.sql` ≤50 KB; 447'nin `sql run` fence'leri PGlite'ta gerçekten
      koşuyor ve `EXPLAIN ANALYZE` çıktısı üretiyor
- [ ] **448 ve 449'da hiçbir `run` işareti yok** ve nesirleri PostGIS'in bu
      runtime'da bulunmadığını açıkça söylüyor
- [ ] **452'de `sql run` yok** — MBTiles SQLite; şema düz `sql` fence'i
- [ ] **453'te harita render eden bir fence yok**; öğretilen şey style spec'in
      veri modeli
- [ ] 450'nin `proof` bloğu damgalı, sıfır bağımlılık, iki koşuda byte-aynı
- [ ] 443'ün `proof` bloğu damgalı, workspace **sıfır bağımlılık**,
      `stamp-verify.ts --check` yeşil
- [ ] `run project` fence'i **ya P9 doğrulandığı için merge edildi ya da hiç
      merge edilmedi** — gri düğme yok
- [ ] Üç sabit korpus sayısı 422 → **436**
- [ ] `content:stats-check` "0 disagree" (`## Alan bloğu` dahil)
- [ ] `parse-snapshot.json` +14 ders; `content:snapshot-diff` %100 EXPLAINED
- [ ] `git diff --exit-code -- content/_reports` temiz
- [ ] `npm run content:check` + `lint` + `build` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| PostGIS'siz kurs eksik hissettirir | 447/448/449 üçlüsü eksiklik değil, bilinçli bir ders dizisi; sınır nesirde adıyla konur |
| MapLibre/MBTiles ders anlatımı vendor turuna döner | İkisi de **veri modeli** olarak öğretilir (style spec grafiği, tiles tablosu); UI turu yok, sürüm damgası var |
| Koordinat örnekleri uydurma yer adlarına bağlanır | Örnek koordinatlar ya hesaplanır (`ts run`) ya da kaynağı verilen açık veriden alınır; "yaklaşık İstanbul" gibi doğrulanamaz iddia yazılmaz |
| P9'a bağımlılık gizlice programa girer | Sert kural yukarıda; koşullu fence merge edilmezse P22'de tek satırlık not |
| Datum/EPSG parametreleri sürümle değişir | Sürüm + kayıt sayfası yazılır; hesaplanan her sayı `proof` ile üretilir, elle yazılmaz |
