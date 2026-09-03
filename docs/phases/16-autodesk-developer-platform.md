# P16 — Autodesk geliştirici platformu: Revit API ve APS

**Efor:** ~7 gün · **Bağımlılık:** P14 (IFC kavramları, `spatial` widget)

## Neden

Yapılı çevre yazılımının fiilî geliştirici yüzeyi Autodesk'te ve bu korpusta
`Autodesk` kelimesi **hiç geçmiyor**. Ama "Autodesk geliştiriciliği" tek bir
şey değil; **üç ayrı çalışma kipi** ve karıştırılmaları en yaygın hata:

```
Revit API (masaüstü)     : Revit süreci içinde, C#/.NET, Transaction'lı, senkron
Design Automation (bulut): aynı Revit API, ekransız, iş kuyruğunda, dosya girdi/çıktı
APS (bulut servisleri)   : HTTP; Revit hiç çalışmıyor, çeviri çıktısı üzerinde
```

Bir geliştirici üçünü de aynı "Autodesk API" sanıp yanlış kipe kod yazıyor —
örneğin `FilteredElementCollector`'ı bir web isteğinden çağırmaya çalışıyor.
Kurs bu ayrımla açılır ve APS derslerinin tamamı üstüne oturur.

Kursun asıl riski içerik değil **çürüme**: vendor uç noktaları değişir. Bu
yüzden kurs uç nokta listesi değil kavram öğretir ve kendi oynaklık kaydını
taşır.

## Kapsam

**Kurs:** `autodesk-developer-platform` — "Autodesk Developer Platform: Revit API & APS"
**Ders:** 15 (14 + sonradan `#523`) · **id:** 455-468, 523 · **bracket:** `1-3` ×1, `3-7` ×11, `7-10` ×3

> *Description:* "Three ways to write Autodesk code — in Revit, without Revit,
> and about Revit — and the API churn you design against."

| id | Başlık | bracket |
|---|---|---|
| 455 | The Autodesk Developer Surface: Add-in, Headless, and Cloud | 1-3 |
| 456 | Revit's Object Model: Documents, Elements, Parameters, Transactions | 3-7 |
| 457 | Revit Add-ins: Commands, Applications, and the Add-in Manifest | 3-7 |
| 458 | FilteredElementCollector: Querying a Model Without Freezing Revit | 3-7 |
| 459 | Revit Parameters: Built-in, Shared, Project — and Which One Survives Export | 3-7 |
| 460 | Design Automation: The Revit API Without Revit on Your Desktop | 7-10 |
| 461 | APS OAuth: Two-Legged vs Three-Legged, Scopes, Token Lifetime | 3-7 |
| 462 | Buckets and the URN: Encoding an Object Id Correctly | 3-7 |
| 463 | Model Derivative: Translation Jobs, Polling, and the Manifest | 3-7 |
| 464 | Reading the Object Tree and Properties Out of a Derivative | 3-7 |
| 465 | The Viewer Is a Client of Your Data, Not the Source of Truth | 3-7 |
| 466 | Webhooks: Delivery, Retries, and Verifying What Arrived | 3-7 |
| 467 | Rate Limits and Quotas: Backoff Against Someone Else's API | 3-7 |
| 468 | Designing for Vendor API Churn: Pinning, Versions, Anti-Corruption Layer | 7-10 |
| 523 | Shipping a Design Automation Bundle: Versions, Aliases, and Rollback | 7-10 |

459 doğrudan P14'e bağlanır: Revit'in paylaşılan parametresi IFC'ye
`Pset_` olarak çıkıyor mu, çıkmıyorsa nerede kayboluyor — devir zincirinin
(`#511`) ilk halkası.

**"Forge Viewer" adı kullanılmaz.** Forge, APS'nin eski adı; 465 bugünkü adı
kullanır ve eski adı yalnız bir kez, arama yapan okuyucu için anar.

## Yapılacaklar

### `content/courses/autodesk-developer-platform/` *(yeni)*

14 ders + manifest. Dal slug'ı `sections.ts`'e; kapak `SUBJECTS`'e. Sabit
korpus sayıları 436 → **450**.

### Oynaklık kaydı

`content/_waivers.json`'ın süre-sonlu tasarımı taklit edilir: vendor'a bağlı
her iddia, **kontrol edildiği ay** ve **yeniden kontrol tarihi** ile bu faz
dosyasında tutulur. Süresi geçmiş bir satır, süresi geçmiş bir waiver gibi,
sonraki faz için açık bir iş kalemidir.

| İddia | Ders | Kontrol | Yeniden kontrol |
|---|---|---|---|
| APS'nin bugünkü adı APS; eski ad yalnız arama için anılıyor | 455, 465 | 2026-09 | 2027-03 |
| Revit API yalnız C#/VB.NET; `Revit 2025 API` sürümü | 456-460 | 2026-09 | 2027-03 |
| Design Automation üçlüsü: AppBundle / Activity / WorkItem; motor sürümü Activity'de sabitlenir | 460 | 2026-09 | 2027-03 |
| OAuth iki bacaklı (client credentials) ve üç bacaklı (authorization code); scope'lar ihraç anında sabitlenir | 461 | 2026-09 | 2027-03 |
| Nesne kimliği `urn:adsk.objects:os.object:<bucket>/<key>`; URN = padding'siz base64url | 462 | 2026-09 | 2027-03 |
| Manifest ağacı: `status` / `progress` / `derivatives[]` / `children[]` | 463 | 2026-09 | 2027-03 |
| Nesne ağacı + ayrı özellik dokümanı; özellik grupları kaynağın kendi grup adları (`Identity Data`, `Fire Protection`) | 464 | 2026-09 | 2027-03 |
| Viewer v7 çeviriyi render eden bir tarayıcı bileşeni | 465 | 2026-09 | 2027-03 |
| Webhook kaydı sistem + olay tipi + kapsam + callback URL; teslimat en-az-bir-kez | 466 | 2026-09 | 2027-03 |
| Hız sınırı sayısal değeri **yazılmadı** — 429 ve `Retry-After` mekanizması yazıldı | 467 | 2026-09 | 2027-03 |
| AppBundle zip'i tek bir `.bundle` klasörü; `PackageContents.xml` kökte, `.addin` ve assembly'ler `Contents/` altında | 523 | 2026-09 | 2027-03 |
| Nitelikli kimlik `owner.Name+alias`; alias tek bir sürüme işaret eder, Activity bundle'ı alias ile adlandırır | 523 | 2026-09 | 2027-03 |
| Nickname global tekil ve bir kez alınır; değiştirmek hesabın bütün bundle ve activity'lerini silmeyi gerektirir | 523 | 2026-09 | 2027-03 |

Son satır bilinçli: fazın kaynak kuralı "kota rakamı ders metninde olgu olarak
yazılmaz" diyor, ve bu tablonun en uzun ömürlü satırı hiçbir rakam
içermeyendir.

**Ders metnine gömülmez.** Ders sürümden bağımsız mekanizmayı anlatır; oynak
olan her şey ya bu tabloda ya 468'de.

### `content/_verify/autodesk-developer-platform/462/` *(yeni)*

`proof`: URN base64url kodlama — padding'li/padding'siz, `+/` ile `-_` farkı,
ve yanlış varyantın servisten aldığı hata biçimi. Saf Node, sıfır bağımlılık.
Ağ yok: kodlamanın kendisi determinist, dersin öğrettiği şey de o.

## C# fence'leri — açıkça kabul edilen bedel

Revit API **yalnız C#/VB.NET**. 456-460 arası beş ders C# fence'i taşımak
zorunda, ve bu korpusta iki şey doğru değil:

- **Hiçbir runtime çalıştıramaz.** ADR 0002 tarayıcıda yalnız JS ve WASM
  diyor; C# için Run düğmesi hiçbir zaman gelmeyecek.
- **`verify-code.ts` tiplemez.** `TS_LANGS` yalnız TS/TSX/JS; C# fence'i
  **sıfır** mekanik denetim görür.

Emsal var ve dürüstçe anılır: korpusta 10 `java` fence'i (Spring Boot) tam
olarak aynı durumda. Bu yüzden C# fence'leri **P14'ün `code/unverified-language`
kuralı tarafından `warn` ile bildirilir** ve kural bu fazda `error`'a terfi
**etmez** — korpus ondan temiz değil ve bu faz temizlemiyor.

Bunun karşılığında iki telafi zorunlu:

1. **Her C# fence'i en fazla ~15 satır** ve tek bir mekanizmayı gösterir —
   derlenmediği için uzun bir listing'in doğruluğu denetlenemez.
2. **Mekanizmanın kendisi TS'e çevrilebiliyorsa çevrilir.** 458'in asıl dersi
   (filtreyi daraltmadan koleksiyon gezmenin maliyeti) `ts run` ile ölçülebilir
   bir eleman sayısı üzerinde gösterilir; C# yalnız gerçek API çağrısının
   şeklini verir.

## Runtime haritası

| Ders | Ne alır | Neden |
|---|---|---|
| 458 | `ts run` (+ C# fence) | Filtre daraltmanın maliyeti sayı olarak; C# yalnız API şekli |
| 462 | `ts run` + **`proof`** | URN base64url kodla/çöz; proof yanlış varyantı görünür kılar |
| 463 | `ts run` | Satır içi bir JSON manifest yanıtı üzerinde gezinme |
| 467 | `ts run` | Token bucket simülasyonu |
| 523 | `ts run` | Yayın ile dağıtımın aynı şey olmadığı, aynı yayın geçmişi üzerinde sayılarak |
| 464 | **`spatial`** | Model Derivative nesne ağacı — widget'ın ikinci kursu |
| 461 | `mermaid` `sequenceDiagram` (1) | `verify-mermaid` bu tipi **tam** doğruluyor |
| 456, 457, 459, 460 | **runtime yok** (C# fence'li) | Revit süreci gerekiyor |
| 455, 465, 466, 468 | **runtime yok** | Ağ çağrısı ya da mimari |
| — | Revit için `proof` **yok** | CI'da Revit yok; Design Automation bir iş kuyruğu — determinist damga üretilemez |

**Her ağ çağrısı runtime'sızdır ve bu, eksiklik değil beyandır.** APS kodu
koşmayan ama **tipli** TS olarak yazılır ve `verify-code --strict`'ten geçer —
"çalışmıyor" ile "derlenmiyor" ayrımı korunur.

`apsClient` `ASSUMED_CONTEXT`'te yok; her TS snippet'i kendi tipini bildirir.

## Kaynak kuralı

- Further Reading **APS ve Revit API doküman indekslerine** bakar, derin uç
  nokta sayfasına **değil** — derin linkler vendor yeniden yapılandırdığında
  404'e döner ve dersi çürütür.
- Revit API sürümü **her zaman yazılır** (`Revit 2025 API`); sınıf/metot adları
  sürümler arasında taşınır.
- Her vendor'a bağlı iddia `(kontrol: YYYY-AA)` damgası taşır.
- Uç nokta yolu, kota rakamı, scope adı gibi oynak değerler ders metninde
  **olgu olarak yazılmaz**; mekanizma yazılır, güncel değer için resmî indekse
  yönlendirilir.

## Kabul kriterleri

- [x] 14 ders + manifest; `shape/*` sıfır bulgu; 14'ü de `stamp-verified.ts`
      ile damgalı
- [x] `parseMistakes` bu 14 derste **0 `single`** madde raporluyor
- [x] 455 üç çalışma kipini (add-in / headless / cloud) adıyla ayırıyor;
      456-468 arası her ders **"Mode: …"** ile ilk paragrafında kipini söylüyor
- [x] C# fence sayısı **9** (sınır 10), **en uzunu 15 satır** (sınır 15);
      `code/unverified-language` dokuzunu da `warn` ile bildiriyor ve kural
      `error`'a **terfi etmedi** — korpustaki 10 `java` fence'i duruyor, toplam
      19 bildirilen fence
- [x] 458'in ölçülebilir iddiası `ts run` ile gösteriliyor: 240.000 elemanlık
      bir modelde altı filtre sıralamasının hepsi ölçülüyor, en iyi ile en kötü
      arasında 1,93x, ve C# fence'i **hiçbir sayı taşımıyor**
- [x] 464'ün `spatial` fence'i `spatial/unanchored-reveal`'i geçiyor —
      `reveal` cümlesi ve `Identity Data` / `Fire Protection` grup adları
      dersin kendi nesrinde birebir geçiyor
- [x] 462'nin `proof` bloğu damgalı, sıfır bağımlılık, iki koşuda byte-aynı
      (sha kontrol edildi). İddiası ölçüm: 56 makul ASCII nesne kimliğinin
      **0'ı** `+` ya da `/` üretiyor, 41'i `=` üretiyor — yani ASCII adlarla
      kurulmuş bir test paketi alfabe farkını hiç denemiyor
- [x] 461'in tek `sequenceDiagram`'ı `verify-mermaid`'de **tam doğrulanan**
      sınıfta (UNVERIFIED listesinde yok)
- [x] Hiçbir derste `run` işareti C#/koşmayan bir fence'te yok — korpus
      genelinde çalıştırılamaz dilde `run` işaretli fence sayısı 0
- [x] `verify-code --strict` sıfır kusur; TS snippet'lerinin hepsi kendi
      tipini bildiriyor, `ASSUMED_CONTEXT` genişletilmedi
- [x] "Forge" adı yalnız 465'te, bir kez, eski ad olarak geçiyor
- [x] Oynaklık kaydı dolu — 10 satır, her biri kontrol ayı ve yeniden kontrol
      tarihiyle
- [x] Further Reading'de **derin uç nokta linki yok**; hepsi doküman indeksi ya
      da RFC, hepsi HEAD ile doğrulandı
- [x] 466/467 mevcut korpusa `(#4)`, `(#7)`, `(#8)` ile, 468 `(#9)` ve `(#65)`
      ile, 461 `(#37)` ile bağlı; `links/dead-lesson-ref` temiz
- [x] Üç sabit korpus sayısı 436 → **450**
- [x] `content:stats-check` "32 rows checked · 0 disagree"; snapshot +14 ders,
      0 unexplained
- [x] `git diff --exit-code -- content/_reports` temiz; `content:check`, `lint`,
      `build` yeşil

**Şartnamenin bir kabul kriteri karşılanamadı ve ertelendi.** "459 → `#511`"
bağlantısı yazılamaz: ders 511 henüz yok (P20 onu üretecek), ve `(#511)`
yazmak `links/dead-lesson-ref`'in **error** olarak reddettiği tam olarak o
şeydir. 459 bunun yerine devir zincirinin ilk halkası olduğunu nesirde
söylüyor ve P14'ün property set dersine (lesson 436) bağlanıyor; geri
bağlantıyı P20 kendi tarafından kurar. Kriteri sessizce işaretlemek yerine
buraya yazıldı.
## Risk

| Risk | Azaltma |
|---|---|
| **C# fence'leri hiçbir denetim görmez** — korpusun "her fence bir şey tarafından denetlenir" iddiasını 5 derste zayıflatır | Bedel açıkça kabul edilir ve `code/unverified-language` ile **mekanik olarak bildirilir**; fence'ler ≤15 satır ve ölçülebilir iddia taşımaz; ölçüm gereken yerde `ts run` devreye girer |
| Üç çalışma kipi karışır (asıl öğretim hatası) | 455 ayrımı kurar; her ders kipini ilk paragrafta söyler; kabul kriteri bunu zorunlu kılıyor |
| Vendor uç noktaları değişir, ders çürür | Kurs kavram öğretir; oynaklık kaydı + 468 (anti-corruption layer) + doküman indeksine link |
| Revit API sürüm farkları sessizce eskir | Her sınıf/metot adı sürümle yazılır (`Revit 2025 API`) |
| Kota/limit rakamı olgu olarak yazılır ve yanlışlanır | Rakam yazılmaz; mekanizma ve ölçme yolu yazılır |
| Kurs Revit'i olmayan okuyucu için ölü kalır | 455 + APS yarısı (461-468) Revit kurulumu istemiyor; Revit gerektiren 5 ders bunu başında söylüyor |

## Eklenebilecekler

Bu fazın kapsamı dışında bırakılan, ama doğal devamı olan adaylar. Her satır
**neden şimdi olmadığını** söylüyor. Üç sebep var ve karıştırılmamalı:
*kapsam* (sonra yapılabilir), *bağımlılık* (önce başka bir şey gerekiyor),
*doktrin* — sonuncusu ertelenmiş değil **reddedilmiş**tir ve `yasak` diye
işaretli. Kapsama alınan bir aday bu tablodan çıkar ve ders listesine girer.

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Navisworks ve clash otomasyonu | Koordinasyonun otomatikleştirilmesi | kapsam — ayrı bir ürün ve ayrı bir API; Revit yüzeyi önce oturmalı |
| AutoCAD .NET / Civil 3D API | Altyapı tarafının masaüstü API'si | kapsam — üçüncü bir masaüstü API, C# fence bütçesini (≤10) tek başına doldurur |
| Dynamo | Görsel programlama ile Revit otomasyonu | kitle — hedef okuyucu kod yazıyor; Dynamo'nun asıl kitlesi başka |
| ACC Issues / Submittals API | Şantiye iş akışlarının veri modeli | kapsam — `#468` vendor çürümesini kuruyor; ACC yüzeyi hızlı değişiyor, oynaklık kaydını şişirir |
| Viewer extension yazımı | Viewer'ı genişletmek | doktrin — `#465`'in tezi Viewer'ın **istemci** olduğu; extension dersi o tezi zayıflatır ve çalıştırılamaz |
| Revit → IFC dışa aktarım eşlemeleri | `#459`'un devamı: paylaşılan parametre IFC'de nereye düşüyor | bağımlılık — P14 ve `#459` birlikte okunduktan sonra anlamlı; en güçlü aday |

## Ek — `#523`, bu tablodan çıkan ilk aday (2026-09)

"Design Automation AppBundle paketleme" kapsama alındı, `Eklenebilecekler`'den
kaldırıldı ve ders listesine girdi. Ertelenme gerekçesi *"paketleme adım adım
kılavuz olur ve hızlı eskir"* idi; ders doğrudan o gerekçeye karşı yazıldı.
İçinde tek bir uç nokta yolu, istek gövdesi ya da tıklama sırası yok. Anlattığı
şey **dolaylılık**: sürüm ile alias iki ayrı işaretçi katmanı, `owner.Name+alias`
niteliğinde buluşuyorlar, ve dağıtım ile geri alma aynı hareketin iki yönü.
Bu yapı vendor'un uç nokta listesinden bağımsız — `#468`'in pinning argümanının
kursun kendi dağıtım hikâyesine uygulanmış hâli.

Kayda değer dört nokta:

- **Runtime `ts run`.** İddia sayılıyor, iddia edilmiyor: aynı üç yayınlık
  geçmişte, alias ayrı bir karar olarak taşındığında yayın kaynaklı üretim
  değişikliği **0**; alias yüklemeye bağlandığında **3**, hiçbiri ayrıca
  verilmiş bir karar değil. Geri alma maliyeti de aynı yerde ölçülüyor: alias'ı
  adlandıran activity'ler için 1 hareket, sürümü adlandıranlar için activity
  başına bir yeniden yazım.
- **C# fence bütçesi kımıldamadı (9/10).** Dersin gösterdiği dosya
  `PackageContents.xml`; korpusun tek `xml` fence'i olan `#457`'nin `.addin`
  manifestiyle aynı paketin iki parçası, ve ikisi de aynı kurgusal eklentiyi
  (`DepotTools`) anlatıyor.
- **id 523, bloğun bitişiği değil.** 469-522 aralığı P17-P21 şartnamelerinde
  rezerve; manifest sırası, `security`'nin 143'ünde olduğu gibi, sonradan
  yazılan dersi kursun sonuna koyar.
- **Korpus 485 → 486.** `docs/phases/README.md`'nin ölçülen tabloları yeniden
  ölçüldü (14 satır), `corpus-stats --check` yeşil.
