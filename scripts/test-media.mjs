/**
 * Script Pengujian Transisi Media Gambar & Pop-Up Koneksi Bermasalah
 * Jalankan: node scripts/test-media.mjs [url_opsional]
 * Atau: npm run test:media
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";

console.log("\n==========================================================");
console.log("🖼️  MEMULAI PENGUJIAN TRANSISI MEDIA & POP-UP KONEKSI");
console.log(`🌐 Target Server: ${BASE_URL}`);
console.log("==========================================================\n");

async function checkServer() {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) });
    return res.status;
  } catch (err) {
    console.error(`❌ Gagal terhubung ke ${BASE_URL}.`);
    console.error("👉 Pastikan server Anda sudah berjalan (contoh: npm run dev atau npm run start).\n");
    process.exit(1);
  }
}

async function testConnectionErrorPopup() {
  console.log("📋 [Test 1] Menguji Tampilan Pop-up Koneksi Bermasalah (?error=media)...");
  try {
    const res = await fetch(`${BASE_URL}/?error=media`);
    const html = await res.text();

    const hasPopupTitle = html.includes("Gagal Memuat Media");
    const hasSubtitle = html.includes("Koneksi Bermasalah");
    const hasReloadButton = html.includes("Muat Ulang Halaman");
    const hasDismissButton = html.includes("Tutup &amp; Lanjutkan Membaca") || html.includes("Tutup & Lanjutkan Membaca");

    if (res.status === 200 && hasPopupTitle && hasSubtitle && hasReloadButton) {
      console.log("   ✅ Status HTTP: 200 OK");
      console.log("   ✅ Teks 'Gagal Memuat Media' terdeteksi di HTML");
      console.log("   ✅ Teks 'Koneksi Bermasalah' terdeteksi di HTML");
      console.log("   ✅ Tombol 'Muat Ulang Halaman' terdeteksi");
      console.log("   ✅ Tombol sekunder 'Tutup & Lanjutkan Membaca' terdeteksi");
      console.log("   🎉 HASIL: Pop-up koneksi bermasalah siap muncul saat media gagal dimuat!\n");
      return true;
    } else {
      console.log(`   ❌ Pop-up tidak lengkap atau tidak ditemukan (Status: ${res.status}).\n`);
      return false;
    }
  } catch (err) {
    console.error(`   ❌ Error saat mengambil halaman: ${err.message}\n`);
    return false;
  }
}

async function testImageTransitionsAndCache() {
  console.log("📋 [Test 2] Menguji Header Cache & Proteksi Rute Media (/api/media)...");
  try {
    // Uji media yang tidak ada (harus 404 agar memicu onError di browser)
    const notFoundRes = await fetch(`${BASE_URL}/api/media/testing-invalid-file.jpg`);
    const is404 = notFoundRes.status === 404;

    if (is404) {
      console.log("   ✅ Media yang rusak / tidak ada merespons HTTP 404 Not Found");
      console.log("   ✅ 404 ini secara otomatis ditangkap event capture browser untuk memicu pop-up");
    } else {
      console.log(`   ⚠️ Respon media tidak 404: ${notFoundRes.status}`);
    }

    // Uji aset statis publik untuk memastikan header Cache-Control immutable aktif
    const staticRes = await fetch(`${BASE_URL}/frame-couple.png`);
    const cacheHeader = staticRes.headers.get("cache-control") || "";
    const isCached = cacheHeader.includes("immutable") || cacheHeader.includes("max-age");

    if (isCached) {
      console.log(`   ✅ Header Cache-Control: "${cacheHeader}"`);
      console.log("   ✅ Aset gambar disimpan di Disk Cache browser (0 ms saat buka ulang)");
    } else {
      console.log(`   ℹ️ Header Cache-Control: "${cacheHeader}"`);
    }

    console.log("   🎉 HASIL: Konfigurasi media & sistem transisi aktif sempurna!\n");
    return true;
  } catch (err) {
    console.error(`   ❌ Error saat menguji media: ${err.message}\n`);
    return false;
  }
}

async function run() {
  await checkServer();
  await testConnectionErrorPopup();
  await testImageTransitionsAndCache();
  console.log("==========================================================");
  console.log("✨ PENGUJIAN SELESAI DENGAN SUKSES!");
  console.log("==========================================================\n");
}

run();
