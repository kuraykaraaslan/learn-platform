# Faz şartnameleri — interaktif zenginleştirme

412 dersi okunabilir bir referanstan, okuyucudan bir şey **üretmesini isteyen**
bir kursa çevirme işi. Her dosya tek bir fazın uygulanabilir şartnamesidir ve
tek başına merge edilebilir.

Bağlam: [`../investigate/04-roadmap.md`](../investigate/04-roadmap.md) (teşhis ve
yasaklar), [`../adr/0001-no-backend-markdown-content.md`](../adr/0001-no-backend-markdown-content.md)
(backend yok), [`../adr/0002-client-side-code-execution.md`](../adr/0002-client-side-code-execution.md)
(çalıştırma kararı).

**İkinci program (P13-P22).** P0-P12 mevcut korpusu zenginleştirdi. P13-P22
korpusa **yeni bir alan** ekliyor: yapılı çevre ve mekânsal veri — 8 kurs,
92 ders (id 431-522), aynı yazılımcı kitlesine. Ayrı bir program sayılmasının
sebebi ölçütünün farklı olması: mevcut dersleri dönüştürmek değil, korpusta
ölçülmüş olarak **hiç bulunmayan** bir alanı açmak (`BIM`, `GIS`, `IFC`,
`Autodesk`, `MQTT`, `PostGIS` terimlerinin 412 derste eşleşmesi: sıfır).

P24 ve P25 aynı ölçütle o dala iki kurs daha ekledi — dalın kendi içindeki
boşlukları kapatarak. P24 cihazın elektriğini (`GPIO`, `I2C`, `ohm`: sıfır),
P25 o elektriğin üstündeki yazılımı (`RTOS`, `DMA`, `mutex`, `fixed-point`:
sıfır). Alan artık 10 kurs, 123 ders.

P13-P25'in her şartnamesi bir **`## Eklenebilecekler`** tablosu taşıyor: o fazın
kapsamı dışında bırakılan adaylar ve her birinin neden şimdi olmadığı (*kapsam*,
*bağımlılık*, *doktrin*). Doktrine takılanlar `yasak` işaretli — ertelenmiş
değil reddedilmiş. Bir aday kapsama alınınca tablodan çıkar, ders listesine
girer. Amaç, altı ay sonra aynı kararın sıfırdan tartışılmaması.

## Sıra ve bağımlılıklar

```
P0 blok refaktörü ────┬─→ P1 callout + drill ──→ P2 bold-lead geçişi (içerik)
  (her şeyin zemini)  │         │
                      │         └─→ P11 recall
                      ├─→ P3 kavram sözlüğü
                      ├─→ P4 şablon widget'ları
                      ├─→ P7 mermaid
                      └─→ P8 canlı JS ──→ P9 WebContainer ──→ P10 PGlite
                                              (COOP/COEP burada gelir)
P5 CI + proof ────────→ P6 quiz/tradeoff/diff
  (P1'in verified kapısına dayanır)
P12 arama + return queue  ← P1'in drill sonuçlarına dayanır

── ikinci program: yapılı çevre ─────────────────────────────────────
P13 dal mekanizması (kod, içerik yok)
  └─→ P14 BIM/IFC + `spatial` widget   (dal burada açılır, arketip donar)
        ├─→ P15 GIS ──→ P19 saha verisi
        ├─→ P16 Revit API + APS
        ├─→ P17 IoT + LoRaWAN ──→ P18 dijital ikiz (BIM+GIS)
        └─→ P20 varlık yönetimi
P21 akıllı altyapı  ← P15, P17, P18, P20 (kesişim dersleri)
P22 kapanış         ← P14..P21 (çapraz bağlar, yeniden ölçüm)
P23 developer path'leri  ← P14..P21 (kurslar arası okuma sırası)
P24 IoT donanım temelleri ← P17 (dalın giriş kapısı; okuma sırasında #469'un önüne girer)
P25 gömülü firmware      ← P24 (donanım ile taşıma arasındaki yazılım; okuma sırası 524 → 542 → 469)
P26 cihaz dalı kapanışı  ← P24, P25 (P22'nin iki yönlü bağ kuralı, kapanıştan sonra gelen iki kursa)
P27 model koordinasyonu  ← P14, P16, P20 (dalın yazma yarısı: federasyon, çakışma, BCF, IFC yazma)
P28 durum izleme         ← P17, P18, P20 (telemetri ile bakım kararı arasındaki katman)
P29 varlık tanıma        ← P19, P20 (kütükteki satır ile önündeki nesne arasındaki bağ)
P30 ikinci nesil kapanışı ← P24..P29 (kursları birbirine bağlamak, operasyon path'i)

── yol haritasına dönüş ─────────────────────────────────────────────
P31 numbers that matter  ← yol haritasının T2.2'si (otuz faz boyunca açılmadı)
P32 numbers'ın yayılması ← P31 (Postgres dışına: Node koşuluyor, Redis/k8s linkleniyor)
P33 course cheat sheet   ← yol haritasının T3'ü (türetilen tek sayfa; içerik yazılmıyor)
P34 capstone             ← yol haritasının T2.4'ü (tanımanın ötesi; rubric türetiliyor)
P35 capstone doğrulanıyor ← P5, P34 (referansın iddiaları CI'da koşuyor)
P36 rubric doğrulanmışı ölçer ← P34, P35 (P34'ün 12 satırının 8'i denylist dersini alıntılıyordu)
P37 denylist denetimi    ← P36 (bir örnek mi örüntü mü: on bir yüzey ölçüldü)
P38 arama capstone'u bulur ← P12, P34 (cheat sheet bilinçli olarak indekslenmiyor)
P39 üçüncü capstone      ← P34..P36 (`security`: inşa etmek değil incelemek)
P40 doğrulanamaz dil kapısı ← P16, P22 (sayaç, kapısı olmadığı için saymayı bırakmıştı)
P41 dördüncü capstone    ← P35, P39 (koşturulacak hiçbir şeyin olmadığı yerde referans)
P42 beşinci capstone     ← P36, P41 (en riskli alan; T2.4'ün beş kursu tamam)
```

| Faz | Dosya | Efor | Durum |
|---|---|---|---|
| P0 | [00-blocks-and-copy.md](00-blocks-and-copy.md) | ~1 gün | tamamlandı |
| P1 | [01-callouts-and-drill.md](01-callouts-and-drill.md) | ~3 gün | tamamlandı — `verified` 396/412 derste damgalı |
| P2 | [02-bold-lead-pass.md](02-bold-lead-pass.md) | ~1-2 hafta (içerik) | tamamlandı — 29 batch, single 1041→141, `>=2 drill` 159→380 |
| P3 | [03-concept-glossary.md](03-concept-glossary.md) | ~2 gün | tamamlandı — 125 terim |
| P4 | [04-template-widgets.md](04-template-widgets.md) | ~3 gün | tamamlandı |
| P5 | [05-ci-and-proof.md](05-ci-and-proof.md) | ~4 gün | tamamlandı — 12 proof dersi (hedef ~10), CI yeşil |
| P6 | [06-quiz-tradeoff-diff.md](06-quiz-tradeoff-diff.md) | ~4 gün | tamamlandı — mekanizma başına 1 dersle açıldı, sonra yayıldı: quiz 76, tradeoff 13 |
| P7 | [07-mermaid.md](07-mermaid.md) | ~1 gün | tamamlandı — 17 diyagram (13'ü `verify-mermaid`'de tam doğrulanıyor) |
| P8 | [08-live-js-runner.md](08-live-js-runner.md) | ~4-5 gün | tamamlandı — 8 JS/TS `run` fence |
| P9 | [09-webcontainer.md](09-webcontainer.md) | ~5-6 gün | pilot yazıldı (korpusun ilk `run project` fence'i), boot hâlâ tarayıcıda doğrulanmalı |
| P10 | [10-pglite-sql.md](10-pglite-sql.md) | ~3-4 gün | tamamlandı — 3 pilot ders, sonra 14 `sql run` fence |
| P11 | [11-recall-and-calc.md](11-recall-and-calc.md) | ~3 gün | tamamlandı — RecallCard + CalcCard/`expr.ts`; recall 76, calc 13 derse yayıldı |
| P12 | [12-search-and-review-queue.md](12-search-and-review-queue.md) | ~4 gün | tamamlandı — ⌘K, next/prev, Return Queue, export/import |
| P13 | [13-course-branches.md](13-course-branches.md) | ~1 gün | tamamlandı — `CourseSectionId` veriden türüyor; 6 yeni dal iddiası, test 268 → 274 |
| P14 | [14-bim-ifc-data-models.md](14-bim-ifc-data-models.md) | ~6-7 gün | tamamlandı — 10 ders (431-440), `built-environment` dalı, `spatial` widget (3 tüketici) |
| P15 | [15-gis-spatial-data.md](15-gis-spatial-data.md) | ~6 gün | tamamlandı — 14 ders (441-454), `asset_points` seed, 2 proof; `run project` merge edilmedi (P9) |
| P16 | [16-autodesk-developer-platform.md](16-autodesk-developer-platform.md) | ~7 gün | tamamlandı — 14 ders (455-468); 9 C# fence (hepsi ≤15 satır), oynaklık kaydı dolu |
| P17 | [17-iot-telemetry-edge.md](17-iot-telemetry-edge.md) | ~7 gün | tamamlandı — 14 ders (469-482); 13 damgalı, 478 denylist'te (güvenlik) |
| P18 | [18-digital-twin-engineering.md](18-digital-twin-engineering.md) | ~6 gün | tamamlandı — 11 ders (483-493), 2 seed + 2 proof, iç mekân grafı |
| P19 | [19-field-data-collection.md](19-field-data-collection.md) | ~5 gün | tamamlandı — 10 ders (494-503), offline kuyruk + istemci id |
| P20 | [20-asset-management-systems.md](20-asset-management-systems.md) | ~4-5 gün | tamamlandı — 9 ders (504-512), `asset_register` seed, `510` proof, anti-join + birleştirme hunisi |
| P21 | [21-smart-infrastructure.md](21-smart-infrastructure.md) | ~5 gün | tamamlandı — 10 ders (513-522); 8 damgalı, 514 + 521 denylist'te, `crosswalk` seed, `518` proof |
| P22 | [22-domain-closeout.md](22-domain-closeout.md) | ~2 gün | tamamlandı — 6 forward `(#N)` bağı, arama indeksi 77.393 B gz (sınır 98.304), `cap-starved` 2, `shadowed` 0 |
| P23 | [23-developer-paths.md](23-developer-paths.md) | ~3 gün | tamamlandı — 4 path (`bim-developer` 16, `gis-developer` 12, `iot-engineer` 16, `digital-twin` 16; ilk ikisi sonraki fazlarda güncellendi, beşincisi P30'da eklendi), `/paths` + 4 statik sayfa, ders rozeti sunucu bileşeni |
| P24 | [24-iot-hardware-basics.md](24-iot-hardware-basics.md) | ~9-10 gün | tamamlandı — 18 ders (524-541), 17 damgalı, 541 denylist'te, `device_calibration` seed, `532` + `537` proof, `diff` 2 → 3 |
| P25 | [25-embedded-firmware.md](25-embedded-firmware.md) | ~7-8 gün | tamamlandı — 12 ders (542-553), 12'si damgalı, denylist değişmedi, `545` + `549` proof, `diff` 3 → 4, hiç C fence'i yok |
| P26 | [26-device-branch-closeout.md](26-device-branch-closeout.md) | ~2-3 gün | tamamlandı — yeni ders yok; 8 geriye bağ, iki yeni kurs 1/0 → **2/2** kurstan bağ alıyor, sözlük 139 → 149 (`shadowed` 0), 11 yeni link render, 0 kayıp |
| P27 | [27-model-coordination-exchange.md](27-model-coordination-exchange.md) | ~6-7 gün | tamamlandı — 9 ders (554-562), 9'u damgalı, `557` proof, `diff` 4 → 5; dalın yazma yarısı (federasyon, çakışma sorgusu, BCF, IFC yazma, COBie şeması) |
| P28 | [28-condition-monitoring.md](28-condition-monitoring.md) | ~6-7 gün | tamamlandı — 9 ders (563-571), 9'u damgalı, `condition_history` seed (8 `sql run`), `566` proof (maskeleme sayıldı), `sql` fence 79 → 87 |
| P29 | [29-asset-identification.md](29-asset-identification.md) | ~5-6 gün | tamamlandı — 9 ders (572-580), 9'u damgalı, yeni seed yok (`asset_register` yeniden kullanıldı), `574` proof (kontrol basamağı hata sınıfları sayıldı) |
| P30 | [30-second-generation-closeout.md](30-second-generation-closeout.md) | ~2 gün | tamamlandı — yeni ders yok; 8 bağ, `iot-hardware-basics` ilk nesilden 1 → **4** bağ, yeni kurslar arası 4 → 6 kenar, 5. path (`operations-engineer`, 16 adım) |
| P31 | [31-numbers-that-matter.md](31-numbers-that-matter.md) | ~4 gün | tamamlandı — yol haritasının T2.2'si, bölüm değil **fence** olarak; `numbers` widget'ı (sunucu bileşeni, 0 istemci baytı), 2 lint kuralı, 4 pilot ders, `42`'nin proof'u varsayılanları gerçek PostgreSQL'den okuyor |
| P32 | [32-numbers-spread.md](32-numbers-spread.md) | ~3 gün | tamamlandı — yeni ders yok; 5 ders daha (`numbers` 4 → 9), `401`'in proof'u Node'un zaman aşımlarını gerçek sunucu nesnesinden okuyor, Redis/k8s dokümana linkleniyor |
| P33 | [33-course-cheat-sheet.md](33-course-cheat-sheet.md) | ~2 gün | tamamlandı — yol haritasının T3'ü; kurs başına türetilen yazdırılabilir sayfa (36 statik rota, build 615 → **651**), birebir sözleşmesi testle korunuyor, ders metni değişmedi |
| P34 | [34-capstone.md](34-capstone.md) | ~4-5 gün | tamamlandı — yol haritasının T2.4'ü; iki pilot capstone (`database-advanced`, `distributed-systems-api-design`), rubric satırları kursun kendi mistake lead'lerinden **birebir** (lint + test), referans puanlanana kadar mühürlü, puan **saklanmıyor** |
| P35 | [35-verifiable-capstone.md](35-verifiable-capstone.md) | ~1-2 gün | tamamlandı — P34'ün bıraktığı yumuşak nokta kapandı: `stamp-verify` capstone workspace'ini tanıyor (`proof` 32 → 34), iki referansın kilit ve idempotency iddiaları artık CI'da koşuyor, `capstone/hand-edited-proof` kuralı |
| P36 | [36-rubric-cites-verified.md](36-rubric-cites-verified.md) | ~1 gün | tamamlandı — ölçüm P34'te bir doktrin ihlali buldu: 12 rubric satırının **8'i** `HARM_DENYLIST` dersini alıntılıyordu. `capstone/rubric-cites-unverified` kuralı + sekiz satır doğrulanmış derslerden yeniden kaynaklandı |
| P37 | [37-denylist-audit.md](37-denylist-audit.md) | ~1 gün | tamamlandı — P36'nın sınıfı süpürüldü: **on bir yüzey** denylist'e karşı ölçüldü, path'lerde ve sözlükte **0**, tek bulgu `#319`'un `calc` varsayılanı (kaynaksız mevzuat rakamı) ve o düzeltildi |
| P38 | [38-search-finds-the-capstone.md](38-search-finds-the-capstone.md) | ~1 gün | tamamlandı — arama indeksi 562 → **564 kayıt** (iki capstone); rotanın şekli sayesinde `SearchRecord` ve istemci **değişmedi**. Cheat sheet bilinçli olarak dışarıda: P33'ün birebir sözleşmesi gereği her sonucu ikizlerdi |
| P39 | [39-security-capstone.md](39-security-capstone.md) | ~2-3 gün | tamamlandı — üçüncü capstone (`security`), şekli bilinçli olarak **inceleme**: kursun 3 dersi denylist'te ve rubric'in altı satırı da doğrulanmış derslerden. Referans `ORDER BY`'ın parametrelenemediğini koşarak gösteriyor, sömürü göstermeden |
| P40 | [40-unverified-language-gate.md](40-unverified-language-gate.md) | ~1 gün | tamamlandı — P22'nin "terfi backlog'a takılı" kaydı ölçüldü ve backlog'un **kalıcı** olduğu bulundu (9 C# + 10 Java, ikisi de tasarım). Kural artık hem sayaç hem kapı: kabul edilen iki dil `warn`, listede olmayan her dil **error**; `csharp` fence satırı stats'a eklendi |
| P41 | [41-business-capstone.md](41-business-capstone.md) | ~2 gün | tamamlandı — dördüncü capstone (`business-finance-solo-ops`), **koşturulacak hiçbir şeyin olmadığı ilk capstone**: `proof` yok ve bu P35'in kuralının gereği. Brief'teki her rakam kurgunun kendisine ait, dış olgu iddiası yok |
| P42 | [42-contracts-capstone.md](42-contracts-capstone.md) | ~2 gün | tamamlandı — beşinci capstone (`contracts-pricing-legal`) ve **yol haritasının T2.4'ü tamamlandı**. En riskli alan: ölçüm 33 dersin 31'inin doğrulanmış ve ticari olduğunu, denylist'teki ikisinin tam da avukat isteyenler olduğunu gösterdi. Şekil "gitmeden önce incele", sorumluluk reddi brief'in ilk bloğunda |

## Ölçülen zemin

Sol sütun, şartnamelerin yazıldığı P0 zeminidir — **değiştirilmez**, çünkü her
faz o sayılara göre gerekçelendirildi. Sağ sütun bugünkü korpustur; ikisinin
arası fazların ne yaptığını gösterir. Hepsi repo'nun kendi modülleriyle
(`listFences`, `splitLessonSections`, `parseMistakes`, `parseFenceMeta`)
ölçüldü — tahmin edilmedi.

| Ölçüm | P0 zemini | Bugün |
|---|---:|---:|
| Ders / kurs / bölüm | 412 / 23 / 2473 | 562 / 36 / **3372** |
| Fence | 505 | 1470 |
| Yalnız kod fence'i olan ders | 179 | 67 |
| Yalnız şablon fence'i olan ders | 211 | 138 |
| Hiç fence'i olmayan ders | 0 | 1 |
| TS/TSX/JS fence | 161 | 272 |
| Common Mistakes maddesi | 1746 | 2681 |
| — drill'lenebilir | 705 (%40,4) | **2540 (%94,7)** |
| — tek cümlelik (P2'nin işi) | 1041 | **141** |
| ≥1 drill'lenebilir maddesi olan ders | 215 (sıfır: 197) | **552** (sıfır: 10) |
| Form fence / dosya | 91 / 88 | 94 / 90 |
| Checklist fence / madde | 35 / 293 | 41 / 364 |
| `sql` fence | 9 | 95 |
| `java` fence | 10 | 10 |
| `csharp` fence | 0 | 9 |
| Blockquote kullanan ders | 45 | 91 |
| Mermaid kullanan ders | 0 | 30 |

Bölüm sayısındaki fark bir ölçüm hatasıdır, korpus değişimi değil: 412 ders × 6
bölüm = **2472**, ve hiçbir bölüm boş değil. P0'ın 2473'ü bir fazla saymış.

"Hiç fence'i olmayan ders" 0 → 1: P24'ün `#541` (şebeke / lityum / sertifikasyon)
bir sınır dersidir — `quiz`/`recall` yok (denylist), runtime yok, kod yok. Nesir
ve bir yönlendirme tablosu. Korpusta bilinçli olarak fence'siz tek ders.

Bir uyarı, çünkü iki sütunun anlamı P13'ten sonra ayrıştı: `P0 zemini` 412
dersin ölçüsüdür, `Bugün` ise alan dersleri dahil bütün korpusu ölçer. İkinci
program ilerledikçe aradaki fark artık "fazların **mevcut** derslere yaptığı"
demek değil — büyümenin bir kısmı yeni bir alanın eklenmesinden geliyor. O
kısım aşağıda ayrı ölçülüyor.

## Alan bloğu

İkinci programın (P13-P22) kendi ölçüsü. Sol sütun P13 zeminidir — korpusta
yapılı çevre alanı **hiç yoktu**, yani hepsi sıfır — ve o sütun da hiç
kımıldamaz. Kurs kümesi elle yazılmaz: `corpus-stats.ts` bunu
`COURSE_SECTIONS`'ın `built-environment` dalından türetir, yani tek gerçek
kaynak `course_content.sections.ts` olarak kalır.

| Alan ölçüsü | P13 zemini | Bugün |
|---|---:|---:|
| Alan dersi / alan kursu | 0 / 0 | 150 / 13 |
| Alan fence'i | 0 | 548 |
| Alan Common Mistakes maddesi | 0 | 909 |
| Alan — drill'lenebilir | 0 | 909 |

P8/P9'un tek seferlik fence analizleri (hiç import etmeyen 44, yalnız
tarayıcı-güvenli import 10, WebContainer'da çalışabilen 62, yerel eklenti
isteyen 42, var olmayan `@/` alias'ı 45) ve P0'ın `<pre>` yerleşim sayımı
(505/505) burada **yeniden ölçülmedi** — ilkleri o fazların kendi
şartnamelerinde duruyor, sonuncusu `course_content.blocks.test.ts` tarafından
sürekli korunuyor.

**İki indeks bütçesi (P22'de ölçüldü, P25 ve P38'de yeniden).** Arama indeksi
P13 zemininde 64.207 B gz idi; P22'de 505 derste 77.393 B gz; bugün **564
kayıtta 85.833 B gz** — 562 ders artı P38'in eklediği iki capstone.
`MAX_INDEX_GZ_BYTES` (98.304 B, `build-search-index.ts:33`) altında, **~12 KB
marj**, sınır değişmedi. Kurs başına maliyet ölçülü: son iki kurs (30 ders)
~4,6 KB ekledi, iki capstone kaydı ise yalnız **111 B**. Bu hızla sınır ~5
kurs sonra konuşulur — capstone'lar değil kurslar yaklaştırıyor. Review
indeksinin bütçe kontrolü yok; P22'de 2.126 kartla 201.160 B gz, bugün
**2.462 kartla 224.731 B gz**. Kavram sözlüğü P22'de 139 terimdi; P26 cihaz dalı için 10, P27 koordinasyon
kursu için 5, P28 durum izleme için 5, P29 varlık tanıma için 5 terim ekledi ve
bugün **164**. `cap-starved` (4-link sınırına dayanan) ders
sayısı **1** (P29'un bağları biriyle çakışan bir terime yer açtı), `shadowed` 0, `case-mismatch` 0 — üçü de P22'den beri kımıldamadı.
`own-lesson-only` 5 → 8: üç yeni terim yalnız tanımlandığı derste geçiyor,
yani hiçbir yerde tooltip render etmiyor. Bu P3'ün ölçülen kategorilerinden
biri, hata değil.

**Bir kursun korpusa bağlılığı da ölçülür.** P22'nin kuralı bir kursun *iki
yönlü* bağlanmasıydı, ama P24 ve P25 o kapanıştan sonra geldi ve kural onlara
uygulanmamıştı: `iot-hardware-basics`'e 1, `embedded-firmware`'a **0** kurstan
bağ vardı (karşılaştırma: P17'ye 7, P14/P18'e 5). P26 ikisini de 2'ye çıkardı —
uydurulmuş bağla değil, nesrin zaten işaret ettiği sekiz yere. P27, P28 ve P29 aynı kuralı
**doğuşta** uyguladı: üç yeni kurs da üç kurstan bağ alarak açıldı, çünkü
aynı borcu ikinci kez ödemenin anlamı yok.

P30 kuralın ölçmediği yeri ölçtü. P22'nin kuralı bir kursun **ilk nesille**
bağını denetliyor; ikinci neslin **kendi içindeki** bağını kimse bakmamıştı ve
orada dört kenar vardı, 26'sı tek çiftte. `model-coordination-exchange`
diğer yeni kursların hiçbirine bağlı değildi ve `iot-hardware-basics` korpusa
72 kez yazıp ilk nesilden **1** bağ alıyordu. Sekiz bağla ikisi de kapandı:
hardware 4, kenar sayısı 6.

## Widget kapsamı

P0 zemininde hiç yoktu; bunlar fazların ürettiği yüzey.

| Widget | Fence | Ders |
|---|---:|---:|
| `quiz` | 310 | 310 |
| `recall` | 310 | 310 |
| `mermaid` | 30 | 30 |
| `tradeoff` | 24 | 24 |
| `calc` | 21 | 21 |
| `spatial` | 6 | 6 |
| `proof` | 32 | 32 |
| `run` (toplam) | 158 | 107 |
| — `sql run` | 82 | |
| — JS/TS `run` | 73 | |
| — `run project` | 3 | |
| `numbers` | 9 | 9 |
| `diff` | 5 | 5 |

Her kurs en az bir `quiz` ve bir `recall` taşıyor.

`diff` bir fence dili değil — bir kod fence'i içindeki `// ── broken ──` /
`// ── fixed ──` işaretçi çifti, `looksLikeDiff()` ile sayılır. Neden yalnız
2 tane olduğu ölçülmek zorundaydı ve [P6'da](06-quiz-tradeoff-diff.md) kayda
geçti: korpusun bad/good kalıbı çoğunlukla çok çiftli ya da büyük bir fence'e
gömülü, ve iki yarımlı bir toggle'a uymuyor. Sayı 5'e çıktı ve üçü de sonradan
**bu şekil için yazıldı** (P24/535, P25/543, P27/561) — mevcut fence'lerden
dönüştürülerek değil. P6'nın bulgusu ayakta: eski korpus bu kalıba uymuyor, yenisi uyabiliyor.

## Değişmezler — her fazda geçerli

1. **`content/_reports/parse-snapshot.json` kımıldamamalı.** Tek istisna P4;
   orada bilinçli yeniden üretilir ve dosyalar commit mesajında adlandırılır.
2. **`npm run content:check` yeşil kalmalı** (lint + verify-code + test).
3. **Doğrulanmamış derste alıştırma açılmaz.** Yol haritasının durma kuralı;
   `verified` damgası + `drill/unverified-lesson` kuralıyla mekanik olarak zorlanır.
4. **Sertifika, streak, tamamlanma yüzdesi eklenmez.** Store'da bunları
   hesaplayacak alan bulunmaz; `progress.store.test.ts` bunu doğrular.
5. **Run düğmesi yalnız gerçekten bir runtime olan yerde bulunur.** Gri düğme,
   "yakında", sahte terminal yok.
6. **Her lint kuralı `warn` doğar**, korpus o kuraldan temizlenince `error`'a
   terfi eder — repo usulü.

## Bir fazı uygularken

```bash
git checkout -b feature/<faz-scope>
# ... şartnamedeki adımlar ...
npm run content:check
git diff --stat content/_reports/parse-snapshot.json   # boş olmalı (P4 hariç)
npm run content:snapshot-diff                          # hareket varsa: hangi tür?
```

`content:snapshot-diff`, snapshot hareketini ikiye ayırır: **explained** (o
bölümün kendi markdown'ı değişti — normal) ve **UNEXPLAINED** (markdown'ı
byte-byte aynı, render'ı değişti). İkincisi `git diff`'te görünmez ve script 1
ile çıkar. Bilinen sebebi `remark-concepts`'in ders başına paylaşılan kavram
linki bütçesidir: erken bir bölüme metin eklemek, sonraki bölümdeki bir
tooltip'i sessizce düşürebilir.

Bu yüzden **blockquote'lar kavram linki almaz**. Korpusta blockquote içinde
duran 15 kavram linkinin 15'i de bir uyarı metninin içindeydi — hiçbiri
öğretici içerik değildi, ama ders bütçesinden slot yiyor ve bölüm başına
ilk-geçiş kuralını tüketiyorlardı. Ders 321 bunun somut örneğiydi:
`effective hourly rate` tooltip'i uyarıdaki geçişe takılıyor, terimin
gerçekten tanımlandığı cümle linksiz kalıyordu.
