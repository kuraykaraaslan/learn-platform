# P33 — Course cheat sheet: türetilen, yazılmayan tek sayfa

**Efor:** ~2 gün · **Bağımlılık:** P1 (`parseMistakes`), P0 (bölüm şekli) · **Sonrakiler:** yok

## Neden

Bu faz da yol haritasından geliyor —
[`../investigate/04-roadmap.md`](../investigate/04-roadmap.md)'nin Tier 3
kalemi **"Course Pack + cheat sheet"**. Şartı da orada yazılı ve fazın
tamamını belirliyor:

> *"Cheat sheet seçimi **mekanik kuralla** yapılmalı (Key Concepts + mistake
> lead'leri, `parseMistakes`'i yeniden kullanarak), asla yeniden özetleyen bir
> AI geçişiyle değil."*

Bugün korpusun okuyucuya verebileceği hiçbir **taşınabilir** şey yok. 36 kurs,
562 ders, beş path, arama, tekrar kuyruğu — hepsi ekranda ve hepsi oturum
içinde. Bir dersi bitiren okuyucunun elinde kalan şey tarayıcı geçmişi.

Bir de ölçülmüş bir yan kazanç var. Korpusta **çıplak alan adı** olarak duran
kaynaklar ekranda gri metin; baskıda görünmez olurlar. Yol haritası bunun
için tek satırlık çözümü zaten yazmış:
`a[href^="http"]::after { content: " (" attr(href) ")" }`.

### Ölçülüp kusur çıkmayan bir şey

Bu fazı seçmeden önce başka bir şey ölçüldü: **hiç widget'ı ve çalıştırılabilir
fence'i olmayan ders sayısı — 562'nin 155'i (%27).** Bu bir kusur değil ve
düzeltilmiyor. P1'in drill mekanizması fence gerektirmiyor: Common Mistakes
maddelerinden alıştırma üretiyor ve korpusta **552 dersin** en az bir
drill'lenebilir maddesi var. Etkileşim tabanı zaten yüksek; 155 sayısı
fence sayıyor, yüzey değil. Kayda geçiyor ki altı ay sonra "155 derse widget
ekleyelim" diye açılmasın.

## Kapsam

**Yeni içerik yok. Tek satır ders metni yazılmıyor.** Sayfa tamamen mevcut
derslerden türetiliyor.

### Türetme kuralı

Kurs başına, ders sırasıyla, her ders için:

1. **Başlık** — manifest'ten, olduğu gibi.
2. **Key Concepts madde işaretleri** — `## Key Concepts` bölümünden, olduğu gibi.
3. **Common Mistakes lead'leri** — `parseMistakes(...).lead`, olduğu gibi.

Üçü de **birebir kopya**. Yeniden yazma yok, kısaltma yok, özetleme yok. Bu
bir üslup tercihi değil, **testle korunan bir sözleşme**: `cheatsheet`
testinin bir maddesi, sayfaya çıkan her dizgenin dersin kendi markdown'ında
birebir bulunduğunu doğruluyor. Bir gün biri "biraz toparlayalım" derse test
kırılır.

Bir maddenin `bodyHtml`'i **alınmaz** — yalnız `lead`. Cheat sheet'in işi
hatırlatmak, yeniden anlatmak değil; ve `lead` P2'nin bütün fazı boyunca tam
bu iş için biçimlendirildi.

### Boyut

Yol haritasının uyarısı: `content-seo-personal-brand` 43 ders ≈ 45 bin kelime,
*"ya sayfalayın ya highlight class'larını atın"*. Bu uyarı **tam metin** için
geçerliydi; cheat sheet tam metin değil — ders başına birkaç madde. Yine de
ölçülür ve bir sınır konur: `MAX_CHEATSHEET_BYTES`, arama indeksinin
`MAX_INDEX_GZ_BYTES`'ıyla aynı usulde, testle korunur.

### Rota ve baskı

- `app/courses/[courseSlug]/cheatsheet/page.tsx` — kurs başına statik sayfa,
  `generateStaticParams` mevcut kurs listesinden.
- `CheatSheetPage` **sunucu bileşeni**; tek istemci parçası `window.print()`
  çağıran küçük bir düğme.
- `@media print` bloğu: kenar çubuğu ve gezinme gizlenir, renkler baskıya
  uygun hâle gelir, ve yol haritasının `attr(href)` satırı çıplak linkleri
  görünür kılar.
- Kurs sayfasından bir bağlantı; ders sayfasından **yok** (ders okurken
  cheat sheet'e gitmek okuma akışını bölüyor).

## Yapılacaklar

- `modules/course_content/course_content.cheatsheet.ts` *(yeni)* — türetme
- `course_content.mistakes.ts` — `splitBulletItems` dışa açılır (Key Concepts
  aynı kuralla bölünmeli; ikinci bir bölücü kaçınılmaz olarak ayrışır)
- `modules/course_content/ui/CheatSheetPage.tsx` *(yeni)* — sunucu bileşeni
- `modules/course_content/ui/PrintButton.tsx` *(yeni)* — istemci, tek düğme
- `app/courses/[courseSlug]/cheatsheet/page.tsx` *(yeni)*
- `app/globals.css` — `@media print` bloğu
- `ui/CourseOverviewPage.tsx` — bağlantı
- `course_content.cheatsheet.test.ts` *(yeni)* — birebir sözleşmesi + boyut

## Kabul kriterleri

- [x] Kurs başına bir cheat sheet sayfası; `build` **651 statik sayfa**
      üretiyor (615 + 36 kurs)
- [x] **Birebir sözleşmesi testle korunuyor**: 562 dersin tamamı üzerinde,
      sayfaya çıkan her dizgenin dersin kendi markdown'ında bulunduğu
      doğrulandı — boşluk normalize edilerek, çünkü `splitBulletItems` satır
      sonlarını tek boşlukla birleştiriyor
- [x] `parseMistakes` yeniden kullanılıyor; `splitBulletItems` tek bölücü
      olarak `mistakes` modülünden dışa açıldı
- [x] `bodyHtml` kullanılmıyor — ayrı bir test dosyanın metninde o adın
      geçmediğini doğruluyor
- [x] Ölçüldü: en büyük sayfa **`content-seo-personal-brand` 80.520 bayt**,
      `MAX_CHEATSHEET_BYTES` **98.304**. Test hem sınırı hem de ilk çarpacak
      kursun adını sabitliyor, yani ileride bir büyüme okunabilir bir hatayla
      geliyor
- [x] `@media print` bloğu var, tamamı `@media print` içine kapalı (ekranda
      tek piksel değişmiyor) ve `a[href^="http"]::after` çıplak adresleri basıyor
- [x] `CheatSheetPage`'de `'use client'` yok; tek istemci parçası
      `PrintButton` ve tek işi `window.print()`
- [x] Yeni ders yok, ders metni değişmedi — korpus **562'de**,
      `parse-snapshot.json` **hiç kımıldamadı** (`git diff --stat` boş)
- [x] `content:check` (**47 dosya, 325 test** — 5'i bu fazın), `lint`,
      `stats-check` (33 rows · 0 disagree), `build` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Cheat sheet bir özet üretimine dönüşür | Birebir sözleşmesi testle korunuyor; yeniden yazma testi kırar |
| İki bölücü ayrışır | `splitBulletItems` tek kaynak, `mistakes`'ten dışa açılıyor |
| Sayfa devasa olur | Ölçülür ve `MAX_CHEATSHEET_BYTES` ile sınırlanır |
| Baskıda linkler kaybolur | Yol haritasının `attr(href)` satırı |
| Ders metni değişir | Bu faz hiçbir `content/courses/**` dosyasına dokunmuyor; snapshot kımıldamamalı |
| Tamamlanma hissi yaratır | Sayfada tik, yüzde, ilerleme yok — değişmez #4 |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Path başına cheat sheet | Beş path'in kendi tek sayfası | kapsam — kurs sayfası önce oturmalı; path'ler kurslardan ders topluyor ve tekrar üretir |
| Markdown / PDF dışa aktarma | Dosya olarak taşınabilirlik | kapsam — baskı zaten PDF veriyor; ikinci bir üretici ayrı bir bakım yüzeyi |
| Cheat sheet'e `numbers` satırları | P31/P32'nin tablolarının taşınabilir hâli | kapsam — türetme kuralı bugün Key Concepts + lead; üçüncü kaynak ayrı bir karar |
| Ders sayfasından bağlantı | Erişilebilirlik | doktrin — okuma akışını bölüyor; kurs sayfası doğru yer |
