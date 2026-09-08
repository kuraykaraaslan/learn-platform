# P44 — How It Breaks: teşhis widget'ı ve kanıtlanmış çıktı kuralı

**Efor:** ~3 gün · **Bağımlılık:** P1, P5, P10, P31, P35, P36 · **Sonrakiler:** yayılma

## Neden

Yol haritasının **T2.6**'sı kırk üç faz boyunca hiç açılmadı ve geriye kalan
en yüksek learner-value kalemi (8.0): *"inşa etmeyi değil teşhisi öğreten tek
kalem."* Korpus bugün nasıl **kurulacağını** anlatıyor; bir şey bozulduğunda
insanın önünde duran şeyi — bir semptom ve bir terminal — anlatmıyor.

Ölçüldü (562 ders):

| Teşhis yüzeyi | Kaç derste geçiyor |
|---|---|
| `pg_stat_activity` | 6 |
| `EXPLAIN ANALYZE` | 6 |
| `pg_stat_user_tables` | 3 |
| `autovacuum` | 3 |
| `lock_timeout` | 2 |
| `statement_timeout` | 1 |
| `pg_locks` | 1 |
| `kubectl describe`, `dmesg`, `strace` | 0 |

Bu bir eksiklik listesi değil, bir **şekil** teşhisi: korpus kurmayı öğretiyor,
teşhisi öğretmiyor.

## Hakemlerin itirazı ve bu reponun cevabı

T2.6'yı erteleten gerekçe tekti ve haklıydı: **halüsine `psql` çıktısı
gerçeğinden ayırt edilemez.** Yol haritasının koyduğu mekanik kural
*"`content/repro/<lesson-id>/` altında çalıştırılabilir bir repro yoksa bölüm
yayımlanmaz"* idi.

O kural bu repoda zaten var ve adı `proof` (P5, P35): gövdesini yalnız
`scripts/stamp-verify.ts` yazıyor, byte-deterministik, CI'da yeniden koşuyor.
Yani T2.6'nın ön koşulu ödenmiş durumda. Bu faz onu **alıntılamayı**
zorunlu kılıyor:

> Bir `breaks` girdisinin `see:` bloğundaki her satır, **aynı dersteki
> damgalanmış bir `proof` fence'inin gövdesinde birebir geçmek zorundadır.**

Bu, P36'nın rubric kuralının aynısı bir seviye aşağıda: rubric bir Common
Mistakes lead'ini birebir alıntılıyordu, burada teşhis çıktısı kanıtlanmış bir
koşumu birebir alıntılıyor. Yazar teşhisi **yazıyor**, çıktıyı **yazamıyor**.

## Mekanizma

**Yeni `##` bölümü yok.** T2.6 "Common Mistakes'ten sonra yeni bölüm" diyor ama
altı bölümlük şekil korunan bir yüzey: `HEADING_RULES` tanımadığı bir `##`'yi
bölüm başlangıcı saymıyor ve `shape/unrecognized-heading` ateşliyor — P25 bunu
`## Proof` ile öğrendi. Doğru ev bu repoda bir **fence**: `breaks`, `## Common
Mistakes` içinde, tıpkı `quiz`/`recall`/`numbers` gibi.

Girdi başına dört ritim, yol haritasının istediği sırayla, artı `#3`'ün
taahhüt adımı:

| Alan | Ne | Kim yazıyor |
|---|---|---|
| `symptom` | Bir insanın bildirdiği şey, **bir sayıyla** | yazar |
| `instinct` | Akla ilk gelen yanlış içgüdü — okuyucu buna taahhüt ediyor | yazar |
| `look` | Gerçek teşhis komutu | yazar |
| `see` | Gerçek çıktı | **kimse — kanıttan alıntı** |
| `why` | Mekanizma | yazar |
| `knob` | Hangi düğme | yazar |

Ders başına en fazla **3** girdi (yol haritasının kendi sınırı).

**Predict-then-reveal.** Kart açılışta `symptom` + `instinct`'i gösteriyor ve
okuyucudan bir tahmin istiyor; `look`, `see`, `why`, `knob` ancak taahhütten
sonra açılıyor. `QuizCard`'ın ritmi, aynı `WidgetShell`.

**Üç lint kuralı** (değişmez #6: temiz doğan kural `error` doğar, P36 usulü):

- `breaks/see-not-proven` — `see:` satırı aynı dersteki bir `proof` gövdesinde
  geçmiyor. Fazın tamamı bu kuralın üstünde duruyor.
- `breaks/on-unverified-lesson` — değişmez #3: doğrulanmamış derste alıştırma
  açılmaz. Bir teşhis alıştırmasıdır.
- `breaks/too-many-entries` — 3 girdi sınırı.

## Kapsam — pilot iki ders

`database-caching-performance/#18` (*Query Plan Analysis*) ve `#17`
(*Database Index Strategy*). İkisi de doğrulanmış, ikisi de tam olarak teşhis
dersi, ve ikisinin de bugün `proof` fence'i **yok** — yani mekanizma
sıfırdan sınanıyor.

Her ders bir `content/_verify/database-caching-performance/<id>/` çalışma
alanı, bir damgalanmış `proof` ve o kanıttan alıntılayan bir `breaks` fence'i
alıyor.

## Ölçülen sınır — yol haritasının üç düğmesi bu çalışma zamanında koşmuyor

T2.6 düğme örneği olarak `lock_timeout`, `statement_timeout` ve autovacuum
eşiğini veriyor. Üçü de PGlite'ta **prob edildi** ve üçü de kanıtlanamıyor:

| Düğme | Prob sonucu |
|---|---|
| `statement_timeout` | `SET statement_timeout='50ms'` + `pg_sleep(2)` → **hata yok**; tek iş parçacıklı WASM'da kesme yok |
| `lock_timeout` | `SHOW` çalışıyor ama kilit beklemesi iki oturum ister; `new PGlite()` her çağrıda ayrı bir veritabanı |
| autovacuum / şişme | `UPDATE` sonrası `n_dead_tup` = **0**; istatistik toplayıcı koşmuyor |

Bunlar sessizce düşürülmüyor: T2.6'nın kendi kuralı gereği kanıtlanamayan
bölüm **yayımlanmaz**, dolayısıyla aday olarak kaydediliyorlar. Kanıtlanabilen
aile sorgu planı ailesi ve pilot oradan seçildi.

**Determinizm kuralı (yeni).** `timestamptz` basan her repro `SET timezone =
'UTC'` yapmak zorunda: prob, ayarsız halde planın **host'un saat dilimini**
bastığını gösterdi (`+03` yerelde, CI'da `+00`). Bugün damgalı 32 kanıtın
hiçbiri timestamp basmıyor, yani bu bir kusur değil bir **tuzak** — kural
şimdi konuyor.

## Kabul kriterleri

- [x] `breaks` fence'i parse ediliyor, blok hattına kayıtlı, `WidgetShell`
      içinde predict-then-reveal olarak render ediliyor (`FAMILY` = `answer`)
- [x] `see:` bloğunun her satırı aynı dersteki bir `proof` gövdesinde birebir
      geçiyor (korpus testi + `content:lint` yeşil); geçmeyince
      `breaks/see-not-proven` ateşliyor — rule `error` doğdu
- [x] Değişmez #3 kapısı: `breaks/on-unverified-lesson` (`error`), ve BreaksCard
      doğrulanmamış derste `null` döndürüyor (render-time yarısı, testli)
- [x] Girdi sınırı 3: zod `.max(3)` → `breaks/invalid-payload` (`error`), testli
- [x] İki pilot dersin ikisi de `content/_verify/database-caching-performance/`
      koşumundan damgalanmış `proof` taşıyor (`proof` 32 → 34);
      `stamp-verify --check` 37/37 ok
- [x] Değişmez #4: tik/yüzde/tamamlama yok; `progress.store.ts` değişmedi
- [x] `content:check` (346 test), `content:stats-check` (0 disagree),
      `content:concepts-check` (matches), `build` (604 sayfa) yeşil; arama
      indeksi 86.925 B gz / 98.304
- [x] parse-snapshot **kımıldadı**: `database-caching-performance/17` (3 bölüm)
      ve `18` (2 bölüm), `snapshot-diff` 5 explained · 0 unexplained;
      `parseMistakes` `single` 141'de sabit — `breaks` fence korpusa 0 mistake
      ekledi (`splitBulletItems` artık fence atlıyor)

## Risk

| Risk | Azaltma |
|---|---|
| Çıktı uydurulur | `see:` yazılamıyor; lint birebir kanıt eşleşmesi arıyor |
| İkinci bir quiz doğar | Ritim farklı: quiz bilgiyi, `breaks` teşhis sırasını ölçüyor; `instinct` alanı quiz'in şıkkı değil, taahhüt |
| Widget yayılmadan çürür | Pilot iki ders; yayılma ayrı bir faz (P6/P31/P39 usulü) |
| Kanıt ile widget birbirini tekrar eder | Kanıt bütün deneyi koşuyor, `breaks` ondan üç satır alıntılıyor — P33'ün birebir sözleşmesinin tersi yönü |
| PGlite planı sürüm değişince kayar | Zaten `stamp-verify --check` kapısı var; kayma CI'da MISMATCH olarak görünür |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| `breaks`'in yayılması (40 derse) | T2.6'nın asıl hacmi | kapsam — mekanizma iki derste sınandı; yayılma ayrı bir pas |
| `statement_timeout` / `lock_timeout` / autovacuum girdileri | Yol haritasının adıyla verdiği üç düğme | `bağımlılık` — bu çalışma zamanında kanıtlanamıyor (yukarıdaki prob tablosu); gerçek bir Postgres süreci olmadan T2.6'nın kendi kuralını çiğnerdi |
| `see:` bloğunun kanıt fence'ine bağlantısı | Okuyucunun tam koşumu görmesi | kapsam — ayrı bir UI kararı, P36/P42/P43'ün tablolarındaki bağlantı kalemiyle aynı aile |
| Teşhis çıktısının Postgres dışına çıkması | Redis/k8s semptomları | bağımlılık — P32'nin sınırının aynısı: koşan bir runtime yoksa kanıt yok |
