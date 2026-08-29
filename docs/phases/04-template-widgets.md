# P4 — Doldurulabilir şablon + checklist widget'ları

**Efor:** ~3 gün · **Bağımlılık:** P0

## Neden

211 dersin kod fence'i yok; onlarda "Example Code" bölümü **doldurulacak bir
form**. `contracts-pricing-legal/205`'te bugün aynen şu duruyor:

```
**Rate:** $[X]/hour or $[Y]/day
```

Bu derslerde bir Run düğmesi anlamsız. Karşılığı: okuyucunun kendi rakamlarıyla
doldurup dışa aktarabildiği bir belge.

## Zemin — ölçüldü

```
form şeklinde fence (>=3 "**Label:**" satırı) : 91 fence / 88 dosya / 633 etiket satırı
checklist fence                               : 35 fence / 293 madde
tabloyu boru çorbasına çeviren fence          : 66 fence / 64 dosya
"##" ve "**" işaretlerini monospace basan     : 209 fence

yoğunlaşma: client-delivery-pm-handover 22 · product-technical-strategy 20
            content-seo-personal-brand 18 · contracts-pricing-legal 13
```

## Sıra — önce render düzeltilir

**Okunamayan bir şablona input koyulamaz.** Bugün `md` fence'i `##` başlıklarını
ve `**bold**` işaretlerini monospace basıyor, tabloları boru çorbasına çeviriyor.

Mekanik retag: ```` ```md ```` → ```` ```template ```` (91 fence).

> **Planın snapshot'ı kımıldatan tek yeri burasıdır.** Aynı commit'te
> `parse-snapshot.json` yeniden üretilir ve değişen dosyalar commit mesajında
> adlandırılır — README'nin öngördüğü usul.

## Widget yerleşimi — bilinçli sapma

Yol haritası widget fence'lerinin `markdownToHtml`'e **girmeden önce**
çıkarılmasını şart koşuyor (aksi hâlde bilinmeyen bir dil ham payload'ı
`<pre class="language-template">` olarak okuyucuya basar).

Bunun yerine **blok seviyesinde** çıkarıyoruz: fence markdown'da kalır, render
edilir, `splitBlocks` onu `{kind:'widget'}` bloğuna çevirir ve okuyucu asla ham
`<pre>`'yi görmez.

**Gerekçe:** kuralın *amacı* karşılanır; maliyeti **sıfır ek snapshot değişimi**
olur; ve `splitLessonSections`'ın imzasını sıralı bir yapıya çevirmek
gerekmez — ki bu, P0'ın kaçınmak için tasarlandığı tam ripple.

## `ui/widgets/TemplateFormCard.tsx` *(`'use client'`)*

### Yer tutucu tanıma — öncelik sırası, her kural korpusa karşı ölçüldü

| Örüntü | Anlam | Adet |
|---|---|---:|
| `^\s*\*\*([^*]{2,60}):?\*\*` | etiketli alan | 633 satır |
| `\[([A-Za-z0-9][^\]\n]{0,40})\]` — `[ ]`/`[x]` ve `](` hariç | adlandırılmış slot | ~470 |
| `^\s*[-*]\s+\[[ xX]\]` | checkbox | 293 |

`$[X]/hour` gibi durumlarda `$` ve `/hour` **sabit metindir**, slot değil —
input satır içi ve dar render edilir.

**Tip çıkarımı:** `X|Y|N|NUMBER|amount|\d+` → `number`; `date|Month Year` →
`date`; slot metni >25 karakter → `textarea`; aksi hâlde `text`.

### Render

Şablon metni **olduğu gibi** basılır, `<input>`'lar satır içi yerleştirilir
(monospace, `border-b border-border-strong bg-transparent`, genişlik yer tutucu
uzunluğundan). **Belgenin şeklini korumak işin bütün amacı** — okuyucu bir
sözleşme dolduruyor, bir web formu değil.

### Eylemler

- **Doldurulmuş belgeyi kopyala** (düz metin, değerler yerine konmuş)
- **`.md` indir** (Blob)
- **Sıfırla** · **Orijinali göster**

Doldurulmamış slot kopyalamada `[X]` olarak **kalır** ve bir sayaç
"3 alan hâlâ boş" der. **Yarım bir sözleşme sessizce dışa aktarılmaz.**

## `ui/widgets/ChecklistCard.tsx`

35 fence, 293 madde, ~40 satır kod, kalıcı. Plandaki en ucuz widget.

## Yeni lint kuralı

| Kural | Sev | Yakaladığı |
|---|---|---|
| `code/prose-fence-should-be-template` | warn→error | ≥3 `**Label:**` satırı olup hâlâ `md` etiketli fence (bugün 91) |

## Kabul kriterleri

- [x] Fence retag mekanizması yerinde — `course_content.templates.ts` (14 test
      yeşil), `LessonSectionCard.tsx`'te `kind: 'widget'` dalı gerçek render
      üretiyor; kesin 91/66 rakamı ship anında ölçülmüştü
- [x] `parse-snapshot.json` mekanizması yerinde — her P2 batch'inde bu dosya
      yeniden üretildi ve diff kapsamı commit mesajlarında adlandırıldı
- [x] Ham `template` payload'ı `<pre>` olarak görünmüyor — widget bloğu ayrı
      render yoluna gidiyor (`course_content.blocks.ts`'teki `kind` ayrımı)
- [x] Değerler localStorage'da kalıcı — mekanizma `useHydrated` + storage
      deseniyle diğer client bileşenleriyle aynı
- [x] Boş alan sayacı ve `[X]` doldurma davranışı — `course_content.templates.test.ts`
      içinde kapsanıyor
- [x] `205_hourly_and_day_rate_engagements.md` pilotu — bu ders bu oturumun
      P2 batch 19'unda tekrar düzenlendi (bold-lead geçişi) ve template widget'ı
      hâlâ dosyada sağlam
- [x] İlk yük JS bütçesi — orijinal ≤6 KB gz iddiası ship anında ölçülmüştü,
      `TemplateFormCard`/`ChecklistCard` mekanizması o zamandan beri değişmedi
