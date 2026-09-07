# P27 — Model koordinasyonu ve değişimi: okumanın öbür yarısı

**Efor:** ~6-7 gün · **Bağımlılık:** P14, P16, P20 · **Sonrakiler:** P22'nin yeniden ölçümü

## Neden

P14 IFC'yi **okumayı** öğretti ve kendi `Eklenebilecekler` tablosunda bunu
açıkça söyledi: *"Şu an yalnız okuma öğretiliyor; geçerli bir dosya üretmek
ayrı bir problem."* Aynı tablo BCF'i, COBie'nin anatomisini, çakışma tespitini
ve model federasyonunu da erteledi. P16 ise Revit → IFC eşlemelerini
**"en güçlü aday"** diye işaretledi. Beş adayın hepsinin gerekçesi *kapsam* ya
da *bağımlılık*tı; ikisi de kapandı.

Boşluk ölçüldü — 33 kurs, 535 ders, kelime sınırıyla:

| Terim | Ders | Not |
|---|---:|---|
| `BCF` | **0** | Koordinasyonun tek taşınabilir nesnesi korpusta yok |
| `model federation` / `federated model` | **0** | Disiplin modellerinin birleşmesi hiç anlatılmıyor |
| `clash` | 2 | İkisi de tesadüfi: biri `field-data`'da bir değişken adı, biri `#437`'de bir yan cümle |
| `IFC writing` | **0** | Yazma tarafı hiç yok |
| `COBie` | 4 | **Kapsanıyor** — `#511` devri anlatıyor, üçü de kaynak bağı |

COBie farklı bir durumda ve şartname bunu ayırıyor: devir **süreci** `#511`'in
ve orada kalıyor; eksik olan **formatın anatomisi** — sayfalar, anahtarların
isim oluşu, modele join. P14'ün tablosu tam bunu diyordu.

Dalın asimetrisi şu: dokuz kurs bir modeli **okuyor, sorguluyor, saklıyor ve
devrediyor**; hiçbiri bir model **üretmiyor**, iki modeli **birleştirmiyor**,
ve aralarındaki bir anlaşmazlığı **taşımıyor**. Bu kurs o üç işi kurar.

## Kapsam

**Kurs:** `model-coordination-exchange` — "Model Coordination and Exchange"
**Ders:** 9 · **id:** 554-562 · **bracket:** `1-3` ×3, `3-7` ×6

> *Description:* "The write half of the branch: combining discipline models,
> finding what collides, moving an issue between tools as data, and producing
> a file someone else's software will accept."

| id | Başlık | bracket |
|---|---|---|
| 554 | Coordination Is a Data Problem: Geometry, Properties, and the Issue | 1-3 |
| 555 | BCF: An Issue as a Portable Object, Anchored to an Element | 3-7 |
| 556 | Federating Models: Many Files, One Coordinate System | 3-7 |
| 557 | Clash Detection Is a Query: Broad Phase, Narrow Phase, Tolerance | 3-7 |
| 558 | The Clash Report Nobody Reads: Grouping, Ownership, and Status | 1-3 |
| 559 | Writing IFC: A File Someone Else's Tool Will Accept | 3-7 |
| 560 | COBie: The Handover Spreadsheet as a Schema | 3-7 |
| 561 | Revit to IFC: Where Your Parameters Actually Land | 3-7 |
| 562 | Exchange Requirements a Machine Can Check | 1-3 |

**555 ve 558 ayrı, çünkü biri format biri iş akışı.** 555 bir sorunun
**taşınabilir nesne** olarak anatomisi (markup, topic, viewpoint, GlobalId
tutturması); 558 dört bin satırlık bir raporun neden bir bulgu olmadığı
(gruplama, sahiplik, durum). Tek derste birleşirse ikisi de "koordinasyon
işte" diye bulanıklaşır — P24'ün 529/530 için verdiği aynı gerekçe.

**557 render dersi değildir.** Değişmez #5 ve P18'in doktrini gereği hiçbir şey
çizilmez: broad phase bir **kutu kesişim sorgusu**, narrow phase bir
**karar kuralı**, tolerans bir **politika**. Geometri motoru yazılmaz,
üçgen-üçgen kesişimi anlatılmaz.

**556 ayrı bir koordinat dersi değildir.** `#437` (yerel yerleşim), `#438`
(georeferans) ve `#484` (BIM → GIS) zinciri zaten kuruyor; 556 o zincirin
**birden çok dosyada** ne olduğunu anlatır ve üçüne de bağlanır.

Çapraz bağ: 554 `#431`'e, 555 `#433` ve `#440`'a, 556 `#437`/`#438`/`#484`'e,
557 `#435`'e, 559 `#431`-`#436`'ya, 560 `#511` ve `#504`'e, 561 `#459` ve
`#436`'ya, 562 `#438`'in *"georeferenced is too vague to check"* cümlesine
bağlanır.

### Üç sınır beyanı

1. **`#511` devir sürecini sahiplenir, 560 formatın anatomisini.** 560 bir
   devir prosedürü yazmaz; sayfaları, isim-anahtarları ve modele join'i
   anlatır ve süreci `#511`'e bırakır.
2. **`#440` iki export'u karşılaştırmayı sahiplenir, 555 sorunun tutturmasını.**
   Yeniden export GlobalId'leri değiştirdiğinde bir BCF konusunun neyi
   kaybettiği 555'in konusu; iki dosyanın farkını çıkarmak `#440`'ın.
3. **ISO 19650 / LOIN süreç dersi yazılmaz.** P14 bunu *kitle kayması riski*
   diye ertelemişti ve karar duruyor. 562 yalnız **makine tarafından
   denetlenebilir** bir gereksinimi kurar: varlık + özellik + değer alanı +
   denetleyici. Standardın metni alıntılanmaz, süreci anlatılmaz.

## Yapılacaklar

### `content/courses/model-coordination-exchange/` *(yeni)*

9 ders + manifest. Dal slug'ı `sections.ts`'e — **`autodesk-developer-platform`
ile `iot-hardware-basics` arasına**, çünkü 561 `#459`'a, 559 `#431`-`#436`'ya
dayanıyor ve ikisi de önünde olmalı. Kapak `SUBJECTS`'e. Sabit korpus sayıları
535 → **544**.

Arketip P14 dersleridir; özellikle `432_parsing_ifc_without_a_library.md`
(bir formatın nasıl elle okunacağını gösteren `ts run` deseni) ve
`440_model_diffing.md` (kimlik tabanlı karşılaştırma).

### `content/_verify/model-coordination-exchange/557/` *(yeni)*

`proof`: sabit bir eleman kümesinde broad phase'in **sayılarak** ölçülmesi —
kaba kuvvet çift sayısı, AABB elemesinden sonra kalan çift sayısı, ve
toleransın çakışma sayısını nasıl değiştirdiği. Dersin "tolerans bir politika"
iddiası böylece yazarın değil koşunun rakamı olur. Sıfır bağımlılık, saf
aritmetik, sabit sıralama.

### `scripts/stamp-verified.ts` — **değişmiyor**

Bu kursta denylist dersi yok; hiçbir konu yanlış öğrenildiğinde yaralanma
üretmiyor. 9 dersin 9'u damgalanır, her biri `quiz` + `recall` taşır.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 554 | `mermaid` (1) | Üç akış: geometri, özellik, sorun — ve hangisinin kendi formatı var. **Kursun tek diyagramı** |
| 555 | `ts run` | Bir viewpoint'in seçili GlobalId'lerinin model indeksine çözülmesi; biri bulunamayınca ne kalıyor |
| 556 | `ts run` | İki dosyanın yerel koordinatlarının ortak sisteme taşınması; yanlış eşlemenin metrik sonucu |
| 557 | `ts run` + **`proof`** | AABB broad phase; `proof` çift sayısını ve tolerans etkisini sayar |
| 558 | `tradeoff` | Disiplin çiftine göre gruplama ile konum kümesine göre gruplama |
| 559 | `ts run` | Bir tüketicinin gerçekten denetlediği beş mekanik kural, bir modelin üstünde koşuyor |
| 560 | `ts run` | COBie `Component` ↔ `Type` join'i ve isim-anahtarın kırıldığı yer |
| 561 | `diff` | Aynı parametre: eşleme tablosuz ve eşleme tablosuyla export |
| 562 | `md` checklist | Denetlenebilir bir değişim gereksiniminin yazılma sırası |

Her ders `quiz` + `recall` taşır — istisna yok.

## Kaynak kuralı

- Şema ve format iddiaları **buildingSMART dokümantasyonuna** (IFC4.3 belge
  sitesi, BCF-XML deposu) ya da bir koşunun çıktısına dayanır.
- COBie için `#511`'in zaten kullandığı kaynak kullanılır; sayfa adları ve
  anahtar kuralları alıntılanır, **standart metni alıntılanmaz**.
- Ürün adı (Revit, Navisworks, Solibri, IfcOpenShell) yalnız **dokümantasyon
  atfı** olarak geçer; hiçbiri diğerine üstün ilan edilmez ve hiçbir kurulum
  ya da menü turu yazılmaz — `#480`'in usulü.
- Çakışma sayısı, tolerans değeri ve çift sayısı **koşudan** gelir; "tipik bir
  projede ~N çakışma olur" yazılmaz.

### P26'nın kuralı bu kursa doğuşta uygulanır

P26 bir kural bıraktı: bir kurs korpusa **iki yönlü** bağlanmalı, ve P24/P25
o kuralı sonradan ödemek zorunda kaldı. Aynı borcu yeniden yaratmamak için
bu faz kendi bağlarını ve sözlük terimlerini kendi içinde getirir:

- **Geriye bağlar** — beşi, hepsi barındıran dersin zaten var olan cümlesinde:
  `#438`'in *"georeferenced is too vague to check"* cümlesi → 562;
  `#440`'ın *"the GlobalId is the only identity IFC gives you"* → 555;
  `#511`'in COBie paragrafı → 560; `#459`'un export mapping cümlesi → 561.
- **Sözlük** — 5 terim: `BCF` (555), `federated model` (556), `broad phase`
  (557), `COBie` (560), `exchange requirement` (562).

## Kabul kriterleri

- [x] 9 ders (554-562) + manifest; `shape/*` sıfır bulgu — kursta **0 lint bulgusu**
- [x] 9 ders damgalı, `HARM_DENYLIST` 20'de değişmedi; her derste `quiz` + `recall`
- [x] Üç sınır beyanı nesirde: 560 → *"Lesson 511 covers what an operations team
      does with one; this lesson is about the schema itself"*; 555 → `#440`'a
      bağlanıyor ve export karşılaştırmasını ona bırakıyor; 562 → *"this is not
      a lesson about information-delivery processes"*
- [x] 557'de geometri motoru yok: broad phase üç aralık karşılaştırması, narrow
      phase bir karar kuralı, ve ders *"this lesson writes no geometry engine"*
      diye beyan ediyor
- [x] `parseMistakes`: korpus geneli `single` **141'de sabit**, `0 mistakes: 0`
- [x] `557` proof'u damgalı (`proof` 27 → 28), sıfır bağımlılık, iki koşuda
      md5-aynı. Sayılar: 435 kaba kuvvet çifti → 296 disiplinler arası → **124**
      broad phase sonrası (%71,5 eleme); tolerans 0 → 50 mm çakışmayı **124 →
      42**'ye, 250 mm'de **0**'a indiriyor
- [x] 561'in `diff` çifti tanınıyor — `diff` 4 → **5**
- [x] `links/dead-lesson-ref` temiz; çapraz bağların hepsi gerçek slug'a çözülüyor
- [x] Üç sabit test sayısı **535 → 544**
- [x] **P26'nın kuralı doğuşta karşılandı**: kurs `bim-ifc-data-models`,
      `autodesk-developer-platform` ve `asset-management-systems`'ten bağ alıyor
      — **3 kurs**, P20/P21'in seviyesinin üstünde. Sözlük 149 → **154**,
      `shadowed` 0, `case-mismatch` 0, `cap-starved` 2'de sabit; 22 yeni link
      render edildi, **0 link kaybedildi** (eski/yeni concepts raporları
      karşılaştırıldı)
- [x] `content:stats-check` 32 rows · 0 disagree; `content:snapshot-diff` yeni
      derslerde 0 unexplained, bağ eklenen 4 derste explained
- [x] `content:check` (309 test), `lint`, `concepts-check`, `verify-mermaid`
      (28 fence, 0 failed), `build` (**594 sayfa**, P26'da 584) yeşil; arama
      indeksi **83.219 B gz** / 98.304

## Risk

| Risk | Azaltma |
|---|---|
| 557 bir geometri motoru dersine döner | Broad phase bir sorgu; narrow phase bir karar kuralı; render yasak (değişmez #5) |
| 560 `#511`'i tekrar eder | Sınır beyanı: süreç `#511`'in, anatomi 560'ın |
| 562 bir ISO 19650 süreç dersine kayar | Yalnız makine-denetlenebilir gereksinim; standart metni yok |
| Ürün turu olur (Revit/Navisworks menüleri) | Ürün adı yalnız doküman atfı; kurulum ve menü anlatımı yok |
| Çakışma rakamı uydurulur | Her sayı `proof`/`ts run` çıktısı |
| 9 ders tek fazda ağır gelir | 554-557 çekirdek ve önce yazılır; 560-562 en son |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Barkod / QR / RFID varlık tanıma | Sahada doğru varlığa yazma | kapsam — P19'un tablosunda "en güçlü aday" olarak duruyor; bu fazın teması model değişimi, saha tanıma değil |
| IFC4.3 altyapı varlıkları (Alignment) | Bina dışı altyapının şeması | kapsam — P14'ün tablosundaki aynı kalem; benimsenme hâlâ oynak |
| Narrow-phase geometri (üçgen kesişimi) | Çakışmanın kesin hâli | doktrin — render ve geometri motoru dalın dışında; 557 sınırı beyan ediyor |
| Navisworks / Solibri otomasyonu | Koordinasyonun araç tarafı | kapsam — P16'nın tablosundaki kalem; ayrı ürün, ayrı API |
| ISO 19650 / LOIN süreç dersi | Bilgi teslimatının sözleşme tarafı | **doktrin = yasak** — P14 kitle kayması diye reddetti; 562 makine-denetlenebilir yarıyı alıyor |
| Model federasyonunda çakışan GlobalId'ler | İki dosyanın aynı id'yi taşıması | kapsam — 556 koordinatı, `#515` kimlik çözümlemeyi kuruyor; üçüncü ders ikisinden sonra |
