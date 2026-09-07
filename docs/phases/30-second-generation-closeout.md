# P30 — İkinci nesil kapanışı: altı kursu birbirine bağlamak ve operasyon okuruna bir sıra vermek

**Efor:** ~2 gün · **Bağımlılık:** P24-P29 · **Sonrakiler:** yok (kapanış)

## Neden

P22 alanın kapanışıydı ve bir kural bıraktı: bir kurs korpusa **iki yönlü**
bağlanmalı. P26 o kuralı P24/P25'e uyguladı; P27, P28 ve P29 doğuşta uyguladı.
Hepsi geçti. Ama kural bir kursun **ilk nesille** bağını ölçüyor ve kimse
ikinci neslin **kendi içindeki** bağını ölçmedi.

Ölçüm — P22'den sonra eklenen beş kurs arasındaki `(#N)` / `Lesson N` bağları:

| Kaynak | Hedef | Bağ |
|---|---|---:|
| `embedded-firmware` | `iot-hardware-basics` | 26 |
| `condition-monitoring` | `iot-hardware-basics` | 7 |
| `asset-identification` | `iot-hardware-basics` | 2 |
| `asset-identification` | `condition-monitoring` | 1 |

Dört kenar, ve 26'sı tek bir çiftte. **`model-coordination-exchange` diğer
yeni kursların hiçbirine bağlı değil**, ve `condition-monitoring` ile
`asset-identification` arasında tek bir bağ var — oysa ikisi aynı problemin
iki yarısı: biri bir okumanın ne anlama geldiğini, öteki o okumanın **doğru
varlığa** ait olup olmadığını anlatıyor.

İkinci ölçüm daha da keskin. Her kursun ilk nesilden aldığı bağ sayısı:

| Kurs | Verdiği | İlk nesilden aldığı |
|---|---:|---:|
| `iot-hardware-basics` | 72 | **1** |
| `embedded-firmware` | 32 | 10 |
| `model-coordination-exchange` | 67 | 4 |
| `condition-monitoring` | 60 | 4 |
| `asset-identification` | 52 | 3 |

`iot-hardware-basics` korpusa 72 kez yazıyor ve ilk nesilden **bir** bağ
alıyor — o da P26'nın eklediği `#482` → `#528`. Kurs on sekiz ders ve dalın
giriş kapısı; korpusun geri kalanı onu neredeyse hiç işaret etmiyor.

**Üçüncü boşluk bir okurda.** P23 dört path yazdı ve dördü de tasarım/veri
tarafında: BIM, GIS, IoT, dijital ikiz. O günden beri korpusa **operasyon**
okurunun kursları eklendi — `asset-management-systems`, `asset-identification`,
`condition-monitoring`, `field-data-collection` — ve bu okurun sırası yok.
P23'ün kendi gerekçesi buydu: *"bugün bu okuyucu dört kurs kartına bakıp
sırayı kendi kurmak zorunda — ve kuramaz."*

**Bu faz yeni ders yazmaz.** P22'nin ve P26'nın usulü: bağ eklenir, bir path
eklenir, bütçeler yeniden ölçülür.

### Ölçülüp kusur çıkmayan bir şey

Dal sırasında **125 ileri referans** var (hedef daha sonra okunan bir kursta),
331 geri referansa karşı. Bu bir kusur değil ve düzeltilmiyor: en büyük ikisi
`iot-hardware-basics` → `iot-telemetry-edge` (36) ve `embedded-firmware` →
`iot-telemetry-edge` (28), ve ikisi de P24/P25'in **bilinçli** kararı — o iki
kurs `#469`'un önüne konuldu ve ileriye işaret ediyorlar. Bir okuma sırasında
ileri işaretçi, bağımlılık değildir. Ölçüm kayda geçiyor ki altı ay sonra
"şu 125 şeyi düzeltelim" diye yeniden açılmasın.

## Kapsam

### 1. Bağlar — nesrin zaten işaret ettiği yere

Kural P26'nınkiyle aynı: bağ **uydurulmaz**, yalnız barındıran cümle zaten o
boşluğa işaret ediyorsa eklenir.

| Barındıran | Cümledeki boşluk | Bağ |
|---|---|---|
| `#491` | *"something physical produced it, it has a device behind it, and its error bars come from the sensor"* | `#534` |
| `#473` | ölçüm hassasiyetinin yükte kapladığı yer | `#533` |
| `#481` | *"outside the sensor's physical range"* | `#526` |
| `#559` | *"Id stability across exports is a process requirement"* | `#580` |
| `#560` | *"COBie's foreign keys are names"* | `#573` |
| `#563` | dört adımın ilk kutusu: ham okuma | `#572` |
| `#569` | güvenilemeyen kayıt | `#579` |
| `#557` | çakışma çiftinin iki elemanının kimliği | `#506` |

İlk üçü **ilk nesil → `iot-hardware-basics`** yönünü açar (1 → 4). Sonraki
beşi ikinci neslin kendi içini bağlar; özellikle `model-coordination-exchange`
ilk kez başka bir yeni kursa bağlanır.

### 2. Beşinci path — operasyon okuru

`operations-engineer` — kütükten sahaya ve geri. Dört kurstan ders toplar ve
P23'ün kısıtlarına uyar: 8-16 adım, ders id'leri benzersiz, kürasyon.

Sıra bir işi izler: varlık nedir ve nasıl adlandırılır → önündeki nesneyi
tanı → sahada yakala → durumu ölç → kararı işe çevir.

### 3. Bütçelerin yeniden ölçümü

Arama indeksi, review indeksi, `cap-starved` / `shadowed`, ve kurs-başına gelen
bağ sayısı (bu fazın kendi ölçütü).

## Yapılacaklar

### `content/courses/**` — sekiz bağ

Her biri mevcut bir cümlenin içine. Barındıran dersler `verified`, yani
`stamp-verified.ts` yeniden koşar ve `parse-snapshot.json` o derslerde kımıldar
— değişmez #1'in bilinçli istisnası, commit mesajında adıyla sayılır.

### `modules/course_content/course_content.paths.ts` — beşinci path

`DEVELOPER_PATHS`'e bir nesne. Test dosyası zaten path sayısına bakmıyor;
8-16 adım, benzersiz id ve slug kuralları geçerli.

### `docs/phases/README.md`

P30 satırı, bağ ölçümünün yeni hâli, path sayısı 4 → 5.

## Kabul kriterleri

- [x] Sekiz bağ eklendi, hepsi barındıran dersin zaten var olan cümlesinde:
      `#491`→`#534`, `#473`→`#533`, `#481`→`#526`, `#559`→`#580`,
      `#560`→`#573`, `#563`→`#572`, `#569`→`#579`, `#557`→`#506`
- [x] `iot-hardware-basics`'in ilk nesilden aldığı bağ **1 → 4**
- [x] `model-coordination-exchange` ilk kez başka bir yeni kursa bağlı
      (`asset-identification`, 2 bağ)
- [x] `condition-monitoring` ↔ `asset-identification` **1 → 3**; yeni kurslar
      arası kenar sayısı **4 → 6**
- [x] Beşinci path `operations-engineer`, **16 adım**, dört kurstan seçki
      (kütük → kimlik → etiket → saha → doğrulama → durum → iş emri → etiketler);
      `paths.test.ts` yeşil
- [x] **`paths.test.ts`'in "exactly four paths" iddiası bilinçli olarak
      değiştirildi.** Testin kendi yorumu bunu şart koşuyordu — *"a fifth path
      is a choice, not an accident"* — ve kararın gerekçesi teste yazıldı:
      P23'ün dört path'i tasarım/veri tarafında, operasyon okuru ise P23
      yazıldığında henüz var olmayan kurslarla geldi
- [x] `links/dead-lesson-ref` 0; `links/unlinked-lesson-ref` 0 (lint 0 error)
- [x] Yeni ders yok, yeni kurs yok, yeni terim yok — korpus **562'de**,
      sözlük **164'te**, `content:stats-check` 32 rows · 0 disagree
- [x] `stamp-verified` 8 dersi yeniden damgaladı; denylist 20'de değişmedi
- [x] `content:snapshot-diff`: **8 explained · 0 unexplained** — hareket yalnız
      düzenlenen sekiz derste
- [x] `content:check` (309 test), `lint`, `concepts-check`, `build`
      (**615 sayfa**, path sayfası eklendi) yeşil; arama indeksi
      **85.722 B gz** değişmedi (ders eklenmedi)

## Risk

| Risk | Azaltma |
|---|---|
| Bağ uydurulur | Tablo barındıran cümleyi de kaydediyor; nesir işaret etmiyorsa bağ yok |
| Path bir katalog olur | P23'ün doktrini: kürasyon, kapsama değil. Dört kurstan seçki, 16 sınırı |
| 125 ileri referans "düzeltilir" | Kusur olmadığı şartnamede yazılı; ölçüm kayda geçti |
| Snapshot hareketi denetlenemez | Yalnız listelenen dersler düzenlenir ve commit mesajında sayılır |
| Sözlük terimi eklenip link düşer | Bu faz terim eklemiyor — sözlük 164'te sabit |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Altıncı path (cihaz yapımcısı: donanım + firmware) | 30 dersi tek sırada | kapsam — `iot-engineer` ikisinden de ders taşıyor ve 16 dolu; ayrı bir path'in okuru ayrıca tanımlanmalı |
| Kapaklar (`embedded-firmware`, `model-coordination-exchange`, `condition-monitoring`, `asset-identification`) | Kurs kartlarının görseli | bağımlılık — `generate-covers.ts` ödemeli bir görsel API'si istiyor; `SUBJECTS` girdileri hazır, kart gradient'e düşüyor |
| Arama indeksi bütçesinin gözden geçirilmesi | Sınırın hâlâ doğru olup olmadığı | kapsam — 85.722 / 98.304, ~12 KB marj; sınır konuşulmadan önce ~8 kurs daha var |
| İkinci nesil için capstone | Altı kursun tek teslimatta birleşmesi | bağımlılık — P22'nin capstone kalemi hâlâ T2.4 kararına bağlı |
