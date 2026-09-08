# P36 — Rubric yalnız korpusun arkasında durduğu şeyi ölçebilir

**Efor:** ~1 gün · **Bağımlılık:** P34, P35 · **Sonrakiler:** capstone'un yayılması

## Neden

Bu faz bir keşiften doğdu ve keşif benim kendi işimde çıktı.

P34 iki capstone yayımladı; rubric satırlarının kursun kendi Common Mistakes
lead'lerinden **birebir** geldiğini bir lint kuralı ve bir testle garanti
etti. P35 referansların iddialarını CI'da koşar hâle getirdi. İkisi de bir
soruyu hiç sormadı: **alıntılanan ders doğrulanmış mı?**

Ölçüldü. 12 rubric satırının **8'i** `HARM_DENYLIST`'teki derslerden geliyor:

| Capstone | Satır | Ders | Durum |
|---|---:|---:|---|
| `database-advanced` | 5 | 41, 43 | **denylist** |
| `distributed-systems-api-design` | 3 | 7 | **denylist** |

`stamp-verified.ts`'in o listeye koyduğu yorum ne yaptığımı tam olarak
anlatıyor: *"a drill inherits the correctness of the content it sits on, and a
wrong mitigation drilled into a reader's memory is worse than one merely
read."* Bir rubric satırı okuyucudan kendi teslimatını o maddeye göre
puanlamasını istiyor — bu bir okuma değil, bir alıştırma.

Değişmez #3 ("doğrulanmamış derste alıştırma açılmaz") lafzen dersin **kendi
sayfasını** düzenliyor ve capstone başka bir sayfa. Ama kuralın gerekçesi
sayfaya değil içeriğe bakıyor, ve bu repo her emsalde muhafazakâr okumayı
seçti (P24'ün `#541`'i, P17'nin `#478`'i, "gri düğme yok"). Aynısı burada.

## Karar

**Bir rubric satırı yalnız `verified: true` olan bir dersi alıntılayabilir.**

Sonucu açıkça kabul ediyorum: capstone'un konusu, uzman pasosu bekleyen bir
dersin konusuysa, rubric o dersi ölçemez. Görev aynı kalır, referans aynı
kalır — **ölçüt**, korpusun arkasında durduğu maddelerden kurulur. Bu bir
kayıp değil bir dürüstlük: rubric, kursun gözden geçirilmemiş içeriğine göre
değil, savunduğu içeriğe göre puanlıyor.

## Kapsam

### Lint — `capstone/rubric-cites-unverified` (error)

`capstone/unsourced-rubric-row`'un yanına. Satırın `lesson`'ı manifest'te
`verified: true` değilse hata. Mekanik, kaçılamaz, ve bir ders denylist'ten
çıkarsa kural kendiliğinden gevşer.

### Sekiz satır yeniden kaynaklandı

**`database-advanced`** — beş satır çıktı (41, 43), yerine doğrulanmış
derslerden beşi geldi:

| Yeni satır | Ders | Neden bu görev için doğru |
|---|---:|---|
| "Running tenant migrations without verification" | 50 | Planın üretim şeklindeki veriye karşı denenmesi |
| "`WHERE deleted_at IS NULL` in some queries but not all" | 44 | İki deploy arasındaki asıl tehlike: bazı kod yolları yeni sütunu okur, bazıları okumaz |
| "Never testing restores" | 49 | Geri dönüş konumu, denenene kadar bir iddiadır |
| "Growing table size from never cleaning up" | 44 | Toplu doldurmanın ürettiği şişme |
| "Pessimistic locking outside a transaction" | 42 | Kilidin kapsamı |

**`distributed-systems-api-design`** — üç satır çıktı (7), yerine:

| Yeni satır | Ders | Neden bu görev için doğru |
|---|---:|---|
| "Catching and silencing circuit open errors" | 4 | Belirsiz sonucu yutan yeniden deneme |
| "Leaving \\"provisioning\\" status entities unmonitored" | 15 | Tam olarak `in_progress` kalan satırlar — görevin en zor yarısı |
| "Assuming eventual consistency means \\"probably consistent\\"" | 15 | Bir `200`'ün ne iddia ettiği |

İkinci tablodaki orta satır dikkate değer: kısıt rubric'i **zayıflatmadı**,
görevin en zor yarısını (belirsiz sonuç) daha iyi ölçen bir maddeye
yönlendirdi.

### Sayfada bir cümle

Capstone sayfası zaten "her satır bu kursun belgelediği bir hata" diyor; buna
"ve korpusun arkasında durduğu bir dersten" ekleniyor — okuyucu ölçütün
nereden geldiğini bilsin.

## Kabul kriterleri

- [x] `capstone/rubric-cites-unverified` **error** olarak doğdu ve eklendiği
      anda **8 bulgu** verdi — kural yazıldığı için değil, ihlal gerçek olduğu
      için. Yeniden kaynaklamadan sonra sıfır; bir satır `43`'e çevrilerek
      bilerek bozulunca yeniden ateşledi
- [x] 12 rubric satırının 12'si `verified: true` ders alıntılıyor
      (50, 44, 42, 42, 49, 44 · 4, 4, 14, 14, 15, 15)
- [x] Birebir sözleşmesi hâlâ geçerli — `capstone/unsourced-rubric-row` temiz,
      yani yeni lead'ler de kelimesi kelimesine kursun kendi maddeleri
- [x] Altı `looks_like` sıfırdan yazıldı; eski satırın metni yeni satıra
      taşınmadı
- [x] Capstone brief'i, deliverable'ı ve Reference Walkthrough'u **değişmedi**;
      `stamp-verify --check` **34/34** — referans proof'ları etkilenmedi
- [x] `content:check` (**48 dosya, 336 test** — biri bu fazın),
      `lint`, `stats-check` (33 rows · 0 disagree), `build` (653 sayfa) yeşil;
      `parse-snapshot.json` kımıldamadı

## Risk

| Risk | Azaltma |
|---|---|
| Rubric konudan uzaklaşır | Her yeni satır için "neden bu görev için doğru" yazılı; ikisi de aynı teslimatı ölçüyor |
| Kural fazla katı olur | Bir ders denylist'ten çıkınca kural kendiliğinden gevşer; sabit liste yok |
| Aynı hata başka bir yerde tekrarlanır | Kural mekanik ve capstone'un tamamını tarıyor |
| Eski `looks_like` metni yeni satıra yapıştırılır | Kabul kriteri; her biri yeniden yazıldı |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| Capstone'un kalan üç kursa yayılması | Yol haritasının önerdiği beşin tamamı | kapsam — önce bu kural yerleşti; `security`'nin üç dersi denylist'te ve o kursun capstone'u bu kısıtla tasarlanmalı |
| Denylist derslerinin uzman pasosu | 20 dersin kilidinin açılması | uzman pasosu — bu repo'nun dışında bir karar; 2'si avukat, 1'i muhasebeci istiyor |
| Rubric satırının kaynak dersine bağlantı | Okuyucunun maddeyi okuyabilmesi | kapsam — satır zaten ders numarasını gösteriyor; bağlantı ayrı bir UI kararı |
