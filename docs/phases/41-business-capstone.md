# P41 — Dördüncü capstone: koşturulacak hiçbir şeyin olmadığı yerde referans

**Efor:** ~2 gün · **Bağımlılık:** P34, P35, P36, P39 · **Sonrakiler:** beşinci kurs

## Neden

Yol haritasının T2.4'ü beş kurs önerdi; P34 ikisini, P39 üçüncüsünü yaptı.
Bu dördüncüsü: **`business-finance-solo-ops`**.

Kurs bir sebeple sıradaydı ve o sebep bir kalite sorusu: **referansı
koşturulamayan ilk capstone bu.** P35 bir kural koymuştu — koşturulabilen
doğrulanır, koşturulamayanın çıktısı **yazılmaz**. Üç capstone da bu kuralın
kolay tarafındaydı: hepsinin bir PostgreSQL'i vardı. Burada koşturacak bir
sistem yok, çünkü teslimat bir teşhis.

## Koşturulamayan referans nasıl dürüst kalır

Üç kural, ve üçü de bu fazda yazıya geçiyor:

**1. Hiçbir dış olgu iddia edilmiyor.** Brief'teki her rakam **kurgunun
kendisine** ait: bir çeyreğin faturaları, banka bakiyesi, izlenen saatler.
Vergi oranı, piyasa fiyatı, sektör ortalaması **yok**. Dolayısıyla
doğrulanacak bir dış iddia da yok — aritmetik senaryonun içinde kapalı ve
okuyucu bölmeyi kendisi yapabilir.

**2. Aritmetik tutarlı ve gösterilebilir.** £72.000 faturalandı, £41.000
tahsil edildi, £31.000 açık; £18.000 / 210 saat = £85,71 ve 270 saat =
£66,67. Referans bu bölmeleri **yaparak** ilerliyor, sonucu ilan ederek değil.

**3. Referans bir teşhis, bir tavsiye değil.** P39'un "inşa etme, incele"
kararının bu alandaki karşılığı: capstone hayat tavsiyesi vermiyor, verilen
rakamlardan **ne çıkarılabileceğini** gösteriyor. Kurstaki tek denylist dersi
(`#319`, vergi ve muhasebe) rubric'e girmiyor; brief'teki vergi ödemesi bir
**nakit olayı** olarak duruyor ve onu ölçen satır `#316`'dan geliyor.

`proof` fence'i **yok**, ve bu bir eksiklik değil: koşturulacak bir şey
olmadığında P35'in kuralı sessiz kalmayı emrediyor.

## Kapsam

**Brief:** Bir tek kişilik işletmenin Q3'ü. Sahibi "en iyi çeyreğim" diyor ve
kasımda iki hafta izin alıp alamayacağını soruyor. Rakamlar o soruyu
cevaplıyor ve cevap hayır — ama sebebi kârsızlık değil, **likidite**.

**Deliverable:** Yazılı bir teşhis; sorulan soruya önce cevap, sonra hiçbir
şey değişmezse ne olacağına göre sıralanmış bulgular, **önce hesaplanacak tek
sayı**, ve figürlerden görülemeyenler.

### Rubric — altı satır, altısı da doğrulanmış dersten

| Lead | Ders |
|---|---:|
| "The year's total revenue looks strong, so the business is called financially healthy" | 316 |
| "A tax settlement lands as a surprise, even though it was months away and predictable" | 316 |
| "The next similar project gets priced from the old quoted estimate, not the hours the last one actually took" | 321 |
| "Time tracking only logs coding hours" | 322 |
| "One client now represents 65% of trailing revenue, and the acquisition pipeline looks exactly like it did last quarter" | 339 |
| "The fixed price is locked in, and \\"scope\\" is still whatever the client says it is that week" | 330 |

Bu kursun Common Mistakes maddeleri **senaryo** biçiminde yazılmış (bold bir
isim tamlaması değil, olan bir şey). Rubric için bu bir avantaj: her satır,
okuyucunun kendi teşhisiyle karşılaştırabileceği bir durum.

## Kabul kriterleri

- [x] `business-finance-solo-ops` capstone rotası açıldı (`build` **655
      sayfa**); capstone 3 → **4**
- [x] Altı rubric satırı da doğrulanmış ders (316, 316, 321, 322, 339, 330);
      iki capstone lint kuralı temiz
- [x] `#319` (denylist, vergi) rubric'te yok; vergi ödemesi brief'te bir nakit
      olayı ve onu ölçen satır `#316`'dan
- [x] `proof` yok; `stamp-verify --check` **35/35** (değişmedi)
- [x] Brief'teki her rakam kurgunun kendisine ait — oran, piyasa fiyatı ya da
      sektör ortalaması yok
- [x] Referanstaki bölmeler gösterilerek yapılıyor: £18.000 / 210 saat =
      £85,71 ve / 270 saat = £66,67; £72.000 − £41.000 = £31.000
- [x] Arama indeksi kendiliğinden buldu: 565 → **566 kayıt**, 85.960 B gz
- [x] **P35'in bir testi bu fazda düzeltildi.** `capstone proofs > exists for
      every pilot capstone` her capstone'un bir proof taşımasını şart
      koşuyordu — o iddia, bütün capstone'lar kod alanındayken doğruydu. P41
      onu doğru şekilde kırdı ve test kararı yansıtacak şekilde değiştirildi:
      mekanizma en az bir yerde koşuyor, ve **var olan** her proof gerçek.
      Buraya proof zorlamak, P35'in engellemek için var olduğu uydurma çıktıyı
      üretirdi
- [x] `content:check` (**49 dosya, 341 test**), `lint`, `stats-check`
      (34 rows · 0 disagree), `build` yeşil; ders metni değişmedi

## Risk

| Risk | Azaltma |
|---|---|
| Capstone finansal tavsiye verir | Şekil bir teşhis; rubric korpusun doğrulanmış maddeleri; hayat/işletme tavsiyesi yok |
| Denylist dersi (`#319`) sızar | `capstone/rubric-cites-unverified` (P36) error olarak zorluyor |
| Dış olgu (vergi oranı, piyasa fiyatı) iddia edilir | Brief'teki her rakam kurgunun kendisinden; oran yok |
| Aritmetik tutarsız olur | Bölmeler referansta açık; £18.000/210 ve /270 gösteriliyor |
| Koşturulamayan referans "daha az" sayılır | P35'in kuralı: koşturulacak bir şey yoksa çıktı yazılmaz — sessizlik doğru davranış |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| `contracts-pricing-legal` capstone'u | Yol haritasının beşinin tamamı | kapsam — kursta iki denylist dersi var ve alan "not legal advice" sorumluluk reddi taşıyor; şekli ayrıca düşünülmeli |
| Brief'in rakamlarını bir `calc` ile oynatmak | Okuyucunun kendi rakamlarıyla denemesi | kapsam — capstone sayfası markdown pipeline'ında (P34'ün kayıtlı sınırı); ayrıca brief'in rakamları senaryonun kendisi |
| Alan (`built-environment`) capstone'u | P22'nin ertelediği kalem | kapsam — kurs başına capstone; sekiz kursu birleştiren teslimat farklı bir mekanizma |
