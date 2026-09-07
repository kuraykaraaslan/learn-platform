# P26 — P24-P25 kapanışı: iki yönlü bağlar, sözlük, ve kenardaki iki kurs

**Efor:** ~2-3 gün · **Bağımlılık:** P24, P25 · **Sonrakiler:** yok (kapanış)

## Neden

P22 alanın kapanışıydı ve bir kural koydu: bir kurs korpusa **iki yönlü**
bağlanmalı, yoksa *"yeni alan korpusun kenarına asılı bir ek"* olarak kalır.
P24 ve P25 o kapanıştan **sonra** geldi, yani kural onlara hiç uygulanmadı.

Ölçüm — bir kursa, **kendi dışındaki** kaç kurstan `(#N)` / `Lesson N` bağı
geliyor:

| Kurs | Kendisine bağ veren kurs sayısı |
|---|---:|
| `iot-telemetry-edge` (P17) | 7 |
| `bim-ifc-data-models` (P14) | 5 |
| `digital-twin-engineering` (P18) | 5 |
| `gis-spatial-data` (P15) | 3 |
| `asset-management-systems` (P20) | 2 |
| `smart-infrastructure` (P21) | 2 |
| **`iot-hardware-basics` (P24)** | **1** — ve o tek bağ dünkü P25 |
| **`embedded-firmware` (P25)** | **0** |

İkinci ölçüm aynı yöne işaret ediyor: kavram sözlüğünde **139 terim** var ve
bu iki kursun 30 dersini karşılayan terim sayısı **sıfır**. (`ADC`, `pull-up`,
`datasheet`, `duty cycle`, `ISR`, `watchdog`, `ring buffer`, `fixed point`,
`tick counter`: hiçbiri sözlükte yok.)

Yani iki kurs korpusa **yazıyor** ama korpus onlara **yazmıyor**. Bir okuyucu
`#469`'un yedi kutusundan birine takıldığında, o kutunun içini açan dersin
var olduğunu öğrenemiyor. Bu fazın işi tam olarak o yönü kurmak.

**Bu faz yeni ders yazmaz.** P22'nin usulü: mevcut derslere bağ eklenir,
sözlüğe terim eklenir, bütçeler yeniden ölçülür.

## Kapsam

### 1. Geriye bağlar — nesrin zaten işaret ettiği yere

Kural: bağ **uydurulmaz**. Yalnız barındıran dersin nesri zaten o boşluğa
işaret ediyorsa eklenir. Aday listesi, her biri barındıran cümlesiyle:

| Barındıran | Cümledeki boşluk | Bağ |
|---|---|---|
| `#469` | "the device samples it, stamps it with its own clock and buffers it" | 542, 549, 545 |
| `#469` | "the device's own loop is the one part of the path with no network in it" | 542 |
| `#476` | "**All of it is firmware**, and the device is somewhere inconvenient" | 545, 552 |
| `#479` | "the bootloader reverts to the previous one" | 552 |
| `#479` | "a bad rollout here cannot be fixed by redeploying" | 551 |
| `#474` | cihaz saatinin nereden geldiği | 549 |
| `#472` | görev döngüsü ile enerjinin ilişkisi | 546 |
| `#482` | debounce'un firmware tarafı | 543 |
| `#494` | sahada teşhis | 553 |
| `#57` | blue-green / A-B slot: aynı fikir, cihazda | 552 |

`#57` dışındakiler alan içi. **`#57` bilinçli olarak tek eski-korpus köprüsü:**
eski korpus donanıma doğal olarak çekmiyor ve zorlanmış bir bağ, bağ
olmamasından kötüdür. Blue-green ile A/B slot değişimi aynı fikrin iki
ölçekteki hâli — bu köprü gerçek.

**Hedef:** her iki yeni kurs da en az **2** başka kurstan bağ alsın —
P20/P21'in bugünkü seviyesi, uydurma olmadan ulaşılabilen en yüksek sayı.

### 2. Kavram sözlüğü

Kurs başına 4-5 terim, P22'nin üç kuralıyla:

- **Gölgeleme taraması zorunlu.** `ADC`, `ISR`, `PWM`, `RTOS` tamamı büyük
  harfli ve P3'ün `BASE` vakası tam buydu. Rapor `shadowed: 0` göstermeye
  devam etmeli.
- **Bütçe açlığı ölçülür**, karar verilmez: ders başına 4 link sınırı
  paylaşımlı ve 30 yeni ders geldi. `cap-starved` sayısı raporlanır.
- Terim, **tanımlandığı derse** ait olur; kısaltma uzun ifadeyi yutmaz.

### 3. Bütçelerin yeniden ölçümü

P22'nin üç ölçüsü, P25'te bir kez daha alındı; bu fazda sözlük değiştiği için
tekrarlanır: arama indeksi (sınır 98.304 B gz), review indeksi (bütçesiz),
`cap-starved` / `shadowed`.

## Yapılacaklar

### `content/courses/**` — bağ ekleri

Yukarıdaki tablodaki derslere `(#N)` ya da `Lesson N` bağı eklenir. Her biri
**mevcut bir cümlenin içine** girer; yeni paragraf yazılmaz, ders yeniden
çerçevelenmez.

**Damga zinciri.** Barındıran dersler `verified` ve gövdeleri değişiyor:
`stamp-verified.ts` yeniden koşar, `parse-snapshot.json` o derslerde kımıldar.
Bu, değişmez #1'in **bilinçli istisnası** ve commit mesajında dersler adıyla
sayılır — P22'nin usulü. `content:snapshot-diff` **0 unexplained** vermeli;
UNEXPLAINED çıkarsa sebebi `remark-concepts`'in 4-link bütçesidir ve o ders
geri alınır.

### `content/concepts.json` — yeni terimler

Ekleme sonrası `npm run content:concepts` raporu **sebebe göre** okunur.
`shadowed` sıfırdan büyük çıkarsa terim geri alınır, kısaltılmaz.

### `docs/phases/README.md`

P26 satırı, bağ ölçümünün yeni hâli, ve bütçeler.

## Kabul kriterleri

- [x] `iot-hardware-basics` ← `embedded-firmware` + `iot-telemetry-edge`;
      `embedded-firmware` ← `iot-telemetry-edge` + `observability-deployment`.
      İkisi de **2 kurstan** bağ alıyor (P20/P21 seviyesi), 1 ve 0'dan
- [x] Sekiz bağ da barındıran dersin **zaten var olan** bir cümlesinin içinde:
      `#469` (iki yer), `#472`, `#474`, `#476`, `#479`, `#481`, `#482`, `#57`.
      Yeni paragraf yok, hiçbir ders yeniden çerçevelenmedi
- [x] `links/dead-lesson-ref` 0; `links/unlinked-lesson-ref` 0 (lint 0 error)
- [x] Sözlük 139 → **149 terim**, kurs başına 5. `shadowed` **0**,
      `case-mismatch` **0**, `cap-starved` **2'de sabit** (504, 104 — ikisi de
      eski). `own-lesson-only` 5 → **8**: `ground-loop`, `priority-inversion`
      ve `torn-read` yalnız tanımlandıkları derste geçiyor, yani hiçbir yerde
      tooltip render etmiyorlar. Korpusta zaten 5 böyle terim var (P3'ün
      ölçülen kategorisi); gizlenmiyor, sayılıyor
- [ ] ~~`content:snapshot-diff` 0 unexplained~~ — **kriter tutmadı ve sebebi
      ölçüldü.** 8 explained (düzenlediğim 8 ders) + **18 unexplained**.
      Unexplained'lerin hepsi 10 dersin bölümleri ve sebebi tek: yeni sözlük
      terimleri o derslerde artık link render ediyor. `snapshot-diff` yalnız
      markdown'a bakar, `concepts.json`'ı girdi saymaz — bu yüzden "markdown
      byte-identical, render changed" der. README'nin uyardığı **sessiz kayıp
      değil**: eski ve yeni `concepts.json` raporlarının ders-başına link
      kümeleri karşılaştırıldı — **11 link kazanıldı, 0 link kaybedildi**.
      Kayıp çıksaydı ilgili terim geri alınacaktı
- [x] `stamp-verified` 8 dersi yeniden damgaladı, damgasız ders yok;
      denylist 20'de değişmedi
- [x] `content:check` (309 test), `lint`, `content:concepts-check`,
      `content:stats-check` (32 rows · 0 disagree), `build` (584 sayfa) yeşil;
      arama indeksi **81.979 B gz** / 98.304
- [x] Yeni ders yok, yeni kurs yok — korpus 535'te sabit

## Risk

| Risk | Azaltma |
|---|---|
| Bağ uydurulur, ders zorlanır | Bağ yalnız nesrin zaten işaret ettiği yere; tablo cümleyi de kaydediyor |
| Eski korpustan zorlama köprü | Tek köprü `#57`, ve ikisi aynı fikrin iki ölçeği |
| Sözlük terimi sıradan kelime yutar | Gölgeleme taraması zorunlu, `shadowed: 0` kapı |
| 4-link bütçesi bir tooltip'i sessizce düşürür | `snapshot-diff` UNEXPLAINED kapısı; çıkarsa ders geri alınır |
| Snapshot hareketi denetlenemez hâle gelir | Yalnız listelenen dersler düzenlenir ve commit mesajında sayılır |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| `public/covers/embedded-firmware.webp` | Kursun kapak görseli | bağımlılık — `generate-covers.ts` ödemeli bir görsel API'si istiyor; `SUBJECTS` girdisi hazır, kart gradient'e düşüyor |
| Eski korpustan alana daha çok köprü | Alanın korpusa daha derin bağlanması | kaynak — eski korpusta donanıma çeken nesir yok; zorlanmış bağ bağsızlıktan kötü |
| `iot-hardware` / `firmware` path'i | Donanım+firmware okuyucusuna ayrı sıra | kapsam — `iot-engineer` path'i zaten ikisini de taşıyor ve 16 adım sınırı dolu |
| Kavram sözlüğü 4-link sınırının yükseltilmesi | Daha çok tooltip | doktrin — sınır P3'ün bilinçli kararı; `cap-starved` ölçülür, sınır tartışılmaz |
