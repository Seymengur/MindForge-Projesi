# MindForge: Cognitive Gym - Oyun Tasarım Dökümanı (GDD)

> **Belge Sürümü:** 1.0.0  
> **Durum:** Konsept & Mimari Tasarım Aşaması  
> **Hedef Platformlar:** iOS, Android, Web (PWA / Offline-First)  
> **Tür:** Bilişsel Antrenman, Beyin Jimnastiği, Eğitici Bulmaca  

---

## 1. Yönetici Özeti ve Temel Vizyon

**MindForge**, popüler beyin jimnastiği uygulamalarının (özellikle Lumosity) kullanıcıları yıpratan agresif ödeme duvarlarına, şeffaf olmayan ceza temelli puanlama sistemlerine, zorunlu kişisel veri toplama dayatmalarına ve teknik yetersizliklerine doğrudan bir tepki olarak doğmuştur.

### Temel Felsefemiz: "Etik Nöro-Gelişim (Ethical Neuro-Fitness)"
1. **Şeffaf ve Cezalandırmayan Gelişim:** Kullanıcının emeği tek bir kötü gün veya gizli bir algoritma güncellemesiyle sıfırlanamaz.
2. **Kullanıcıya Saygılı Gizlilik:** Zihninizi geliştirmek için e-posta, cinsiyet veya uyku saati gibi kişisel verilerinizi teslim etmek zorunda değilsiniz.
3. **Erişilebilir ve Adil Monetizasyon:** Bilişsel gelişim lüks bir zengin ayrıcalığı değildir. Çekirdek antrenmanlar her zaman ücretsizdir; fahiş abonelikler ve tuzak denemeler reddedilir.
4. **Kusursuz Mühendislik & Çevrimdışı Özgürlük:** Metroda, uçakta, dağ başında; bitmek bilmeyen yükleme ekranları ve gecikmeler (input lag) olmadan %100 çevrimdışı çalışabilirlik.

---

## 2. Rakip Analizi ve Çözüm Matrisi (Lumosity vs. MindForge)

| Şikayet Alanı | Lumosity Pratiği (Kullanıcı Şikayeti) | MindForge Çözümü (Bizim Yaklaşımımız) |
|---|---|---|
| **Monetizasyon** | Günde sadece 3 oyun hakkı; yıllık 90-100$ fahiş ücret; iptali zor tuzak deneme sürümleri. | **Fair-Play Modeli:** 5 temel alanda sınırsız günlük oyun; tek seferlik makul ömür boyu (Lifetime) satın alma seçeneği; sıfır tuzak kart zorunluluğu. |
| **Gizlilik & Onboarding** | Uygulama açılır açılmaz zorunlu hesap açma; demografik veri ve uyku bilgisi dayatması. | **Zero-Login & Local-First:** Uygulamayı indirir indirmez 5 saniye içinde oyundasın. Tüm veriler yerel cihazda (SQLite) kalır. |
| **Puanlama (LPI)** | Kara kutu formül; güncellemede puanların bir gecede çakılması; hasta/yorgun günlerde ağır ceza. | **Neuro-Mastery Index (NMI):** Açık formüllü, asla geriye gitmeyen kümülatif XP ve beceri ağacı. Pozitif form durumu göstergeleri. |
| **Teknik & Çevrimdışı** | Sürekli "downloading" döngüleri, sunucu bağımlılığı, kelime oyunlarında klavye gecikmesi ve çift tık hataları. | **100% Offline-First:** Tüm varlıklar yerel pakette (bundle). 120 FPS yerel render motoru, 8ms dokunma gecikmesi, donanımsal debounce koruması. |
| **İçerik & Yönergeler** | Bellek (memory) oyunlarının kilitlenmesi; metin ağırlıklı kafa karıştırıcı tutorial'lar. | **Tam Kategori Erişimi & İnteraktif Sandbox:** Bellek oyunları dahil 5 kategori herkese açık; 3 hamlelik interaktif oyna-öğren eğitim modu. |

---

## 3. Giriş Deneyimi (Onboarding) ve Gizlilik Mimarisi

### 3.1. "Sıfır Kayıt, Anında Oyun" (Zero-Login / Instant Play)
* **İlk Açılış (T+0 sn):** Uygulama açılır açılmaz kayıt formu, e-posta, şifre veya sosyal medya girişi YOKTUR.
* **Hızlı Kalibrasyon (T+30 sn):** Kullanıcı doğrudan 45 saniyelik eğlenceli ve hafif bir "Nöro-Isınma" (Reaction Pulse) mini oyununa girer.
* **Yerel Profil Oluşturma:** Oyun bittiğinde yerel bir UUID atanır ve cihaz hafızasında güvenli bir SQLite veritabanı başlatılır.
* **Opsiyonel Senkronizasyon:** Yalnızca cihaz değiştirmek veya web/mobil arasında veri taşımak isteyenler için Apple Sign-In / Google Play Games veya 12 haneli anonim transfer kodu sunulur.

### 3.2. Sıfır Veri Açlığı
* Yaş, cinsiyet, meslek, uyku süresi gibi hassas biyometrik/demografik sorular ZORUNLU DEĞİLDİR.
* Kullanıcı sadece kendi isteğiyle antrenman odaklarını (örn: "Odaklanma ve Çalışma Belleği") etiketleyebilir.

---

## 4. Temel Mekanikler ve Çekirdek Oyun Havuzu

MindForge, nörobilimsel literatürle desteklenen 5 temel bilişsel sütun üzerine kuruludur. Her sütunda hem ücretsiz hem premium oyuncuların erişebileceği dinamik oyunlar yer alır.

```
       [ MindForge Bilişsel Matrisi ]
  ┌───────────────┬────────────────────────┐
  │ 1. Bellek     │ Memory Matrix, EchoTap │
  │ 2. Odak/Dikkat│ Falcon Eye, ShiftFlow  │
  │ 3. Hız/Refleks│ Chrono Match, PulseNet │
  │ 4. Esneklik   │ Dual Task, ColorMorph  │
  │ 5. Mantık     │ Cipher Path, NumBridge │
  └───────────────┴────────────────────────┘
```

### 4.1. Bellek (Memory) — *Lumosity'nin kilitlediği alan tamamen açık!*
1. **Memory Matrix (Matris Belleği):**
   * *Mekanik:* Ekranda beliren 4x4 - 6x6 ızgarada kısa süreliğine parlayan desenleri hatırla ve sırayla seç.
   * *Zorluk Dinamiği:* Doğru bildikçe ızgara boyutu ve hedef blok sayısı n-back prensibiyle artar.
2. **Echo Tap (İşitsel & Görsel Sıralama):**
   * *Mekanik:* Renk ve ton kombinasyonlarını hafızada tutarak aynı ritimle tekrar et.

### 4.2. Odak ve Dikkat (Attention & Selective Focus)
1. **Falcon Eye (Yırtıcı Göz):**
   * *Mekanik:* Karmaşık arka plan akışında (distractor öğeler) yönü ters olan veya deseni bozan hedef balığı/nesneyi tespit et.
2. **Shift Flow:**
   * *Mekanik:* Bir anda ikiye bölünen ekranda sol tarafta harf-sayı kuralları, sağ tarafta renk-şekil kuralları arasında zihinsel geçiş yap.

### 4.3. Hız ve Refleks (Speed & Reaction Time)
1. **Chrono Match:**
   * *Mekanik:* Gelen iki sembolün şekil veya renk olarak eşleşip eşleşmediğini milisaniyeler içinde sağ/sol kaydırma ile onayla.
   * *Input Güvencesi:* Dokunmatik ekran titreşimli geribildirim (Haptic Feedback) ve sıfır gecikmeli donanım seviyesi listener.

### 4.4. Esneklik (Cognitive Flexibility & Task Switching)
1. **Color Morph (Stroop Efekti Modernizasyonu):**
   * *Mekanik:* "Mavi" yazan kırmızı kelimeye karşı metnin anlamı mı yoksa rengi mi sorulduğunda anında adaptasyon sağla.

### 4.5. Mantık ve Problem Çözme (Problem Solving & Logic)
1. **Cipher Path:**
   * *Mekanik:* Belirli matematiksel ve geometrik operasyonları kullanarak hedef sayıya en kısa rota üzerinden ulaş.

### 4.6. İnteraktif Eğitim (Interactive Micro-Tutorials)
* Hiçbir oyunda 3 sayfadan uzun statik metin kuralı bulunmaz.
* Oyun öncesinde 10 saniyelik **"Sandbox Mode"** devreye girer: Kullanıcı kuralı bizzat 2-3 hamle deneyerek öğrenir, başarısız denemeler skoru etkilemez.

---

## 5. İlerleme ve Bilişsel Metrik Sistemi: Neuro-Mastery Index (NMI)

Lumosity'nin gizli ve ceza odaklı LPI (Lumosity Performance Index) modeline karşı, MindForge **Neuro-Mastery Index (NMI)** sistemini sunar.

### 5.1. NMI Temel Prensipleri
1. **Kazanılmış Hak Geri Alınamaz (Anti-Decay):** Kötü bir gün geçirmeniz veya bir süre oyuna ara vermeniz toplam seviyenizi veya genel NMI puanınızı düşürmez. Beceriler paslanabilir ancak oyuncunun tecrübe puanı (XP) ve unvanı kalıcıdır.
2. **Şeffaf Hesaplama Formülü:**
   $$\text{Oyun Skoru} = (\text{Temel Doğruluk \%}) \times (\text{Zorluk Katsayısı}) + \left(\frac{1000}{\text{Tepki Süresi (ms)}}\right) \times \text{Tutarlılık Çarpanı}$$
   Oyuncu maç sonunda bu 4 metriği bir radar grafiğinde tam şeffaflıkla görür.
3. **Zihinsel Form Durumu (Daily Mental Readiness):**
   * Eğer tepki süreniz dünkünden %10 yavaşsa uygulama puanınızı cezalandırmaz; *"Bugün zihniniz yorgun görünüyor, antrenmanı hafif tempoya çektik"* uyarısıyla şefkatli bir geri bildirim verir.
4. **Beceri Ağacı (Skill Mastery Tree):**
   * Her 5 alanın (Bellek, Odak, Hız vb.) kendi seviyesi (Seviye 1-100) bulunur. Oyuncu hangi alanda geliştiğini somut rozetler ve istatistiklerle izler.

---

## 6. Gelir Modeli (Monetization: Fair-Play & Ethical)

MindForge, kullanıcıları manipüle eden (dark patterns) veya fahiş aboneliklere hapseden sistemleri bütünüyle reddeder.

```
       [ MindForge Gelir Katmanları ]
  ┌──────────────────┬─────────────────────────────┐
  │ Ücretsiz Çekirdek│ 5 kategori, sınırsız oyun,  │
  │ (Free Tier)      │ temel istatistik, sıfır ad  │
  ├──────────────────┼─────────────────────────────┤
  │ Pro Supporter    │ Tek seferlik ($19.99 ömür   │
  │ (Lifetime)       │ boyu) veya sembolik $2.99/ay│
  ├──────────────────┼─────────────────────────────┤
  │ Opt-In Rewarded  │ Zorunlu olmayan, sadece koz-│
  │ (İsteğe Bağlı)   │ metik/streak dondurucu ödül │
  └──────────────────┴─────────────────────────────┘
```

### 6.1. Ücretsiz Deneyim (Herkes İçin Bilişsel Sağlık)
* Günlük 3 oyun sınırlaması YOKTUR. 5 temel bilişsel kategorinin her birinden her gün rotasyonlu oyunlar sınırsız oynanabilir.
* Araya giren zorunlu tam ekran (interstitial) reklamlar KESİNLİKLE YOKTUR.

### 6.2. MindForge Pro Katmanı (Şeffaf & Adil Fiyatlandırma)
* **Tek Seferlik Satın Alma (Lifetime Pass):** 19.99$ (Bölgesel fiyatlandırma ile TR'de çok daha erişilebilir). Kullanıcı bir kez öder ve ömür boyu sahip olur.
* **Esnek ve Düşük Ücretli Abonelik:** Aylık sadece 2.49$ veya yıllık 19.99$ (Lumosity'nin ~100$'lık fahiş fiyatının beşte biri).
* **0-Risk Deneme (No-Card Free Trial):** Kredi kartı istemeyen 14 günlük Pro deneme süresi. Süre dolduğunda para çekilmez, otomatik olarak ücretsiz sürüme sessizce geçer.

### 6.3. İsteğe Bağlı Ödüllü Reklam (Opt-in Rewarded Ads)
* Kullanıcı asla reklam izlemeye zorlanmaz.
* Reklam yalnızca kullanıcı kaçırdığı bir seriyi kurtarmak istediğinde ("Streak Freeze Token") veya özel arayüz temalarını açmak istediğinde tamamen kendi rızasıyla tetiklenir.

---

## 7. Etik Oyuncuyu Elde Tutma (Retention & Digital Wellbeing)

MindForge, kumarhane mekaniklerine ve suçluluk psikolojisine dayanan bağımlılık tasarımına karşıdır.

1. **Streak Freeze & Mola İzni:**
   * Hayatın akışı içinde kaçırılan günler seriyi sıfırlamaz. Kullanıcıya her ay 2 adet ücretsiz "Zihinsel Dinlenme Günü" (Rest Day) tanımlanır.
2. **Anti-Doom Scrolling & Bilişsel Doygunluk:**
   * Günlük 15 dakikalık ideal antrenman tamamlandığında uygulama nazikçe *"Zihniniz bugünkü en verimli çalışmasını tamamladı, şimdi dinlenme vakti"* mesajıyla oturumu sonlandırmayı tavsiye eder.
3. **Pozitif Alışkanlık Bildirimleri:**
   * Günde 5 defa taciz eden push bildirimler yerine, kullanıcının kendi seçtiği saatte tek bir nazik hatırlatma (ve istendiğinde tek tıkla kapatılabilirlik).

---

## 8. Teknik Mimari ve Çevrimdışı Çalışabilirlik (100% Offline-First)

### 8.1. Yerel Ön Bellekleme (Pre-Bundled Assets)
* Tüm oyun motoru, ses efektleri, görsel varlıklar ve veri tabanları uygulamanın ilk indirme paketinin içinde yer alır (~35-45 MB).
* İlk kurulumdan sonra internet bağlantısı olmasa bile uygulama 0 saniye yükleme ekranıyla açılır.
* Asla oyun ortasında "Indiriliyor / Downloading" bekleme çarkı dönmez.

### 8.2. Giriş Gecikmesi & Çift Tık Önleme (Zero-Latency & Debounce)
* Kelime ve refleks oyunlarında donanımsal dokunma dinleyicileri (Raw Touch Events) kullanılır.
* **Hardware Debounce Filtresi:** 150 ms altındaki kazara oluşan çift dokunmalar (ghost/double tap) yazılımsal olarak filtrelenir ve oyuncunun hatasız oynaması garanti altına alınır.
* **Sabit Kare Hızı:** 60 FPS / 120 FPS akıcı animasyonlar; pil tasarruflu GPU hızlandırmalı UI.

---

## 9. Sonuç ve Başarı Kriterleri (KPIs)

* **D1 / D7 / D30 Elde Tutma (Retention):** Sektör ortalaması %12 olan D30 oranını, etik tasarım ve suçluluk hissettirmeyen streak modeliyle %28+ seviyesine çekmek.
* **Store Puanı Hedefi:** Kullanıcı dostu tutum sayesinde App Store / Google Play'de 4.8+ yıldız.
* **Dönüşüm Oranı (Free-to-Paid):** Agresif duvarlar yerine güven temelli değer önerisiyle %6-8 oranında organik Pro satın alma dönüşümü.
