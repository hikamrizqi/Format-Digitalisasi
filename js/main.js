/**
 * @file main.js
 * @description Titik masuk utama aplikasi (Application Orchestrator / Entrypoint).
 * Menginisialisasi seluruh layanan (Services) dan komponen antarmuka (UI Components),
 * serta menghubungkan aliran data dan event pengguna secara bersih (Clean Architecture).
 * Layer: Orchestrator / Application Root
 */

document.addEventListener("DOMContentLoaded", async () => {
  console.info("[KAK Digitalizer] Memulai inisialisasi aplikasi (Clean Architecture)...");

  // ==========================================================================
  // 1. Inisialisasi Layanan (Services Layer)
  // ==========================================================================
  const toast = new window.ToastComponent("toast-container");
  const storageService = new window.StorageService(window.WIZARD_CONFIG.STORAGE_KEYS.DRAFT);
  const docxService = new window.DocxService("template/template_kak.docx");

  // Memuat template master di memori (Base64 atau fetch)
  try {
    await docxService.loadTemplate();
    console.info("[DocxService] Template master berhasil dimuat dan siap digunakan.");
  } catch (templateError) {
    console.warn("[DocxService] Template master belum langsung siap:", templateError);
  }

  // ==========================================================================
  // 2. Inisialisasi Komponen UI (UI Components Layer)
  // ==========================================================================
  
  // Komponen Repeater Baris Dinamis
  const repeaterDasarHukum = new window.RepeaterComponent({
    containerId: "repeater-dasar-hukum",
    addButtonId: "btn-add-dasar-hukum",
    placeholder: "Ketik regulasi/dasar hukum terkait RO..."
  });

  const repeaterLembaga = new window.RepeaterComponent({
    containerId: "repeater-lembaga",
    addButtonId: "btn-add-lembaga",
    placeholder: "Nama Kementerian/Lembaga terkait..."
  });

  const repeaterMasyarakat = new window.RepeaterComponent({
    containerId: "repeater-masyarakat",
    addButtonId: "btn-add-masyarakat",
    placeholder: "Nama kelompok sasaran masyarakat..."
  });

  // Komponen Pengelola Formulir (Data Binding & Serializer)
  const formManager = new window.FormManager("kak-form", {
    dasarHukum: repeaterDasarHukum,
    lembaga: repeaterLembaga,
    masyarakat: repeaterMasyarakat
  });

  // Komponen Stepper Wizard (Navigasi Langkah & Progres)
  const stepper = new window.StepperComponent(window.WIZARD_CONFIG, (activeStep) => {
    console.info(`[Stepper] Berpindah ke Langkah ${activeStep}`);
    stepper.updateProgress(formManager.form);
  });

  // Hubungkan event repeater ke auto-save form
  const notifyRepeaterChange = () => {
    storageService.saveDraft(formManager.getFormData());
    updateDraftStatusTimestamp();
    stepper.updateProgress(formManager.form);
  };
  repeaterDasarHukum.onChange = notifyRepeaterChange;
  repeaterLembaga.onChange = notifyRepeaterChange;
  repeaterMasyarakat.onChange = notifyRepeaterChange;

  // ==========================================================================
  // 3. Pemulihan Draf Awal (Initial State Loading)
  // ==========================================================================
  const savedDraft = storageService.loadDraft();

  if (savedDraft) {
    formManager.populateForm(savedDraft);
    toast.info("Draf isian terakhir berhasil dipulihkan dari peramban.");
  } else if (window.SAMPLE_KAK_DATA) {
    // Muat data preset resmi 2027 secara default agar formulir langsung terisi & siap dicoba
    formManager.populateForm(window.SAMPLE_KAK_DATA);
    storageService.saveDraft(window.SAMPLE_KAK_DATA);
  }

  // Hitung progres kelengkapan awal
  stepper.updateProgress(formManager.form);

  // ==========================================================================
  // 4. Mekanisme Penyimpanan Draf Otomatis (Auto-Save)
  // ==========================================================================
  const draftStatusEl = document.getElementById("draft-status");

  function updateDraftStatusTimestamp() {
    if (draftStatusEl) {
      const now = new Date();
      draftStatusEl.textContent = `Tersimpan otomatis ${now.toLocaleTimeString("id-ID")}`;
    }
  }

  // Auto-save debounced setiap kali pengguna mengetik di form
  formManager.onFormChange((currentData) => {
    storageService.saveDraft(currentData);
    updateDraftStatusTimestamp();
    stepper.updateProgress(formManager.form);
  }, 500);

  // ==========================================================================
  // 5. Penanganan Aksi Toolbar Header & Footer
  // ==========================================================================

  // Tombol Simpan Draf Manual
  const btnSaveDraft = document.getElementById("btn-save-draft");
  if (btnSaveDraft) {
    btnSaveDraft.addEventListener("click", () => {
      const currentData = formManager.getFormData();
      const success = storageService.saveDraft(currentData);
      if (success) {
        toast.success("Draf berhasil disimpan ke memori browser!");
        updateDraftStatusTimestamp();
      } else {
        toast.error("Gagal menyimpan draf.");
      }
    });
  }

  // Tombol Muat Contoh Data KAK 2027
  const btnLoadDemo = document.getElementById("btn-load-demo");
  if (btnLoadDemo) {
    btnLoadDemo.addEventListener("click", () => {
      if (window.SAMPLE_KAK_DATA) {
        formManager.populateForm(window.SAMPLE_KAK_DATA);
        storageService.saveDraft(window.SAMPLE_KAK_DATA);
        stepper.updateProgress(formManager.form);
        updateDraftStatusTimestamp();
        toast.success("✨ Contoh data resmi KAK 2027 Kemenko PMK berhasil dimuat!");
      }
    });
  }

  // Tombol Ekspor Draf JSON
  const btnExportDraft = document.getElementById("btn-export-draft");
  if (btnExportDraft) {
    btnExportDraft.addEventListener("click", () => {
      try {
        const currentData = formManager.getFormData();
        const asdepClean = (currentData.asdep_nama || "Kemenko_PMK").replace(/[^a-zA-Z0-9_-]/g, "_");
        const filename = `Draf_KAK_${asdepClean}_${currentData.tahun_anggaran || "2027"}.json`;
        storageService.exportDraftToFile(currentData, filename);
        toast.success("💾 Berkas draf JSON berhasil diunduh.");
      } catch (err) {
        toast.error("Gagal mengekspor draf JSON: " + err.message);
      }
    });
  }

  // Tombol Impor Draf JSON
  const btnImportTrigger = document.getElementById("btn-import-trigger");
  const inputImportFile = document.getElementById("input-import-file");

  if (btnImportTrigger && inputImportFile) {
    btnImportTrigger.addEventListener("click", () => {
      inputImportFile.click();
    });

    inputImportFile.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const importedData = await storageService.importDraftFromFile(file);
        formManager.populateForm(importedData);
        storageService.saveDraft(importedData);
        stepper.updateProgress(formManager.form);
        updateDraftStatusTimestamp();
        toast.success("📂 Draf dari berkas JSON berhasil dimuat ke formulir!");
      } catch (importErr) {
        toast.error("❌ " + importErr.message);
      } finally {
        inputImportFile.value = "";
      }
    });
  }

  // Tombol Reset Formulir
  const btnResetForm = document.getElementById("btn-reset-form");
  if (btnResetForm) {
    btnResetForm.addEventListener("click", () => {
      const confirmed = confirm("Apakah Anda yakin ingin mengosongkan seluruh formulir? Seluruh draf akan dibersihkan.");
      if (confirmed) {
        storageService.clearDraft();
        formManager.resetForm();
        stepper.updateProgress(formManager.form);
        stepper.goToStep(1);
        toast.info("Seluruh isian formulir telah di-reset.");
      }
    });
  }

  // ==========================================================================
  // 6. Penanganan Generate & Unduh Dokumen Word (.docx)
  // ==========================================================================
  async function handleDownloadDocx() {
    const currentData = formManager.getFormData();

    // Validasi esensial: Asdep dan Judul RO wajib terisi
    if (!currentData.asdep_nama || !currentData.ro_judul) {
      toast.warning("Mohon lengkapi minimal Nama Asisten Deputi dan Judul RO pada Langkah 1.");
      stepper.goToStep(1);
      return;
    }

    toast.info("Sedang memproses dokumen Word & membersihkan tanda kuning...");

    try {
      // Pastikan template siap
      if (!docxService.isTemplateLoaded) {
        await docxService.loadTemplate();
      }

      // Generate berkas DOCX bersih tanda kuning
      const docxBlob = await docxService.generateDocx(currentData);

      // Susun nama berkas unduhan resmi
      const asdepClean = (currentData.asdep_nama || "Kemenko_PMK").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `KAK_${asdepClean}_${currentData.tahun_anggaran || "2027"}.docx`;

      // Trigger download
      docxService.downloadDocx(docxBlob, filename);

      toast.success(`🎉 Berhasil! Dokumen "${filename}" telah diunduh bersih tanpa tanda kuning!`);
    } catch (generateError) {
      console.error("[DocxService] Gagal menghasilkan dokumen:", generateError);
      toast.error("Gagal menghasilkan dokumen: " + generateError.message);
    }
  }

  // Pasang event listener unduh pada tombol Langkah 7 dan tombol cepat footer
  const btnFinalDownload = document.getElementById("btn-final-download");
  const btnQuickDownload = document.getElementById("btn-quick-download");

  if (btnFinalDownload) {
    btnFinalDownload.addEventListener("click", handleDownloadDocx);
  }
  if (btnQuickDownload) {
    btnQuickDownload.addEventListener("click", handleDownloadDocx);
  }

  // Jika tombol 'Lanjut' di-klik pada langkah terakhir, picu pengunduhan
  const btnNext = document.getElementById("btn-next");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (stepper.isLastStep()) {
        handleDownloadDocx();
      }
    });
  }

  console.info("[KAK Digitalizer] Inisialisasi selesai dan siap digunakan!");
});
