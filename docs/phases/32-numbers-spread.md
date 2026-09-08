# P32 — Numbers'ın yayılması: PostgreSQL'in dışına, ve çalıştırılabilir olanı çalıştırmaya

**Efor:** ~3 gün · **Bağımlılık:** P31 · **Sonrakiler:** yayılmanın devamı

## Neden

P31 mekanizmayı kurdu ve **dört derste** açtı — dördü de PostgreSQL. Kendi
`Eklenebilecekler` tablosu sıradakini yazdı: *"yayılma: Node/HTTP zaman
aşımları, Redis, JVM — kapsam: pilot dört ders; yayılma ayrı bir pas
(P6'nın usulü)."* Bu o pas.

İki sebep var ve ikincisi daha önemli.

**Birincisi kapsam.** Dört ders, 562'nin içinde. Yol haritasının teşhisi
("korpus ödünleşimleri sıfatla öğretiyor") dört derste düzeldi.

**İkincisi mekanizmanın sınırını denemek.** P31'in en iyi kısmı `#42`'nin
proof'uydu: varsayılan alıntılanmadı, çalışan bir PostgreSQL'den okundu.
O numara yalnız Postgres'e mi özgü, yoksa başka yığınlarda da yapılabilir mi?
Node için yapılabilir ve bu faz onu yapıyor: `http.createServer()` çağırıp
sunucunun kendi zaman aşımlarını basan bir `proof`. Redis ve Kubernetes için
**yapılamaz** — CI'da ne Redis ne kube-apiserver var — ve orada kural
P31'inkine geri düşer: numaralı dokümana link.

Bu ayrım kayda değer, çünkü bir sonraki yayılma pasında ilk sorulacak soru
budur: **bu yığının varsayılanı koşturulabilir mi?**

## Kapsam

**Yeni ders yok.** Beş mevcut ders bir `numbers` fence'i alır; biri ayrıca
bir `proof`, biri bir seedsiz `sql run`.

| Ders | Tablo | Kaynak | Runtime |
|---|---|---|---|
| `#401` SSE / socket.io | `keepAliveTimeout`, `headersTimeout`, `requestTimeout`, `server.timeout` | **koşu** | **`proof`** (Node) |
| `#4` circuit breaker / retry | `Agent.keepAlive`, `Agent.maxSockets`, `fetch`'in zaman aşımı | koşu + doküman | — |
| `#20` Redis önbellek | `maxmemory`, `maxmemory-policy` | doküman (redis.io) | — |
| `#59` Kubernetes | `terminationGracePeriodSeconds`, kaynak istekleri, `restartPolicy` | doküman (kubernetes.io) | — |
| `#17` indeks stratejisi | `maintenance_work_mem`, `max_parallel_maintenance_workers` | koşu | seedsiz `sql run` |

**`#401` bu fazın en iyi eşleşmesi.** Node'un `requestTimeout` varsayılanı
5 dakika ve SSE bağlantısı saatlerce açık kalmak ister; `keepAliveTimeout` 5
saniye ve önündeki yük dengeleyicinin boşta kalma süresi tipik olarak daha
uzun — ikisi de tam bu dersin konusunu bozar. Ders bugün ikisinden de söz
etmiyor.

**`#4`'ün satırı bir yokluğu bildiriyor.** `fetch`'in **varsayılan zaman
aşımı yoktur**. Bir yeniden deneme (retry) dersinin sessiz varsayımı, zaman
aşımının var olduğudur; yoksa yeniden deneme hiç başlamaz. `default` sütunu
`—` yazılır (yayımlanmış bir varsayılan yok, çünkü varsayılan **yok**) ve
`measure` okuyucuya `AbortSignal.timeout()`'u gösterir.

### `content/_verify/framework-deep-dives/401/` *(yeni)*

`proof`: `http.createServer()` ile bir sunucu nesnesi kurar ve
`keepAliveTimeout`, `headersTimeout`, `requestTimeout`, `timeout`,
`maxRequestsPerSocket` alanlarını basar; ardından `new http.Agent()` ile
giden tarafın `keepAlive` ve `maxSockets` varsayılanlarını. Sıfır bağımlılık,
ağ yok, port dinlemiyor — nesne kuruluyor, alanları okunuyor, kapatılıyor.
Determinizm: değerler Node'un kendi kaynağındaki sabitler; sürüm çıktıda
basılmaz (sürüm değişince sayı değişirse **kırmızıya dönmesi** istenen
davranış).

## Kaynak kuralı — P31'inkine bir satır eklenir

- Koşturulabilen varsayılan **koşturulur** (`#401`, `#17`).
- Koşturulamayan varsayılan numaralı/sürümlü dokümana linklenir (`#20`, `#59`).
- Hiçbiri yoksa satır `—` yazar ve `measure` okuyucunun kendi sayısını nasıl
  bulacağını söyler.
- **Ürün karşılaştırması yok**: tablo bir yığının varsayılanını anlatır,
  başka bir yığından üstün olduğunu değil.

## Kabul kriterleri

- [x] Beş derste `numbers` fence'i; widget sayısı 4 → **9**
- [x] 16 satırın her biri ya `source` linkli ya `—`; her `measure` komut ya
      link — iki lint kuralı sıfır bulgu veriyor
- [x] `#401` proof'u damgalı (`proof` 31 → 32), sıfır bağımlılık, **hiçbir
      port dinlenmiyor** (nesne kuruluyor, alanları okunuyor, kapatılıyor),
      iki koşuda md5-aynı
- [x] Proof yazarken beklenmedik bir şey çıktı ve tabloya girdi:
      `http.globalAgent.keepAlive` **true**, `new http.Agent().keepAlive`
      **false**. Yani `maxSockets`'i sınırlamak için bir agent kuran kişi
      bağlantı yeniden kullanımını sessizce kapatıyor. Bu satır alıntıdan
      gelmedi, koşudan geldi
- [x] `#17`'nin seedsiz `sql run`'ı koşuldu; çıktısı `setting` 0 /
      `boot_val` 2 gösterdi (PGlite tek iş parçacıklı) ve bu **derse eklendi**:
      `boot_val` yazılımın varsayılanı, `setting` konuştuğun sunucunun değeri
- [x] Yeni ders yok — korpus **562'de sabit**; beş ders düzenlendi
- [x] `content:check` (320 test), `lint`, `concepts-check`, `stats-check`
      (33 rows · 0 disagree), `build` (615 sayfa) yeşil; `snapshot-diff`
      **5 explained · 0 unexplained**

## Risk

| Risk | Azaltma |
|---|---|
| Koşturulamayan varsayılan uydurulur | Doküman linki zorunlu (lint `numbers/unsourced-default`) |
| Node sürümü varsayılanı değiştirir | Proof CI'da koşuyor; değişirse kırmızı, ki istenen budur |
| Tablo ürün kıyaslamasına döner | Kaynak kuralına satır eklendi: yığının varsayılanı, üstünlüğü değil |
| Proof ağ açar ve kararsızlaşır | Sunucu nesnesi kuruluyor, `listen` çağrılmıyor |
| Yayılma baskısı kalanı zorlar | Beş ders; devamı yine ayrı bir pas |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| JVM / .NET varsayılanları | Aynı tablo başka runtime'larda | kaynak — korpusta o yığınların dersi yok; ders olmadan tablo asılacak yer yok |
| Nginx / yük dengeleyici boşta kalma süreleri | `keepAliveTimeout` eşleşmesinin öteki yarısı | kapsam — korpusta proxy yapılandırma dersi yok; `#401` sınırı nesirde beyan ediyor |
| Tarayıcı tarafı varsayılanlar (bağlantı limiti, önbellek) | Ön uç dersleri için aynı tablo | kapsam — `frontend-performance-scaling` doğal ev; ayrı bir pas |
| `numbers` satırlarının otomatik tazelik denetimi | Bayat varsayılanın CI'da yakalanması | bağımlılık — yalnız koşturulabilir olanlar için mümkün; yol haritasının T3 "Freshness Contract"ı ile birlikte düşünülmeli |
