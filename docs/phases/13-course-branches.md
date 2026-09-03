# P13 — Kurs dalları: genişletilebilir bölüm mekanizması

**Efor:** ~1 gün · **Bağımlılık:** yok · **Sonrakiler:** P14

## Neden

Ana sayfa iki dal gösteriyor ve dal listesi tek bir dosyada duruyor —
`course_content.sections.ts`. Tasarımı doğru: manifest'lere `section` anahtarı
serpiştirmek yerine bölünme tek bir gözden geçirilebilir dosyada. Ama dal
kimliği **veriden türetilmiyor**, elle bakılan bir union olarak yanında
duruyor:

```ts
export type CourseSectionId = 'engineering' | 'business';
```

P14 üçüncü bir dal açacak (yapılı çevre, 8 kurs) ve sonrasında başka dallar da
gelebilir. Bugünkü hâliyle her yeni dal **iki yerde** düzenleme istiyor — bir
nesne literali ve bir union — artı `sections.test.ts`'te id'leri adıyla sayan
bir regex. İkisi de sessizce eskiyen türden: union'ı güncellemeyi unutan kişi
bir tip hatası alır (iyi), regex'i unutan kişi **yeşil bir test** alır (kötü).

Bu faz o mekanizmayı düzeltir. **Sıfır içerik, sıfır snapshot hareketi, sıfır
istatistik hareketi** — davranış birebir aynı kalır. Ayrı bir faz olmasının
sebebi tam da bu: P14'ün 10 dersinin altına gömülmüş bir tip refaktörü gözden
geçirilemez, tek başına gözden geçirilebilir.

## Zemin — ölçüldü

Üçüncü dalı ekleyecek olan kişinin bilmesi gereken tek şey, kaç yerin "tam
olarak iki dal" varsaydığı. Sayıldı — `Record<CourseSectionId, …>` deseni
repoda **hiç yok** (`app/`, `modules/`, `scripts/` tarandı):

```
CourseSectionId union'ı                   : 1 yer   (sections.ts:12)
id'leri adıyla sayan test regex'i         : 1 yer   (sections.test.ts:63)
COURSE_SECTIONS üzerinde yapısal iterasyon: 4 yer   (service.ts:104,131 · test)
tip olarak import                         : 2 yer   (types.ts:39,48)
UI'da dal sayısı varsayan satır           : 0 yer
```

`ui/CourseCatalog.tsx:80` zaten `sections.map(...)` ile dönüyor ve grid her
bölümün **kendi içinde** tanımlı (`sm:grid-cols-2 lg:grid-cols-3`). Üçüncü bir
dal, tek satır UI değişikliği olmadan doğru başlık, blurb ve grid ile render
olur. Yani bu faz bir UI işi değil, bir **tip ve test** işidir.

Tek gerçek bağlantı konumsal: `app/(frontend)/page.tsx:11` sitenin birincil
çağrısını `sections[0]?.courses[0]` ile kuruyor. Dal **sona** eklendiği sürece
güvenli; başa eklenirse ana sayfanın "buradan başla"sı sessizce değişir. Bu,
bir yorumla değil bir testle korunur (aşağıda).

## Yapılacaklar

### `modules/course_content/course_content.sections.ts` *(değişiyor)*

Dizi gerçeğin kaynağı olur, union ondan türer:

```ts
export type CourseSectionDef = {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  /** Course slugs, in the order they should appear under this branch. */
  readonly slugs: readonly string[];
};

export const COURSE_SECTIONS = [ … ] as const satisfies readonly CourseSectionDef[];

/** Derived from the data, not maintained beside it. Adding a branch is one
 *  object literal — this union follows. */
export type CourseSectionId = (typeof COURSE_SECTIONS)[number]['id'];

export const COURSE_SECTION_IDS: readonly CourseSectionId[] =
  COURSE_SECTIONS.map((s) => s.id);
```

İki tip inceliği — ikisi de mevcut tüketicilere karşı doğrulandı, ikisi de
naif yazımda derleme hatası verir:

1. `slugs` bugün `string[]`. `as const` altında her `slugs` bir
   `readonly [...]` tuple'ı olur ve **mutable `string[]`'e atanamaz** — iki
   mevcut dalda birden `satisfies` patlar. `readonly string[]` olmalı.
2. `sectionForCourse` bugün `section.slugs.includes(slug)` yapıyor. Literal
   tuple'ın `includes`'ı kendi parametresini üyelerinin union'ına daraltır ve
   düz bir `string`'i **reddeder** (TS2345). Cast eklemek yerine `.some()`:

```ts
export function sectionForCourse(slug: string): CourseSectionId | null {
  for (const section of COURSE_SECTIONS) {
    // .some(), not .includes(): a literal-tuple `includes` narrows its own
    // parameter to the union of its members and rejects a plain string.
    if (section.slugs.some((s) => s === slug)) return section.id;
  }
  return null;
}
```

Dosyanın başındaki "two-track split" yorumu da düzeltilir — dal sayısı artık
dosyanın iddiası değil.

### `modules/course_content/course_content.sections.test.ts` *(değişiyor)*

**Değişen:** `expect(course.section).toMatch(/^(engineering|business)$/)`
(satır 63) → `expect(COURSE_SECTION_IDS).toContain(course.section)`. Id'leri
adıyla sayan bir regex, bu fazın kaldırdığı desenin ta kendisi.

**Kalan** (hepsi zaten genelleşiyor): her kurs tam olarak bir dalda; aynı kurs
iki dalda değil; yalnız var olan kurslara atıf; `sectionForCourse` gidiş-dönüş;
`listCourseSections` beyan edilen sırayı koruyor.

**Eklenen beş iddia** — bunlar bir dalı *etiket* değil **okuma kitlesi** yapan
kuralların mekanik hâli:

```ts
it('gives every branch a unique id', …)
it('gives every branch a kebab-case id', …)          // /^[a-z][a-z0-9-]*$/
it('gives every branch a non-empty title and blurb', …)
it('never declares an empty branch', …)              // slugs.length > 0
it('never declares a branch smaller than three courses', …)
```

Sonuncusu bir yargıyı teste çeviriyor — P11'in `MIN_ANSWER_LENGTH = 15`'i
testte tutmasıyla aynı usul. İki kursluk bir "dal", dal kılığında bir konu
etiketidir.

Artı, konumsal bağlantının bekçisi:

```ts
it("keeps the home page CTA pointed at the first branch's first course", () => {
  expect(CourseContentService.listCourseSections()[0].id).toBe('engineering');
});
```

Bu test olmadan başa dal ekleyen kişi sitenin birincil çağrısını değiştirir ve
hiçbir şey fark etmez.

## Sert kural — bu fazda dal eklenmez

`built-environment` dalının nesne literali **P13'e girmez**, P14'e girer.
Sebebi mekanik: boş bir dal yukarıdaki "never declares an empty branch"
testini düşürür, ve düşürmese ana sayfada altı boş bir başlık render eder.
Mekanizma bu fazda, ilk kullanıcısı sonraki fazda.

## Kabul kriterleri

- [x] `CourseSectionId` artık elle yazılmıyor —
      `(typeof COURSE_SECTIONS)[number]['id']`'den türüyor; `sections.ts`'te
      `'engineering' | 'business'` dizisi dışında hiçbir yerde geçmiyor
- [x] `CourseSectionDef.slugs` `readonly string[]`, `satisfies` iki mevcut dalda
      da tutuyor — `npx tsc --noEmit` temiz
- [x] `sectionForCourse` `.some()` kullanıyor ve **cast içermiyor**; dönüş tipi
      hâlâ `CourseSectionId | null`
- [x] `sections.test.ts`'teki `/^(engineering|business)$/` regex'i kaldırıldı,
      yerine `COURSE_SECTION_IDS` kontrolü geldi
- [x] Beş yeni dal iddiası + CTA konum testi yeşil
- [x] `npm run content:check` yeşil
- [x] **Snapshot kımıldamadı** — `git diff --stat content/_reports/parse-snapshot.json`
      boş. Bu faz hiçbir markdown'a dokunmuyor; kımıldarsa refaktör davranış
      değiştirmiş demektir
- [x] `npm run content:stats-check` "0 disagree" — 27 satırın hiçbiri hareket
      etmedi
- [x] `npm run build` yeşil; ana sayfa iki dalı bugünkü sırayla, bugünkü
      görünümle render ediyor
- [x] **P14 eki — "asgari 3 kurs" kuralının istisnası yazılı.** P14'ün
      `built-environment` dalı tek kursla açılıyor ve P16'ya kadar üçe
      ulaşmıyor. Kural kaldırılmadı ve `it.todo` da yapılmadı: testte adı konmuş
      tek bir istisna listesi var (`UNDER_CONSTRUCTION`), ve yanındaki
      `keeps no finished branch on the under-construction list` testi istisnayı
      **kendi kendine iptal ettiriyor** — dal üçe ulaştığı anda giriş hâlâ
      oradaysa kırılıyor. Bu fazın risk satırının şartı ("gerekçeyle
      değiştirilir — sessizce aşılamaz") böyle karşılanıyor.

## Risk

| Risk | Azaltma |
|---|---|
| `as const` tüketicilerde beklenmedik daralma yaratır | Tüketici sayıldı: 4 yapısal iterasyon + 2 tip import; ikisi de readonly diziyle çalışıyor. `tsc --noEmit` kapısı |
| Refaktör davranış değiştirir | Snapshot ve stats-check ikisi de kımıldamamalı — bu fazın kabul kriteri "hiçbir şey olmadı" |
| Dal başına asgari 3 kurs kuralı ileride meşru bir dalı engeller | Kural bir testte, gerekçesiyle; gerçekten 2 kursluk bir dal gerekirse test gerekçeyle değiştirilir — sessizce aşılamaz |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Dal sayfası `/branches/<id>` | Bir dalın tüm kursları tek sayfada, uzun blurb ile | kapsam — ana sayfa zaten gösteriyor; ikinci liste yeni bilgi vermiyor |
| `CourseSectionDef`'e `icon`/`accent` | Dallar arası görsel ayrım | kapsam — kapaklar zaten görsel sistem; ikincisi erken |
| Okuyucuya göre dal sıralaması | İlgi alanına göre öne çıkan dal | kapsam — `ExperiencePicker` zaten bir tercih ekseni; ikincisi kararı zorlaştırır |
| 4. dal (Data & ML, Mobile, …) | Korpusun büyümesi | bağımlılık — kurslar yok; boş dal testi zaten engelliyor |
| Dal başına ilerleme göstergesi | — | `yasak` — değişmez #4 (tamamlanma yüzdesi yok) |
