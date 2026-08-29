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
