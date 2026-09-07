# P28 — Telemetriden duruma: ölçülen sinyal ile bakım kararı arasındaki katman

**Efor:** ~6-7 gün · **Bağımlılık:** P17, P18, P20 · **Sonrakiler:** P22'nin yeniden ölçümü

## Neden

Korpusta iki uç var ve arası boş.

Bir uçta `#507` duruyor: bir varlığın **durum skoru**, yılda iki kez gelen bir
müfettişin yargısı, 1'den 5'e. Öbür uçta P17 ve P18 duruyor: aynı varlıktan
beş dakikada bir gelen telemetri, doğrulanmış, damgalanmış, saklanmış,
downsample edilmiş. İkisini birbirine bağlayan hiçbir ders yok — yani korpus
hem "durum" hem "telemetri" öğretiyor, ama **telemetriden duruma nasıl
gidileceğini** öğretmiyor.

Ölçüm, 34 kurs ve 544 ders üzerinde:

| Terim | Ders | Terim | Ders |
|---|---:|---|---:|
| `predictive maintenance` | **0** | `condition monitoring` | **0** |
| `remaining useful life` | **0** | `feature engineering` | **0** |
| `z-score` | **0** | `moving average` | **0** |
| `training data` | **0** | `seasonality` | 1 |
| `anomaly detection` | 1 | `rolling window` | 2 |

`baseline` (44 ders) ve `drift` (52 ders) yanıltıcıdır ve sayılmaz: ikisi de
başka anlamlarda kullanılıyor (config drift, ölçüm zemini). Kelime sayımı
burada yalnız yokluğu gösteriyor.

`#482` eşik üstü gürültüyü (histerezis, ölü bant) çözüyor ve orada duruyor —
kendi `Eklenebilecekler` tablosu *"istatistiksel yöntem ayrı ders"* diyor.
`#488` downsampling'in neyi yok ettiğini anlatıyor ama neyin **hesaplanacağını**
anlatmıyor. P20'nin tablosu *"kestirimci bakım için özellik mühendisliği"*ni
bağımlılıkla erteledi (P17 zaman serisi + P18 downsampling ön koşul); ikisi de
kapandı.

Bu kursun tehlikesi açık ve şartname onu baştan bağlıyor: konu, satıcıların
en çok abarttığı konudur. Bu yüzden kurs **bir ML dersi değil**, bir veri
dersidir; her iddia bir koşuyla ölçülür; ve `#570` doğrudan "ne
söyleyemeyeceğin" üzerine yazılır.

## Kapsam

**Kurs:** `condition-monitoring` — "Condition Monitoring from Telemetry"
**Ders:** 9 · **id:** 563-571 · **bracket:** `1-3` ×2, `3-7` ×7

> *Description:* "The layer between a reading and a maintenance decision:
> per-asset baselines, features over windows, statistics that survive
> outliers, and the labels you probably do not have."

| id | Başlık | bracket |
|---|---|---|
| 563 | From a Score to a Signal: What Telemetry Can and Cannot Say About Condition | 1-3 |
| 564 | Baselines: An Absolute Threshold Is a Guess About a Machine You Have Not Met | 3-7 |
| 565 | Features Over Windows: What the Window Length Decides | 3-7 |
| 566 | Robust Statistics: Why the Mean and the Standard Deviation Betray You | 3-7 |
| 567 | Seasonality Is Not an Anomaly: Comparing Like With Like | 3-7 |
| 568 | The Alert You Can Defend: From Indicator to a Work Order Somebody Accepts | 1-3 |
| 569 | Labels Come From Maintenance History, and You Probably Do Not Have Them | 3-7 |
| 570 | Remaining Useful Life: What You Can Compute and What You Must Not Claim | 3-7 |
| 571 | The Monitor That Decays: Re-Baselining After Maintenance | 3-7 |

**564 ve 567 ayrı, çünkü ikisi de "zemin" kelimesini kullanıyor ve farklı
şeyi kastediyor.** 564 **varlık başına** zemindir (bu makine normalde ne
yapar); 567 **zaman içindeki döngüdür** (bu makine salı 09:00'da ne yapar).
Tek derste birleşirse okuyucu global bir ortalamayla ikisini birden çözdüğünü
sanır — ki bu tam olarak yapılan hata.

**569 kursun dürüstlük dersidir.** Etiketsiz veriyle kestirim yapılamayacağı,
ve etiketin `#508`'in bakım geçmişinde olduğu — ama orada da çoğu zaman
olmadığı. `#508`'in anti-join'i burada ikinci kez, başka bir soruyu yanıtlamak
için kullanılır.

Çapraz bağ: 563 `#507`'ye, 564 `#534`'e, 565 `#488` ve `#481`'e, 566 `#482`'ye,
567 `#477`'ye, 568 `#482` ve `#508`'e, 569 `#508` ve `#511`'e, 570 `#512`'ye,
571 `#534` ve `#507`'ye bağlanır.

### Üç sınır beyanı

1. **`#507` müfettiş skorunu sahiplenir, 563 sensör göstergesini.** Kurs
   `#507`'nin 1-5 skorunu yeniden tanımlamaz; onun **yanına** ne
   koyulabileceğini ve neyin koyulamayacağını anlatır.
2. **`#482` eşik ve histerezisi sahiplenir, 566 istatistiği.** 568 ikisini
   birleştirir ama `#482`'nin ölü bant / histerezis mekaniğini tekrar etmez.
3. **Bu bir makine öğrenmesi kursu değildir.** Model eğitimi, kütüphane
   seçimi, hiperparametre yazılmaz. Kurs bir eşiğin, bir pencerenin ve bir
   etiketin veri tarafını kurar; model kurmak isteyen okuyucu `#569`'da neden
   henüz veri toplamadığını öğrenir.

## Yapılacaklar

### `content/courses/condition-monitoring/` *(yeni)*

9 ders + manifest. Dal slug'ı `sections.ts`'e — **`asset-management-systems`
ile `smart-infrastructure` arasına**, çünkü `#507`/`#508` ön koşul ve
`#517`-`#521` sonra geliyor. Kapak `SUBJECTS`'e. Sabit korpus sayıları
544 → **553**.

### `content/_runtime/seeds/condition_history.sql` *(yeni)*

Kursun `sql run` fence'leri için. `sensor_readings.sql` bu iş için kurulmadı —
o seed `#475`'in tekrar (duplicate) sorusuna aittir. İki tablo:

- `asset_telemetry(asset_id, measured_at, vibration_mm_s, motor_temp_c)` —
  dört varlık, saatlik, sabit aritmetikle üretilir (`generate_series` +
  `sin`), `random()` **yok**. Dört varlığın her biri bir öğretim vakası:
  sağlıklı + günlük döngü; yavaş bozulan; bakımdan sonra zemini değişen;
  ara sıra tek noktalık sıçrama üreten.
- `maintenance_event(asset_id, occurred_at, kind)` — 569'un etiket sorusu ve
  571'in yeniden-zeminleme tetiği. Bilinçli olarak **eksik**: bir varlığın
  arızası kayıtta yok, çünkü dersin iddiası tam olarak budur.

≤50 KB. Sapma `sensor_readings.sql`'in usulüyle **adlandırılmış nedenle**
enjekte edilir.

### `content/_verify/condition-monitoring/566/` *(yeni)*

`proof`: aynı seride, enjekte edilen aykırı değer sayısı 0'dan 5'e çıkarılırken
iki yöntemin **sayarak** karşılaştırılması — 3σ kuralı ile düzeltilmiş z-skoru
(medyan + MAD). Maskeleme (masking) böylece anlatılmaz, **sayılır**: aykırı
değerler standart sapmayı kendileri şişirdiği için 3σ kuralının kaç tanesini
kaçırdığı çıktıda durur. Sıfır bağımlılık, saf aritmetik, sabit sıralama.

### `scripts/stamp-verified.ts` — **değişmiyor**

Denylist dersi yok. 9 dersin 9'u damgalanır, her biri `quiz` + `recall` taşır.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 563 | `mermaid` (1) | Ham okuma → özellik → gösterge → karar, ve `#508`'ten geri gelen etiket okuyu. **Kursun tek diyagramı** |
| 564 | **`sql run`** (yeni seed) | Varlık başına zemin ile filo geneli eşiğin aynı veride farklı cevap vermesi |
| 565 | **`sql run`** | Pencere uzunluğunun aynı seriden farklı gösterge üretmesi |
| 566 | `ts run` + **`proof`** | Ortalama/σ ile medyan/MAD; `proof` maskelemeyi sayar |
| 567 | **`sql run`** | Aynı saat geçen hafta ile global ortalama: hangisi alarm üretiyor |
| 568 | `calc` | Yanlış alarm ile kaçırılan arıza maliyetinin eşiğe göre dengesi — dört işlem |
| 569 | **`sql run`** | `#508`'in anti-join'i, bu kez "etiket yok" sorusunu yanıtlıyor |
| 570 | `ts run` | Doğrusal eğilim ve onun **belirsizliği**; nerede sayı verilir, nerede verilmez |
| 571 | `tradeoff` | Bakımdan sonra zemini sıfırla ile eski zemini koru |

Her ders `quiz` + `recall` taşır — istisna yok.

## Kaynak kuralı

Bu kursun tek büyük riski **satıcı iddiası**. Kural P24'ünkinden türetilir:

- Hiçbir doğruluk, kazanç ya da "arızayı N gün önce haber verir" rakamı
  yazılmaz. Her sayı bir `sql run` / `ts run` / `proof` **koşusunun**
  çıktısıdır.
- İstatistik iddiaları (MAD'in 0.6745 ölçek çarpanı, 3σ kuralının kapsadığı
  oran) ya bir kaynakla ya da koşuyla verilir; ezberden yazılmaz.
- Ürün ve kütüphane adı geçmez. Bu, `#480`'in usulünün en katı hâli: bu alanda
  ürün adı vermek, ürünün iddiasını da taşımak demektir.
- "Kestirimci bakım" ifadesi kursun kendi nesrinde **iddia olarak**
  kullanılmaz; `#570` neyin kestirilebilir olduğunu ve neyin olmadığını ayırır.

## Kabul kriterleri

- [x] 9 ders (563-571) + manifest; `shape/*` sıfır bulgu — kursta **0 lint bulgusu**
- [x] 9 ders damgalı, `HARM_DENYLIST` 20'de değişmedi; her derste `quiz` + `recall`
- [x] Üç sınır beyanı nesirde: 563 → *"Lesson 507 keeps the inspector's score"*
      ve *"this is not a machine-learning course"*; 566 → *"This is not a
      replacement for Lesson 482"*; 569 → etiketsiz neyin kurulabileceği
- [x] `condition_history.sql` **4.394 bayt**, `random()` yok, dört varlığın her
      biri adlandırılmış bir vaka; `maintenance_event` bilinçli eksik —
      **bozulan varlık AHU-02'nin hiçbir kaydı yok** ve `#569`'un anti-join'i
      tam onu buluyor
- [x] `566` proof'u damgalı (`proof` 28 → 29), sıfır bağımlılık, iki koşuda
      md5-aynı. Maskeleme **sayıldı**: 3σ kuralı üç aykırı değere kadar hepsini
      buluyor, dörtte **hiçbirini**; medyan/MAD altısını da buluyor. Standart
      sapma 0.223 → 1.546'ya çıkıyor, veri gerçekte hiç yayılmadan
- [x] Sekiz `sql run` fence'inin sekizi de PGlite'ta koşuldu ve nesirdeki her
      sayıyı üretti: filo eşiği (3,5 mm/s) bozulan varlığı **hiç görmüyor**,
      iki sağlıklıyı işaretliyor; varlık-başı zemin AHU-02'yi +0,364 ile
      buluyor; haftalık döngü **1,060 mm/s**, yani aranan arızanın 2,9 katı;
      profil-göreli kalıntıda sağlıklı 0,057'ye karşı bozulan 0,496
- [x] Hiçbir doğruluk/kazanç rakamı yok; ürün ve kütüphane adı yok
- [x] `parseMistakes`: korpus geneli `single` **141'de sabit**
- [x] `links/dead-lesson-ref` temiz (`#61`'in slug'ı düzeltildi: `alerting-design`)
- [x] Üç sabit test sayısı **544 → 553**
- [x] **P26'nın kuralı doğuşta karşılandı**: kurs `asset-management-systems`,
      `iot-telemetry-edge` ve `digital-twin-engineering`'ten bağ alıyor —
      **3 kurs**. Sözlük 154 → **159**, `shadowed` 0, `case-mismatch` 0,
      `cap-starved` 2'de sabit; 9 yeni link render, **0 kayıp**
- [x] `content:check` (309 test), `lint`, `concepts-check`, `stats-check`
      (32 rows · 0 disagree), `build` (**604 sayfa**) yeşil; arama indeksi
      **84.573 B gz** / 98.304. `snapshot-diff`: 4 explained (bağ eklenen
      dersler) + 5 unexplained, hepsi yeni sözlük terimlerinin render ettiği
      linkler — P26'da kurulan kazanç/kayıp karşılaştırmasıyla doğrulandı

## Risk

| Risk | Azaltma |
|---|---|
| Kurs bir ML dersine döner | Model/kütüphane/hiperparametre yasak; 569 veri tarafında duruyor |
| Satıcı iddiası tekrarlanır | Rakam yasağı; her sayı koşudan; ürün adı yok |
| `#482` tekrarı olur | 566 istatistiği, `#482` eşik mekaniğini sahiplenir; 568 ikisini bağlar ama tekrar etmez |
| `#507` ile çakışır | 563 sınırı beyan eder: müfettiş skoru `#507`'nin, sensör göstergesi bu kursun |
| Seed büyür ya da rastgeleleşir | `generate_series` + sabit aritmetik; `random()` yok; ≤50 KB |
| 570 bir kâhinlik dersine döner | Ders doğrudan "ne söylenmez" üzerine yazılır; belirsizlik hesaplanır |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Sensör füzyonu ve Kalman filtresi | Çok sensörden tek tahmin | kapsam — P17 ve P24'ün tablolarında zaten duruyor; 566 tek kanalı kuruyor |
| Titreşim analizi (FFT, kestirim bantları) | Dönen ekipmanın asıl yöntemi | kapsam — frekans alanı ayrı bir matematik ve ayrı bir ders; 565 zaman alanını kuruyor |
| FMEA ve arıza modu kataloğu | Neyin izleneceğine karar verme | kapsam — P20'nin tablosundaki kalem; `#507` kritikliği kuruyor |
| Gerçek bir model eğitimi (regresyon/sınıflandırma) | Kestirimin kendisi | bağımlılık — `#569` etiket yokluğunu kuruyor; etiket olmadan model dersi yazmak dürüst değil |
| Yedek parça ve stok politikası | Kararın tedarik tarafı | kapsam — P20'nin tablosundaki kalem, bu fazın teması sinyal |
| Enerji imzası ile durum izleme | Akımdan mekanik duruma | kapsam — `#537` enerjiyi, 565 pencereyi kuruyor; üçüncü ders ikisinden sonra |
