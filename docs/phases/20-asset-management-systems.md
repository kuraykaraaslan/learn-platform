# P20 — Varlık yönetimi sistemleri

**Efor:** ~4-5 gün · **Bağımlılık:** P14 (devir), P17 (durum verisi) · **Sonrakiler:** P21

## Neden

Bir modelin ömrü teslimle bitmez; varlığın ömrü orada **başlar**. Korpusta
"asset management" iki yerde geçiyor ve ikisi de başka bir şey: biri OWASP'ın
*improper asset management*'ı, diğeri pazarlama içerik varlıkları.

Bu kurs varlık kütüğünü bir veri modeli olarak öğretir — çünkü geliştiricinin
karşılaştığı problemler tam olarak veri modeli problemleridir: özyinelemeli
hiyerarşi sorguları, bir bileşen değiştirildiğinde hayatta kalan kimlik, iki
kütüğün birleştirilmesi, ve **ihmali bulan anti-join**.

En değerli dersi 511: modelden kütüğe devirde bağın kopması, bu alanın en
pahalı ve en sessiz hatası.

## Kapsam

**Kurs:** `asset-management-systems` — "Asset Management Systems"
**Ders:** 9 · **id:** 504-512 · **bracket:** `1-3` ×1, `3-7` ×6, `7-10` ×2

> *Description:* "The asset register as a data model: hierarchies, identity that
> survives replacement, condition history, and the queries that find neglect."

| id | Başlık | bracket |
|---|---|---|
| 504 | The Asset Register: What One Asset Row Must Carry | 1-3 |
| 505 | Asset Hierarchies: Recursive Trees, Materialised Paths, and the Weekly Query | 3-7 |
| 506 | Asset Identity: Tags, Serials, and Surviving a Replacement | 3-7 |
| 507 | Condition and Criticality: Modelling a Score You Did Not Invent | 3-7 |
| 508 | Work Orders and Maintenance History: The Anti-Join That Finds Neglect | 3-7 |
| 509 | Whole-Life Cost: Repair vs Replace, With Your Own Numbers | 3-7 |
| 510 | Merging Two Asset Registers: Fuzzy Matching and the Review Queue It Needs | 7-10 |
| 511 | Handover Data: Turning a Model Into a Register Without Losing the Link | 7-10 |
| 512 | Buying vs Building an EAM/CMMS: What the Data Model Decides | 3-7 |

511, P14'ün `GlobalId` (`#433`) ve COBie kavramlarına doğrudan dayanır.

## Yapılacaklar

### `content/courses/asset-management-systems/` *(yeni)*

9 ders + manifest. Dal slug'ı, kapak, sabit korpus sayıları 485 → **494**.

### `content/_runtime/seeds/asset_register.sql` *(yeni)*

Bu kursun omurgası — `sql run` ağırlıklı olmasının sebebi. İçerik: varlık
tablosu (`parent_id` ile ağaç), iş emri tablosu, durum kayıtları; kasıtlı
olarak **bakımı hiç yapılmamış** birkaç varlık (508'in anti-join'i onları
bulacak) ve **eşleşmeyen** birkaç etiket (510). ≤50 KB.

### `content/_verify/asset-management-systems/510/` *(yeni)*

`proof`: sabit iki kütük üzerinde bulanık eşleştirme koşusu — hangi çiftler
otomatik eşleşti, hangileri insan kuyruğuna düştü. Saf Node (Levenshtein ~25
satır), sıfır bağımlılık, determinist.

### `content/concepts.json` *(değişiyor)*

`asset-register`, `criticality`, `work-order` gibi terimler; her biri bu fazın
bir dersine bağlanır.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 504, 505, 508, 510 | **`sql run`** | Kütük şeması; özyinelemeli CTE hiyerarşi; ihmali bulan anti-join; aday çift sorgusu |
| 505 | **`spatial`** | Site → sistem → alt sistem → bileşen — widget'ın dördüncü kursu |
| 506 | `ts run` | Etiket normalleştirme |
| 507 | `ts run` | Risk/kritiklik skoru — **okuyucunun kendi ağırlıklarıyla** |
| 509 | **`calc`** | Onar/değiştir kararı, okuyucunun kendi rakamlarıyla; ders 322'nin usulü |
| 510 | `ts run` + **`proof`** | Levenshtein; proof sabit çiftler üzerinde koşar |
| 504 | `mermaid` (1) | Kütük ↔ iş emri ↔ durum ilişkileri |
| 511, 512 | **runtime yok** | Devir stratejisi ve al/yap kararı — nesir + `tradeoff` |

**507 için sert kural:** kritiklik skoru **uydurulmaz**. Ders, okuyucunun
kendi ağırlıklarını koyduğu bir modeli kurmayı öğretir; "sektör standardı
şudur" iddiası kurulmaz. Aynı şekilde 509'nın `calc`'ı varsayılan rakamlarla
gelir ama **onlar örnek olduğunu söyler**.

## Kaynak kuralı

- **ISO 55000/55001 ücretli.** Madde metni **asla alıntılanmaz**; yalnız numara
  + ISO'nun ücretsiz katalog sayfası. Standardın "ne gerektirdiği" iddiası
  kurulmaz; kursun anlattığı şey **veri modeli**, uygunluk değil.
- COBie için buildingSMART dokümantasyonu (ücretsiz, sürüm yazılı).
- Bakım stratejisi/ömür rakamları (MTBF, değişim aralığı) **yazılmaz** — üretici
  ve varlık sınıfına bağlı; okuyucuya kendi verisinden hesaplama yolu verilir.
- 512 vendor karşılaştırması **ürün adı vererek yapılmaz** — veri modeli
  kriterleriyle yapılır; ürün listesi altı ayda eskir.

## Kabul kriterleri

- [ ] 9 ders + manifest; `shape/*` sıfır bulgu; 9'u da damgalı
- [ ] `parseMistakes` bu 9 derste **0 `single`** madde raporluyor
- [ ] `asset_register.sql` ≤50 KB; 504/505/508/510'nin `sql run` fence'leri
      PGlite'ta gerçekten koşuyor; 508'in anti-join'i tohumdaki ihmal edilmiş
      varlıkları **gerçekten** buluyor
- [ ] 505'nin `spatial` fence'i `spatial/unanchored-reveal`'i geçiyor
- [ ] 510'nin `proof` bloğu damgalı, sıfır bağımlılık, iki koşuda byte-aynı
- [ ] 509'nın `calc` fence'i okuyucunun kendi rakamlarını alıyor; varsayılanların
      örnek olduğu nesirde yazılı
- [ ] **ISO 55000'den tek satır alıntı yok**; kaynak yalnız numara + katalog
      sayfası
- [ ] 512'da ürün adı geçmiyor; karar veri modeli kriterleriyle veriliyor
- [ ] 511, P14'ün `#433`'üne `(#N)` ile bağlı
- [ ] Üç sabit korpus sayısı 485 → **494**
- [ ] `content:stats-check` "0 disagree"; snapshot +9 ders, %100 EXPLAINED
- [ ] `git diff --exit-code -- content/_reports` temiz; `content:check` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Ücretli standardın metni alıntılanır | Madde metni yasak; yalnız numara + ücretsiz katalog sayfası; uygunluk iddiası kurulmaz |
| Kritiklik/MTBF rakamları uydurulur | Rakam yazılmaz; okuyucunun kendi verisinden hesaplama yolu ve `calc` verilir |
| 512 ürün listesine dönüşür ve eskir | Ürün adı geçmez; kriterler veri modeli üzerinden |
| `sql run` ağırlığı kursu tekdüzeleştirir | Dört ders SQL, ikisi `ts run`, biri `calc`, biri `spatial`, ikisi runtime'sız — artefakt çeşitliliği bilinçli |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| FMEA ve kritiklik analizi | Arıza modlarının veri modeli | kapsam — `#507` kritiklik skorunu okuyucunun kendi ağırlıklarıyla kuruyor; FMEA tablosu ayrı |
| Yedek parça ve envanter | Kritik parça, tedarik süresi, stok politikası | kapsam — kütük ve iş emri önce oturmalı |
| Kestirimci bakım için özellik mühendisliği | Telemetriden bakım sinyali çıkarma | bağımlılık — P17'nin zaman serisi ve P18'in downsampling dersleri ön koşul; sonra tek ders |
| Amortisman ve muhasebe bağı | Varlık kaydının mali tabloya bağlanması | uzman pasosu — mali müşavir; korpusun mevcut finans kursuyla da çelişmemeli |
| Enerji / karbon raporlama | Varlık başına tüketim ve raporlama | kaynak — düzenleme ülkeye bağlı ve hızlı değişiyor; yayıncı+ay kuralıyla yazılabilir |
| ISO 55001 uygunluk denetim izi | Denetime hazır kayıt | uzman pasosu + kaynak — standart ücretli; `#506`'nın kuralı gereği madde metni alıntılanamaz |
