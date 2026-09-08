# P31 — Numbers That Matter: sıfattan sayıya, ve sayıdan okuyucunun kendi ölçümüne

**Efor:** ~4 gün · **Bağımlılık:** P4 (widget kabuğu), P10 (PGlite) · **Sonrakiler:** yayılma

## Neden

Bu faz `Eklenebilecekler` tablolarından değil, **yol haritasının kendisinden**
geliyor: [`../investigate/04-roadmap.md`](../investigate/04-roadmap.md)'nin
**T2.2 — Numbers That Matter**. Otuz faz boyunca hiç açılmadı ve teşhisi
bugün de geçerli.

Yol haritasının kendi ölçümü üç sayıydı. Bugün, 562 derste tekrarlandı:

| Terim | Yol haritası (412 ders) | Bugün (562 ders) |
|---|---:|---:|
| `p99` | 5 dosya | **5** |
| `EXPLAIN ANALYZE` | 4 dosya | 7 |
| `lock_timeout` | **0** dosya | **1** |

Korpus %36 büyüdü ve bu üç sayı kımıldamadı. Yol haritasının cümlesi hâlâ
doğru: *"Savunamadığınız bir ödünleşimi bilmiyorsunuzdur. Korpus şu an
ödünleşimleri tamamen sıfatla öğretiyor."*

P6 bunun bir yarısını çözdü: `tradeoff` fence'i iki tarafın kazanma koşulunu
**ölçülebilir sinyal** olarak yazmayı zorunlu kıldı. Ama bir ödünleşimin
sinyali ile bir sistemin **varsayılanı** farklı şeyler. Okuyucu `lock_timeout`
diye bir düğmenin var olduğunu, varsayılanının ne olduğunu ve o varsayılanın
ölçekte neden yanlış olduğunu hâlâ hiçbir yerden öğrenmiyor.

## Yol haritasından iki sapma, ikisi de gerekçeli

**1. Bölüm değil, fence.** T2.2 `## Key Concepts`'ten sonra yeni bir `##`
bölümü istiyor: `HEADING_RULES`'a prefix, `LessonSections`'a anahtar,
`LessonPage.tsx`'e satır. O gün doğruydu — **widget sistemi yoktu**. P4 kart
kabuğunu, P6 `tradeoff`'u, P11 `calc`'ı getirdi ve korpus bugün sekiz fence
dili taşıyor. Fence olarak yapmak:

- katı altı-bölüm parser'ına ve `HEADING_RULES`'a **hiç dokunmaz** (T2.4'ün
  aynı gerekçeyle koruduğu yüzey),
- `WidgetShell`'i ve P4'ün kart dilini olduğu gibi kullanır,
- tabloyu argümanın gerektirdiği yere koyar, sabit bir slota değil,
- ve diğer sekiz widget gibi bir lint kuralıyla denetlenebilir.

**2. Varsayılan alıntılanmaz, ölçülür.** T2.2'nin katı kuralı şuydu: *"her
satır ya sayıyı yayımlayan dokümana satır içi link verir ya da onu üreten
komutu verir; ikisi de yoksa satır silinir."* P10'dan sonra üçüncü ve daha
iyi bir seçenek var: **sayıyı çalışan bir Postgres'ten okumak**. Pilotun
dört tablosundaki her PostgreSQL varsayılanı `pg_settings.boot_val`'den —
derlenmiş varsayılandan — doğrulandı, ve `#42`'nin `proof`'u bunu CI'da her
koşuda tekrarlıyor. Bir varsayılan değişirse CI kırmızıya döner, ki doğru
davranış budur.

## Kapsam

### Mekanizma — `numbers` fence'i

```
```numbers
rows:
  - quantity: "lock_timeout"
    default: "0 (wait forever)"
    source: "https://www.postgresql.org/docs/16/runtime-config-client.html"
    at_scale: "..."
    measure: "`SHOW lock_timeout;`"
```
```

Alanlar ve neden zorunlu oldukları:

| Alan | Zorunlu | Kural |
|---|---|---|
| `quantity` | evet | Düğmenin adı, sürümüyle birlikte ("PostgreSQL 16 `lock_timeout`") |
| `default` | evet | Değer, ya da `—` (yayımlanmış bir varsayılan yoksa) |
| `source` | `default` `—` değilse **evet** | Sayıyı yayımlayan dokümana link |
| `at_scale` | evet | Varsayılanın ölçekte neden yanlış olduğu — sıfat değil, mekanizma |
| `measure` | evet | Ya backtick içinde bir komut, ya bir link. Yol haritasının dördüncü sütunu |

**İki lint kuralı** bu sözleşmeyi mekanik hâle getirir — yol haritasının
"ikisi de yoksa satır silinir" kuralı, bir insanın hatırlamasına bırakılmaz:

- `numbers/unsourced-default` (**error**) — `default` `—` değil ve `source` yok.
- `numbers/unmeasurable-row` (**error**) — `measure` ne backtick'li komut ne link içeriyor.

**Kart sunucu bileşenidir.** Tablo etkileşimsiz, yani `NumbersCard` `'use client'`
taşımaz ve istemciye **sıfar bayt** gider. `CalcCard`'ın öğrettiği sınır
burada bedava geliyor: parser'dan yalnız `import type` alınır.

### Pilot — dört ders

P6'nın usulü: mekanizma birkaç dersle açılır, sonra yayılır. Dördü de
sayıların gerçekten yayımlandığı ve ölçülebildiği yerler:

| Ders | Tablo | Runtime |
|---|---|---|
| `#18` sorgu planı | `default_statistics_target`, `random_page_cost`, `seq_page_cost`, `effective_cache_size` | seedsiz `sql run` |
| `#19` bağlantı havuzu | `max_connections`, `idle_in_transaction_session_timeout`, `statement_timeout` | seedsiz `sql run` |
| `#41` MVCC / autovacuum | `autovacuum_vacuum_threshold`, `..._scale_factor`, `..._insert_threshold`, `autovacuum_naptime` | seedsiz `sql run` |
| `#42` kilitleme | `lock_timeout`, `deadlock_timeout` | **`proof`** + seedsiz `sql run` |

`#42` yol haritasının kendi örneği (`lock_timeout`: 0 dosya) ve `proof`'u
oraya konuyor.

### `content/_verify/database-advanced/42/` *(yeni)*

`proof`: `@electric-sql/pglite` ile gerçek bir PostgreSQL açar ve tablonun
alıntıladığı ayarların `boot_val`'ini basar. Repo'nun `node_modules`'ü
`_verify` içinden çözülüyor (`security/30` ve `fundamentals-tools/121`
aynısını yapıyor), yani ek bağımlılık yok. Determinizm: `boot_val` derlemeye
gömülü, sorgu `ORDER BY name`, sürüm `package-lock`'ta sabit.

## Yapılacaklar

- `modules/course_content/course_content.numbers.ts` *(yeni)* — YAML + zod
- `course_content.blocks.ts`, `course_content.types.ts` — `numbers` dalı ve tip
- `modules/course_content/ui/NumbersCard.tsx` *(yeni)* — sunucu bileşeni
- `ui/LessonSectionCard.tsx` — bir `case`
- `scripts/content-lint/rules.ts` — iki kural
- `scripts/corpus-stats.ts` — widget satırı
- `modules/course_content/course_content.numbers.test.ts` *(yeni)*
- `modules/course_content/ui/NumbersCard.test.ts` *(yeni)*
- Dört ders + bir `proof` workspace'i
- `docs/phases/README.md` — P31 satırı, widget tablosu, ölçüm

## Kabul kriterleri

- [x] `numbers` fence'i parse ediliyor ve render ediliyor; `HEADING_RULES` ve
      altı-bölüm parser'ı **hiç değişmedi** (diff'te `course_content.parser.ts` yok)
- [x] `NumbersCard` sunucu bileşeni: dosyada `'use client'` yok, parser'dan
      yalnız `import type`, ve build sonrası `.next/static/chunks` içinde
      `YAMLParseError` **0 dosyada** — istemciye sıfır bayt
- [x] İki lint kuralı **error** doğdu, korpusta sıfır bulgu veriyor, ve
      **bilerek bozulup ateşlendiği doğrulandı**: `source` silinince
      `numbers/unsourced-default`, `measure` düz cümleye çevrilince
      `numbers/unmeasurable-row` — ikisi de satırı adıyla bildirdi
- [x] Dört pilot dersin **14 satırının** her biri ya `source` linkli ya `—`
      varsayılanlı; her satırın `measure`'ı backtick'li komut ya da link
- [x] `#42` proof'u damgalı (`proof` 30 → 31), gerçek PostgreSQL 18.3'ten
      `pg_settings.boot_val` okuyor, iki koşuda md5-aynı. `lock_timeout` 0,
      `deadlock_timeout` 1000 ms, `idle_in_transaction_session_timeout` 0 —
      hiçbiri alıntı değil
- [x] Üç seedsiz `sql run` fence'i PGlite'ta koşuldu ve her biri tablosunun
      alıntıladığı değerleri döndürdü (`sql run` 78 → 81)
- [x] Yeni ders yok — korpus **562'de sabit**; yalnız dört ders düzenlendi
- [x] `content:check` (**46 dosya, 320 test** — 11'i bu fazın), `lint`,
      `concepts-check`, `stats-check` (33 rows · 0 disagree — `numbers` satırı
      eklendi), `build` (615 sayfa) yeşil; `snapshot-diff` **4 explained ·
      0 unexplained**

## Risk

| Risk | Azaltma |
|---|---|
| Varsayılan uydurulur ya da bayatlar | `boot_val` proof'u CI'da her koşuda doğruluyor; değişirse kırmızı |
| Tablo sıfat kusar ("çok yavaş") | `at_scale` mekanizma ister; lint `measure`'ı zorunlu kılar |
| Yeni bölüm parser'ı kırar | Bölüm yok — fence; `HEADING_RULES` elleniyor değil |
| Kart istemci bayt'ı ekler | Sunucu bileşeni; `'use client'` yok, `import type` yalnız |
| Pilot yayılma baskısı yaratır | P6 usulü: dört ders, sonra ayrı bir pas |
| PGlite varsayılanı bir sunucu build'inden farklı olur | `boot_val` derlenmiş varsayılan, `shared_buffers` gibi ortam bağımlı olanlar tabloya alınmadı |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Yayılma: Node/HTTP zaman aşımları, Redis, JVM | Aynı tablo başka yığınlarda | kapsam — pilot dört ders; yayılma ayrı bir pas (P6'nın usulü) |
| Karar satırı (T2.2'nin ikinci yarısı) | ~70 dersteki ikili seçim için sayılabilir sinyal | kapsam — `tradeoff` (P6) o işi zaten yapıyor; çakışma gözden geçirilmeli |
| T2.6 "How It Breaks" | Semptom → teşhis komutu → neden → düğme | bağımlılık — `content/repro/` altyapısı yok; yol haritası kendi şartını koyuyor |
| T2.5 Frontmatter Spine | Manifest'in tek gerçek kaynağa inmesi | kapsam — büyük ve bu fazla ilgisiz; yol haritasında duruyor |
| `## Numbers` bölümü olarak yeniden yapmak | Yol haritasının orijinal şekli | **doktrin = yasak** — sapma gerekçesiyle yukarıda kayıtlı; iki mekanizma tutulmaz |
