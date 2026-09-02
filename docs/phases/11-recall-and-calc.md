# P11 — Serbest hatırlama + hesaplayıcı

**Efor:** ~3 gün · **Bağımlılık:** P1 (`verified`), P4 (şablonlar)

## 1. Close the Tab — `RecallCard`

Further Reading'den sonra son bölüm. ```` ```recall ```` fence'i, 3-5 madde:

```yaml
- q: "Sabit zamanlı karşılaştırma uzunluk sızıntısını neden kapatmaz?"
  must:
    - "timingSafeEqual farklı uzunlukta hata fırlatır"
    - "iki tarafı sabit uzunluğa hash'lemek tek doğru yol"
```

`ui/widgets/RecallCard.tsx` *(`'use client'`)*: tek soru, textarea, **"Göster"
düğmesi 15 karakter yazılana kadar kapalı**.

> Bu kapı olmadan bu bir "cevabı aç" düğmesidir, hatırlama pratiği değil.
> Yol haritasının learner-value hakemi bunu özellikle vurguluyor.

Sonra `must[]` işaretlenebilir ölçütler + öz-değerlendirme *Tuttu / Yarım /
Kaçırdım*.

### Kapı

Credibility hakemi bu fikri **reddetmişti**: *"412 derste ~1.650 üretilmiş
hatırlama maddesi, hiçbir doğrulama kancası yok."* Çözüm ikisini de tatmin ediyor:
**yalnız `verified: true` derslerde yayımlanır.** Bu yüzden P1'in arkasında.

## 2. `CalcCard` — en son yazılır

```yaml
inputs:
  - { id: rate,  label: "Saatlik ücret (EUR)",   type: number, default: 60 }
  - { id: hours, label: "Faturalanabilir saat/hafta", type: number, default: 25 }
outputs:
  - { label: "Yıllık brüt gelir", expr: "rate * hours * 44", format: "eur" }
```

### `modules/course_content/widgets/expr.ts` — `eval` YOK

~120 satırlık shunting-yard: `+ - * / ( ) min max round` ve tanımlayıcılar.

> **`eval`/`new Function` kullanılmaz.** İçerik yazarları girdi kaynağıdır ve
> içerik pipeline'ı bu projenin sandbox'ı olmayan tek yeridir. Ayrıca kendi
> parser'ı test edilebilir ve ~1 KB.

### Neden en son

**Korpusta bugün dönüştürülecek aritmetik yok.** Bu widget bir yazım
affordance'ı; `contracts-pricing-legal/205`, `business-finance-solo-ops/319`,
`saas-business-skills/86_saas_metrics` yeniden yazıldığında anlam kazanır.

**Onu gerektiren ilk üç ders yazılmadan bu widget yazılmaz.**

## Kabul kriterleri

- [x] Recall yalnız `verified` derslerde görünüyor — üçlü koşul aynı desende
- [x] 15 karakter kuralı — `MIN_ANSWER_LENGTH = 15` (`RecallCard.tsx:14`),
      `RecallCard.test.ts` bunu doğruluyor
- [x] `CalcCard`/`expr.ts` yazıldı — **ama önce fazın kendi kuralı yerine
      getirildi**: üç önkoşul dersi widget'ı gerektirecek şekilde yeniden
      yazıldı, widget onlarla aynı değişiklikte merge edildi. Kuralın amacı
      "kimsenin kullanmadığı bir widget ship etme"ydi; boş bir bileşen değil,
      üç gerçek kullanım yeri ile çıktı:

      | Ders | Reader'ın kendi sayısını koyduğu model |
      |---|---|
      | `contracts-pricing-legal/205` | faturalanmayan "kısa soru" saatlerinin yıllık bedeli + ilan edilen saat ücretinin gerçekte ne olduğu |
      | `saas-business-skills/86` | LTV, LTV:CAC oranı (3:1 eşiği), CAC geri ödeme süresi (12 ay hedefi) |
      | `business-finance-solo-ops/319` | W-8BEN dosyada yokken %30 stopajın bir faturaya maliyeti |

      Üçü de dersin prose'unda zaten yazılı olan formülleri alıyor — yeni bir
      iddia üretmiyor, var olanı okurun kendi rakamlarıyla çalıştırıyor.

- [x] `eval`/`new Function` kullanılmadı — `course_content.expr.ts` kendi
      tokenizer + recursive-descent parser'ını taşıyor. Gramerde olmayan her
      şey (`**`, `%`, property access, string literal, `;`) parse edilmeden
      reddediliyor ve bu 8 vakalık bir testle sabitlendi. `globalThis` sıradan
      bir tanımlayıcı olarak parse olur ama fence'in scope'unda karşılığı
      olmadığı için değerlendirmede patlar — JS global'ine hiçbir yol yok.

      Spec `modules/course_content/widgets/expr.ts` diyordu; dosya
      `course_content.expr.ts` olarak kondu, çünkü her kardeş parser
      (quiz, recall, tradeoff, templates) bu adlandırmayı izliyor ve tek
      dosyalık bir `widgets/` dizini açmaya değmedi.

- [x] Bozuk bir `expr` build'i kırıyor — `parseCalc` ifadeyi build anında parse
      edip tanımlanmamış tanımlayıcıyı adıyla reddediyor (`calc output "X"
      refers to "huors", which is not a declared input`). quiz/tradeoff'un
      "bad payload = build failure" duruşuyla aynı; okura boş hücre olarak
      ulaşamıyor

- [x] **Bundle sınırı — bir regresyon yakalandı ve kapatıldı.** İlk sürüm
      `formatCalcValue`'yu `course_content.calc.ts`'ten **değer olarak** import
      ediyordu; o dosya build-time parse için üstte `yaml` + `zod` çekiyor.
      Sonuç ölçüldü, tahmin edilmedi: shipped ders chunk'ında **8 `yaml` + 1
      `zod` izi** — P6'nın "YAML parser client bundle'a girmiyor" kriterinin
      ihlali. QuizCard/TradeoffCard bu tuzaktan `import type` ile kaçıyor;
      CalcCard'ın gerçek bir fonksiyona ihtiyacı olduğu için fonksiyon
      `course_content.calc-format.ts`'e (build-time bağımlılığı olmayan bir
      modül) taşındı. Düzeltme sonrası ölçüm: client chunk'larında
      **yaml 0, zod 0 dosya**, CalcCard hâlâ shipped.

      `CalcCard.test.ts` bunu mekanik olarak koruyor: `course_content.calc`
      import'unun `import type` kalmasını doğruluyor, yani aynı hata sessizce
      geri gelemez.

- [x] İlk yük JS bütçesi (Calc için) — **1.508 B gz** (3.488 B minified):
      `CalcCard` + `expr.ts` + `calc-format.ts`, react/store hariç (onlar zaten
      shipped). Kardeş widget'ların ≤6 KB gz bütçesinin çok altında.
      Not: Next 16 bu kurulumda build çıktısında route boyut tablosunu artık
      basmıyor, bu yüzden rakam esbuild ile modül grafiği bundle'lanarak
      alındı — sayfanın toplam First Load JS'i değil, bu widget'ın eklediği
      kod.
- [x] İlk yük JS bütçesi (Recall için) — orijinal ≤6 KB gz iddiası ship
      anında ölçülmüştü, `RecallCard` o zamandan beri değişmedi

Not: Bu fazın "CalcCard" yarısı uzun süre bilinçli olarak açık kaldı — önkoşul
dersler yazılana kadar merge edilmemesi gereken bir bileşendi, eksik bir
uygulama değil. Önkoşul üç ders yazıldığı için kural artık karşılanıyor ve
widget onlarla birlikte merge edildi.
