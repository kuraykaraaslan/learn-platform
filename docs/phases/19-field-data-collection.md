# P19 — Saha veri toplama

**Efor:** ~5 gün · **Bağımlılık:** P15 (koordinatlar), P18 (iç mekân grafiği) · **Sonrakiler:** P21

## Neden

Saha uygulaması, korpusun hiç ele almadığı bir kısıt altında çalışır: **ağ
yok, ve ne zaman geleceği bilinmiyor.** Bu, "offline desteği ekleyelim"
cümlesiyle geçiştirilen bir özellik değil; kuyruğun kendisi üründür ve
uygulamanın veri modeli ona göre kurulur.

İkinci kısıt koordinatın kendisi: telefonun verdiği nokta bir **ölçüm**, bir
olgu değil. Doğruluğu değişken, ve "±3 m" ifadesi çoğu geliştiricinin
sandığından farklı bir şey söylüyor. P15 koordinatın referans sistemini
öğretti; bu kurs onun **güvenilirliğini** öğretir.

## Kapsam

**Kurs:** `field-data-collection` — "Field Data Collection"
**Ders:** 10 · **id:** 494-503 · **bracket:** `1-3` ×2, `3-7` ×6, `7-10` ×2

> *Description:* "Capturing data where there is no network: offline queues,
> client-generated ids, GPS you cannot trust, and sync that does not duplicate."

| id | Başlık | bracket |
|---|---|---|
| 494 | Offline-First Capture: The Queue Is the Product | 1-3 |
| 495 | Client-Generated Ids and Idempotent Submission | 3-7 |
| 496 | Conflict Resolution for Field Edits: LWW, Version Vectors, Manual Merge | 7-10 |
| 497 | GPS Accuracy: Horizontal Error, Fix Quality, and When to Reject a Point | 3-7 |
| 498 | Indoor Positioning: What to Do When GPS Stops Working | 3-7 |
| 499 | Coordinates From a Phone: DMS, Decimal Degrees, and EXIF GPS | 1-3 |
| 500 | Photo Evidence: Hashing, Deduplication, and Metadata You Must Not Trust | 3-7 |
| 501 | Form Schemas That Survive a Version Change in the Field | 3-7 |
| 502 | Sync Windows, Partial Uploads, and Resumable Transfer | 3-7 |
| 503 | Validating Field Data Against the Model It Describes | 7-10 |

**497 ve 498 bir çift.** 497 açık gökyüzünde doğruluğun ne demek olduğunu
kurar; 498 binanın içine girildiğinde o mekanizmanın **çalışmayı bıraktığını**
ve yerine ne konduğunu (bilinen nokta taraması, ölü hesap, P18'in rota
grafiğine tutunma) anlatır. Saha uygulamasının çoğu zamanını bina içinde
geçirdiği düşünülürse, 497 tek başına yanıltıcı olurdu.

495 mevcut idempotency dersine (`#7`), 499 P15'in eksen sırası dersine
(`#442`), 498 P18'in rota grafiğine (`#489`), 503 P14'ün mekânsal
hiyerarşisine `(#N)` ile bağlanır.

## Yapılacaklar

### `content/courses/field-data-collection/` *(yeni)*

10 ders + manifest. Dal slug'ı, kapak, sabit korpus sayıları 475 → **485**.

### `content/_runtime/seeds/field_submissions.sql` *(yeni)*

495/502/503 için: istemci üretimli id taşıyan gönderim tablosu, kasıtlı
tekrarlar ve yarım kalmış yüklemelerle. ≤50 KB.

### `content/_verify/field-data-collection/495/` *(yeni)*

`proof`: çevrimdışı kuyruğun replay'i — naif yeniden deneme kaydı çoğaltıyor,
istemci üretimli id + `ON CONFLICT` çoğaltmayı kaldırıyor. Saf Node, sıfır
bağımlılık, sabit sıralama, saat basılmıyor.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 495 | `ts run` + **`proof`** | İstemci id üretimi ve idempotent gönderim |
| 496 | `ts run` | LWW vs sürüm vektörü — aynı düzenleme dizisi, iki farklı sonuç |
| 497 | `ts run` | Doğruluk süzgeci: yatay hata ve fix kalitesine göre nokta reddi |
| 498 | `ts run` | Ölü hesap (dead reckoning) adım entegrasyonu ve hatanın birikmesi |
| 499 | `ts run` | DMS → ondalık derece; EXIF GPS alanlarının ayrıştırılması |
| 495, 502, 503 | `sql run` | `ON CONFLICT` ile senkron tabloları; doğrulama join'leri |
| 494 | `mermaid` (1) | Yakalama → kuyruk → senkron yolu |
| 500, 501, 502 | **runtime yok** (kısmen) | Cihaz metaverisi, şema göçü, taşıma katmanı |

`ts run` kuralları burada da bağlayıcı: import yok, `console.*` var, tsc temiz.
497'nin "±3 m" tartışması **sayı ezberletmez** — okuyucunun kendi cihazının
bildirdiği doğruluk alanını okuyup yorumlamasını sağlar.

## Kaynak kuralı

- GNSS/GPS doğruluğu için **resmî kaynak** (GPS.gov performans standardı gibi),
  ücretsiz ve kalıcı; sürüm/yıl yazılır.
- EXIF için standardın numarası ve sürümü.
- **Cihaza özgü doğruluk rakamı yazılmaz** — telefon modeline, uyduya, gökyüzü
  görüşüne bağlı; okuyucuya kendi ölçümünü okuma yolu verilir.
- Fotoğraf/kanıt zinciri hukuki bir iddiaya dönüşmez: 487 **teknik** bir ders
  (hash, dedupe, güvenilmez metaveri), delil hukuku dersi değil.

## Kabul kriterleri

- [ ] 10 ders + manifest; `shape/*` sıfır bulgu; 10'u da damgalı
- [ ] `parseMistakes` bu 10 derste **0 `single`** madde raporluyor
- [ ] `field_submissions.sql` ≤50 KB; `sql run` fence'leri PGlite'ta koşuyor
- [ ] 495'in `proof` bloğu damgalı, sıfır bağımlılık, iki koşuda byte-aynı
- [ ] 497'de cihaza özgü doğruluk rakamı **yok**; okuma/ölçme yolu var
- [ ] 498, iç mekânda GPS'in çalışmadığını nesirde açıkça söylüyor ve
      `#489`'a `(#N)` ile bağlı
- [ ] 495/498/499/503 `(#N)` ile bağlı; `links/dead-lesson-ref` temiz
- [ ] Üç sabit korpus sayısı 475 → **485**
- [ ] `content:stats-check` "0 disagree"; snapshot +10 ders, %100 EXPLAINED
- [ ] `git diff --exit-code -- content/_reports` temiz; `content:check` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| GPS doğruluğu rakamı olgu olarak yazılır | Rakam yazılmaz; cihazın bildirdiği alanı okuma yolu verilir |
| 500 delil/hukuk iddiasına kayar | Ders teknik sınırda tutulur: hash, dedupe, güvenilmez metaveri; hukuki sonuç çıkarılmaz |
| Mevcut idempotency dersinin tekrarı | `(#7)` ile bağlanır; bu kurs **kuyruğun günlerce dolduğu** hâli anlatır |
| Çakışma çözümü teoriye kaçar | 496 aynı düzenleme dizisini iki stratejiyle koşturur; fark çıktı olarak görünür |
| İç mekân konumlandırma abartılı doğruluk vaat eder | 498 hatanın **biriktiğini** `ts run` ile gösterir; mutlak doğruluk rakamı vermez |
