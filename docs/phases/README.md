# Faz şartnameleri — interaktif zenginleştirme

412 dersi okunabilir bir referanstan, okuyucudan bir şey **üretmesini isteyen**
bir kursa çevirme işi. Her dosya tek bir fazın uygulanabilir şartnamesidir ve
tek başına merge edilebilir.

Bağlam: [`../investigate/04-roadmap.md`](../investigate/04-roadmap.md) (teşhis ve
yasaklar), [`../adr/0001-no-backend-markdown-content.md`](../adr/0001-no-backend-markdown-content.md)
(backend yok), [`../adr/0002-client-side-code-execution.md`](../adr/0002-client-side-code-execution.md)
(çalıştırma kararı).

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
```

| Faz | Dosya | Efor | Durum |
|---|---|---|---|
| P0 | [00-blocks-and-copy.md](00-blocks-and-copy.md) | ~1 gün | tamamlandı |
| P1 | [01-callouts-and-drill.md](01-callouts-and-drill.md) | ~3 gün | tamamlandı — `verified` 396/412 derste damgalı |
| P2 | [02-bold-lead-pass.md](02-bold-lead-pass.md) | ~1-2 hafta (içerik) | sürüyor — batch 5/~20, single 1038→858, `content/_reports/mistakes.json` |
| P3 | [03-concept-glossary.md](03-concept-glossary.md) | ~2 gün | tamamlandı — 125 terim |
| P4 | [04-template-widgets.md](04-template-widgets.md) | ~3 gün | tamamlandı |
| P5 | [05-ci-and-proof.md](05-ci-and-proof.md) | ~4 gün | tamamlandı, daraltılmış — 3 pilot ders, CI yeşil |
| P6 | [06-quiz-tradeoff-diff.md](06-quiz-tradeoff-diff.md) | ~4 gün | tamamlandı, daraltılmış — 1 ders/mekanizma |
| P7 | [07-mermaid.md](07-mermaid.md) | ~1 gün | tamamlandı — 7 diyagram |
| P8 | [08-live-js-runner.md](08-live-js-runner.md) | ~4-5 gün | tamamlandı — 5 `run` fence |
| P9 | [09-webcontainer.md](09-webcontainer.md) | ~5-6 gün | uygulandı, gerçek tarayıcıda doğrulanmadı (OAuth akışı) |
| P10 | [10-pglite-sql.md](10-pglite-sql.md) | ~3-4 gün | tamamlandı — 3 pilot ders yeniden yazıldı |
| P11 | [11-recall-and-calc.md](11-recall-and-calc.md) | ~3 gün | RecallCard tamamlandı; CalcCard kasıtlı ertelendi (spec'in kendi sırası) |
| P12 | [12-search-and-review-queue.md](12-search-and-review-queue.md) | ~4 gün | tamamlandı — ⌘K, next/prev, Return Queue, export/import |

## Ölçülen zemin

Bu sayılar bu repoda çalıştırılarak elde edildi; şartnameler bunlara dayanıyor.
Korpus değiştikçe yeniden ölçün — tahmin etmeyin.

| Ölçüm | Değer |
|---|---:|
| Ders / kurs / bölüm | 412 / 23 / 2473 |
| Fence | 505 |
| `<pre>` düğümünün bölüm kökünün doğrudan çocuğu olması | **505 / 505** (iç içe: 0) |
| Yalnız kod fence'i olan ders | 179 |
| Yalnız şablon fence'i olan ders | 211 |
| Hiç fence'i olmayan ders | 0 |
| TS/TSX/JS fence | 161 |
| — hiç import etmeyen | 44 (**yalnız 5'i `console.log` yapıyor**) |
| — yalnız tarayıcı-güvenli import | 10 |
| — WebContainer'da çalışabilen | **62 (62 ders)** |
| — yerel eklenti/harici sunucu isteyen | 42 |
| — var olmayan `@/` alias'ı | 45 |
| Common Mistakes maddesi | 1746 |
| — drill'lenebilir formda | **705 (%40,4)** |
| — tek cümlelik (P2'nin işi) | 1041 |
| ≥1 drill'lenebilir maddesi olan ders | **215** (sıfır olan: 197) |
| Form şeklinde fence / dosya | 91 / 88 |
| Checklist fence / madde | 35 / 293 |
| `sql` fence | 9 (`database-caching-performance`'ta 0) |
| `java` fence | 10 (hepsi Spring Boot/JPA) |
| Blockquote kullanan ders | 45 |
| Mermaid kullanan ders | 0 |

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
```
