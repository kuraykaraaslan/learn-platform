# P24 — IoT donanım temelleri: elektrik, pin, kablo, güç

**Efor:** ~9-10 gün · **Bağımlılık:** P17 · **Sonrakiler:** P23 (path'ler), P22'nin yeniden ölçümü

## Neden

`iot-telemetry-edge` (P17) cihazdan veritabanına giden yolu anlatıyor — ama
**ilk bayt var olduktan sonra** başlıyor. `#469`'un ilk kutusu "cihaz"; o
kutunun içi korpusun hiçbir yerinde açılmıyor.

Ölçüm, 31 kurs ve 505 ders üzerinde, kelime sınırıyla (`grep -rilw`):

| Terim | Ders | Terim | Ders |
|---|---:|---|---:|
| `ohm`, `voltage`, `resistor`, `capacitor` | **0** | `GPIO`, `I2C`, `SPI`, `UART` | **0** |
| `multimeter`, `breadboard`, `solder` | **0** | `pull-up`, `level shift` | **0** |
| `microcontroller`, `thermistor` | **0** | `ADC`, `milliamp` | **0** |
| `4-20 mA`, `RS-485`, `Modbus`, `PoE` | **0** | `enclosure`, `IP65`, `ground loop` | **0** |

`datasheet` iki yerde geçiyor ve ikisi de **bu boşluğu işaret ediyor**:
`#504` "vendor does not know what this asset's failure costs" der, `#481` ise
"comes from Lesson 472's calculation, **not from a datasheet's headline**" —
yani korpus datasheet'e iki kez atıfta bulunuyor ama okuyucuya birini nasıl
okuyacağını hiç öğretmiyor.

İkinci ölçü daha da keskin. Korpusta `0-1` bracket'li **15** ders var ve
hepsi dört kursta toplanmış: `fundamentals-tools`, `business-finance-solo-ops`,
`client-acquisition-sales`, `content-seo-personal-brand`. Yani **93 derslik,
8 kursluk `built-environment` dalının tek bir giriş dersi yok.** Dal, alanı
zaten bilen birine yazılmış. Sektöre yeni giren yazılımcı dala `#431`'den
(IFC şeması) ya da `#469`'dan (MQTT yolu) giriyor ve ikisi de onun bilmediği
bir donanımı varsayıyor.

Bu kurs o kapıyı açar: fiziksel büyüklükten ilk bayta kadar olan yol, ve
sahada o yolu bozan şeyler. Kurs `#469`'un başladığı yerde biter ve bunu
nesirde açıkça söyler.

## Kapsam

**Kurs:** `iot-hardware-basics` — "IoT Hardware Basics"
**Ders:** 18 · **id:** 524-541 · **bracket:** `0-1` ×4, `1-3` ×5, `3-7` ×8, `7-10` ×1

> *Description:* "The physical half of a sensor node: pins, levels, wiring,
> noise and power — everything a developer has to measure before the first
> byte exists."

| id | Başlık | bracket |
|---|---|---|
| 524 | The Signal Chain: Everything That Happens Before the First Byte | 0-1 |
| 525 | Volts, Amps, Ohms, Watts: The Four Numbers Behind Most Field Failures | 0-1 |
| 526 | Reading a Datasheet: Absolute Maximum Is Not a Specification | 0-1 |
| 527 | Pins: Input or Output, Digital or Analog — and What PWM Actually Is | 0-1 |
| 528 | Floating Inputs, Pull-ups, Pull-downs, and Open Drain | 1-3 |
| 529 | TX to RX: Wiring a Serial Link, and the Four Things That Must Match | 1-3 |
| 530 | I²C and SPI: Addresses, Chip Selects, and Why the Bus Dies at Three Metres | 1-3 |
| 531 | 3.3 V Meets 5 V: Logic Thresholds and the Board You Killed | 1-3 |
| 532 | Voltage Dividers and Tolerance: Where Your Three Percent Error Came From | 3-7 |
| 533 | From Counts to Degrees: The ADC and Two Lossy Conversions | 3-7 |
| 534 | Sensor Error: Offset, Gain, Drift, and Per-Device Calibration | 3-7 |
| 535 | Ground, Noise, and the Cable That Became an Antenna | 3-7 |
| 536 | Distance: Voltage Drop, 4–20 mA, and Differential Pairs | 3-7 |
| 537 | Energy Budgets: Compute the Battery Life, Never Quote It | 3-7 |
| 538 | The Enclosure Is Part of the Product: IP Codes, Glands, Condensation | 3-7 |
| 539 | A Dev Kit Is Not a Product: Module, Board, and What Changes at Five Hundred Units | 3-7 |
| 540 | Bring-Up and Fault Isolation: Power, Then Signal, Then Software | 1-3 |
| 541 | Mains, Lithium, and Certification: Where an Engineer Stops | 7-10 |

**524-527 bilinçli olarak dört `0-1` dersi.** Dalın giriş kapısı burası; bu
dördü okunmadan kalan on dördü okunamaz. Sırası da keyfî değil: önce yol
(524), sonra yolu ölçen dört büyüklük (525), sonra o büyüklüklerin nereden
okunacağı (526), sonra onların pinde aldığı biçim (527).

**529 ve 530 ayrı, çünkü hata sınıfları ayrı.** 529'un hatası **kablolamadır**
(TX'i TX'e bağlamak, toprağı unutmak); 530'unki **bütçedir** (hat kapasitansı,
adres çakışması, chip select sayısı). Tek derste birleştirilirse ikisi de
"seri işte" diye tek bir bulanık kategoriye düşer.

**532 ve 533 yan yana.** 533'ün "counts are not volts" iddiası, 532'nin
tolerans hesabı olmadan bir slogan; 532 hatanın nereden geldiğini sayarak
kurar, 533 o hatayı iki dönüşüm boyunca taşır.

Çapraz bağ: 524 `#469`'a, 527/533 `#473`'e, 528 `#482`'ye, 534 `#474` ve
`#517`'ye, 536 `#514`'e, 537 `#472`'ye, 539 `#512` ve `#479`'a, 540 `#476` ve
`#494`'e, 541 `#478`'e bağlanır. Bu kurs onları yeniden anlatmaz — **kısıtın
fiziksel olduğu yeri** anlatır.

## Yapılacaklar

### `content/courses/iot-hardware-basics/` *(yeni)*

18 ders + manifest. Dal slug'ı `sections.ts`'e — **`iot-telemetry-edge`'in
önüne**, çünkü dizi bir okuma sırasıdır ve bu kurs `#469`'un önkoşuludur.
Kapak `SUBJECTS`'e. Sabit korpus sayıları 505 → **523**.

Arketip **şartname değil, P14/P17 dersleridir**. Yazarken açık duracak iki
dosya: `content/courses/iot-telemetry-edge/472_lorawan_duty_cycle.md` (bir
`proof`'un dersin sayısını nasıl ürettiği) ve `.../475_idempotent_ingest.md`
(bir `sql run` dizisinin bir iddiayı nasıl kanıtladığı).

### `content/_runtime/seeds/device_calibration.sql` *(yeni)*

534'ün `sql run` fence'leri için. İki tablo: `raw_sample(device_id, taken_at,
counts)` ve `device_calibration(device_id, offset_counts, gain_ppm,
calibrated_at)`. Değerler satır numarasından **sabit aritmetikle** türetilir —
`random()` yok. Sapma `sensor_readings.sql`'in usulüyle **adlandırılmış
nedenle** enjekte edilir: `offset drift`, `gain error`, `never calibrated`.
≤50 KB.

Seed'in taşıdığı iddia: aynı ham sayım, sekiz cihazda sekiz farklı sıcaklık
verir; kalibrasyonsuz filonun yayılımı **hava durumu gibi görünür**; ve
kalibrasyon uygulandığında yayılım kapanır. Üçü de sorguyla gösterilir,
cümleyle değil.

### `content/_verify/iot-hardware-basics/532/` *(yeni)*

`proof`: nominal bölücü oranı, sonra %1 ve %5 toleranstaki uç
kombinasyonların **sayılarak** üretilmiş en kötü durum aralığı. Dersin
başlığındaki "three percent" böylece yazarın değil koşunun sayısı olur — bu,
okuyucunun bir tasarım gözden geçirmesinde savunacağı türden bir rakam
olduğu için zorunlu.

### `content/_verify/iot-hardware-basics/537/` *(yeni)*

`proof`: bir günün durum listesi (uyku / ölçüm / iletim; her biri süre + akım)
→ mAh/gün; regülatörün boşta akımı **ayrı satır**, çünkü saha ölçümlerinde
bütçeyi en sık o batırır; sonra tek parametre değiştirilip duyarlılık basılır.
Akım değerleri alıntılanmış datasheet değerleridir.

Her iki workspace de sıfır bağımlılık, saf Node — `stamp-verify.ts`
**`npm install` çalıştırmaz**. Determinizm sözleşmesi dosya başında yorum
olarak yazılır: saat basılmaz, süre basılmaz, üretilmiş id yok, sıralama sabit.
Bire bir örnek: `content/_verify/iot-telemetry-edge/472/airtime.js`.

### `scripts/stamp-verified.ts` *(değişiyor)* — `HARM_DENYLIST`

**Ders 541 listeye eklenir.** Şebeke gerilimi, lityum hücre ve sertifikasyon;
yanlış öğrenilmesi bir bug değil bir yaralanma üretir. Denylist'e girince
`verified` asla damgalanmaz, değişmez #3 gereği üstünde hiçbir alıştırma
açılmaz, ders yalnız okunur kalır.

**541 bir "nasıl yapılır" dersi değil, bir sınır dersidir.** Devre şeması,
bağlantı tarifi, şarj devresi tasarımı, hücre dengeleme **yazılmaz**.
Öğretilen tek şey: hangi işin lisanslı bir elektrikçiye, hangi işin bir test
laboratuvarına ait olduğu ve bir ürünün ne zaman düzenlemeye tabi hâle
geldiği. `#478`'in usulü.

**536 denylist'te değil** ve sınırı bilinçli: fiziksel katman anlatılır —
gerilim düşümü, akım ilmeği, diferansiyel çift. **OT ağ ayrımı, gateway ve
protokol sınırı `#514`'e bırakılır** ve 536 bunu bir cümleyle söyler. `#514`
zaten denylist'te; oraya ait bir konuyu doğrulanmış bir derste anlatmak
denylist'i delmek olurdu.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 524 | `mermaid` (1) | Fiziksel büyüklük → sensör → koşullandırma → ADC → MCU → radyo. **Kursun tek diyagramı** |
| 525 | `ts run` | Aynı 5 V'ta üç yükün akımı ve gücü; Ohm bir formül değil bir hata ayıklama aracı olarak |
| 527 | `ts run` | PWM görev oranı → ortalama gerilim; ve aynı ortalamanın neden aynı sinyal olmadığı |
| 528 | `ts run` | Pull-up + hat kapasitansı → RC yükselme süresi (`Math.log` gerekir) |
| 529 | `ts run` | Saat / bölen → gerçek baud → % hata; hangi bölenin çerçeveyi bozduğu |
| 530 | `tradeoff` + `ts run` | I²C ile SPI seçimi; `ts run` kapasitanstan maksimum pull-up direncini çıkarır |
| 531 | `ts run` | V<sub>IH</sub>/V<sub>IL</sub> eşikleri ile besleme çiftlerinin tablosu — hangi yön çalışır, hangisi çalışmaz |
| 532 | `calc` + **`proof`** | Bölücü oranı `calc`; `proof` tolerans aralığını sayarak üretir |
| 533 | `ts run` | count → volt → °C; her dönüşümde kaybedilen çözünürlük |
| 534 | **`sql run`** (yeni seed) | Kalibrasyonun aynı sayımlardan farklı gerçekler üretmesi |
| 535 | `diff` | İki netlist: ortak topraksız ve topraklı |
| 536 | `calc` + `tradeoff` | Kablo düşümü `calc`; 0-10 V / 4-20 mA / dijital bus `tradeoff` |
| 537 | `calc` + **`proof`** | Enerji bütçesi `calc`; `proof` bir günü mAh'e çevirir ve duyarlılığı basar |
| 539 | `tradeoff` | Geliştirme kartı ile üretim modülü |
| 540 | `md` checklist | Sahaya çıkış prosedürü — okuyucunun işaretleyeceği liste |
| 526, 538 | runtime yok | Datasheet okuma ve muhafaza; ikisi de okuma ve alıntı işi |
| **541** | runtime yok + denylist | Güvenlik sınırı; uzman pasosu bekler |

Her ders `quiz` + `recall` taşır — **541 hariç**.

`ASSUMED_CONTEXT`'te hiçbir donanım istemcisi yok; her snippet kendi tipini
bildirir. `Math.*` serbest ve bu kursta gereklidir.

### `calc` gramerinin kısıtı

`course_content.expr.ts` yalnız `+ - * / ( )` ve `min`, `max`, `round`
tanıyor — **üs, karekök, logaritma yok**. Bu bir eksiklik değil, bir sınır ve
ders dağılımını doğrudan belirliyor:

- `calc` olabilenler: bölücü oranı (532), kablo düşümü (536), enerji
  bütçesi (537) — hepsi dört işlem
- `calc` **olamayanlar**: RC üstel yükselmesi (528), termistör eğrisi (533) —
  bunlar `ts run` alır

Yani 528 ve 533'ün `calc` yerine `ts run` alması bir tercih değil; gramerin
sonucudur ve widget seçilirken ilk sorulacak soru budur.

## Kaynak kuralı

Bu kursun tek büyük riski **uydurulmuş donanım rakamı**. P17 kuralı bir
ders için koymuştu ("menzil, pil ömrü rakam olarak yazılmaz"); burada kursun
tamamına genişler.

- Her akım / gerilim / direnç / süre rakamı üç kaynaktan **birine** dayanır:
  (a) **üretici + parça numarası + doküman revizyonu + tarih** ile alıntılı
  bir datasheet değeri, (b) numarası ve baskısı yazılı bir standart,
  (c) bir `ts run` / `proof` / `calc` **koşusunun** çıktısı. Dördüncü kaynak
  yoktur.
- Yasak kalıplar: "tipik menzil ~X metre", "pil yaklaşık Y ay dayanır",
  "genelde Z mA çeker", "çoğu sensör W ile çalışır". Rakam yerine **hesap**
  verilir.
- I²C: **NXP UM10204**, revizyon ve tarih yazılı. SPI'ın **standardı yoktur** —
  bu bir öğretim noktasıdır; mod 0-3 fiilî uzlaşı olarak anlatılır ve
  "standart" denmez.
- Seri hat: **TIA/EIA-232** ve **TIA/EIA-485** numarayla anılır; RS-485'in
  diferansiyel oluşu anlatılır, standardın **metni alıntılanmaz** (ücretli).
- IP kodları: **IEC 60529**, numara ve baskı yazılı; iki hanenin yapısı
  anlatılır, standart metni alıntılanmaz (ücretli). IP ile NEMA'nın
  **birebir çevrilemediği** söylenir — bu, satın alma şartnamesinde sık
  yapılan bir hatadır.
- 4-20 mA fiilî bir endüstri uzlaşısıdır, standart değil; üretici uygulama
  notu revizyonla anılır.
- Ürün adı (Arduino, ESP32, Raspberry Pi) yalnız **datasheet atfı** olarak
  geçer. Öneri yok, kurulum anlatımı yok, pinout turu yok — `#480`'in
  ThingsBoard'a uyguladığı usul.
- 541: şebeke ve lityum için **hiçbir uygulama talimatı** yazılmaz; yalnız
  sınır, sorumluluk ve hangi belgenin kimden isteneceği.

## Kabul kriterleri

- [x] 18 ders (524-541) + manifest; `shape/*` sıfır bulgu. 524 Kuray tarafından
      yazılmıştı; 525-541 bu fazda tamamlandı
- [x] **17 ders damgalı, 541 damgasız** (`HARM_DENYLIST`'e eklendi);
      `verified-sha.json`'da 541 yok. 478 + smart-infra 514/521 ile birlikte
      dört ders uzman pasosu bekliyor
- [x] 541'de **`quiz`/`recall` fence'i yok** — aslında hiç fence'i yok (korpusun
      ilk fence'siz dersi, README'de kayıtlı); `drill/widget-on-unverified-lesson`
      alanda sıfır (kalan 2 bulgu eski program: 114 + iot 478)
- [x] 536'nın nesri: "Where a differential digital link becomes a multi-drop bus
      with addressing, arbitration and a protocol — Modbus RTU over RS-485, and
      the OT/IT boundary around it — that is Lesson 514's subject"
- [x] `parseMistakes` bu 18 derste **0 `single`** (korpus geneli `single` 141'de sabit)
- [x] Her donanım rakamı ya alıntılı datasheet (parça + revizyon), ya numaralı
      standart (NXP UM10204 Rev 7.0, IEC 60529, TIA/EIA-232/485), ya da bir
      `ts run`/`calc`/`proof` koşusunun çıktısı. "tipik menzil ~X" kalıbı yok
- [x] 532 (`divider.js`) ve 537 (`budget.js`) `proof` blokları `stamp-verify.ts`
      ile damgalı, sıfır bağımlılık, `--check` 25/25 ok, iki koşuda md5-aynı.
      532'nin başlıktaki "three percent"i koşunun çıktısı (±3.2%)
- [x] `device_calibration.sql` **3.823 bayt**, `random()` yok (counts
      `round()` + `generate_series` aritmetiği); 534'ün üç `sql run` fence'i
      PGlite'ta koşuldu; naif yayılım 3.4 °C, kalibre yayılım 0.02 °C, iki
      bozuk cihaz (drift + hiç kalibre edilmemiş) sorguyla ortaya çıkıyor
- [x] 535'in `diff` çifti (iki netlist, ortak topraksız/topraklı) `looksLikeDiff()`
      tarafından tanınıyor — widget tablosu `diff` 2 → **3**
- [x] 527 input/output ve dijital/analog dört kombinasyonu ayrı ayrı; 529 TX→RX
      çaprazlamasını, ortak toprak şartını ve çerçeve formatını ayrı başlıklarda
- [x] 528 `#482` ile farkını ("bounce is real switch chatter ... a float is
      undefined level with no switch action at all") ve 537 `#472` ile farkını
      ("Lesson 472 is a regulatory airtime limit ... this lesson is about energy")
      açık cümleyle beyan ediyor
- [x] `links/dead-lesson-ref` temiz; kurs içi + `#469`/`#472`/`#473`/`#474`/`#476`/
      `#478`/`#482`/`#494`/`#512`/`#514`/`#519` çapraz bağları `Lesson NNN` /
      `(/courses/...)` slug'ıyla
- [x] Üç sabit test sayısı **505 → 523**
- [x] `content:stats-check` "32 rows checked · 0 disagree"; `content:snapshot-diff`
      **0 unexplained** (+18 yeni ders)
- [x] `content:reports` sonrası tekrar farkı yok; `content:check` (309 test),
      `lint`, `content:concepts-check`, `content:verify-mermaid` (26 fence,
      16 ok, 10 unverified — hepsi DOM), `build` (571 statik sayfa) yeşil
- [x] P23 `iot-engineer` path'i güncellendi: 524/525/533/537 `#469`'un önüne
      eklendi ("okuma sırasında #469'un önüne girer")

## Risk

| Risk | Azaltma |
|---|---|
| Donanım rakamları uydurulur | Üç kaynaktan biri zorunlu; dördüncü yok. Rakam yerine hesap |
| Ders bir fizik dersine döner | Her ders okuyucunun sahada göreceği bir **arızayla** çerçevelenir; P14 arketipi |
| Ürün turu olur (Arduino/ESP32/RPi) | Ürün adı yalnız datasheet atfı; kurulum/pinout/öneri yok |
| Şebeke veya lityum tarifi yayımlanır | 541 denylist'te ve bir sınır dersi; uygulama talimatı yazılmaz |
| 536 OT ağ konusuna taşar ve `#514`'ün denylist'ini deler | 536 fiziksel katmanla sınırlı; sınırı nesirde beyan eder |
| `#472`/`#482` tekrarı olur | 528 ve 537 farkı açık cümleyle beyan eder ve `(#N)` ile bağlar |
| `calc` üstel matematik isteyince kırılır | Gramer kısıtı şartnamede yazılı; üstel olan her şey `ts run` |
| 18 ders tek fazda ağır gelir | 524-531 çekirdek ve önce yazılır; 538-539 en son |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Üç sebep
var ve karıştırılmamalı: *kapsam* (sonra yapılabilir), *bağımlılık* (önce
başka bir şey gerekiyor), *doktrin* — sonuncusu ertelenmiş değil
**reddedilmiş**tir ve `yasak` diye işaretli.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| PCB tasarımı, şematikten gerber'e | Kartın kendisinin üretilmesi | kapsam — bu kurs pini ve kabloyu kuruyor; kart tasarımı ayrı kurs |
| RF, anten ve link bütçesi | Menzilin nereden geldiği | kaynak — menzil rakamı yazılamaz; link bütçesi `calc` olarak eklenebilir |
| EMC / CE ön uygunluk testi | Ürünün geçmek zorunda olduğu kapı | bağımlılık — `#541` sınırı kuruyor; test süreci ondan sonra |
| Osiloskop ve protokol analizörü kullanımı | `#540`'ın ötesinde alet ustalığı | kapsam — `#540` metodu kuruyor, alet dersi ayrı |
| Röle ve aktüatör sürme | Çıkışın dünyayı hareket ettirmesi | kapsam — ama şebeke anahtarlayan hiçbir devre yazılmaz (`#541` sınırı) |
| Lityum şarj devresi, hücre dengeleme, BMS | Pil yönetimi tasarımı | **doktrin = yasak** — `#541` denylist'te; tasarım tarifi hiç yazılmaz |
| Şebeke tesisatı, pano, koruma topraklaması | Kurulum işi | **doktrin = yasak** — lisanslı iş; `#541` nerede durulacağını söyler |
| Firmware mimarisi (RTOS, kesme, DMA) | Pinin ötesindeki yazılım | kapsam — bu kurs elektriği kuruyor; firmware ayrı |
| Termal tasarım ve derating | Sıcak muhafazada ömrün kısalması | kapsam — `#538` ısıya değiniyor, hesap ayrı ders |
| Modbus RTU çerçeve düzeyinde | `#536`'nın fiziksel katmanının üstü | bağımlılık — `#514` OT sınırını kuruyor ve **denylist'te**; protokol dersi o pasodan sonra |
| Zigbee / BLE / Matter, sensör füzyonu | Kısa menzil yığını, çok sensörlü tahmin | kapsam — P17'nin `Eklenebilecekler` tablosunda zaten duruyor |
