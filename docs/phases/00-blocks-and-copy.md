# P0 — Blok refaktörü + kopyala düğmesi

**Efor:** ~1 gün · **Bağımlılık:** yok · **Sonrakiler:** P1, P3, P4, P7, P8

## Neden

Bugün bir bölüm tek bir HTML string'i olarak `dangerouslySetInnerHTML` ile
basılıyor. Bu haliyle prose'un *içine* React adası koymak imkânsız — yani
sonraki 12 fazın hiçbiri mümkün değil. P0 bu tek kısıtı kaldırır ve karşılığında
görünür tek şey kopyala düğmesidir.

## Zemin — ölçüldü, doğrulandı

```
bölüm sayısı                        : 2473
<pre> düğümü                        : 505
bunların bölüm kökünün doğrudan çocuğu olması : 505 / 505   (iç içe: 0)
```

**Sonuç:** prose'u React'e çevirmeye gerek yok. Kökün çocuklarını `pre`
sınırlarında dilimlemek yeterli; `pre` olmayan her koşu bugünkü **aynı**
`hast-util-to-html` ile string'e çevrilir.

Aday pipeline korpusun tamamında test edildi:
```
HTML uyuşmazlığı  : 0 / 2473   (byte-identik)
kaynağı stash'lenen pre>code : 505 / 505
```

## Neden bu tasarım

**`hast-util-to-jsx-runtime` kullanılmıyor.** Tüm prose'u React'in
serileştirmesinden geçirirdi — entity kaçışı, attribute sırası ve void element
biçimi bugünkünden ince farklarla değişir. **Snapshot bunu yakalayamaz**, çünkü
snapshot pipeline string'ini hash'liyor, sayfa DOM'unu değil. Ayrıca 5 yeni
bağımlılık getirir (`style-to-js`, `inline-style-parser`, …).

**HTML string'ini regex'le bölmek olmaz.** `data.meta` (fence'in `run` işareti)
yalnız ağaçta var, string'de yok — kurtarılamaz.

## Yapılacaklar

### 1. `modules/course_content/rehype-stash-code.ts` *(yeni, ~15 satır)*

`remarkRehype` ile `rehypeHighlight` **arasında** çalışır — o noktada
`pre > code`'un hâlâ tek bir text çocuğu vardır. Ham kaynağı `node.data.source`'a
kopyalar. `data` serileştirilmediği için **HTML nötrdür**.

```ts
import { visit } from 'unist-util-visit';

/** pre > code'un ham kaynağını, rehype-highlight onu span'lara bölmeden önce
 *  node.data.source'a saklar. hast-util-to-html `data`'yı yok sayar, yani bu
 *  eklenti çıktı HTML'ini değiştirmez (412 ders üzerinde doğrulandı). */
export function rehypeStashCode() {
  return (tree: Root) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (node.tagName !== 'code') return;
      if (!parent || parent.type !== 'element' || parent.tagName !== 'pre') return;
      const first = node.children[0];
      if (first?.type === 'text') (node.data ??= {}).source = first.value;
    });
  };
}
```

> `pre > code`'a **kapsamlandır**. Kapsamsız hali 3.563 satır içi `code`'u da
> stash'ler — zararsız ama gereksiz.

### 2. `modules/course_content/course_content.markdown.ts` *(değişiyor)*

`markdownToHtml`'in **imzası ve çıktısı birebir korunur**; tek kaynak olsun diye
hast üzerinden yeniden yazılır.

```ts
const hastProcessor = unified()
  .use(remarkParse).use(remarkGfm).use(remarkLessonRefs)
  .use(remarkRehype).use(rehypeStashCode).use(rehypeHighlight);

export function markdownToHast(markdown: string): HastRoot {
  return hastProcessor.runSync(hastProcessor.parse(markdown)) as HastRoot;
}

export function markdownToHtml(markdown: string): string {
  return toHtml(markdownToHast(markdown));
}
```

`hast-util-to-html@9.0.5` **zaten kurulu** (`rehype-stringify`'ın bağımlılığı) —
yeni paket yok. `rehype-stringify` import'u kalkar.

### 3. `modules/course_content/course_content.blocks.ts` *(yeni)*

```ts
export type LessonBlock =
  | { kind: 'html';   html: string }
  | { kind: 'code';   id: string; lang: string; meta: FenceMeta; source: string; html: string }
  | { kind: 'widget'; id: string; widget: LessonWidget; html: string };

/** Kökün çocuklarını <pre> sınırlarında koşulara böler. pre olmayan her koşu
 *  tek bir html bloğu olur; her <pre> kendi bloğunu alır. */
export function splitBlocks(root: HastRoot, sectionKey: keyof LessonSections): LessonBlock[];
```

- Blok `id`'si `${sectionKey}-${ordinal}` — kararlı, ve localStorage anahtarının eki.
- P0'da `meta` daima `{run:false, opts:{}}`, `widget` hiç üretilmez. Tipler
  şimdi konur ki P4/P8 imza değiştirmesin.

### 4. `modules/course_content/course_content.parser.ts` *(değişiyor)*

Satır tarayıcısı saf bir markdown bölmesi olarak ayrılır; **`parseLessonMarkdown`
çıktısı birebir aynı kalır.**

```ts
/** Saf markdown bölmesi, render yok. Bugünkü semantiği aynen taşır:
 *  tekrarlanan alanda son yazan kazanır, buffer boşsa yazılmaz, render öncesi .trim(). */
export function splitLessonSections(raw: string): { title: string; sections: Record<keyof LessonSections, string> };

export function parseLessonMarkdown(raw: string)  // ← çıktı değişmiyor
export function parseLessonBlocks(raw: string): { title: string; blocks: Record<keyof LessonSections, LessonBlock[]> }
```

`Lesson` tipine `blocks` eklenir; `LessonSections` **`Record<key, string>` olarak
kalır**, böylece `course_content.snapshot.ts` ve `scripts/parse-snapshot.ts`
**hiç dokunulmadan** çalışır.

### 5. `modules/course_content/ui/LessonSectionCard.tsx` *(değişiyor)*

`html: string` yerine `blocks: LessonBlock[]` alır. Tümü **tek bir**
`PROSE_CLASSES` sarmalayıcısı içinde: `html` blokları bugünkü gibi
`dangerouslySetInnerHTML`, `code` blokları `<CodeBlock>`.

### 6. `ui/CodeBlock.tsx` (server) + `ui/CopyButton.tsx` (`'use client'`)

`CodeBlock` bugünkü `<pre>` HTML'ini aynen basar, üstüne bir `CopyButton`
yerleştirir. Kopyalanan şey **`block.source`** — vurgulanmış HTML değil, ham kod.
`navigator.clipboard.writeText`, başarıda 2 sn "Kopyalandı", `aria-live="polite"`.

## Adı konmuş tek render farkı

Bugün bölüm tek bir div: `<div class=PROSE><p>a</p><pre/><p>b</p></div>` —
`[&_p:last-child]:mb-0` hiçbir şeyi yakalamıyor. Bölünmeden sonra her html koşusu
kendi sarmalayıcısını alır, dolayısıyla `p:last-child` **her kod bloğundan önceki
paragrafı** yakalamaya başlar: 505 yerde 0.75rem daralma.

**Düzeltme:** `PROSE_CLASSES`'ta `'[&_p:last-child]:mb-0'` yerine dış
sarmalayıcıda `'[&>:last-child>:last-child]:mb-0'`. Net etki kuralın özgün
niyetine bugünkünden daha yakın.

> **Bu fark `parse-snapshot.json`'a görünmez** — snapshot `markdownToHtml`'i
> hash'liyor, sayfa DOM'unu değil. Bu, mevcut emniyet ağındaki **gerçek bir
> delik** ve bu iş onu genişletiyor. Azaltma: 5 pilot derste
> `renderToStaticMarkup` diff testi. **PR açıklamasında adını koy.**

## Testler — `modules/course_content/course_content.blocks.test.ts`

1. **Eşdeğerlik (asıl kapı):** 412 × 6 bölüm için
   `blocks.map(b => b.html).join('') === parseLessonMarkdown(raw).sections[key]`.
   Bu, snapshot değişmezliğini mekanik hale getirir — blok bölmesi sessizce
   kayamaz. Tam korpus render'ı ~1,7 sn, test ~4 sn.
2. Her `code` bloğunun `source`'u `listFences()`'ın verdiği koda eşit.
3. ```` `markdownToHtml('```ts run\nx\n```')` ```` ile ```` `markdownToHtml('```ts\nx\n```')` ```` eşit —
   meta'nın bedava olduğunu kilitler (P8'in temeli).
4. `renderToStaticMarkup` diff'i, 5 pilot ders.

## Kabul kriterleri

- [ ] `npm run content:check` yeşil
- [ ] `git diff content/_reports/parse-snapshot.json` **boş**
- [ ] Eşdeğerlik testi 2473 bölümde geçiyor
- [ ] `course_content.snapshot.ts` ve `scripts/parse-snapshot.ts` **değişmedi**
- [ ] `markdownToHtml` imzası değişmedi
- [ ] Yeni npm bağımlılığı **yok**
- [ ] 505 kod bloğunda kopyala düğmesi çalışıyor, ham kaynağı kopyalıyor
- [ ] Ders sayfasının ilk yük JS'i ≤ 2 KB gz arttı

## Riskler

| Risk | Azaltma |
|---|---|
| Blok bölmesi HTML'i sessizce değiştirir | Eşdeğerlik testi — 2473 bölümde byte karşılaştırması |
| Margin farkı gözden kaçar | `renderToStaticMarkup` diff testi + PR'da açık beyan |
| `rehype-stash-code` çıktıyı değiştirir | 412 ders üzerinde doğrulandı: 0 fark. Test #1 bunu kalıcı kılar |
| İleride biri `hast-util-to-jsx-runtime` ekler | Bu dosyanın "Neden bu tasarım" bölümü gerekçeyi kaydeder |
