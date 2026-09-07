# P25 — Gömülü firmware mimarisi: hiç bitmeyen döngü, iki bağlam, ve sahada hayatta kalma

**Efor:** ~7-8 gün · **Bağımlılık:** P24 · **Sonrakiler:** P23'ün `iot-engineer` path'i, P22'nin yeniden ölçümü

## Neden

Bu faz P24'ün `Eklenebilecekler` tablosundan geliyor: *"Firmware mimarisi
(RTOS, kesme, DMA) — kapsam: bu kurs elektriği kuruyor; firmware ayrı."*
Tek engeli kapsamdı, bağımlılığı P24 ile kapandı.

Boşluk ölçüldü, varsayılmadı — 32 kurs, 523 ders, kelime sınırıyla
(`grep -rilw`):

| Terim | Ders | Terim | Ders |
|---|---:|---|---:|
| `RTOS`, `DMA`, `mutex` | **0** | `superloop`, `task scheduler` | **0** |
| `deep sleep`, `brownout` | **0** | `fixed-point`, `reboot loop` | **0** |
| `watchdog` | 1 | `ring buffer` | 1 |
| `bootloader` | 1 | `ISR` | 1 |
| `firmware` | **18** | | |

İki sayı bu fazın bütün gerekçesi:

**`ISR` = 1, ve o bir yanlış eşleşme.** Korpustaki tek geçiş
`database-caching-performance/21`'de, `export const revalidate = 3600; // ISR`
satırında — *Incremental Static Regeneration*. Kesme servis rutini korpusta
hiç geçmiyor.

**`firmware` = 18, ve on sekizi de onu bir kara kutu olarak kullanıyor.**
Hepsi IoT dalında (12'si P24'ün donanım kursunda, 5'i P17'de, 1'i P21'de) ve
hiçbiri içini açmıyor. En keskin örnek `#476`: ilk paragrafı *"the reason none
of this can be added later is that **it is a device-firmware decision**"*,
ortası *"the overflow policy is a product decision made in firmware"*, sonu
*"**All of it is firmware**, and the device is somewhere inconvenient."* Ders
firmware'e üç kez işaret ediyor ve üçünde de kapıda duruyor. `#479` aynısını
`bootloader` için yapıyor ("the bootloader reverts to the previous one"),
`#537` `watchdog` için (yalnız bir akım kalemi olarak).

Yani korpus artık **cihazın elektriğini** (P24) ve **cihazdan veritabanına
giden yolu** (P17) anlatıyor; ikisinin arasındaki yazılım — ilk baytı üreten
şey — hâlâ yok. Bu kurs o boşluğu doldurur ve iki komşusunun sınırını nesirde
açıkça beyan eder.

## Kapsam

**Kurs:** `embedded-firmware` — "Embedded Firmware Architecture"
**Ders:** 12 · **id:** 542-553 · **bracket:** `0-1` ×1, `1-3` ×3, `3-7` ×8

> *Description:* "The software half of a sensor node: a loop that never exits,
> two contexts sharing memory, budgets instead of allocation, and what happens
> to a device when the power goes away mid-write."

| id | Başlık | bracket |
|---|---|---|
| 542 | Firmware Is Not a Program: The Loop That Never Exits | 0-1 |
| 543 | Interrupts: The Function That Runs While You Are Not Looking | 1-3 |
| 544 | Shared State: `volatile` Is Not Atomic, and the Torn Read | 3-7 |
| 545 | One Producer, One Consumer, No Lock: The Ring Buffer Between Two Contexts | 3-7 |
| 546 | Never Block: Cooperative State Machines Instead of `delay()` | 1-3 |
| 547 | When the Superloop Stops Paying: Tasks, Priorities, and Priority Inversion | 3-7 |
| 548 | Memory You Cannot Ask For: Static Allocation, Stack Depth, and the Heap You Did Not Budget | 3-7 |
| 549 | Time Without a Clock: Ticks, Overflow, and the Subtraction That Saves You | 1-3 |
| 550 | Fixed Point: The Float You Cannot Afford, and the Overflow in the Middle | 3-7 |
| 551 | The Watchdog Is Not a Safety Net: Feeding It, and the Reboot Loop You Built | 3-7 |
| 552 | Power Loss Is a State Transition: Flash Wear, Journaling, and the Commit Point | 1-3 |
| 553 | Debugging Without a Console: Reset Reasons, Trace Buffers, and the Heisenbug | 3-7 |

Kursun yayı dört bölüm: **bağlam** (542-543), **paylaşılan durum** (544-545),
**zaman ve kaynak** (546-550), **hayatta kalma** (551-553).

**543 ve 544 ayrı, çünkü hata sınıfları ayrı.** 543'ün hatası *ne yaptığın*
(ISR'de bloklamak, tahsis etmek, yazdırmak); 544'ünki *neyi paylaştığın*
(yırtılmış okuma, `volatile`'ın atomiklik sanılması). Tek derste birleşirse
ikisi de "kesmeler zor" diye tek bir bulanık kategoriye düşer — P24'ün 529/530
için verdiği aynı gerekçe.

**544 ve 545 yan yana.** 545'in kilitsiz halkası, 544'ün atomiklik kuralı
olmadan bir tarif; 544 kuralı kurar, 545 o kuralın tek doğru kullanımını
gösterir ve `proof` ile bütün geçişmeleri sayar.

**549 `1-3`, çünkü taşma hatası kıdemle gelmiyor.** `now >= last + interval`
her deneyim seviyesinde yazılıyor ve 49,7 gün sonra bir kez patlıyor.

Çapraz bağ: 542 `#524`'e ve `#469`'a, 543 `#528`'e, 545 `#476`'ya, 546 `#537`'ye,
548 `#481`'e, 549 `#474`'e ve `#487`'ye, 550 `#533`'e ve `#534`'e, 551 `#537`'ye,
552 `#479`'a ve `#478`'e, 553 `#540`'a ve `#494`'e bağlanır. Bu kurs onları
yeniden anlatmaz — **kısıtın firmware'de olduğu yeri** anlatır.

### Üç sınır beyanı

Bu kursun en büyük riski komşularını tekrar etmek. Üçü nesirde açıkça
beyan edilir:

1. **`#476` politikayı sahiplenir, 545 mekanizmayı.** `#476` taşma
   politikasının bir ürün kararı olduğunu söyler (en yeniyi mi at, en eskiyi
   mi); 545 o halkanın iki bağlam arasında **doğru** olmasını sağlar. 545
   politika seçmez, `#476`'ya bağlar.
2. **`#479` dağıtımı ve geri almayı sahiplenir, 552 taahhüt noktasını.**
   `#479` kademeli yayılımı, denemeli açılışı ve otomatik geri dönüşü
   anlatıyor — sunucunun ve filonun tarafı. 552 baytların flash'ta nereye
   gittiğini ve gücün yazma ortasında kesilmesinin neden bir durum geçişi
   olduğunu anlatır. **İmzalama ve güven zinciri `#478`'indir** ve orada
   kalır; 552 imza doğrulamasının *ne zaman* olması gerektiğini söyler, *nasıl*
   olduğunu değil.
3. **551 bir işlevsel güvenlik dersi değildir.** Watchdog'un mekanizması ve
   yanlış beslenmesi anlatılır; IEC 61508 / ISO 26262 sertifikasyonu, güvenlik
   bütünlüğü seviyeleri ve yedekli mimari **yazılmaz** — `#541`'in usulü, o
   sınır orada duruyor.

## Neden hiç C fence'i yok

Bir firmware kursunda beklenen dil C. Bu kurs C **yazmaz** ve bu bir eksiklik
değil, ölçülmüş bir karar:

- `code/unverified-language` kuralı korpusta hâlâ `warn`, çünkü 10 `java` +
  P16'nın C# fence'leri duruyor. P22 bu kuralın `error`'a terfisini açıkça o
  backlog'a bağladı. Bir düzine C fence'i eklemek, terfiyi kalıcı olarak
  imkânsız kılardı.
- `verify-code` C'yi derlemez. TypeScript fence'i tip denetiminden geçer,
  `run` fence'i tarayıcıda gerçekten koşar (P8), `proof` fence'i CI'da gerçekten
  koşar (P5). Bir C fence'i üçünde de yalnız metindir.
- Kitle TypeScript yazıyor. P24 aynı kararı verdi: RC eğrisi, bölücü toleransı
  ve enerji bütçesi C ile değil TS ile gösterildi ve ders kaybetmedi.

Yerine konan şey **model**dir ve her fence bunu kendi yorumunda söyler:
544'ün yırtılmış okuması 16-bit bir makinenin 32-bit sayacı iki yarımda
okumasını modelleyen bir TS fonksiyonudur; 545'in halkası gerçek bir SPSC
halkasıdır ve `proof` bütün üretici/tüketici geçişmelerini sayar. Register
isimleri, `volatile` anahtar kelimesi ve derleyici davranışı **nesirde**
anlatılır — çalıştırılabilir olduğu iddia edilmez.

## Yapılacaklar

### `content/courses/embedded-firmware/` *(yeni)*

12 ders + manifest. Arketip şartname değil, **`content/courses/iot-hardware-basics/528_floating_inputs_pullups_pulldowns_open_drain.md`**:
altı bölüm, nesirden çıkan `quiz` anchor'ları, bir `ts run`, ve `#530`'a
bağlanan bir sınır cümlesi.

Dal slug'ı `course_content.sections.ts`'e — **`iot-hardware-basics` ile
`iot-telemetry-edge` arasına**, çünkü dizi bir okuma sırasıdır: elektrik
(P24) → firmware (P25) → taşıma (P17). Kapak `generate-covers.ts`'in
`SUBJECTS`'ine. Sabit korpus sayıları 523 → **535** (üç test).

### `content/_verify/embedded-firmware/545/` *(yeni)*

`proof`: tek üretici / tek tüketici halkasının **bütün geçişmelerinin sayılarak**
denetlenmesi. Üretici ve tüketici adımları her sırayla çalıştırılır; her durumda
üç değişmez kontrol edilir (tüketilen dizi üretilen dizinin öneki, dolu halkaya
yazılmaz, boş halkadan okunmaz) ve sonunda denetlenen geçişme sayısı basılır.
Dersin "kilide gerek yok" iddiası böylece yazarın değil koşunun çıktısı olur.

### `content/_verify/embedded-firmware/549/` *(yeni)*

`proof`: 32-bit tick sayacının sarma sınırında iki deyimin karşılaştırılması —
`now - last >= interval` (maskelenmiş çıkarma) ve `now >= last + interval`.
Sarma noktasının etrafındaki bütün tick'ler taranır, ikinci deyimin kaç tick
boyunca yanlış cevap verdiği **sayılır**. Başlıktaki "the subtraction that
saves you" o sayıdan gelir.

Her iki workspace de sıfır bağımlılık, saf Node — `stamp-verify.ts`
`npm install` çalıştırmaz. Determinizm sözleşmesi dosya başında yorum olarak
yazılır: saat basılmaz, süre basılmaz, üretilmiş id yok, sıralama sabit.
Bire bir örnek: `content/_verify/iot-hardware-basics/532/divider.js`.

### `scripts/stamp-verified.ts` — **değişmiyor**

Bu kursta denylist dersi yok. Konuların hiçbiri yanlış öğrenildiğinde yaralanma
üretmiyor; 551'in güvenlik sınırı ve 552'nin imza sınırı nesirde beyan edilerek
kapatılıyor (yukarıdaki üç sınır beyanı). 12 dersin 12'si damgalanır ve her
biri `quiz` + `recall` taşır.

### `modules/course_content/course_content.paths.ts` *(değişiyor)*

`iot-engineer` path'i firmware adımlarını alır. Sıra: P24'ün donanım girişi →
**542, 546, 549** → `#469`'un taşıma yolu. Üç ders seçilir, on iki değil: path
bir okuma sırasıdır, kurs kataloğu değil. 542 kursun kapısı, 546 bloklamama
kuralı (`#537`'nin enerji bütçesini firmware'e bağlayan ders), 549 üç saatin
(`#474`) cihaz tarafındaki karşılığı.

**Path 16 adımda kalır — ekleme değil, değiştirme.** `paths.test.ts` bir path'i
8-16 adımla sınırlıyor ve bu P23'ün bilinçli kısıtı. Üç ders girince üçü çıkar:
`#470` (MQTT konu joker'leri — `#469` yolu zaten kuruyor, kalanı sözdizimi),
`#487` (ikiz durumu için zaman serisi deposu — `digital-twin` path'inde zaten
var ve `#477` şemayı bu path için kuruyor), `#519` (kamuya açık besleme kalite
kapıları — entegrasyon okurunun konusu). Blurb'ün söz verdiği altı kalem
(474/475/476/477/488/518) yerinde kalıyor.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 542 | `mermaid` (1) | Reset → init → superloop, ve yanında kesme bağlamı. **Kursun tek diyagramı** |
| 543 | `diff` | ISR'nin işi kendi yapması ile bayrak kaldırıp döngüye bırakması — iki sürüm yan yana |
| 544 | `ts run` | 32-bit sayacın iki yarımda okunması; kesme araya girince çıkan değer ne ikisi ne öteki |
| 545 | `ts run` + **`proof`** | Halkanın kendisi; `proof` bütün geçişmeleri sayarak denetler |
| 546 | `ts run` | Aynı iş `delay()` ile ve durum makinesiyle — CPU'nun kaç tick boyunca serbest kaldığı |
| 547 | `tradeoff` + `ts run` | Superloop ile öncelikli görevler; `ts run` öncelik ters çevrilmesini bir zaman çizgisi olarak basar |
| 548 | `calc` | RAM bütçesi: `.data` + `.bss` + görev yığınları + tepe kullanımı payı — hepsi dört işlem |
| 549 | `ts run` + **`proof`** | Sarma aritmetiği; `proof` yanlış deyimin kaç tick yanıldığını sayar |
| 550 | `ts run` | Q16.16 dönüşümü ve **ara çarpımın** 32 bitte taşması — kaybedilen çözünürlük `#533`'ün devamı |
| 551 | `ts run` | Yeniden başlatma sayacı ve geri çekilme; besleme noktası yanlış seçilince ne olur |
| 552 | `calc` | Flash aşınması: dayanım çevrimi / günlük yazma → yıl. Dört işlem |
| 553 | `md` checklist | Konsolsuz saha teşhis prosedürü — okuyucunun işaretleyeceği liste |

Her ders `quiz` + `recall` taşır — **istisna yok**.

`ASSUMED_CONTEXT`'te hiçbir firmware istemcisi yok; her snippet kendi tipini
bildirir. `Math.*` serbest; `BigInt` kullanılmaz (32-bit taşma `>>> 0` ve
maskeyle modellenir, çünkü öğretilen şey tam olarak o taşmadır).

### `calc` gramerinin kısıtı

`course_content.expr.ts` yalnız `+ - * / ( )` ve `min`, `max`, `round`
tanıyor. P24'te olduğu gibi widget seçiminin ilk sorusu budur:

- `calc` olabilenler: RAM bütçesi (548), flash aşınma ömrü (552) — toplama ve
  bölme
- `calc` **olamayanlar**: sarma aritmetiği (549, maske gerekir), sabit nokta
  ölçekleme (550, kaydırma gerekir), geri çekilme çizelgesi (551, üs gerekir) —
  üçü de `ts run`

## Kaynak kuralı

P24'ün kuralı bu kursta aynen geçerlidir ve bir kalem eklenir.

- Her süre / boyut / çevrim rakamı üç kaynaktan **birine** dayanır:
  (a) üretici + parça numarası + doküman revizyonu + tarih ile alıntılı bir
  datasheet değeri, (b) numarası ve baskısı yazılı bir standart, (c) bir
  `ts run` / `proof` / `calc` **koşusunun** çıktısı. Dördüncü kaynak yoktur.
- Yasak kalıplar: "tipik kesme gecikmesi ~X µs", "RTOS Y kadar RAM yer",
  "flash genelde Z çevrim dayanır", "çoğu MCU'da W". Rakam yerine **hesap**.
- **Eklenen kalem — kıyaslama yasağı.** Hiçbir RTOS, derleyici ya da kütüphane
  başka birine karşı hızlı/küçük ilan edilmez. 547 bir `tradeoff`'tur ve iki
  **mimariyi** karşılaştırır, iki ürünü değil. Ürün adı (FreeRTOS, Zephyr,
  Arduino, ESP-IDF) yalnız **dokümantasyon atfı** olarak geçer — öneri yok,
  kurulum anlatımı yok, API turu yok. `#480`'in ThingsBoard'a uyguladığı usul.
- Dil davranışı iddiaları (`volatile`'ın ne yapıp ne yapmadığı, sıralama
  garantileri) numaralı dil standardına ya da derleyici dokümanına atıfla
  yazılır; "derleyici genelde şunu yapar" yazılmaz.

## Kabul kriterleri

- [x] 12 ders (542-553) + manifest; `shape/*` sıfır bulgu — kursta toplam
      **0 lint bulgusu** (korpus geneli 21 warn, hepsi eski program)
- [x] 12 ders damgalı, `HARM_DENYLIST` değişmedi (20 blocked, hepsi eski);
      her derste `quiz` + `recall` — 12/12
- [x] Üç sınır beyanı nesirde: 545 → `#476` ("What to do when the ring is full
      is not this lesson's question"), 552 → `#479` ve `#478` ("what makes an
      image trustworthy ... is Lesson 478's"), 551 → "A watchdog makes a device
      recoverable, not safe"
- [x] Hiç C/C++ fence'i yok; `code/unverified-language` **19'da sabit**, hiçbiri
      bu kursta değil
- [x] `parseMistakes`: korpus geneli `single` **141'de sabit**, `0 mistakes: 0`
- [x] Her rakam ya alıntılı doküman (ARM DUI 0553, DAI 0321, ST AN4894,
      Nordic nRF52832, ISO/IEC 9899/WG14), ya bir koşunun çıktısı. Hiçbir ürün
      başka bir ürüne üstün ilan edilmiyor; 547 iki **mimariyi** karşılaştırıyor
- [x] 545 (`ring.js`) ve 549 (`wrap.js`) damgalı, sıfır bağımlılık, `proof`
      27/27; 545: doğru sıra 58 durumda **0 ihlal**, ters sıra 79 durumda ihlal
      buluyor. 549: 65.536 çiftin **17.140'ında** naif form yanlış, maskelenmiş
      çıkarma **0 hata**; 49,71 gün de o koşudan
- [x] 543'ün `diff` çifti tanınıyor — widget tablosu `diff` 3 → **4**
- [x] `links/dead-lesson-ref` temiz; çapraz bağların hepsi gerçek dosya
      slug'ına çözülüyor (`#487` yanlış seçilmişti, `#518` ile değiştirildi)
- [x] Üç sabit test sayısı 523 → **535**
- [x] `content:stats-check` "**32 rows checked · 0 disagree**" (33 değil — satır
      sayısı kurs sayısı değil, belgelenmiş ölçüm satırı sayısı);
      `content:snapshot-diff` **0 explained · 0 unexplained** (+12 yeni ders,
      mevcut hiçbir bölüm kımıldamadı)
- [x] `content:check` (**309 test**), `lint`, `content:concepts-check`,
      `content:verify-mermaid` (27 fence, 16 ok, 11 unverified — hepsi DOM),
      `build` (**584 statik sayfa**, P24'te 571) yeşil. Arama indeksi
      **81.979 B gz** / 98.304 sınır
- [x] P23 `iot-engineer` path'i **16 adımda kaldı**: 542/546/549 girdi,
      470/487/519 çıktı (P23'ün 8-16 kısıtı)

## Risk

| Risk | Azaltma |
|---|---|
| `#476` / `#479` tekrarı olur | Üç sınır beyanı nesirde; 545 politika seçmez, 552 dağıtım anlatmaz |
| Kurs bir RTOS ürün turuna döner | Kıyaslama yasağı; 547 iki mimariyi karşılaştırır, iki ürünü değil |
| C fence'i eklenir ve `unverified-language` backlog'u büyür | Karar şartnamede yazılı; her fence TS ve bir **model** olduğunu kendi yorumunda söyler |
| Ders bir işletim sistemi dersine döner | Her ders okuyucunun sahada göreceği bir **arızayla** çerçevelenir; P24 arketipi |
| Güvenlik sertifikasyonuna taşar | 551 sınırı beyan eder; `#541`'in usulü |
| `proof`'lar determinizmi kaybeder | İkisi de saf aritmetik ve sabit sıralı; saat, süre, rastgelelik yok |
| 12 ders tek fazda ağır gelir | 542-545 çekirdek ve önce yazılır; 550-553 en son |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Üç sebep
var ve karıştırılmamalı: *kapsam* (sonra yapılabilir), *bağımlılık* (önce
başka bir şey gerekiyor), *doktrin* — sonuncusu ertelenmiş değil
**reddedilmiş**tir ve `yasak` diye işaretli.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| DMA ve sıfır-kopya tampon zincirleri | CPU'yu hiç uyandırmadan veri taşımak | kapsam — 543-545 iki bağlamı kuruyor; DMA üçüncü bir bağlam ve kendi dersini hak ediyor |
| Bağlantı katmanı sürücüsü yazmak (I²C/SPI register düzeyinde) | `#530`'un yazılım tarafı | kapsam — register erişimi C ister; bu kursun `Neden hiç C fence'i yok` kararı önce gözden geçirilmeli |
| Güç modları ve uyanma kaynakları derinlemesine | `#537`'nin bütçesini firmware'de gerçeklemek | kapsam — 546 bloklamamayı kuruyor; uyku modları matrisi ayrı ders |
| Secure boot, anahtar saklama, cihaz sırları | Güvenilir açılış zinciri | bağımlılık — `#478` **denylist'te**; uzman pasosundan önce yazılmaz |
| İşlevsel güvenlik (IEC 61508 / ISO 26262) | Sertifikalı sistemlerin mimari kısıtları | **doktrin = yasak** — 551 sınırı kuruyor; `#541`'in usulü, güvenlik iddiası yazılmaz |
| Gerçek zamanlı analiz (WCET, oran-monotonik) | Zamanlamanın kanıtlanması | kapsam — 547 önceliği kuruyor; çizelgeleme teorisi ayrı ve matematiği ağır |
| Modbus RTU çerçeve düzeyinde | `#536`'nın protokol tarafı | bağımlılık — P24'ün tablosundaki aynı kalem; `#514` denylist'te |
| Birim testi ve donanım-in-the-loop | Firmware'in CI'sı | kapsam — 553 sahada teşhisi kuruyor; test altyapısı ayrı ders |
| Sensör füzyonu ve Kalman filtresi | Çok sensörlü tahmin | kapsam — P17'nin ve P24'ün tablolarında zaten duruyor |
