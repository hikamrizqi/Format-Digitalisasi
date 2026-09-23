/**
 * @file form.manager.js
 * @description Pengelola data formulir (Form Manager).
 * Bertanggung jawab mengekstrak nilai form (Serializer), mengisi nilai form (Deserializer),
 * dan mengelola integrasi dengan repeater serta matriks jadwal bulanan.
 * Layer: UI / Presentation Component
 */

class FormManager {
  /**
   * @param {string} formId - ID elemen formulir HTML
   * @param {Object.<string, RepeaterComponent>} repeaters - Peta komponen repeater terdaftar
   */
  constructor(formId = "kak-form", repeaters = {}) {
    this.form = document.getElementById(formId);
    this.repeaters = repeaters;
    this.debounceTimer = null;

    if (!this.form) {
      console.warn(`[FormManager] Formulir #${formId} tidak ditemukan.`);
    }
  }

  /**
   * Mengekstrak seluruh data formulir menjadi objek JSON terstruktur
   * @returns {Object} Objek data lengkap
   */
  getFormData() {
    if (!this.form) return {};
    const data = {};

    // 1. Ekstrak input teks, angka, select, dan textarea
    const elements = this.form.querySelectorAll("input:not([type='checkbox']), textarea, select");
    elements.forEach((el) => {
      if (el.name) {
        data[el.name] = el.value;
      }
    });

    // 2. Ekstrak data dari repeater terdaftar
    if (this.repeaters.dasarHukum) {
      data.dasar_hukum = this.repeaters.dasarHukum.getItems();
    }
    if (this.repeaters.lembaga) {
      data.penerima_lembaga = this.repeaters.lembaga.getItems();
    }
    if (this.repeaters.masyarakat) {
      data.penerima_masyarakat = this.repeaters.masyarakat.getItems();
    }

    // 3. Ekstrak data matriks jadwal bulanan (Checkbox 4 Tahap x 12 Bulan)
    data.jadwal_bulan = { tahap1: [], tahap2: [], tahap3: [], tahap4: [] };
    for (let t = 1; t <= 4; t++) {
      for (let m = 1; m <= 12; m++) {
        const checkbox = this.form.querySelector(`input[name="jadwal_tahap${t}_${m}"]`);
        if (checkbox && checkbox.checked) {
          data.jadwal_bulan[`tahap${t}`].push(m);
        }
      }
    }

    return data;
  }

  /**
   * Mengisi seluruh elemen formulir dari objek data (Data Binding)
   * @param {Object} data - Objek data formulir
   */
  populateForm(data) {
    if (!this.form || !data) return;

    // 1. Isi input teks, angka, dan textarea
    Object.keys(data).forEach((key) => {
      const el = this.form.querySelector(`[name="${key}"]`);
      if (el && typeof data[key] === "string") {
        el.value = data[key];
      }
    });

    // 2. Isi repeater
    if (this.repeaters.dasarHukum && Array.isArray(data.dasar_hukum)) {
      this.repeaters.dasarHukum.render(data.dasar_hukum);
    }
    if (this.repeaters.lembaga && Array.isArray(data.penerima_lembaga)) {
      this.repeaters.lembaga.render(data.penerima_lembaga);
    }
    if (this.repeaters.masyarakat && Array.isArray(data.penerima_masyarakat)) {
      this.repeaters.masyarakat.render(data.penerima_masyarakat);
    }

    // 3. Isi matriks checkbox jadwal
    if (data.jadwal_bulan) {
      for (let t = 1; t <= 4; t++) {
        const selectedMonths = data.jadwal_bulan[`tahap${t}`] || [];
        for (let m = 1; m <= 12; m++) {
          const checkbox = this.form.querySelector(`input[name="jadwal_tahap${t}_${m}"]`);
          if (checkbox) {
            checkbox.checked = selectedMonths.includes(m);
          }
        }
      }
    }
  }

  /**
   * Mengosongkan seluruh isian formulir
   */
  resetForm() {
    if (!this.form) return;
    this.form.reset();

    // Reset repeater ke 1 baris kosong
    Object.values(this.repeaters).forEach((repeater) => {
      if (repeater && typeof repeater.clear === "function") {
        repeater.clear();
      }
    });
  }

  /**
   * Mengikat event listener input dengan mekanisme debouncing untuk auto-save
   * @param {Function} callback - Fungsi callback yang dipanggil saat ada perubahan input
   * @param {number} [delay=500] - Jeda waktu debounce dalam milidetik
   */
  onFormChange(callback, delay = 500) {
    if (!this.form || typeof callback !== "function") return;

    const handler = () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        callback(this.getFormData());
      }, delay);
    };

    this.form.addEventListener("input", handler);
    this.form.addEventListener("change", handler);
  }

  /**
   * Memvalidasi apakah field-field wajib pada langkah tertentu telah terisi
   * @param {number} stepNumber - Nomor langkah (1-7)
   * @returns {{isValid: boolean, missingFields: Array<string>}}
   */
  validateStep(stepNumber) {
    const config = window.WIZARD_CONFIG;
    if (!config || !config.STEPS) {
      return { isValid: true, missingFields: [] };
    }

    const stepMeta = config.STEPS[stepNumber - 1];
    if (!stepMeta || !stepMeta.requiredFields) {
      return { isValid: true, missingFields: [] };
    }

    const missingFields = [];
    stepMeta.requiredFields.forEach((fieldName) => {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field || !field.value || field.value.trim().length === 0) {
        missingFields.push(fieldName);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}

// Pasang ke namespace global window
window.FormManager = FormManager;
