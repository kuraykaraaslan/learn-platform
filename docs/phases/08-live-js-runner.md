# P8 — Canlı TS/JS çalıştırıcı (tarayıcı sandbox)

**Efor:** ~4-5 gün · **Bağımlılık:** P0 · **Sonraki:** P9

## Kapsam — dürüst rakam

```
hiç import etmeyen TS fence : 44
  bunlardan console.log yapan : 5     ← gerçekten çalıştırılabilir olan
tarayıcı-güvenli import      : 10
```

> **44 rakamı bir *typecheck* özelliğidir, *çalıştırma* özelliği değil.**
> 39'u saf bildirimden ibaret — Run'a basınca hiçbir şey yazmaz. **44'ü açmaya
> kalkışmayın**; 39 ölü düğme, sıfır düğmeden kötüdür.

**Başlangıç kümesi yazılır, keşfedilmez:** çıktı basan 5 fence
(`architecture-design-patterns-testing/68_big_o_analysis`,
`/142_capacity_planning_estimation`, `process-soft-skills/82_estimation`,
`/77_technical_debt_prioritization`, `advanced-deep-dive-topics/103_browser_internals`)
+ `// ── dene ──` ayırıcısının altına kısa harness eklenen ~10 fence.

## `run` işareti — bedava, doğrulandı

````
sha(markdownToHtml("```typescript run\nconst a: number = 1;\n```")) = f094c2cea5155b78
sha(markdownToHtml("```typescript\nconst a: number = 1;\n```"))     = f094c2cea5155b78
````

`remark-rehype` info string'in yalnız **ilk** token'ını `className`'e koyar;
kalanı hast düğümünde `data.meta` olarak durur ve `hast-util-to-html` `data`'yı
yok sayar. **İstediğiniz kadar fence'i `run` işaretleyin, snapshot kımıldamaz.**
Korpusta bugün hiçbir fence'in meta string'i yok — namespace boş.

`course_content.fence-meta.ts`: `parseFenceMeta(meta)` → `{run, entry?, seed?, opts}`.
`course_content.fences.ts`: `Fence`'e `meta: string`. `lang` zaten `[0]` aldığı
için **`verify-code.ts` değişmeden çalışır**.

## `course_content.snippets.ts` — paylaşım zorunlu

`FILE_MARKER` ve `splitSnippetFiles()` `scripts/verify-code.ts`'ten buraya taşınır;
hem doğrulayıcı hem çalıştırıcı bunu import eder.

**Kozmetik değil:** çok dosyalı bir fence'i doğrulayıcıdan farklı bölen bir
çalıştırıcı, doğrulayıcının hiç denetlemediği kodu çalıştırır.

## Transpile: `sucrase`

| Aday | Boyut | Karar |
|---|---|---|
| `esbuild-wasm` | ~10 MB wasm | ~0 JS gönderen bir sayfada diskalifiye |
| `typescript` (zaten devDep) | ~1.2 MB gz tarayıcıda | build'de bedava, runtime'da yıkıcı |
| `@babel/standalone` | ~3 MB | hayır |
| **`sucrase`** | ~70 KB gz *(ölçülecek)* | **seçilen** |

Sucrase tip denetimi yapmaz — **doğrusu bu**: tipler build'de `verify-code.ts`
ile denetleniyor, tarayıcıda yalnız transpile ediliyor.

## Çalıştırma: opak origin iframe — Web Worker **değil**

Belirleyici argüman **origin**, thread değil.

`sandbox="allow-scripts"` (**`allow-same-origin` olmadan**) frame'e **opak origin**
verir: `document.cookie` yok, `localStorage` yok, `indexedDB` yok, `caches` yok;
aynı-origin `fetch` onun açısından cross-origin.

Bir Web Worker ise **sayfanın kendi origin'inde** çalışır — `fetch('/api/...')`
yapabilir (kimlik bilgileriyle), IndexedDB ve `caches` okuyabilir. Okuyucu kodu
**düzenleyebildiği** için bu teorik bir risk değil.

Katmanlar:
1. `<iframe srcdoc sandbox="allow-scripts">` — opak origin
2. srcdoc içinde `<meta http-equiv="Content-Security-Policy"
   content="default-src 'none'; script-src 'unsafe-inline'">` — okuyucu kodu ağa
   **hiç** çıkamaz, sızdırma tamamen kalkar. (iframe'in `csp=` attribute'ü
   yalnız Chromium'da çalışır; `<meta>` tercih edilir.)
3. Snippet srcdoc içinde `blob:` URL'li bir **iç Worker**'da çalışır — sonsuz
   döngü `worker.terminate()` ile **anında** ölür.
   *Safari'de aynı süreçteki frame'ler için event-loop izolasyonu garanti değil;
   iç worker bu yüzden şart.*
4. Ebeveynde 3 sn watchdog → `iframe.remove()`, tüm JS bağlamını yok eder.

### Çıktı yakalama

`console.log/warn/error/table` sarmalanır; sınırlı serileştirici (derinlik ≤4,
≤200 giriş, döngü-güvenli, `Error` → `stack`) ile
`postMessage({nonce, type:'log', level, parts})`. Ayrıca `window.onerror` ve
`unhandledrejection` yakalanır.

Frame opak origin olduğundan `event.origin === "null"` — **kimlik doğrulama
nonce ile yapılır**, origin ile değil.

## Editör

Zaten vurgulanmış `<pre>` üzerine bindirilmiş bir `<textarea>`. CodeMirror 6
(~350 KB) veya Monaco (~3 MB) **değil**; girişte ağaçtaki `highlight.js` ile
tembel yeniden vurgulanır.

Bilinçli ödünleşim: otomatik tamamlama ve satır içi tip hatası yok. 30 satırlık
bir doküman snippet'i için doğru karar.

Düzenlenen kaynak `progress.editors[blockId]`'de saklanır. **Geri yüklenen buffer
asla otomatik çalıştırılmaz** — Run daima açık tıklama.

## Tembel yükleme

`CodeBlock` bir `<RunMount>` basar; `CodeRunner` `next/dynamic({ssr:false})` ile
**ilk tıklamada** yüklenir, mount'ta değil. Okuyucu istemedikçe sayfa **sıfır**
çalıştırıcı byte'ı gönderir.

## Yeni lint kuralları

| Kural | Sev | Yakaladığı |
|---|---|---|
| `run/not-self-contained` | error | `RUNNABLE_ALLOWLIST` dışına import eden `run` fence'i |
| `run/no-observable-output` | error | `console.*` ve basılabilir export'u olmayan `run` fence'i — **44'ün 39'u tuzağını yakalayan kural budur** |
| `run/marker-on-unrunnable-lang` | error | `bash`/`yaml`/`java`/`dockerfile`/`hcl` üzerinde `run` |

`scripts/verify-code.ts`'e daha sıkı kademe: `missing-module`, `assumed-context`
ve `assumed-helper` **doküman için tolere edilir, `run` fence'i için ölümcüldür**.
Rapora `runnable: {total, ready, blocked}` eklenir.

## Sert kural

**Run düğmesi yalnızca gerçekten bir runtime olan yerde bulunur.** Gri düğme yok,
"yakında" yok, sahte terminal yok.

## Kabul kriterleri

- [ ] Snapshot kımıldamadı (`run` işaretleri eklendikten sonra bile)
- [ ] `run/no-observable-output` çıktı basmayan bir `run` fence'ini reddediyor
- [ ] Sandbox iframe konsolunda `document.cookie`, `localStorage`, `fetch('/')` — **üçü de başarısız**
- [ ] `while(true){}` 3 sn içinde kesiliyor, sekme donmuyor
- [ ] Kodu bozunca hata mesajı ve stack görünüyor
- [ ] Tıklamadan önce sayfa **0 byte** çalıştırıcı JS'i gönderiyor
- [ ] Düzenlenen kod sayfa yenilenince duruyor ama **otomatik çalışmıyor**
