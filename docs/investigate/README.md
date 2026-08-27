# Investigation — 412 dersin zenginleştirilmesi

Bu klasör, `content/courses/` altındaki **412 dersin tamamı üzerinde yapılan çok-ajanlı denetimin
eksiksiz çıktısıdır**. Hiçbir metin özetlenmedi veya yeniden yazılmadı; her dosya ajanların
döndürdüğü sonucun birebir kopyasıdır. Ham veri `raw/journal.jsonl` içinde durur.

Tarih: 2026-08-27 · Çalıştırma: `enrich-412-lessons` workflow, 14 ajan, 0 hata,
331 araç çağrısı, ~1,48M ajan token'ı, ~61 dakika.

---

## Ne aramaya çıktık

Soru şuydu: *412 dersi, "bunu alan biri kendini cidden bilgi sahibi hissetsin" olacak şekilde
nasıl zenginleştiririz?* Cevabı tahminle değil korpusu okuyarak vermek için altı denetçi gerçek
ders dosyalarını okudu ve kendi ölçümlerini çalıştırdı; dört öneri lensi bu bulguların üstüne
öneri üretti; üç jüri her öneriyi ayrı bir ölçütle puanladı; bir sentez ajanı hepsini tek bir
yol haritasına indirdi.

## Okuma sırası

**Aceleniz varsa:** [04-roadmap.md](04-roadmap.md) — teşhis, katmanlı öneriler, "yapmayın"
listesi, ve uygulama sırası. Diğer her şey onun kanıt tabanıdır.

| Faz | Dosyalar | İçerik |
|---|---|---|
| 1. Denetim | [01-audit/](01-audit/) | 6 rapor, **60 bulgu** (20 critical), her biri dosya yolu + alıntı + kapsam ile |
| 2. Öneri | [02-proposals/](02-proposals/) | 4 lens, **32 öneri**, her biri ne değiştiğini dosya dosya anlatan tam metinle |
| 3. Jüri | [03-judges/](03-judges/) | 3 jüri × 12 sıralama + 6 ret, gerekçeleriyle |
| 4. Sentez | [04-roadmap.md](04-roadmap.md) | Tek karar-hazır yol haritası |
| — | [raw/journal.jsonl](raw/journal.jsonl) | 14 ajanın ham dönüş değerleri (JSON, 344 KB) |

### 1. Denetim — [01-audit/](01-audit/)

| # | Rapor | Bulgu | Kritik |
|---|---|---|---|
| 01 | [Technical depth](01-audit/01-tech-depth.md) | 10 | 3 |
| 02 | [Business & soft-skill depth](01-audit/02-business-depth.md) | 10 | 3 |
| 03 | [Pedagogy / instructional design](01-audit/03-pedagogy.md) | 10 | 5 |
| 04 | [Example code quality](01-audit/04-code-quality.md) | 10 | 4 |
| 05 | [Sourcing & citation integrity](01-audit/05-sourcing.md) | 10 | 2 |
| 06 | [Voice & first-owner leftovers](01-audit/06-voice-context.md) | 10 | 3 |

### 2. Öneri — [02-proposals/](02-proposals/)

| # | Lens | Öneri |
|---|---|---|
| 01 | [Learning science](02-proposals/01-learning-science.md) | 8 |
| 02 | [Content depth](02-proposals/02-content-depth.md) | 8 |
| 03 | [Product / UX](02-proposals/03-product-ux.md) | 8 |
| 04 | [Content operations](02-proposals/04-content-ops.md) | 8 |

### 3. Jüri — [03-judges/](03-judges/)

| # | Jüri | Ölçüt |
|---|---|---|
| 01 | [Learner value](03-judges/01-learner-value.md) | Okuyucuyu "okudum"dan "gerçekten biliyorum"a ne kadar taşıyor? |
| 02 | [Feasibility](03-judges/02-feasibility.md) | Bu repoda değer / (mühendislik + yazım eforu) — 412 çarpanıyla |
| 03 | [Credibility](03-judges/03-credibility.md) | Şüpheci bir senior'a karşı savunulabilirliği artırıyor mu, yoksa AI dolgusunu mu çoğaltıyor? |

---

## Korpusun ölçülmüş durumu

Bu sayılar denetim öncesi ve denetim sırasında `grep`/`wc`/`tsc` ile doğrulandı; ajan iddiası değil.

### Şekil

| Ölçüm | Değer |
|---|---|
| Ders sayısı | 412 (23 kurs, 2–43 ders) |
| Toplam / medyan uzunluk | 425.627 kelime · medyan 1029 (p25 918, p75 1147) |
| Bölüm başına ortalama | What It Is 312 · Key Concepts 182 · Example Code 146 · **When to Use 86** · Common Mistakes 96 · Further Reading 56 kelime |
| Seviye dağılımı | 3-7 yıl: 242 · 1-3: 78 · 7-10: 77 · **0-1: 15** |
| Diyagram | 0 mermaid · 1 görsel |
| Test | `vitest` kurulu, **0 test dosyası** |
| `zustand@^5` | Bağımlılıkta, **hiçbir yerde import edilmiyor** |

### Kod örnekleri

| Ölçüm | Değer |
|---|---|
| Tek kod bloğu olan ders | **338 / 412** |
| Fence dilleri | typescript 158 · markdown/md **221** · text 35 · bash 15 · yaml 12 · java 10 · sql 9 |
| Bağımsız `tsc --noEmit` geçen TS örneği | **19 / 158** temiz · 126'sı patlıyor · 85'inde tanımsız identifier |
| İlk sahibin özel boilerplate'ini import eden | 46 örnek (`@/libs/*`, `@/stores/*` — bu repoda yok) |
| Kod bloğu dışında hiç açıklama olmayan bölüm | **333 / 412** |
| "beklenen çıktı" gösteren ders | 8 / 412 |
| `## Common Mistakes` içinde kod bloğu | **0 / 412** |

### Kaynaklar

| Ölçüm | Değer |
|---|---|
| Further Reading maddesi | 1.246 · URL içeren **352** |
| Tıklanabilir tek kaynağı olmayan ders | **279 / 412** |
| Tam olarak 3 maddesi olan ders | **390 / 412** (varyans ~0) |
| Further Reading'de sıfır URL olan kurs | 11 / 23 |
| Satır içi atıf | 6 satır / 412 ders |
| Doğrulanmış uydurma / yanlış atıf | ~7 (≈180 maddelik örneklemde) |
| Ölü veya taşınmış URL | ≥17 / 318 |

### Öğretim mimarisi

| Ölçüm | Değer |
|---|---|
| Okuyucunun yaptığı görev | **0 / 412** |
| Alıştırma / capstone / quiz | 0 |
| Common Mistakes maddesi | 1.771 (600'ü zaten `**lead** — body` biçiminde) |
| Key Concepts maddesi | 3.029 (medyan 8/ders) |
| Çapraz bağlantı | 0 (~127 ölü `#N` metin referansı var) |
| Arama / ilerleme / ön koşul | yok |

### İlk sahibe ait artıklar

| Ölçüm | Değer |
|---|---|
| "you/your" token | 2.784 · **%93,6'sı meşru öğretici hitap** |
| Görülmemiş bir kod tabanı hakkında olgu iddia eden | ~130 token / **83 dosya** |
| Hâlâ "For your \<X\>" ile açılan gövde | 23 dosya |
| Ders değil, sahibine yazılmış memo | 4 dosya |
| Gerçek ad/handle sızdıran şablon | 7 dosya |
| Çevrilmemiş Türkçe metin | 9 dosya |

---

## Yöntem

```
Faz 1  Audit      6 ajan  ∥  gerçek dosyaları okur, kendi ölçümünü yapar     → 60 bulgu
Faz 2  Ideate     4 ajan  ∥  girdi: 6 denetimin tamamı                        → 32 öneri
Faz 3  Judge      3 ajan  ∥  girdi: 6 denetim + 32 öneri, her biri tek ölçüt  → 36 sıralama, 18 ret
Faz 4  Synthesize 1 ajan     girdi: hepsi                                     → 1 yol haritası
```

Her fazın çıktısı JSON şemasıyla zorlandı (serbest metin değil), böylece hiçbir bulgu
"kanıt" alanı boş geçemedi. Jüriler birbirini görmedi — üç bağımsız puanlama, çakışmaları
sentez ajanı çözdü.

**Yeniden çalıştırmak için:** workflow script'i
`~/.claude-personal/projects/-home-kuray-learn-content-courses/…/workflows/scripts/enrich-412-lessons-wf_5c1c2c91-d80.js`

## Bilinen düzeltme

Ajanlara verilen brief'te "Mermaid bu stack'te doğal olarak render oluyor" deniyordu — **bu repoda
yanlış**. Feasibility jürisi ` ```mermaid ` bloğunu gerçek hattan geçirip düz
`<pre class="language-mermaid">` olarak çıktığını doğruladı; [course_content.markdown.ts](../../modules/course_content/course_content.markdown.ts)
zincirinde mermaid eklentisi yok. Diyagram öneren her kalem bu yüzden ek bağımlılık maliyeti
taşır ve `Decide` önerisi bu gerekçeyle reddedildi.
