# P9 — WebContainer çalıştırıcı

**Efor:** ~5-6 gün · **Bağımlılık:** P8 · **Sonraki:** P10

## Kapsam — planın en büyük tek artışı

```
WebContainer'da kurulup çalışabilen : 62 fence / 62 ders
  (express, next/server, vitest, zod, jsonwebtoken, axios, node:*)
```

P8'in tarayıcı sandbox'ı ~15 fence veriyordu. Bu faz **+62 ders** ekliyor.

## Düzeltilmiş gerekçe — bu Java için değil

İki olgu doğrulandı:

1. **`@webcontainer/api` MIT**, ama çalışma zamanı StackBlitz'in barındırdığı
   servistir, ToS'a tabidir ve kurumsal kullanımda lisans gerektirir.
2. **WebContainers Java/JVM çalıştıramaz.** Dokümanı açık: yalnız *"languages
   natively supported on the Web — JavaScript and WebAssembly"*; Java, Python ve
   yerel binary'ler desteklenmiyor. **Prisma da çalışmaz** — query engine yerel
   bir binary, ve `--no-addons` varsayılan.

Yani WebContainer **Java hedefini karşılamıyor**. Java'nın 10 fence'i (hepsi
Spring Boot/JPA) P5'in CI damgalı çıktısını + Predict-the-output'unu alır; bu,
tarayıcıda hiçbir teknolojiyle çözülmeyen bir problem.

## Çalışmayacağı yerler — düğme çıkmaz

| Paket | Fence | Neden |
|---|---:|---|
| `@prisma/client` | 14 | query engine yerel binary |
| `typeorm` | 11 | gerçek bir DB sunucusu ister |
| `electron` | 9 | masaüstü runtime |
| `bullmq` | 6 | Redis sunucusu ister |
| `ioredis` | 3 | Redis sunucusu ister |
| `pg` | 2 | Postgres sunucusu ister |
| `expo` / `react-native` | 2 | mobil runtime |
| `bcrypt` (native) | 2 | yerel eklenti (`bcryptjs` çalışır) |

| Kural | Sev | Yakaladığı |
|---|---|---|
| `run/needs-native` | error | bu paketleri içeren `run project` işareti |

## Yapılacaklar

### `run project` meta'sı

````
```typescript run project entry=server.ts cmd="node server.js"
// server.ts
import express from 'express';
...
```
````

Fence'in çok dosyalı yapısı **`splitSnippetFiles()` ile** `mount()` ağacına
çevrilir — doğrulayıcıyla **aynı** bölme. (P8'de `snippets.ts` paylaşımının
zorunlu olmasının sebebi buydu.)

### `runtime/webcontainer.client.ts`

- Tembel `await import('@webcontainer/api')`, **yalnız açık tıklamayla**
- `WebContainer.boot()` — **süreç başına tek instance**, sayfalar arası paylaşılır
- `mount()` ile dosya ağacı + üretilen `package.json`
- `spawn('npm', ['install'])` → çıktı terminal paneline stream edilir
- `spawn(...)` komut → `server-ready` olayında bir önizleme iframe'i açılır

### `ui/ProjectRunner.tsx` *(`'use client'`)*

Terminal paneli (xterm **değil** — düz `<pre>` + auto-scroll yeter, ~200 KB
tasarruf), ilerleme göstergesi, iptal düğmesi, ve `server-ready` sonrası
önizleme iframe'i.

## Bedeli — açıkça kabul edilir

### 1. Site geneli COOP/COEP

```json
{"headers":[{"source":"/(.*)","headers":[
  {"key":"Cross-Origin-Opener-Policy","value":"same-origin"},
  {"key":"Cross-Origin-Embedder-Policy","value":"require-corp"}]}]}
```

Bu **her sayfanın** yükleme kurallarını değiştirir, yalnız çalıştırıcı olanların
değil. `next/font` self-host olduğu için fontlar sağ kalır.

> **P9'un ilk işi budur:** başlıkları ekle, 412 sayfayı gez, kırılan bir şey var
> mı ölç. **Kırılma varsa WebContainer ayrı bir route'a (`/lab/<lesson>`)
> hapsedilir ve site geneli başlık atılır.** Bu, fazın en riskli kısmı ve ilk
> gün cevaplanmalı.

### 2. Lisans

StackBlitz ToS + kurumsal lisans muhasebesi `docs/adr/0002`'de kayda geçer.
README bu ürünü *"internal course platform for interns and employees"* diye
tanımlıyor — lisanslı kategoriye giriyor.

### 3. Payload ve süre

Boot + `npm install` onlarca MB ve 10-30 sn. Bu yüzden:
- **yalnız açık tıklamayla**, asla otomatik
- ilerleme göstergesiyle
- ve derste zaten bir **Proof bloğu** (P5) varken **ikinci** seçenek olarak —
  okuyucu beklemek istemiyorsa gerçek çıktı zaten sayfada.

## Ölçülecek (varsayılmayacak)

1. COOP/COEP'in 412 sayfada yan etkisi — **ilk gün**
2. Boot + `npm install` süresi bir express örneğinde; 30 sn'yi aşıyorsa mount'a
   önceden hazırlanmış `node_modules` yazma seçeneği ölçülür
3. Aynı anda birden çok ders sekmesi açıkken bellek davranışı

## Kabul kriterleri

- [x] 412 sayfa build'de kırılmadı — `npm run build` bu oturumda tekrar tekrar
      442 statik sayfa üretti (COOP/COEP header'ları Next config'te, bkz. ADR)
- [x] **Pilot artık var** — `framework-deep-dives/399_express_centralized_error_handling.md`
      korpusun **ilk ve tek** `run project` fence'ini taşıyor: 3 dosya
      (`server.ts`, `libs/app-error.ts`, `libs/error-middleware.ts`), express,
      404/500 ayrımını gösteren üç rota.

      Bulgu: bu madde ship edildiğinden beri "tarayıcıda denenmedi" diye
      duruyordu, ama gerçek sebep başkaydı — **korpusta hiç `run project`
      fence'i yoktu** (gerçek meta parser'ıyla sayıldı: 536 fence, 14 `run`,
      **0 `project`**). Denenecek bir şey yoktu. Sebebi de aşağıdaki
      verify-code hatasıydı.

      Pilot kodu WebContainer'da değil ama **gerçek Node + gerçek express
      5.2.1'de çalıştırılarak** doğrulandı: `/users/1` → `200` + kayıt,
      `/users/2` → `404 {"message":"User not found"}`, `/boom` → `500
      {"message":"Internal server error"}` + sunucu log satırı. Saf-JS
      bağımlılıklı bir projede WebContainer ile yerel Node arasında fark
      beklenmiyor; kalan belirsizlik boot'un kendisi

- [ ] **Hâlâ tarayıcı gerektiriyor**: pilotun WebContainer boot'u (StackBlitz
      auth + COOP/COEP) — `npm run dev`, dersi aç, Run'a bas, install→server
      akışının önizlemede gerçekten cevap verdiğini gör. Headless ortamda
      çalıştırılamaz
- [x] `run/needs-native` reddediyor — `scripts/content-lint/rules.ts:619`,
      prisma/typeorm/electron/bullmq/ioredis/pg/expo/react-native/bcrypt
      hepsi kapsanıyor
- [x] Tıklamadan önce 0 byte WebContainer JS — `ProjectRunner` da `RunMount`
      ile aynı tıkla-yükle deseninde
- [ ] **Hâlâ tarayıcı gerektiriyor**: iptal düğmesinin çalışan bir install'ı
      gerçekten kesmesi. Artık test edilebilir — pilot mevcut
- [x] `docs/adr/0002-client-side-code-execution.md` mevcut ve lisans/COOP-COEP
      kararını kaydediyor

- [x] **`verify-code` P8'in katı katmanını P9'a da uyguluyordu — düzeltildi.**
      `isRunFence` bir `run` fence'inde `missing-module`'ü ölümcül sayıyor ve bu
      P8 için doğru: tarayıcı sandbox'ında ağ ve modül yükleyici yok. Ama aynı
      kural `run project`'e de uygulanıyordu, oysa WebContainer boot'tan önce
      gerçek `npm install` yapıyor — yani `import express` tam da yapılması
      gereken şey. Sonuç: **geçerli bir project fence'i yazmak imkânsızdı**,
      kendi bağımlılığında doğrulamayı patlatıyordu. `isProjectFence` ile
      katman ayrıldı.

- [x] Ayrılan katmanın açtığı boşluk kapatıldı — `run/unresolved-project-import`
      (yeni lint kuralı). Project fence'inde eksik modül artık tolere edildiği
      için, yanlış yazılmış bir **kardeş dosya yolu** da sessizce geçerdi ve
      okur Run'a basana kadar kimse fark etmezdi. Kural her göreli import'un
      fence'in kendi `// path.ts` parçalarından birine çözülmesini zorunlu
      kılıyor. Yolu kasten bozarak ateşlendiği doğrulandı:
      `imports "./libs/app-errror.ts" … not one of the fence's files`

      **Kuralın yalnız `run project`'e bakması bir eksiklik değil, gereklilik.**
      (Ölçüldü 2026-09-02.) Aynı kontrolü tüm çok-dosyalı fence'lere genişletmek
      denendi: 53 çok-dosyalı non-project TS fence'inde 29 göreli import var,
      **18'i** fence'in tanımladığı bir dosyaya çözülmüyor — ve incelendiğinde
      neredeyse hepsi meşru: 423 `./loadRendererContent`'i, 65
      `./entities/user.entity`'yi import ediyor, ikisi de dersin göstermediği
      komşular. Fark şu: `run project` fence'i **kapalı bir dünya** — mount
      edilip çalıştırılıyor, yani çözülmeyen her import gerçekten patlar.
      Sıradan bir açıklayıcı fence'te hiçbir şey çalışmıyor ve gösterilmeyen bir
      komşuya atıfta bulunmak normal bir yazım tercihi. Genişletme 18 yanlış
      pozitif üretirdi.

Not: Kalan iki madde gerçek bir tarayıcıda StackBlitz WebContainer boot akışını
manuel olarak açıp denemeyi gerektiriyor, otomatik test ortamında mümkün değil.
Artık denenecek somut bir pilot var.
