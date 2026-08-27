# ADR 0002: Tarayıcıda kod çalıştırma — sandbox + WebContainer, sunucu yok

## Status
Proposed (2026-08-27). ADR 0001'i **geçersiz kılmaz, genişletir.**

## Context

412 dersin 412'sinde okuyucudan üretmesi istenen bir şey yok
(`docs/investigate/04-roadmap.md`). Okuyucunun kodu çalıştırıp değiştirebilmesi,
bu geri bildirim boşluğunu kapatan mekanizmalardan biri.

ADR 0001 backend, DB ve auth'u reddetti; "sıfır altyapı maliyeti, sıfır güvenlik
yüzeyi" gerekçesiyle. Kod çalıştırma bu kararla çelişebilirdi — çelişmemesi için
hangi yolun seçildiği burada kaydediliyor.

Korpusun ölçülen durumu:

| Grup | Fence | Tarayıcıda çalışır mı |
|---|---:|---|
| Hiç import etmeyen | 44 | evet — ama yalnız **5'i** `console.log` yapıyor |
| Tarayıcı-güvenli import | 10 | evet |
| WebContainer'da kurulabilen (express, next/server, vitest, zod, jwt) | **62** | evet, WebContainer ile |
| Yerel eklenti / harici sunucu (prisma 14, typeorm 11, electron 9, bullmq 6, ioredis 3, pg 2, expo 2) | 42 | **hayır** |
| Var olmayan `@/lib/*` alias'ı | 45 | **hayır, hiçbir yerde** |
| `java` (Spring Boot/JPA) | 10 | **hayır** |
| `bash` / `yaml` / `dockerfile` | 25 | **hayır** |

## Decision

**1. Saf TS/JS için opak origin iframe sandbox'ı.**
`<iframe srcdoc sandbox="allow-scripts">` — `allow-same-origin` **olmadan**.
İçeride satır içi CSP (`default-src 'none'`) ve `blob:` URL'li bir iç Worker.
Transpile `sucrase` ile tarayıcıda; **tip denetimi build'de `scripts/verify-code.ts`
ile** yapılır, tarayıcıda tekrarlanmaz.

**2. Node projeleri için WebContainer.** 62 ders için — express, `next/server`,
vitest. `@webcontainer/api` MIT'tir, ama **çalışma zamanı StackBlitz'in
barındırdığı bir servistir**, ToS'a tabidir ve kurumsal kullanımda lisans
gerektirir. Bu proje README'de *"internal course platform for interns and
employees"* olarak tanımlanıyor, yani lisanslı kategoriye giriyor.
**Bedeli: site geneli COOP/COEP.**

**3. SQL için PGlite** — gerçek Postgres, WASM. Yeni yazılan 3 veritabanı dersi
için; mevcut içeriğe açılan bir anahtar değil (korpusta yalnız 9 `sql` fence var).

**4. Çalıştırılamayanlar için Run düğmesi yoktur.** Yerine `content/_verify`
workspace'i + CI damgalı gerçek çıktı (`<!-- run:begin -->` işaretleri arası,
elle düzenlenirse build kırılır) ve okuyucunun önce tahmin ettiği bir
Predict-the-output kartı.

**5. Sayfa içi React önizleme yazılmaz.** Opak origin bir iframe ebeveynden React
import edemez; doğru mimari ikinci bir origin'dir. WebContainer bunu zaten
(Next/React projesi olarak) karşıladığı için ayrı bir önizleyici gereksiz.

**6. Tarayıcıda Java denenmez.** WebContainers Java/JVM çalıştıramaz (dokümanı
açık: yalnız *"languages natively supported on the Web — JavaScript and
WebAssembly"*). CheerpJ bir JVM'i WASM'a taşır ama çok kişilik bir ekibin şirket
içi kullanımı ticari lisans ister, ve korpustaki 10 java fence'i Spring Boot/JPA
olduğu için tarayıcıda hiçbir koşulda ayağa kalkmaz.

## Rationale

- **Neden Web Worker değil, iframe:** belirleyici argüman origin, thread değil.
  `allow-same-origin` olmadan frame opak origin alır — `document.cookie`,
  `localStorage`, `indexedDB`, `caches` yok. Bir Worker sayfanın **kendi
  origin'inde** çalışır ve kimlik bilgileriyle `fetch('/api/...')` yapabilir.
  Okuyucu kodu *düzenleyebildiği* için bu teorik bir risk değil.
  `learn.kuray.dev`'in bugün cookie'si yok — sandbox, ADR 0001 ileride revize
  edilip auth geldiğinde patlama yarıçapını küçük **tutan** şey.
- **Neden `sucrase`:** `esbuild-wasm` ~10 MB, tarayıcıdaki `typescript` ~1.2 MB gz,
  `@babel/standalone` ~3 MB. Bugün ~0 JS gönderen bir ders sayfasında hepsi
  orantısız.
- **Neden CI damgası bazı yerlerde çalıştırmaktan iyi:** çıktı git'te
  denetlenebilir, tarihlidir ve commit'e bağlıdır; ayrıca 89 fence'i sıfır client
  runtime ile kapsar.
- **Neden WebContainer yine de alınıyor:** 62 ders, sandbox'ın veremediği tek
  şey — gerçek `npm install` ve gerçek bir HTTP sunucusu.

## Consequences

**Kazanç:** okuyucu 62 derste gerçek bir Node projesini, ~15 derste saf mantığı,
3 derste gerçek Postgres'i çalıştırıp değiştirebilir. Sunucumuz yok; ADR 0001'in
"backend yok" kararı teknik olarak korunuyor.

**Kayıp / yeni yük:**
- ADR 0001'in *"sıfır üçüncü-taraf bağımlılık ve sıfır lisans"* iddiası biter.
  StackBlitz ToS ve kurumsal lisans muhasebesi bu projeye girer.
- **Site geneli COOP/COEP** her sayfanın yükleme kurallarını değiştirir.
  Bu, WebContainer fazının (P9) **ilk gün ölçülecek** en büyük riski;
  412 sayfada kırılma varsa WebContainer `/lab/<lesson>` route'una hapsedilir ve
  site geneli başlık atılmaz.
- Ders sayfası ilk yük JS bütçesi artık izlenmesi gereken bir şey
  (`scripts/check-bundle.ts`, `content:check`'e bağlı).
- java, bash, prisma, typeorm, electron dersleri hiçbir zaman çalıştırılamayacak;
  onların kalitesi P5'in CI damgasına bağlı kalır.

**Geri alınabilirlik:** her çalıştırıcı tembel yüklenen bağımsız bir adadır.
WebContainer'dan vazgeçmek `vercel.json`'daki başlıkları ve bir bileşeni silmek
demektir; içerik ve diğer 11 mekanizma etkilenmez.

## P9 uygulaması — kayda geçen iki karar (2026-08-27)

**Lisans / API key.** `NEXT_PUBLIC_WEBCONTAINER_API_KEY` — `.env.local`'da
(gitignored), `.env.example`'da yalnız boş placeholder olarak. `configureAPIKey()`
istemci tarafında çağrılmak üzere tasarlanmış (SDK'nın kendi imzası), yani
tarayıcı paketine gitmesi beklenen bir Stripe publishable-key benzeri bir
değer — sunucu tarafı bir sır değil. **Anahtarın var olması, StackBlitz'in
kurumsal ToS anlaşmasının var olduğu anlamına gelmez** — bunlar ayrı şeyler;
bu projeyi uygulayan ajan ikincisini doğrulayamadı, o, deponun sahibinin
sorumluluğunda kaldı.

**COOP/COEP: site geneli değil, `/courses/[courseSlug]/[lessonSlug]`'a
kapsamlandı.** Planın kendi ilk-gün talimatı ("başlıkları ekle, 412 sayfayı
gez, kırılma var mı ölç") bir tarayıcı gerektiriyor; onu uygulayan ajanın bu
oturumda tarayıcı otomasyonu yoktu, dolayısıyla o ölçümü yapamadı. Statik
analiz (`next/font/google` kendinden barındırılıyor, korpusta harici görsel
`0`, `<img>`/`<Image>` hiç kullanılmıyor, `@vercel/analytics` yüklü değil, tek
`@import` yerel Tailwind) COEP'in bugün görünür bir şeyi kırma ihtimalini
düşük gösteriyor, ama bu bir tarayıcı doğrulamasının yerini tutmaz. Sonuç:
planın kendi "kırılma varsa kapsamlandır" acil durum planı, ölçüm hiç
yapılamadığı için **varsayılan** olarak alındı — 412 sayfanın ~30'u (kurs
listesi, ana sayfa, API route) hiç etkilenmiyor, geri kalan ~412 ders sayfası
etkileniyor (bugün üzerlerinde tek bir `run project` bloğu olmasa bile, Next'in
statik başlık eşleştirmesi rota bazlı, sayfa içeriği bazlı değil). Gerçek bir
tarayıcı taraması yapılınca ve temiz çıkarsa, `next.config.ts`'teki `source`
deseni `/(.*)`'e genişletilebilir.

## Related
- `docs/adr/0001-no-backend-markdown-content.md` — genişletilen karar
- `docs/phases/08-live-js-runner.md`, `09-webcontainer.md`, `10-pglite-sql.md`,
  `05-ci-and-proof.md`
- [WebContainers troubleshooting](https://webcontainers.io/guides/troubleshooting) —
  desteklenmeyen diller
- [CheerpJ licensing](https://cheerpj.com/docs/licensing)
