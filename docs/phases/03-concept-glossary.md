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

- [ ] ~120 terim, hepsi elle yazılmış ve bir derse bağlı
- [ ] Ders başına ≤4 link kuralı testle doğrulanıyor
- [ ] Fence içinde link üretilmiyor (test)
- [ ] Klavyeyle açılıp kapanıyor; `Escape` çalışıyor
- [ ] Snapshot **değişir** — bu beklenen bir render değişikliği, commit'te beyan edilir
- [ ] Ders sayfası ilk yük JS'i ≤4 KB gz arttı
