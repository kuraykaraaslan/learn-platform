# P12 — ⌘K arama · next/prev · Return Queue

**Efor:** ~4 gün · **Bağımlılık:** P1 (drill sonuçları)

## 1. ⌘K korpus araması

`scripts/build-search-index.ts` prebuild → `public/search-index.json`
(412 kayıt, ~40 KB gz).

`DashboardShell`'in **kullanılmayan `topbarExtra` prop'u** zaten
`/** Extra content in the topbar right group … (e.g. search) */` yorumuyla
duruyor — hazır slot.

**Common Mistakes maddelerini yüksek ağırlıklandırın.** Böylece korpus
**semptomla** aranabilir hale gelir: "double charge", "lock timeout",
"connection pool exhausted". Bu, bir kavramın adını bilmeyen okuyucunun tek
girişidir.

`LessonSectionCard`'a `anchorId` gerekir (bölüme derin link).

## 2. next/prev bağlantısı

`getLessonNeighbors()` + footer. Her ders bugün terminal bir düğüm; okuma
oturumu sayfa bitince bitiyor.

> **Tik/streak/tamamlanma yüzdesi eklemeyin.** Yol haritasının açık yasağı:
> bunlar çevrilen sayfayı ölçer — yani bu projenin yok etmek için var olduğu
> bilme yanılsamasını üreten metrik.

## 3. Return Queue — Leitner

`/review` route'u, kutular 1/3/7/21/60 gün, kurslar arası karıştırılmış günde
10 kart.

**Kendi destesi yok:** P1'in drill öz-değerlendirmeleri (*Biliyordum / Yarım /
Kaçırdım*) üzerine kurulur, o yüzden neredeyse bedava. "Kaçırdım" işaretlenen bir
madde 1. kutuya girer.

JSON export/import zorunlu (`/settings`, P1'de kuruldu). **Streak baskısı yok** —
gecikmiş kart sayısı gösterilmez, yalnız "bugün 10 kart" denir.

## Kabul kriterleri

- [ ] ⌘K açılıyor, semptomla arama çalışıyor ("lock timeout" → ilgili ders)
- [ ] Arama indeksi ≤ 96 KB gz (orijinal ≤50 KB tahmini, P2 henüz yokken
      412 kayıt · ~40 KB gz ölçümüne dayanıyordu; P2'nin kendi kabul kriteri
      — single ≤250 — her dönüşümde önceden boş olan bir lead ekliyor, bu da
      indeksi P2 tamamlanana dek büyütmeye devam ediyor. Ölçülen büyüme
      oranıyla P2 hedefinde ~58-60 KB gz'ye çıkıyor; 96 KB pay bırakıyor.
      Bkz. scripts/build-search-index.ts'deki MAX_INDEX_GZ_BYTES yorumu.)
- [ ] Bölüme derin link (`anchorId`) çalışıyor
- [ ] next/prev footer'da; **hiçbir yerde yüzde/streak/tik yok**
- [ ] Return Queue P1'in drill verisini kullanıyor, kendi destesi yok
- [ ] JSON export/import round-trip çalışıyor
