# P43 — Path capstone'u: kurs sınırını aşan ilk teslimat

**Efor:** ~3 gün · **Bağımlılık:** P23, P30, P34-P36, P42 · **Sonrakiler:** yok

## Neden

İki şartname bunu adıyla istedi. P23'ün tablosu: *"Path'e capstone bağlama —
bağımlılık: P22'nin capstone adayına bağlı."* P42'nin tablosu: *"artık mümkün
ama ayrı bir karar."* Bu faz o kararı veriyor.

Beş capstone var ve beşi de **tek bir kursun** içinde duruyor. Oysa yol
haritasının capstone'a yüklediği değer — *"transfer üreten tek kalem"* —
tam olarak kurs sınırını aşmakla ilgili. P22'nin ertelediği "alan capstone'u"
da aynı şeyi başka kelimelerle istiyordu: *"sekiz kursun tek bir uçtan uca
teslimatta birleşmesi."*

Path'ler o birleşmeyi zaten yapıyor: `operations-engineer` **dört kurstan
16 ders** topluyor ve yayı bir işi izliyor — kütük → kimlik → etiket → saha →
doğrulama → durum → alarm → iş emri → etiketler. Eksik olan tek şey, o yayın
sonunda okuyucunun **ürettiği** bir şeydi.

Seçilen path `operations-engineer`: 16 adımının **16'sı da doğrulanmış**,
yani P36'nın kuralı burada hiçbir şeyi kısıtlamıyor ve mekanizmanın kendisi
sınanabiliyor.

## Mekanizma — üç genelleştirme, biri P38'in ertelediği

**1. Capstone'un evi ikiye çıkıyor.** `content/courses/<slug>/capstone.md`
yanına `content/paths/<pathId>/capstone.md`. `parseCapstoneMarkdown` zaten
slug'ı yalnız hata mesajı için alıyordu; değişmiyor.

**2. Rubric'in kapsamı kurs değil path oluyor.** Kurs capstone'unda kural
"aynı kursun dersleri"ydi. Path capstone'unda doğal karşılığı **"path'in
adımları"**: rubric yalnız o path'in taşıdığı bir dersin maddesini
alıntılayabilir. Bu daha gevşek değil **daha keskin** bir kural — path zaten
küratörlü bir seçki, ve capstone tam olarak o seçkiyi ölçüyor. P36'nın
"yalnız doğrulanmış" kuralı aynen geçerli.

**3. Arama kaydı `href` taşıyor — P38'in ertelediği değişiklik.** P38 şunu
yazmıştı: *"path rotası `/paths/<id>`, `/courses/...` değil; `SearchRecord`'a
bir href alanı ve istemcide bir dallanma gerektirir."* Path capstone'u tam
olarak o durumu yaratıyor, yani erteleme bitti. `href` kayda giriyor ve
`SearchLauncher` onu kullanıyor — dallanma değil, **tek alan**. Ders ve kurs
capstone kayıtlarının href'i de artık builder'da açıkça üretiliyor; istemcinin
rota şeklini bilmesi gerekmiyordu ve artık bilmiyor.

**4. Lint'e `global` kancası.** İki capstone kuralı `course:` kancasında ve
path bir kurs değil. `content-lint`'in çerçevesi bugün yalnız `lesson` ve
`course` tanıyor; üçüncü bir `global` kancası ekleniyor (index.ts'te tek
satır) ve path capstone kuralları oraya bağlanıyor. Alternatif — kuralları
teste taşımak — lint kapısını kaybettirirdi.

## Kapsam

**`content/paths/operations-engineer/capstone.md`**

Brief: bir sahaya yeni bir soğutma grubu kuruldu. Okuyucu, o varlığı
**bütün sistemlerde doğru var etmenin** planını yazıyor — kütük satırı,
etiket, ilk saha ziyareti, durum zemini, ve ilk iş emri.

Path'in yayı ile brief'in yayı aynı, ve bu tesadüf değil: capstone path'in
kendisini ölçüyor.

### Rubric — altı satır, altısı da path'in kendi adımlarından

Kaynak dersler dört kursa yayılıyor — bu, kurs capstone'larının hiçbirinde
mümkün olmayan şey ve fazın asıl noktası.

## Kabul kriterleri

- [x] `/paths/operations-engineer/capstone` rotası açıldı
- [x] Rubric'in altı satırı da **path'in adımlarından** ve hepsi doğrulanmış;
      path'te olmayan bir ders alıntılanınca lint ateşliyor
- [x] Kaynak dersler **en az üç farklı kurstan** — kurs capstone'unun
      yapamadığı şey
- [x] `SearchRecord.href` eklendi; ders, kurs capstone'u ve path capstone'u
      kayıtlarının hepsi href taşıyor ve `SearchLauncher` onu kullanıyor
- [x] `content-lint`'e `global` kancası eklendi ve iki path kuralı ona bağlı
- [x] Kurs capstone'ları etkilenmedi: 5 kurs capstone'u, `stamp-verify --check`
      35/35
- [x] Arama indeksi 567 → **568 kayıt**
- [x] `content:check` (0 error, 21 warn), `stamp-verify --check`, `stats-check`,
      `concepts-check`, `snapshot-diff` (0/0) ve `build` yeşil; ders metni değişmedi.
      `npm run lint` (eslint) **4 hata** veriyor — dördü de HEAD'de aynen duruyor
      (P34'ün üç `dangerouslySetInnerHTML`'i + P33'ün bir `require`'ı), bu fazın
      diff'i eslint çıktısını değiştirmiyor. Aşağıda aday olarak kayıtlı.

## Risk

| Risk | Azaltma |
|---|---|
| İkinci bir capstone mekanizması doğar | Aynı parser, aynı UI, aynı kurallar; farklı olan yalnız ev ve kapsam |
| Rubric path dışından ders alıntılar | Yeni lint kuralı path adımlarını zorluyor |
| `href` değişikliği aramayı kırar | Tek alan, builder'da üretiliyor; test üç kayıt türünü de doğruluyor |
| `global` kancası çerçeveyi karmaşıklaştırır | Tek satır; `lesson`/`course` ile aynı imza |
| Path capstone'u kurs capstone'unu tekrar eder | Brief tek bir varlığın beş sistemdeki hayatı — hiçbir kursun tek başına kapsamadığı bir teslimat |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Kalan dört path'e capstone | Beş path'in tamamı | kapsam — mekanizma bir path'te sınandı; yayılma ayrı bir pas (P6/P31/P39 usulü) |
| Alan (`built-environment`) capstone'u | P22'nin ertelediği kalem | kapsam — path capstone'u o ihtiyacın büyük kısmını karşılıyor; dal capstone'u ayrıca gerekli mi, ölçülmeli |
| Rubric satırından dersine bağlantı | Okuyucunun maddeyi okuyabilmesi | kapsam — P36 ve P42'nin tablolarında da duruyor; ayrı bir UI kararı |
| eslint'in dört hatası | `npm run lint` yeşile döner ve kapı olur | kapsam — dördü de bu fazdan önce vardı (P34'ün capstone UI'ındaki üç `dangerouslySetInnerHTML`, P33'ün testindeki bir `require`). Kuralı gevşetmek mi, `markdownToHtml` çıktısını başka türlü basmak mı — değişmez #6'nın usulünce ayrı bir karar |
