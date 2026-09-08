# P42 — Beşinci capstone: en riskli alanda, ve kapsamını kendisi söyleyen bir referans

**Efor:** ~2 gün · **Bağımlılık:** P34-P36, P39, P41 · **Sonrakiler:** yok (T2.4 tamam)

## Neden

Yol haritasının **T2.4**'ü beş kurs önermişti. P34 ikisini, P39 üçüncüsünü,
P41 dördüncüsünü yaptı. Bu beşincisi: **`contracts-pricing-legal`** — ve
listenin en riskli kursu.

Risk ölçüldü, tahmin edilmedi. Kursun 33 dersinden **31'i doğrulanmış**, ve
konuları ezici çoğunlukla **ticari**: teklif hazırlığı, fiyatlandırma
modelleri, kapsam-fiyat eşlemesi, SOW yapısı, varsayımlar, kabul ölçütleri,
revizyon politikası, karar verici kuralı. Denylist'teki **iki** ders ise tam
olarak avukat isteyenler: `#216` (ödeme kapılarının **dayatılması**) ve
`#230` (yüklenici **sınıflandırması**).

Yani kursun kendi ayrımı zaten yapılmış: ticari yargı yayımlanmış,
hukuki dayanıklılık uzman pasosunda. Capstone o ayrımın doğru tarafında
duruyorsa savunulabilir.

## Şekli — "gitmeden önce incele"

P39'un kararının bu alandaki karşılığı. Capstone bir sözleşme **yazdırmıyor**
ve bir maddenin geçerliliği hakkında **görüş istemiyor**. Bir teklifin
gönderilmeden önce incelenmesini istiyor: neyi eksik, neyin fiyatı
savunulamaz, ve hangi bilgi olmadan rakam verilemez.

Kursun kendi `#227`'si ("Contract Risk Red Flags") zaten bu faaliyet; capstone
onu altı derse yayıyor.

### Sorumluluk reddi capstone'un kendisinde

Kursun dersleri "general education, not legal advice" ile açılıyor. Capstone
bunu **brief'in ilk bloğuna** koyuyor — ders sayfasında olması yetmez, çünkü
capstone ayrı bir sayfa ve okuyucu oraya doğrudan gelebiliyor (P38'den beri
arama da getiriyor).

### Deliverable'ın dördüncü maddesi zorunlu

Teslimat dört şey istiyor ve dördüncüsü fazın kilit noktası: **"bu inceleme
neyi kapsamıyor"**. Referans da bunu yaparak bitiyor — bir belge ve sözlü
notlar okudu, hiçbir maddenin dayanıklılığı hakkında görüş oluşturmadı, ve
bunu söylemeyen bir incelemenin veremeyeceği bir onay ima ettiğini yazıyor.

## Kapsam

**Brief:** Gönderilmek üzere olan bir teklif — tam metniyle — artı meslektaşın
sözlü olarak söyledikleri. Altı tuzağın altısı da belgede ya da o notlarda
görünür durumda.

### Rubric — altı satır, altısı da doğrulanmış dersten

| Lead | Ders |
|---|---:|
| "The scope is still a vision statement, and a fixed price goes out anyway…" | 204 |
| "The quote goes out against a legacy codebase nobody's actually opened…" | 204 |
| "The assumptions list lives in a private notes doc…" | 212 |
| "The deliverable for Milestone 2 reads \\"the app will work great\\"…" | 213 |
| "\\"Unlimited revisions\\" is right there on the pricing page…" | 215 |
| "No deposit and a vague scope both show up in the first call…" | 227 |

`#216` ve `#230` rubric'te **yok** ve bu bir tercih değil: P36'nın kuralı
mekanik olarak engelliyor.

### `proof` yok

P41'de yazıya geçen kural: koşturulacak bir şey yoksa çıktı yazılmaz. Burada
da yok.

## Kabul kriterleri

- [x] `contracts-pricing-legal` capstone rotası açıldı (`build` **656 sayfa**);
      capstone 4 → **5** ve yol haritasının **T2.4'ü tamamlandı**
- [x] Altı rubric satırı da doğrulanmış ders (204, 204, 212, 213, 215, 227);
      iki capstone lint kuralı ilk denemede temiz
- [x] `#216` ve `#230` rubric'te yok — tercih değil, `capstone/rubric-cites-unverified`
      mekanik olarak engelliyor
- [x] Sorumluluk reddi brief'in **ilk bloğunda**, ders sayfasına bırakılmadan —
      capstone ayrı bir sayfa ve P38'den beri arama oraya doğrudan getiriyor
- [x] Deliverable dördüncü madde olarak "bu inceleme neyi kapsamıyor"u
      istiyor; referans da bunu yaparak bitiyor ve söylemeyen bir incelemenin
      veremeyeceği bir onayı ima ettiğini yazıyor
- [x] `proof` yok (P41'in kuralı); `stamp-verify --check` **35/35** değişmedi
- [x] Arama kendiliğinden buldu: 566 → **567 kayıt**, 86.006 B gz
- [x] `content:check` (341 test), `lint`, `stats-check` (34 rows · 0 disagree),
      `build` yeşil; ders metni değişmedi

## Risk

| Risk | Azaltma |
|---|---|
| Capstone hukuki tavsiyeye kayar | Şekil bir ticari hazırlık incelemesi; dayanıklılık sorusu brief'te ve referansta açıkça dışarıda bırakılıyor |
| Denylist dersleri rubric'e girer | `capstone/rubric-cites-unverified` (P36) error |
| Sorumluluk reddi görülmez | Brief'in ilk bloğunda, capstone sayfasının kendisinde |
| Referans bir şablon gibi kullanılır | Referans madde metni üretmiyor; ne eksik olduğunu ve neyin ölçülemediğini söylüyor |
| Okuyucu incelemeyi onay sanır | Deliverable ve referans ikisi de kapsam dışını yazmayı şart koşuyor |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Alan (`built-environment`) capstone'u | P22'nin ertelediği kalem | kapsam — capstone bugün kurs başına; sekiz kursu birleştiren teslimat farklı bir mekanizma |
| Capstone sayfasında rubric satırının dersine bağlantı | Okuyucunun maddeyi okuyabilmesi | kapsam — satır ders numarasını gösteriyor; bağlantı ayrı bir UI kararı (P36'nın tablosunda da duruyor) |

## Ek — path capstone'u tabloyu terk etti (2026-09)

*"Beş path'in kendi teslimatı — artık mümkün ama ayrı bir karar."* Karar
[P43](43-path-capstone.md)'te verildi: evet, ve **bir** path'te.

"Ayrı bir karar" nitelemesi doğru çıktı, çünkü mekanizma göründüğünden fazlasını
gerektirdi — capstone'a ikinci bir ev (`content/paths/<id>/capstone.md`),
lint'e üçüncü bir kanca (`global`, çünkü path bir kurs değil) ve arama kaydına
`href`. Beşi birden yapılsaydı bunların üçü de tek bir path'te sınanmadan
yayılırdı; P6/P31/P39'un usulü izlendi ve kalan dört path yeni bir aday olarak
P43'ün tablosunda duruyor.

Bu tablonun "Alan (`built-environment`) capstone'u" satırı **kalıyor** ama
gerekçesi değişti: path capstone'u o ihtiyacın büyük kısmını karşıladığı için
soru artık "mümkün mü" değil, "dal capstone'u ayrıca gerekli mi" — ölçülmeden
verilecek bir karar değil.
