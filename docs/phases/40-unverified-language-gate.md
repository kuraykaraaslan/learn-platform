# P40 — Sayaç olarak doğan kural, kapı olmadan sayamıyor

**Efor:** ~1 gün · **Bağımlılık:** P16, P22 · **Sonrakiler:** yok

## Neden

`code/unverified-language` `warn` olarak doğdu ve korpusta bugün **19 bulgusu**
var. P22 bu kuralın `error`'a terfisini kendi `Eklenebilecekler` tablosuna
şöyle yazmıştı: *"bağımlılık — korpusta 10 `java` + P16'nın C# fence'leri
duruyor; kural yaratmadığı backlog'a takılamaz."*

O kayıt bir beklenti içeriyor: backlog temizlenecek ve kural terfi edecek.
Ölçüldü — **temizlenmeyecek**:

| Dil | Bulgu | Nerede | Neden kalıcı |
|---|---:|---|---|
| `csharp` | 9 | `autodesk-developer-platform` | Revit API'nin başka dili yok; P16 bunu bilerek getirdi ve kendi kabul kriterinde bütçeledi (≤10) |
| `java` | 10 | `framework-deep-dives` | Spring Boot derslerinde Java **konunun kendisi** |

İkisi de triyaj değil tasarım. Yani kural, kendi kayıtlarına göre süresiz
`warn` kalacak — ve asıl sorun bu değil.

**Asıl sorun kuralın kendi tarifinde yazılı.** Kural şöyle diyor:

> *"This is a COUNTER, not a ban... What the rule buys is that the unchecked
> fence count stays visible and bounded, instead of Python quietly arriving
> with the built-environment courses whose real tools (ifcopenshell, pyproj)
> are Python."*

Bugün bir Python fence'i eklense, 19 özdeş uyarının arasında **20.** olurdu.
Kural tam olarak engellemek için yazıldığı şeyi göremez hâlde. Sayaç,
kapısı olmadığı için saymayı bırakmış.

## Karar

Kural **hem sayaç hem kapı** olur:

- Korpusun **bilinçli olarak kabul ettiği** diller adlarıyla, kabul eden
  fazıyla ve gerekçesiyle bir listede durur; onlar `warn` kalır — sayaç
  görevini sürdürür.
- Listede **olmayan** her doğrulanamaz dil `error`'dır. Yeni bir Python, Go ya
  da Ruby fence'i sessizce gelemez; gelirse `--strict` kırılır ve listeye
  eklenmesi bilinçli, gözden geçirilebilir bir değişiklik olur.

Bu invariant #6'yı ("her lint kuralı `warn` doğar, korpus temizlenince
`error`'a terfi eder") çiğnemiyor, **tamamlıyor**: korpus bu kuraldan
temizlenemez, çünkü kalan iki dil kusur değil. Terfi edecek olan şey kuralın
tamamı değil, **kapsamıydı**.

### İkinci yarı — C# de sayılsın

Kuralın tarifi "visible and **bounded**" diyor. Bugün `java` fence sayısı
README'nin ölçülen tablosunda duruyor ve `corpus-stats --check` onu zorluyor:
11. bir java fence'i eklendiğinde stats kırılır ve README güncellenmeden
geçmez. **`csharp` için böyle bir satır yok.** Ekleniyor — böylece iki kabul
edilen dil de aynı görünürlükte oluyor.

## Yapılacaklar

- `scripts/content-lint/rules.ts` — `ACCEPTED_UNVERIFIED` listesi, bulgu
  başına severity
- `scripts/corpus-stats.ts` + `docs/phases/README.md` — `csharp` fence satırı
- `docs/phases/22-domain-closeout.md` — tüketilmiş aday satırı tablodan çıkar,
  `## Ek` ile kayda geçer (P27 konvansiyonu)

## Kabul kriterleri

- [x] Kabul edilen iki dil `warn` kalıyor; bulgu sayısı **19'da sabit** ve
      mesajları artık kabul gerekçesini taşıyor
- [x] Kabul edilmeyen bir dil **error** veriyor — `gis-spatial-data/441`'e
      bilerek bir `python` fence'i eklendi ve kural onu `--strict`'i kıracak
      bir hata olarak, ne yapılacağını söyleyen bir mesajla bildirdi; fence
      geri alındı
- [x] `csharp` fence satırı `corpus-stats`'ta ve README'nin ölçülen
      tablosunda (**9**); `--check` 33 → **34 satır**, 0 disagree. Artık
      onuncu bir C# fence'i de java gibi görünür bir değişiklik gerektiriyor
- [x] P22'nin aday satırı tablodan çıktı; `## Ek` bölümü backlog'un neden
      kalıcı olduğunu ve terfi edenin kuralın **kapsamı** olduğunu kaydediyor
- [x] `content:check` (341 test), `lint`, `stats-check`, `build` (654 sayfa)
      yeşil; ders metni değişmedi — `content/` altında yalnız lint raporları

## Risk

| Risk | Azaltma |
|---|---|
| Liste bir kaçış deliğine döner | Her giriş kabul eden fazı ve gerekçesi yazılı; eklemek görünür bir kod değişikliği |
| Kabul edilen dil sınırsız büyür | İkisi de README'nin ölçülen tablosunda; `corpus-stats --check` her artışı yakalar |
| Invariant #6 çiğnenmiş görünür | Şartname farkı yazıyor: terfi eden kuralın kapsamı, ve kalan iki dil kusur değil |
| Yeni bir dil meşruyken engellenir | Engellenmiyor — listeye bir satır ekleniyor, ve o satır gerekçe istiyor |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| C# fence'lerinin derlenmesi | Gerçek doğrulama | kaynak — CI'da .NET yok; P16 bunu kendi şartnamesinde zaten ölçtü |
| Java fence'lerinin derlenmesi | Aynısı | kaynak — aynı sebep |
| Dil başına sayısal bütçe (lint'te) | Artışın lint'te de yakalanması | kapsam — `corpus-stats --check` zaten yakalıyor; ikinci bir yerde tekrarlamak iki gerçek kaynağı olur |
