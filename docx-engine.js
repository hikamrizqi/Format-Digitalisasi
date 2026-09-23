/**
 * KAK Digitalizer - OpenXML DOCX Processing Engine
 * 100% Client-Side DOCX Manipulation via JSZip & Browser XML DOM
 * Kementerian Koordinator Bidang Pembangunan Manusia dan Kebudayaan
 */

class DocxEngine {
  constructor() {
    this.defaultTemplatePath = "template/template_kak.docx";
    this.templateArrayBuffer = null;
  }

  /**
   * Memuat template master DOCX (dari folder lokal template/ atau unggahan pengguna)
   */
  async loadTemplate(fileOrPath = null) {
    if (fileOrPath instanceof Blob || fileOrPath instanceof File) {
      this.templateArrayBuffer = await fileOrPath.arrayBuffer();
      return true;
    }

    // Prioritaskan embedded Base64 jika tersedia (100% offline & lancar saat double-click file:// di Windows)
    if (window.DEFAULT_TEMPLATE_BASE64 && !fileOrPath) {
      const binaryString = atob(window.DEFAULT_TEMPLATE_BASE64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.templateArrayBuffer = bytes.buffer;
      return true;
    }

    const path = fileOrPath || this.defaultTemplatePath;
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Gagal memuat template dari: ${path}`);
      }
      this.templateArrayBuffer = await response.arrayBuffer();
      return true;
    } catch (err) {
      console.warn("Fetch lokal gagal (kemungkinan protocol file://):", err);
      return false;
    }
  }

  /**
   * Menghasilkan dokumen DOCX dengan nilai form dan menghapus tanda kuning
   */
  async generateDocx(formData, customTemplateBuffer = null) {
    const buffer = customTemplateBuffer || this.templateArrayBuffer;
    if (!buffer) {
      throw new Error("Template DOCX belum dimuat. Silakan pilih atau unggah template DOCX terlebih dahulu.");
    }

    // 1. Ekstrak arsip DOCX dengan JSZip
    const zip = await JSZip.loadAsync(buffer);
    const documentXmlFile = zip.file("word/document.xml");
    if (!documentXmlFile) {
      throw new Error("Berkas word/document.xml tidak ditemukan di dalam template DOCX.");
    }

    let xmlString = await documentXmlFile.async("string");

    // 2. Lakukan transformasi cerdas pada XML
    xmlString = this.processXmlContent(xmlString, formData);

    // 3. Simpan kembali document.xml yang sudah dimodifikasi
    zip.file("word/document.xml", xmlString);

    // 4. Kompresi ulang menjadi Blob DOCX
    const generatedBlob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    return generatedBlob;
  }

  /**
   * Logika Penggantian Teks & Penghapusan Sorotan Kuning
   */
  processXmlContent(xmlStr, data) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");

    // Ambil semua paragraf
    const paragraphs = doc.getElementsByTagName("w:p");

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pText = p.textContent || "";

      // 1. Bagian Cover: ASISTEN DEPUTI
      if (pText.includes("ASISTEN DEPUTI") && pText.includes("…") && i < 20) {
        this.replaceRunTextWithHighlight(p, (data.asdep_nama || "").toUpperCase());
      }
      // 2. Bagian Cover: TAHUN
      else if (pText.includes("TAHUN") && pText.includes("…") && i < 20) {
        this.replaceRunTextWithHighlight(p, data.tahun_anggaran || "");
      }
      // 3. Bagian Cover: RINCIAN OUTPUT (RO)
      else if (pText.includes("REKOMENDASI ALTERNATIF KEBIJAKAN") && pText.includes("…") && i < 25) {
        this.replaceRunTextWithHighlight(p, (data.ro_judul || "").toUpperCase());
      }
      else if (pText.trim().startsWith("(") && pText.trim().endsWith(")") && pText.includes("…") && i < 25) {
        this.replaceRunTextWithHighlight(p, `(${data.ro_kode || ""})`);
      }
      // 4. Bagian Cover: KLASIFIKASI RINCIAN OUTPUT (KRO)
      else if (pText.includes("Kebijakan Bidang") && pText.includes("…") && i < 30) {
        this.replaceRunTextWithHighlight(p, data.kro_nama || "");
      }
      // 5. Bagian Cover: KEGIATAN
      else if (pText.includes("Kebijakan") && !pText.includes("Bidang") && pText.includes("…") && i < 30) {
        this.replaceRunTextWithHighlight(p, data.kegiatan_nama || "");
      }
      // 6. Bagian Cover: DEPUTI BIDANG
      else if (pText.includes("DEPUTI BIDANG") && pText.includes("…") && i < 40) {
        this.replaceRunTextWithHighlight(p, (data.deputi_bidang || "").toUpperCase());
      }
      // 7. Header Matriks KAK: Unit Eselon II
      else if (pText.includes("Asisten Deputi") && pText.includes("…") && i >= 35 && i < 50) {
        this.replaceRunTextWithHighlight(p, data.asdep_nama || "");
      }
      // 8. Sasaran & Indikator Program
      else if (pText.includes("Meningkatnya koordinasi dalam mengembangkan dan menyerasikan kebijakan Bidang") && pText.includes("…")) {
        this.replaceRunTextWithHighlight(p, data.kro_nama || data.asdep_nama || "");
      }
      else if (pText.includes("Jumlah Rekomendasi Kebijakan di Bidang") && pText.includes("yang dihasilkan")) {
        this.replaceRunTextWithHighlight(p, data.kro_nama || data.asdep_nama || "");
      }
      // 9. Kegiatan pada Matriks
      else if (pText.includes("Kebijakan") && pText.includes("(") && pText.includes(")") && i >= 50 && i < 60) {
        this.replaceFirstAndSecondHighlight(p, data.kegiatan_nama || "", data.kegiatan_kode || "");
      }
      // 10. Sasaran Kegiatan
      else if (pText.includes("Tersusunnya Kebijakan Bidang")) {
        this.replaceFirstAndSecondHighlight(p, data.kro_nama || "", data.kro_kode || "");
      }
      // 11. Klasifikasi Rincian Output
      else if (pText.includes("Kebijakan Bidang") && i >= 58 && i < 65) {
        this.replaceFirstAndSecondHighlight(p, data.kro_nama || "", data.kro_kode || "");
      }
      // 12. Rincian Output
      else if (pText.includes("Rekomendasi Alternatif Kebijakan") && i >= 60 && i < 68) {
        this.replaceFirstAndSecondHighlight(p, data.ro_judul || "", data.ro_kode || "");
      }
      // 13. Indikator Rincian Output
      else if (pText.includes("Jumlah Rekomendasi Alternatif Kebijakan") && pText.includes("…")) {
        this.replaceRunTextWithHighlight(p, data.ro_judul || "");
      }
      // 14. Volume Rincian Output
      else if (pText.includes("Rekomendasi Alternatif Kebijakan") && i >= 68 && i < 75) {
        this.replaceRunTextWithHighlight(p, data.ro_volume || "1");
      }
      // 15. Latar Belakang: Dasar Hukum RO
      else if (pText.includes("Dasar hukum tugas fungsi dan/atau ketentuan yang terkait langsung dengan RO") && pText.includes("…")) {
        this.replaceRunTextWithHighlight(p, data.ro_judul || "");
      }
      // 16. Daftar Dasar Hukum (paragraf titik-titik dasar hukum)
      else if (pText.trim() === "…" && i >= 75 && i < 83) {
        const dhList = Array.isArray(data.dasar_hukum) ? data.dasar_hukum : [];
        const dhIndex = i - 78; // urutan 0, 1, 2
        if (dhIndex >= 0 && dhIndex < dhList.length) {
          this.setParagraphFullText(p, dhList[dhIndex]);
        } else {
          this.setParagraphFullText(p, "");
        }
      }
      // 17. Paragraf Instruksi Dasar Hukum ("Cantumkan Undang-undang...") -> Bersihkan
      else if (pText.includes("Cantumkan Undang-undang, PP, Perpres")) {
        this.setParagraphFullText(p, "");
      }
      // 18. Paragraf SOTK (Perpres No ... tentang ...)
      else if (pText.includes("Berdasarkan Peraturan Presiden Nomor") && pText.includes("(1)")) {
        this.processSotkParagraph(p, data);
      }
      // 19. Paragraf RPJMN 2025-2029
      else if (pText.includes("Rencana Pembangunan Jangka Menengah Nasional (RPJMN) 2025") && pText.includes("(11)")) {
        this.processRpjmnParagraph(p, data);
      }
      // 20. Indikator RPJMN Lampiran III
      else if (pText.includes("Program dan indikator merujuk RPJMN yang dikawal di tahun")) {
        this.processRpjmnIndikatorParagraph(p, data);
      }
      // 21. Paragraf Data Terbaru / Isu Strategis
      else if (pText.includes("Data terbaru terkait program") && pText.includes("menyatakan bahwa")) {
        this.processIsuStrategisParagraph(p, data);
      }
      // 22. Program Prioritas Lainnya (PKPN dll.)
      else if (pText.includes("memiliki program prioritas lainnya yang harus dikoordinasikan yaitu")) {
        this.processProgramPrioritasLainParagraph(p, data);
      }
      // 23. Rencana Kerja Tahun Anggaran Output
      else if (pText.includes("output yang akan dihasilkan pada rencana kerja tahun anggaran")) {
        this.replaceHighlightedRunsInParagraph(p, [data.asdep_nama || "", data.tahun_anggaran || ""]);
      }
      // 24. Butir Rekomendasi Kebijakan (Judul & Narasi)
      else if (pText.startsWith("Rekomendasi Alternatif Kebijakan") && pText.includes("…") && i >= 90 && i < 100) {
        this.replaceRunTextWithHighlight(p, data.rekomendasi_judul || data.ro_judul || "");
      }
      else if (pText.includes("Rekomendasi alternatif kebijakan ini bertujuan untuk") && pText.includes("…")) {
        this.replaceHighlightedRunsInParagraph(p, [
          data.rekomendasi_tujuan || "",
          data.rekomendasi_fokus || "",
          data.rekomendasi_harapan || ""
        ]);
      }
      // 25. Reformasi Birokrasi (RB)
      else if (pText.includes("Terhadap pelaksanaan Reformasi Birokrasi (RB), Asisten Deputi") && pText.includes("…")) {
        this.replaceHighlightedRunsInParagraph(p, [
          data.asdep_nama || "",
          data.rb_indikator || ""
        ]);
      }
      else if (pText.includes("Catatan narasi terkait RB yang disusun pada penjelasan")) {
        // ganti kalimat pengantar instruksi dengan narasi RB pengguna
        this.setParagraphFullText(p, data.rb_narasi || "");
      }
      else if (i >= 102 && i <= 108 && (
        pText.includes("regulasi/peraturan perundangan yang mendasari") ||
        pText.includes("kondisi capaian indikator terkini") ||
        pText.includes("isu strategis yang harus dikawal") ||
        pText.includes("faktor penghambat yang harus dientaskan") ||
        pText.includes("keterhubungan dengan Reformasi") ||
        pText.includes("pelibatan stakeholder disebutkan")
      )) {
        // Bersihkan instruksi panduan RB
        this.setParagraphFullText(p, "");
      }
      // 26. Pengarusutamaan Gender (GAP)
      else if (pText.includes("Asisten Deputi") && pText.includes("telah mengintegrasikan perspektif gender")) {
        this.processGapParagraph(p, data);
      }
      // 27. Manajemen Risiko
      else if (pText.includes("Risiko yang ada dalam pelaksanaan program pada Asisten Deputi") && pText.includes("…")) {
        this.replaceRunTextWithHighlight(p, data.asdep_nama || "");
      }
      // 28. Penerima Manfaat: Lembaga Eksternal & Kelompok Masyarakat
      else if (i >= 115 && i <= 122 && pText.trim() === "…") {
        this.processPenerimaManfaatParagraphs(paragraphs, i, data);
      }
      else if (pText.includes("Ditambahkan informasi mengenai data terpilah")) {
        this.setParagraphFullText(p, "");
      }
      // 29. Metode Pelaksanaan: RAK
      else if (pText.includes("Metode pelaksanaan yang digunakan dalam menghasilkan") && pText.includes("output Rekomendasi")) {
        this.replaceRunTextWithHighlight(p, data.ro_volume || "1");
      }
      else if (pText.startsWith("RAK 1:") && pText.includes("…")) {
        this.setParagraphFullText(p, `RAK 1: ${data.rak_judul || data.ro_judul || ""}`);
      }
      else if (pText.startsWith("RAK 2:") || pText.startsWith("RAK 3:")) {
        this.setParagraphFullText(p, "");
      }
      else if (pText.includes("Diisi dengan cara pelaksanaannya berupa kontraktual")) {
        this.setParagraphFullText(p, "Pelaksanaan kegiatan dilakukan secara swakelola terkoordinasi.");
      }
      else if (pText.includes("Tahapan pelaksanaan kegiatan yang akan dilakukan pada tahun") && pText.includes("…")) {
        this.replaceRunTextWithHighlight(p, data.tahun_anggaran || "");
      }
      // 30. Subkomponen 051 & RAK
      else if (pText.includes("2.1 RAK") && pText.includes("…")) {
        this.setParagraphFullText(p, `2.1 RAK ${data.rak_judul || data.ro_judul || ""}`);
      }
      else if (pText.includes("2.1.1 Sub Komponen 051 Sinkronisasi, Koordinasi dan Pengendalian Bidang") && pText.includes("…")) {
        this.setParagraphFullText(p, `2.1.1 Sub Komponen 051 Sinkronisasi, Koordinasi dan Pengendalian ${data.kro_nama || ""}`);
      }
      // 31. Tahapan Kegiatan 1: Identifikasi Permasalahan
      else if (pText.includes("Rapat Koordinasi Identifikasi Permasalahan") && i < 150) {
        if (data.tahap1_kegiatan) this.setParagraphFullText(p, data.tahap1_kegiatan);
      }
      else if (pText.startsWith("Lokasi : Prov") && i < 150) {
        this.setParagraphFullText(p, `Lokasi : Prov ${data.tahap1_prov || ""} Kab/Kota ${data.tahap1_kota || ""}`);
      }
      else if (pText.startsWith("Waktu : Bulan") && i < 150) {
        this.setParagraphFullText(p, `Waktu : Bulan ${data.tahap1_bulan || ""} Tahun ${data.tahap1_tahun || data.tahun_anggaran || ""}`);
      }
      else if (pText.startsWith("Peserta :") && i < 150) {
        this.setParagraphFullText(p, `Peserta : ${data.tahap1_peserta || ""}`);
      }
      else if (pText.startsWith("Jumlah Peserta :") && i < 150) {
        this.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap1_jml_peserta || ""} orang`);
      }
      else if (pText.startsWith("Narasumber :") && i < 150) {
        this.setParagraphFullText(p, `Narasumber : ${data.tahap1_narasumber || "-"}`);
      }
      else if (pText.startsWith("Output yang akan dicapai :") && i < 150) {
        this.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap1_output || ""}`);
      }
      else if (pText.startsWith("Alasan pemilihan lokasi :") && i < 150) {
        this.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap1_alasan || "-"}`);
      }
      // 32. Tahapan Kegiatan 2: Sinkronisasi & Koordinasi
      else if (pText.startsWith("Lokasi : Prov") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Lokasi : Prov ${data.tahap2_prov || ""} Kab/Kota ${data.tahap2_kota || ""}`);
      }
      else if (pText.startsWith("Waktu : Bulan") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Waktu : Bulan ${data.tahap2_bulan || ""} Tahun ${data.tahap2_tahun || data.tahun_anggaran || ""}`);
      }
      else if (pText.startsWith("Peserta :") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Peserta : ${data.tahap2_peserta || ""}`);
      }
      else if (pText.startsWith("Jumlah Peserta :") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap2_jml_peserta || ""} orang`);
      }
      else if (pText.startsWith("Narasumber :") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Narasumber : ${data.tahap2_narasumber || "-"}`);
      }
      else if (pText.startsWith("Output yang akan dicapai :") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap2_output || ""}`);
      }
      else if (pText.startsWith("Alasan pemilihan lokasi :") && i >= 150 && i < 168) {
        this.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap2_alasan || "-"}`);
      }
      // 33. Tahapan Kegiatan 3: Monitoring dan Evaluasi
      else if (pText.startsWith("Lokasi : Prov") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Lokasi : Prov ${data.tahap3_prov || ""} Kab/Kota ${data.tahap3_kota || ""}`);
      }
      else if (pText.startsWith("Waktu : Bulan") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Waktu : Bulan ${data.tahap3_bulan || ""} Tahun ${data.tahap3_tahun || data.tahun_anggaran || ""}`);
      }
      else if (pText.startsWith("Peserta :") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Peserta : ${data.tahap3_peserta || ""}`);
      }
      else if (pText.startsWith("Jumlah Peserta :") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap3_jml_peserta || ""} orang`);
      }
      else if (pText.startsWith("Narasumber :") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Narasumber : ${data.tahap3_narasumber || "-"}`);
      }
      else if (pText.startsWith("Output yang akan dicapai :") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap3_output || ""}`);
      }
      else if (pText.startsWith("Alasan pemilihan lokasi :") && i >= 168 && i < 185) {
        this.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap3_alasan || "-"}`);
      }
      // 34. Tahapan Kegiatan 4: Penyusunan Rekomendasi
      else if (pText.startsWith("Lokasi : Prov") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Lokasi : Prov ${data.tahap4_prov || ""} Kab/Kota ${data.tahap4_kota || ""}`);
      }
      else if (pText.startsWith("Waktu : Bulan") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Waktu : Bulan ${data.tahap4_bulan || ""} Tahun ${data.tahap4_tahun || data.tahun_anggaran || ""}`);
      }
      else if (pText.startsWith("Peserta :") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Peserta : ${data.tahap4_peserta || ""}`);
      }
      else if (pText.startsWith("Jumlah Peserta :") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Jumlah Peserta : ${data.tahap4_jml_peserta || ""} orang`);
      }
      else if (pText.startsWith("Narasumber :") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Narasumber : ${data.tahap4_narasumber || "-"}`);
      }
      else if (pText.startsWith("Output yang akan dicapai :") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Output yang akan dicapai : ${data.tahap4_output || ""}`);
      }
      else if (pText.startsWith("Alasan pemilihan lokasi :") && i >= 185 && i < 205) {
        this.setParagraphFullText(p, `Alasan pemilihan lokasi : ${data.tahap4_alasan || "-"}`);
      }
      else if (pText.includes("Anggaran yang dibutuhkan untuk menghasilkan output ini adalah sebesar")) {
        this.setParagraphFullText(p, `Anggaran yang dibutuhkan untuk menghasilkan output ini adalah sebesar ${data.subkomponen_anggaran || data.total_anggaran || ""}`);
      }
      // 35. Total Anggaran (Bab E)
      else if (pText.includes("untuk menghasilkan") && pText.includes("output memerlukan anggaran sebesar")) {
        this.setParagraphFullText(p, `Asisten Deputi ${data.asdep_nama || ""} pada Tahun Anggaran ${data.tahun_anggaran || ""} untuk menghasilkan ${data.ro_volume || "1"} output memerlukan anggaran sebesar ${data.total_anggaran || ""} (${data.total_anggaran_terbilang || ""}).`);
      }
      // 36. Lembar Pengesahan
      else if (pText.startsWith("Jakarta,") && (pText.includes("…") || pText.includes("?"))) {
        this.setParagraphFullText(p, `Jakarta, ${data.tanggal_pengesahan || "15 Januari 2027"}`);
      }
      else if (pText.startsWith("Asisten Deputi") && pText.endsWith(",") && (pText.includes("…") || pText.includes("?"))) {
        this.setParagraphFullText(p, `Asisten Deputi ${data.asdep_nama || ""},`);
      }
      else if (pText.trim() === "…" && i >= 380 && i < 395) {
        this.setParagraphFullText(p, data.pejabat_nama || "");
      }
      else if (pText.startsWith("NIP") && i >= 385 && i < 400) {
        this.setParagraphFullText(p, `NIP. ${data.pejabat_nip || ""}`);
      }
    }

    // Bersihkan instruksi-instruksi template yang masih tertinggal
    this.cleanRemainingInstructionTexts(doc);

    // Hapus SELURUH tag <w:highlight> kuning di dokumen
    this.stripAllHighlights(doc);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  replaceRunTextWithHighlight(paragraph, replacementText) {
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

  replaceFirstAndSecondHighlight(paragraph, firstText, secondText) {
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

  replaceHighlightedRunsInParagraph(paragraph, textArray) {
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

  setParagraphFullText(paragraph, newText) {
    const runs = paragraph.getElementsByTagName("w:r");
    if (runs.length > 0) {
      // Set teks pada run pertama
      const firstT = runs[0].getElementsByTagName("w:t")[0];
      if (firstT) {
        firstT.textContent = newText;
      }
      // Kosongkan teks di run lainnya
      for (let i = 1; i < runs.length; i++) {
        const t = runs[i].getElementsByTagName("w:t")[0];
        if (t) t.textContent = "";
      }
    }
  }

  processSotkParagraph(p, data) {
    const runs = p.getElementsByTagName("w:r");
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

    let matchIdx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t && matchIdx < replacements.length) {
          t.textContent = replacements[matchIdx];
          matchIdx++;
        }
      }
    }
  }

  processRpjmnParagraph(p, data) {
    const runs = p.getElementsByTagName("w:r");
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

    let matchIdx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t && matchIdx < replacements.length) {
          t.textContent = replacements[matchIdx];
          matchIdx++;
        }
      }
    }
  }

  processRpjmnIndikatorParagraph(p, data) {
    const runs = p.getElementsByTagName("w:r");
    let matchIdx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t) {
          if (matchIdx === 0) {
            t.textContent = data.tahun_anggaran || "2027";
          } else {
            t.textContent = data.rpjmn_indikator || "";
          }
          matchIdx++;
        }
      }
    }
  }

  processIsuStrategisParagraph(p, data) {
    const runs = p.getElementsByTagName("w:r");
    let matchIdx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t) {
          if (matchIdx === 0) {
            t.textContent = data.kegiatan_nama || data.ro_judul || "";
          } else if (matchIdx === 1) {
            t.textContent = data.isu_strategis_narasi || "";
          } else {
            t.textContent = ""; // bersihkan teks panduan narasi
          }
          matchIdx++;
        }
      }
    }
  }

  processProgramPrioritasLainParagraph(p, data) {
    const runs = p.getElementsByTagName("w:r");
    let matchIdx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t) {
          if (matchIdx === 0) {
            t.textContent = data.asdep_nama || "";
          } else if (matchIdx === 1) {
            t.textContent = data.program_prioritas_lain || "-";
          } else {
            t.textContent = "";
          }
          matchIdx++;
        }
      }
    }
  }

  processGapParagraph(p, data) {
    const runs = p.getElementsByTagName("w:r");
    const replacements = [
      data.asdep_nama || "",
      data.gap_bidang || data.kro_nama || "",
      data.gap_isu || "",
      data.gap_faktor || "",
      data.asdep_nama || "",
      data.gap_intervensi || ""
    ];

    let matchIdx = 0;
    for (let r of runs) {
      const hl = r.getElementsByTagName("w:highlight")[0];
      if (hl && hl.getAttribute("w:val") === "yellow") {
        const t = r.getElementsByTagName("w:t")[0];
        if (t && matchIdx < replacements.length) {
          t.textContent = replacements[matchIdx];
          matchIdx++;
        }
      }
    }
  }

  processPenerimaManfaatParagraphs(paragraphs, currentIndex, data) {
    const lembagaList = Array.isArray(data.penerima_lembaga) ? data.penerima_lembaga : [];
    const masyarakatList = Array.isArray(data.penerima_masyarakat) ? data.penerima_masyarakat : [];

    // Jika ini paragraf untuk lembaga (index 116-118)
    if (currentIndex >= 116 && currentIndex <= 118) {
      const lIdx = currentIndex - 116;
      if (lIdx < lembagaList.length) {
        this.setParagraphFullText(paragraphs[currentIndex], lembagaList[lIdx]);
      } else {
        this.setParagraphFullText(paragraphs[currentIndex], "");
      }
    }
    // Jika untuk masyarakat (index 121)
    else if (currentIndex === 121) {
      if (masyarakatList.length > 0) {
        this.setParagraphFullText(paragraphs[currentIndex], masyarakatList.join("; "));
      }
    }
  }

  cleanRemainingInstructionTexts(doc) {
    const runs = doc.getElementsByTagName("w:r");
    for (let r of runs) {
      const t = r.getElementsByTagName("w:t")[0];
      if (t && t.textContent) {
        const str = t.textContent.trim();
        if (
          str.startsWith("Buat kalimat pendahuluan adapun seperti contoh berikut") ||
          str.startsWith("*akun yang diperkenankan Belanja Bahan") ||
          str.startsWith("Sebutkan kegiatan terkait upaya pencapaian output") ||
          str.startsWith("Sebutkan kegiatan untuk memantau dan mengevaluasi") ||
          str.startsWith("Sebutkan kegiatan untuk penyusunan rekomendasi kebijakan")
        ) {
          t.textContent = "";
        }
      }
    }
  }

  stripAllHighlights(doc) {
    // Hapus seluruh tag <w:highlight>
    const highlights = doc.getElementsByTagName("w:highlight");
    while (highlights.length > 0) {
      const node = highlights[0];
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
  }
}

// Ekspor instance ke window global
window.docxEngine = new DocxEngine();
