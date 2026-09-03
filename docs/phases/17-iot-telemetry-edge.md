# P17 — IoT telemetri, LoRaWAN ve uç (edge)

**Efor:** ~7 gün · **Bağımlılık:** P14 · **Sonrakiler:** P18, P20

## Neden

Korpusta `IoT` üç yerde geçiyor ve üçü de konu dışı: biri satış dersinde
("Hardware and IoT companies need dashboards"), biri TimescaleDB dersinde bir
kullanım örneği listesinde. `MQTT`, `LoRaWAN`, `SCADA`, `sensor` terimlerinin
eşleşmesi **sıfır**.

Oysa bu, mevcut korpusun en güçlü olduğu alanla — idempotency, retry, kuyruk,
zaman serisi — doğrudan komşu. Fark şu: bir HTTP isteğini yeniden gönderen
istemci ile **üç gün şebekesiz kalıp 4.000 ölçümü birden boşaltan** bir cihaz
aynı problemi çözmüyor. Ve LoRaWAN'da fark daha da sert: **görev döngüsü
(duty cycle) yasal bir sınır**, yeniden denemeyi bir tasarım tercihi olmaktan
çıkarıp bir bütçe kalemi yapıyor.

Cihazdan veritabanına giden yol, ölçümün kaybolduğu, çoğaldığı veya yanlış
zaman damgası aldığı her yeri içerir — okuyucunun üretimde göreceği hataların
neredeyse tamamı bu yolun bir noktasında oluşur.

## Kapsam

**Kurs:** `iot-telemetry-edge` — "IoT Telemetry & Edge"
**Ders:** 14 · **id:** 469-482 · **bracket:** `1-3` ×2, `3-7` ×11, `7-10` ×1

> *Description:* "The path from a device to a database, and every place data is
> lost, duplicated or timestamped wrong along it."

| id | Başlık | bracket |
|---|---|---|
| 469 | The Device-to-Database Path: Where Readings Actually Get Lost | 1-3 |
| 470 | MQTT Topics, Wildcards, and the Matching Rule | 1-3 |
| 471 | QoS 0/1/2 and Retained Messages: The At-Least-Once You Actually Get | 3-7 |
| 472 | LoRaWAN: Duty Cycle, Spreading Factor, and a Payload Budget You Cannot Argue With | 3-7 |
| 473 | Designing a Payload for a 51-Byte Budget: CBOR, Varints, Deltas | 3-7 |
| 474 | Three Clocks: Device Time, Gateway Time, Ingest Time | 3-7 |
| 475 | Idempotent Ingest: Deduplicating a Reading That Arrives Three Times | 3-7 |
| 476 | Store-and-Forward: A Device That Loses Its Link and Comes Back | 3-7 |
| 477 | Time-Series Schema and Retention: Partitions, Rollups, and Deleting Data | 3-7 |
| 478 | Device Identity and Provisioning: Certificates, Rotation, Revocation | 7-10 |
| 479 | Device Fleet Management: Configuration, OTA Updates, and Rollback | 3-7 |
| 480 | ThingsBoard and the Platform Question: What You Get, What You Hand Over | 3-7 |
| 481 | Edge Processing: What to Compute Before You Pay for Transport | 3-7 |
| 482 | Alerting on Sensor Data Without Crying Wolf: Hysteresis, Debounce, Dead Bands | 3-7 |

**472 ve 473 bilinçli olarak yan yana.** 473'ün "51 bayt" başlığı keyfî değil,
LoRaWAN'ın belirli veri hızlarındaki yük sınırı — 472 o sınırın nereden
geldiğini (yayılma faktörü, görev döngüsü, bölgesel düzenleme) kurar, 473 o
bütçeye sığan kodlamayı yazdırır. Ayrı yazılırlarsa 473 keyfî bir sayı ezberi
olur.

Çapraz bağ: 475 mevcut idempotency dersine (`#7`), 477 TimescaleDB dersine
(`#45`), 476 retry/kuyruk derslerine `(#N)` ile bağlanır. Bu kurs onları
yeniden anlatmaz — **kısıtın değiştiği yeri** anlatır.

## Yapılacaklar

### `content/courses/iot-telemetry-edge/` *(yeni)*

14 ders + manifest. Dal slug'ı `sections.ts`'e; kapak `SUBJECTS`'e. Sabit
korpus sayıları 450 → **464**.

### `content/_runtime/seeds/sensor_readings.sql` *(yeni)*

475/477'nin `sql run` fence'leri için: `(device_id, ts)` üzerinde tekil kısıt,
birkaç yüz satır ölçüm, kasıtlı olarak **çoğaltılmış ve geç gelmiş** kayıtlar.
≤50 KB.

### `content/_verify/iot-telemetry-edge/475/` *(yeni)*

`proof`: naif retry'ın ölçümü çoğalttığı bir replay, sonra idempotency
anahtarının aynı replay'de çoğaltmayı kaldırışı. Sıfır bağımlılık, saf Node.
Determinizm: rastgele id yok, saat basılmaz, sıralama sabit.

### `content/_verify/iot-telemetry-edge/472/` *(yeni)*

`proof`: yayılma faktörüne göre hava süresi (time-on-air) ve %1 görev
döngüsünde günlük mesaj tavanı — LoRaWAN'ın kendi hesabı, saf aritmetik,
sıfır bağımlılık. Dersin sayıları böylece yazarın değil **koşunun** olur; bu,
okuyucunun bir müzakerede alıntılayacağı türden bir sayı olduğu için zorunlu.

### `scripts/stamp-verified.ts` *(değişiyor)* — `HARM_DENYLIST`

**Ders 478 listeye eklenir.** Sertifika sağlama, rotasyon ve iptal bir
**güvenlik mitigation'ı**; yol haritasının "üretime asla bırakılmaz" kalemi.
Denylist'e girince `verified` asla damgalanmaz, değişmez #3 gereği üstünde
hiçbir alıştırma açılmaz, ders yalnız okunur kalır.

**479 denylist'te değil** ve sınırı bilinçli: konfigürasyon dağıtımı, kademeli
yayım ve geri alma **mekaniği** anlatılır; **firmware imzalama ve güven zinciri
478'e bırakılır** ve 479 bunu bir cümleyle söyler. Bir OTA dersinin imzalamayı
geçiştirmesi kabul edilebilir değil — ama onu doğrulanmamış bir derste
öğretmek daha kötü.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 470 | `ts run` | MQTT topic eşleştirici (`+` ve `#`) — kusursuz saf fonksiyon |
| 472 | `ts run` + **`proof`** | Hava süresi ve görev döngüsü bütçesi; proof sayıyı üretir |
| 473 | `ts run` | Varint/delta kodlayıcı + bayt bütçesi, çıktı gerçek sayılar |
| 474 | `ts run` | Üç saat arasındaki kayma aritmetiği |
| 482 | `ts run` | Histerezis / ölü bant / debounce durum makinesi |
| 475 | **`sql run`** + **`proof`** | `ON CONFLICT DO NOTHING` ile tekilleştirme |
| 477 | `sql run` | Aralık bölümleme, rollup, saklama silmesi — gerçek Postgres |
| 480 | `sql run` | ThingsBoard'ın telemetri veri modelinin **eşdeğeri** düz Postgres'te — platformun sizin için ne yaptığını görmenin tek dürüst yolu |
| 469 | `mermaid` (1) | Cihaz→veritabanı yolu, kursun tek diyagramı |
| 471, 476, 479, 481 | **runtime yok** | QoS semantiği, telsiz davranışı, dağıtım, uç donanımı |
| **478** | **runtime yok** + denylist | Güvenlik; uzman pasosu bekler |

`mqttClient` `ASSUMED_CONTEXT`'te yok — her snippet kendi tipini bildirir.

**480 bir ürün turu değil.** ThingsBoard'ın ekranları anlatılmaz; öğretilen şey
**veri modeli ve devredilen sorumluluk**: cihaz/varlık ayrımı, telemetri ile
attribute farkı, kural motorunun ne olduğu — ve aynı şeyi düz Postgres'te
kurmanın maliyeti. P20'nin "al/yap" dersiyle (`#512`) aynı usul: karar
**veri modeli kriterleriyle** verilir, ürün özelliği listesiyle değil.

## Kaynak kuralı

- MQTT için **OASIS MQTT 5.0 spesifikasyonu** (ücretsiz, kalıcı URL, sürüm
  yazılı); 3.1.1 farkı gerektiğinde ikisi de anılır.
- LoRaWAN için **LoRa Alliance'ın yayımladığı spesifikasyon ve bölgesel
  parametreler** (RP002), sürüm ve yıl yazılı. **Bölgeye bağlı sınırlar
  (görev döngüsü, kanal planı) bölge adıyla birlikte yazılır** — "EU868'de %1"
  gibi; bölgesiz bir rakam yanlıştır.
- ThingsBoard için resmî dokümantasyon, **sürüm sabitlenerek**; sürüm damgasız
  özellik iddiası yazılmaz.
- CBOR/protobuf için RFC numarası.
- Donanım/telsiz iddiaları (menzil, pil ömrü) **rakam olarak yazılmaz** —
  okuyucunun kendi ölçmesi için hesap verilir; 472'nin hava süresi hesabı
  bunun örneği.

## Kabul kriterleri

- [x] 14 ders + manifest; `shape/*` sıfır bulgu
- [x] **13 ders damgalı, 478 damgasız.** `HARM_DENYLIST`'e eklendi
      (`stamp-verified.ts`), `verified-sha.json`'da girişi yok, manifest'inde
      `verified` anahtarı hiç yok. Denylist 16 → 17
- [x] 478'de **hiçbir `quiz`/`recall` fence'i yok** (ölçüldü: 0);
      `drill/widget-on-unverified-lesson` yine yalnız önceden var olan
      `114`'ü bildiriyor — 2 bulgu, ikisi de bu fazın dışından
- [x] 479 firmware imzalamayı 478'e devrettiğini **üç yerde** açıkça söylüyor:
      açılış paragrafı, Key Concepts, ve Common Mistakes'in son maddesi
- [x] `parseMistakes` bu 14 derste **0 `single`** madde raporluyor
- [x] `sensor_readings.sql` **3.866 bayt** (sınır 50 KB); 612 varış, 480 ayrı
      ölçüm, çoğaltmalar **sebebe göre** enjekte edildi (kayıp ack 72, ikinci
      gateway 48, store-and-forward 12). 475/477/480'in sekiz `sql run`
      fence'i de PGlite'ta gerçekten koşuldu
- [x] 472 ve 475'in `proof` blokları damgalı, sıfır bağımlılık, iki koşuda
      byte-aynı (sha karşılaştırıldı); `stamp-verify --check` 18/18 yeşil
- [x] **472'deki her duty cycle rakamı bölge adıyla yazılı.** Tek istisna,
      kuralın kendisini söyleyen cümle ("bölgesiz bir duty cycle hiçbir şey
      hakkında bir olgu değildir"). Hava süresi tablosunun tamamı — SF7'de
      62 ms, SF12'de 1.483 ms, ve %1'de SF12'nin 147 saniyelik zorunlu
      sessizliği — **proof tarafından hesaplandı**, yazılmadı
- [x] 480'de ThingsBoard ekran/özellik turu yok; ders üç ayrım üzerinden
      ilerliyor (device/asset, telemetry/attribute, rule engine'in devri) ve
      eşdeğerini düz Postgres'te kuruyor
- [x] 469/475/476/481 mevcut korpusa `(#4)`, `(#5)`, `(#7)`, `(#45)`, `(#56)`
      ile bağlı; `links/dead-lesson-ref` temiz
- [x] Üç sabit korpus sayısı 450 → **464**
- [x] `content:stats-check` "32 rows checked · 0 disagree"; snapshot +14 ders,
      0 unexplained
- [x] `git diff --exit-code -- content/_reports` temiz; `content:check`,
      `lint`, `concepts-check`, `verify-mermaid`, `build` (497 statik sayfa)
      yeşil

**Bir kabul kriteri karşılanamadı ve ertelendi.** Şartname 480'in `#512`'ye
`(#N)` ile bağlanmasını istiyor; ders 512 henüz yok (P20 üretecek) ve `(#512)`
yazmak `links/dead-lesson-ref`'in **error** olarak reddettiği şeydir. Bu, P16'da
`#511` ile aynı durum ve aynı şekilde çözüldü: 480 al/yap kararını "ürün
karşılaştırması değil, model kriterleri" diye nesirde kuruyor, sayısal ileri
referans yok, ve geri bağlantıyı P20 kendi tarafından ekler. Sessizce
işaretlemek yerine buraya yazıldı.

**Ölçülen bir yan etki.** Bu fazdan sonra `code/unverified-language` hâlâ 19
bulgu veriyor (10 `java` + 9 C#) — P17 hiç eklemedi. Kursun gerçek araçları
Python (`paho-mqtt`) olmasına rağmen **sıfır Python fence'i** yazıldı: her
mekanizma TS'e çevrilebildi, ve çevrilemeyen üç ders (471, 476, 481) runtime
yerine karar tipleri taşıyor. Kural amacına uygun çalıştı.

## Risk

| Risk | Azaltma |
|---|---|
| Güvenlik mitigation'ı (sertifika/rotasyon) doğrulanmadan yayımlanır | 478 `HARM_DENYLIST`'te; damgalanmaz, alıştırma açılmaz |
| OTA dersi imzalamayı geçiştirir | 479 sınırını açıkça beyan eder ve 478'e devreder |
| LoRaWAN rakamları bölgesiz yazılır ve yanlış olur | Her sınır bölge adıyla; hava süresi `proof` ile hesaplanır |
| ThingsBoard dersi ürün turuna döner ve eskir | Veri modeli öğretilir, ekran değil; sürüm damgalı; `#512` ile bağlı |
| Donanım rakamları uydurulur (menzil, pil) | Rakam yazılmaz; hesap verilir |
| Mevcut idempotency/retry derslerinin tekrarı olur | `(#N)` ile bağlanır; bu kurs kısıtın değiştiği yeri anlatır |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| NB-IoT / LTE-M / Sigfox | LoRaWAN'ın alternatifleri; kapsama, maliyet, güç ödünleşimi | kapsam — `#472` LPWAN kısıtını bir kez kuruyor; karşılaştırma `tradeoff` olarak eklenebilir |
| Zigbee / BLE mesh / Matter | Bina içi kısa menzil yığını | kapsam — `#469`'un yolu bunları da kapsıyor ama protokol detayı ayrı |
| OPC UA | Endüstriyel yığının fiilî standardı | bağımlılık — P21/`#514` OT sınırını kuruyor ve **denylist'te**; OPC UA dersi o pasodan sonra |
| MQTT ↔ Kafka köprüsü | Cihaz yığınının olay akışına bağlanması | kapsam — korpusta Kafka dersi (`#106`) var; köprü ikisini `(#N)` ile bağlayan tek ders olabilir |
| Sensör füzyonu ve Kalman filtresi | Birden çok sensörden tek tahmin | kapsam — matematik ağır; `ts run` ile gösterilebilir, ama kursun ekseni taşıma ve depolama |
| İstatistiksel anomali tespiti | `#482`'nin eşik tabanlı hâlinin ötesi | kapsam — `#482` histerezis/ölü bandı kuruyor; istatistiksel yöntem ayrı ders |
| Pil ve enerji bütçesi modellemesi | Cihazın sahada ne kadar yaşayacağı | kaynak — donanıma bağlı rakam yazılmaz; `calc` ile okuyucunun kendi rakamlarıyla yapılabilir |
