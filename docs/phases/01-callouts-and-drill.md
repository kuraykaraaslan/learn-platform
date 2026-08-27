# P1 — Callout'lar + Failure Drill + `verified` kapısı

**Efor:** ~3 gün · **Bağımlılık:** P0 · **Sonrakiler:** P2, P6, P11, P12

## Neden

Yol haritasının teşhisi: *"412 dersin 412'sinde okuyucudan üretmesi istenen tek
bir şey yok."* Bu faz iki mekanizma getiriyor:

- **Callout** — nesri gezinilebilir kılar, **sıfır client JS**, 412/412 ders.
- **Failure Drill** — mevcut Common Mistakes maddelerini *tahmin et → aç*
  mekanizmasına çevirir. "errorHandler'ı router'lardan önce kaydetme" cümlesini
  okumak tahmin hatası üretmez; sadece lead'i gösterip "ne kırılır?" diye sormak
  taahhüt yaratır.

Ayrıca **`verified` kapısı** burada kurulur — sonraki her alıştırma fazının
dayandığı emniyet mekanizması.

## Zemin — ölçüldü

```
Common Mistakes maddesi : 1746
  bold-dash   370  ← "- **lead** — body"
  bold-colon  200  ← "- **lead**: body"
  bold-space    9
  plain-dash  126  ← "- lead — body"
  single     1041  ← tek cümle, ayrıştırılamıyor
drill'lenebilir : 705 (%40,4)

>=1 drill'lenebilir maddesi olan ders : 215
sıfır olan                           : 197
>=2 olan (kartın açılma eşiği)       : 159

Common Mistakes içinde iç içe madde : 0
Common Mistakes içinde fence        : 0   → satır seviyesi bölme güvenli
```

> **Dürüst beyan:** bu faz **412 dersi değil, 215 dersi** kapsar. 412'ye çıkmak
> P2'nin içerik geçişini gerektirir. Yol haritasının "1.771 üretim anı" ifadesi
> ham madde sayısıdır, ayrıştırılabilir madde sayısı değil.

## Yapılacaklar

### 1. `modules/course_content/remark-callouts.ts` *(yeni)*

GFM alert sözdizimi bugün **desteklenmiyor** — doğrulandı:
`> [!NOTE]\n> Bu bir not.` çıktısı `<blockquote><p>[!NOTE]\nBu bir not.</p></blockquote>`,
yani işaret okuyucuya düz metin olarak görünüyor. Korpusta yalnız 45 derste
blockquote var, yani namespace pratikte boş.

`remarkGfm`'den sonra girer; ilk çocuğu `[!KIND]` ile başlayan bir blockquote'u
`<aside data-callout="kind">`'a çevirir, işaret satırını düşürür.

Türler: `NOTE` · `TIP` · `WARNING` · `CAUTION` · **`PITFALL`** (bu korpusa özel —
Common Mistakes'in satır içi karşılığı).

Render `PROSE_CLASSES`'a eklenen `[&_aside]` seçicileriyle yapılır — **sıfır
client JS**, tema token'ları (`--warning`, `--info`) üzerinden light/dark uyumlu.

> Bu bir **render değişikliğidir**, ama korpusta bugün `[!KIND]` kullanan ders
> **yok**, dolayısıyla snapshot kımıldamaz. Kural: callout kullanan ilk ders
> yazılana kadar snapshot sabit kalır; o ders yazıldığında değişim beklenen bir
> içerik değişikliğidir.

### 2. `modules/course_content/course_content.mistakes.ts` *(yeni)*

`parser.ts` tek amaçlı kalsın diye ayrı dosya.

```ts
export type LessonMistake = {
  id: string;        // `${lessonSlug}#m${index}` — kararlı localStorage anahtarı
  lead: string;      // düz metin, ** soyulmuş
  bodyHtml: string;  // markdownToHtml(body) — satır içi code ve (#41) linkleri korunur
  form: 'bold-dash' | 'bold-colon' | 'bold-space' | 'plain-dash' | 'single';
};

export function parseMistakes(commonMistakesMarkdown: string): LessonMistake[];
```

Girdi **`splitLessonSections`'ın ham markdown'ı**, HTML değil. Öncelik sırası:

```
/^\*\*(?<lead>[^*]+)\*\*\s*[—–-]\s*(?<body>.+)$/    → bold-dash    370
/^\*\*(?<lead>[^*]+)\*\*\s*:\s*(?<body>.+)$/        → bold-colon   200
/^\*\*(?<lead>[^*]+)\*\*\s+(?<body>.+)$/            → bold-space     9
/^(?<lead>[^—–]{12,120}?)\s+[—–]\s+(?<body>.+)$/    → plain-dash   126
aksi hâlde                                          → single      1041
```

**`sections.commonMistakes` yerinde kalır.** `parseMistakes` tamamen ektir;
snapshot etkilenmez, hiçbir şey kırılmaz.

### 3. `modules/course_content/ui/FailureDrillCard.tsx` *(`'use client'`)*

Common Mistakes kartının **yerine** geçer, ama **yalnız** şu üçü sağlanınca:

```ts
lesson.interactive !== 'off'
  && lesson.verified === true
  && mistakes.filter(m => m.form !== 'single').length >= 2
```

Aksi hâlde bugünkü `LessonSectionCard`'a düşer — hiçbir şey kırılmaz ve
**doğrulanmamış içerikte drill açılmaz**.

- Her drill'lenebilir madde: `lead` bir `<button aria-expanded>`, üzerinde
  "Ne kırılır?"; gövde tıklanana kadar gizli.
- Belirgin **"Hepsini aç"** kaçış kapısı; tercih ders bazında hatırlanır
  (yol haritasının açık şartı).
- `single` formundaki maddeler bir ayırıcının altında **dürüst düz liste** —
  sahte düğme yok.
- Madde başına öz-değerlendirme: *Biliyordum / Yarım / Kaçırdım*. Arayüz yalnız
  "bunu geçen sefer Kaçırdım işaretledin" der. **Streak yok, yüzde yok, rozet
  yok, ders seviyesinde tamamlanma yok.**
- `prefers-reduced-motion` gözetilir; gövde `role="region"`.

`LessonPage.tsx` **tek satır** değişir.

### 4. `modules/progress/` *(yeni — reponun ilk zustand import'u)*

`progress.store.ts`, `useHydrated.ts`, `quota.ts`.
Özet:
- Tek persist store, `name: 'learn:v1'`, `version: 1`, `migrate()` ilk günden.
- Anahtar: `learn:v1:<kind>:<courseSlug>/<lessonFile>#<blockId>`.
- **Hydration guard tek yerde** (`useHydrated.ts`) — Next 15 SSR uyuşmazlığını
  her bileşen ayrı ayrı yanlış yapmasın.
- `progress.store.test.ts` üst seviye anahtar kümesini birebir doğrular;
  `completed` eklemek CI'ı kırar.

### 5. Manifest şeması — **önce şema, sonra veri**

`course_content.manifest.ts`'teki Zod `.strict()`, bilinmeyen anahtarda build'i
düşürür. Önce iki opsiyonel anahtar eklenir (yol haritasının "eklenen her anahtar
412 dosyanın doldurması gereken bir anahtardır" uyarısı gereği sadece iki):

```ts
verified: z.boolean().optional(),
interactive: z.enum(['off', 'drill', 'full']).optional(),
```

### 6. `scripts/stamp-verified.ts` *(yeni)* — durma kuralının mekanikleşmesi

`verified`'ı **yalnız bu script yazar.** Şartlar:
1. O dosya için sıfır `error` seviyesinde content-lint bulgusu
2. `code-verification.json`'da sıfır tolere-edilmeyen defekt
3. Dosya T1.7'nin zararlı listesinde **değil**

Script ayrıca ders gövdesinin `verifiedSha`'sını yazar. Gövde kayarsa
`verify/stale-stamp` build'i kırar. **Bir insanın elle bir dersi "verified"
yapması mümkün değildir.**

### 7. Yeni lint kuralları

| Kural | Sev | Yakaladığı |
|---|---|---|
| `drill/unverified-lesson` | error | `verified` damgası olmadan `interactive` açık |
| `verify/stale-stamp` | error | gövde `verifiedSha`'dan kaymış |

## Pilot

T1.7'nin 12 zararlı dersi + 6 altın ders — **içerikleri düzeltildikten sonra,
önce değil.** Yol haritasının gerekçesi bağlayıcı: *"Yanlış bir mitigation'ı
okutmak kötüdür; okuyucuya onu tahmin ettirmek ve doğrulamak, o hatayı kalıcı bir
inanca çevirir."*

## Kabul kriterleri

- [ ] `npm run content:check` yeşil, snapshot kımıldamadı
- [ ] `parseMistakes` 1746 maddede çalışıyor; 705'i drill'lenebilir sınıflanıyor
- [ ] `verified` olmayan derste drill **açılmıyor**, bugünkü kart görünüyor
- [ ] `single` maddeler düz liste, düğme değil
- [ ] "Hepsini aç" tercihi sayfa yenilenince hatırlanıyor
- [ ] `stamp-verified.ts` elle düzenlenmiş bir `verified`'ı reddediyor
- [ ] `progress.store.test.ts` `completed` eklemeye karşı koruyor
- [ ] `> [!WARNING]` callout kartı olarak render oluyor, düz metin değil
- [ ] Klavyeyle gezinilebiliyor; `aria-expanded` doğru

## Riskler

| Risk | Azaltma |
|---|---|
| Drill doğrulanmamış derste açılır | Üçlü koşul + `drill/unverified-lesson` (error) |
| Kapsam abartılır ("412 ders interaktif") | Bu dosya 215 rakamını açıkça yazıyor; P2'ye kadar öyle raporlanır |
| SSR hydration uyuşmazlığı | `useHydrated` tek yerde; bileşenler mount'a kadar varsayılanı render eder |
| localStorage kotası dolar | `quota.ts` LRU tahliye + `QuotaExceededError` yakalama |
