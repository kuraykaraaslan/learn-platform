# P3 — Kavram sözlüğü

**Efor:** ~2 gün · **Bağımlılık:** P0

## Neden

Korpus 412 derste aynı ~120 kavramı tekrar tekrar kullanıyor ama hiçbir yerde
tanımlamıyor. Okuyucu "idempotency key" ifadesini 27 derste görüyor; ilk
gördüğü yerde ne olduğunu öğrenmesinin yolu yok.

## Yapılacaklar

### `content/concepts.json` — küratörlü, üretilmemiş

```json
{
  "idempotency-key": {
    "term": "idempotency key",
    "aliases": ["idempotency keys", "idempotent key"],
    "short": "Bir isteği tekilleştirmek için istemcinin ürettiği ve sunucunun sakladığı anahtar; aynı anahtarla gelen ikinci istek yeni bir etki yaratmaz, ilkinin sonucunu döner.",
    "lesson": 7
  }
}
```

~120 terim. **Üretilmez, elle yazılır** — bir modelden "bu terimi tanımla"
istemek, korpusun kendi kullanımıyla çelişen bir tanım üretir.

### `modules/course_content/remark-concepts.ts`

`remarkGfm`'den sonra, `remarkLessonRefs`'ten önce girer.

**Yol haritasının uyarısı bağlayıcı** — "mavi çorba" riski gerçek:
- **Bölüm başına yalnız ilk geçiş** linklenir
- **Ders başına en fazla 4 link**
- Jenerik kelimeler denylist'te (`cache`, `token`, `queue`, `state`, `service` …)
- **Fence içinde asla** çalışmaz
- Terimin kendi dersinde link üretilmez (kendine link)

### `ui/ConceptTooltip.tsx` *(`'use client'`)*

`<button>` + `aria-describedby` — klavyeyle erişilebilir, dokunmatikte tıklamayla
açılır (hover-only bir tooltip mobilde erişilemez). `Escape` kapatır. Popover
`usePortal` + `positioning` ile — kui'de zaten var, yeniden yazılmaz.

Tanımın altında dersin kendisine link: "Tam ders → #7".

### `scripts/build-concepts.ts`

Kapsama raporu: hangi terim kaç derste linklendi, hangi terim hiç eşleşmedi
(yazım hatası göstergesi), hangi ders 4 link sınırına dayandı.
`content/_reports/concepts.json`.

## Kabul kriterleri

- [x] **125** terim (~120 hedefinin üstünde), hepsi elle yazılmış ve bir derse
      bağlı — `content/concepts.json`, korpusun kendi Key Concepts madde
      başlıklarından derlendi
- [x] Ders başına ≤4 link kuralı testle doğrulanıyor — `remark-concepts.test.ts`
      (10 test, `conceptLinkBudget` mekanizması), bölüm başına değil ders başına
      olduğu doğrulandı
- [x] Fence içinde link üretilmiyor — aynı test dosyasında kapsanıyor
- [x] Klavyeyle açılıp kapanıyor; `Escape` çalışıyor — `ConceptTooltip.test.ts` yeşil
- [x] Snapshot **değişti** — P3 ship edildiğinde beyan edildi, korpus o zamandan
      beri (P2 dahil) `concepts.json`'a yeni terim eklenmedi, mekanizma stabil
- [x] İlk yük JS bütçesi — orijinal ≤4 KB gz iddiası ship anında ölçülmüştü;
      `ConceptTooltip` bileşeni o zamandan beri değişmedi

## Denetim — 2026-09-02

Kapsama raporu (`npm run content:concepts`) o güne kadar manşetinde `0 never
matched` diyordu. O bir **yazım denetimi**: terimin metni ham markdown'da
geçiyor mu. Kapsamı ölçmüyordu, ve ölçünce çıkan sayı farklıydı: **125 terimin
17'si okura hiç link üretmiyordu.** Rapor bunu artık sebebe göre ayırıyor
(`own-lesson-only` / `code-only` / `shadowed` / `case-mismatch` / `cap-starved`),
çünkü yalnız bir kısmı kusur.

Ayırma iki **gerçek, okurun gördüğü** hatayı ortaya çıkardı:

| Hata | Etki | Düzeltme |
|---|---|---|
| `BASE` (ACID'in karşıtı) case-insensitive eşleşiyordu | sıradan İngilizce **"base"** kelimesini 18 derste sarıyordu — "base class", "base case", "base price" | `buildConceptIndex.resolve()`: tamamı büyük harfli varyant yalnız büyük harfle eşleşir |
| `database-sharding`'in "sharding" takma adı | ders 22'deki **domain sharding** (HTTP/1.1 tekniği) veritabanı sharding tanımını alıyordu, 3 link | `domain-sharding` kaydı eklendi; daha uzun ifade span'i kazanır |
| `pool-exhaustion` hiç bağlanmıyordu | `connection-pooling`'in "connection pool" takma adı "connection pool exhaustion"da `pool`'u yutuyordu | `"connection pool exhaustion"` takma adı — daha uzun, span'i kazanır |

Toplam link 442 → 415; kaybedilen 28'in **28'i de yanlıştı**, ve bir doğru link
kazanıldı (61'de `SLO`, `base` bütçedeki slotu bıraktığı için). Terim 125 → 126.

Kalan 18 hiç-bağlanmayan kayıt ölçüldü ve hepsinin doğru davrandığı görüldü: 12'si
yalnız kod içinde geçiyor (eklenti fence'e ve satır içi koda hiç girmez), 3'ü
yalnız kendi dersinde (self-link zaten yasak), 2'si büyük harfle hiç yazılmamış
kısaltma, 1'i (`index-bloat`, ders 104) 4-link bütçesinden düşüyor.

**Bütçe hakkında ölçülmüş bir not, karar değil:** bütçe *link* sayıyor, farklı
terim değil, ve eklenti tasarım gereği ilk geçişi bölüm başına bağlıyor — yani
iki bölüme yayılan bir terim dört slottan ikisini yer. Sınırdaki 48 dersin
**38'i** en az bir slotu okurun zaten gördüğü bir terime harcıyor (düzeltmeler
öncesi 50/40'tı; `base`'in 18 dersten çıkması ikisini de düşürdü). Bunu
değiştirmek sert görsel sınırı kapsamayla takas etmek olur; ölçüldü, karar
verilmedi.
