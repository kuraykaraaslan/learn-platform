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
- [ ] **Doğrulanamadı**: 62 dersin pilotu (bir express dersi) uçtan uca
      install → server → istek/yanıt akışı gerçek bir tarayıcıda hiç açılıp
      denenmedi bu oturumda — `ProjectRunner.test.ts` birim seviyesinde yeşil
      ama tam WebContainer boot'u (StackBlitz auth/COEP) manuel tarayıcı testi
      gerektiriyor, headless ortamda çalıştırılamaz
- [x] `run/needs-native` reddediyor — `scripts/content-lint/rules.ts:619`,
      prisma/typeorm/electron/bullmq/ioredis/pg/expo/react-native/bcrypt
      hepsi kapsanıyor
- [x] Tıklamadan önce 0 byte WebContainer JS — `ProjectRunner` da `RunMount`
      ile aynı tıkla-yükle deseninde
- [ ] **Doğrulanamadı**: iptal düğmesinin çalışan bir install'ı gerçekten
      kesmesi de gerçek tarayıcı testi gerektiriyor
- [x] `docs/adr/0002-client-side-code-execution.md` mevcut ve lisans/COOP-COEP
      kararını kaydediyor

Not: Bu iki madde ("Doğrulanamadı") bu oturumun kapsamı dışında kaldı —
gerçek bir tarayıcıda StackBlitz WebContainer boot akışını manuel olarak
açıp denemek gerekiyor, otomatik test ortamında mümkün değil.
