import { useState, useEffect } from "react";

// Data Sensus Warganet 2026 - 35 pertanyaan, 3 bagian
const BAGIAN = [
  {
    judul: "Bagian 1",
    subjudul: "Kehidupan Sehari-hari",
    pertanyaan: [
      { id: "q1", label: "Kegiatan paling produktif pas lagi mager?", opsi: ["Scroll TikTok", "Nontonin video tutorial", "Tiduran mikir masa depan", "Chat mantan (nggak dikirim)", "Membersihkan galeri HP"] },
      { id: "q2", label: "Strategi kalau lagi boker di tempat umum?", opsi: ["Pasang musik keras", "Tahan napas", "Nunggu sepi banget", "Pasrah (yang penting plong)", "Langsung keluar (nggak pake lama)"] },
      { id: "q3", label: "Kebiasaan aneh sebelum tidur?", opsi: ["Scroll sosmed sampai mata perih", "Harus ada suara kipas", "Mikirin kesalahan masa lalu", "Cek kunci pintu 3x", "Harus minum air putih"] },
      { id: "q4", label: "Kamu tim apa kalau makan mie instan?", opsi: ["Kuah banyak", "Nyemek (air dikit)", "Diremes dimakan mentah", "Mewah (pake telur, keju, kornet)", "Mie instan campur nasi"] },
      { id: "q5", label: "Reaksi pas ada tukang parkir muncul?", opsi: ["Kasih uang pas", "Pura-pura nggak lihat", 'Bilang "nggak ada receh"', "Senyum terpaksa", "Langsung kasih uang 2 ribuan"] },
      { id: "q6", label: "Apa barang yang paling sering hilang?", opsi: ["Korek api", "Karet rambut", "Bolpen", "Harapan", "Sandal jepit"] },
      { id: "q7", label: "Kalau menang undian, hal pertama dilakuin?", opsi: ["Flexing di sosmed", "Langsung resign", "Beli barang nggak penting", "Diam-diam aja", "Langsung sedekah"] },
      { id: "q8", label: 'Definisi "tunggu 5 menit lagi" versi kamu?', opsi: ["1 jam kemudian", "Nunggu mood balik", "Tidur sebentar", "Nunggu diingetin orang", "Nggak bakal berangkat"] },
      { id: "q9", label: "Kalau lagi bosen, kamu milih:", opsi: ["Stalking mantan", "Belanja online", "Bersihin galeri HP", "Nonton tutorial masak", "Tidur seharian"] },
      { id: "q10", label: "Seberapa sering kamu ngomong sendiri?", opsi: ["Tiap detik", "Pas di kamar mandi", "Pas lagi marah", "Cuma pas lagi capek", "Nggak pernah"] },
      { id: "q11", label: "Aplikasi paling boros baterai?", opsi: ["TikTok", "Shopee", "Instagram", "Game Online", "WhatsApp"] },
      { id: "q12", label: "Pilihan sarapan paling the best?", opsi: ["Nasi uduk", "Bubur ayam", "Roti bakar", "Air putih doang", "Nggak sarapan"] },
      { id: "q13", label: "Kalau hujan pas mau pergi, kamu:", opsi: ["Batalin janji", "Tetap pergi", "Nunggu reda", "Pakai jas hujan poncho", "Terobos aja"] },
      { id: "q14", label: 'Seberapa sering kamu bilang "besok diet"?', opsi: ["Tiap hari", "Abis makan banyak", "Tiap awal bulan", "Nggak pernah bilang", "Kalau diajak temen doang"] },
      { id: "q15", label: "Kamu tipe orang yang:", opsi: ["Fast response", "Slow response", "Balas kalau ingat", "Cuma read doang", "Nggak dibalas sama sekali"] },
      { id: "q16", label: "Kalau ada notif grup kantor/tugas?", opsi: ["Langsung read", "Mute selamanya", "Read nanti pas mau tidur", "Cek dari lock screen", "Diabaikan sampai numpuk"] },
      { id: "q17", label: "Barang wajib bawa keluar rumah?", opsi: ["HP", "Dompet", "Powerbank", "Semua di atas", "Cuma bawa badan"] },
      { id: "q18", label: "Hal yang paling bikin emosi?", opsi: ["Internet lemot", "Antrean panjang", "Teman PHP", "HP lowbat", "Salah paham di chat"] },
      { id: "q19", label: "Kamu lebih milih:", opsi: ["Uang banyak tapi sendirian", "Teman banyak tapi bokek", "Pacar pelit", "Hidup santai tapi nggak punya tujuan", "Hidup sibuk tapi kaya"] },
      { id: "q20", label: "Apa yang lakuin kalau HP jatuh?", opsi: ["Cek layar duluan", "Cek orang sekitar", "Pura-pura nggak terjadi", "Istighfar", "Langsung diambil dengan panik"] },
    ],
  },
  {
    judul: "Bagian 2",
    subjudul: "Finansial & Realita",
    pertanyaan: [
      { id: "q21", label: "Status keuangan hari ini?", opsi: ["Cuan melimpah", "Boncos kebanyakan self-reward", "Gajian masih jauh", "Numpang hidup ortu", "Masih aman (tapi pas-pasan)"] },
      { id: "q22", label: "Pengeluaran paling nggak masuk akal?", opsi: ["Checkout keranjang Shopee", "Kopi kekinian", "Top-up game", "Biaya admin transfer", "Beli camilan random"] },
      { id: "q23", label: "Pemasukan terbesar berasal dari?", opsi: ["Gaji pokok", "Side hustle/Affiliate", "Dana abadi ortu", "Giveaway/Arisan", "Warisan (kalau ada)"] },
      { id: "q24", label: "Harta paling berharga saat ini?", opsi: ["HP RAM besar", "Koleksi skincare", "Kendaraan nyicil", "Harapan & mimpi", "Foto-foto kenangan"] },
      { id: "q25", label: 'Definisi "Investasi" versi kamu?', opsi: ["Saham/Kripto", "Skincare", "Makanan enak", "Nabung bawah bantal", "Investasi ilmu/kursus"] },
      { id: "q26", label: "Kalau saldo tinggal 50 ribu, prioritasnya?", opsi: ["Beli kuota", "Makan enak", "Ditabung", "Jaga-jaga", "Langsung ditarik tunai"] },
      { id: "q27", label: "Gaya hidup idamkan?", opsi: ["Jadi sultan tanpa kerja", "Stay at home (affiliate)", "Bos besar", "Hidup tenang sederhana", "Traveling keliling dunia"] },
      { id: "q28", label: "Apa yang dilakuin kalau bokek parah?", opsi: ["Pura-pura sibuk", "Uninstal aplikasi belanja", "Jual barang bekas", "Puasa Senin-Kamis", "Minjem teman"] },
      { id: "q29", label: "Barang yang bikin istighfar pas lihat harga?", opsi: ["Tiket konser", "Skincare mahal", "Paket data", "Barang flash sale", "Harga bensin/sebak"] },
      { id: "q30", label: "Target cuan akhir 2026?", opsi: ["Jadi OKB", "Beli barang impian", "Lunas cicilan", "Hidup tenang", "Bisa kasih orang tua"] },
    ],
  },
  {
    judul: "Bagian 3",
    subjudul: "Kepo Maksimal",
    pertanyaan: [
      { id: "q31", label: "Pekerjaan kamu saat ini?", opsi: ["Karyawan korporat (berangkat pagi pulang malam)", "Affiliate / Content Creator (pejuang algoritma)", "Trader / Investor (hidup dari chart)", "Freelancer (pekerja tanpa jam kerja jelas)", "Masih pelajar / Sedang mencari jati diri"] },
      { id: "q32", label: "Rata-rata total pendapatanmu per bulan?", opsi: ["Di bawah UMR (cukup buat bertahan hidup)", "Setara UMR (cukup buat makan & bayar kos)", "Di atas UMR (bisa nabung sedikit)", 'Sultan" (pendapatan nggak menentu tapi sering hedon)', "Nggak punya pendapatan (masih disubsidi keluarga)"] },
      { id: "q33", label: "Total pengeluaran rata-rata per bulan?", opsi: ["Hemat banget (di bawah 1 juta)", "Normal (1 - 3 juta)", "Hedon (3 - 7 juta)", "High class (di atas 7 juta)", "Nggak pernah ngitung (tahu-tahu saldo nol)"] },
      { id: "q34", label: "Berapa gram emas yang kamu simpan (tabungan)?", opsi: ["Belum punya (lagi nabung buat beli)", "1 - 5 gram (baru mulai investasi)", "5 - 20 gram (sudah mulai aman)", "Di atas 20 gram (investor sejati)", "Emas? Adanya emas-emasan palsu di pasar malam"] },
      { id: "q35", label: "Status hubungan sama mantan?", opsi: ["Masih chat", "Udah blok total", "Diem-diem an", "Jadi temen", "Gak punya mantan"] },
      { id: "q36", label: "Berapa kali pindah kerja/pindah haluan dalam 2 tahun terakhir?", opsi: ["Belum pernah", "1 kali", "2-3 kali", "Lebih dari 3 kali", "Masih di tempat pertama"] },
      { id: "q37", label: "Ada utang/pinjol yang belum lunas?", opsi: ["Gak ada, bersih", "Ada tapi kecil", "Ada dan lumayan", "Banyak, jangan tanya", "Lagi nyicil terus"] },
      { id: "q38", label: "Siapa yang tau detail gaji/income kamu?", opsi: ["Gak ada yang tau", "Pasangan doang", "Keluarga deket", "Semua temen tau", "Sengaja di-flex ke semua orang"] },
      { id: "q39", label: "Kalau tiba-tiba dapat 10 juta gratis, ngapain duluan?", opsi: ["Ditabung semua", "Bayar utang dulu", "Healing/liburan", "Belanja barang impian", "Dibagi ke keluarga"] },
      { id: "q40", label: "Sudah follow X @ceritagenz?", opsi: ["Sudah dong, biar update terus!", "Baru aja follow gara-gara sensus ini.", "Belum, otw cari dulu.", "Sudah dari dulu, follower setia!", "Apa itu X? (Masih pakai cara tradisional)"] },
    ],
  },
];

const TOTAL_PERTANYAAN = BAGIAN.reduce((sum, b) => sum + b.pertanyaan.length, 0);

// Bobot skor 1-5 untuk setiap opsi (index 0-4 = A-E) di setiap pertanyaan q1-q40
// 1 = vibe santai/pasrah/boncos, 5 = vibe produktif/ambis/cuan
// Dipakai untuk menghitung total skor (40-200) lalu dipetakan ke 30 golongan

const BOBOT_SKOR = {
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
  q35: [2, 4, 2, 3, 3],
  q36: [5, 3, 2, 1, 4],
  q37: [5, 3, 2, 1, 2],
  q38: [3, 3, 2, 1, 2],
  q39: [4, 3, 2, 1, 5],
  q40: [3, 4, 1, 5, 2],
};

// 30 golongan, diurutkan dari skor rendah ke tinggi
const GOLONGAN = [
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

function hitungSkorTotal(jawaban, bagianData) {
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

function tentukanGolongan(skorTotal) {
  // Skor minimum 40 (semua jawab bobot 1), maksimum 200 (semua jawab bobot 5)
  const MIN_SKOR = 40;
  const MAX_SKOR = 200;
  const rentang = MAX_SKOR - MIN_SKOR;
  const posisi = Math.max(0, Math.min(1, (skorTotal - MIN_SKOR) / rentang));
  const index = Math.min(GOLONGAN.length - 1, Math.floor(posisi * GOLONGAN.length));
  return GOLONGAN[index];
}

// Validasi input nama responden
// Aturan: hanya huruf dan spasi, maksimal 20 karakter, tidak boleh mengandung kata kasar

const MAX_PANJANG_NAMA = 20;

// Daftar kata kasar/terlarang (Indonesia & Inggris), dicek tanpa case-sensitive
// Catatan: daftar ini sengaja singkat, fokus ke kata-kata paling umum
const KATA_TERLARANG = [
  "anjing", "anjg", "anj", "babi", "bangsat", "bgsat", "kontol", "kntl",
  "memek", "mmk", "tai", "taik", "goblok", "gblk", "tolol", "idiot",
  "bajingan", "kampret", "keparat", "asu", "jancok", "jancuk", "cok",
  "pepek", "pukimak", "lonte", "pelacur", "sundal", "brengsek",
  "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy",
  "cunt", "slut", "whore", "nigger", "nigga", "fag", "retard",
];

function validasiNama(input) {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, pesan: "Nama gak boleh kosong." };
  }

  if (trimmed.length > MAX_PANJANG_NAMA) {
    return { valid: false, pesan: `Nama maksimal ${MAX_PANJANG_NAMA} karakter.` };
  }

  // Hanya boleh huruf dan spasi (termasuk huruf dengan diakritik dasar)
  const hanyaHuruf = /^[a-zA-Z\s]+$/;
  if (!hanyaHuruf.test(trimmed)) {
    return { valid: false, pesan: "Nama cuma boleh huruf, gak boleh angka/simbol." };
  }

  const lowerInput = trimmed.toLowerCase().replace(/\s+/g, "");
  for (const kata of KATA_TERLARANG) {
    if (lowerInput.includes(kata)) {
      return { valid: false, pesan: "Nama mengandung kata yang gak boleh dipakai." };
    }
  }

  return { valid: true, pesan: null };
}

function bersihkanInputNama(input) {
  // Hapus karakter selain huruf dan spasi secara real-time saat mengetik
  return input.replace(/[^a-zA-Z\s]/g, "").slice(0, MAX_PANJANG_NAMA);
}

const MAX_NAMA = MAX_PANJANG_NAMA;


export default function App() {
  const [step, setStep] = useState("intro");
  const [jawaban, setJawaban] = useState({});
  const [semuaResponden, setSemuaResponden] = useState([]);
  const [totalResponden, setTotalResponden] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nomorResponden, setNomorResponden] = useState(null);
  const [golonganHasil, setGolonganHasil] = useState(null);
  const [error, setError] = useState(null);
  const [sudahPernahIsi, setSudahPernahIsi] = useState(false);
  const [nama, setNama] = useState("");
  const [errorNama, setErrorNama] = useState(null);
  const [namaTersimpan, setNamaTersimpan] = useState("");

  useEffect(() => {
    muatData();
    try {
      const sudahIsi = localStorage.getItem("sensus_warganet_2026_sudah_isi");
      if (sudahIsi) {
        setSudahPernahIsi(true);
        const golonganTersimpan = localStorage.getItem("sensus_warganet_2026_golongan");
        const nomorTersimpan = localStorage.getItem("sensus_warganet_2026_nomor");
        const namaTersimpanLS = localStorage.getItem("sensus_warganet_2026_nama");
        if (golonganTersimpan) {
          setGolonganHasil(JSON.parse(golonganTersimpan));
          setNomorResponden(nomorTersimpan ? parseInt(nomorTersimpan, 10) : null);
        }
        if (namaTersimpanLS) {
          setNamaTersimpan(namaTersimpanLS);
        }
      }
    } catch (e) {
      // localStorage tidak tersedia, lanjutkan tanpa pengecekan
    }
  }, []);

  async function muatData() {
    try {
      const result = await window.storage.get("sensus_warganet_2026_v4", true);
      if (result && result.value) {
        const parsed = JSON.parse(result.value);
        setSemuaResponden(parsed);
        setTotalResponden(parsed.length);
      }
    } catch (e) {
      setSemuaResponden([]);
      setTotalResponden(0);
    }
  }

  function pilih(id, value) {
    setJawaban((prev) => ({ ...prev, [id]: value }));
  }

  const bagianIndex = step.startsWith("bagian-") ? parseInt(step.split("-")[1], 10) : null;

  function bagianTerjawabLengkap(idx) {
    return BAGIAN[idx].pertanyaan.every((p) => jawaban[p.id]);
  }

  function lanjutKeBagianSelanjutnya() {
    if (bagianIndex < BAGIAN.length - 1) {
      setStep(`bagian-${bagianIndex + 1}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(null);
      setStep("isi-nama");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submitNama() {
    const hasil = validasiNama(nama);
    if (!hasil.valid) {
      setErrorNama(hasil.pesan);
      return;
    }
    setErrorNama(null);
    kirimSensus(nama.trim());
  }

  async function kirimSensus(namaFinal) {
    setLoading(true);
    setError(null);

    const skorTotal = hitungSkorTotal(jawaban, BAGIAN);
    const golongan = tentukanGolongan(skorTotal);

    try {
      let current = [];
      try {
        const result = await window.storage.get("sensus_warganet_2026_v4", true);
        if (result && result.value) current = JSON.parse(result.value);
      } catch (e) {
        current = [];
      }

      const entry = {
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        created_at: new Date().toISOString(),
        ...jawaban,
        skor: skorTotal,
        golongan: golongan.nama,
        nama: namaFinal,
      };

      const updated = [entry, ...current].slice(0, 500);
      await window.storage.set("sensus_warganet_2026_v4", JSON.stringify(updated), true);

      setSemuaResponden(updated);
      setTotalResponden(updated.length);
      setNomorResponden(updated.length);
      setGolonganHasil(golongan);
      setNamaTersimpan(namaFinal);
      setStep("submitted");

      try {
        localStorage.setItem("sensus_warganet_2026_sudah_isi", "true");
        localStorage.setItem("sensus_warganet_2026_golongan", JSON.stringify(golongan));
        localStorage.setItem("sensus_warganet_2026_nomor", String(updated.length));
        localStorage.setItem("sensus_warganet_2026_nama", namaFinal);
      } catch (e) {
        // localStorage tidak tersedia
      }
    } catch (e) {
      setError("Gagal mengirim data. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const totalTerjawab = Object.keys(jawaban).filter((k) => jawaban[k]).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F6F0",
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#1A1A1A",
        padding: "24px 16px 64px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <KopSurat />

        {step === "intro" && (
          <Intro
            onMulai={() => setStep("bagian-0")}
            jumlahResponden={totalResponden}
            sudahPernahIsi={sudahPernahIsi}
            golonganHasil={golonganHasil}
            nomorResponden={nomorResponden}
            namaTersimpan={namaTersimpan}
            onLihatHasil={() => setStep("hasil")}
          />
        )}

        {bagianIndex !== null && (
          <BagianForm
            bagian={BAGIAN[bagianIndex]}
            bagianIndex={bagianIndex}
            totalBagian={BAGIAN.length}
            jawaban={jawaban}
            pilih={pilih}
            totalTerjawab={totalTerjawab}
            onLanjut={lanjutKeBagianSelanjutnya}
            bisaLanjut={bagianTerjawabLengkap(bagianIndex)}
            isTerakhir={bagianIndex === BAGIAN.length - 1}
            loading={loading}
            error={error}
          />
        )}

        {step === "isi-nama" && (
          <IsiNama
            nama={nama}
            setNama={setNama}
            errorNama={errorNama}
            onSubmit={submitNama}
            loading={loading}
            errorKirim={error}
          />
        )}

        {step === "submitted" && (
          <Submitted
            nomorResponden={nomorResponden}
            golonganHasil={golonganHasil}
            namaTersimpan={namaTersimpan}
            onLihatHasil={() => setStep("hasil")}
          />
        )}

        {step === "hasil" && (
          <Hasil
            semuaResponden={semuaResponden}
            totalResponden={totalResponden}
            onKembali={() => {
              setStep("intro");
              setJawaban({});
            }}
            onRefresh={muatData}
          />
        )}
      </div>
    </div>
  );
}

function KopSurat() {
  return (
    <div
      style={{
        borderBottom: "3px double #1B3A6B",
        paddingBottom: 12,
        marginBottom: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#6B6B6B", marginBottom: 4 }}>
        REPUBLIK INTERNET INDONESIA
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#1B3A6B", letterSpacing: "0.02em" }}>
        SENSUS WARGANET 2026
      </div>
    </div>
  );
}

function Intro({ onMulai, jumlahResponden, sudahPernahIsi, golonganHasil, nomorResponden, namaTersimpan, onLihatHasil }) {
  if (sudahPernahIsi) {
    return (
      <div>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #D8D4C8",
            borderRadius: 4,
            padding: 24,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#B8B4A8",
              color: "#FFFFFF",
              padding: "6px 18px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            SUDAH TERCATAT
          </div>
          <p style={{ lineHeight: 1.7, fontSize: 15, margin: 0 }}>
            Kamu sudah pernah mengisi sensus ini dari perangkat ini. Setiap warganet hanya
            bisa disensus satu kali biar datanya tetap valid.
          </p>

          {golonganHasil && (
            <div
              style={{
                background: "#F8F6F0",
                border: "1.5px dashed #1B3A6B",
                borderRadius: 6,
                padding: "16px 18px",
                marginTop: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#6B6B6B",
                  fontFamily: "'Courier New', monospace",
                  marginBottom: 6,
                  letterSpacing: "0.05em",
                }}
              >
                HASIL SENSUS KAMU
              </div>
              {namaTersimpan && (
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
                  {namaTersimpan}
                </div>
              )}
              <div style={{ fontSize: 19, fontWeight: 700, color: "#1B3A6B" }}>
                {golonganHasil.nama}
              </div>
            </div>
          )}
        </div>

        {golonganHasil && <ShareButtons golonganHasil={golonganHasil} />}

        <button onClick={onLihatHasil} style={btnPrimary}>
          LIHAT HASIL SENSUS WARGA LAIN
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D8D4C8",
          borderRadius: 4,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <p style={{ lineHeight: 1.7, fontSize: 15, margin: 0 }}>
          Dengan ini, Badan Sensus Warganet menetapkan bahwa setiap warganet yang membuka
          tautan ini secara otomatis terdaftar sebagai responden wajib. Formulir terdiri dari{" "}
          <strong>{TOTAL_PERTANYAAN} pertanyaan</strong>, dibagi jadi 3 bagian: Kehidupan
          Sehari-hari, Finansial &amp; Realita, dan Kepo Maksimal.
        </p>
        <p style={{ lineHeight: 1.7, fontSize: 15, marginTop: 12, marginBottom: 0 }}>
          Jawaban tidak diaudit siapa-siapa, tidak dijamin akurat, tapi dijamin jujur. Setiap
          warganet hanya bisa disensus satu kali, jadi pastikan jawabanmu jujur dari awal.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: "#6B6B6B",
          marginBottom: 20,
          padding: "0 4px",
        }}
      >
        <span>
          Status: <strong style={{ color: "#1B3A6B" }}>SENSUS DIBUKA</strong>
        </span>
        <span style={{ fontFamily: "'Courier New', monospace" }}>
          {jumlahResponden} responden terdata
        </span>
      </div>

      <button onClick={onMulai} style={btnPrimary}>
        MULAI SENSUS ({TOTAL_PERTANYAAN} PERTANYAAN)
      </button>
    </div>
  );
}

function BagianForm({
  bagian,
  bagianIndex,
  totalBagian,
  jawaban,
  pilih,
  totalTerjawab,
  onLanjut,
  bisaLanjut,
  isTerakhir,
  loading,
  error,
}) {
  return (
    <div>
      <SectionHeader
        judul={bagian.judul}
        subjudul={bagian.subjudul}
        totalBagian={totalBagian}
        totalTerjawab={totalTerjawab}
      />

      {bagian.pertanyaan.map((p) => {
        const nomor = p.id.replace("q", "");
        return (
          <div key={p.id} style={cardStyle}>
            <div
              style={{
                fontSize: 13,
                color: "#1B3A6B",
                fontFamily: "'Courier New', monospace",
                marginBottom: 8,
              }}
            >
              PERTANYAAN {nomor.padStart(2, "0")}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
              {p.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {p.opsi.map((opsi, i) => {
                const huruf = ["A", "B", "C", "D", "E"][i];
                const aktif = jawaban[p.id] === opsi;
                return (
                  <button key={opsi} onClick={() => pilih(p.id, opsi)} style={optionStyle(aktif)}>
                    <span
                      style={{
                        fontWeight: 700,
                        marginRight: 8,
                        color: aktif ? "#1B3A6B" : "#9CA3AF",
                      }}
                    >
                      {huruf}.
                    </span>
                    {opsi}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <div style={{ color: "#B91C1C", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
          {error}
        </div>
      )}

      <button
        onClick={onLanjut}
        disabled={!bisaLanjut || loading}
        style={{
          ...btnPrimary,
          background: bisaLanjut ? "#1B3A6B" : "#B8B4A8",
          cursor: bisaLanjut && !loading ? "pointer" : "not-allowed",
        }}
      >
        {loading
          ? "MENGIRIM..."
          : isTerakhir
          ? "SELESAI & KIRIM SENSUS"
          : `LANJUT KE ${BAGIAN[bagianIndex + 1].judul.toUpperCase()}`}
      </button>
      {!bisaLanjut && (
        <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
          Lengkapi semua pertanyaan di bagian ini dulu, Pak/Bu.
        </div>
      )}
    </div>
  );
}

function SectionHeader({ judul, subjudul, totalBagian, totalTerjawab }) {
  return (
    <div
      style={{
        background: "#1B3A6B",
        color: "#F8F6F0",
        borderRadius: 4,
        padding: "16px 18px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75, fontFamily: "'Courier New', monospace" }}>
            {judul.toUpperCase()} DARI {totalBagian}
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{subjudul}</div>
        </div>
        <div style={{ fontSize: 12, fontFamily: "'Courier New', monospace", opacity: 0.85 }}>
          {totalTerjawab}/{TOTAL_PERTANYAAN}
        </div>
      </div>
    </div>
  );
}

function IsiNama({ nama, setNama, errorNama, onSubmit, loading, errorKirim }) {
  function handleChange(e) {
    const bersih = bersihkanInputNama(e.target.value);
    setNama(bersih);
  }

  const namaKosong = nama.trim().length === 0;

  return (
    <div>
      <div
        style={{
          background: "#1B3A6B",
          color: "#F8F6F0",
          borderRadius: 4,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.75, fontFamily: "'Courier New', monospace" }}>
          LANGKAH TERAKHIR
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>Siapa nama kamu?</div>
      </div>

      <div style={cardStyle}>
        <input
          type="text"
          value={nama}
          onChange={handleChange}
          maxLength={MAX_NAMA}
          autoFocus
          style={{
            width: "100%",
            padding: "12px 14px",
            fontSize: 16,
            border: errorNama ? "1.5px solid #B91C1C" : "1px solid #B8B4A8",
            borderRadius: 3,
            fontFamily: "Georgia, serif",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 11,
            color: "#9CA3AF",
            marginTop: 6,
            fontFamily: "'Courier New', monospace",
          }}
        >
          <span>{nama.length}/{MAX_NAMA}</span>
        </div>
        {errorNama && (
          <div style={{ color: "#B91C1C", fontSize: 13, marginTop: 6 }}>{errorNama}</div>
        )}
      </div>

      {errorKirim && (
        <div style={{ color: "#B91C1C", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
          {errorKirim}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={loading || namaKosong}
        style={{
          ...btnPrimary,
          background: namaKosong ? "#B8B4A8" : "#1B3A6B",
          cursor: loading || namaKosong ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "MENGIRIM..." : "SELESAI & KIRIM SENSUS"}
      </button>
    </div>
  );
}

function Submitted({ nomorResponden, golonganHasil, namaTersimpan, onLihatHasil }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          background: "#FFFFFF",
          border: "2px solid #1B3A6B",
          borderRadius: 4,
          padding: "32px 24px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#1B3A6B",
            color: "#F8F6F0",
            padding: "6px 18px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            marginBottom: 16,
          }}
        >
          SENSUS SELESAI
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1B3A6B", marginBottom: 6 }}>
          Selamat, sensus selesai!
        </div>
        <div style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 16 }}>
          Makasih udah jujur, warganet sejati!
        </div>

        {golonganHasil && (
          <div
            style={{
              background: "#F8F6F0",
              border: "1.5px dashed #1B3A6B",
              borderRadius: 6,
              padding: "16px 18px",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#6B6B6B",
                fontFamily: "'Courier New', monospace",
                marginBottom: 6,
                letterSpacing: "0.05em",
              }}
            >
              KAMU TERMASUK
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#1B3A6B", marginBottom: 6 }}>
              {golonganHasil.nama}
            </div>
            <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.5 }}>
              {golonganHasil.deskripsi}
            </div>
          </div>
        )}

        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            color: "#1A1A1A",
            background: "#F8F6F0",
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: 3,
            border: "1px dashed #B8B4A8",
          }}
        >
          {namaTersimpan || `RESPONDEN #${String(nomorResponden).padStart(4, "0")}`}
        </div>
      </div>

      {golonganHasil && <ShareButtons golonganHasil={golonganHasil} />}

      <button onClick={onLihatHasil} style={btnPrimary}>
        LIHAT HASIL SENSUS WARGA LAIN
      </button>
    </div>
  );
}

function ShareButtons({ golonganHasil }) {
  const [salinStatus, setSalinStatus] = useState(null);

  const linkWebsite = typeof window !== "undefined" ? window.location.href : "";
  const teksShare = `Hasil Sensus Warganet 2026 aku: ${golonganHasil.nama}!\n"${golonganHasil.deskripsi}"\n\nIkutan sensusnya di ${linkWebsite}`;

  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(teksShare)}`;
    window.open(url, "_blank");
  }

  function shareX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(teksShare)}`;
    window.open(url, "_blank");
  }

  async function copyUntuk(platform) {
    try {
      await navigator.clipboard.writeText(teksShare);
      setSalinStatus(platform);
      setTimeout(() => setSalinStatus(null), 2500);
    } catch (e) {
      setSalinStatus("gagal");
      setTimeout(() => setSalinStatus(null), 2500);
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: "#6B6B6B",
          marginBottom: 8,
          fontFamily: "'Courier New', monospace",
          letterSpacing: "0.05em",
        }}
      >
        BAGIKAN HASIL SENSUS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <button onClick={shareWhatsApp} style={btnShare("#1B3A6B")}>
          WhatsApp
        </button>
        <button onClick={shareX} style={btnShare("#1B3A6B")}>
          X
        </button>
        <button onClick={() => copyUntuk("TikTok")} style={btnShare("#FFFFFF", "#1B3A6B")}>
          Copy buat TikTok
        </button>
        <button onClick={() => copyUntuk("Instagram Story")} style={btnShare("#FFFFFF", "#1B3A6B")}>
          Copy buat IG Story
        </button>
      </div>
      {salinStatus && (
        <div style={{ fontSize: 12, color: "#1B3A6B", fontWeight: 700, marginBottom: 8 }}>
          {salinStatus === "gagal"
            ? "Gagal menyalin, coba lagi."
            : `Tersalin! Tinggal paste di ${salinStatus}.`}
        </div>
      )}

      <button
        onClick={() => window.open("https://x.com/ceritagenz", "_blank")}
        style={{
          width: "100%",
          padding: "10px 0",
          background: "#000000",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        @ceritagenz
      </button>
    </div>
  );
}

function btnShare(bg, border) {
  return {
    padding: "10px 0",
    background: bg,
    color: bg === "#FFFFFF" ? "#1B3A6B" : "#F8F6F0",
    border: border ? `1px solid ${border}` : "none",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "Georgia, serif",
  };
}

function Hasil({ semuaResponden, totalResponden, onKembali, onRefresh }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1B3A6B" }}>
          HASIL SENSUS ({totalResponden} responden)
        </div>
        <button onClick={onRefresh} style={btnGhost}>
          ⟳ Muat ulang
        </button>
      </div>

      {semuaResponden.length === 0 && (
        <div style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>
          Belum ada data. Jadilah responden pertama!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {semuaResponden.map((r, idx) => (
          <div key={r.id || idx} style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                color: "#9CA3AF",
                marginBottom: 6,
              }}
            >
              <span>{r.nama || `Responden #${String(totalResponden - idx).padStart(4, "0")}`}</span>
              <span>{formatWaktu(r.created_at)}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1B3A6B" }}>
              {r.golongan || "Belum terklasifikasi"}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onKembali} style={btnSecondary}>
        KEMBALI KE HALAMAN AWAL
      </button>
    </div>
  );
}

function formatWaktu(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
}

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #D8D4C8",
  borderRadius: 4,
  padding: 18,
  marginBottom: 14,
};

function optionStyle(aktif) {
  return {
    textAlign: "left",
    padding: "10px 14px",
    borderRadius: 3,
    border: aktif ? "1.5px solid #1B3A6B" : "1px solid #D8D4C8",
    background: aktif ? "#EAF0F8" : "#FFFFFF",
    color: aktif ? "#1B3A6B" : "#1A1A1A",
    fontWeight: aktif ? 700 : 400,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "Georgia, serif",
    width: "100%",
    lineHeight: 1.4,
  };
}

const btnPrimary = {
  width: "100%",
  padding: "14px 0",
  background: "#1B3A6B",
  color: "#F8F6F0",
  border: "none",
  borderRadius: 4,
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "0.02em",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
};

const btnSecondary = {
  width: "100%",
  padding: "12px 0",
  background: "#FFFFFF",
  color: "#1B3A6B",
  border: "1px solid #1B3A6B",
  borderRadius: 4,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 20,
  fontFamily: "Georgia, serif",
};

const btnGhost = {
  fontSize: 12,
  padding: "6px 10px",
  background: "#FFFFFF",
  border: "1px solid #D8D4C8",
  borderRadius: 3,
  cursor: "pointer",
  color: "#1B3A6B",
  fontFamily: "Georgia, serif",
};

const btnExpandStyle = {
  fontSize: 12,
  padding: "6px 0",
  background: "transparent",
  border: "none",
  color: "#1B3A6B",
  cursor: "pointer",
  fontFamily: "Georgia, serif",
  textAlign: "left",
  width: "100%",
};
