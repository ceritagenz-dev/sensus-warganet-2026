import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { BAGIAN, TOTAL_PERTANYAAN } from "./sensusData";
import { hitungSkorTotal, tentukanGolongan } from "./golonganData";

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

  useEffect(() => {
    muatData();
    try {
      const sudahIsi = localStorage.getItem("sensus_warganet_2026_sudah_isi");
      if (sudahIsi) {
        setSudahPernahIsi(true);
        const golonganTersimpan = localStorage.getItem("sensus_warganet_2026_golongan");
        const nomorTersimpan = localStorage.getItem("sensus_warganet_2026_nomor");
        if (golonganTersimpan) {
          setGolonganHasil(JSON.parse(golonganTersimpan));
          setNomorResponden(nomorTersimpan ? parseInt(nomorTersimpan, 10) : null);
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
      kirimSensus();
    }
  }

  async function kirimSensus() {
    setLoading(true);
    setError(null);

    const skorTotal = hitungSkorTotal(jawaban, BAGIAN);
    const golongan = tentukanGolongan(skorTotal);

    const { error } = await supabase.from("sensus_responses").insert([
      { ...jawaban, skor: skorTotal, golongan: golongan.nama },
    ]);

    if (error) {
      setError("Gagal mengirim data. Coba lagi ya.");
      setLoading(false);
      return;
    }

    await muatData();
    setNomorResponden(totalResponden + 1);
    setGolonganHasil(golongan);
    setLoading(false);
    setStep("submitted");

    try {
      localStorage.setItem("sensus_warganet_2026_sudah_isi", "true");
      localStorage.setItem("sensus_warganet_2026_golongan", JSON.stringify(golongan));
      localStorage.setItem("sensus_warganet_2026_nomor", String(totalResponden + 1));
    } catch (e) {
      // localStorage tidak tersedia, lewati saja
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

        {step === "submitted" && (
          <Submitted
            nomorResponden={nomorResponden}
            golonganHasil={golonganHasil}
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

function Intro({ onMulai, jumlahResponden, sudahPernahIsi, golonganHasil, nomorResponden, onLihatHasil }) {
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
              <div style={{ fontSize: 19, fontWeight: 700, color: "#1B3A6B" }}>
                {golonganHasil.nama}
              </div>
              {nomorResponden && (
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                    color: "#6B6B6B",
                    marginTop: 8,
                  }}
                >
                  Responden #{String(nomorResponden).padStart(4, "0")}
                </div>
              )}
            </div>
          )}
        </div>

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

function Submitted({ nomorResponden, golonganHasil, onLihatHasil }) {
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
          NOMOR RESPONDEN: #{String(nomorResponden).padStart(4, "0")}
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
        <div style={{ fontSize: 12, color: "#1B3A6B", fontWeight: 700 }}>
          {salinStatus === "gagal"
            ? "Gagal menyalin, coba lagi."
            : `Tersalin! Tinggal paste di ${salinStatus}.`}
        </div>
      )}
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
              <span>Responden #{String(totalResponden - idx).padStart(4, "0")}</span>
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
