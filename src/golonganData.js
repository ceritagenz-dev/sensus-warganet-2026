// Bobot skor 1-5 untuk setiap opsi (index 0-4 = A-E) di setiap pertanyaan q1-q35
// 1 = vibe santai/pasrah/boncos, 5 = vibe produktif/ambis/cuan
// Dipakai untuk menghitung total skor (35-175) lalu dipetakan ke 30 golongan

export const BOBOT_SKOR = {
  q1: [2, 4, 1, 1, 3],
  q2: [3, 2, 4, 1, 5],
  q3: [2, 3, 1, 4, 5],
  q4: [3, 2, 1, 5, 2],
  q5: [5, 1, 1, 3, 4],
  q6: [3, 3, 3, 1, 3],
  q7: [2, 4, 1, 3, 5],
  q8: [1, 2, 2, 1, 1],
  q9: [1, 2, 3, 4, 1],
  q10: [2, 3, 2, 2, 5],
  q11: [2, 3, 2, 2, 3],
  q12: [4, 4, 3, 5, 1],
  q13: [2, 4, 1, 5, 4],
  q14: [3, 2, 4, 5, 2],
  q15: [5, 2, 3, 1, 1],
  q16: [5, 1, 2, 3, 1],
  q17: [3, 3, 3, 5, 1],
  q18: [2, 2, 3, 2, 2],
  q19: [3, 2, 1, 1, 5],
  q20: [4, 3, 1, 2, 2],
  q21: [5, 1, 2, 1, 4],
  q22: [2, 3, 2, 4, 2],
  q23: [4, 5, 1, 2, 2],
  q24: [3, 2, 3, 1, 2],
  q25: [5, 2, 1, 1, 5],
  q26: [2, 1, 5, 4, 1],
  q27: [1, 3, 4, 5, 3],
  q28: [2, 4, 5, 3, 1],
  q29: [3, 3, 2, 2, 3],
  q30: [4, 3, 4, 5, 5],
  q31: [4, 4, 5, 3, 1],
  q32: [2, 3, 4, 4, 1],
  q33: [5, 4, 2, 1, 1],
  q34: [1, 2, 4, 5, 1],
  q35: [3, 2, 1, 4, 1],
};

// 30 golongan, diurutkan dari skor rendah ke tinggi
export const GOLONGAN = [
  { nama: "Golongan Rebahan Mutlak", deskripsi: "Energi hidupmu 90% dihabiskan di kasur, dan itu sudah final." },
  { nama: "Golongan Pasrah Sejati", deskripsi: "Hidup mengalir aja, gak ada yang perlu dipaksain." },
  { nama: "Golongan Boncos Kronis", deskripsi: "Tanggal muda sultan, tanggal tua jadi rakyat biasa lagi." },
  { nama: "Golongan Numpang Hidup", deskripsi: "Disubsidi keluarga itu bukan aib, itu strategi." },
  { nama: "Golongan PHP Sepanjang Masa", deskripsi: "Niatnya banyak, eksekusinya nanti dulu." },
  { nama: "Golongan Mager Akut", deskripsi: "Kalau mager ada medalinya, kamu juara umum." },
  { nama: "Golongan Receh Bahagia", deskripsi: "Hidup sederhana, bahagia tetap maksimal." },
  { nama: "Golongan Halu Produktif", deskripsi: "Mimpi besar, progress nyicil, tapi tetap jalan." },
  { nama: "Golongan Santuy Berkelas", deskripsi: "Santai tapi tetap kelihatan punya rencana." },
  { nama: "Golongan Cukup-Cukup Aja", deskripsi: "Gak kekurangan, gak juga kelebihan. Pas." },
  { nama: "Golongan Hemat Pangkal Survive", deskripsi: "Bukan pelit, cuma realistis sama dompet." },
  { nama: "Golongan Sibuk Tapi Bingung", deskripsi: "Banyak kerjaan, tapi arah hidup masih dicari." },
  { nama: "Golongan Ambis Setengah Hati", deskripsi: "Niat ambis ada, eksekusi kadang nyerah duluan." },
  { nama: "Golongan Stabil Kalem", deskripsi: "Gak heboh, tapi semua berjalan terkendali." },
  { nama: "Golongan Produktif Kepo", deskripsi: "Kerja jalan, kepoin orang lain juga jalan." },
  { nama: "Golongan Hustler Receh", deskripsi: "Usaha jalan terus walau hasilnya masih cuan kecil." },
  { nama: "Golongan Mendekati Sultan", deskripsi: "Belum sultan, tapi udah keliatan arahnya kesana." },
  { nama: "Golongan Cuan Mengalir", deskripsi: "Rezeki dateng dari berbagai arah, syukur jalan terus." },
  { nama: "Golongan OKB Beneran", deskripsi: "Orang Kaya Baru yang prestasinya emang nyata." },
  { nama: "Golongan Sultan Tanpa Beban", deskripsi: "Hidup udah di level santuy karena emang udah aman." },
  { nama: "Golongan Bertahan Hidup Doang", deskripsi: "Targetnya simpel: survive sampai akhir bulan." },
  { nama: "Golongan Ngarep Tapi Santai", deskripsi: "Berharap hal baik terjadi, tapi gak maksa diri." },
  { nama: "Golongan Capek Tapi Lanjut", deskripsi: "Lelah iya, berhenti nanti dulu." },
  { nama: "Golongan Tukang PHP Diri Sendiri", deskripsi: "Janji ke diri sendiri paling sering diingkari." },
  { nama: "Golongan Mendadak Bijak", deskripsi: "Kadang random ngomong bijak padahal hidup berantakan." },
  { nama: "Golongan Modal Nekat", deskripsi: "Rencana belum matang, tapi jalan duluan aja." },
  { nama: "Golongan Pejuang Tanggal Tua", deskripsi: "Tanggal 25 ke atas adalah arena pertarungan sesungguhnya." },
  { nama: "Golongan Anti Mainstream", deskripsi: "Pilihan hidupmu emang beda dari kebanyakan orang." },
  { nama: "Golongan Investor Receh", deskripsi: "Mulai investasi dari nominal kecil, tapi konsisten." },
  { nama: "Golongan Crazy Rich Receh", deskripsi: "Gaya hidup sultan, kantong masih menyesuaikan." },
];

export function hitungSkorTotal(jawaban, bagianData) {
  let total = 0;
  for (const bagian of bagianData) {
    for (const p of bagian.pertanyaan) {
      const jawabanTeks = jawaban[p.id];
      if (!jawabanTeks) continue;
      const opsiIndex = p.opsi.indexOf(jawabanTeks);
      if (opsiIndex !== -1 && BOBOT_SKOR[p.id]) {
        total += BOBOT_SKOR[p.id][opsiIndex] || 3;
      } else {
        total += 3; // fallback netral kalau jawaban gak match (seharusnya gak terjadi)
      }
    }
  }
  return total;
}

export function tentukanGolongan(skorTotal) {
  // Skor minimum 35 (semua jawab bobot 1), maksimum 175 (semua jawab bobot 5)
  const MIN_SKOR = 35;
  const MAX_SKOR = 175;
  const rentang = MAX_SKOR - MIN_SKOR;
  const posisi = Math.max(0, Math.min(1, (skorTotal - MIN_SKOR) / rentang));
  const index = Math.min(GOLONGAN.length - 1, Math.floor(posisi * GOLONGAN.length));
  return GOLONGAN[index];
}
