/**
 * @file stepper.component.js
 * @description Komponen pengatur alur tahapan (Stepper / Wizard Component).
 * Bertanggung jawab atas navigasi antar-langkah, status tab (aktif/selesai),
 * tombol navigasi Kembali/Lanjut, serta kalkulasi persentase kelengkapan data.
 * Layer: UI / Presentation Component
 */

class StepperComponent {
  /**
   * @param {Object} config - Konfigurasi wizard (misal: window.WIZARD_CONFIG)
   * @param {Function} [onStepChange] - Callback saat langkah berganti
   */
  constructor(config = window.WIZARD_CONFIG, onStepChange = null) {
    this.config = config || { TOTAL_STEPS: 7, STEPS: [] };
    this.currentStep = 1;
    this.totalSteps = this.config.TOTAL_STEPS || 7;
    this.onStepChange = onStepChange;

    // Cache elemen-elemen DOM
    this.tabs = document.querySelectorAll(".step-tab");
    this.btnPrev = document.getElementById("btn-prev");
    this.btnNext = document.getElementById("btn-next");
    this.titleDisplay = document.getElementById("step-title-display");
    this.progressFill = document.getElementById("progress-bar-fill");
    this.progressText = document.getElementById("progress-percentage");

    this._initEvents();
    this.renderCurrentStep();
  }

  /**
   * Mengikat event listener pada tab stepper dan tombol navigasi
   * @private
   */
  _initEvents() {
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetStep = parseInt(tab.dataset.step, 10);
        if (!isNaN(targetStep)) {
          this.goToStep(targetStep);
        }
      });
    });

    if (this.btnPrev) {
      this.btnPrev.addEventListener("click", () => this.prev());
    }

    if (this.btnNext) {
      this.btnNext.addEventListener("click", () => this.next());
    }
  }

  /**
   * Berpindah ke langkah tertentu
   * @param {number} stepNumber 
   */
  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > this.totalSteps) return;

    this.currentStep = stepNumber;
    this.renderCurrentStep();

    if (typeof this.onStepChange === "function") {
      this.onStepChange(this.currentStep);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Lanjut ke langkah berikutnya
   */
  next() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    }
  }

  /**
   * Kembali ke langkah sebelumnya
   */
  prev() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }

  /**
   * Mendapatkan nomor langkah saat ini (1-indexed)
   * @returns {number}
   */
  getCurrentStep() {
    return this.currentStep;
  }

  /**
   * Mengecek apakah berada di langkah terakhir
   * @returns {boolean}
   */
  isLastStep() {
    return this.currentStep === this.totalSteps;
  }

  /**
   * Memperbarui visualisasi status langkah pada DOM
   */
  renderCurrentStep() {
    // 1. Tampilkan konten langkah aktif, sembunyikan yang lain
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepContent = document.getElementById(`step-${i}`);
      if (stepContent) {
        if (i === this.currentStep) {
          stepContent.classList.add("active");
        } else {
          stepContent.classList.remove("active");
        }
      }
    }

    // 2. Perbarui status tab
    this.tabs.forEach((tab) => {
      const tabStep = parseInt(tab.dataset.step, 10);
      tab.classList.remove("active");
      if (tabStep === this.currentStep) {
        tab.classList.add("active");
      } else if (tabStep < this.currentStep) {
        tab.classList.add("completed");
      } else {
        tab.classList.remove("completed");
      }
    });

    // 3. Perbarui teks judul header langkah
    if (this.titleDisplay && this.config.STEPS) {
      const stepMeta = this.config.STEPS[this.currentStep - 1];
      const title = stepMeta ? stepMeta.title : `Langkah ${this.currentStep}`;
      this.titleDisplay.textContent = `Langkah ${this.currentStep} dari ${this.totalSteps}: ${title}`;
    }

    // 4. Perbarui tombol navigasi bawah
    if (this.btnPrev) {
      this.btnPrev.style.display = this.currentStep > 1 ? "inline-flex" : "none";
    }

    if (this.btnNext) {
      if (this.isLastStep()) {
        this.btnNext.innerHTML = "📥 Unduh Dokumen Final";
        this.btnNext.classList.add("btn-download");
        this.btnNext.classList.remove("btn-primary");
      } else {
        this.btnNext.innerHTML = "Lanjut ➡️";
        this.btnNext.classList.add("btn-primary");
        this.btnNext.classList.remove("btn-download");
      }
    }
  }

  /**
   * Menghitung dan memperbarui bar progres kelengkapan formulir
   * @param {HTMLFormElement} formElement 
   */
  updateProgress(formElement) {
    if (!formElement) return;

    const requiredInputs = formElement.querySelectorAll("[required]");
    let filledCount = 0;

    requiredInputs.forEach((inp) => {
      if (inp.value && inp.value.trim().length > 0) {
        filledCount++;
      }
    });

    const totalRequired = Math.max(1, requiredInputs.length);
    const percentage = Math.min(100, Math.round((filledCount / totalRequired) * 100));

    if (this.progressFill) {
      this.progressFill.style.width = `${percentage}%`;
    }

    if (this.progressText) {
      this.progressText.textContent = `Kelengkapan: ${percentage}% (${filledCount}/${totalRequired} field wajib)`;
    }
  }
}

// Pasang ke namespace global window
window.StepperComponent = StepperComponent;
