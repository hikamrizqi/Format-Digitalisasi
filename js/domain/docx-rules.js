/**
 * @file docx-rules.js
 * @description Domain Business Rules untuk pemetaan placeholder OpenXML template KAK Kemenko PMK.
 * Menggunakan Strategy Pattern (Rules Registry) menggantikan percabangan bersarang.
 * Layer: Domain / Business Rules
 */

class DocxRuleHelpers {
  /**
   * Mengganti teks pada run yang memiliki sorotan kuning
   * @param {Element} paragraph - Elemen <w:p>
   * @param {string} replacementText - Teks pengganti
   */
  static replaceRunTextWithHighlight(paragraph, replacementText) {
    const runs = paragraph.getElementsByTagName("w:r");
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t) {
          t.textContent = replacementText;
        }
      }
    }
  }

  /**
   * Mengganti dua kemunculan highlight pertama dan kedua dalam satu paragraf
   * @param {Element} paragraph 
   * @param {string} firstText 
   * @param {string} secondText 
   */
  static replaceFirstAndSecondHighlight(paragraph, firstText, secondText) {
    const runs = paragraph.getElementsByTagName("w:r");
    let found = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t) {
          if (found === 0) {
            t.textContent = firstText;
            found++;
          } else if (found === 1) {
            t.textContent = secondText;
            found++;
          }
        }
      }
    }
  }

  /**
   * Mengganti deretan run bertanda kuning secara berurutan sesuai array teks
   * @param {Element} paragraph 
   * @param {Array<string>} textArray 
   */
  static replaceHighlightedRunsInParagraph(paragraph, textArray) {
    const runs = paragraph.getElementsByTagName("w:r");
    let idx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        if (idx < textArray.length) {
          const t = r.getElementsByTagName("w:t")[0];
          if (t) {
            t.textContent = textArray[idx];
          }
          idx++;
        }
      }
    }
  }

  /**
   * Mengosongkan run lainnya dan menaruh seluruh teks baru pada run pertama
   * @param {Element} paragraph 
   * @param {string} newText 
   */
  static setParagraphFullText(paragraph, newText) {
    const runs = paragraph.getElementsByTagName("w:r");
    if (runs.length > 0) {
      const firstT = runs[0].getElementsByTagName("w:t")[0];
      if (firstT) {
        firstT.textContent = newText;
      }
      for (let i = 1; i < runs.length; i++) {
        const t = runs[i].getElementsByTagName("w:t")[0];
        if (t) t.textContent = "";
      }
    }
  }
}

/**
 * Daftar Aturan Strategi Pemetaan Paragraf KAK
 * Setiap aturan memiliki `id`, `matcher(p, index, text)`, dan `handler(p, data, helpers)`
 */
const DOCX_MAPPING_RULES = [
  // 1. Cover: ASISTEN DEPUTI
  {
    id: "cover_asdep",
    match: (p, i, t) => t.includes("ASISTEN DEPUTI") && t.includes("…") && i < 20,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, (data.asdep_nama || "").toUpperCase())
  },
  // 2. Cover: TAHUN
  {
    id: "cover_tahun",
    match: (p, i, t) => t.includes("TAHUN") && t.includes("…") && i < 20,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.tahun_anggaran || "")
  },
  // 3. Cover: RINCIAN OUTPUT (RO)
  {
    id: "cover_ro_judul",
    match: (p, i, t) => t.includes("REKOMENDASI ALTERNATIF KEBIJAKAN") && t.includes("…") && i < 25,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, (data.ro_judul || "").toUpperCase())
  },
  {
    id: "cover_ro_kode",
    match: (p, i, t) => t.trim().startsWith("(") && t.trim().endsWith(")") && t.includes("…") && i < 25,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, `(${data.ro_kode || ""})`)
  },
  // 4. Cover: KLASIFIKASI RINCIAN OUTPUT (KRO)
  {
    id: "cover_kro",
    match: (p, i, t) => t.includes("Kebijakan Bidang") && t.includes("…") && i < 30,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.kro_nama || "")
  },
  // 5. Cover: KEGIATAN
  {
    id: "cover_kegiatan",
    match: (p, i, t) => t.includes("Kebijakan") && !t.includes("Bidang") && t.includes("…") && i < 30,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.kegiatan_nama || "")
  },
  // 6. Cover: DEPUTI BIDANG
  {
    id: "cover_deputi",
    match: (p, i, t) => t.includes("DEPUTI BIDANG") && t.includes("…") && i < 40,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, (data.deputi_bidang || "").toUpperCase())
  },
  // 7. Header Matriks KAK: Unit Eselon II
  {
    id: "matriks_unit_eselon",
    match: (p, i, t) => t.includes("Asisten Deputi") && t.includes("…") && i >= 35 && i < 50,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.asdep_nama || "")
  },
  // 8. Sasaran & Indikator Program
  {
    id: "matriks_sasaran_program",
    match: (p, i, t) => t.includes("Meningkatnya koordinasi dalam mengembangkan dan menyerasikan kebijakan Bidang") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.kro_nama || data.asdep_nama || "")
  },
  {
    id: "matriks_indikator_program",
    match: (p, i, t) => t.includes("Jumlah Rekomendasi Kebijakan di Bidang") && t.includes("yang dihasilkan"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.kro_nama || data.asdep_nama || "")
  },
  // 9. Kegiatan pada Matriks
  {
    id: "matriks_kegiatan",
    match: (p, i, t) => t.includes("Kebijakan") && t.includes("(") && t.includes(")") && i >= 50 && i < 60,
    apply: (p, data) => DocxRuleHelpers.replaceFirstAndSecondHighlight(p, data.kegiatan_nama || "", data.kegiatan_kode || "")
  },
  // 10. Sasaran Kegiatan
  {
    id: "matriks_sasaran_kegiatan",
    match: (p, i, t) => t.includes("Tersusunnya Kebijakan Bidang") && i >= 50 && i < 65,
    apply: (p, data) => DocxRuleHelpers.replaceFirstAndSecondHighlight(p, data.kro_nama || "", data.kro_kode || "")
  },
  // 11. Klasifikasi Rincian Output
  {
    id: "matriks_kro",
    match: (p, i, t) => t.includes("Kebijakan Bidang") && i >= 58 && i < 65,
    apply: (p, data) => DocxRuleHelpers.replaceFirstAndSecondHighlight(p, data.kro_nama || "", data.kro_kode || "")
  },
  // 12. Rincian Output
  {
    id: "matriks_ro",
    match: (p, i, t) => t.includes("Rekomendasi Alternatif Kebijakan") && i >= 60 && i < 68,
    apply: (p, data) => DocxRuleHelpers.replaceFirstAndSecondHighlight(p, data.ro_judul || "", data.ro_kode || "")
  },
  // 13. Indikator Rincian Output
  {
    id: "matriks_indikator_ro",
    match: (p, i, t) => t.includes("Jumlah Rekomendasi Alternatif Kebijakan") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.ro_judul || "")
  },
  // 14. Volume Rincian Output
  {
    id: "matriks_volume_ro",
    match: (p, i, t) => t.includes("Rekomendasi Alternatif Kebijakan") && i >= 68 && i < 75,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.ro_volume || "1")
  },
  // 15. Latar Belakang: Dasar Hukum RO
  {
    id: "latar_belakang_dh_ro",
    match: (p, i, t) => t.includes("Dasar hukum tugas fungsi dan/atau ketentuan yang terkait langsung dengan RO") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.ro_judul || "")
  },
  // 16. Daftar Dasar Hukum
  {
    id: "latar_belakang_dh_list",
    match: (p, i, t) => t.trim() === "…" && i >= 75 && i < 83,
    apply: (p, data, i) => {
      const dhList = Array.isArray(data.dasar_hukum) ? data.dasar_hukum : [];
      const dhIndex = i - 78;
      if (dhIndex >= 0 && dhIndex < dhList.length) {
        DocxRuleHelpers.setParagraphFullText(p, dhList[dhIndex]);
      } else {
        DocxRuleHelpers.setParagraphFullText(p, "");
      }
    }
  },
  // 17. Instruksi Dasar Hukum
  {
    id: "clean_instruksi_dh",
    match: (p, i, t) => t.includes("Cantumkan Undang-undang, PP, Perpres"),
    apply: (p) => DocxRuleHelpers.setParagraphFullText(p, "")
  },
  // 18. Paragraf SOTK Kemenko PMK
  {
    id: "sotk_paragraph",
    match: (p, i, t) => t.includes("Berdasarkan Peraturan Presiden Nomor") && t.includes("(1)"),
    apply: (p, data) => {
      const replacements = [
        data.perpres_sotk_no || "144 Tahun 2024",
        data.perpres_sotk_tentang || "Kementerian Koordinator Bidang Pembangunan Manusia dan Kebudayaan",
        data.urusan_pmk || "pembangunan manusia dan kebudayaan",
        data.deputi_bidang || "",
        data.fungsi_deputi_bidang || "koordinasi dan sinkronisasi",
        data.bidang_deputi || data.kro_nama || "",
        data.asdep_nama || "",
        data.fungsi_asdep || "koordinasi, sinkronisasi, dan pemantauan",
        data.asdep_nama || "",
        data.kl_mitra || ""
      ];
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, replacements);
    }
  },
  // 19. Paragraf RPJMN 2025-2029
  {
    id: "rpjmn_paragraph",
    match: (p, i, t) => t.includes("Rencana Pembangunan Jangka Menengah Nasional (RPJMN) 2025") && t.includes("(11)"),
    apply: (p, data) => {
      const replacements = [
        data.asdep_nama || "",
        data.rpjmn_pn_no || "5",
        data.rpjmn_pn_nama || "",
        data.rpjmn_pn_no || "5",
        data.rpjmn_pn_sasaran || "",
        data.tahun_anggaran || "2027",
        data.rpjmn_pn_no || "5",
        data.rkp_arah_kebijakan || "",
        data.kro_nama || "",
        data.fokus_intervensi || ""
      ];
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, replacements);
    }
  },
  // 20. Indikator RPJMN Lampiran III
  {
    id: "rpjmn_indikator",
    match: (p, i, t) => t.includes("Program dan indikator merujuk RPJMN yang dikawal di tahun"),
    apply: (p, data) => {
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, [data.tahun_anggaran || "2027", data.rpjmn_indikator || ""]);
    }
  },
  // 21. Paragraf Data Terbaru & Isu Strategis
  {
    id: "isu_strategis",
    match: (p, i, t) => t.includes("Data terbaru terkait program") && t.includes("menyatakan bahwa"),
    apply: (p, data) => {
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, [
        data.kegiatan_nama || data.ro_judul || "",
        data.isu_strategis_narasi || "",
        "" // bersihkan sisa teks instruksi
      ]);
    }
  },
  // 22. Program Prioritas Lainnya (PKPN dll.)
  {
    id: "program_prioritas_lain",
    match: (p, i, t) => t.includes("memiliki program prioritas lainnya yang harus dikoordinasikan yaitu"),
    apply: (p, data) => {
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, [
        data.asdep_nama || "",
        data.program_prioritas_lain || "-",
        ""
      ]);
    }
  },
  // 23. Rencana Kerja Tahun Anggaran Output
  {
    id: "output_rencana_kerja",
    match: (p, i, t) => t.includes("output yang akan dihasilkan pada rencana kerja tahun anggaran"),
    apply: (p, data) => {
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, [data.asdep_nama || "", data.tahun_anggaran || ""]);
    }
  },
  // 24. Butir Rekomendasi Kebijakan
  {
    id: "rekomendasi_judul",
    match: (p, i, t) => t.startsWith("Rekomendasi Alternatif Kebijakan") && t.includes("…") && i >= 90 && i < 100,
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.rekomendasi_judul || data.ro_judul || "")
  },
  {
    id: "rekomendasi_narasi",
    match: (p, i, t) => t.includes("Rekomendasi alternatif kebijakan ini bertujuan untuk") && t.includes("…"),
    apply: (p, data) => {
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, [
        data.rekomendasi_tujuan || "",
        data.rekomendasi_fokus || "",
        data.rekomendasi_harapan || ""
      ]);
    }
  },
  // 25. Reformasi Birokrasi (RB)
  {
    id: "rb_indikator",
    match: (p, i, t) => t.includes("Terhadap pelaksanaan Reformasi Birokrasi (RB), Asisten Deputi") && t.includes("…"),
    apply: (p, data) => {
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, [data.asdep_nama || "", data.rb_indikator || ""]);
    }
  },
  {
    id: "rb_narasi",
    match: (p, i, t) => t.includes("Catatan narasi terkait RB yang disusun pada penjelasan"),
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, data.rb_narasi || "")
  },
  {
    id: "clean_rb_panduan",
    match: (p, i, t) => i >= 102 && i <= 108 && (
      t.includes("regulasi/peraturan perundangan yang mendasari") ||
      t.includes("kondisi capaian indikator terkini") ||
      t.includes("isu strategis yang harus dikawal") ||
      t.includes("faktor penghambat yang harus dientaskan") ||
      t.includes("keterhubungan dengan Reformasi") ||
      t.includes("pelibatan stakeholder disebutkan")
    ),
    apply: (p) => DocxRuleHelpers.setParagraphFullText(p, "")
  },
  // 26. Pengarusutamaan Gender (GAP)
  {
    id: "gender_gap",
    match: (p, i, t) => t.includes("Asisten Deputi") && t.includes("telah mengintegrasikan perspektif gender"),
    apply: (p, data) => {
      const replacements = [
        data.asdep_nama || "",
        data.gap_bidang || data.kro_nama || "",
        data.gap_isu || "",
        data.gap_faktor || "",
        data.asdep_nama || "",
        data.gap_intervensi || ""
      ];
      DocxRuleHelpers.replaceHighlightedRunsInParagraph(p, replacements);
    }
  },
  // 27. Manajemen Risiko
  {
    id: "manajemen_risiko",
    match: (p, i, t) => t.includes("Risiko yang ada dalam pelaksanaan program pada Asisten Deputi") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.asdep_nama || "")
  },
  // 28. Penerima Manfaat
  {
    id: "penerima_lembaga_dan_masyarakat",
    match: (p, i, t) => i >= 115 && i <= 122 && t.trim() === "…",
    apply: (p, data, i) => {
      const lembagaList = Array.isArray(data.penerima_lembaga) ? data.penerima_lembaga : [];
      const masyarakatList = Array.isArray(data.penerima_masyarakat) ? data.penerima_masyarakat : [];

      if (i >= 116 && i <= 118) {
        const lIdx = i - 116;
        DocxRuleHelpers.setParagraphFullText(p, lIdx < lembagaList.length ? lembagaList[lIdx] : "");
      } else if (i === 121 && masyarakatList.length > 0) {
        DocxRuleHelpers.setParagraphFullText(p, masyarakatList.join("; "));
      }
    }
  },
  {
    id: "clean_data_terpilah_note",
    match: (p, i, t) => t.includes("Ditambahkan informasi mengenai data terpilah"),
    apply: (p) => DocxRuleHelpers.setParagraphFullText(p, "")
  },
  // 29. RAK & Metode Pelaksanaan
  {
    id: "metode_volume",
    match: (p, i, t) => t.includes("Metode pelaksanaan yang digunakan dalam menghasilkan") && t.includes("output Rekomendasi"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.ro_volume || "1")
  },
  {
    id: "metode_rak_1",
    match: (p, i, t) => t.startsWith("RAK 1:") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, `RAK 1: ${data.rak_judul || data.ro_judul || ""}`)
  },
  {
    id: "clean_rak_2_3",
    match: (p, i, t) => t.startsWith("RAK 2:") || t.startsWith("RAK 3:"),
    apply: (p) => DocxRuleHelpers.setParagraphFullText(p, "")
  },
  {
    id: "metode_swakelola_note",
    match: (p, i, t) => t.includes("Diisi dengan cara pelaksanaannya berupa kontraktual"),
    apply: (p) => DocxRuleHelpers.setParagraphFullText(p, "Pelaksanaan kegiatan dilakukan secara swakelola terkoordinasi.")
  },
  {
    id: "tahapan_tahun",
    match: (p, i, t) => t.includes("Tahapan pelaksanaan kegiatan yang akan dilakukan pada tahun") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.replaceRunTextWithHighlight(p, data.tahun_anggaran || "")
  },
  // 30. Subkomponen 051
  {
    id: "subkomponen_rak_header",
    match: (p, i, t) => t.includes("2.1 RAK") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, `2.1 RAK ${data.rak_judul || data.ro_judul || ""}`)
  },
  {
    id: "subkomponen_051_header",
    match: (p, i, t) => t.includes("2.1.1 Sub Komponen 051 Sinkronisasi, Koordinasi dan Pengendalian Bidang") && t.includes("…"),
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, `2.1.1 Sub Komponen 051 Sinkronisasi, Koordinasi dan Pengendalian ${data.kro_nama || ""}`)
  },
  // 31. Tahapan Kegiatan 1
  {
    id: "tahap1_fields",
    match: (p, i, t) => i < 150 && (
      t.includes("Rapat Koordinasi Identifikasi Permasalahan") ||
      t.startsWith("Lokasi : Prov") ||
      t.startsWith("Waktu : Bulan") ||
      t.startsWith("Peserta :") ||
      t.startsWith("Jumlah Peserta :") ||
      t.startsWith("Narasumber :") ||
      t.startsWith("Output yang akan dicapai :") ||
      t.startsWith("Alasan pemilihan lokasi :")
    ),
    apply: (p, data, i, t) => {
      if (t.includes("Rapat Koordinasi Identifikasi Permasalahan")) {
        if (data.tahap1_kegiatan) DocxRuleHelpers.setParagraphFullText(p, data.tahap1_kegiatan);
      } else if (t.startsWith("Lokasi : Prov")) {
        DocxRuleHelpers.setParagraphFullText(p, `Lokasi : Prov ${data.tahap1_prov || ""} Kab/Kota ${data.tahap1_kota || ""}`);
      } else if (t.startsWith("Waktu : Bulan")) {
        DocxRuleHelpers.setParagraphFullText(p, `Waktu : Bulan ${data.tahap1_bulan || ""} Tahun ${data.tahap1_tahun || data.tahun_anggaran || ""}`);
      } else if (t.startsWith("Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Peserta : ${data.tahap1_peserta || ""}`);
      } else if (t.startsWith("Jumlah Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap1_jml_peserta || ""} orang`);
      } else if (t.startsWith("Narasumber :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Narasumber : ${data.tahap1_narasumber || "-"}`);
      } else if (t.startsWith("Output yang akan dicapai :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap1_output || ""}`);
      } else if (t.startsWith("Alasan pemilihan lokasi :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap1_alasan || "-"}`);
      }
    }
  },
  // 32. Tahapan Kegiatan 2
  {
    id: "tahap2_fields",
    match: (p, i, t) => i >= 150 && i < 168 && (
      t.startsWith("Lokasi : Prov") ||
      t.startsWith("Waktu : Bulan") ||
      t.startsWith("Peserta :") ||
      t.startsWith("Jumlah Peserta :") ||
      t.startsWith("Narasumber :") ||
      t.startsWith("Output yang akan dicapai :") ||
      t.startsWith("Alasan pemilihan lokasi :")
    ),
    apply: (p, data, i, t) => {
      if (t.startsWith("Lokasi : Prov")) {
        DocxRuleHelpers.setParagraphFullText(p, `Lokasi : Prov ${data.tahap2_prov || ""} Kab/Kota ${data.tahap2_kota || ""}`);
      } else if (t.startsWith("Waktu : Bulan")) {
        DocxRuleHelpers.setParagraphFullText(p, `Waktu : Bulan ${data.tahap2_bulan || ""} Tahun ${data.tahap2_tahun || data.tahun_anggaran || ""}`);
      } else if (t.startsWith("Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Peserta : ${data.tahap2_peserta || ""}`);
      } else if (t.startsWith("Jumlah Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap2_jml_peserta || ""} orang`);
      } else if (t.startsWith("Narasumber :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Narasumber : ${data.tahap2_narasumber || "-"}`);
      } else if (t.startsWith("Output yang akan dicapai :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap2_output || ""}`);
      } else if (t.startsWith("Alasan pemilihan lokasi :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap2_alasan || "-"}`);
      }
    }
  },
  // 33. Tahapan Kegiatan 3
  {
    id: "tahap3_fields",
    match: (p, i, t) => i >= 168 && i < 185 && (
      t.startsWith("Lokasi : Prov") ||
      t.startsWith("Waktu : Bulan") ||
      t.startsWith("Peserta :") ||
      t.startsWith("Jumlah Peserta :") ||
      t.startsWith("Narasumber :") ||
      t.startsWith("Output yang akan dicapai :") ||
      t.startsWith("Alasan pemilihan lokasi :")
    ),
    apply: (p, data, i, t) => {
      if (t.startsWith("Lokasi : Prov")) {
        DocxRuleHelpers.setParagraphFullText(p, `Lokasi : Prov ${data.tahap3_prov || ""} Kab/Kota ${data.tahap3_kota || ""}`);
      } else if (t.startsWith("Waktu : Bulan")) {
        DocxRuleHelpers.setParagraphFullText(p, `Waktu : Bulan ${data.tahap3_bulan || ""} Tahun ${data.tahap3_tahun || data.tahun_anggaran || ""}`);
      } else if (t.startsWith("Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Peserta : ${data.tahap3_peserta || ""}`);
      } else if (t.startsWith("Jumlah Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap3_jml_peserta || ""} orang`);
      } else if (t.startsWith("Narasumber :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Narasumber : ${data.tahap3_narasumber || "-"}`);
      } else if (t.startsWith("Output yang akan dicapai :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap3_output || ""}`);
      } else if (t.startsWith("Alasan pemilihan lokasi :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap3_alasan || "-"}`);
      }
    }
  },
  // 34. Tahapan Kegiatan 4
  {
    id: "tahap4_fields",
    match: (p, i, t) => i >= 185 && i < 205 && (
      t.startsWith("Lokasi : Prov") ||
      t.startsWith("Waktu : Bulan") ||
      t.startsWith("Peserta :") ||
      t.startsWith("Jumlah Peserta :") ||
      t.startsWith("Narasumber :") ||
      t.startsWith("Output yang akan dicapai :") ||
      t.startsWith("Alasan pemilihan lokasi :") ||
      t.includes("Anggaran yang dibutuhkan untuk menghasilkan output ini adalah sebesar")
    ),
    apply: (p, data, i, t) => {
      if (t.startsWith("Lokasi : Prov")) {
        DocxRuleHelpers.setParagraphFullText(p, `Lokasi : Prov ${data.tahap4_prov || ""} Kab/Kota ${data.tahap4_kota || ""}`);
      } else if (t.startsWith("Waktu : Bulan")) {
        DocxRuleHelpers.setParagraphFullText(p, `Waktu : Bulan ${data.tahap4_bulan || ""} Tahun ${data.tahap4_tahun || data.tahun_anggaran || ""}`);
      } else if (t.startsWith("Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Peserta : ${data.tahap4_peserta || ""}`);
      } else if (t.startsWith("Jumlah Peserta :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap4_jml_peserta || ""} orang`);
      } else if (t.startsWith("Narasumber :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Narasumber : ${data.tahap4_narasumber || "-"}`);
      } else if (t.startsWith("Output yang akan dicapai :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap4_output || ""}`);
      } else if (t.startsWith("Alasan pemilihan lokasi :")) {
        DocxRuleHelpers.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap4_alasan || "-"}`);
      } else if (t.includes("Anggaran yang dibutuhkan untuk menghasilkan output ini adalah sebesar")) {
        DocxRuleHelpers.setParagraphFullText(p, `Anggaran yang dibutuhkan untuk menghasilkan output ini adalah sebesar ${data.subkomponen_anggaran || data.total_anggaran || ""}`);
      }
    }
  },
  // 35. Total Anggaran (Bab E)
  {
    id: "total_anggaran_bab_e",
    match: (p, i, t) => t.includes("untuk menghasilkan") && t.includes("output memerlukan anggaran sebesar"),
    apply: (p, data) => {
      DocxRuleHelpers.setParagraphFullText(
        p,
        `Asisten Deputi ${data.asdep_nama || ""} pada Tahun Anggaran ${data.tahun_anggaran || ""} untuk menghasilkan ${data.ro_volume || "1"} output memerlukan anggaran sebesar ${data.total_anggaran || ""} (${data.total_anggaran_terbilang || ""}).`
      );
    }
  },
  // 36. Lembar Pengesahan
  {
    id: "pengesahan_tanggal",
    match: (p, i, t) => t.startsWith("Jakarta,") && (t.includes("…") || t.includes("?")),
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, `Jakarta, ${data.tanggal_pengesahan || "15 Januari 2027"}`)
  },
  {
    id: "pengesahan_asdep",
    match: (p, i, t) => t.startsWith("Asisten Deputi") && t.endsWith(",") && (t.includes("…") || t.includes("?")),
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, `Asisten Deputi ${data.asdep_nama || ""},`)
  },
  {
    id: "pengesahan_nama",
    match: (p, i, t) => t.trim() === "…" && i >= 380 && i < 395,
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, data.pejabat_nama || "")
  },
  {
    id: "pengesahan_nip",
    match: (p, i, t) => t.startsWith("NIP") && i >= 385 && i < 400,
    apply: (p, data) => DocxRuleHelpers.setParagraphFullText(p, `NIP. ${data.pejabat_nip || ""}`)
  }
];

// Pasang ke namespace global window
window.DocxRuleHelpers = DocxRuleHelpers;
window.DOCX_MAPPING_RULES = DOCX_MAPPING_RULES;
