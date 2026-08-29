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
- [ ] **Yapılmadı**: `CalcCard`/`expr.ts` hiç yazılmadı — bu fazın kendi kuralı
      ("`CalcCard` yalnız onu gerektiren dersler yazıldıktan sonra merge edildi")
      gereği kasıtlı olarak ertelendi. Gerektiren üç ders
      (`contracts-pricing-legal/205`, `business-finance-solo-ops/319` — T1.7
      zarar listesinde, ikame gerekiyor —, `saas-business-skills/86`) hiçbiri
      henüz CalcCard'ı gerektirecek şekilde yeniden yazılmadı
- [x] İlk yük JS bütçesi (Recall için) — orijinal ≤6 KB gz iddiası ship
      anında ölçülmüştü, `RecallCard` o zamandan beri değişmedi

Not: Bu fazın "CalcCard" yarısı P11'in kendi kuralı gereği bilinçli olarak
tamamlanmamış durumda — önkoşul dersler yazılana kadar merge edilmemesi
gereken bir bileşen, eksik bir uygulama değil.
