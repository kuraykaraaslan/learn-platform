# P34 — Capstone: tanımanın ötesine, ve puanı okuyucunun kendisinin vermesi

**Efor:** ~4-5 gün · **Bağımlılık:** P1 (`parseMistakes`), P33 (türetme disiplini) · **Sonrakiler:** kalan üç kursa yayılma

## Neden

Yol haritasının **T2.4**'ü, otuz üç faz boyunca açılmadı. Teşhisi o gün
şuydu: *"412 derste 0 alıştırma var; bugünkü tavan tanıma seviyesi."*

Bu cümlenin ilk yarısı artık doğru değil ve bunu söylemek gerekiyor: P1 drill,
P6 quiz ve `tradeoff`, P11 recall ve `calc`, P5 `proof`, P31 `numbers` getirdi.
Korpusta bugün on farklı alıştırma yüzeyi var.

İkinci yarısı **hâlâ doğru**. Hepsi ders **içinde** duruyor ve hepsi bir şeyi
tanımaktan, hatırlamaktan ya da tahmin etmekten ibaret. Korpusta okuyucunun
**bir şey ürettiği** ve o ürünün bir ölçütle karşılaştırıldığı tek bir yer yok.
Yol haritasının kendi ifadesiyle capstone *"transfer üreten tek kalem"*.

### Ölçülüp kusur çıkmayan bir şey

Bu faz seçilmeden önce yol haritasının **T2.5**'i (Frontmatter Spine)
değerlendirildi ve **yapılmadı**. Gerekçesi ölçüldü: manifest ile ders
başlığının ayrışıp ayrışmadığı 562 dersin hepsinde kontrol edildi —
**0 ayrışma, 0 eksik dosya**. T2.5'in gidereceği tekrar bugüne kadar tek bir
kusur üretmedi, ve büyük, okura görünmez bir refaktörü spekülasyonla yapmak
bu repo'nun usulü değil. Ölçüm kayda geçiyor.

## Doktrin — üç karar, üçü de baştan

**1. Puan saklanmıyor.** `progress.store.ts` tam altı anahtar kalıcılaştırıyor
ve `progress.store.test.ts` o listeyi kilitliyor ("adding a field like
`completed` must fail this test"). Capstone'un öz-değerlendirmesi **bileşen
durumu** olarak kalır: sayfa yenilenirse yeniden puanlanır. Böylece store'a
dokunulmuyor, o test hiç konuşmuyor, ve değişmez #4'ün koruduğu şey —
biriktirilen bir tamamlanma ölçüsü — hiç var olmuyor.

**2. Sertifika yok.** Yol haritasının üç hakeminin ortak kestiği yer buydu ve
zaten değişmez #4. Sayfada rozet, yüzde, "tamamlandı" yok.

**3. Rubric uydurulmuyor, türetiliyor.** Yol haritası: *"Rubric satırları o
kursun kendi Common Mistakes maddelerinden türetilir."* P33'ün usulüyle bu bir
niyet değil bir **lint kuralı**: her rubric satırının `lead`'i, adını verdiği
dersin Common Mistakes maddelerinden birinin birebir lead'i olmalı.

## Kapsam

**Kurs başına isteğe bağlı `content/courses/<slug>/capstone.md`.** Dosya yoksa
rota 404 döner ve hiçbir yerde bağlantı görünmez — yol haritasının kendi
kuralı.

### Dosya şekli

```
# Capstone — <başlık>

## Brief          durum: ne var, ne isteniyor, kısıt ne
## Deliverable    ne üretilecek, "bitti" ne demek
## Rubric         ```rubric fence'i (YAML)
## Reference Walkthrough   mühürlü; okuyucu kendini puanlayana kadar açılmaz
```

`parseCapstoneMarkdown()` **ayrı** bir parser'dır: ders parser'ı ve
`HEADING_RULES` hiç ellenmiyor — T2.4'ün kendi şartı ve P31'in de uyduğu sınır.

### `rubric` fence'i

```yaml
rows:
  - lead: "Retrying without an idempotency key"
    lesson: 7
    looks_like: "..."   # bu ölçütün teslimatta neye benzediği
```

`lead` **birebir** o kursun bir Common Mistakes maddesinden gelir; `lesson`
hangi dersten geldiğini söyler; `looks_like` tek yazılan alandır ve ölçütün
okuyucunun kendi ürününde nasıl görüneceğini anlatır.

Lint: **`capstone/unsourced-rubric-row`** (error) — `lead`, `lesson`'ın
Common Mistakes lead'leri arasında yoksa.

### Mühür

Reference Walkthrough, **her rubric satırı puanlanana kadar** gizlidir.
P11'in RecallCard'ının 15-karakter kapısıyla aynı gerekçe: kapı olmadan bu bir
"cevabı aç" düğmesidir. Puanlar üç seçenek: `met` / `partial` / `missed`.

### Dışa aktarma

Yol haritası: *"Markdown export (Blob) ile okuyucu yöneticisine gösterebileceği
bir paket alır."* Brief, deliverable, rubric ve **okuyucunun kendi puanları**
tek bir markdown dosyası olarak iner. Referans çözüm **dışa aktarılmaz** —
paket okuyucunun işidir, yazarın değil.

### Pilot — iki kurs

Yol haritası beş kurs önerdi; P6'nın usulüyle iki ile açılıyor ve ikisi de
referansı **çalıştırılabilir** kılabildiğim yerler:

| Kurs | Capstone |
|---|---|
| `database-advanced` | Kilitlemeden geçen bir şema değişikliği: canlı tabloya sütun eklemek, doldurmak ve kısıt koymak — hangi adımın hangi kilidi aldığını göstererek |
| `distributed-systems-api-design` | Bir ödeme uç noktasını yeniden denenebilir hâle getirmek: idempotency anahtarı, outbox, ve belirsiz sonucun (timeout + commit) ele alınışı |

**Referansta çıktı gösterilmez.** İlk tasarım `sql run` kullanacaktı, ama
capstone sayfası markdown pipeline'ından geçiyor; blok pipeline'ı hast kökü
istiyor ve capstone'u ona bağlamak yeni bir yüzey açardı. Kalan iki seçenekten
biri — çıktıyı elle yazmak — bu repo'da yasak: yol haritasının kendi kuralı
*"halüsine `psql` çıktısı gerçeğinden ayırt edilemez"*. Dolayısıyla v1'de
referans **statik SQL ve gerekçe** taşır, **hiçbir sonuç satırı basmaz**.

Yazarken iki referansın da SQL'i gerçek bir PostgreSQL'de (PGlite) koşuldu —
`ALTER TABLE`'ın `AccessExclusiveLock`, `SELECT FOR UPDATE`'in `RowShareLock`
aldığı ve `ON CONFLICT DO NOTHING`'in ikinci denemede sıfır satır döndürdüğü
doğrulandı. Ama koşu **CI'da tekrarlanmadığı** için çıktısı yayımlanmıyor.
Doğrulanabilir bir referans, `stamp-verify.ts`'in ders id'si olmayan bir
workspace'i kabul etmesini gerektiriyor ve o `Eklenebilecekler`'de duruyor.

## Yapılacaklar

- `modules/course_content/course_content.capstone.ts` *(yeni)* — parser + rubric
- `modules/course_content/ui/CapstonePage.tsx` *(yeni)* — sunucu bileşeni
- `modules/course_content/ui/CapstoneRubric.tsx` *(yeni)* — istemci: puanlama, mühür, dışa aktarma
- `app/courses/[courseSlug]/capstone/page.tsx` *(yeni)*
- `ui/CourseOverviewPage.tsx` — capstone varsa bağlantı
- `scripts/content-lint/rules.ts` — `capstone/unsourced-rubric-row`
- `course_content.capstone.test.ts` *(yeni)*
- İki `capstone.md`

## Kabul kriterleri

- [x] İki kursta rota açıldı (`build` **653 sayfa**, 651 + 2); `capstone.md`
      olmayan 34 kursta rota **yok** ve bağlantı görünmüyor
- [x] `parseCapstoneMarkdown` ayrı; diff'te `course_content.parser.ts` ve
      `HEADING_RULES` **yok**
- [x] 12 rubric satırının 12'si birebir; **lint kuralı bilerek bozulup
      ateşlendiği doğrulandı** — ve ilk denemem yanlış pozitif verdi
      (desen tutmamıştı), doğru desenle tekrarlanınca kural satırı ve dersi
      adıyla bildirdi
- [x] Reference Walkthrough her satır puanlanana kadar **DOM'da yok** (koşullu
      render, gizleme değil)
- [x] `progress.store.ts` **değişmedi**; `git diff modules/progress/` boş,
      altı anahtar kilidi hiç konuşmadı
- [x] Dışa aktarma brief + rubric + okuyucunun puanlarını veriyor, referansı
      **vermiyor** ve dosyanın kendi metni bunu söylüyor
- [x] Ders metni değişmedi — korpus **562'de**, `parse-snapshot.json` kımıldamıyor.
      `capstone.md` manifest'te olmadığı için `listFences`, `loadCorpus` ve
      `corpus-stats` onu hiç görmüyor (üçü de manifest'ten yürüyor, glob değil)
- [x] `content:check` (**48 dosya, 331 test** — 6'sı bu fazın), `lint`,
      `stats-check` (33 rows · 0 disagree), `build` yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Capstone bir sertifikaya dönüşür | Puan saklanmıyor, rozet yok, store'a dokunulmuyor |
| Rubric yazarın hissi olur | Her satır kursun kendi mistake lead'i; lint kuralı |
| Referans doğrulanamaz nesir olur | `sql run` ile çalıştırılabilir; iddia yerine koşu |
| Ders parser'ı kırılır | Ayrı parser; `HEADING_RULES` ellenmiyor |
| Mühür bir "cevabı aç" düğmesine döner | Her satır puanlanmadan açılmıyor — P11'in kapısı |
| İki capstone beşe baskı yapar | Pilot iki; kalanı `Eklenebilecekler`'de |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Kalan üç kurs (`security`, `business-finance-solo-ops`, `contracts-pricing-legal`) | Yol haritasının önerdiği beşin tamamı | kapsam — pilot iki; yayılma ayrı bir pas (P6/P31 usulü) |
| Alan capstone'u (`built-environment`) | P22'nin ertelediği kalem | bağımlılık — P22 bunu T2.4 kararına bağlamıştı; karar artık verildi, ama sıra pilotun sonucunu görmekte |
| Puanların saklanması | Oturumlar arası devam | **doktrin = yasak** — değişmez #4; store'un altı anahtarı kilitli |
| Path capstone'u | Beş path'in kendi teslimatı | kapsam — P23'ün tablosunda zaten duruyor ve capstone'a bağlıydı |

## Ek — `proof` tabloyu terk etti (2026-09)

"Capstone içinde `proof`" kapsama alındı ve [P35](35-verifiable-capstone.md)
oldu. Erteleme gerekçesi bir bağımlılıktı — `stamp-verify.ts` workspace'i ders
id'sine göre çözüyordu — ve P35 onu `listFences()`'ı genişletmeden çözdü:
ayrı bir tarayıcı, tek bir yol dallanması. Bu fazın en yumuşak noktası
(referansın doğrulanmaması) böylece kapandı.
