# P45 — İşletim sistemi temelleri: süreç, bellek ve I/O sınırları

**Durum:** öneri · **Efor:** içerik kapsamı netleşince tahmin edilecek · **Bağımlılık:** yok · **İlişkili:** P25, #103, #129, #133, #421

## Neden

Katalog, işletim sistemi kavramlarına farklı teknik bağlamlarda değiniyor; genel
amaçlı bir OS'nin uygulama ile donanım arasındaki rolünü ve temel mekanizmalarını
bir arada açıklayan bir ders dizisi görünmüyor. Bu öneri yeni bir meslek eğitimi
veya baştan sona işletim sistemi kursu değildir. Amaç, yazılım mühendisinin
mevcut backend, runtime, dağıtım ve concurrency derslerini doğru zihinsel
modelle okuyabilmesi için eksik kavramları tamamlamaktır.

### Mevcut kapsama

- **Kısmen mevcut — süreç/eşzamanlılık:** `algorithms-concurrency/129` JS event
  loop'u, `await` noktaları arasındaki yarışları ve `worker_threads`'i anlatıyor.
  `framework-deep-dives/421` Electron'ın süreç sınırlarını açıklıyor.
- **Kısmen mevcut — kernel ve scheduling:** P25'in `embedded-firmware/547`
  dersi RTOS task'ları, öncelikler, preemption ve priority inversion'ı
  firmware bağlamında kapsıyor. Genel amaçlı OS scheduler'ı değildir.
- **Kısmen mevcut — bellek:** `advanced-deep-dive-topics/103` browser/V8
  belleğine; P25'in `embedded-firmware/548` dersi statik bellek, stack, heap
  ve task başına bütçeye değiniyor.
- **Dağınık pratik kullanım:** Dosya erişimi Electron/React Native ve dağıtım
  derslerinde; async I/O backend, telemetry ve edge derslerinde geçiyor.

### Belirgin boşluk

Mevcut derslerde genel amaçlı OS kavramları olarak **virtual memory, paging ve
page fault; system call ve user/kernel boundary; file descriptor ve dosya
sistemi; context switch; blocking/non-blocking I/O** için tutarlı, doğrudan bir
öğretim bulunamadı. Bu bir metin araması ve ders okuması sonucudur; terimlerin
hiçbir yerde tek cümleyle geçmediği iddiası değildir.

## Önerilen kapsam

**Kurs:** `operating-systems-fundamentals` — *Operating Systems Fundamentals*

Kurs uygulama geliştiricisinin karşılaştığı OS soyutlamalarıyla sınırlı kalır.
Kernel geliştirme, CPU mikro-mimarisi, donanım sürücüsü yazımı ve kapsamlı C
örnekleri bu fazın dışında tutulur. Ayrıntı ve ders sayısı içerik yazımından
önce kavram envanteriyle kesinleştirilir.

| Sıra | Önerilen ders | Sınır / bağ |
|---:|---|---|
| 1 | **What the Operating System Provides: User Space, Kernel, and System Calls** | Uygulama/API ile kernel hizmeti arasındaki sınır; `strace` gibi araçlara bağ. |
| 2 | **Processes, Threads, and Address Spaces** | İzolasyon, paylaşılan bellek ve süreç/thread ayrımı; #129 ve #421'e bağlan, onları tekrar etme. |
| 3 | **Scheduling and Context Switching** | Zaman paylaşımı, preemption ve context switch maliyeti; RTOS karşılaştırması için P25/#547'ye bağlan. |
| 4 | **Virtual Memory, Pages, and Page Faults** | Sanal adres, sayfa eşleme, demand paging ve page fault; ölçüm ile sezgiyi ayır. |
| 5 | **Files, File Descriptors, and Permissions** | Dosya tanıtıcısı, descriptor tablosu, path/metadata ve izinler; uygulama seviyesindeki file API'lerine bağlan. |
| 6 | **Blocking, Non-Blocking, and Asynchronous I/O** | OS I/O beklemesi ile runtime event loop'unu ayır; #129 ve `frontend-performance-scaling/27` ile kesişimi açıkla. |
| 7 | **Processes Communicating: Pipes, Sockets, and Signals** | IPC'nin temel şekilleri ve ne zaman süreç sınırı seçildiği; ağ protokollerini yeniden anlatma (#119, #133). |
| 8 | **Resource Limits and Failure: Memory Pressure, OOM, and File Handles** | Süreç başına limitler, descriptor sızıntısı ve kaynak tükenmesi; teşhis/operasyon bağı kur. |

Bu tablo ilk kapsam taslağıdır. Dersler tek bir kavram etrafında daraltılmalı;
bir başlık ancak mevcut bir dersten açıkça farklı bir öğrenme çıktısı sağlıyorsa
korunmalıdır.

## Yerleşim

- Kurs, `engineering` dalına yerleşir; yeni bir kategori/path açmaz.
- Kursun okuma sırası temellerden mekanizmalara ve kaynak arızalarına gider.
- `#119` HTTP ve `#133` networking, P25 firmware/RTOS, `#103` browser/V8,
  `#129` async/concurrency ve `#421` Electron process model çapraz bağlarıdır.
- Kurs bunların uygulama alanındaki açıklamalarını tekrarlamaz; OS'nin ortak
  mekanizmasını anlatıp mevcut dersleri örnek/uygulama olarak kullanır.

## Etkileşim ve doğrulama

- Her ders mevcut altı bölümlü lesson şeklini ve korpusun mevcut interaktif
  mekanizmalarını kullanır; yeni widget veya parser değişikliği önerilmez.
- Çalıştırılabilir komut/çıktı eklenecekse yalnız gerçek, tekrarlanabilir
  ortamdan doğrulanmış örnek kullanılır. Platformdan bağımsız iddialar Linux'a
  özgü davranış gibi sunulmaz; işletim sistemi farkları açıkça işaretlenir.
- Örnekler TypeScript/JavaScript veya küçük metin diyagramlarıyla kurulabilir;
  derlenmeyen C fence'leri eklenmez.
- Konsept sözlüğüne yalnız dersler arası gerçekten tekrar eden ve bağlamda
  anlamı sabit terimler alınır.

## Eklenebilecekler

| Aday | Neden bu fazda değil |
|---|---|
| Kernel geliştirme, sürücü yazımı, CPU mimarisi | kapsam — uygulama geliştiricisi için ortak OS zihinsel modelinin ötesinde; ayrı uzmanlık alanı olur |
| Linux dağıtım yönetimi ve shell komutları | mevcut `fundamentals-tools` ve deployment kapsamıyla örtüşebilir; ancak belirli bir OS ailesine operasyon eğitimi bu fazın hedefi değil |
| Embedded/RTOS işletim sistemi | P25 zaten bu alanı hedefliyor; burada genel amaçlı OS kavramlarına yalnız karşılaştırma bağı verilir |
| Process/thread concurrency ve async runtime'ın tekrar anlatımı | kapsam — #129, #103, #421 ve P25'te bağlama özel kapsam mevcut; yeni ders OS mekanizmasını öğretmeli |

## Kabul ölçütü

- [ ] Her önerilen dersin mevcut içerikle farkı ve tek cümlelik öğrenme çıktısı
      yazılmış; tekrar eden başlıklar birleştirilmiş veya çıkarılmış.
- [ ] Virtual memory, system call, descriptor/file system ve I/O başlıklarının
      kurs içindeki yeri açıklanmış.
- [ ] Her ders mevcut `#N` derslerine doğru çapraz bağ veriyor; var olmayan
      bağımlılık iddiası kurmuyor.
- [ ] OS'ye özgü komut veya çıktı varsa doğrulanabilir kaynağı ve çalışma
      ortamı belirtilmiş.
- [ ] Kurs `engineering` dalına eklenmiş ve manifest, ders id'leri, istatistik
      ve indeks değişiklikleri uygulama PR'ında güncellenmiş.
