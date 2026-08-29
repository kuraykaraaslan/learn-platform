# P6 — Quiz + ödünleşim gezgini + Broken→Fixed diff

**Efor:** ~4 gün · **Bağımlılık:** P0, P1 (`verified`), P5 (Predict önce gelir)

## Neden ve neden dikkatli

Yol haritası **"Cold Open"ı reddetti**: 412 yeni çoktan seçmeli + ~1.650
çeldirici gerekçesi yazmayı gerektiriyordu ve credibility hakemi *"doğrulama
kancası olmayan üretilmiş metin… dersin şu an yanlış bildiği şeyi sessizce
kanonlaştırır"* dedi.

Bu faz quiz'i **yeniden getiriyor**, ama o eleştiriyi karşılayan üç kısıtla.
Nicelik hedefi yok: kapsanmayan ders quiz almaz.

## 1. Quiz — `quiz` fence

```yaml
- q: "Bir idempotency key'i aynı gövdeyle iki kez gönderirseniz ne olur?"
  anchor: "keys are scoped to the API key that created them"   # ders metninde GEÇMELİ
  options:
    - text: "İkinci istek 409 döner"
      correct: false
      why: "409 çakışma içindir; aynı gövdeyle replay çakışma değildir."
    - text: "İlk yanıtın gövdesi cache'ten döner"
      correct: true
      why: "Anahtar ilk yanıtı saklar; aynı gövde aynı sonucu almalıdır."
```

### Üç kısıt — hepsi build'de zorlanır

1. **Yalnız `verified: true` derslerde yayımlanır.**
2. **`anchor` zorunlu ve dersin kendi metninde birebir geçmeli.** Doğru cevap
   dersin söylediği bir cümleye bağlanmak zorunda; bağlanamıyorsa o soru dersin
   içeriğinden değil, modelin hayalinden gelmiştir.
3. **Ders başına en fazla 3 soru.**

Her seçeneğin `why` alanı **zorunlu** — yanlış seçenekler de neden yanlış
olduğunu söylemek zorunda, aksi hâlde quiz bir tahmin oyunudur.

| Kural | Sev | Yakaladığı |
|---|---|---|
| `quiz/unanchored-answer` | error | `anchor` ders metninde geçmiyor |
| `quiz/max-three` | error | derste 3'ten fazla soru |
| `quiz/missing-why` | error | `why` alanı olmayan seçenek |

## 2. Ödünleşim gezgini — `tradeoff` fence

206 derste ikili seçim/ödünleşim geçiyor; ~70'i gerçek bir karar
(saga orchestration/choreography, optimistic/pessimistic, RS256/HS256).

Yol haritası bu fikri (#8) *"cevap anahtarının kendi yazarı tartışılabilir
diyor"* diye ertelemişti. Çözüm: **doğru cevap yok.**

Okuyucu bir taraf seçer → iki tarafın da **hangi koşulda kazandığı** açılır.
Sol sütun **sayılabilir sinyal** (T2.2 kuralı: ya sayıyı yayımlayan dokümana
link, ya onu üreten komut), his değil.

```yaml
question: "Saga: orchestration mı choreography mi?"
sides:
  - name: "Orchestration"
    wins_when:
      - signal: "adım sayısı > 5"
      - signal: "telafi sırası iş kuralına bağlı"
  - name: "Choreography"
    wins_when:
      - signal: "servis sahipliği ekiplere dağılmış"
      - signal: "adımlar arası kuplaj maliyeti > koordinasyon maliyeti"
```

**Puan yok, "yanlış" yok.** Amaç seçtirmek değil, seçimin hangi sinyale
dayandığını görünür kılmak.

## 3. Broken → Fixed diff — `ui/DiffCard.tsx`

Korpusun ana öğretim kalıbı zaten bu: yanlış sürüm ve doğru sürüm aynı fence'te.
Doğrulayıcının `shows-variants` defekt sınıfı **tam olarak bunu tanıyor** —
duplicate identifier'lar hata değil, kasıt.

`DiffCard` iki sürüm arasında geçiş yapan bir kontrol + değişen satırların
vurgulanması sunar. **Yeni içerik yazmadan** mevcut kalıbı görünür kılar.

Fence meta'sıyla işaretlenir: ```` ```typescript diff=broken|fixed ````, ya da
tek fence içinde `// ── broken ──` / `// ── fixed ──` ayırıcılarıyla.

## Payload biçimi

`quiz`/`tradeoff` gövdeleri `yaml@^2` ile **build zamanında** ayrıştırılır ve Zod
ile doğrulanır. Widget'a ayrıştırılmış nesne gider → **client maliyeti sıfır
byte** (YAML parser tarayıcıya inmez). Bozuk payload → `widget/invalid-payload`
build hatası.

## Kabul kriterleri

- [x] `verified` olmayan derste quiz görünmüyor — üçlü koşul P1'inkiyle aynı desende
- [x] `anchor`'ı metinde geçmeyen quiz build'i kırıyor — `quiz/unanchored-answer`
      lint kuralı (`scripts/content-lint/rules.ts:676`), hâlâ aktif
- [x] `why` alanı olmayan seçenek build'i kırıyor — `quiz/missing-why` lint kuralı
      (satır 651), hâlâ aktif
- [x] Ders başına 4. soru build'i kırıyor — `quiz/max-three` lint kuralı
- [x] Tradeoff kartında "doğru/yanlış" ya da puan yok — `TradeoffCard.test.ts` +
      `course_content.tradeoff.test.ts` yeşil (6 test toplam)
- [x] YAML parser client bundle'a girmiyor — quiz/tradeoff parse işi sunucu
      tarafında (`course_content.quiz.ts`/`.tradeoff.ts`), client bileşenleri
      yalnız hazır veriyi render ediyor
- [x] İlk yük JS bütçesi — orijinal ≤5 KB gz iddiası ship anında ölçülmüştü,
      bileşenler o zamandan beri değişmedi

Not: `course_content.blocks.ts`'in `QuizQuestion` re-export eksikliği yüzünden
`next build` bir kez kırılmıştı (bu oturumun özetinde kayıtlı) — o zamandan beri
`npm run build` P5'in CI adımına eklendi, bu sınıf hata artık her push'ta yakalanıyor.
