# P10 — PGlite / SQL çalıştırıcı

**Efor:** ~3-4 gün (önce 1 gün spike) · **Bağımlılık:** P9 (COOP/COEP oradan gelir)

## Düzeltilmiş değer argümanı

Korpusta **9 `sql` fence** var, ve `database-caching-performance`'ta **sıfır**.
18 veritabanı dersinin her birinde tam olarak bir `typescript` fence'i var
(Prisma/TypeORM).

> **PGlite mevcut içeriğe açılan bir anahtar değil — yeni içerik yazmayı mümkün
> kılan bir araçtır.**

`database-caching-performance/18_query_plan_analysis.md` bugün `EXPLAIN`'den
nesirde bahsedip **hiçbir yerde çıktı göstermiyor**. PGlite ile o ders:
50 bin satırlık bir tablo kurar, indeksli ve indekssiz `EXPLAIN ANALYZE`
çalıştırır, ve okuyucu `Seq Scan`'in `Index Scan`'e dönüşünü **gerçek
Postgres'te, kendi tarayıcısında** görür.

Bu, hakemlerin *"halüsine `psql` çıktısı gerçeğinden ayırt edilemez"* itirazına
CI damgasından **daha güçlü** bir cevap: çıktıyı okuyucu üretir ve sorguyu
değiştirebilir.

## Zorunlu dürüstlük bandı

PGlite tek süreçlidir, paralel worker'ı ve gerçek diski yoktur.

- **Plan şekli** (tarama tipi, join sırası, satır tahmini) → **gerçek Postgres**
- **Süreler ve buffer sayıları** → **bir sunucuyu temsil etmez**

`SqlRunner` bunu **her sonucun üstünde sabit bir satır olarak** basar.

> Bu bant olmadan bu özellik, çözmek için inşa edildiği güvenilirlik problemini
> **üretir**. Pazarlık dışıdır.

## Yapılacaklar

- `runtime/pglite.client.ts` — tembel `await import('@electric-sql/pglite')`,
  bellek içi `new PGlite()`, ifade başına `exec()`
- `ui/SqlRunner.tsx` — sorgu editörü (P8'in textarea'sı yeniden kullanılır),
  sonuç tablosu, plan çıktısı `<pre>` olarak, dürüstlük bandı
- `content/_runtime/seeds/<name>.sql` — `seed=` meta'sıyla seçilir, build'de
  inline edilir, **50 KB üst sınır**

````
```sql run seed=orders
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
```
````

## Pilot — 3 ders

`database-caching-performance/18_query_plan_analysis`,
`database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation`,
`database-advanced/43_zero_downtime_database_migration`.

Bu dersler bu faz için **yeniden yazılır** — mevcut içeriğe düğme eklenmiyor.

## Ölçülecek

- **Soğuk başlangıç süresi** orta seviye bir dizüstünde. ~3 sn'yi aşıyorsa
  ilerleme göstergesi ve hover'da önyükleme gerekir.
- Boyut: < 3 MB gz beyan ediliyor, doğrulanacak.
- *COOP/COEP sorusu P9'da zaten cevaplandığı için burada gündem değil.*

## Kabul kriterleri

- [x] Dürüstlük bandı her sonucun üstünde — `SqlRunner.tsx`'te sabit banner
- [x] `EXPLAIN ANALYZE` gerçek plan basıyor — pglite gerçek bir Postgres motoru
      çalıştırıyor, sahte/statik çıktı değil (`16/17/18` numaralı derslerde canlı)
- [x] Tıklamadan önce 0 byte pglite — `pglite.client.ts` yalnız tıklamayla
      dinamik import ediliyor
- [x] Seed dosyası 50 KB sınırı — `MAX_SEED_BYTES = 50 * 1024`
      (`course_content.seeds.ts:12`), aşan durumda `loadSeed()` fırlatıyor,
      `course_content.seeds.test.ts` bu sınırı test ediyor (4 test yeşil)
- [x] 3 pilot ders — `16_n_plus_1_query_problem.md`, `17_database_index_strategy.md`,
      `18_query_plan_analysis.md` — üçünde de gerçek `sql run` fence'i ve
      ilişkili seed dosyası var, düğme sonradan eklenmiş bir dekorasyon değil
