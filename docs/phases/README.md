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
| P14 | [14-bim-ifc-data-models.md](14-bim-ifc-data-models.md) | ~6-7 gün | planlandı — 10 ders (431-440) + `spatial` widget + dal |
| P15 | [15-gis-spatial-data.md](15-gis-spatial-data.md) | ~6 gün | planlandı — 14 ders (441-454) |
| P16 | [16-autodesk-developer-platform.md](16-autodesk-developer-platform.md) | ~7 gün | planlandı — 14 ders (455-468), Revit API + APS |
| P17 | [17-iot-telemetry-edge.md](17-iot-telemetry-edge.md) | ~7 gün | planlandı — 14 ders (469-482), MQTT + LoRaWAN |
| P18 | [18-digital-twin-engineering.md](18-digital-twin-engineering.md) | ~6 gün | planlandı — 11 ders (483-493), BIM+GIS + iç mekân |
| P19 | [19-field-data-collection.md](19-field-data-collection.md) | ~5 gün | planlandı — 10 ders (494-503) |
| P20 | [20-asset-management-systems.md](20-asset-management-systems.md) | ~4-5 gün | planlandı — 9 ders (504-512) |
| P21 | [21-smart-infrastructure.md](21-smart-infrastructure.md) | ~5 gün | planlandı — 10 ders (513-522) |
| P22 | [22-domain-closeout.md](22-domain-closeout.md) | ~2 gün | planlandı — çapraz bağlar, bütçe yeniden ölçümü |
| P23 | [23-developer-paths.md](23-developer-paths.md) | ~3 gün | planlandı — 4 path, kurslar arası okuma sırası |

## Ölçülen zemin

Sol sütun, şartnamelerin yazıldığı P0 zeminidir — **değiştirilmez**, çünkü her
faz o sayılara göre gerekçelendirildi. Sağ sütun bugünkü korpustur; ikisinin
arası fazların ne yaptığını gösterir. Hepsi repo'nun kendi modülleriyle
(`listFences`, `splitLessonSections`, `parseMistakes`, `parseFenceMeta`)
ölçüldü — tahmin edilmedi.

| Ölçüm | P0 zemini | Bugün |
|---|---:|---:|
| Ders / kurs / bölüm | 412 / 23 / 2473 | 412 / 23 / **2472** |
| Fence | 505 | 907 |
| Yalnız kod fence'i olan ders | 179 | 68 |
| Yalnız şablon fence'i olan ders | 211 | 137 |
| Hiç fence'i olmayan ders | 0 | 0 |
| TS/TSX/JS fence | 161 | 166 |
| Common Mistakes maddesi | 1746 | 1772 |
| — drill'lenebilir | 705 (%40,4) | **1631 (%92,0)** |
| — tek cümlelik (P2'nin işi) | 1041 | **141** |
| ≥1 drill'lenebilir maddesi olan ders | 215 (sıfır: 197) | **402** (sıfır: 10) |
| Form fence / dosya | 91 / 88 | 91 / 88 |
| Checklist fence / madde | 35 / 293 | 36 / 295 |
| `sql` fence | 9 | 23 |
| `java` fence | 10 | 10 |
| Blockquote kullanan ders | 45 | 88 |
| Mermaid kullanan ders | 0 | 17 |

Bölüm sayısındaki fark bir ölçüm hatasıdır, korpus değişimi değil: 412 ders × 6
bölüm = **2472**, ve hiçbir bölüm boş değil. P0'ın 2473'ü bir fazla saymış.

P8/P9'un tek seferlik fence analizleri (hiç import etmeyen 44, yalnız
tarayıcı-güvenli import 10, WebContainer'da çalışabilen 62, yerel eklenti
isteyen 42, var olmayan `@/` alias'ı 45) ve P0'ın `<pre>` yerleşim sayımı
(505/505) burada **yeniden ölçülmedi** — ilkleri o fazların kendi
şartnamelerinde duruyor, sonuncusu `course_content.blocks.test.ts` tarafından
sürekli korunuyor.

## Widget kapsamı

P0 zemininde hiç yoktu; bunlar fazların ürettiği yüzey.

| Widget | Fence | Ders |
|---|---:|---:|
| `quiz` | 164 | 164 |
| `recall` | 164 | 164 |
| `mermaid` | 17 | 17 |
| `tradeoff` | 13 | 13 |
| `calc` | 13 | 13 |
| `proof` | 12 | 12 |
| `run` (toplam) | 28 | 20 |
| — `sql run` | 17 | |
| — JS/TS `run` | 8 | |
| — `run project` | 3 | |
| `diff` | 2 | 2 |

Her kurs en az bir `quiz` ve bir `recall` taşıyor.

`diff` bir fence dili değil — bir kod fence'i içindeki `// ── broken ──` /
`// ── fixed ──` işaretçi çifti, `looksLikeDiff()` ile sayılır. Neden yalnız
2 tane olduğu ölçülmek zorundaydı ve [P6'da](06-quiz-tradeoff-diff.md) kayda
geçti: korpusun bad/good kalıbı çoğunlukla çok çiftli ya da büyük bir fence'e
gömülü, ve iki yarımlı bir toggle'a uymuyor.

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
