/**
 * @file docx.service.js
 * @description Layanan pemrosesan dokumen OpenXML DOCX (DocxService).
 * Bertanggung jawab mengekstrak arsip Word, mengeksekusi aturan pemetaan domain (DOCX_MAPPING_RULES),
 * menghapus tanda sorotan kuning (yellow highlight), dan mengemas kembali dokumen siap unduh.
 * 100% Client-Side via JSZip & DOMParser bawaan peramban.
 * Layer: Services / Document Processing
 */

class DocxService {
  /**
   * @param {string} [defaultTemplatePath] - Path fallback ke template master
   */
  constructor(defaultTemplatePath = "template/template_kak.docx") {
    this.defaultTemplatePath = defaultTemplatePath;
    this.templateArrayBuffer = null;
    this.isTemplateLoaded = false;
  }

  /**
   * Mengubah string Base64 menjadi ArrayBuffer
   * @private
   * @param {string} base64String 
   * @returns {ArrayBuffer}
   */
  _base64ToArrayBuffer(base64String) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Memuat template master DOCX ke dalam memori.
   * Mendukung sumber: File/Blob unggahan, Embedded Base64 (window.DEFAULT_TEMPLATE_BASE64), atau HTTP Fetch.
   * @param {File|Blob|string|null} [source]
   * @returns {Promise<boolean>}
   */
  async loadTemplate(source = null) {
    // 1. Jika sumber adalah File atau Blob dari input pengguna
    if (source instanceof Blob || source instanceof File) {
      this.templateArrayBuffer = await source.arrayBuffer();
      this.isTemplateLoaded = true;
      return true;
    }

    // 2. Jika tersedia embedded Base64 (Prioritas utama: menjamin 100% jalan saat double-click file://)
    if (window.DEFAULT_TEMPLATE_BASE64 && !source) {
      try {
        this.templateArrayBuffer = this._base64ToArrayBuffer(window.DEFAULT_TEMPLATE_BASE64);
        this.isTemplateLoaded = true;
        return true;
      } catch (err) {
        console.warn("[DocxService] Gagal mengurai embedded Base64, mencoba fetch fallback:", err);
      }
    }

    // 3. Fallback: Fetch file lokal dari web server
    const targetPath = (typeof source === "string" ? source : null) || this.defaultTemplatePath;
    try {
      const response = await fetch(targetPath);
      if (!response.ok) {
        throw new Error(`Gagal memuat berkas template (Status: ${response.status})`);
      }
      this.templateArrayBuffer = await response.arrayBuffer();
      this.isTemplateLoaded = true;
      return true;
    } catch (error) {
      console.warn("[DocxService] Fetch template lokal gagal (normal pada protokol file:// jika tanpa Base64):", error);
      return false;
    }
  }

  /**
   * Menghasilkan berkas DOCX baru yang telah diisi data formulir dan bersih dari tanda kuning
   * @param {Object} formData - Objek data formulir dari FormManager
   * @param {ArrayBuffer} [customBuffer] - Buffer template alternatif (opsional)
   * @returns {Promise<Blob>} Blob berkas DOCX resmi siap unduh
   */
  async generateDocx(formData, customBuffer = null) {
    const buffer = customBuffer || this.templateArrayBuffer;
    if (!buffer) {
      // Coba muat ulang template jika belum siap
      const loaded = await this.loadTemplate();
      if (!loaded || !this.templateArrayBuffer) {
        throw new Error("Template master DOCX belum dimuat. Pastikan berkas template tersedia.");
      }
    }

    const activeBuffer = customBuffer || this.templateArrayBuffer;

    if (typeof window.JSZip === "undefined") {
      throw new Error("Pustaka JSZip tidak ditemukan. Pastikan libs/jszip.min.js telah dimuat.");
    }

    // 1. Buka arsip DOCX (ZIP)
    const zip = await window.JSZip.loadAsync(activeBuffer);
    const documentXmlFile = zip.file("word/document.xml");

    if (!documentXmlFile) {
      throw new Error("Struktur DOCX tidak valid: berkas 'word/document.xml' tidak ditemukan.");
    }

    const xmlRawString = await documentXmlFile.async("string");

    // 2. Modifikasi isi XML berdasarkan Aturan Domain (DOCX_MAPPING_RULES)
    const processedXml = this._transformDocumentXml(xmlRawString, formData);

    // 3. Tulis kembali document.xml ke dalam arsip
    zip.file("word/document.xml", processedXml);

    // 4. Kompresi ulang menjadi Blob DOCX final
    const docxBlob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });

    return docxBlob;
  }

  /**
   * Mengurai dan menerapkan seluruh aturan pemetaan pada XML dokumen
   * @private
   * @param {string} xmlString 
   * @param {Object} formData 
   * @returns {string} XML yang sudah dimodifikasi dan serialisasi
   */
  _transformDocumentXml(xmlString, formData) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // Validasi parser error
    const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
    if (parseError) {
      throw new Error("Gagal mengurai XML dokumen: " + parseError.textContent);
    }

    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    const rules = window.DOCX_MAPPING_RULES || [];

    // Iterasi setiap paragraf dokumen dan cocokkan dengan aturan
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pText = (p.textContent || "").trim();

      // Cek apakah ada aturan yang cocok untuk paragraf ini
      for (let rule of rules) {
        try {
          if (rule.match(p, i, pText)) {
            rule.apply(p, formData, i, pText);
            break; // Paragraf telah ditangani oleh aturan ini
          }
        } catch (ruleErr) {
          console.warn(`[DocxService] Gagal menjalankan aturan '${rule.id}' pada paragraf #${i}:`, ruleErr);
        }
      }
    }

    // Pembersihan teks instruksi sisa
    this._cleanRemainingInstructionTexts(xmlDoc);

    // Pembersihan 100% seluruh tag <w:highlight> kuning di dokumen
    this._stripAllHighlights(xmlDoc);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }

  /**
   * Menghapus teks instruksi bawaan yang tidak diperlukan pada dokumen cetak
   * @private
   * @param {Document} doc 
   */
  _cleanRemainingInstructionTexts(doc) {
    const textNodes = doc.getElementsByTagName("w:t");
    const instructionPrefixes = [
      "Buat kalimat pendahuluan adapun seperti contoh berikut",
      "*akun yang diperkenankan Belanja Bahan",
      "Sebutkan kegiatan terkait upaya pencapaian output",
      "Sebutkan kegiatan untuk memantau dan mengevaluasi",
      "Sebutkan kegiatan untuk penyusunan rekomendasi kebijakan"
    ];

    for (let node of textNodes) {
      if (node.textContent) {
        const trimmed = node.textContent.trim();
        for (let prefix of instructionPrefixes) {
          if (trimmed.startsWith(prefix)) {
            node.textContent = "";
            break;
          }
        }
      }
    }
  }

  /**
   * Menghapus semua node <w:highlight> dari seluruh dokumen
   * @private
   * @param {Document} doc 
   */
  _stripAllHighlights(doc) {
    const highlights = doc.getElementsByTagName("w:highlight");
    // Gunakan loop while mundur untuk memastikan seluruh elemen terhapus bersih
    while (highlights.length > 0) {
      const el = highlights[0];
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  /**
   * Helper utilitas untuk memicu pengunduhan file DOCX ke komputer
   * @param {Blob} docxBlob 
   * @param {string} filename 
   */
  downloadDocx(docxBlob, filename = "Dokumen_KAK.docx") {
    if (typeof window.saveAs === "function") {
      window.saveAs(docxBlob, filename);
    } else {
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}

// Pasang ke namespace global window
window.DocxService = DocxService;
