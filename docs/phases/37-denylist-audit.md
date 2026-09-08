# P37 — Denylist denetimi: bir örnek mi, örüntü mü?

**Efor:** ~1 gün · **Bağımlılık:** P36 · **Sonrakiler:** yok (kayıt)

## Neden

P36 bir doktrin ihlali buldu: capstone rubric'inin 12 satırından 8'i
`HARM_DENYLIST`'teki dersleri alıntılıyordu. Bir örnek bulunca doğru refleks
onu düzeltmek değil, **süpürmektir** — aynı sınıftan başka kaç tane var?

Bu faz o süpürme. Ders içeriğini tüketen **her** mekanizma denylist'e karşı
ölçüldü, her biri için bir karar verildi ve gerekçesi yazıldı. Amaç, altı ay
sonra "acaba şurada da var mıydı" sorusunun sıfırdan sorulmaması.

Korpusta **20 doğrulanmamış ders** var (`HARM_DENYLIST`, 2'si avukat 1'i
muhasebeci pasosu bekliyor).

## Denetim

| Yüzey | Doğrulanmamış derste | Karar | Gerekçe |
|---|---|---|---|
| `quiz`, `recall` | 1 + 1 (`#114`) | **kapalı, zaten** | `verified` kapısı render etmiyor; `drill/widget-on-unverified-lesson` warn olarak sayıyor |
| Hata drill'leri | — | **kapalı, zaten** | `drill/unverified-lesson` (error) manifest'te `interactive`'i `verified` olmadan yasaklıyor |
| Capstone rubric | **8 satır** | **düzeltildi (P36)** | Rubric bir alıştırma; `capstone/rubric-cites-unverified` artık error |
| Developer path'leri | **0** | **temiz** | Beş path'in 76 adımının hiçbiri doğrulanmamış ders değil. Şans değil: path bir okuma sırası ve okuma zaten serbest — ama sayı kayda geçiyor |
| Kavram sözlüğü | **0** | **temiz** | 164 terimin hiçbiri doğrulanmamış bir derste tanımlanmıyor |
| Cheat sheet | 20 dersten **251 madde** | **kabul** | Cheat sheet bir **okuma** artefaktı: P33'ün birebir sözleşmesi gereği dersin kendi sayfasında zaten duran metni tekrar ediyor, tek kelime eklemiyor. Denylist'in engellediği şey okumak değil, **drill etmek** |
| `template` (form) | 3 | **kabul** | Boş form bir iddia taşımıyor; okuyucunun kendi metnini yazdığı bir yüzey |
| `proof` | 1 (`#34`) | **kabul** | Bir proof'un gövdesi CI'da koşuluyor. Doğrulanmamış bir dersteki **tek doğrulanmış** şey o; kaldırmak dersi zayıflatırdı |
| `sql run` / `run project` | 2 (`#41`, `#7`) | **kabul** | Çalıştırılabilir kod bir iddia değil bir gösterim; okuyucu çıktıyı kendi görüyor |
| `numbers` | 1 (`#41`) | **kabul** | Her satırın varsayılanı yayımlayan dokümana linkli (P31'in `numbers/unsourced-default` kuralı). Doğrulanmamış bir dersi **birincil kaynağa bağlıyor**, ondan bir şey iddia etmiyor |
| `calc` | 1 (`#319`) | **düzeltildi, aşağıda** | Tek gerçek bulgu |

Sonuç: **P36'nın sınıfı bir örnekti, örüntü değil.** Yedi yüzey zaten temiz ya
da savunulabilir; bir tanesi düzeltmeyi hak etti.

## Tek bulgu — `#319`'un `calc`'ı

`business-finance-solo-ops/319` vergi ve muhasebe hazırlığı üzerine ve
**muhasebeci pasosu bekliyor**. Üstünde bir `calc` fence'i var ve aritmetiği
kusursuz: `invoice * (1 - rate/100)`. Sorun aritmetik değil, **önceden
doldurulmuş varsayılan**:

```
- { id: default_rate, label: "Default withholding with no W-8BEN on file (%)", default: 30 }
```

Bu bir mevzuat rakamı ve korpus onu **kaynaksız** olarak, üstelik uzman
pasosu bekleyen bir derste iddia ediyor. P11'in `calc` gerekçesi —
*"a calc fence makes no generated claim to be wrong about — it runs the
reader's own numbers through a model the lesson prose states in the open"* —
okuyucunun **kendi** sayılarını girdiği durumda doğru. Burada 30 okuyucunun
sayısı değil, korpusun iddiası.

**Asimetri kayda değer.** P31 `numbers` widget'ını tam bu iş için kurdu:
bir varsayılan ya yayımlayan dokümana linklidir ya `—`'dir, ve bir lint kuralı
bunu zorlar. `calc`'ın böyle bir alanı **yok** ve olması da gerekmiyor —
`calc`'ın girdileri okuyucunun sayıları olmalı. Kural şu hâle geliyor:
**dışsal bir olgu bir `calc` varsayılanı değil, bir `numbers` satırıdır.**

### Yapılan

`#319`'un iki oran girdisinin etiketi, rakamın **okuyucunun doğrulaması
gereken bir örnekleme** olduğunu söyleyecek şekilde değiştirildi. Aritmetik,
çıktılar ve dersin nesri **değişmedi**; değişen, korpusun o rakamı iddia
etmeyi bırakması.

Ders zaten bir sorumluluk reddi taşıyor (*"not tax or legal advice... verify
every rate, threshold, and form requirement"*); bu değişiklik o cümleyi
rakamın **durduğu yere** taşıyor.

## Kabul kriterleri

- [x] On bir yüzeyin her biri ölçüldü ve kararı yukarıdaki tabloda
      gerekçesiyle yazılı — yedisi kabul, ikisi zaten kapalı, biri P36'da
      düzeltilmiş, biri bu fazda
- [x] Developer path'lerinde doğrulanmamış ders **0** (beş path, 76 adım);
      kavram sözlüğünde **0** (164 terim) — ikisi de ölçüldü, varsayılmadı
- [x] Cheat sheet'in 20 doğrulanmamış dersten bastığı **251 madde** kabul
      edildi ve gerekçesi yazıldı: P33'ün birebir sözleşmesi gereği dersin
      kendi sayfasındaki metin, tek kelime eklenmiyor
- [x] `#319`'un iki `calc` etiketi rakamı iddia etmeyi bıraktı; `inputs`'un
      `id`'leri, `outputs` ve aritmetik **aynı**, dersin nesri değişmedi
- [x] Başka hiçbir ders metni değişmedi — `snapshot-diff` **1 explained ·
      0 unexplained**
- [x] `content:check` (336 test), `lint` (0 error), `stats-check`
      (33 rows · 0 disagree), `build` (653 sayfa) yeşil

## Risk

| Risk | Azaltma |
|---|---|
| Denetim bir kereye mahsus kalır ve bayatlar | Tablo gerekçelerle yazılı; yeni bir widget türü eklenince aynı satır sorulur |
| `calc` etiketi çözüm sanılır | Şartname asıl kuralı yazıyor: dışsal olgu `numbers` satırıdır, `calc` varsayılanı değil |
| Fazla düzeltme yapılır | Yedi yüzeyin kabul gerekçesi tek tek yazılı; hiçbiri "şimdilik" değil |

## Eklenebilecekler

| Aday | Ne getirir | Neden şimdi değil |
|---|---|---|
| `calc` varsayılanlarının korpus geneli taraması | Başka dışsal-olgu varsayılanları | kapsam — 21 `calc` fence'inin çoğunun varsayılanı okuyucunun kendi ölçüsü (RAM, enerji, flash); mekanik ayırt etme kuralı yok, ders ders okumak gerekir |
| `#319`'a bir `numbers` satırı | Oranın kaynaklı hâli | uzman pasosu — vergi mevzuatı rakamını kaynaklamak bu repo'nun yetkisinde değil; ders zaten muhasebeci bekliyor |
| Denylist derslerinin uzman pasosu | 20 dersin kilidi | uzman pasosu — repo dışı karar |
