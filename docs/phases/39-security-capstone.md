# P39 — Üçüncü capstone: inşa etmek değil, incelemek

**Efor:** ~2-3 gün · **Bağımlılık:** P34, P35, P36 · **Sonrakiler:** kalan iki kurs

## Neden

Yol haritasının T2.4'ü beş kurs önermişti; P34 ikisini yaptı ve mekanizma
P35 (doğrulanabilir referans) ile P36 (rubric yalnız doğrulanmışı ölçer) ile
sağlamlaştı. Bu faz üçüncüsünü ekliyor: **`security`**.

Kurs bir sebeple seçildi ve o sebep aynı zamanda fazın en zor kısıtı:
`security`'nin 13 dersinden **üçü `HARM_DENYLIST`'te** (32 JWT, 33 SSRF,
34 timing attack). P36'nın kuralı gereği rubric onlara dokunamaz — yani bu
capstone, mekanizmanın kısıt altında hâlâ tutarlı bir şey üretip
üretemediğinin sınavı.

## Şeklin kendisi bir doktrin kararı

Bir güvenlik capstone'unun bariz hâli "şu kimlik doğrulama akışını tasarla"
olurdu. **Yazılmadı.** Böyle bir brief'in referans çözümü, korpusun uzman
pasosu beklediği türden bir şeyi — nasıl güvenli yapılacağını — iddia etmek
zorunda kalırdı. Üç dersin denylist'te olmasının sebebi tam olarak bu.

Onun yerine capstone **bir kod incelemesi** istiyor. Okuyucu bir pull
request'i inceliyor ve ne bulduğunu yazıyor. Fark önemli:

- "Nasıl güvenli yapılır" bir **tavsiye**dir ve uzman pasosu ister.
- "Burada ne yanlış" bir **tanımadır** ve korpusun doğrulanmış dersleri onu
  zaten madde madde belgeliyor.

Rubric'in altı satırı da o belgelenmiş maddeler. Capstone yeni bir güvenlik
iddiası üretmiyor; okuyucudan korpusun zaten söylediğini **tanımasını**
istiyor — ki transfer de tam olarak budur.

## Kapsam

**`content/courses/security/capstone.md`** — çok kiracılı bir uygulamaya
arama uç noktası ekleyen bir PR. Beş dosyaya dokunuyor: bir rota, bir servis,
bir sorgu, bir `.env` ve bir CI adımı.

### Rubric — altı satır, altısı da doğrulanmış dersten

| Lead | Ders |
|---|---:|
| "Dynamic ORDER BY without an allowlist" | 30 |
| "Validating at the route layer but not the service layer" | 31 |
| "Checking roles in the UI only" | 39 |
| "System admin can access all tenant data without tenant role" | 39 |
| "Committing `.env` to version control" | 37 |
| "Using `npm install` in CI" | 40 |

Altısı da `verified: true` derslerden birebir; `capstone/rubric-cites-unverified`
ve `capstone/unsourced-rubric-row` ikisi birden zorluyor.

### `content/_verify/security/capstone/` — referansın koşan yarısı

Referans tek bir olguyu gösteriyor ve o olgu **tamamen savunmacı**: bir
saldırı tarifi değil, `ORDER BY`'ın parametrelenemeyeceğinin kanıtı.

Ölçülen: `ORDER BY $1` **hata vermiyor ve sıralamıyor**. Parametre bir sabit
olarak değerlendiriliyor, sabite göre sıralamak da bir işlem değil — yani
"parametrelediğim için güvendeyim" diyen kod, hem güvende değil hem de
sıralama özelliği sessizce çalışmıyor. Allowlist'in neden tek yol olduğu
buradan çıkıyor.

Proof, sömürü göstermiyor: yalnız dört sorgunun döndürdüğü sırayı basıyor.

## Yapılacaklar

- `content/courses/security/capstone.md` *(yeni)*
- `content/_verify/security/capstone/` *(yeni)* — PGlite, sıfır ek bağımlılık
- İndeks bakımı: tüketilmiş iki aday satırı tablolarından çıkarılıyor
  (P31'in "yayılma" satırı P32'de, P34'ün "capstone içinde proof" satırı
  P35'te kapandı) — README'nin kendi kuralı, P27'nin `## Ek` konvansiyonuyla

## Kabul kriterleri

- [x] `security` capstone rotası açıldı (`build` **654 sayfa**); capstone 2 → **3**
- [x] Altı rubric satırı da doğrulanmış ders alıntılıyor (30, 31, 39, 39, 37, 40);
      `capstone/unsourced-rubric-row` ve `capstone/rubric-cites-unverified`
      ikisi de temiz — yani denylist'teki üç ders (32, 33, 34) rubric'e
      girmedi ve **mekanizma kısıt altında tutarlı bir capstone üretti**
- [x] Referans proof'u damgalı (`proof` 34 → **35**), `--check` 35/35,
      sıfır ek bağımlılık
- [x] Proof sömürü tarifi içermiyor: dört sorgunun döndürdüğü sırayı basıyor
      ve bulgusu **`ORDER BY $1` ne hata veriyor ne sıralıyor** — parametreli
      iki satır, `ORDER BY`'sız satırla birebir aynı
- [x] Arama indeksi capstone'u kendiliğinden buldu (P38): 564 → **565 kayıt**,
      85.885 B gz
- [x] Tüketilmiş iki aday satırı tablolarından çıktı ve `## Ek` bölümleriyle
      kayda geçti (P31'in yayılması → P32, P34'ün proof'u → P35)
- [x] `content:check` (341 test), `stamp-verify --check` 35/35, `lint`,
      `stats-check` (33 rows · 0 disagree), `build` yeşil; ders metni değişmedi

## Risk

| Risk | Azaltma |
|---|---|
| Capstone güvenlik tavsiyesi üretir | Şekil bir inceleme; rubric korpusun doğrulanmış maddeleri; yeni mitigasyon iddiası yok |
| Referans saldırı tarifi olur | Proof yalnız `ORDER BY`'ın parametrelenemediğini gösteriyor; sömürü yok |
| Denylist dersleri rubric'e sızar | `capstone/rubric-cites-unverified` (P36) error olarak zorluyor |
| PR kurgusu gerçekçi olmaz | Beş dosya, beş ayrı ders maddesine denk geliyor; hepsi tek bir özellik eklemenin doğal yan ürünü |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| `business-finance-solo-ops` ve `contracts-pricing-legal` capstone'ları | Yol haritasının beşinin tamamı | kapsam — ikisi de kod olmayan alanlar ve referansları koşturulamaz; ayrı bir pas ve ayrı bir kalite ölçütü ister |
| Alan (`built-environment`) capstone'u | P22'nin ertelediği kalem | kapsam — capstone bugün kurs başına; sekiz kursu birleştiren bir teslimat farklı bir mekanizma |
| PR diff'inin sayfada gösterilmesi | Okuyucunun inceleyeceği kodu görmesi | kapsam — brief kodu nesirle tarif ediyor; diff render'ı capstone sayfasını blok pipeline'ına bağlamayı gerektirir (P34'ün kayıtlı sınırı) |
