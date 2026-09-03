# P14 — BIM / IFC veri modelleri + `spatial` widget

**Efor:** ~6-7 gün · **Bağımlılık:** P13 · **Sonrakiler:** P15, P16, P17, P19, P20

## Neden

Korpus 412 derste yazılım işinin iki dalını kapsıyor: mühendislik zanaatı ve
o zanaatın işe çevrilmesi. **Fiziksel varlıklar hakkında yazılım yazan**
geliştirici için tek bir ders yok. Ölçüldü, tahmin edilmedi — 412 dersin ham
metninde eşleşme sayısı:

```
BIM · GIS · IFC · Revit · digital twin · Autodesk        : 0
geospatial · PostGIS · MQTT · COBie · buildingSMART      : 0
CAD · SCADA · cadastre · surveying                       : 0
IoT                                                      : 3  (üçü de konu dışı)
"construction"                                           : 13 (hepsi İngilizce deyim:
                                                            "impossible by construction")
```

Yani bu bir zenginleştirme değil, **yeni bir alan açma** işi. P14 o alanın ilk
kursunu, dalını ve arketipini birlikte ship eder: sonraki yedi kurs bu dersleri
taklit edecek, spesifikasyonu değil. (T1.5'in altın ders gerekçesi: *"Yazarlar
ve modeller spesifikasyonu değil örneği taklit eder."*)

IFC'nin ilk olmasının sebebi bağımlılık: GlobalId, mekânsal hiyerarşi ve
property set kavramlarına APS (nesne ağacı), Digital Twin (bağlama) ve Asset
Management (devir) derslerinin hepsi geri başvuracak.

## Kapsam

**Kurs:** `bim-ifc-data-models` — "BIM & IFC Data Models"
**Ders:** 10 · **id:** 431-440 · **bracket:** `1-3` ×2, `3-7` ×7, `7-10` ×1

> *Description:* "The IFC data model as a developer meets it: a text file, a
> schema, a hierarchy, and the relationships that decide where an element lives."

| id | Başlık | bracket |
|---|---|---|
| 431 | IFC as a File Format — STEP Physical File and the EXPRESS Schema | 1-3 |
| 432 | Parsing IFC Without a Library: Entity Lines, References, Forward Declarations | 3-7 |
| 433 | GlobalId — IFC's 22-Character GUID, and What Breaks It | 3-7 |
| 434 | The Spatial Hierarchy: Project → Site → Building → Storey → Space | 1-3 |
| 435 | Containment, Aggregation, Voiding: The Relationship That Puts an Element Somewhere | 3-7 |
| 436 | Property Sets and Quantity Sets: Where a Value Actually Lives | 3-7 |
| 437 | Units, Precision, and the Local Placement Chain | 3-7 |
| 438 | Project Base Point, Survey Point, True North: Georeferencing a Model | 3-7 |
| 439 | IFC in a Relational Database: Entities, Psets, and the Join You Will Regret | 3-7 |
| 440 | Model Diffing: Deciding What Actually Changed Between Two Exports | 7-10 |

Ders şekli korpusun kuralı: altı `##` bölümü, `Key Concepts`
`- **Term**: tanım` listesi, `quiz` `## What It Is` içinde, `recall` dosyanın
sonunda. **Common Mistakes maddeleri doğuştan `- **lead** — body`** formunda —
P2'nin 29 PR'da temizlediği `single` formu yeniden üretilmez.

## Yapılacaklar

### `modules/course_content/course_content.sections.ts` *(değişiyor)*

Üçüncü dal, P13'ün mekanizmasının ilk kullanıcısı — **tek nesne literali**,
diziye **sona** eklenir (`sections[0]` ana sayfanın CTA'sı, P13'ün testi bunu
koruyor):

```ts
{
  id: 'built-environment',
  title: 'The built environment',
  blurb: "Software for physical assets: model formats, coordinates, telemetry, and keeping an asset's data true after handover.",
  slugs: ['bim-ifc-data-models', /* P15-P21 kendi slug'ını ekler */],
}
```

Dal P13'ün "asgari 3 kurs" testini P16'ya kadar geçmez. Bu yüzden o test,
dalın **beyan edilen** slug listesine değil `content/courses/` altında **var
olan** dizinlere bakar; P14-P15 boyunca dal 1-2 kursla yaşar ve testi geçer —
ya da test P16'ya kadar `it.todo` bırakılır. **Hangisi seçildiyse P13'ün
kabul kriterinde yazılı olmalı**, sessizce gevşetilmemeli.

### `content/courses/bim-ifc-data-models/` *(yeni)*

10 ders + `manifest.json`. Manifest yalnız `{id, file, title, bracket,
category}` taşır — `minutes` ve `prereqs` şemada var ama korpusta **hiçbir
manifest** kullanmıyor, yeni kurs de kullanmaz. `verified` faz sonunda
`stamp-verified.ts` tarafından yazılır, elle **değil**.

### `scripts/generate-covers.ts` *(değişiyor)* + `public/covers/bim-ifc-data-models.webp`

`SUBJECTS`'e slug için bir giriş eklenmezse script **fırlatır** (satır 86).
Kapak üretimi `OPENAI_API_KEY` istiyor; anahtar yoksa `CardCover` baş harflere
düşer, yani kurs kırılmaz — ama kapaksız kurs katalogda göze batar.

### `spatial` widget — uçtan uca

**Neden mevcut yüzey yetmiyor.** Boş hipotez şu: *mermaid + checklist +
template bir hiyerarşiyi zaten karşılar.* Ölçüldü, ve karşılamıyor:

1. **Mermaid düğüm etiketi tek bir string; IFC düğümünün öğrettiği şey bir
   tablo.** Okuyucunun öğrenmesi gereken ağacın şekli değil, *hangi düğümün
   `Pset_WallCommon.FireRating`'i taşıdığı ve bunun tipten miras gelip
   gelmediği*. Bunu etikete koymak grafiği ~8 düğümde okunamaz yapar.
2. **Öğretim hatası kenarda, ve mermaid soru soramaz.**
   `IfcRelContainedInSpatialStructure` (eleman→kat) ile `IfcRelAggregates`
   (kat→bina) farklı ilişkiler, farklı sonuçları var. Mermaid kenarı
   renklendirir; cevabı gizleyip okuyucunun tahminini alıp sonra açamaz — ki
   korpusun tamamı bu mekanizma üzerine kurulu.
3. **Ders başına tek diyagram bütçesi bağlayıcı** (P7'nin kuralı). BIM, APS ve
   Asset Management'ta hiyerarşi **kursun ortak referansı**, 4-6 derste
   tekrarlıyor. Her dersin tek mermaid slotunu aynı ağaca harcamak, yol
   haritasının "70 karar diyagramı yazmayın" uyarısının aynısı.
4. **`quiz` sorabilir ama sonucu gösteremez.** "Bu duvar hangi katta?"
   quiz'lenebilir. `IfcBuildingStorey` yerine `IfcBuilding`'e bağlanmış bir
   elemanın **her kat bazlı metrajdan ve viewer ağacından düşmesi**
   quiz'lenemez — ona bakmak gerekir.
5. **Aynı widget dört kursun yerli veri yapısı:** BIM (mekânsal yapı), APS
   (Model Derivative nesne ağacı — birebir bu şekil), Asset Management
   (site→sistem→bileşen), Digital Twin (hangi düğüm hangi telemetri noktasını
   taşıyor). 8 kursun 4'ünde, süs değil çekirdek yapı olarak.

**Kaydedilen itiraz:** bir görüntüleyici widget'ı, *üretilmiş veriyi olgu diye
sunmaya* davetiye çıkarır — kimsenin yazmadığı, makul görünen bir IFC parçası.
İki mekanik cevap aşağıda (`spatial/unanchored-reveal` ve ≤40 düğüm sınırı).

**Fence:**

````
```spatial
title: "A wall that fell out of the storey"
ask: "Which node should the wall hang from, and which relationship puts it there?"
reveal: "IfcRelContainedInSpatialStructure attaches an element to exactly one IfcBuildingStorey"
root:
  id: "1xS3BCk291UvhgP2a6eflL"
  type: IfcProject
  name: "Riverside Depot"
  children:
    - id: "2rSuRi_lD5$O4Op8DVOCkd"
      type: IfcBuildingStorey
      name: "Ground floor"
      rel: aggregates
      children:
        - id: "3Xt7zPfNb2vgqR1YkEwNsq"
          type: IfcWallStandardCase
          name: "Bay wall"
          rel: contained
          flag: focus
          props:
            - set: Pset_WallCommon
              name: FireRating
              value: "REI 60"
              inherited: true
```
````

YAML gövde — `quiz`/`recall`/`tradeoff`/`calc` ile aynı; YAML JSON'ın üst kümesi
olduğu için kompakt JSON yazmak isteyen yazar da yazabilir.

#### `modules/course_content/course_content.spatial.ts` *(yeni)*

Zod şeması + `parseSpatial()`. Adlandırma kardeşlerinin aynısı (`.quiz.ts`,
`.recall.ts`, `.calc.ts`).

```ts
const REL  = ['aggregates', 'contained', 'voids', 'fills', 'nests', 'assigns'] as const;
const FLAG = ['good', 'bad', 'focus'] as const;

const PropSchema = z.object({
  set:  z.string().min(1).max(60),
  name: z.string().min(1).max(60),
  // string, never number: a numeric field here is an invitation to write a
  // measurement nobody took. A quantity that matters belongs in prose, with a
  // source — the roadmap's rule for any number a reader would quote.
  value: z.string().min(1).max(80),
  inherited: z.boolean().optional(),
}).strict();
```

Düğüm şeması `z.lazy()` ile özyinelemeli; `props` ≤6, `children` ≤12, hepsi
`.strict()`. `parseSpatial()` ayrıca **fırlatarak** zorlar (bozuk payload'ın
build'i kırması `blocks.ts`'in quiz/tradeoff için zaten yazdığı duruş):

- **3 ≤ toplam düğüm ≤ 40** — altı bir cümle, üstü ders değil model dökümü
- **derinlik ≤ 6** — Project/Site/Building/Storey/Space/eleman gerçek sınır
- **düğüm id'leri fence içinde tekil**
- **kökte `rel` yok; kök olmayan her düğümde var** — sihirle beliren düğüm
  hiçbir şey öğretmez
- **`ask` ve `reveal` ya birlikte var ya birlikte yok** — kapının yarısı spoiler
- **en fazla bir `flag: focus`**

#### Bağlantı noktaları *(hepsi değişiyor)*

| Dosya | Değişiklik |
|---|---|
| `course_content.blocks.ts` | `else if (lang === 'spatial') widget = parseSpatial(source);` (~satır 117) · `LessonWidget` union üyesi · **`export type { SpatialWidget }` yeniden dışa aktarımı** — P11 kaydı: eksik tip re-export'u vitest'te derleniyor, `next build`'in tsc geçişinde patlıyor |
| `ui/widgets/SpatialCard.tsx` *(yeni, `'use client'`)* | özyinelemeli `<ul>/<li>`; `useState<Set<string>>` (kapalı id'ler), `useState<string>` (tahmin), `useState<boolean>` (açıldı) |
| `ui/LessonSectionCard.tsx` | `case 'spatial':`, `verified` geçilir |
| `ui/WidgetShell.tsx` | `WidgetKind` += `'spatial'`; `WIDGET_LABEL.spatial = 'model tree'`; `FAMILY.spatial = 'reveal'` (proof/diff ile aynı aile). **Satır içi `<svg>` yok** — kabuk kuralı; açılır/kapanır işaretler CSS ile çizilir |
| `course_content.types.ts` | `LessonFeatures.spatial: boolean` |
| `course_content.service.ts` | `deriveFeatures`'a tek dal |
| `ui/LessonFeatureChips.tsx` | tek satır, `WIDGET_LABEL.spatial` ile |
| `scripts/corpus-stats.ts` | widget döngüsüne `'spatial'` |
| `docs/phases/README.md` | mevcut widget tablosuna **tek satır** — yeni tablo değil |

**Progress store'a dokunulmaz.** Açık düğüm ve yazılan tahmin bileşen
state'inde kalır: açık bir düğüm anlık okuma konumudur, ilerleme değil.
`PersistedProgress`'e altıncı bir map eklemek hak edilmemiş bir `quota.ts`
kararı ister ve `progress.store.test.ts` o anahtar kümesini bilerek koruyor
(değişmez #4).

#### Lint kuralları — `scripts/content-lint/rules.ts` *(değişiyor)*

| Kural | Sev | Yakaladığı |
|---|---|---|
| `spatial/invalid-payload` | **error** | `parseSpatial`'ın reddettiği her şey |
| `spatial/unanchored-reveal` | **error** | `reveal` metni ve her `props[].set` adı, dersin kendi nesrinde `spatial` fence'i dışında **birebir** geçmiyor |

İkisi de **doğuştan `error`** — değişmez #6'nın istisnası, `code/prose-fence-should-be-template`'in
kaydettiği gerekçeyle: korpusta sıfır `spatial` fence'i var, yani kural
yaratmadığı bir backlog'a takılamaz. `spatial/unanchored-reveal`,
`quiz/unanchored-answer`'ın birebir kopyası ve **widget'ın makul IFC
üretmesini durduran kural budur**: dersin öğretmediği bir ağaç, cevabı olarak
açılamaz.

Artı **mevcut bir kurala uzantı, üçüncü yeni kural değil**:
`drill/widget-on-unverified-lesson` bugün `quiz`/`recall` süzüyor; **`ask`
beyan eden** bir `spatial` fence'ini de süzsün. Gerekçe: doğrulanmamış derste
`SpatialCard` ağacı kapısız ve tam açık render eder (ağaç bir alıştırma
değil), yani değişmez #3 karanlık widget üretmeden sağlanır — ama `ask` bir
alıştırmadır ve açılmamalıdır.

#### `code/unverified-language` *(yeni kural, `warn`)*

Bu programın 79 dersi zaman baskısı altında yazılacak ve alanın gerçek
araçları Python (`ifcopenshell`, `pyproj`). Kural, `verify-code.ts`'in de
hiçbir runtime'ın da kapsamadığı bir dildeki fence'i işaretler: `java, python,
py, ruby, go, csharp, cs, php, rust, kotlin, swift, cpp, c`. Mevcut 10 `java`
fence'ini önceden var olan, belgelenmiş bir boşluk olarak bildirir — dürüst
olan bu — ve Python sızmasını mekanik olarak engeller. Değişmez #6 gereği
`warn` doğar.

**Kural bir yasak değil, bir sayaç.** P16 bilerek C# fence'i getirecek (Revit
API yalnız C#/.NET), ve o fazın kabul kriteri sayıyı bir tavana bağlıyor
(≤10 fence, her biri ≤15 satır). Amaç sıfırlamak değil, denetimsiz fence
sayısının **görünür ve sınırlı** kalması.

### `content/_verify/bim-ifc-data-models/432/` *(yeni)*

Ders 432'nin `proof` fence'i. **`stamp-verify.ts` `npm install` çalıştırmıyor**
(`execSync(cmd, { cwd })`), workspace ya Node builtin'leriyle ya kökün
`node_modules`'ıyla sınırlı. Bu ders için ikisi de gerekmiyor: IFC'nin STEP
(SPF) formatı satır tabanlı metin (`#123= IFCWALL('guid',…);`), ~60 satırlık
**sıfır bağımlılıklı** Node ayrıştırıcısı elle yazılmış 30 satırlık bir `.ifc`
dosyasının varlık grafiğini basar.

**`web-ifc` eklenmez.** Gerekçe kayda geçiyor, sonra yeniden tartışılmasın:
(a) proof workspace'i kökün `node_modules`'ından çözüyor, yani `web-ifc`
tarayıcıda hiç kullanılmayan statik bir sitenin kök bağımlılığı olurdu ve
bedelini her `npm ci` öder; (b) çıktısı kütüphane sürümüne bağlı, damga
byte-karşılaştırmalı ve CI her push'ta yeniden koşuyor — minör sürüm
yükseltmesi alakasız bir PR'da `stamp-verify --check`'i kırar; (c) **432'nin
öğrettiği şey zaten dosya formatı**, kütüphane çağırmak dersi öldürür.
Determinizm kıstası P5'in: çıktıda saat, süre, rastgele id, araç sürümüne bağlı
metin bulunamaz.

### `content/concepts.json` *(değişiyor)*

Bu kursun 3-4 terimi: `ifc`, `global-id`, `property-set`, `spatial-containment`.
Her terim `lesson` alanında **bu fazın** bir id'sine bağlanır; jenerik denylist
(`cache`, `token`, `data`, `system` …) yükleme anında fırlatır. Ders başına 4
link bütçesi paylaşımlı — yeni terim eklemek mevcut bir dersin tooltip'ini
düşürebilir, bu yüzden `content:concepts-check` bu fazda dikkatle okunur.

### Sabit korpus sayıları *(değişiyor)*

Üç test 412'yi elle yazıyor; **üçü de bu fazda 422 olur**, yoksa `npm test`
kırılır ve hata mesajı sebebi söylemez:

```
modules/course_content/course_content.sections.test.ts:52   expect(stats.lessons).toBe(N)
modules/course_content/course_content.service.test.ts:46     expect(seen.size).toBe(N)
modules/course_content/remark-lesson-refs.test.ts:30         expect(index.size).toBe(N)
```

### `scripts/corpus-stats.ts` *(değişiyor)* — iki ölçüm işi

**(a) Yinelenen etiket koruması.** `documented.set(cells[1], cells[3])` dosya
sırasıyla son-yazan-kazanır. Bugün gizli olan bu hata, alan tablosu eklenince
erişilebilir hâle geliyor: etiketi çakışan yeni bir satır, kontrol edilen bir
değeri sessizce gölgeler ve kontrol yanlış sayıya karşı geçer. Dört satır:

```ts
if (documented.has(cells[1]))
  throw new Error(`docs/phases/README.md has two rows labelled "${cells[1]}" — the later one shadows the checked value`);
```

**(b) `## Alan bloğu` tablosu ve üçüncü ölçüm haritası.** Sorun gerçek:
`P0 zemini` 412 dersin ölçüsü; P21'den sonra `Bugün` 491'i ölçüyor ve iki
sütunun farkı artık "fazların mevcut derslere yaptığı" anlamına gelmiyor.
**Sütun ekleyerek çözülemez** — 4 sütunlu satır 6 hücreye bölünür,
`cells.length !== 5` onu atlar, tablodaki her etiket `MISSING` verir ve CI
çıkar (satır 118-124). Çözüm üç parça:

1. İki mevcut tablonun şekli değişmez, `P0 zemini` sütununa dokunulmaz.
2. Ölçülen zemin tablosunun altına **bir paragraf** süreksizliği açıkça söyler.
3. Etiketleri dosyanın başka hiçbir yerinde geçmeyen **yeni bir 3 sütunlu
   tablo** (`Alan dersi / alan kursu`, `Alan fence'i`, `Alan Common Mistakes
   maddesi`, `Alan — drill'lenebilir`), sol sütunu `P13 zemini` = hepsi sıfır
   ve o da hiç kımıldamaz. Slug kümesi elle değil `COURSE_SECTIONS`'ın
   `built-environment` dalından türetilir — tek gerçek kaynak korunur.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 431 | `ts run` | Satır içi bir string üzerinde STEP tokenizer — import yok, `console.log` var |
| 432 | **`proof`** | `content/_verify/.../432/`, sıfır bağımlılık, determinist |
| 433 | `ts run` | IfcGuid ⇄ UUID base64 kodlayıcı — saf aritmetik |
| 434, 435, 436 | **`spatial`** | Widget'ın üç tüketicisi |
| 434 | `mermaid` (1) | Kursun tek diyagramı |
| 437 | `ts run` | Yerel yerleşim matris zinciri |
| 439 | `sql run` | Varlık/pset EAV şeması + üçlü join, gerçek Postgres (PGlite) |
| 438, 440 | **runtime yok** | Şema sürüm farkları ve diff stratejisi — nesir + `tradeoff` |

`ts run` disiplini dört kuralı **aynı anda** sağlamak zorunda: `RUNNABLE_LANGS`
(`tsx` **değil**), en az bir `console.*`, **sıfır `import`/`require`** (iframe
`default-src 'none'`), ve `verify-code --strict` altında temiz tsc.

Sonuncusu bu alanın tuzağı: `ASSUMED_CONTEXT` listesinde **hiçbir alan
istemcisi yok**, yani `ifcClient` gibi bir ad `undefined-identifier` kusuru
verir ve korpus şu an **sıfır kusurda**. Kural: **her alan snippet'i kendi
tiplerini bildirir** (`type IfcEntity = { id: number; type: string; args: string[] }`).
Bu zaten daha iyi öğretim. `ASSUMED_CONTEXT` yalnız ≥3 derste tekrarlayan ve
**sadece çağrı pozisyonunda** geçen bir ad için, faz dosyasında
gerekçelendirilerek genişletilir — `callOnlyNames()` çoğu durumu allowlist'siz
zaten karşılıyor.

## Kaynak kuralı

- **Ücretli standardın madde metni asla alıntılanmaz.** Yalnız numarası +
  yayıncının ücretsiz katalog sayfası kaynak olur (`ISO 19650-2:2018`).
  Mekanizma öğretilir, uygunluk iddiası kurulmaz. Bir dersin doğruluğu ücretli
  bir belgeye dayanıyorsa **o ders yazılmaz**.
- **IFC farklı:** buildingSMART şema dokümantasyonu ücretsiz ve kalıcı URL'li —
  doğrudan link verilir, sürüm yazılır (`IFC4.3.2.0`).
- Sürüme bağlı her iddia (Pset alan adları gibi) **438'de toplanır**; diğer 9
  ders sürümden bağımsız mekanizmayı anlatır.
- Further Reading madde sayısı derse göre **gerçekten değişir** (3-5).
  `sources/quota-signature` sıfır varyansı bir üretim imzası olarak yakalıyor.
- Merge öncesi her URL HEAD ile kontrol edilir. Doğrulanamayan madde
  **kurtarılmaz, silinir**. Bir ders 3 doğrulanmış kaynağa ulaşamıyorsa yazılmaz.

## Kabul kriterleri

- [x] `built-environment` dalı `COURSE_SECTIONS`'a **sona** eklendi; ana
      sayfada üçüncü bölüm doğru başlık/blurb/grid ile render oluyor;
      `sections[0]` hâlâ `engineering` (P13'ün CTA testi yeşil)
- [x] `bim-ifc-data-models` 10 ders + manifest; `shape/six-sections` ve
      `shape/unrecognized-heading` sıfır bulgu
- [x] 10 dersin **tamamı** `stamp-verified.ts` ile damgalandı —
      `verified-sha.json`'a 10 giriş; hiçbiri elle yazılmadı
- [x] Common Mistakes: `parseMistakes` bu 10 derste **0 `single`** madde
      raporluyor (`content/_reports/mistakes.json`) — 58 maddenin 58'i
      `bold-dash`
- [x] `spatial` widget: `parseSpatial`'ın altı kuralı
      `course_content.spatial.test.ts`'te birer vaka ile yeşil (+ şema
      düzeyinde üç vaka: bilinmeyen anahtar, sayısal değer, bilinmeyen `rel`)
- [x] `SpatialCard` `course_content.spatial` modülünden **yalnız `import type`**
      ile alıyor — `SpatialCard.test.ts` bunu mekanik doğruluyor
- [x] `spatial` JS bütçesi — **1.453 B gz** (3.495 B minified) marjinal
      maliyet, paylaşılan `WidgetShell`/`widget-ui`/`cn` hariç; hepsi
      bundle'landığında **2.236 B gz**. İkisi de ≤2,5 KB gz sınırının altında.
      Yöntem P11'in yöntemi: esbuild ile modül grafiği bundle'lanıyor,
      react/store/next hariç
- [x] Reveal kapısı `RecallCard`'ın `MIN_ANSWER_LENGTH = 15`'ini **paylaşıyor**
      — `ui/reveal-gate.ts`'e taşındı; `SpatialCard.test.ts` her iki dosyanın
      da oradan aldığını ve kendi sabitini tanımlamadığını doğruluyor
- [x] `spatial/invalid-payload` ve `spatial/unanchored-reveal` **error** olarak
      doğdu ve korpus ikisinden de temiz
- [x] `drill/widget-on-unverified-lesson` `ask` taşıyan `spatial` fence'ini de
      süzüyor (`ask`'siz olanı süzmüyor — o zaten tam açık render ediyor)
- [x] `code/unverified-language` `warn` olarak doğdu; mevcut 10 `java` fence'ini
      bildiriyor, **0 Python fence'i** var
- [x] Ders 432'nin `proof` bloğu `sha=`/`at=`/`commit=` damgalı ve
      `stamp-verify.ts --check` yeşil (13/13); workspace **sıfır bağımlılık**,
      yalnız Node builtin'leri
- [x] Üç sabit korpus sayısı 412 → **422**:
      `course_content.sections.test.ts`, `course_content.service.test.ts`,
      `remark-lesson-refs.test.ts`
- [x] `corpus-stats.ts` yinelenen etiket koruması var ve kasıtlı bir çakışmada
      fırlatıyor (denendi: ikinci bir `` `calc` `` satırı ile). Tablo ayıraç
      satırları (`|---|`) etiket sayılmıyor
- [x] `## Alan bloğu` tablosu README'de; `P13 zemini` sütunu sıfırlar; slug
      kümesi `COURSE_SECTIONS`'ın `built-environment` dalından türüyor;
      `npm run content:stats-check` **"32 rows checked · 0 disagree"**
- [x] `parse-snapshot.json` **büyüdü** (+10 ders); tek değişen mevcut satır
      `lessonCount`, hiçbir bölüm sha'sı kımıldamadı —
      `content:snapshot-diff` 0 unexplained
- [x] `npm run content:reports` sonrası
      `git diff --exit-code -- content/_reports` temiz
- [x] `npm run content:check`, `content:concepts-check`,
      `content:verify-mermaid` (18 fence, 13 ok, 5 unverified — hepsi
      `graph`, DOM sınırı), `npm run lint`, `npm run build` yeşil

**Arketipte üç sapma, kayda geçiyor** — sonraki yedi kurs bu dersleri taklit
edeceği için sessiz bırakılamaz:

1. Şartnamenin örnek fence'i `IfcWallStandardCase` kullanıyor; içerikte
   `IfcWall` kullanıldı. İlki IFC4'te kullanımdan kaldırılmış bir varlık, ve
   taklit edilecek bir örnekte durmamalı. (`course_content.spatial.test.ts`
   fixture'ı şartnamenin metnini aynen taşıdığı için orada kaldı.)
2. Şartnamenin `reveal` metni (`"IfcRelContainedInSpatialStructure attaches an
   element to exactly one IfcBuildingStorey"`) dersin nesrinde birebir
   geçmediği sürece `spatial/unanchored-reveal` onu reddediyor — yani her
   `reveal` artık dersin kendi cümlesinden **kesilerek** yazılıyor. Kural
   çalıştığı için şartnamenin kendi örneği kurala takılan ilk vaka oldu.
3. `SpatialCard`, `rel` değerini IFC ilişki varlığının adıyla etiketliyor
   (`contained` → `IfcRelContainedInSpatialStructure`). Şartnamede yok; asıl
   öğretim yükü orada olduğu için eklendi — kenardaki fark, düğümdeki değil.

**P13'ün "asgari 3 kurs" testi hakkında karar.** Şartname iki seçenek
bırakmıştı; seçilen üçüncüsü, ikisinin de amacını koruyor:
`sections.test.ts` kuralı **koruyor** ama adı konmuş tek bir istisna
tanıyor (`UNDER_CONSTRUCTION = {'built-environment'}`), ve o istisna
**kendi kendini iptal ediyor** — yanındaki `keeps no finished branch on the
under-construction list` testi, dal üçe ulaştığı anda istisna hâlâ oradaysa
kırılır. `it.todo` seçilmedi çünkü o, kuralı diğer iki dal için de kapatırdı.
P13'ün risk satırının istediği bu: "sessizce aşılamaz".

*Sonradan not:* mekanizma çalıştı. P16 dalı üçüncü kursa çıkardı, bekçi testi
o fazın doğrulama koşusunda kırıldı, ve istisna ile bekçisi birlikte silindi.
Gevşetme iki faz sürdü ve süresini kendisi bildirdi.

## Risk

| Risk | Azaltma |
|---|---|
| Widget süs hâline gelir — ağaç çizmek kolay, hata göstermek zor | `spatial/unanchored-reveal` her `reveal` ve `props[].set`'i dersin nesrine bağlar; 3-40 düğüm + ≤6 derinlik sınırı model dökümünü engeller; `ask`/`reveal` birlikte zorunlu, kapının yarısı yazılamaz; widget **3 gerçek tüketici** ile merge edilir (P11 emsali) |
| Makul görünen ama kimsenin yazmadığı IFC üretilir | Aynı kural; ayrıca 432'nin proof'u elle yazılmış `.ifc` üzerinde koşar, yani en az bir yerde ağacın kaynağı denetlenebilir |
| Sürüme bağlı Pset adları eskir | Sürüme bağlı iddialar 438'de toplanır; `unanchored-reveal` her Pset adını nesre bağladığı için değişiklik **lint'in gösterdiği tam listede** yapılır |
| Ücretli standarda sahte URL uydurulur | Madde metni alıntılanmaz; yalnız numara + ücretsiz katalog sayfası; doğrulanamayan kaynak silinir |
| `verify-code --strict` alan snippet'lerinde patlar (korpus sıfır kusurda) | Her snippet kendi tiplerini bildirir; `ASSUMED_CONTEXT` körlemesine genişletilmez |
| Arketip yanlış donarsa yedi kurs onu taklit eder | P15 başlamadan **P14 merge edilmiş ve okunmuş** olmalı; bu fazın çıktısı sonraki yedi fazın rubric'i |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| BCF (BIM Collaboration Format) | Model üzerindeki sorunun bir API nesnesi olarak taşınması — koordinasyonun veri hâli | kapsam — 10 ders IFC'nin kendi veri modelini kapatıyor; BCF ayrı bir değişim formatı |
| COBie | Devir tablosunun formatı; neden hâlâ bir tablo ve bunun maliyeti | kapsam — devrin *kendisi* P20/`#511`'de; formatın anatomisi ayrı bir ders |
| Clash detection | Çakışmanın bir geometri sorgusu oluşu: broad-phase/narrow-phase, tolerans | kapsam — geometri bu kursun dışında; IFC'nin veri tarafı önce oturmalı |
| LOD / LOIN ve ISO 19650 bilgi gereksinimleri | Bilgi teslimatının bir sözleşme kalemi olması | kapsam + kaynak — ISO 19650 ücretli; ders numara+katalog ile yazılabilir ama kitle kayması riski (süreç dersi) |
| Model federasyonu | Çok disiplinli modellerin tek koordinat sisteminde birleşmesi | bağımlılık — `#438` georeferansı ve P18/`#484` bunun yarısını zaten kuruyor; üçüncü ders ancak ikisi okunduktan sonra anlamlı |
| IFC4.3 altyapı varlıkları (Alignment, yol/demiryolu) | Bina dışı altyapının IFC'ye girmesi — alanın en yeni kısmı | kapsam — IFC4.3 benimsenmesi hâlâ oynak; sürüm damgalı tek ders yazılabilir |
| IFC **yazma** | Şu an yalnız okuma öğretiliyor; geçerli bir dosya üretmek ayrı bir problem | kapsam — yazma, şema doğrulama ve sertifikasyon gerektirir; okuma tarafı önce |
| `spatial` widget'a arama/filtre | 40 düğümlük ağaçta terimle gezinme | kapsam — 40 düğüm sınırı zaten aramayı gereksiz kılıyor; sınır büyürse yeniden bakılır |
