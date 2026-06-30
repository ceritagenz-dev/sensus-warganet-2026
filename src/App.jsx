import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { BAGIAN, TOTAL_PERTANYAAN } from "./sensusData";
import { hitungSkorTotal, tentukanGolongan, pilihDeskripsiAcak } from "./golonganData";
import { pilihRekomendasiAcak } from "./rekomendasiData";
import { validasiNama, bersihkanInputNama, MAX_NAMA } from "./namaValidasi";

// ====== TOKEN DESAIN ======
const WARNA = {
  primer: "#4338CA",
  primerGelap: "#312399",
  aksenTerang: "#6D5CE7",
  kuning: "#FBBF24",
  kuningGelap: "#F59E0B",
  bgSoft: "#EEF2FF",
  putih: "#FFFFFF",
  teksGelap: "#1E1B4B",
  teksAbu: "#6B647F",
  garis: "#DDD6FE",
};

const FONT_DISPLAY = "'Baloo 2', 'Fredoka', system-ui, sans-serif";
const FONT_BODY = "'Quicksand', system-ui, -apple-system, sans-serif";

const gradientBg =
  "linear-gradient(160deg, #4338CA 0%, #5A47D6 35%, #6D5CE7 70%, #8B7CF0 100%)";

// Daftar flat semua 40 pertanyaan, dengan referensi bagian asalnya
const SEMUA_PERTANYAAN = BAGIAN.flatMap((bagian) =>
  bagian.pertanyaan.map((p) => ({ ...p, namaBagian: bagian.subjudul }))
);

export default function App() {
  const [step, setStep] = useState("intro");
  const [pertanyaanIndex, setPertanyaanIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [semuaResponden, setSemuaResponden] = useState([]);
  const [totalResponden, setTotalResponden] = useState(0);
  const [nomorResponden, setNomorResponden] = useState(null);
  const [golonganHasil, setGolonganHasil] = useState(null);
  const [error, setError] = useState(null);
  const [sudahPernahIsi, setSudahPernahIsi] = useState(false);
  const [nama, setNama] = useState("");
  const [errorNama, setErrorNama] = useState(null);
  const [namaTersimpan, setNamaTersimpan] = useState("");
  const [sedangTransisi, setSedangTransisi] = useState(false);
  const [namaTersimpanSementara, setNamaTersimpanSementara] = useState("");

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
    const { data, error } = await supabase
      .from("sensus_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) setSemuaResponden(data);

    const { count } = await supabase
      .from("sensus_responses")
      .select("*", { count: "exact", head: true });

    if (count !== null) setTotalResponden(count);
  }

  function scrollKeAtas() {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }

  // Klik jawaban: simpan, lalu auto-advance ke soal berikutnya setelah jeda singkat
  // sedangTransisi mengunci klik berikutnya agar spam-klik tidak menyebabkan lompat step
  function pilihJawaban(id, value) {
    if (sedangTransisi) return;
    setSedangTransisi(true);
    setJawaban((prev) => ({ ...prev, [id]: value }));

    setTimeout(() => {
      if (pertanyaanIndex < SEMUA_PERTANYAAN.length - 1) {
        setPertanyaanIndex((prev) => prev + 1);
        scrollKeAtas();
        setSedangTransisi(false);
      } else {
        kirimSensus(namaTersimpanSementara);
      }
    }, 260);
  }

  function kembaliKeSoalSebelumnya() {
    if (pertanyaanIndex > 0 && !sedangTransisi) {
      setPertanyaanIndex((prev) => prev - 1);
      scrollKeAtas();
    }
  }

  function submitNama() {
    const hasil = validasiNama(nama);
    if (!hasil.valid) {
      setErrorNama(hasil.pesan);
      return;
    }
    setErrorNama(null);
    setNamaTersimpanSementara(nama.trim());
    setPertanyaanIndex(0);
    setStep("soal");
    scrollKeAtas();
  }

  async function kirimSensus(namaFinal) {
    setStep("loading");
    setError(null);

    const skorTotal = hitungSkorTotal(jawaban, BAGIAN);
    const golongan = tentukanGolongan(skorTotal);
    const deskripsiTerpilih = pilihDeskripsiAcak(golongan);
    const rekomendasiTerpilih = pilihRekomendasiAcak(golongan.nama);
    const golonganUntukDisimpan = {
      nama: golongan.nama,
      deskripsi: deskripsiTerpilih,
      rekomendasi: rekomendasiTerpilih,
    };

    const waktuMulai = Date.now();
    const JEDA_MINIMAL = 1400;

    const { error } = await supabase.from("sensus_responses").insert([
      {
        ...jawaban,
        skor: skorTotal,
        golongan: golongan.nama,
        golongan_deskripsi: deskripsiTerpilih,
        golongan_rekomendasi: rekomendasiTerpilih,
        nama: namaFinal,
      },
    ]);

    const sisaWaktu = JEDA_MINIMAL - (Date.now() - waktuMulai);
    if (sisaWaktu > 0) {
      await new Promise((resolve) => setTimeout(resolve, sisaWaktu));
    }

    if (error) {
      setError("Gagal mengirim data. Coba lagi ya.");
      setStep("soal");
      setSedangTransisi(false);
      return;
    }

    await muatData();
    setNomorResponden(totalResponden + 1);
    setGolonganHasil(golonganUntukDisimpan);
    setNamaTersimpan(namaFinal);
    setStep("submitted");

    try {
      localStorage.setItem("sensus_warganet_2026_sudah_isi", "true");
      localStorage.setItem("sensus_warganet_2026_golongan", JSON.stringify(golonganUntukDisimpan));
      localStorage.setItem("sensus_warganet_2026_nomor", String(totalResponden + 1));
      localStorage.setItem("sensus_warganet_2026_nama", namaFinal);
    } catch (e) {
      // localStorage tidak tersedia, lewati saja
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: gradientBg,
        fontFamily: FONT_BODY,
        color: WARNA.teksGelap,
        padding: "28px 16px 64px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Quicksand:wght@400;500;600;700&display=swap');
      `}</style>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {step === "intro" && (
          <>
            <KopSurat />
            <Intro
              onMulai={() => setStep("isi-nama")}
              jumlahResponden={totalResponden}
              sudahPernahIsi={sudahPernahIsi}
              golonganHasil={golonganHasil}
              nomorResponden={nomorResponden}
              namaTersimpan={namaTersimpan}
              onLihatHasil={() => setStep("hasil")}
            />
          </>
        )}

        {step === "isi-nama" && (
          <IsiNama
            nama={nama}
            setNama={setNama}
            errorNama={errorNama}
            onSubmit={submitNama}
          />
        )}

        {step === "soal" && (
          <SoalTunggal
            pertanyaan={SEMUA_PERTANYAAN[pertanyaanIndex]}
            nomorSoal={pertanyaanIndex + 1}
            totalSoal={SEMUA_PERTANYAAN.length}
            jawabanTerpilih={jawaban[SEMUA_PERTANYAAN[pertanyaanIndex].id]}
            onPilih={pilihJawaban}
            onKembali={kembaliKeSoalSebelumnya}
            bisaKembali={pertanyaanIndex > 0}
          />
        )}

        {step === "loading" && <LoadingHasil />}

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
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>🇮🇩</div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.85)",
          marginBottom: 6,
          fontFamily: FONT_BODY,
          fontWeight: 600,
        }}
      >
        REPUBLIK INTERNET INDONESIA
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: WARNA.putih,
          letterSpacing: "0.01em",
          fontFamily: FONT_DISPLAY,
          textShadow: "0 3px 0 rgba(49,35,153,0.4)",
          lineHeight: 1.1,
        }}
      >
        SENSUS WARGANET
        <br />
        2026
      </div>
    </div>
  );
}

function Intro({
  onMulai,
  jumlahResponden,
  sudahPernahIsi,
  golonganHasil,
  nomorResponden,
  namaTersimpan,
  onLihatHasil,
}) {
  if (sudahPernahIsi) {
    return (
      <div>
        <div style={kartuPutih}>
          <BadgePita teks="SUDAH TERCATAT" warna={WARNA.teksAbu} />
          <p style={{ lineHeight: 1.7, fontSize: 15, margin: "14px 0 0", color: WARNA.teksGelap }}>
            Kamu sudah pernah mengisi sensus ini dari perangkat ini. Setiap warganet hanya
            bisa disensus satu kali biar datanya tetap valid.
          </p>

          {golonganHasil && (
            <div
              style={{
                background: WARNA.bgSoft,
                border: `2px dashed ${WARNA.aksenTerang}`,
                borderRadius: 16,
                padding: "18px 20px",
                marginTop: 18,
              }}
            >
              <div style={labelKecil}>HASIL SENSUS KAMU</div>
              {namaTersimpan && (
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: WARNA.teksGelap,
                    marginBottom: 4,
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  {namaTersimpan}
                </div>
              )}
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 800,
                  color: WARNA.primer,
                  marginBottom: 8,
                  fontFamily: FONT_DISPLAY,
                }}
              >
                {golonganHasil.nama}
              </div>
              {golonganHasil.deskripsi && (
                <div style={{ fontSize: 14, color: WARNA.teksAbu, lineHeight: 1.6 }}>
                  {golonganHasil.deskripsi}
                </div>
              )}
            </div>
          )}
        </div>

        {golonganHasil && golonganHasil.rekomendasi && (
          <RekomendasiBox teks={golonganHasil.rekomendasi} />
        )}

        {golonganHasil && <ShareButtons golonganHasil={golonganHasil} />}

        <button onClick={onLihatHasil} style={btnPrimary}>
          Lihat hasil sensus warga lain
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={kartuPutih}>
        <p style={{ lineHeight: 1.7, fontSize: 15, margin: 0, color: WARNA.teksGelap }}>
          Dengan ini, Badan Sensus Warganet menetapkan bahwa setiap warganet yang membuka
          tautan ini secara otomatis terdaftar sebagai responden wajib. Formulir terdiri dari{" "}
          <strong>{TOTAL_PERTANYAAN} pertanyaan</strong> jujur-jujuran. Gak ada jawaban benar
          atau salah, cuma ada jawaban yang bikin kamu mikir sendiri.
        </p>
        <p style={{ lineHeight: 1.7, fontSize: 15, marginTop: 12, marginBottom: 0, color: WARNA.teksGelap }}>
          Jawaban tidak diaudit siapa-siapa, tidak dijamin akurat, tapi dijamin jujur. Setiap
          warganet hanya bisa disensus satu kali.
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 16,
            background: WARNA.bgSoft,
            padding: "8px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            color: WARNA.primer,
          }}
        >
          🏆 30 golongan · Hasil acak tiap golongan
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: "rgba(255,255,255,0.9)",
          marginBottom: 18,
          padding: "0 4px",
          fontWeight: 600,
        }}
      >
        <span>🟢 SENSUS DIBUKA</span>
        <span>{jumlahResponden} responden terdata</span>
      </div>

      <button onClick={onMulai} style={btnKuning}>
        Mulai Sensus →
      </button>
    </div>
  );
}

function SoalTunggal({ pertanyaan, nomorSoal, totalSoal, jawabanTerpilih, onPilih, onKembali, bisaKembali }) {
  const persen = Math.round((nomorSoal / totalSoal) * 100);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            color: WARNA.putih,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            Soal {nomorSoal} / {totalSoal}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 700,
              fontSize: 14,
              background: "rgba(255,255,255,0.18)",
              padding: "3px 10px",
              borderRadius: 12,
            }}
          >
            🔥 {persen}%
          </span>
        </div>
        <div
          style={{
            height: 10,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${persen}%`,
              background: `linear-gradient(90deg, ${WARNA.kuning}, ${WARNA.kuningGelap})`,
              borderRadius: 10,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div style={kartuPutih}>
        <div
          style={{
            fontSize: 19,
            fontWeight: 700,
            marginBottom: 18,
            lineHeight: 1.4,
            color: WARNA.primer,
            fontFamily: FONT_DISPLAY,
          }}
        >
          {pertanyaan.label}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pertanyaan.opsi.map((opsi, i) => {
            const huruf = ["A", "B", "C", "D", "E"][i];
            const aktif = jawabanTerpilih === opsi;
            return (
              <button
                key={opsi}
                onClick={() => onPilih(pertanyaan.id, opsi)}
                style={optionStyle(aktif)}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    marginRight: 12,
                    fontWeight: 700,
                    fontSize: 13,
                    background: aktif ? WARNA.primer : WARNA.bgSoft,
                    color: aktif ? WARNA.putih : WARNA.primer,
                    flexShrink: 0,
                  }}
                >
                  {huruf}
                </span>
                {opsi}
              </button>
            );
          })}
        </div>
      </div>

      {bisaKembali && (
        <button onClick={onKembali} style={btnKembali}>
          ← Soal sebelumnya
        </button>
      )}
    </div>
  );
}

function IsiNama({ nama, setNama, errorNama, onSubmit }) {
  function handleChange(e) {
    const bersih = bersihkanInputNama(e.target.value);
    setNama(bersih);
  }

  const namaKosong = nama.trim().length === 0;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>✍️</div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: WARNA.putih,
            fontFamily: FONT_DISPLAY,
            textShadow: "0 2px 0 rgba(49,35,153,0.35)",
          }}
        >
          Siapa nama lo?
        </div>
      </div>

      <div style={kartuPutih}>
        <input
          type="text"
          value={nama}
          onChange={handleChange}
          placeholder="Nama / nickname kamu"
          maxLength={MAX_NAMA}
          autoFocus
          style={{
            width: "100%",
            padding: "14px 16px",
            fontSize: 16,
            border: errorNama ? `2px solid #DC2626` : `2px solid ${WARNA.garis}`,
            borderRadius: 14,
            fontFamily: FONT_BODY,
            boxSizing: "border-box",
            outline: "none",
            color: WARNA.teksGelap,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 12,
            color: WARNA.teksAbu,
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          <span>{nama.length}/{MAX_NAMA}</span>
        </div>
        {errorNama && (
          <div style={{ color: "#DC2626", fontSize: 13, marginTop: 6, fontWeight: 600 }}>{errorNama}</div>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={namaKosong}
        style={{
          ...btnKuning,
          opacity: namaKosong ? 0.5 : 1,
          cursor: namaKosong ? "not-allowed" : "pointer",
        }}
      >
        Lanjut ke 40 Soal →
      </button>
    </div>
  );
}

function LoadingHasil() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 56,
          marginBottom: 18,
          animation: "denyutHati 1s ease-in-out infinite",
        }}
      >
        🔥
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: WARNA.putih,
          fontFamily: FONT_DISPLAY,
        }}
      >
        Menyusun hasil sensus lo...
      </div>
      <style>{`
        @keyframes denyutHati {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Submitted({ nomorResponden, golonganHasil, namaTersimpan, onLihatHasil }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 44 }}>🏆</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
          Hasil Sensus Warganet untuk
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: WARNA.putih,
            fontFamily: FONT_DISPLAY,
            textShadow: "0 3px 0 rgba(49,35,153,0.4)",
            marginTop: 2,
          }}
        >
          {namaTersimpan || "Warganet"}
        </div>
      </div>

      <div style={{ ...kartuPutih, textAlign: "center", marginTop: 14 }}>
        {golonganHasil && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: WARNA.teksAbu, letterSpacing: "0.05em" }}>
              GOLONGAN BARU TERDETEKSI
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: WARNA.primer,
                fontFamily: FONT_DISPLAY,
                margin: "6px 0 10px",
                lineHeight: 1.2,
              }}
            >
              {golonganHasil.nama}
            </div>
            <div style={{ fontSize: 14, color: WARNA.teksAbu, lineHeight: 1.6, marginBottom: 16 }}>
              {golonganHasil.deskripsi}
            </div>
          </>
        )}
      </div>

      {golonganHasil && golonganHasil.rekomendasi && (
        <RekomendasiBox teks={golonganHasil.rekomendasi} />
      )}

      {golonganHasil && <ShareButtons golonganHasil={golonganHasil} />}

      <button onClick={onLihatHasil} style={btnSecondary}>
        Lihat hasil sensus warga lain
      </button>
    </div>
  );
}

function RekomendasiBox({ teks }) {
  return (
    <div
      style={{
        background: WARNA.putih,
        border: `2px solid ${WARNA.kuningGelap}`,
        borderRadius: 18,
        padding: "16px 18px",
        marginBottom: 16,
        textAlign: "left",
        boxShadow: "0 4px 14px rgba(49,35,153,0.15)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>📜</span>
        <span
          style={{
            fontSize: 12,
            color: WARNA.kuningGelap,
            letterSpacing: "0.05em",
            fontWeight: 800,
          }}
        >
          REKOMENDASI RESMI NEGARA
        </span>
      </div>
      <div style={{ fontSize: 14, color: WARNA.teksGelap, lineHeight: 1.6 }}>{teks}</div>
    </div>
  );
}

function ShareButtons({ golonganHasil }) {
  const [salinStatus, setSalinStatus] = useState(null);

  const linkWebsite = typeof window !== "undefined" ? window.location.href : "";
  const teksShare = `Hasil Sensus Warganet 2026 aku: ${golonganHasil.nama}!\n"${golonganHasil.deskripsi}"\n\nIkutan sensusnya di ${linkWebsite}\n\nRandom thoughts generasi capek tapi tetep jalan 🫡 @ceritagenz`;

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
          fontSize: 13,
          color: "rgba(255,255,255,0.9)",
          marginBottom: 10,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        Bagikan hasil sensus lo
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
        <button onClick={shareWhatsApp} style={btnShare("#25D366")}>
          💬 WhatsApp
        </button>
        <button onClick={shareX} style={btnShare("#000000")}>
          𝕏 Post
        </button>
        <button onClick={() => copyUntuk("TikTok")} style={btnShare(WARNA.putih, WARNA.primer)}>
          🎵 Copy TikTok
        </button>
        <button onClick={() => copyUntuk("Instagram Story")} style={btnShare(WARNA.putih, WARNA.primer)}>
          📸 Copy IG Story
        </button>
      </div>
      {salinStatus && (
        <div
          style={{
            fontSize: 12,
            color: WARNA.putih,
            fontWeight: 700,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {salinStatus === "gagal" ? "Gagal menyalin, coba lagi." : `Tersalin! Tinggal paste di ${salinStatus}.`}
        </div>
      )}

      <button
        onClick={() => window.open("https://x.com/ceritagenz", "_blank")}
        style={{
          width: "100%",
          padding: "12px 0",
          background: "#000000",
          color: WARNA.putih,
          border: "none",
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: FONT_BODY,
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
  const isLight = bg === WARNA.putih;
  return {
    padding: "12px 0",
    background: bg,
    color: isLight ? WARNA.primer : WARNA.putih,
    border: border ? `2px solid ${border}` : "none",
    borderRadius: 16,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT_BODY,
  };
}

function Hasil({ semuaResponden, totalResponden, onKembali, onRefresh }) {
  const respondenValid = semuaResponden.filter((r) => r.golongan_deskripsi);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 6, position: "relative" }}>
        <button
          onClick={onKembali}
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            background: "none",
            border: "none",
            color: WARNA.putih,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ← Kembali
        </button>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: WARNA.putih,
            fontFamily: FONT_DISPLAY,
            textShadow: "0 3px 0 rgba(49,35,153,0.4)",
          }}
        >
          Hasil Sensus Warganet
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: 600 }}>
          Daftar lengkap, yang paling baru ngisi muncul di atas
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 14,
          marginTop: 18,
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: WARNA.putih,
            fontWeight: 700,
            background: "rgba(255,255,255,0.18)",
            padding: "4px 12px",
            borderRadius: 12,
          }}
        >
          {respondenValid.length} responden
        </span>
        <button onClick={onRefresh} style={btnGhost}>
          ⟳ Muat ulang
        </button>
      </div>

      {respondenValid.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.85)",
            padding: 40,
            fontWeight: 600,
          }}
        >
          Belum ada data. Jadilah responden pertama!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {respondenValid.map((r, idx) => (
          <div key={r.id || idx} style={kartuPutih}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: WARNA.teksGelap,
                  fontFamily: FONT_DISPLAY,
                }}
              >
                {r.nama || "Anonim"}
              </span>
              <span style={{ fontSize: 11, color: WARNA.teksAbu, fontWeight: 600 }}>
                {formatWaktu(r.created_at)}
              </span>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: WARNA.primer,
                marginBottom: 8,
                fontFamily: FONT_DISPLAY,
              }}
            >
              {r.golongan}
            </div>
            <div style={{ fontSize: 13.5, color: WARNA.teksAbu, lineHeight: 1.6, marginBottom: r.golongan_rekomendasi ? 12 : 0 }}>
              {r.golongan_deskripsi}
            </div>
            {r.golongan_rekomendasi && (
              <div
                style={{
                  background: WARNA.bgSoft,
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: WARNA.primerGelap,
                  lineHeight: 1.5,
                }}
              >
                <strong>📜 Rekomendasi:</strong> {r.golongan_rekomendasi}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={onKembali} style={btnSecondary}>
        Kembali ke Halaman Awal
      </button>
    </div>
  );
}

function BadgePita({ teks, warna }) {
  return (
    <div
      style={{
        display: "inline-block",
        background: warna || WARNA.primer,
        color: WARNA.putih,
        padding: "7px 18px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.06em",
      }}
    >
      {teks}
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

const kartuPutih = {
  background: WARNA.putih,
  borderRadius: 22,
  padding: 22,
  marginBottom: 16,
  boxShadow: "0 8px 24px rgba(30,27,75,0.22)",
};

const labelKecil = {
  fontSize: 12,
  color: WARNA.aksenTerang,
  fontWeight: 800,
  letterSpacing: "0.06em",
  marginBottom: 8,
};

function optionStyle(aktif) {
  return {
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    padding: "13px 14px",
    borderRadius: 16,
    border: aktif ? `2px solid ${WARNA.primer}` : `2px solid ${WARNA.garis}`,
    background: aktif ? WARNA.bgSoft : WARNA.putih,
    color: WARNA.teksGelap,
    fontWeight: aktif ? 700 : 500,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: FONT_BODY,
    width: "100%",
    lineHeight: 1.4,
    transition: "all 0.15s ease",
  };
}

const btnKuning = {
  width: "100%",
  padding: "16px 0",
  background: `linear-gradient(135deg, ${WARNA.kuning}, ${WARNA.kuningGelap})`,
  color: WARNA.primerGelap,
  border: "none",
  borderRadius: 20,
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: "0.01em",
  cursor: "pointer",
  fontFamily: FONT_DISPLAY,
  boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
};

const btnPrimary = {
  width: "100%",
  padding: "15px 0",
  background: WARNA.putih,
  color: WARNA.primer,
  border: "none",
  borderRadius: 20,
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: FONT_DISPLAY,
  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
};

const btnSecondary = {
  width: "100%",
  padding: "15px 0",
  background: WARNA.putih,
  color: WARNA.primer,
  border: "none",
  borderRadius: 20,
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 8,
  fontFamily: FONT_DISPLAY,
  boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
};

const btnGhost = {
  fontSize: 12,
  padding: "5px 12px",
  background: "rgba(255,255,255,0.18)",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  color: WARNA.putih,
  fontFamily: FONT_BODY,
  fontWeight: 700,
};

const btnKembali = {
  width: "100%",
  padding: "12px 0",
  background: "rgba(255,255,255,0.15)",
  color: WARNA.putih,
  border: "none",
  borderRadius: 16,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT_BODY,
};
