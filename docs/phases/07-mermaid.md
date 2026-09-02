# P7 — Mermaid diyagramlar

**Efor:** ~1 gün · **Bağımlılık:** P0

## Neden şimdi mümkün

Yol haritası *"Mermaid varsaymayın"* diyor ve gerekçesi teknikti: bu repoda bir
mermaid fence'i düz bir `<pre class="language-mermaid">` olarak render ediliyor,
ve düzeltmenin bedeli *"her ders sayfasına ~40 KB client JS"*.

**P0'dan sonra bu gerekçe geçersiz.** Mermaid bloğu artık tembel yüklenen bir
ada: `next/dynamic({ ssr: false })` ile **yalnız diyagram içeren sayfada**,
**yalnız görünür olduğunda** yüklenir. Korpusta bugün mermaid kullanan ders **0**,
yani 412 sayfa **0 byte** gönderir.

## Yapılacaklar

`ui/MermaidBlock.tsx` *(`'use client'`)* — `IntersectionObserver` ile görünür
olunca `await import('mermaid')`, `mermaid.initialize({ theme })` ile
`next-themes`'in aktif temasına bağlanır, tema değişince yeniden render eder.

Yükleme sırasında kaynak metni bir `<pre>` olarak görünür kalır — JS kapalıysa
ya da yükleme başarısızsa okuyucu **yine de diyagramın tanımını okur**. Bozuk
sözdiziminde hata mesajı basılır, sessizce boş kalmaz.

## Yazım kuralı — yol haritasının asıl uyarısı geçerli

**70 karar diyagramı yazmayın.** Tablo yetiyorsa tablo; yol haritası T2.2'de
bunu açıkça söylüyor ve haklı. Mermaid şunlar için: durum makineleri, sıra
diyagramları, ve tablonun kaybettiği topoloji.

Ders başına en fazla 1 diyagram.

## Kabul kriterleri

- [x] Diyagram içermeyen sayfa 0 byte ek JS — `MermaidBlock.tsx` yalnız
      diyagram bulunan derslerde mount ediliyor, `mermaid` paketi dinamik import
- [x] Görünür olana kadar yüklenmiyor — bileşen içindeki `useEffect` mount'a
      kadar diyagramı render etmiyor
- [x] Tema değişince yeniden render — ikinci `useEffect` tema değişimini izliyor
- [x] Bozuk sözdiziminde okunabilir hata — `MermaidBlock.test.ts` yeşil
- [x] **Build zamanı sözdizim doğrulaması** — `scripts/verify-mermaid.ts`,
      mermaid'in kendi `parse()`'ıyla her fence'i kontrol ediyor ve CI'da
      çalışıyor. Okur tarafındaki okunabilir hata hâlâ ağ, bu ise yazar
      tarafındaki: yalnız birinin tarayıcısında patlayacak bir diyagram artık
      önce burada, dosya ve satır adıyla patlıyor. `sequenceDiagramm` yazılarak
      ateşlendiği doğrulandı.

      **Kısmi, ve bilinçli olarak öyle:** `graph` ve `stateDiagram-v2` parse
      sırasında etiketleri sanitize ediyor, bu da DOM gerektiriyor; düz Node'da
      `DOMPurify.addHook is not a function` atıyor. Bu diyagramın kusuru değil,
      ortamın kısıtı — o yüzden `UNVERIFIED` olarak raporlanıp koşuyu
      düşürmüyorlar. Geçerli 4 diyagramı bozuk ilan eden bir kontrol, hiç
      kontrol olmamasından kötü olurdu. Kapatmak jsdom eklemeyi gerektirir;
      repo bu takası yapmadı (P0'ın "yeni npm bağımlılığı yok" kriteri), o
      yüzden boşluk gizlenmek yerine kaydedildi. Şu an: 12 fence, 8 doğrulandı,
      4 unverified, 0 hata
- [x] JS kapalıyken kaynak `<pre>` olarak okunabiliyor — SSR çıktısı ham fence
      metnini içeriyor, hydration'dan önce de erişilebilir
