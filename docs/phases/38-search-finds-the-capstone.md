# P38 — Arama capstone'u bulsun, cheat sheet'i bulmasın

**Efor:** ~1 gün · **Bağımlılık:** P12 (arama), P33, P34 · **Sonrakiler:** yok

## Neden

Son üç faz ürüne iki yeni sayfa türü ekledi: 36 cheat sheet (P33) ve 2
capstone (P34). Ölçüm: arama indeksinde **562 kayıt, hepsi ders**;
`capstone` kelimesi **0 kez**, `cheatsheet` **0 kez** geçiyor.

Yani bir okuyucu ⌘K açıp "idempotency" yazdığında dersi buluyor, ama o dersin
ölçüldüğü capstone'u bulamıyor. İki sayfa üründe var ve aramada yok.

**Ama ikisi aynı kategoride değil ve bu fazın asıl kararı bu.**

## İki sayfa türü, iki karar

### Cheat sheet — **indekslenmiyor**

P33'ün birebir sözleşmesi gereği bir cheat sheet'teki her satır, dersinin
kendi sayfasındaki metnin aynısı; tek kelime eklemiyor. Onu indekslemek her
sonucu **ikizler**: aynı sorgu hem dersi hem de o dersi tekrar eden sayfayı
döndürür, ve okuyucu ikisinden hangisinin kaynak olduğunu ayırt etmek zorunda
kalır.

Bir aramanın işi ayrı sayfa saymak değil, **ayrı bilgi** bulmak. Cheat sheet
ayrı bilgi taşımıyor — bu onun özelliği, kusuru değil.

### Capstone — **indeksleniyor**

Capstone'un brief'i, deliverable'ı ve rubric'inin `looks_like` metinleri
korpusta **başka hiçbir yerde bulunmuyor**. Ayrıca aranmayı en çok hak eden
kısım rubric satırlarının lead'leri — ki onlar zaten aramanın **en yüksek
ağırlıklı alanı** olan mistake lead'lerinin ta kendisi (P36'dan beri
doğrulanmış derslerden birebir alıntı).

Sonuç şu: "idempotency" araması artık hem dersi hem de o dersin maddesiyle
ölçülen capstone'u getiriyor. İkisi farklı işler — biri anlatıyor, öteki
ölçüyor.

## Mekanizma — sıfır UI değişikliği

Arama sonucu `href`'ini `/courses/${courseSlug}/${lessonSlug}` olarak kuruyor
(`SearchLauncher.tsx`). Capstone rotası da tam olarak
`/courses/<slug>/capstone`. Yani kayıt `lessonSlug: 'capstone'` taşıdığında
bağlantı **kendiliğinden doğru** oluyor: `SearchRecord`'a alan eklenmiyor,
istemci kodu değişmiyor, tip değişmiyor.

Bu bir tesadüf değil, rotanın kendi şeklinin sonucu — ve kayda geçiyor ki
ileride biri "capstone kayıtları neden `kind` alanı taşımıyor" diye sormasın.

| Alan | Ders kaydı | Capstone kaydı |
|---|---|---|
| `courseSlug` | kurs | aynı |
| `lessonSlug` | dersin slug'ı | **`capstone`** |
| `courseTitle` | kurs başlığı | aynı |
| `title` | ders başlığı | **`Capstone — <başlık>`** |
| `mistakes` | Common Mistakes lead'leri | **rubric lead'leri** |

## Bütçe

Arama indeksinin `MAX_INDEX_GZ_BYTES` sınırı 98.304 B ve P29'dan beri
85.722 B gz'de duruyor. İki capstone kaydı ölçülüp README'ye yazılıyor;
sınır değişmiyor.

## Yapılacaklar

- `scripts/build-search-index.ts` — capstone kayıtları
- `scripts/build-search-index.test.ts` ya da mevcut test dosyası — üç iddia
- `docs/phases/README.md` — bütçe satırı

## Kabul kriterleri

- [x] Capstone kaydı yalnız `capstone.md` taşıyan iki kurs için var; test
      indeksteki kurs listesiyle `hasCapstone` listesini karşılaştırıyor
- [x] Kaydın `lessonSlug`'ı `capstone`; test rotanın dosyada var olduğunu da
      doğruluyor, yani href boşluğa gitmiyor
- [x] `mistakes` alanı rubric lead'lerini birebir taşıyor — ve P36'dan beri
      onlar zaten doğrulanmış derslerin Common Mistakes lead'leri, yani
      "idempotency" araması hem dersi hem onu ölçen capstone'u getiriyor
- [x] Cheat sheet indekste **yok**; test hem `lessonSlug`'ı hem başlığı
      kontrol ediyor
- [x] `SearchRecord` tipi ve `SearchLauncher.tsx` **değişmedi** — rotanın
      şekli (`/courses/<slug>/capstone`) mevcut kayıt biçimine zaten uyuyor
- [x] İndeks 562 → **564 kayıt**, 85.722 → **85.833 B gz**: iki capstone
      **111 bayt** ekledi, sınır 98.304'te ve marj ~12 KB
- [x] Ders metni değişmedi (`git diff content/courses/` boş);
      `content:check` (**49 dosya, 341 test** — 5'i bu fazın), `lint`,
      `stats-check`, `build` (653 sayfa) yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Cheat sheet de indekslenir ve sonuçlar ikizlenir | Karar ve gerekçesi şartnamede; test yokluğunu doğruluyor |
| Capstone kaydı olmayan bir kursa href üretilir | Kayıtlar `hasCapstone` üzerinden; test eşleşmeyi doğruluyor |
| `SearchRecord`'a alan eklenir ve istemci büyür | Rota şekli sayesinde gerekmiyor; kayda geçti |
| İndeks bütçesi sessizce aşılır | `MAX_INDEX_GZ_BYTES` zaten build'de zorlanıyor; yeni boyut ölçülüyor |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Path'lerin indekslenmesi | Beş path'in blurb'ü aranabilir olur | bağımlılık — path rotası `/paths/<id>`, `/courses/...` değil; `SearchRecord`'a bir href alanı ve istemcide bir dallanma gerektirir. Path'ler zaten `/paths` sayfasından bulunuyor |
| Capstone brief/deliverable metninin indekslenmesi | Daha geniş eşleşme | kapsam — bugün başlık + rubric lead'leri indeksleniyor; gövde metni bütçeyi ölçülmeden büyütür |
| Sonuç türünün UI'da işaretlenmesi ("capstone" rozeti) | Okuyucu ne açtığını görür | kapsam — başlık zaten "Capstone — " ile başlıyor; rozet ayrı bir UI kararı |
