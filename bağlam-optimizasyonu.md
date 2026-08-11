# bağlam-optimizasyonu

## Obsidian ve alt ajan sistemi
- Obsidian, sistem içinde tarama yapan not kaynağı olarak kullanılıyor.
- Alt ajanlardan biri özel olarak Obsidian'dan okuma işini yapacak.
- Bu ajan Obsidian'dan aldığı bilgiyi ham haliyle değil, özetleyerek orkestra şefine iletmeli; orkestra şefi de gereken kısmı ilgili ajana aktarmalı.

## Orkestra şefi + alt ajan mimarisi
- Orkestra şefi ajanın altında: kodlama ajanı, plan ajanı, code review ajanı, Obsidian okuyucu ajan.
- Her alt ajan kendi izole context'inde çalışır, işi bitince orkestra şefine sadece özet/damıtılmış sonuç döner.
- Böylece ajanlar birbirinin gereksiz detayına (ör. review detayları, alakasız Obsidian notları) boğulmaz.
- Bu yapı Claude Code'un kendi alt ajan mimarisiyle zaten örtüşüyor.

## Otomatiklik nasıl sağlanır
- Sadece CLAUDE.md'ye "sen orkestra şefisin" yazmak izolasyon sağlamaz.
- Gerçek izolasyon için Claude Code'un alt ajan özelliği kullanılmalı: her ajan ayrı dosyada tanımlanmalı, ne zaman devreye gireceği belirtilmeli.
- CLAUDE.md daha çok genel davranış kuralları içindir; "her adımda özet ilerleme raporu ver" gibi raporlama talimatları da oraya yazılabilir.

## Ajan dosyalarının konumu
- Proje klasöründeki .claude/agents: sadece o projeye özel, git'e dahil edilip paylaşılabilir.
- Kullanıcı (home) klasöründeki .claude/agents: otomatik olarak tüm projelerde geçerli.
- Best practice: genel geçer ajanlar (review, plan) global klasöre; projeye özel ajanlar o projenin klasörüne.

## Token ve hız kazanımı
- Kesin garanti yok, projeye göre değişir.
- Büyük/karmaşık işlerde (geniş kod tabanı taraması, uzun review) gerçek kazanç var.
- Küçük, basit işlerde alt ajan başlatmanın kendi maliyeti var, fazladan yük oluyor.
- Orta ve büyük, çok dosyalı, tekrar eden işlerde kazanç belirginleşiyor.
- Bağımsız alt ajanlar paralel çalışabilir, bu toplam süreyi kısaltır.
- Tek küçük görevde alt ajan başlatmak hızı artırmak yerine yavaşlatabilir.

## Paralel mi teker teker mi (özellik bazlı karar)
- Kriter: özelliklerin birbirinden bağımsız olup olmadığı.
- Ayrı sayfa/dosya, ortak bir şeye dokunmuyorsa: paralel yaptırmak zaman kazandırır.
- Aynı API katmanı/model/state yönetimine bağımlıysa: önce ortak temel bitirilmeli, sonra bağımsız kısımlar paralel yaptırılmalı.

## Test yükü açısından karar
- Manuel test yapılıyorsa teker teker, kontrollü gitmek daha az yorar; hata kaynağı hemen anlaşılır.
- Beşini birden yaptırmak kod yazma hızını artırır ama manuel testte hata kaynağını ayırt etmeyi zorlaştırır.
- Paralel yaklaşım, otomatik testlerin sağlam olduğu veya özelliklerin gerçekten basit ve kopuk olduğu durumlarda mantıklı.

Kendi kütüphane fikri netleşti: Amaç sadece referans göstermek değil, önceden yazılmış çalışan sistemi doğrudan kullanmak/kopyalatmak. Özellikle servis katmanı için geçerli — örneğin bir API'yi çağıran, gelen veriyi parse eden, singleton olarak yazılmış servis dosyaları. Bunlar bir yerde (kütüphanede) duracak, ayrıca bir index markdown dosyası olacak; bu index dosyası hangi servisin ne işe yaradığını ve nasıl kullanılacağını anlatacak. Ajan önce index'i okuyup ilgili dosyayı bulacak, sonra o dosyayı projeye kopyalayıp kullanacak.

Claude Code için araştırılan eklentiler: Claude Mem (oturumlar arası hafızayı otomatik arka planda tutan, SQLite/vektör veritabanına yazan bir plugin), Headroom (Claude Code'a giden içeriği sıkıştırarak token kullanımını yaklaşık yüzde kırk azaltan bir proxy) ve Task Observer (kullanıcı düzeltmelerini ve tekrar eden iş akışlarını gözlemleyip markdown log dosyasına not düşen, haftalık manuel gözden geçirme gerektiren bir skill). Değerlendirme sonucunda Claude Mem'in tamamen otomatik ve az müdahale gerektirmesi nedeniyle tercih edilmesine karar verildi, Task Observer manuel takip gerektirdiği için seçilmedi. Bu eklentilere ileride tekrar bakılacak.

Yukarıdaki eklentilerin madde halinde özeti:
- Claude Mem: Oturumlar arası hafızayı otomatik, arka planda tutar; SQLite/vektör veritabanına yazar.
- Headroom: Claude Code'a giden içeriği sıkıştıran bir proxy; token kullanımını yaklaşık yüzde kırk azaltır.
- Task Observer: Kullanıcı düzeltmelerini ve tekrar eden iş akışlarını gözlemleyip markdown log dosyasına not düşer; haftalık manuel gözden geçirme gerektirir.

Karar:
- Claude Mem tercih edildi çünkü tamamen otomatik çalışıyor ve az müdahale gerektiriyor.
- Task Observer seçilmedi çünkü manuel takip gerektiriyor.
- Bu eklentilere ileride tekrar bakılacak.
