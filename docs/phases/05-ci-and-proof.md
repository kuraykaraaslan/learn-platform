# P5 — CI + Proof bloğu + Predict-the-output

**Efor:** ~4 gün · **Bağımlılık:** P1 (`verified` kapısı) · **Sonrakiler:** P6

## Neden

Korpusun ~89 kod fence'i tarayıcıda **hiçbir zaman** çalışmayacak: prisma (14),
typeorm (11), electron (9), bullmq (6), ioredis (3), pg (2), expo (2), java (10),
bash (12), yaml (12) ve var olmayan `@/` alias'ını import eden 45 fence.

Bunlara Run düğmesi koymak yalan olur. Karşılığı: **CI'ın ürettiği gerçek çıktı**
ve okuyucunun onu görmeden önce tahmin etmesi.

Bu, yol haritasının credibility hakemince **9.5 ile listenin başına** konan
kalem. Ve çalıştırıcılardan önce gelmesinin sebebi: 89 fence'i kapsıyor
(P8'in ~15'ine karşı) ve **sıfır client runtime** istiyor.

## Ön koşul — bu repoda CI yok

Doğrulandı: `.github/` dizini yok, `prebuild` script'i yok, `vercel.json`
`{"framework":"nextjs"}`'den ibaret. Yani README'nin *"both gates run with
--strict and a regression fails the build"* iddiası **bugün doğru değil** —
kapılar elle çalışıyor.

### `.github/workflows/content.yml` *(yeni)*

```yaml
on: [push, pull_request]
jobs:
  content:
    steps:
      - npm ci
      - npm run content:check        # lint + verify-code + test
      - npx tsx scripts/check-bundle.ts
      - npx tsx scripts/stamp-verify.ts --check   # damgalı çıktı hâlâ üretiliyor mu
```

## `content/_verify/<course>/<id>/` — gerçek workspace

`vitest.config.ts` bu dizini **zaten dışlıyor** (`exclude: ['content/_verify/**']`)
— kanca hazır, dizin henüz yok.

Her giriş: `package.json`, kaynak, ve çalıştırılacak komut. Dalga-1'in ~10 dersi
ile başlanır; yol haritasının feasibility hakemi tam workspace'i reddettiği için
**ölçek kasıtlı olarak dar**.

## `scripts/stamp-verify.ts` *(yeni)*

Komutu çalıştırır ve **gerçek stdout'u** ders dosyasına yazar:

```markdown
<!-- run:begin sha=a1b2c3 at=2026-08-27 commit=3391c15 -->
$ npx vitest run libs/crypto/constant-time.test.ts
 ✓ farklı uzunluktaki girdilerin süre dağılımları ayırt edilemez (312ms)
<!-- run:end -->
```

`--check` modu CI'da: çıktıyı yeniden üretir ve işaretler arasındaki byte'larla
karşılaştırır.

| Kural | Sev | Yakaladığı |
|---|---|---|
| `verify/hand-edited-output` | error | `run:begin`/`run:end` arası byte'lar kayıtlı sha ile uyuşmuyor |

**İnsan eli işaretlerin arasına değerse build kırılır.** Korpusun kendisi
hakkında yalan söylemesi CI'ı kırmızıya çevirir.

## Render

Proof bloğu bir `<pre>` olarak, üstünde sabit bir etiket:

> **Gerçek çıktı** — CI tarafından 27 Ağu 2026, commit `3391c15` ile üretildi.

**Asla bir Run düğmesi değil.** Gri düğme yok, "yakında" yok.

## `ui/PredictOutputCard.tsx` *(`'use client'`)*

1. Komut görünür, çıktı gizli.
2. Okuyucu ne beklediğini yazar (textarea).
3. "Göster" — CI damgalı gerçek çıktı açılır, yan yana.
4. Öz-değerlendirme: *Tuttu / Yarım / Kaçırdım*.

**Bu, korpustaki en yüksek bütünlüklü soru-cevap biçimidir**, çünkü cevabı bir
yazar değil **CI üretir** — uydurma yapısal olarak imkânsız. P6'nın quiz'inden
önce gelmesinin sebebi budur.

## Kapsam

| Grup | Fence | Ne alır |
|---|---:|---|
| java (Spring Boot/JPA) | 10 | Proof + Predict |
| bash | 12 | Proof + Predict |
| prisma/typeorm/electron/bullmq/ioredis/pg/expo | 42 | Proof + Predict |
| var olmayan `@/` alias'ı | 45 | **yalnız Failure Drill** — kod hiçbir yerde çalışmaz, proof da üretilemez |

## Kabul kriterleri

- [x] CI kuruldu ve `content:check` her PR'da çalışıyor — `.github/workflows/content.yml`,
      bu oturumda 29 push'ın tamamında gerçek CI yeşili doğrulandı (`gh run watch`)
- [ ] **Kısmi**: 3 derste `content/_verify` girdisi var (`fundamentals-tools/123,126,139`),
      hedef ~10'du — mekanizma kanıtlanmış durumda (CI'da `stamp-verify.ts --check`
      her push'ta çalışıyor ve gerçek çıktıyı yeniden üretiyor) ama kapsam genişletilmedi.
      Daha fazla proof dersi eklemek ayrı, kendi başına bir iş kalemi
- [x] İşaretler arası elle düzenleme build'i kırıyor — orijinal ship sırasında hem
      temiz geçiş hem kasıtlı bozma test edildi (bkz. bu oturumun özetindeki
      "stamp-verify.ts check-mode logic bug" düzeltmesi ve doğrulaması)
- [x] Proof bloğu tarih + commit sha ile etiketli — mevcut 3 proof bloğunun
      hepsinde `sha=... at=... commit=...` formatı var
- [x] Çalıştırılamaz fence'te Run düğmesi yok — `verify-code.ts`'in "clean/tolerated"
      ayrımı bunu zorluyor, `content:verify-code` hâlâ yeşil
- [x] Predict kartı 15 karakter kuralı — `PredictOutputCard.test.ts` yeşil
- [x] İlk yük JS bütçesi — orijinal ≤3 KB gz iddiası ship anında ölçülmüştü,
      `PredictOutputCard` bileşeni o zamandan beri değişmedi
