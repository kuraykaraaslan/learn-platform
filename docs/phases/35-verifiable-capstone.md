# P35 — Capstone referansını doğrulanabilir kılmak

**Efor:** ~1-2 gün · **Bağımlılık:** P5 (`proof`), P34 · **Sonrakiler:** capstone'un kalan üç kursa yayılması

## Neden

P34 bilinçli bir yumuşak nokta bırakarak kapandı ve kendi `Eklenebilecekler`
tablosunun ilk satırına yazdı: capstone'un Reference Walkthrough'u
**doğrulanmıyor**. Sebebi mekanikti — `stamp-verify.ts` bir `proof` fence'inin
workspace'ini `content/_verify/<kurs>/<dersId>/` altında arıyor ve capstone'un
ders id'si yok. Dolayısıyla referanslar SQL ve gerekçe taşıyor, **hiçbir
sonuç satırı basmıyor**; çünkü elle yazılmış terminal çıktısı bu repo'da
yasak (yol haritasının kendi kuralı: *"halüsine `psql` çıktısı gerçeğinden
ayırt edilemez"*).

Yumuşak nokta şu: capstone metni **iddialarda bulunuyor**. "`ALTER TABLE`
`AccessExclusiveLock` alır", "`VALIDATE CONSTRAINT` `ShareUpdateExclusiveLock`
altında tarar", "`ON CONFLICT DO NOTHING` ikinci denemede sıfır satır döner".
Üçü de doğru — yazarken gerçek bir PostgreSQL'de koşuldu — ama okuyucunun
elinde bunu gösteren hiçbir şey yok. Korpusun geri kalanında böyle bir iddia
ya bir `proof`'un çıktısıdır ya da yazılmaz.

Bu faz o farkı kapatıyor: iki capstone referansı da CI'da koşan bir `proof`
kazanıyor.

## Kapsam

### `scripts/stamp-verify.ts` — capstone paso'su

`listFences()` manifest kalemlerinden yürüyor, yani `capstone.md`'yi hiç
görmüyor. **Bu bilinçli ve korunuyor**: P34'ün bütün temizliği capstone'un
ders pipeline'ına görünmez olmasına dayanıyor (`corpus-stats` capstone
fence'lerini korpus fence'i sanmamalı, `loadCorpus` capstone'u ders sanmamalı).

Dolayısıyla `listFences()` **değiştirilmiyor**. Bunun yerine
`course_content.capstone.ts` küçük bir tarayıcı dışa açıyor —
`listCapstoneProofFences()` — ve `stamp-verify` onu kendi listesine ekliyor.
Workspace yolu tek satırlık bir dallanma:

```
content/_verify/<kurs>/<dersId>/      ders proof'u
content/_verify/<kurs>/capstone/      capstone proof'u
```

**Tek tarayıcı.** Lint kuralı da aynı fonksiyonu kullanıyor; P33'ün
`splitBulletItems` kararıyla aynı gerekçe — iki tarayıcı kaçınılmaz olarak
ayrışır.

### İki workspace

| Workspace | Ne kanıtlıyor |
|---|---|
| `content/_verify/database-advanced/capstone/` | Göç planındaki her adımın **hangi kilidi** aldığı: `ADD COLUMN` ve `SET DEFAULT` `AccessExclusiveLock`, `VALIDATE CONSTRAINT` `ShareUpdateExclusiveLock`, `SELECT FOR UPDATE` `RowShareLock`. Ayrıca toplu doldurmanın **yeniden çalıştırılabilir** olduğu: ikinci paso sıfır satır günceller |
| `content/_verify/distributed-systems-api-design/capstone/` | Idempotency anahtarının üç gelişi: ilk geliş satırı alır, eşzamanlı tekrar **sıfır satır** alır, tamamlanmadan sonraki tekrar **orijinal gövdeyi** döndürür; ve aynı anahtar farklı gövdeyle reddedilir |

İkisi de PGlite kullanıyor (`security/30` ve `fundamentals-tools/121`'in
usulü), sıfır ek bağımlılık, sabit sıralama, saat yok, rastgele yok.

### Lint — `capstone/hand-edited-proof`

`verify/hand-edited-output`'un capstone karşılığı ve aynı ucuz kontrolü
yapıyor: gövdenin sha'sı `sha=` meta'sıyla uyuşuyor mu. Ders kuralı
`file.fences` üzerinden yürüdüğü için capstone'u görmüyor; bu kural
`listCapstoneProofFences()` üzerinden yürüyor.

Yavaş yarı yine `stamp-verify --check`: gerçekten koşup çıktının hâlâ aynı
olduğunu doğruluyor.

### Referans metinleri

Her iki `## Reference Walkthrough`'a bir paragraf ve bir `proof` fence'i
ekleniyor. Metinlerdeki **iddialar değişmiyor** — değişen, artık altlarında
onları üreten koşunun durması.

## Kabul kriterleri

- [x] `stamp-verify.ts` capstone proof'larını buluyor ve damgalıyor —
      `proof` 32 → **34**; `listFences()` **değişmedi** ve `corpus-stats`
      hâlâ 33 satır · 0 disagree (capstone fence'leri korpusa sızmadı)
- [x] `content/_verify/<kurs>/capstone/` yolu çalışıyor; `--check` **34/34 ok**
- [x] İki proof da sıfır ek bağımlılık (repo'nun kendi PGlite'ı), iki koşuda
      md5-aynı
- [x] `capstone/hand-edited-proof` kuralı **bilerek bozulup ateşlendi**:
      proof gövdesindeki bir kilit adını değiştirince sha uyuşmazlığını
      bildirdi
- [x] Capstone metinlerindeki kilit iddiaları koşunun çıktısıyla birebir:
      `ADD COLUMN` ve `SET DEFAULT` **AccessExclusiveLock**,
      `SELECT ... FOR UPDATE` **RowShareLock**, `VALIDATE CONSTRAINT`
      **ShareUpdateExclusiveLock** — ve son iddia yazarken doğrulanmıştı,
      şimdi CI'da doğrulanıyor
- [x] Idempotency referansının üç gelişi koşuluyor: 1 satır, **0 satır**,
      0 satır + orijinal gövde; ve aynı anahtar farklı gövdeyle `false`
- [x] Proof yazarken bir hata yakalandı ve düzeltildi: doldurma gösterimi,
      bir önceki adımda doğrulanan `CHECK` kısıtına takılıyordu. Kısıt artık
      gösterimden önce düşürülüyor — ve bu, kısıtın gerçekten çalıştığının
      kendi kanıtı
- [x] `content:check` (**48 dosya, 335 test** — 4'ü bu fazın),
      `stamp-verify --check` 34/34, `lint`, `stats-check`, `build`
      (653 sayfa) yeşil; `parse-snapshot.json` kımıldamadı

## Risk

| Risk | Azaltma |
|---|---|
| `listFences` genişletilir ve capstone korpusa sızar | Genişletilmiyor; ayrı tarayıcı, ayrı liste |
| İki tarayıcı ayrışır | Tek fonksiyon, hem stamp-verify hem lint onu kullanıyor |
| PGlite sürümü kilit adlarını değiştirir | Değişirse `--check` kırmızıya döner, ki istenen budur |
| Proof capstone'u ders gibi göstermeye başlar | Workspace adı `capstone`, ders id'si yok; `corpus-stats` hâlâ görmüyor |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Capstone'un kalan üç kursa yayılması | Yol haritasının önerdiği beşin tamamı | kapsam — önce mekanizma sağlamlaştı; yayılma ayrı bir pas |
| Capstone proof'unun `ProofCard` ile render'ı (tahmin-sonra-aç) | P5'in kapısı capstone'da da | kapsam — capstone sayfası markdown pipeline'ında; blok pipeline'ına bağlamak ayrı bir yüzey |
| `content/repro/` (yol haritasının T2.6'sı) | Semptom → teşhis komutu → neden → düğme | kapsam — `_verify` altyapısı artık iki şekli de taşıyor; T2.6 kendi fazını hak ediyor |
