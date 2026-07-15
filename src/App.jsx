import { useState, useEffect, useRef, forwardRef } from "react";
import { toPng } from "html-to-image";
import { supabase } from "./supabaseClient";
import { BAGIAN, TOTAL_PERTANYAAN } from "./sensusData";
import { hitungSkorTotal, tentukanGolongan, pilihDeskripsiAcak } from "./golonganData";
import { pilihRekomendasiAcak } from "./rekomendasiData";
import { validasiNama, bersihkanInputNama, MAX_NAMA } from "./namaValidasi";

// ====== TOKEN DESAIN ======
const WARNA = {
  primer: "#5B4FE8",
  primerGelap: "#3D2FCC",
  aksenTerang: "#818CF8",
  cyan: "#22D3EE",
  cyanGelap: "#0EA5E9",
  kuning: "#FCD34D",
  kuningGelap: "#F59E0B",
  bgSoft: "#EEF2FF",
  putih: "#FFFFFF",
  teksGelap: "#1E1B4B",
  teksAbu: "#6B647F",
  garis: "#C4B5FD",
  dark: "#0F0E2A",
  darkCard: "rgba(255,255,255,0.06)",
};

const FONT_DISPLAY = "'Baloo 2', 'Fredoka', system-ui, sans-serif";
const FONT_BODY = "'Quicksand', system-ui, -apple-system, sans-serif";

const gradientBg =
  "linear-gradient(145deg, #0F0E2A 0%, #1A1456 25%, #2D1B8E 50%, #3D2FCC 75%, #5B4FE8 100%)";

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
    const JEDA_MINIMAL = 2000;

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

        * { box-sizing: border-box; }

        body {
          background: #0F0E2A;
        }

        /* Noise texture overlay */
        .app-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.35;
        }

        .app-root > * { position: relative; z-index: 2; }

        /* Glassmorphism card */
        .glass-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        /* Neon glow classes */
        .neon-cyan {
          text-shadow: 0 0 20px rgba(34,211,238,0.8), 0 0 40px rgba(34,211,238,0.4);
        }
        .neon-yellow {
          text-shadow: 0 0 20px rgba(252,211,77,0.8), 0 0 40px rgba(252,211,77,0.3);
        }

        @keyframes pulseBucin {
          0%, 100% { transform: scale(1); box-shadow: 0 6px 20px rgba(194,24,91,0.4); }
          50% { transform: scale(1.025); box-shadow: 0 10px 36px rgba(194,24,91,0.7), 0 0 40px rgba(194,24,91,0.2); }
        }
        @keyframes pulseMultai {
          0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 0 rgba(252,211,77,0); }
          50% { box-shadow: 0 12px 40px rgba(245,158,11,0.5), 0 0 0 8px rgba(252,211,77,0.08); }
        }
        @keyframes floatShape {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          33% { transform: translateY(-24px) rotate(5deg) scale(1.05); }
          66% { transform: translateY(8px) rotate(-4deg) scale(0.96); }
        }
        @keyframes floatShapeSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.12; }
          50% { transform: translateY(-30px) rotate(12deg); opacity: 0.18; }
        }
        @keyframes shimmerGolongan {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.3); }
          30% { transform: scale(1); }
          45% { transform: scale(1.18); }
          60% { transform: scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(74,222,128,0.8); }
          50% { opacity: 0.3; box-shadow: none; }
        }
        @keyframes glowRekomendasi {
          0%, 100% { box-shadow: 0 4px 14px rgba(245,158,11,0.2), 0 0 0 0 rgba(245,158,11,0); }
          50% { box-shadow: 0 4px 28px rgba(245,158,11,0.5), 0 0 20px rgba(245,158,11,0.15); }
        }
        @keyframes bounceCTA {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes denyutApi {
          0%, 100% { transform: scale(1) rotate(-3deg); filter: brightness(1); }
          25% { transform: scale(1.15) rotate(4deg); filter: brightness(1.2); }
          75% { transform: scale(0.92) rotate(-3deg); filter: brightness(0.9); }
        }
        @keyframes denyutHati {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        @keyframes neonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .bg-shape {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(40px);
          animation: floatShapeSlow 10s ease-in-out infinite;
        }

        .golongan-shimmer {
          background: linear-gradient(90deg, #818CF8 0%, #22D3EE 40%, #FCD34D 60%, #818CF8 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGolongan 2.5s linear infinite;
        }

        .option-btn {
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .option-btn:active {
          transform: scale(0.97);
        }

        .slide-up {
          animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>

      {/* Neon background orbs — lebih besar dan dramatis */}
      <div className="bg-shape" style={{ width: 380, height: 380, background: "rgba(91,79,232,0.5)", top: -120, right: -100, animationDelay: "0s" }} />
      <div className="bg-shape" style={{ width: 280, height: 280, background: "rgba(34,211,238,0.25)", bottom: 80, left: -80, animationDelay: "3.5s" }} />
      <div className="bg-shape" style={{ width: 200, height: 200, background: "rgba(252,211,77,0.2)", top: "35%", right: -60, animationDelay: "6s" }} />
      <div className="bg-shape" style={{ width: 150, height: 150, background: "rgba(167,139,250,0.3)", top: "60%", left: "10%", animationDelay: "2s" }} />
      <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
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
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "calc(100vh - 120px)" }}>
            {/* Mini header di atas soal */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 600,
                  fontFamily: FONT_BODY,
                  marginBottom: 2,
                }}
              >
                REPUBLIK INTERNET INDONESIA
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: WARNA.putih,
                  fontFamily: FONT_DISPLAY,
                  textShadow: "0 2px 0 rgba(49,35,153,0.3)",
                  letterSpacing: "0.01em",
                }}
              >
                SENSUS WARGANET 2026
              </div>
            </div>
            <SoalTunggal
              key={pertanyaanIndex}
              pertanyaan={SEMUA_PERTANYAAN[pertanyaanIndex]}
              nomorSoal={pertanyaanIndex + 1}
              totalSoal={SEMUA_PERTANYAAN.length}
              jawabanTerpilih={jawaban[SEMUA_PERTANYAAN[pertanyaanIndex].id]}
              onPilih={pilihJawaban}
              onKembali={kembaliKeSoalSebelumnya}
              bisaKembali={pertanyaanIndex > 0}
            />
          </div>
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
            Data lo udah aman di database kami. Jangan capek-capek coba isi lagi ya —
            sistem kami lebih konsisten dari resolusi tahun baru lo.
          </p>
          <p style={{ lineHeight: 1.7, fontSize: 13, margin: "8px 0 0", color: WARNA.teksAbu }}>
            Tapi tenang, hasil sensus lo masih bisa dibagikan dan dilihat di sini. Bukan berarti
            lo harus move on dari golongan lo. 😌
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

        {golonganHasil && <ShareButtons golonganHasil={golonganHasil} nama={namaTersimpan} />}

        <button
          onClick={() => window.open("https://lovegenz.vercel.app/", "_blank")}
          style={{
            width: "100%",
            padding: "15px 0",
            background: "linear-gradient(135deg, #C2185B, #E91E8C)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 20,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: FONT_DISPLAY,
            marginBottom: 10,
            boxShadow: "0 6px 16px rgba(194,24,91,0.35)",
            animation: "pulseBucin 2s ease-in-out infinite",
          }}
        >
          <span style={{ animation: "heartbeat 1.5s ease-in-out infinite", display: "inline-block", marginRight: 6 }}>💘</span>Coba juga Sensus Bucin 2026 →
        </button>

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
          <strong>{TOTAL_PERTANYAAN} pertanyaan yang mungkin bakal bikin lo mempertanyakan hidup.</strong>{" "}
          Gak ada jawaban benar atau salah, cuma ada jawaban yang bikin kamu mikir sendiri.
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
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4ADE80",
              animation: "blink 1.5s ease-in-out infinite",
            }}
          />
          SENSUS DIBUKA
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.18)",
            padding: "5px 12px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 15,
            color: WARNA.kuning,
          }}
        >
          {jumlahResponden.toLocaleString()} responden terdata
        </span>
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 14, fontWeight: 600 }}>
        ⏱ Cuma butuh ~3 menit kok!
      </div>

      <button
        onClick={onMulai}
        style={{ ...btnKuning, animation: "pulseMultai 2.5s ease-in-out infinite" }}
      >
        Mulai Sensus →
      </button>

      <button
        onClick={onLihatHasil}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 14,
          color: WARNA.putih,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          marginTop: 14,
          padding: "11px 0",
          fontFamily: FONT_BODY,
        }}
      >
        Intip hasil orang lain dulu 👀
      </button>
    </div>
  );
}

// Quote humor: tidak nyebut angka soal, murni lucu/relatable
// Dipilih random berdasarkan nomorSoal sebagai seed biar konsisten per soal
const QUOTES_HUMOR = [
  "Ini ujian... tapi lebih seru dari sekolah.",
  "Jawab yang pertama kepikiran, bukan yang paling keren.",
  "Gak ada jawaban salah. Cuma ada yang bikin lo mikir.",
  "Santai, ini bukan tes psikologi... atau iya?",
  "Pilih yang paling lo lakuin tanpa bilang ke siapa-siapa.",
  "Badan Sensus Warganet mengawasi. 👁️",
  "Jujur aja, gak ada yang ngejudge (kecuali algoritmanya).",
  "Insting pertama biasanya yang paling jujur.",
  "Jawab yang paling bikin lo senyum sendiri.",
  "Lo lebih jujur dari debat calon presiden.",
  "Data lo aman. Mungkin.",
  "Gak perlu mikir lama, hati lo tau jawabannya.",
  "Pilih yang paling bikin lo gelisah tengah malam.",
  "Jawaban lo membentuk golongan yang unik buat lo.",
  "Ini lebih singkat dari antrean BPJS, janji.",
  "Gak ada nilai merah di sini, tenang.",
  "Pilih yang paling real, bukan yang paling ideal.",
  "Napas dulu, baru jawab.",
  "Lo lebih konsisten dari Wi-Fi kantor.",
  "Jawab yang lo lakuin beneran, bukan yang harusnya lo lakuin.",
];

// Kalimat sisa soal: sesuai angka, tone makin seru makin dekat finish
const KALIMAT_SISA = {
  39: "Masih ada 39 soal lagi — baru mulai, santai dulu.",
  38: "Masih ada 38 soal lagi — belum ada alasan nyerah.",
  37: "Masih ada 37 soal lagi — momentum baru mulai terbentuk.",
  36: "Masih ada 36 soal lagi — lo udah lebih niat dari banyak orang.",
  35: "Masih ada 35 soal lagi — tarik napas, masih panjang.",
  34: "Masih ada 34 soal lagi — jawab santai, hasilnya nanti.",
  33: "Masih ada 33 soal lagi — sepertiga lebih, udah bagus.",
  32: "Masih ada 32 soal lagi — pola jawaban lo mulai terbentuk.",
  31: "Masih ada 31 soal lagi — hampir sepertiga jalan!",
  30: "Masih ada 30 soal lagi — pas di titik sayang kalau berhenti.",
  29: "Masih ada 29 soal lagi — di sini biasanya orang mulai overthinking.",
  28: "Masih ada 28 soal lagi — pertanyaan berikutnya makin relatable.",
  27: "Masih ada 27 soal lagi — sepertiga lebih, momentum bagus.",
  26: "Masih ada 26 soal lagi — hampir 40% selesai, lo serius nih.",
  25: "Masih ada 25 soal lagi — setengah jalan, sayang kalau berhenti.",
  24: "Masih ada 24 soal lagi — udah lewat setengah! Downhill dari sini.",
  23: "Masih ada 23 soal lagi — pertanyaan berikutnya makin nyelekit.",
  22: "Masih ada 22 soal lagi — jawaban lo makin konsisten.",
  21: "Masih ada 21 soal lagi — hampir 50%! Lo beneran niat.",
  20: "Masih ada 20 soal lagi — tepat di tengah, jangan berhenti.",
  19: "Masih ada 19 soal lagi — udah lewat setengah, downhill!",
  18: "Masih ada 18 soal lagi — bagian ini makin personal.",
  17: "Masih ada 17 soal lagi — hampir 60%, keren banget.",
  16: "Masih ada 16 soal lagi — lo udah terlalu jauh buat berhenti.",
  15: "Masih ada 15 soal lagi — 15 soal terakhir yang paling seru.",
  14: "Masih ada 14 soal lagi — dua pertiga lebih selesai!",
  13: "Masih ada 13 soal lagi — mulai kelihatan ujung terowongannya.",
  12: "Masih ada 12 soal lagi — hampir 70%, warganet tangguh.",
  11: "Masih ada 11 soal lagi — hampir selesai, ini bukan saatnya menyerah.",
  10: "Masih ada 10 soal lagi — double digit terakhir!",
  9:  "Masih ada 9 soal lagi — single digit! Lo hampir sampai.",
  8:  "Masih ada 8 soal lagi — hampir finish, jangan nyerah sekarang.",
  7:  "Masih ada 7 soal lagi — lo hampir resmi terklasifikasi.",
  6:  "Masih ada 6 soal lagi — sudah kelihatan finish line-nya.",
  5:  "Masih ada 5 soal lagi — akhirnya, bentar lagi dapet gelar!",
  4:  "Masih ada 4 soal lagi — tinggal 10%, jangan berhenti sekarang.",
  3:  "Masih ada 3 soal lagi — tiga soal terakhir, ini yang paling penting.",
  2:  "Masih ada 2 soal lagi — dua langkah lagi jadi warganet resmi.",
  1:  "Soal terakhir! Satu jawaban lagi menuju gelar resmi lo.",
  0:  "Ini dia soal penutup. Jawab jujur, ini yang paling akhir.",
};

function getQuoteHumor(nomorSoal) {
  return QUOTES_HUMOR[(nomorSoal - 1) % QUOTES_HUMOR.length];
}

function getKalimatSisa(nomorSoal) {
  const sisa = 40 - nomorSoal;
  return KALIMAT_SISA[sisa] || `Masih ada ${sisa} soal lagi — terus jalan!`;
}



function SoalTunggal({ pertanyaan, nomorSoal, totalSoal, jawabanTerpilih, onPilih, onKembali, bisaKembali }) {
  const persen = Math.round((nomorSoal / totalSoal) * 100);
  const quoteHumor = getQuoteHumor(nomorSoal);
  const kalimatSisa = getKalimatSisa(nomorSoal);

  return (
    <div>
      {/* Progress bar area */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            color: WARNA.putih,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, opacity: 0.9 }}>
            Soal {nomorSoal} / {totalSoal}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 800,
              fontSize: 14,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "4px 12px",
              borderRadius: 20,
              backdropFilter: "blur(4px)",
            }}
          >
            🔥 {persen}%
          </span>
        </div>
        {/* Progress bar dengan glow di ujung */}
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 10,
            overflow: "visible",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${persen}%`,
              background: `linear-gradient(90deg, ${WARNA.kuning}99, ${WARNA.kuningGelap})`,
              borderRadius: 10,
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
            }}
          >
            {/* Titik glow di ujung progress */}
            <div style={{
              position: "absolute",
              right: -4,
              top: -4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: WARNA.kuning,
              boxShadow: `0 0 10px 3px ${WARNA.kuning}88`,
            }} />
          </div>
        </div>
      </div>

      {/* Kartu soal — lebih dramatis */}
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 28,
          padding: "24px 20px 20px",
          marginBottom: 14,
          boxShadow: "0 20px 60px rgba(30,27,75,0.35), 0 4px 16px rgba(30,27,75,0.2)",
          border: "1px solid rgba(255,255,255,0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Label nomor soal di dalam kartu */}
        <div style={{
          fontSize: 11,
          fontWeight: 800,
          color: WARNA.aksenTerang,
          letterSpacing: "0.1em",
          marginBottom: 8,
          fontFamily: FONT_BODY,
        }}>
          PERTANYAAN {String(nomorSoal).padStart(2, "0")}
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 20,
            lineHeight: 1.45,
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "left",
                  padding: "13px 16px",
                  borderRadius: 18,
                  border: aktif ? `2.5px solid ${WARNA.primer}` : `1.5px solid #E8E4F8`,
                  background: aktif
                    ? `linear-gradient(135deg, ${WARNA.bgSoft}, #E0DBFF)`
                    : "#FAFAFA",
                  color: aktif ? WARNA.primerGelap : "#2D2D2D",
                  fontWeight: aktif ? 700 : 500,
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  width: "100%",
                  lineHeight: 1.4,
                  transition: "all 0.18s ease",
                  boxShadow: aktif ? `0 4px 16px ${WARNA.primer}28` : "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    marginRight: 12,
                    fontWeight: 800,
                    fontSize: aktif ? 15 : 13,
                    background: aktif
                      ? `linear-gradient(135deg, ${WARNA.primer}, ${WARNA.aksenTerang})`
                      : WARNA.bgSoft,
                    color: aktif ? WARNA.putih : WARNA.primer,
                    flexShrink: 0,
                    transition: "all 0.18s ease",
                    boxShadow: aktif ? `0 3px 8px ${WARNA.primer}44` : "none",
                  }}
                >
                  {aktif ? "✓" : huruf}
                </span>
                {opsi}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quote + sisa soal dalam pill */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 14,
          padding: "10px 16px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.9)",
            fontWeight: 600,
            fontFamily: FONT_BODY,
            fontStyle: "italic",
            marginBottom: 3,
          }}
        >
          {quoteHumor}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 600,
            fontFamily: FONT_BODY,
          }}
        >
          {kalimatSisa}
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

  const namaKosong = nama.trim().length < 3;
  const namaKurang = nama.trim().length > 0 && nama.trim().length < 3;
  const terlalupanjang = nama.length >= MAX_NAMA;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>👋</div>
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
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 8, fontWeight: 600 }}>
          Nama samaran juga boleh, kok! Rahasia aman. 🤫
        </div>
      </div>

      <div style={kartuPutih}>
        <input
          type="text"
          value={nama}
          onChange={handleChange}
          placeholder="Panggil lo siapa nih?"
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
            color: "#111111",
            fontWeight: 600,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            marginTop: 8,
            fontWeight: 600,
          }}
        >
          <span style={{ color: terlalupanjang ? "#DC2626" : namaKurang ? WARNA.kuningGelap : "transparent" }}>
            {terlalupanjang ? "Nama terlalu panjang! 😅" : namaKurang ? `Minimal 3 huruf ya — ${3 - nama.trim().length} lagi!` : " "}
          </span>
          <span style={{ color: terlalupanjang ? "#DC2626" : WARNA.teksAbu }}>
            {nama.length}/{MAX_NAMA}
          </span>
        </div>
        {errorNama && (
          <div style={{ color: "#DC2626", fontSize: 13, marginTop: 4, fontWeight: 600 }}>{errorNama}</div>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={namaKosong}
        style={{
          width: "100%",
          padding: "16px 0",
          background: namaKosong
            ? "rgba(255,255,255,0.2)"
            : `linear-gradient(135deg, ${WARNA.kuning}, ${WARNA.kuningGelap})`,
          color: namaKosong ? "rgba(255,255,255,0.4)" : WARNA.primerGelap,
          border: "none",
          borderRadius: 20,
          fontSize: 16,
          fontWeight: 800,
          cursor: namaKosong ? "not-allowed" : "pointer",
          fontFamily: FONT_DISPLAY,
          boxShadow: namaKosong ? "none" : "0 6px 16px rgba(0,0,0,0.18)",
          transition: "all 0.2s ease",
        }}
      >
        Lanjut ke 40 Soal →
      </button>
    </div>
  );
}

function LoadingHasil() {
  const TEKS_LOADING = [
    "Menyusun hasil sensus lo...",
    "Lagi ngecek database rahasia negara...",
    "Lagi ngitung tingkat kewarasan lo...",
    "Sabar ya, lagi disiapin sertifikat keren lo!",
    "Konsultasi dulu sama Badan Sensus Pusat...",
    "Lagi verifikasi data ke RT/RW setempat...",
    "Ngitung ulang biar hasilnya akurat (katanya)...",
    "Bentar, lagi minta tanda tangan pejabat dulu...",
  ];

  const [teksIdx, setTeksIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Ganti teks tiap 600ms
    const intervalTeks = setInterval(() => {
      setTeksIdx((prev) => (prev + 1) % TEKS_LOADING.length);
    }, 650);

    // Progress bar fake: naik pelan ke 90%, lalu lompat ke 100% pas selesai
    let p = 0;
    const intervalProgress = setInterval(() => {
      p += Math.random() * 8 + 3;
      if (p >= 92) {
        p = 92;
        clearInterval(intervalProgress);
      }
      setProgress(Math.min(p, 92));
    }, 120);

    return () => {
      clearInterval(intervalTeks);
      clearInterval(intervalProgress);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          fontSize: 64,
          marginBottom: 20,
          animation: "denyutApi 0.8s ease-in-out infinite",
          display: "inline-block",
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
          marginBottom: 28,
          minHeight: 52,
          lineHeight: 1.5,
          transition: "opacity 0.3s ease",
        }}
      >
        {TEKS_LOADING[teksIdx]}
      </div>

      {/* Fake progress bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 300,
          height: 8,
          background: "rgba(255,255,255,0.2)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${WARNA.kuning}, ${WARNA.kuningGelap})`,
            borderRadius: 8,
            transition: "width 0.2s ease",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.6)",
          marginTop: 8,
          fontWeight: 600,
          fontFamily: FONT_BODY,
        }}
      >
        {Math.round(progress)}%
      </div>

      <style>{`
        @keyframes denyutApi {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          25% { transform: scale(1.12) rotate(3deg); }
          75% { transform: scale(0.95) rotate(-2deg); }
        }
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
              className="golongan-shimmer"
              style={{
                fontSize: 26,
                fontWeight: 800,
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

      {golonganHasil && <ShareButtons golonganHasil={golonganHasil} nama={namaTersimpan} />}

      <button
        onClick={() => window.open("https://lovegenz.vercel.app/", "_blank")}
        style={{
          width: "100%",
          padding: "15px 0",
          background: "linear-gradient(135deg, #C2185B, #E91E8C)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 20,
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: FONT_DISPLAY,
          marginBottom: 10,
          boxShadow: "0 6px 16px rgba(194,24,91,0.35)",
        }}
      >
        <span style={{ animation: "heartbeat 1.5s ease-in-out infinite", display: "inline-block", marginRight: 6 }}>💘</span>Coba juga Sensus Bucin 2026 →
      </button>

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
        animation: "glowRekomendasi 3s ease-in-out infinite",
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

// Kartu hasil versi "kartu pos" yang dirender di luar layar, lalu ditangkap
// jadi PNG untuk dibagikan/didownload. Ukuran tetap besar (skala 2x saat capture)
// biar hasil gambarnya tajam di semua HP.
const KONFETI = [
  { top: "4%", left: "7%", rotasi: -18, warna: "#FCD34D", w: 26, h: 11 },
  { top: "3%", left: "78%", rotasi: 22, warna: "#22D3EE", w: 11, h: 24 },
  { top: "13%", left: "88%", rotasi: -12, warna: "#F472B6", w: 16, h: 16, bulat: true },
  { top: "16%", left: "3%", rotasi: 35, warna: "#818CF8", w: 14, h: 14, bulat: true },
  { top: "6%", left: "45%", rotasi: 8, warna: "#F472B6", w: 12, h: 12, bulat: true },
  { top: "90%", left: "8%", rotasi: -20, warna: "#22D3EE", w: 20, h: 9 },
  { top: "93%", left: "82%", rotasi: 16, warna: "#FCD34D", w: 15, h: 15, bulat: true },
  { top: "78%", left: "92%", rotasi: -10, warna: "#818CF8", w: 10, h: 20 },
  { top: "70%", left: "2%", rotasi: 28, warna: "#F472B6", w: 22, h: 10 },
];

const ShareImageCard = forwardRef(function ShareImageCard({ nama, golonganHasil }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 600,
        height: 780,
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 28% 0%, #2D1B8E 0%, #1A1456 45%, #0F0E2A 100%)",
        fontFamily: FONT_BODY,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "58px 46px 44px",
        boxSizing: "border-box",
      }}
    >
      {KONFETI.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: c.w,
            height: c.h,
            background: c.warna,
            borderRadius: c.bulat ? "50%" : 3,
            transform: `rotate(${c.rotasi}deg)`,
            opacity: 0.9,
          }}
        />
      ))}

      <div style={{ fontSize: 58, marginBottom: 4 }}>🏆</div>
      <div
        style={{
          fontSize: 15,
          color: "rgba(255,255,255,0.75)",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Hasil Sensus Untuk
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          fontFamily: FONT_DISPLAY,
          color: WARNA.kuning,
          marginTop: 4,
          marginBottom: 26,
          textAlign: "center",
          lineHeight: 1.15,
          maxWidth: "100%",
          overflowWrap: "anywhere",
        }}
      >
        {nama || "Warganet"}
      </div>

      <div
        style={{
          position: "relative",
          background: "#FFFFFF",
          borderRadius: 28,
          padding: "42px 30px 34px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -16,
            left: -16,
            background: WARNA.kuning,
            color: "#78350F",
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 13,
            lineHeight: 1.3,
            padding: "11px 15px",
            borderRadius: 10,
            transform: "rotate(-12deg)",
            boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          Golongan Baru
          <br />
          Terdeteksi
        </div>

        <div
          style={{
            width: 66,
            height: 66,
            borderRadius: "50%",
            background: WARNA.bgSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <span style={{ fontSize: 30, color: WARNA.primer }}>★</span>
        </div>

        <div
          style={{
            fontSize: 29,
            fontWeight: 800,
            fontFamily: FONT_DISPLAY,
            color: WARNA.primerGelap,
            lineHeight: 1.28,
            marginBottom: 18,
          }}
        >
          {golonganHasil?.nama}
        </div>

        <div style={{ fontSize: 16, color: WARNA.teksAbu, lineHeight: 1.65, fontWeight: 600 }}>
          {golonganHasil?.deskripsi}
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginBottom: 5 }}>
          Kamu golongan apa? Cek di:
        </div>
        <div style={{ fontSize: 18, color: WARNA.putih, fontWeight: 800, fontFamily: FONT_DISPLAY }}>
          sensuswarganet2026.vercel.app
        </div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", fontWeight: 600, marginTop: 9 }}>
          @ceritagenz • #SensusWarganet2026
        </div>
      </div>
    </div>
  );
});

function ShareButtons({ golonganHasil, nama }) {
  const [salinStatus, setSalinStatus] = useState(null);
  const [statusGambar, setStatusGambar] = useState("idle"); // idle | proses | gagal
  const kartuGambarRef = useRef(null);

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

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({ text: teksShare });
      } catch (e) {
        // dibatalkan pengguna, abaikan
      }
    } else {
      salinTeksLink();
    }
  }

  async function salinTeksLink() {
    try {
      await navigator.clipboard.writeText(teksShare);
      setSalinStatus("ok");
      setTimeout(() => setSalinStatus(null), 2500);
    } catch (e) {
      setSalinStatus("gagal");
      setTimeout(() => setSalinStatus(null), 2500);
    }
  }

  async function bagikanGambar() {
    if (!kartuGambarRef.current || statusGambar === "proses") return;
    setStatusGambar("proses");
    try {
      const dataUrl = await toPng(kartuGambarRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const namaFile = `hasil-sensus-warganet-2026-${(nama || "warganet")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.png`;
      const file = new File([blob], namaFile, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Hasil Sensus Warganet 2026",
          text: teksShare,
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = namaFile;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setStatusGambar("idle");
    } catch (e) {
      setStatusGambar("gagal");
      setTimeout(() => setStatusGambar("idle"), 2500);
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Kartu untuk digenerate jadi gambar, dirender di luar layar */}
      <div style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }} aria-hidden="true">
        <ShareImageCard ref={kartuGambarRef} nama={nama} golonganHasil={golonganHasil} />
      </div>

      <div
        style={{
          fontSize: 14,
          color: WARNA.putih,
          marginBottom: 12,
          fontWeight: 800,
          textAlign: "center",
          animation: "bounceCTA 2s ease-in-out infinite",
          letterSpacing: "0.03em",
        }}
      >
        🎉 Bagikan hasil sensus lo!
      </div>

      <button
        onClick={bagikanGambar}
        disabled={statusGambar === "proses"}
        style={{
          width: "100%",
          padding: "15px 0",
          background: "linear-gradient(135deg, #F59E0B, #FCD34D)",
          color: "#78350F",
          border: "none",
          borderRadius: 18,
          fontSize: 15,
          fontWeight: 800,
          cursor: statusGambar === "proses" ? "wait" : "pointer",
          fontFamily: FONT_DISPLAY,
          marginBottom: 10,
          boxShadow: "0 6px 16px rgba(245,158,11,0.35)",
          opacity: statusGambar === "proses" ? 0.75 : 1,
        }}
      >
        {statusGambar === "proses"
          ? "⏳ Lagi bikin gambar..."
          : statusGambar === "gagal"
          ? "Gagal, coba lagi 🙏"
          : "🖼️ Bagikan sebagai gambar"}
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 9 }}>
        <button onClick={shareNative} style={btnShareIkon("rgba(255,255,255,0.15)", true)}>
          <span style={{ fontSize: 20 }}>📲</span>
          <span>Share</span>
        </button>
        <button onClick={shareWhatsApp} style={btnShareIkon("rgba(255,255,255,0.15)", true)}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span>WhatsApp</span>
        </button>
        <button onClick={shareX} style={btnShareIkon("rgba(255,255,255,0.15)", true)}>
          𝕏
          <span>Post</span>
        </button>
      </div>

      <button
        onClick={salinTeksLink}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.12)",
          border: "1.5px dashed rgba(255,255,255,0.5)",
          borderRadius: 12,
          color: WARNA.putih,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: FONT_BODY,
          marginBottom: 12,
          padding: "10px 0",
        }}
      >
        {salinStatus === "ok"
          ? "✓ Tersalin! Tinggal paste."
          : salinStatus === "gagal"
          ? "Gagal menyalin, coba lagi."
          : "📋 Salin teks & link"}
      </button>

      <div
        onClick={() => window.open("https://x.com/ceritagenz", "_blank")}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.1)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          borderRadius: 20,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          backdropFilter: "blur(4px)",
          boxSizing: "border-box",
        }}
      >
        {/* Ikon X bulat */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>

        {/* Teks */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: WARNA.putih, fontFamily: FONT_DISPLAY }}>
            Follow @ceritagenz
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginTop: 2, fontFamily: FONT_BODY }}>
            Random thoughts generasi capek tapi tetep jalan 🫡
          </div>
        </div>

        {/* Tombol Follow */}
        <div
          style={{
            background: WARNA.putih,
            color: WARNA.primerGelap,
            borderRadius: 20,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 800,
            fontFamily: FONT_DISPLAY,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          Follow
        </div>
      </div>
    </div>
  );
}

function btnShareIkon(bg, mono = false) {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "14px 0",
    background: bg,
    color: WARNA.putih,
    border: mono ? "1.5px solid rgba(255,255,255,0.3)" : "none",
    borderRadius: 16,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: FONT_BODY,
    backdropFilter: "blur(4px)",
  };
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
  const [tampilSejumlah, setTampilSejumlah] = useState(10);
  const ditampilkan = respondenValid.slice(0, tampilSejumlah);
  const adaLagi = tampilSejumlah < respondenValid.length;

  return (
    <div>
      <button
        onClick={onKembali}
        style={{
          background: "none",
          border: "none",
          color: WARNA.putih,
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          display: "block",
          marginBottom: 12,
          padding: 0,
        }}
      >
        ← Kembali
      </button>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
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
        {ditampilkan.map((r, idx) => (
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

      {adaLagi && (
        <button
          onClick={() => setTampilSejumlah((prev) => prev + 10)}
          style={{
            width: "100%",
            padding: "13px 0",
            background: "rgba(255,255,255,0.15)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            borderRadius: 16,
            color: WARNA.putih,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: FONT_BODY,
            marginBottom: 10,
          }}
        >
          Muat lebih banyak ({respondenValid.length - tampilSejumlah} lagi)
        </button>
      )}

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
  background: "rgba(255,255,255,0.95)",
  borderRadius: 24,
  padding: 22,
  marginBottom: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(91,79,232,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
  border: "1px solid rgba(255,255,255,0.7)",
};

const kartuGlass = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: 24,
  padding: 22,
  marginBottom: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
};

const labelKecil = {
  fontSize: 12,
  color: WARNA.cyan,
  fontWeight: 800,
  letterSpacing: "0.08em",
  marginBottom: 8,
};

function optionStyle(aktif) {
  return {
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: 16,
    border: aktif ? `2px solid ${WARNA.cyan}` : `1.5px solid #E8E4F8`,
    background: aktif ? "linear-gradient(135deg, #EEF2FF, #E0DBFF)" : "#FAFAFA",
    color: aktif ? WARNA.primerGelap : "#1E1B4B",
    fontWeight: aktif ? 700 : 500,
    fontSize: 15,
    cursor: "pointer",
    fontFamily: FONT_BODY,
    width: "100%",
    lineHeight: 1.4,
    transition: "all 0.18s ease",
    boxShadow: aktif
      ? `0 4px 16px rgba(34,211,238,0.25), 0 0 0 3px rgba(34,211,238,0.1)`
      : "0 1px 3px rgba(0,0,0,0.06)",
  };
}

const btnKuning = {
  width: "100%",
  padding: "16px 0",
  background: `linear-gradient(135deg, ${WARNA.kuning}, ${WARNA.kuningGelap})`,
  color: "#1A1200",
  border: "none",
  borderRadius: 20,
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: "0.01em",
  cursor: "pointer",
  fontFamily: FONT_DISPLAY,
  boxShadow: "0 8px 24px rgba(245,158,11,0.4), 0 2px 8px rgba(0,0,0,0.3)",
};

const btnPrimary = {
  width: "100%",
  padding: "15px 0",
  background: "rgba(255,255,255,0.12)",
  color: WARNA.putih,
  border: "1.5px solid rgba(255,255,255,0.25)",
  borderRadius: 20,
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: FONT_DISPLAY,
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
};

const btnSecondary = {
  width: "100%",
  padding: "15px 0",
  background: "rgba(255,255,255,0.1)",
  color: WARNA.putih,
  border: "1.5px solid rgba(255,255,255,0.2)",
  borderRadius: 20,
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  marginTop: 8,
  fontFamily: FONT_DISPLAY,
  backdropFilter: "blur(10px)",
};

const btnGhost = {
  fontSize: 12,
  padding: "5px 14px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  cursor: "pointer",
  color: WARNA.putih,
  fontFamily: FONT_BODY,
  fontWeight: 700,
  backdropFilter: "blur(4px)",
};

const btnKembali = {
  width: "100%",
  padding: "12px 0",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT_BODY,
  backdropFilter: "blur(4px)",
};
