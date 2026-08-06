# 🚀 DevMate — JSON Compare & Developer Utility Platform (MVP)

DevMate, yazılımcıların ve sistem geliştiricilerinin JSON veri yapılarını hızlı ve etkileşimli bir şekilde karşılaştırmasını (diff) sağlayan bir geliştirici aracıdır.

![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-latest-646CFF?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat&logo=tailwindcss)

---

## 🌟 Temel İşlevler ve Mimari Özellikler

* ⚡ **Metin İçi Görsel Vurgulama (Inline Diff Highlighting):** 
  * 🔴 **Silinen Alanlar (Deletions):** Kırmızı vurgu ile gösterilir.
  * 🟢 **Yeni Eklenen Alanlar (Additions):** Yeşil vurgu ile gösterilir.
  * 🔵 **Değişen Değerler (Modifications):** Mavi vurgu ile gösterilir.
* 📁 **Girdi Esnekliği (Drag & Drop / File Reader):** `.json` veya `.txt` dosyaları `FileReader` API kullanılarak doğrudan editör alanına aktarılabilir veya yerel dosya seçici ile yüklenebilir.
* 🎯 **Etkileşimli Navigasyon (Floating Navigation):** İstatistik kartlarına tıklandığında aktifleşen yüzen araç çubuğu (`▲ / ▼` okları) ile farklar arasında `scrollIntoView` API'si aracılığıyla adım adım odaklanılabilir.
* 🛡️ **Güvenli Nesne Kontrolü:** Prototype Pollution riskine karşı `Object.hasOwn()` kontrolü uygulanmıştır.
* 🧪 **Birim Testleri (Unit Testing):** Core diff algoritması Vitest ile test edilmektedir.

---

## ⚠️ Mimari Kararlar ve Sınırlar (Product Decisions & Limitations)

> [!NOTE]
> **Dizi Karşılaştırma Mantığı (Array Handling):** 
> MVP sürümünde dizi elemanları "Index-based comparison" (indeks bazlı sıralı karşılaştırma) yöntemiyle ele alınmaktadır. Sırası değişen elemanlar yer değiştirmiş nesneler yerine indeks değişikliği olarak işaretlenir.

> [!IMPORTANT]
> **Performans ve Sanallaştırma (Virtualization):** 
> Mevcut MVP mimarisinde DOM performansını optimize eden sanallaştırma (List Virtualization / `react-window`) kütüphaneleri bulunmamaktadır. Bu nedenle uygulama, standart boyutlardaki konfigürasyon ve veri dosyaları düşünülerek geliştirilmiştir. Devasa boyuttaki (ör. +50.000 satır) veri setleri için sonraki aşamalarda DOM virtualization entegrasyonu planlanmaktadır.

---

## 🛠️ Teknolojik Altyapı

* **Frontend Framework:** React 19 (TypeScript 6)
* **Build Tool:** Vite
* **Styling:** Tailwind CSS v4 & Google Fonts (`JetBrains Mono`, `Inter`)
* **Icons:** Lucide React
* **Testing:** Vitest

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları uygulayabilirsiniz:

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/trkglAbdulkahhar/DevMate.git
   cd DevMate