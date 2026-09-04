#!/usr/bin/env node
import { analyzeJwtWithAi, analyzeLogWithAi, compareJSON, countDiffs, analyzeJsonWithAi } from "./apiClient";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // node ve script yolunu atla, argümanları al
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("\n🚀 DevMate CLI Tool'a Hoş Geldiniz!");
    console.log("Kullanım: devmate <command> [options]");
    console.log("\nKomutlar:");
    console.log("  analyze-jwt <token>        JWT token'ını yapay zeka ile analiz eder.");
    console.log("  analyze-log <file_path> [--level=ERROR] Belirtilen log dosyasını yapay zeka ile analiz eder (Opsiyonel olarak seviyeye göre filtreler).");
    console.log("  compare-json <file1> <file2> İki JSON dosyasını karşılaştırır ve aralarındaki farkı gösterir.");
    process.exit(1);
  }

  try {
    if (command === "analyze-jwt") {
      const token = args[1];
      if (!token) throw new Error("Lütfen bir token belirtin. Örnek: devmate analyze-jwt eyJhbG...");
      
      console.log("🔍 JWT analiz ediliyor (Lokal tarama ve AI entegrasyonu). Lütfen bekleyin...");
      const result = await analyzeJwtWithAi(token);
      
      console.log("\n✅ Analiz Tamamlandı!");
      console.log("\n--- [Lokal Deterministik Analiz Bulguları] ---");
      if (result.localAnalysis.deterministicChecks.length === 0) {
        console.log("Temiz. Herhangi bir yapısal risk tespit edilmedi.");
      } else {
        console.log(JSON.stringify(result.localAnalysis.deterministicChecks, null, 2));
      }
      
      console.log("\n--- [Yapay Zeka (AI) Mimari Yorumu] ---");
      console.log(JSON.stringify(result.aiInsights, null, 2));

    } else if (command === "analyze-log") {
      const filePath = args[1];
      if (!filePath) throw new Error("Lütfen bir log dosyası yolu belirtin. Örnek: devmate analyze-log ./app.log");
      
      let targetLevel: string | undefined;
      for (let i = 2; i < args.length; i++) {
        if (args[i].startsWith("--level=")) {
          targetLevel = args[i].split("=")[1];
        }
      }
      
      const absolutePath = path.resolve(process.cwd(), filePath);
      console.log(`📄 '${absolutePath}' okunuyor...`);
      const fileContent = fs.readFileSync(absolutePath, "utf-8");
      
      console.log("🔍 Loglar parse ediliyor ve AI analizine gönderiliyor. Lütfen bekleyin...");
      const result = await analyzeLogWithAi(fileContent, targetLevel);
      
      const counts: Record<string, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0 };
      result.allLogs.forEach((l: any) => { if (counts[l.level] !== undefined) counts[l.level]++; });
      
      console.log("\n✅ Analiz Tamamlandı!");
      console.log("\n--- [Lokal Parse İşlemi Özeti] ---");
      console.log(`Toplam ${result.allLogs.length} adet geçerli log girdisi bulundu.`);
      console.log(`🔴 ERROR : ${counts.ERROR}`);
      console.log(`🟡 WARN  : ${counts.WARN}`);
      console.log(`🔵 INFO  : ${counts.INFO}`);
      console.log(`⚪ DEBUG : ${counts.DEBUG}`);
      console.log(`⚫ TRACE : ${counts.TRACE}`);
      
      if (targetLevel) {
        console.log(`\n🎯 Filtre Uygulandı: Sadece ${targetLevel.toUpperCase()} logları (${result.sentLogs.length} adet) Yapay Zeka'ya gönderildi.`);
      } else {
        console.log(`\n(Tüm loglar (${result.sentLogs.length} adet) Yapay Zeka'ya gönderildi. Yalnızca ERROR'ları göndermek için sonuna --level=ERROR ekleyebilirsin.)`);
      }
      
      console.log("\n--- [Yapay Zeka (AI) Log İncelemesi] ---");
      console.log(`Genel Özet: ${result.aiInsights.overallSummary || result.aiInsights.OverallSummary || "Bulunamadı"}`);
      
      const keyIssues = result.aiInsights.keyIssues || result.aiInsights.KeyIssues || [];
      if (keyIssues.length > 0) {
        console.log("\n🔥 Tespit Edilen Temel Sorunlar (Key Issues):");
        keyIssues.forEach((issue: any, index: number) => {
          console.log(`\n${index + 1}. ${issue.title || issue.Title}`);
          console.log(`   🔸 Kök Neden : ${issue.rootCause || issue.RootCause}`);
          console.log(`   ✅ Çözüm     : ${issue.solution || issue.Solution}`);
        });
      } else {
        console.log("\n✅ Herhangi bir kritik sorun tespit edilmedi.");
      }

    } else if (command === "compare-json") {
      const file1Path = args[1];
      const file2Path = args[2];
      if (!file1Path || !file2Path) throw new Error("Lütfen iki dosya yolu belirtin. Örnek: devmate compare-json ./eski.json ./yeni.json");
      
      const absolutePath1 = path.resolve(process.cwd(), file1Path);
      const absolutePath2 = path.resolve(process.cwd(), file2Path);
      
      console.log(`📄 '${absolutePath1}' ve '${absolutePath2}' okunuyor...`);
      const oldObj = JSON.parse(fs.readFileSync(absolutePath1, "utf-8"));
      const newObj = JSON.parse(fs.readFileSync(absolutePath2, "utf-8"));
      
      console.log("🔍 Dosyalar karşılaştırılıyor ve AI analizine gönderiliyor. Lütfen bekleyin...");
      const result = await analyzeJsonWithAi(oldObj, newObj);
      const diffNode = result.localAnalysis;
      const counts = countDiffs(diffNode);
      
      console.log("\n✅ Karşılaştırma Tamamlandı!");
      console.log("\n--- [Değişiklik Özeti (Lokal Tarama)] ---");
      console.log(`🟢 Eklendi (Added)      : ${counts.added}`);
      console.log(`🔴 Çıkarıldı (Removed)  : ${counts.removed}`);
      console.log(`🟡 Değiştirildi (Mod)   : ${counts.modified}`);
      
      console.log("\n--- [Fark Ağacı (Diff Tree)] ---");
      console.log(JSON.stringify(diffNode, null, 2));
      
      console.log("\n--- [Yapay Zeka (AI) Mimari Değerlendirmesi] ---");
      console.log(`Özet: ${result.aiInsights.summary || result.aiInsights.Summary || "Bulunamadı"}`);
      
      const breakingChanges = result.aiInsights.breakingChanges || result.aiInsights.BreakingChanges || [];
      if (breakingChanges.length > 0) {
        console.log("\n⚠️ Kırılma Riskleri (Breaking Changes):");
        breakingChanges.forEach((c: string) => console.log(`- ${c}`));
      } else {
        console.log("\n✅ Kırılma Riski Bulunmadı.");
      }

      const recommendations = result.aiInsights.recommendations || result.aiInsights.Recommendations || [];
      if (recommendations.length > 0) {
        console.log("\n💡 Mimari Öneriler:");
        recommendations.forEach((r: string) => console.log(`- ${r}`));
      }

    } else {
      console.error(`❌ Bilinmeyen komut: ${command}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("\n❌ HATA OLUŞTU:", error.message);
    process.exit(1);
  }
}

main();
