/**
 * @file storage.service.js
 * @description Layanan persistensi data (Storage Service) untuk menyimpan draf ke localStorage
 * dan mengelola ekspor/impor berkas draf JSON portabel.
 * Murni data-driven tanpa ketergantungan pada elemen DOM (Single Responsibility).
 * Layer: Services / Persistence
 */

class StorageService {
  /**
   * @param {string} [storageKey] - Kunci penyimpanan localStorage
   */
  constructor(storageKey = "kak_digitalizer_draft") {
    this.storageKey = storageKey;
  }

  /**
   * Menyimpan objek data draf ke localStorage browser
   * @param {Object} data - Objek data formulir
   * @returns {boolean} Status keberhasilan simpan
   */
  saveDraft(data) {
    try {
      if (!data || typeof data !== "object") {
        throw new Error("Data yang disimpan harus berupa objek valid.");
      }
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      console.error("[StorageService] Gagal menyimpan draf ke localStorage:", error);
      return false;
    }
  }

  /**
   * Membaca data draf dari localStorage browser
   * @returns {Object|null} Objek data yang tersimpan atau null jika tidak ada/korup
   */
  loadDraft() {
    try {
      const rawData = localStorage.getItem(this.storageKey);
      if (!rawData) {
        return null;
      }
      return JSON.parse(rawData);
    } catch (error) {
      console.warn("[StorageService] Draf korup atau tidak dapat dibaca dari localStorage:", error);
      return null;
    }
  }

  /**
   * Mengecek apakah ada draf tersimpan di localStorage
   * @returns {boolean}
   */
  hasDraft() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Menghapus draf dari localStorage browser
   * @returns {boolean}
   */
  clearDraft() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error("[StorageService] Gagal membersihkan draf:", error);
      return false;
    }
  }

  /**
   * Mengekspor data draf menjadi file JSON yang langsung diunduh ke laptop pengguna
   * @param {Object} data - Objek data yang akan diekspor
   * @param {string} [suggestedFilename] - Nama file yang disarankan
   * @returns {boolean}
   */
  exportDraftToFile(data, suggestedFilename = "Draf_KAK.json") {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
      
      if (typeof window.saveAs === "function") {
        window.saveAs(blob, suggestedFilename);
      } else {
        // Fallback jika FileSaver tidak tersedia
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = suggestedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      return true;
    } catch (error) {
      console.error("[StorageService] Gagal mengekspor draf ke file JSON:", error);
      throw error;
    }
  }

  /**
   * Membaca dan mengurai file JSON draf dari input file browser
   * @param {File} file - Berkas File JSON dari input file
   * @returns {Promise<Object>} Promise yang me-resolve data draf hasil parsing
   */
  importDraftFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("Tidak ada file yang dipilih."));
      }

      if (!file.name.endsWith(".json")) {
        return reject(new Error("Format berkas harus berupa .json"));
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          if (typeof parsedData !== "object" || parsedData === null) {
            throw new Error("Struktur berkas JSON tidak valid.");
          }
          resolve(parsedData);
        } catch (err) {
          reject(new Error("Berkas JSON rusak atau tidak dapat dibaca."));
        }
      };

      reader.onerror = () => {
        reject(new Error("Gagal membaca berkas dari sistem."));
      };

      reader.readAsText(file);
    });
  }
}

// Pasang ke namespace global window
window.StorageService = StorageService;
