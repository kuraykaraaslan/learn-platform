# P29 — Sahadaki nesneyi tanımak: etiket, kod, ve doğru varlığa yazmak

**Efor:** ~5-6 gün · **Bağımlılık:** P19, P20 · **Sonrakiler:** P22'nin yeniden ölçümü

## Neden

Bu faz P19'un `Eklenebilecekler` tablosunda **"en güçlü aday"** diye
işaretlenmiş tek kalan adaydan geliyor: *"Barkod / QR / RFID varlık tanıma —
sahada doğru varlığa yazma; okuma hataları ve kontrol basamağı."* Gerekçesi
bağımlılıktı — *"P20/`#506` kimliği kuruyor; sahadaki okuma tarafı doğal
eşi"* — ve P20 kapandı.

Boşluk ölçüldü, 35 kurs ve 553 ders üzerinde:

| Terim | Ders | Terim | Ders |
|---|---:|---|---:|
| `barcode` | **0** | `RFID` | **0** |
| `check digit` | **0** | `NFC` | **0** |
| `label printing` | **0** | `QR code` | 1 |
| `asset tag` | 7 | | |

`asset tag` 7 derste geçiyor ve **hepsi kayıt tarafında**: `#506` kimliği
kuruyor, `#504` kütüğü, `#511` devri. Yani korpus bir varlığın **kaydını**
ayrıntısıyla anlatıyor ve o kaydın önündeki **fiziksel nesneye** nasıl
bağlandığını hiç anlatmıyor. `#494` sahada çevrimdışı yakalamayı kuruyor ama
teknisyenin **doğru varlığı** seçtiğini varsayıyor.

Boşluğun adı budur: kütükteki satır ile önündeki nesne arasındaki bağ. O bağ
bir etiket, bir kod ve bir okuma; üçü de bozulur ve üçünün de bozulma biçimi
farklıdır. Yanlış varlığa yazılmış bir kayıt, hiç yazılmamış bir kayıttan
**kötüdür**: eksik veri boşluk olarak görünür, yanlış veri doğru görünür.

## Kapsam

**Kurs:** `asset-identification` — "Asset Identification in the Field"
**Ders:** 9 · **id:** 572-580 · **bracket:** `1-3` ×3, `3-7` ×6

> *Description:* "The link between a row in the register and the object in
> front of you: what goes on a tag, how a mistyped code fails loudly, reading
> when the network is gone, and catching the scan that quietly went to the
> wrong asset."

| id | Başlık | bracket |
|---|---|---|
| 572 | The Wrong Asset Problem: A Register Row Is Not the Object in Front of You | 1-3 |
| 573 | What Goes on the Tag: An Identifier, Not a Payload | 3-7 |
| 574 | Check Digits: Making a Mistyped Identifier Fail Loudly | 3-7 |
| 575 | Symbologies: 1D, 2D, and What Actually Fits on the Tag | 3-7 |
| 576 | RFID and NFC: When the Tag Does Not Have to Be Seen | 3-7 |
| 577 | The Scan That Fails and the Scan That Lies | 1-3 |
| 578 | Offline Resolution: The Scanner That Cannot Ask | 3-7 |
| 579 | Finding the Mis-Scan After the Fact | 3-7 |
| 580 | Tag Lifecycle: Re-Tagging, and the Tag That Outlives the Asset | 1-3 |

**577 ve 579 ayrı, çünkü biri anlık biri sonradan.** 577 okuma anında
yapılabilecek denetimleri kurar (önek, konum makullüğü, son bilinen durum);
579 hiçbiri yakalamadığında veride kalan izi arar. Tek derste birleşirse
okuyucu ilkini yaptığında ikincisine gerek kalmadığını sanır — ki tam tersi.

**573 kursun tez dersidir.** Etikete kimlik yazılır, veri yazılmaz. Bir URL
bir bağlanım (coupling) kararıdır ve etiket URL şemasından uzun yaşar.

Çapraz bağ: 572 `#506` ve `#494`'e, 573 `#515`'e, 574 `#500`'e, 576 `#536`'ya,
577 `#503`'e, 578 `#494` ve `#504`'e, 579 `#508` ve `#569`'a, 580 `#506` ve
`#515`'e bağlanır.

### İki sınır beyanı

1. **`#506` kimliğin kendisini sahiplenir, 573 o kimliğin taşıyıcısını.**
   Kurs işlevsel konum (functional location) şemasını yeniden tasarlamaz;
   `#506`'nın kurduğu kimliğin bir etikete nasıl konulacağını anlatır.
2. **`#503` gelen kaydın doğrulanmasını sahiplenir, 577 okuma anını.** 577
   tarayıcıda yapılabilecek denetimleri kurar; sunucu tarafı doğrulama
   `#503`'ün konusudur ve orada kalır.

## Yapılacaklar

### `content/courses/asset-identification/` *(yeni)*

9 ders + manifest. Dal slug'ı `sections.ts`'e — **`asset-management-systems`
ile `condition-monitoring` arasına**, çünkü `#494` (P19) ve `#506` (P20) ön
koşul ve ikisi de önünde olmalı. Kapak `SUBJECTS`'e. Sabit korpus sayıları
553 → **562**.

### Seed — **yeni seed yok**

578 ve 579 mevcut `asset_register` seed'ini kullanır. Seed'in etiketleri bu
ders için birebir uygun: `FAN-B2-01` ile `FAN-B2-02`, seri numaraları
`SN-FAN-7741` ile `SN-FAN-7742` — yakın-eşleşme hatasının gerçek biçimi.
Yeni seed eklemek yüzeyi büyütür ve gerekmiyor.

### `content/_verify/asset-identification/574/` *(yeni)*

`proof`: kontrol basamağı şemalarının **sayarak** karşılaştırılması. Bir
kimlik aralığındaki bütün tek-basamak hataları ve bütün komşu-basamak yer
değiştirmeleri üretilir; her şemanın kaçını yakaladığı sayılır. Dersin
"transpozisyonu yakalar / yakalamaz" iddiası böylece yazarın değil koşunun
sonucu olur. Sıfır bağımlılık, saf aritmetik, sabit sıralama.

### `scripts/stamp-verified.ts` — **değişmiyor**

Denylist dersi yok. 9 dersin 9'u damgalanır, her biri `quiz` + `recall` taşır.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 572 | `mermaid` (1) | Kütük satırı → etiket → kod → okuma → kayıt; ve bağın koptuğu dört yer. **Kursun tek diyagramı** |
| 573 | `tradeoff` | Çıplak kimlik ile çözülebilir URL |
| 574 | `ts run` + **`proof`** | Şemaların kendisi; `proof` hata sınıflarını sayar |
| 575 | `calc` | Modül boyutu, yazıcı çözünürlüğü ve etiket alanı — dört işlem |
| 576 | `ts run` | Anti-collision: birden çok etiket aynı anda cevap verince ne olur |
| 577 | `ts run` | Okuma anındaki dört denetim, bir dizi tarama üzerinde |
| 578 | **`sql run`** (`asset_register`) | Yerel katalogda çözme; bilinmeyen kod ve bayat katalog |
| 579 | **`sql run`** (`asset_register`) | Sonradan iz: aynı güne düşen imkânsız kayıtlar |
| 580 | `md` checklist | Yeniden etiketleme prosedürü |

Her ders `quiz` + `recall` taşır — istisna yok.

## Kaynak kuralı

- Simgeleme (symbology) iddiaları numaralı standarda dayanır: **ISO/IEC 18004**
  (QR), **ISO/IEC 16022** (Data Matrix), **ISO/IEC 15417** (Code 128),
  **ISO/IEC 18000** serisi (RFID hava arayüzü). Standart metni alıntılanmaz
  (ücretli); numara, sürüm ve neyin tanımlandığı yazılır.
- **Menzil, okuma hızı ve kapasite rakamı yazılmaz** — menzil bir etiket
  özelliği değil sistem özelliğidir (okuyucu gücü, anten, ortam). Rakam yerine
  ya standart atfı ya bir `calc` koşusu.
- Ürün adı yok: tarayıcı, yazıcı, etiket üreticisi ya da kütüphane önerilmez.
- Kontrol basamağı iddiaları (`hangi hata sınıfı yakalanır`) **yalnız** 574'ün
  `proof` koşusundan gelir.

## Kabul kriterleri

- [x] 9 ders (572-580) + manifest; `shape/*` sıfır bulgu — kursta **0 lint bulgusu**
- [x] 9 ders damgalı, `HARM_DENYLIST` 20'de değişmedi; her derste `quiz` + `recall`
- [x] İki sınır beyanı nesirde: 572 → *"Lesson 506 owns the identity"*;
      577 → *"server-side validation of a submitted record is Lesson 503's,
      and it is not a substitute"*
- [x] **Yeni seed yok.** 578'in iki ve 579'un iki `sql run` fence'i mevcut
      `asset_register` seed'ini kullanıyor ve dördü de PGlite'ta koşuldu:
      578'in kapsam dilimi 8 satır, çözümleme dört taramanın üç ayrı sonucunu
      üretiyor (çözüldü / kapsam dışı gerçek varlık / bilinmeyen kod);
      579 **5 karıştırılabilir çift** buluyor ve bunlardan birinin aynı
      ziyarette aynı müfettiş tarafından kaydedildiğini gösteriyor
- [x] `574` proof'u damgalı (`proof` 29 → 30), sıfır bağımlılık, iki koşuda
      md5-aynı. Sayılar: her üç şema da tek-basamak hatalarının **%100**'ünü
      yakalıyor; yer değiştirmede düz toplam yükün içindeki **3.700 hatanın
      0'ını**, Luhn 4.600'ün 4.440'ını (%96,5), mod-97 hepsini yakalıyor.
      **İlk yazdığım Luhn hatalıydı** — kontrol basamağını yanlış konumda
      ikiye katlıyordu ve %91 veriyordu; koşu bunu gösterdi ve düzeltildi
- [x] Menzil / kapasite rakamı yok; ürün adı yok; standartlar numarayla anılıyor
      (ISO/IEC 18004, 16022, 15417, 18000-3, 18000-63, 7064, 7812-1)
- [x] `parseMistakes`: korpus geneli `single` **141'de sabit**
- [x] `links/dead-lesson-ref` temiz; çapraz bağlar gerçek slug'a çözülüyor
- [x] Üç sabit test sayısı **553 → 562**
- [x] **P26'nın kuralı doğuşta karşılandı**: kurs `asset-management-systems`,
      `field-data-collection` ve `smart-infrastructure`'dan bağ alıyor —
      **3 kurs**. Sözlük 159 → **164**, `shadowed` 0, `case-mismatch` 0,
      `cap-starved` 2 → **1**; 11 yeni link render, **0 kayıp**
- [x] `content:check` (309 test), `lint`, `concepts-check`, `verify-mermaid`
      (30 fence, 0 failed), `stats-check` (32 rows · 0 disagree),
      `snapshot-diff` (**0 unexplained**), `build` (**614 sayfa**) yeşil;
      arama indeksi **85.722 B gz** / 98.304

## Risk

| Risk | Azaltma |
|---|---|
| Kurs bir donanım/satın alma kılavuzuna döner | Yazılım kararları eksen: kodlama, kontrol basamağı, çözümleme, tespit. Yazıcı/tarayıcı önerisi yok |
| Menzil ve kapasite rakamı uydurulur | Rakam yasağı; menzil sistem özelliği olarak anlatılır |
| `#506` tekrarı olur | Sınır beyanı: kimlik `#506`'nın, taşıyıcı 573'ün |
| `#503` tekrarı olur | 577 okuma anı, `#503` sunucu tarafı; sınır beyan edilir |
| 574 bir matematik dersine döner | Şemalar anlatılmaz, **karşılaştırılır**; proof hata sınıflarını sayar |
| Yeni seed yüzeyi büyütür | Seed eklenmiyor; `asset_register` yeniden kullanılıyor |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Etiket dayanıklılığı ve malzeme seçimi | Etiketin sahada kaç yıl okunur kaldığı | kapsam — `#538`'in muhafaza dersinin usulü; ayrı bir malzeme dersi |
| Görüntüden varlık tanıma (OCR / plaka okuma) | Etiketsiz varlığı tanımak | kapsam — görüntü işleme ayrı bir alan ve dalın dışında |
| Konum tabanlı tanıma (BLE beacon, UWB) | Etikete bakmadan hangi odadasın | bağımlılık — `#489` iç mekân grafını kuruyor; konumlama ayrı ders |
| Ses ve video kanıt | Fotoğrafın ötesinde kanıt tipleri | kapsam — P19'un tablosundaki kalem, bu fazın teması kimlik |
| Etiket basımı ve iş akışı | Etiketin fiziksel üretimi | kapsam — 575 kodu ve boyutu kuruyor; üretim ve stok ayrı |
| GS1 / EPC kimlik şemaları | Küresel benzersiz ürün kimliği | kaynak — GS1 spesifikasyonu lisanslı ve tedarik zinciri odaklı; varlık kütüğüne çevirisi ayrı ders |
