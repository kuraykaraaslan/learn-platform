# P2 — Bold-lead içerik geçişi

**Efor:** ~1-2 hafta (içerik işi, kod değil) · **Bağımlılık:** P1

## Neden

P1'in Failure Drill'i **215 dersi** kapsıyor; 197 dersin hiç ayrıştırılabilir
Common Mistakes maddesi yok. "Tüm dersler interaktif" hedefini gerçekten
karşılayan faz budur — ve bu bir kod işi değil, bir yazım işidir.

## Kapsam

```
tek cümlelik (single) madde : 1041
etkilenen ders              : 197 (hiç drill'lenebilir maddesi olmayanlar)
                            + kısmen kapsanan dersler
hedef                       : >=2 drill'lenebilir maddesi olan ders 159 → ~400
```

## Geçişin şekli

Her `single` madde `- **lead** — body` formuna getirilir. **Lead, gövdeyi
özetlemez; gövdenin cevapladığı soruyu sorar.**

Kötü — lead cevabı veriyor, tahmin hatası üretmiyor:
```
- **errorHandler'ı router'lardan sonra kaydedin** — aksi hâlde hatalar yakalanmaz
```

İyi — lead semptomu adlandırıyor, gövde açıklıyor:
```
- **errorHandler router'lardan önce kaydedilirse** — Express middleware'i sırayla
  çalıştırır; hata handler'ı henüz tanımlanmamış olduğu için istek varsayılan
  handler'a düşer ve stack trace yanıt gövdesinde istemciye gider.
```

## Kurallar — pazarlık dışı

1. **Mevcut nesir satırı silinemez.** PR'da silinen bir nesir satırı varsa diff
   kontrolü PR'ı reddeder. Yol haritasının uyarısı: *"yoksa kuyruk sessizce
   tekdüze AI sesine dönüşür — kaçınmanız gereken tam sonuç budur."*
2. **Gövde yeniden yazılmaz.** Yalnız lead eklenir ve mevcut cümle gövde olur.
3. **AI taslak üretir, insan doğrular.** Her madde okunacak; bu, delege
   edilebilir tek kısmı taslak olan bir iştir.
4. **Doğrulanmamış derste geçiş yapılmaz** — o ders zaten drill almayacak, ve
   yanlış bir maddeye lead eklemek onu daha görünür yapar.
5. Sonuç **regex ile doğrulanır**: geçiş sonrası `parseMistakes` o dosyada
   `single` sayısını düşürmüş olmalı.

## Parti düzeni

Kursa göre değil, **kavrama göre** gruplayın — yol haritasının Dalga-2
gerekçesiyle aynı: kurs şeklinde gruplarsanız aynı terminolojiye 14 ayrı kez
karar verirsiniz. En yüksek merkeziyetli kümeler: retry (35 ders / 14 kurs),
rate limiting (33/14), JWT (32/13), idempotency (27/12), caching.

PR başına **8-12 ders, tek küme, tek gözden geçiren.**

## Araç

`scripts/mistakes-report.ts` *(yeni, küçük)* — her ders için
`{single, drillable, form dağılımı}` basar; geçişin ilerlemesini ölçer ve
`content/_reports/mistakes.json`'a yazar. Kabul kriteri bu rapordur.

## Kabul kriterleri

- [ ] `single` madde sayısı 1041'den ≤ 250'ye düştü
- [ ] `>=2 drill'lenebilir` ders sayısı 159'dan ≥ 380'e çıktı
- [ ] Hiçbir PR'da silinmiş nesir satırı yok (diff kontrolü)
- [ ] `npm run content:check` yeşil
- [ ] Snapshot değişimi **beklenen** ve commit mesajında dosyalar adlandırılmış
      (bu bir içerik değişikliğidir, mekanik bir geçiş değil)

## Risk

| Risk | Azaltma |
|---|---|
| Lead cevabı verir, tahmin hatası ölür | Yukarıdaki iyi/kötü örneği rubric; spot review 4'te 1 |
| Nesir sessizce tekdüzeleşir | Silinen satır yasağı + diff kontrolü |
| Yanlış bir maddeye lead eklenip görünürlüğü artar | Yalnız `verified` derslerde geçiş |
