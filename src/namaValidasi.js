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

export function validasiNama(input) {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, pesan: "Nama gak boleh kosong." };
  }

  if (trimmed.length < 3) {
    return { valid: false, pesan: "Nama minimal 3 huruf ya." };
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

export function bersihkanInputNama(input) {
  // Hapus karakter selain huruf dan spasi secara real-time saat mengetik
  return input.replace(/[^a-zA-Z\s]/g, "").slice(0, MAX_PANJANG_NAMA);
}

export const MAX_NAMA = MAX_PANJANG_NAMA;
