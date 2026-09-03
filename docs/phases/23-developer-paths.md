# P23 — Developer path'leri: kurslar arası okuma sırası

**Efor:** ~3 gün · **Bağımlılık:** P14-P21 (id'lerin çözülmesi için) · **Sonrakiler:** yok

## Neden

Korpus bugün iki sıra tanıyor ve ikisi de **kurs içinde**: manifest id sırası
(kenar çubuğu ve genel bakış) ve P12'nin next/prev'i. Kurslar **arası** bir
sıra yok. Yol haritasının T1.1 teşhisi bunun kurs içi hâliydi — "20 kurs
bağımlılıkları ters sırayla öğretiyor" — ve düzeltildi; kurslar arası hâli
düzeltilmedi, çünkü o güne kadar buna ihtiyaç duyan bir okuma yolu yoktu.

Yeni alanla var. "BIM geliştiricisi olmak isteyen biri" 8 kursun 4'ünden
toplam ~14 derse ihtiyaç duyuyor: IFC'nin veri modeli (P14), Revit API ve
Design Automation (P16), ve modelin yeniden dışa aktarıldığında kimliğin
hayatta kalması (P18). Bugün bu okuyucu dört kurs kartına bakıp sırayı kendi
kurmak zorunda — ve kuramaz, çünkü hangi dersin hangisine dayandığını ancak
dersleri okuduktan sonra bilebilir.

**Path bir kürasyon, bir grafik değil.** Manifest'teki `prereqs?: number[]`
alanı şemada duruyor ve korpusta **hiçbir madde kullanmıyor**; bu fazda da
kullanılmıyor. Sebebi yol haritasının kendi uyarısı (T2.5): `teaches/requires/
unlocks` grafiği "412 kez muhakeme gerektirir ve bir model onları seve seve
uydurur". Dört elle yazılmış sıralı liste ucuz, denetlenebilir ve dürüsttür;
504 dersin bağımlılık grafiği değildir.

## Dal ile path'in farkı — karıştırılmamalı

```
dal  (branch, P13/P14) : katalog gruplaması. Bir kurs TAM OLARAK bir dalda.
                         Ana sayfada başlık + grid. Kapsayıcı ve ayrık.
path (bu faz)          : kurslar arası okuma sırası. Bir DERS birden çok
                         path'te olabilir, hiçbirinde de olmayabilir.
                         Ne kapsayıcı ne ayrık — küratörlü bir seçki.
```

Bir path, bir dalın alt kümesi değildir: Digital Twin path'i altı kurstan ders
topluyor. Bir ders hiçbir path'te olmayabilir ve bu bir kusur değildir — bir
path her şeyi listeleyince kürasyon olmaktan çıkar.

## Yapılacaklar

### `modules/course_content/course_content.paths.ts` *(yeni)*

Veri, `course_content.sections.ts` ile aynı gerekçeyle **tek bir gözden
geçirilebilir dosyada** durur — manifest'lere serpiştirilmez:

```ts
export type DeveloperPathDef = {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  /** Lesson ids in reading order. Globally unique, so no course qualifier. */
  readonly steps: readonly number[];
};

export const DEVELOPER_PATHS = [ … ] as const satisfies readonly DeveloperPathDef[];
export type DeveloperPathId = (typeof DEVELOPER_PATHS)[number]['id'];
```

P13'ün usulü birebir: id veriden türer, `slugs`/`steps` `readonly`, yeni bir
path **tek nesne literali**.

`pathsForLesson(id: number): DeveloperPathDef[]` — ders sayfasındaki rozet
için; saf fonksiyon, build zamanında çözülür.

### Dört path

Her biri **kurslar arası** olmak zorunda; tek bir kursun ders listesini
tekrarlayan bir path hiçbir şey eklemez. Adım sayısı **8-16** arasında.

| Path | Adım | Nereden topluyor |
|---|---:|---|
| `bim-developer` — "BIM Developer Path" | ~14 | `bim-ifc-data-models` + `autodesk-developer-platform` + `digital-twin-engineering`'den kimlik dersi |
| `gis-developer` — "GIS Developer Path" | ~12 | `gis-spatial-data` çekirdeği + `digital-twin-engineering`'den georeferans + `field-data-collection`'dan telefon koordinatları + `smart-infrastructure`'dan birim normalleştirme |
| `iot-engineer` — "IoT Engineer Path" | ~13 | `iot-telemetry-edge` + `digital-twin-engineering`'den zaman serisi ve downsampling + `smart-infrastructure`'dan olay sıralama |
| `digital-twin` — "Digital Twin Path" | ~16 | Altı kurs: BIM'den mekânsal yapı, GIS'ten CRS, IoT'den yutma, twin'in tamamı, varlık yönetiminden devir, akıllı altyapıdan kimlik çözümleme |

Adımların tam listesi faz uygulanırken yazılır ve **elle sıralanır** — bir
model tarafından üretilmez. Sıra, ders id'sinin artan sırası **olmak zorunda
değil**: bir path bilerek geriye referans verebilir (örneğin twin path'i
`#484` georeferansı `#443` datumundan sonra okutur).

### `modules/course_content/course_content.service.ts` *(değişiyor)*

`listPaths()`, `getPath(id)` — adımları gerçek `Lesson` özetlerine çözer ve
kursa göre gruplar. Çözülmeyen bir id **fırlatır** (`listCourses()`'un
sınıflandırılmamış slug'da fırlatmasıyla aynı duruş).

### `app/(frontend)/paths/page.tsx` ve `paths/[slug]/page.tsx` *(yeni)*

Dört path kartı; ve path sayfası: sıralı adımlar, her adım dersine link,
adımlar kurs adıyla gruplanmış. `generateStaticParams` ile dört statik sayfa —
ADR 0001'in statik üretim kararı korunur.

### `modules/course_content/ui/PathBadge.tsx` *(yeni)* + `LessonPage.tsx` *(değişiyor)*

Ders sayfasında **statik** bir satır: "Part of: BIM Developer Path · Digital
Twin Path", her biri path sayfasına link. Sunucu bileşeni, sıfır client JS,
sıfır state.

**Path içi next/prev eklenmez.** P12'nin next/prev'i manifest sırasını
izliyor; ikinci bir "sonraki" bağlantısı okuyucuya iki farklı doğru cevap
verirdi. Path sayfası zaten sıralı listeyi gösteriyor, ve hangi path'ten
gelindiğini bilmek bir state (query param ya da localStorage) gerektirirdi —
bu faz onu satın almıyor.

### Giriş noktası

Ana sayfada dal listesinin **üstünde** dört path kartı, tek satırlık bir
açıklamayla. Katalog (dal + kurs) yerinde kalır; path onun yerine geçmez,
önüne bir okuma önerisi koyar.

## Sert kural — ilerleme yüzdesi yok

Değişmez #4 bu fazda en kolay çiğnenecek yerde: 14 adımlı sıralı bir liste,
"3/14 tamamlandı" göstermek için davetiye çıkarır. **Eklenmeyecek:**

- adım sayacı, yüzde, ilerleme çubuğu
- tamamlandı işareti, tik, rozet
- `PersistedProgress`'e yeni anahtar

`progress.store.test.ts` anahtar kümesini zaten koruyor; bu faz o dosyaya
dokunmaz. Path sayfası **kimliksiz ve durumsuz**dur — herkes aynı sayfayı
görür. Çevrilen sayfayı ölçen bir metrik, bu projenin yok etmek için var
olduğu bilme yanılsamasını üretir.

## Kabul kriterleri

- [x] `DEVELOPER_PATHS` dört path taşıyor (`course_content.paths.ts`);
      `DeveloperPathId` veriden türüyor, elle yazılmış union yok — P13'ün
      `CourseSectionId` usulünün birebir kopyası
- [x] Adım sayıları **14 / 12 / 13 / 16** — hepsi 8-16 arasında, testle
- [x] **Her path ≥2 kurstan** ders topluyor: `bim-developer` 3, `gis-developer`
      4, `iot-engineer` 3, `digital-twin` 6 kurs — testle (`getPath().courseCount`)
- [x] Her adım id'si `resolvePathSteps`'te gerçek derse çözülüyor; çözülmeyen id
      **fırlatıyor** (build'i kırar) — `listCourses()`'un sınıflandırılmamış
      slug duruşuyla aynı
- [x] Path içinde tekrarlayan id yok, path id'leri tekil + kebab-case — testle
- [x] `pathsForLesson(id)` bir dersin **tüm** path'lerini döndürüyor; hiçbir
      path'te olmayan ders için `[]` (korpusun her dersi için test ediliyor)
- [x] `/paths` + dört `/paths/<slug>` `generateStaticParams` ile statik
      (`dynamicParams = false`); `npm run build` yeşil, 552 statik sayfa (547 + 5)
- [x] Ders rozeti (`PathBadge.tsx`), `PathsRail.tsx`, `PathPage.tsx` — üçü de
      **sunucu bileşeni**, `'use client'` yok; path için 0 byte yeni client JS
- [x] İlerleme yüzdesi / sayaç / tik **yok**; `progress.store.ts` ve
      `progress.store.test.ts` **hiç değişmedi** (`git diff modules/progress/` boş)
- [x] Path içi next/prev **eklenmedi**; ders sayfasında tek "sonraki" P12'nin
      manifest sıralı olanı. `PathPage` sadece sıralı listeyi gösteriyor
- [x] `prereqs` manifest alanı hâlâ **hiçbir yerde kullanılmıyor**
      (`grep -rn '\.prereqs' modules/ app/ scripts/` boş)
- [x] `parse-snapshot.json` **kımıldamadı** — bu faz hiçbir markdown'a dokunmadı
      (`git diff content/` boş)
- [x] `content:stats-check` "0 disagree"; `content:check` (309 test, +11),
      `lint`, `concepts-check` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Path, dal ile karışır | İkisi kod yorumunda ve UI'da farklı adlandırılır; dal kapsayıcı+ayrık, path küratörlü seçki — test "her path ≥2 kurstan" diyerek farkı zorunlu kılıyor |
| İlerleme yüzdesi eklenir (değişmez #4) | Kabul kriteri `progress.store.ts`'in **hiç değişmemesini** şart koşuyor; sayfa durumsuz |
| İki farklı "sonraki" okuyucuyu böler | Path içi next/prev eklenmiyor; gerekçe şartnamede yazılı |
| Path'ler her şeyi listeleyip kürasyon olmaktan çıkar | 8-16 adım sınırı testle; her şeyi isteyen okuyucu zaten kurs sayfasına gidiyor |
| Adım sırası bir modele üretilir ve uydurma bağımlılık kurar | Sıra elle yazılır; `prereqs` grafiği bilinçli olarak kullanılmıyor (T2.5'in uyarısı) |
| Ders silinince/yeniden numaralanınca path sessizce bozulur | Çözülmeyen id build'i kırıyor — `listCourses()`'un sınıflandırılmamış slug duruşuyla aynı |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Path içi ilerleme / yüzde / tik | — | `yasak` — değişmez #4; bu fazın kabul kriteri `progress.store.ts`'in hiç değişmemesini şart koşuyor |
| Path içi next/prev | Path sırasını izleyen gezinme | doktrin/kapsam — ikinci bir 'sonraki' okuyucuya iki doğru cevap verir; ayrıca 'hangi path'ten geldi' state gerektirir |
| Okuyucu tanımlı path | Kendi okuma listesini kurma (localStorage) | kapsam — kürasyonun değeri **yazarın** seçmesinde; kişisel liste ayrı bir ürün kararı |
| Path başına tahmini süre | Adımların `estimateMinutes` toplamı | kapsam — ucuz ve zararsız, ama sayaç/ilerleme algısına en yakın kalem; bilinçli olarak sonraya |
| Path'ten path'e öneri | Bitirenin sıradaki path'i | kapsam — 'bitirdi' bilgisi yok ve olmayacak (değişmez #4); öneri statik olarak yazılabilir |
| Path'e capstone bağlama | Path'in sonunda bir teslimat | bağımlılık — P22'nin capstone adayına bağlı |
