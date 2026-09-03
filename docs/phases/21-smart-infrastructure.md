# P21 — Akıllı altyapı: entegrasyon

**Efor:** ~5 gün · **Bağımlılık:** P15, P17, P18, P20 · **Sonrakiler:** P22

## Neden

"Akıllı altyapı" bir ürün değil, bir **entegrasyon problemi**. Sekiz kursluk
alanın hepsini aynı masaya koyan ders kümesi burası: bir varlığın beş ayrı
sistemde beş ayrı kimliği var, sistemler ortak bir saat paylaşmıyor, ve
verinin kamuya açılan kısmı ayrı bir sorumluluk taşıyor.

Bu kurs en sona kalır çünkü dersleri diğer dördüne `(#N)` ile dayanıyor:
koordinat (P15), telemetri (P17), ikiz durumu (P18), varlık kimliği (P20).
Önce yazılırsa, dayanacağı ders henüz yok.

## Kapsam

**Kurs:** `smart-infrastructure` — "Smart Infrastructure"
**Ders:** 10 · **id:** 513-522 · **bracket:** `1-3` ×1, `3-7` ×6, `7-10` ×3

> *Description:* "Integration, not a product: one asset with five ids, systems
> that do not share a clock, and the contract you write before the sensors
> arrive."

| id | Başlık | bracket |
|---|---|---|
| 513 | Smart Infrastructure as an Integration Problem, Not a Product | 1-3 |
| 514 | OT and IT: Protocol Boundaries, Segregation, and the Gateway | 3-7 |
| 515 | Identity Resolution Across Systems: One Asset, Five Ids | 3-7 |
| 516 | Units, Scales, and Timezones: Normalising at the Boundary | 3-7 |
| 517 | Network Topology as Data: Nodes, Edges, and Connectivity Queries | 3-7 |
| 518 | Event Ordering Across Systems That Do Not Share a Clock | 7-10 |
| 519 | Data Quality Gates for a Public-Facing Feed | 3-7 |
| 520 | Historical Replay: Answering "What Did the System Know at 03:00?" | 7-10 |
| 521 | Sharing Data Without Losing Control: Licences, Redaction, Rate Limits | 3-7 |
| 522 | Designing the Integration Contract Before the Sensors Arrive | 7-10 |

## Yapılacaklar

### `content/courses/smart-infrastructure/` *(yeni)*

10 ders + manifest. Dal slug'ı `sections.ts`'e — bununla `built-environment`
**8 kursa** ulaşır. Kapak `SUBJECTS`'e. Sabit korpus sayıları 494 → **504**.

### `content/_runtime/seeds/crosswalk.sql` *(yeni)*

515/517/519/520 için: aynı varlığın farklı sistemlerdeki kimliklerini tutan
eşleme (crosswalk) tablosu, `parent`/`edge` ile ağ topolojisi, ve
geçerlilik-zamanı sütunları (`valid_from`, `valid_to`) ile 520'nin `AS OF`
sorgusu. Kasıtlı olarak **çakışan iki eşleme** ve **bir kopuk kenar**. ≤50 KB.

### `content/_verify/smart-infrastructure/518/` *(yeni)*

`proof`: sırasız gelen olayların determinist replay'i — duvar saatiyle
sıralama yanlış sonucu üretiyor, Lamport/sürüm vektörü doğru sonucu üretiyor.
Saf Node, sıfır bağımlılık, hiçbir yerde `Date.now()` basılmıyor.

### `scripts/stamp-verified.ts` *(değişiyor)* — `HARM_DENYLIST`

**İki ders eklenir:**

- **514** — OT/IT ayrıştırması bir **güvenlik mitigation'ı**. Yanlış bir
  segregasyon tavsiyesi, endüstriyel bir ağda okuyucunun kendi başına
  doğrulayamayacağı bir zarar üretir.
- **521** — lisans, redaksiyon ve veri paylaşımı **hukuki** içerik; yol
  haritasının "üretime asla bırakılmaz" kalemi (TR hukuk içeriğiyle aynı sınıf).

İkisi de yazılır ve yayımlanır, ama `verified` damgası almaz → değişmez #3
gereği üstlerinde **hiçbir alıştırma açılmaz**. Uzman pasosundan sonra
listeden çıkarılabilir; o zamana kadar yalnız okunur.

Bu, P17'nin 478'iyle birlikte denylist'e giren ikinci ve üçüncü yeni ders —
program boyunca toplam üç ders uzman pasosu bekliyor.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 515 | `ts run` + **`sql run`** | Kimlik çözümleme mantığı; crosswalk sorgusu |
| 516 | `ts run` | Birim/ölçek/zaman dilimi normalleştirici — saf dönüşüm |
| 518 | `ts run` + **`proof`** | Lamport/sürüm vektörü sıralaması; proof sırasız replay'i koşturur |
| 517 | `sql run` | Özyinelemeli bağlantı sorgusu (`WITH RECURSIVE`) |
| 519 | `sql run` | Kalite kapısı sorguları — tohumdaki bozuk kayıtları buluyor |
| 520 | `sql run` | Geçerlilik zamanı sütunlarıyla `AS OF` replay |
| 513 | `mermaid` `sequenceDiagram` (1) | Sistemler arası akış — tam doğrulanan tip |
| **514** | **runtime yok** + denylist | Modbus/BACnet protokolleri; güvenlik |
| **521** | **runtime yok** + denylist | Lisans/gizlilik; hukuki |
| 522 | runtime yok | Sözleşme tasarımı — nesir + `template` |

522'un `template` fence'i, entegrasyon sözleşmesinin doldurulabilir bir iskeleti
olur (P4'ün `TemplateFormCard`'ı) — boş formun yanında **doldurulmuş bir örnek**
ile; yol haritasının business dersleri için koyduğu kuralın aynısı.

## Kaynak kuralı

- OGC API, CityGML, NGSI-LD: ücretsiz ve kalıcı URL'li, sürüm yazılı.
- OT protokolleri (Modbus, BACnet): spesifikasyonun yayıncısı ve sürümü;
  **güvenlik tavsiyesi bu derste verilmez** — 514 denylist'te.
- Açık veri lisansları: lisans metninin **kanonik URL'si**, özeti değil.
  521 hukuki yorum yapmaz; lisans ailelerinin **teknik** sonuçlarını anlatır.
- Şehir/kurum örnekleri: yalnız **kamuya açık, birincil belgeye** dayanan
  örnekler; vendor vaka çalışması anılmaz.

## Kabul kriterleri

- [ ] 10 ders + manifest; `shape/*` sıfır bulgu
- [ ] **8 ders damgalı, 514 ve 521 damgasız** (`HARM_DENYLIST`); ikisinde de
      `quiz`/`recall` fence'i yok, `drill/widget-on-unverified-lesson` temiz
- [ ] `parseMistakes` bu 10 derste **0 `single`** madde raporluyor
- [ ] `crosswalk.sql` ≤50 KB; 515/517/519/520 fence'leri PGlite'ta koşuyor;
      519'nın kalite kapısı tohumdaki bozuk kayıtları **gerçekten** buluyor
- [ ] 518'in `proof` bloğu damgalı, sıfır bağımlılık, iki koşuda byte-aynı;
      çıktıda hiçbir gerçek zaman damgası yok
- [ ] 513'ün `sequenceDiagram`'ı `verify-mermaid`'de tam doğrulanan sınıfta
- [ ] 522'un `template` fence'inin yanında doldurulmuş örnek var
- [ ] Dersler P15/P17/P18/P20'ye `(#N)` ile bağlı; `links/dead-lesson-ref` temiz
- [ ] `built-environment` dalı 8 kurs; P13'ün "asgari 3 kurs" testi artık
      gerçek veriyle geçiyor (`it.todo` bırakıldıysa etkinleştirildi)
- [ ] Üç sabit korpus sayısı 494 → **504**
- [ ] `content:stats-check` "0 disagree"; snapshot +10 ders, %100 EXPLAINED
- [ ] `git diff --exit-code -- content/_reports` temiz; `content:check` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Güvenlik (OT segregasyonu) doğrulanmadan yayımlanır | 514 `HARM_DENYLIST`'te; alıştırma açılmaz, uzman pasosu bekler |
| Hukuki içerik (lisans/gizlilik) üretime bırakılır | 521 denylist'te; ders teknik sonuçlarla sınırlı, hukuki yorum yok |
| Vendor vaka çalışması "kanıt" gibi anılır | Yalnız kamuya açık birincil belge; vendor vakası anılmaz |
| Kurs, önceki dörtünü tekrar eder | Her ders bağımlılığına `(#N)` ile bağlanır; bu kurs **kesişimi** anlatır, parçaları değil |
| En sona kaldığı için sıkıştırılır | Bağımlılığı gerçek: P15/P17/P18/P20 merge edilmeden dersleri yazılamaz. Sıkışırsa ölçek düşer, kalite değil |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| CityGML / 3DCityDB derinlemesine | Şehir ölçeğinde model şeması | kapsam — `#513` standart manzarasını kuruyor; şema derinliği ayrı ders |
| NGSI-LD / FIWARE | Bağlam broker mimarisi | kapsam — aynı sebep; biri doğru ilan edilmiyor |
| GTFS ve hareketlilik verisi | Toplu taşımanın açık veri formatı | kapsam — iyi bir `sql run` adayı; kursun ekseni entegrasyon, ulaşım alan-özel |
| Enerji şebekesi CIM (IEC 61970) | Şebeke varlıklarının standart modeli | kaynak — IEC ücretli; `#517` ağ topolojisini zaten genel olarak kuruyor |
| Su şebekesi hidroliği (EPANET) | Ağ modelinin simülasyonu | kapsam — simülasyon P18/`#491`'in sınırında; alan-özel |
| Şehir ölçeği twin federasyonu | Birden çok ikizin şehir düzeyinde birleşmesi | bağımlılık — P18'in eklenebilirler listesindeki federasyonla aynı kalem |
| Kamu veri portalı yayımlama | Veriyi lisanslı ve sürümlü yayımlama | bağımlılık — `#521` **denylist'te** (hukuki); uzman pasosundan sonra |
