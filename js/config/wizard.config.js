/**
 * @file wizard.config.js
 * @description Konfigurasi data dan metadata tahapan form wizard KAK Digitalizer.
 * Layer: Config / Constants
 */

const WIZARD_CONFIG = {
  TOTAL_STEPS: 7,

  STORAGE_KEYS: {
    DRAFT: "kak_digitalizer_draft"
  },

  DEFAULT_PRESETS: {
    DASAR_HUKUM: [
      "Undang-Undang Nomor 24 Tahun 2007 tentang Penanggulangan Bencana",
      "Peraturan Pemerintah Nomor 21 Tahun 2008 tentang Penyelenggaraan Penanggulangan Bencana",
      "Peraturan Presiden Nomor 144 Tahun 2024 tentang Kementerian Koordinator Bidang Pembangunan Manusia dan Kebudayaan",
      "Peraturan Menteri Koordinator Bidang Pembangunan Manusia dan Kebudayaan Nomor 3 Tahun 2025 tentang Rencana Strategis Kemenko PMK 2025-2029"
    ],
    LEMBAGA_PENERIMA: [
      "Kementerian Kesehatan (Kemenkes)",
      "Badan Nasional Penanggulangan Bencana (BNPB)",
      "Kementerian Sosial (Kemensos)",
      "Pemerintah Daerah Provinsi & Kabupaten/Kota Rawan Bencana"
    ],
    MASYARAKAT_PENERIMA: [
      "Masyarakat di kawasan rawan bencana tinggi",
      "Kelompok rentan (Ibu hamil, anak-anak, lansia, dan penyandang disabilitas)",
      "Relawan penanggulangan bencana dan kader siaga bencana desa"
    ]
  },

  STEPS: [
    {
      step: 1,
      id: "step-1",
      navLabel: "Cover & Identitas",
      title: "Cover & Identitas KAK",
      description: "Informasi satuan kerja, tahun anggaran, serta nama kegiatan dan output sesuai DIPA/Renstra.",
      badgeText: "Bagian Cover & Header Matriks KAK",
      requiredFields: ["asdep_nama", "deputi_bidang", "tahun_anggaran", "ro_judul", "kro_nama", "kegiatan_nama"]
    },
    {
      step: 2,
      id: "step-2",
      navLabel: "Dasar Hukum & SOTK",
      title: "Dasar Hukum & SOTK Kemenko PMK",
      description: "Peraturan perundangan yang mendasari pelaksanaan tugas fungsi dan kewenangan Asisten Deputi.",
      badgeText: "Bagian A.1 Dasar Hukum & A.2 SOTK",
      requiredFields: ["perpres_sotk_no", "perpres_sotk_tentang", "kl_mitra"]
    },
    {
      step: 3,
      id: "step-3",
      navLabel: "RPJMN & Kebijakan",
      title: "RPJMN 2025–2029 & Rekomendasi Kebijakan",
      description: "Keterhubungan program dengan Prioritas Nasional, sasaran pembangunan, serta output rekomendasi.",
      badgeText: "Bagian A.2 RPJMN, RKP, & Rekomendasi",
      requiredFields: ["rpjmn_pn_no", "rpjmn_pn_nama", "rpjmn_pn_sasaran", "rkp_arah_kebijakan", "rpjmn_indikator", "isu_strategis_narasi"]
    },
    {
      step: 4,
      id: "step-4",
      navLabel: "RB & Gender (GAP)",
      title: "Reformasi Birokrasi (RB) & Gender (GAP)",
      description: "Pengawalan indikator RB tematik/general serta pengarusutamaan gender melalui Gender Analysis Pathway.",
      badgeText: "Bagian A.2.2 RB & A.2.3 PUG (GAP)",
      requiredFields: ["rb_indikator", "rb_narasi"]
    },
    {
      step: 5,
      id: "step-5",
      navLabel: "Tahapan Pelaksanaan",
      title: "Penerima Manfaat & Tahapan Pelaksanaan",
      description: "Rincian pemangku kepentingan dan 4 tahapan rapat pelaksanaan untuk Subkomponen 051.",
      badgeText: "Bagian B Penerima Manfaat & C Strategi",
      requiredFields: ["rak_judul"]
    },
    {
      step: 6,
      id: "step-6",
      navLabel: "Jadwal & Anggaran",
      title: "Matriks Jadwal Bulanan & Anggaran (RAB)",
      description: "Menentukan kurun waktu pelaksanaan per tahapan kegiatan dan total alokasi anggaran KAK.",
      badgeText: "Bagian D Kurun Waktu & E Biaya",
      requiredFields: ["total_anggaran", "total_anggaran_terbilang"]
    },
    {
      step: 7,
      id: "step-7",
      navLabel: "Pengesahan & Unduh",
      title: "Lembar Pengesahan & Unduh Dokumen",
      description: "Tanda tangan pejabat penanggung jawab dan pembuatan berkas Word (.docx) resmi.",
      badgeText: "Lembar Pengesahan Kemenko PMK",
      requiredFields: ["tanggal_pengesahan", "pejabat_nama", "pejabat_nip"]
    }
  ]
};

// Pasang ke namespace global window
window.WIZARD_CONFIG = WIZARD_CONFIG;
