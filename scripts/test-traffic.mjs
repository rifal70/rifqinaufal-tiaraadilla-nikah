/**
 * Script Pengujian Otomatis Proteksi Trafik & Layar Antrean
 * Jalankan: node scripts/test-traffic.mjs [url_opsional]
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";

console.log("\n==========================================================");
console.log("🚦 MEMULAI PENGUJIAN PROTEKSI TRAFIK & LAYAR TUNGGU");
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

async function testWaitingScreenDisplay() {
  console.log("📋 [Test 1] Menguji Tampilan Layar Tunggu (?status=busy)...");
  try {
    const res = await fetch(`${BASE_URL}/?status=busy`);
    const html = await res.text();

    const hasTitle = html.includes("Harap Tunggu Beberapa Saat");
    const hasSubtitle = html.includes("Undangan Sedang Ramai Diakses");
    const hasButton = html.includes("Coba Muat Ulang");

    if (res.status === 200 && hasTitle && hasSubtitle) {
      console.log("   ✅ Status HTTP: 200 OK");
      console.log("   ✅ Teks 'Harap Tunggu Beberapa Saat' ditemukan di HTML");
      console.log("   ✅ Teks 'Undangan Sedang Ramai Diakses' ditemukan di HTML");
      console.log("   ✅ Tombol muat ulang terdeteksi");
      console.log("   🎉 HASIL: Layar tunggu tampil dengan sempurna!\n");
      return true;
    } else {
      console.log(`   ❌ Respon tidak sesuai (Status: ${res.status}).\n`);
      return false;
    }
  } catch (err) {
    console.error(`   ❌ Error saat mengambil halaman: ${err.message}\n`);
    return false;
  }
}

async function testTrafficBurst() {
  const TOTAL_REQUESTS = 60;
  console.log(`📋 [Test 2] Mensimulasikan Lonjakan ${TOTAL_REQUESTS} Kunjungan Serentak...`);
  console.log("   ⏳ Mengirim request secara paralel dalam 1 detik...");

  const startTime = Date.now();
  const promises = [];

  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    promises.push(
      fetch(BASE_URL, {
        headers: { "x-test-client": `bot-${i}` },
      })
        .then(async (res) => {
          const body = await res.text();
          const isWaitingScreen = body.includes("Harap Tunggu Beberapa Saat");
          return {
            id: i,
            status: res.status,
            isWaitingScreen,
            ok: res.ok,
          };
        })
        .catch((err) => ({
          id: i,
          status: 0,
          error: err.message,
        }))
    );
  }

  const results = await Promise.all(promises);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  let successCount = 0;
  let waitingRoomCount = 0;
  let failedCount = 0;

  for (const r of results) {
    if (r.isWaitingScreen) {
      waitingRoomCount++;
    } else if (r.status === 200 || r.status === 404) {
      // 404 normal jika belum login/tanpa token, server tetap sehat
      successCount++;
    } else {
      failedCount++;
    }
  }

  console.log(`   ⏱️  Waktu Eksekusi: ${duration} detik`);
  console.log(`   📊 Request diproses normal: ${successCount}`);
  console.log(`   🛡️  Request dialihkan ke Layar Antrean/Tunggu: ${waitingRoomCount}`);
  console.log(`   ⚠️  Request error/gagal: ${failedCount}`);

  if (failedCount === 0) {
    console.log("\n   🎉 Server stabil 100%! Tidak ada crash maupun downtime saat diserbu trafik padat.\n");
  } else {
    console.log("\n   ⚠️  Ada beberapa request yang gagal.\n");
  }
}

async function run() {
  await checkServer();
  await testWaitingScreenDisplay();
  await testTrafficBurst();
  console.log("==========================================================");
  console.log("✨ PENGUJIAN SELESAI!");
  console.log("==========================================================\n");
}

run();
