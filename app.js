/**
 * KAK Digitalizer - Application Controller (Vanilla JS)
 * Mengatur navigasi stepper wizard, form state, auto-save, draf, & ekspor DOCX
 */

document.addEventListener("DOMContentLoaded", async () => {
  // State aplikasi
  let currentStep = 1;
  const totalSteps = 7;
  const stepTitles = [
    "Cover & Identitas KAK",
    "Dasar Hukum & SOTK Kemenko PMK",
    "RPJMN 2025–2029 & Rekomendasi Kebijakan",
    "Reformasi Birokrasi & Pengarusutamaan Gender (GAP)",
    "Penerima Manfaat & Tahapan Pelaksanaan",
    "Matriks Jadwal Bulanan & Anggaran (RAB)",
    "Lembar Pengesahan & Unduh Dokumen"
  ];

  // Inisialisasi template DOCX bawaan
  try {
    await docxEngine.loadTemplate();
  } catch (err) {
    console.log("Menunggu template siap:", err);
  }

  // Inisialisasi Repeater Dasar Hukum default jika kosong
  renderRepeater("repeater-dasar-hukum", [
    "Undang-Undang Nomor 24 Tahun 2007 tentang Penanggulangan Bencana",
    "Peraturan Pemerintah Nomor 21 Tahun 2008 tentang Penyelenggaraan Penanggulangan Bencana",
    "Peraturan Presiden Nomor 144 Tahun 2024 tentang Kementerian Koordinator Bidang Pembangunan Manusia dan Kebudayaan",
    "Peraturan Menteri Koordinator Bidang Pembangunan Manusia dan Kebudayaan Nomor 3 Tahun 2025 tentang Rencana Strategis Kemenko PMK 2025-2029"
  ]);

  // Inisialisasi Lembaga Eksternal & Masyarakat
  renderRepeater("repeater-lembaga", [
    "Kementerian Kesehatan (Kemenkes)",
    "Badan Nasional Penanggulangan Bencana (BNPB)",
    "Kementerian Sosial (Kemensos)",
    "Pemerintah Daerah Provinsi & Kabupaten/Kota Rawan Bencana"
  ]);

  renderRepeater("repeater-masyarakat", [
    "Masyarakat di kawasan rawan bencana tinggi",
    "Kelompok rentan (Ibu hamil, anak-anak, lansia, dan penyandang disabilitas)",
    "Relawan penanggulangan bencana dan kader siaga bencana desa"
  ]);

  // Cek apakah ada draf tersimpan di localStorage
  const savedDraft = localStorage.getItem("kak_digitalizer_draft");
  if (savedDraft) {
    try {
      const parsed = JSON.parse(savedDraft);
      populateForm(parsed);
      showToast("Draf isian terakhir berhasil dipulihkan dari browser.", "info");
    } catch (e) {
      console.warn("Gagal memulihkan draf:", e);
    }
  } else {
    // Jika belum ada draf, muat data demo secara default agar form langsung menarik & siap uji coba
    if (typeof SAMPLE_KAK_DATA !== "undefined") {
      populateForm(SAMPLE_KAK_DATA);
    }
  }

  updateProgress();

  // ==========================================================================
  // Navigasi Stepper Wizard
  // ==========================================================================
  const stepperTabs = document.querySelectorAll(".step-tab");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const stepTitleDisplay = document.getElementById("step-title-display");

  function goToStep(step) {
    if (step < 1 || step > totalSteps) return;

    // Sembunyikan semua step-content
    for (let i = 1; i <= totalSteps; i++) {
      const content = document.getElementById(`step-${i}`);
      if (content) content.classList.remove("active");
    }

    // Tampilkan step tujuan
    const targetContent = document.getElementById(`step-${step}`);
    if (targetContent) targetContent.classList.add("active");

    // Perbarui tab stepper
    stepperTabs.forEach(tab => {
      const tabStep = parseInt(tab.dataset.step, 10);
      tab.classList.remove("active");
      if (tabStep === step) {
        tab.classList.add("active");
      } else if (tabStep < step) {
        tab.classList.add("completed");
      }
    });

    currentStep = step;

    // Perbarui teks header langkah
    stepTitleDisplay.textContent = `Langkah ${currentStep} dari ${totalSteps}: ${stepTitles[currentStep - 1]}`;

    // Perbarui tombol navigasi
    btnPrev.style.display = currentStep > 1 ? "inline-flex" : "none";
    if (currentStep === totalSteps) {
      btnNext.innerHTML = "📥 Unduh Dokumen Final";
      btnNext.classList.add("btn-download");
      btnNext.classList.remove("btn-primary");
    } else {
      btnNext.innerHTML = "Lanjut ➡️";
      btnNext.classList.add("btn-primary");
      btnNext.classList.remove("btn-download");
    }

    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  stepperTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const step = parseInt(tab.dataset.step, 10);
      goToStep(step);
    });
  });

  btnPrev.addEventListener("click", () => {
    goToStep(currentStep - 1);
  });

  btnNext.addEventListener("click", () => {
    if (currentStep === totalSteps) {
      handleGenerateAndDownload();
    } else {
      goToStep(currentStep + 1);
    }
  });

  // Tombol Unduh Final di Step 7 & Tombol Unduh Cepat di Bottom Bar
  document.getElementById("btn-final-download").addEventListener("click", handleGenerateAndDownload);
  document.getElementById("btn-quick-download").addEventListener("click", handleGenerateAndDownload);

  // ==========================================================================
  // Dynamic Repeater (Dasar Hukum, Lembaga, Masyarakat)
  // ==========================================================================
  function renderRepeater(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    items.forEach((itemText) => {
      addRepeaterItem(container, itemText);
    });
  }

  function addRepeaterItem(container, value = "") {
    const itemDiv = document.createElement("div");
    itemDiv.className = "repeater-item";

    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    input.placeholder = "Ketik butir data...";
    input.addEventListener("input", triggerAutoSave);

    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.className = "btn-remove-row";
    btnRemove.textContent = "✕";
    btnRemove.title = "Hapus baris ini";
    btnRemove.addEventListener("click", () => {
      itemDiv.remove();
      triggerAutoSave();
    });

    itemDiv.appendChild(input);
    itemDiv.appendChild(btnRemove);
    container.appendChild(itemDiv);
  }

  document.getElementById("btn-add-dasar-hukum").addEventListener("click", () => {
    addRepeaterItem(document.getElementById("repeater-dasar-hukum"));
    triggerAutoSave();
  });

  document.getElementById("btn-add-lembaga").addEventListener("click", () => {
    addRepeaterItem(document.getElementById("repeater-lembaga"));
    triggerAutoSave();
  });

  document.getElementById("btn-add-masyarakat").addEventListener("click", () => {
    addRepeaterItem(document.getElementById("repeater-masyarakat"));
    triggerAutoSave();
  });

  // ==========================================================================
  // Form Data Aggregator & Auto-Save
  // ==========================================================================
  function getFormData() {
    const form = document.getElementById("kak-form");
    const data = {};

    // Input biasa & textarea
    const elements = form.querySelectorAll("input:not([type='checkbox']), textarea, select");
    elements.forEach(el => {
      if (el.name) {
        data[el.name] = el.value;
      }
    });

    // Repeater: Dasar Hukum
    data.dasar_hukum = [];
    document.querySelectorAll("#repeater-dasar-hukum input").forEach(inp => {
      if (inp.value.trim()) data.dasar_hukum.push(inp.value.trim());
    });

    // Repeater: Lembaga
    data.penerima_lembaga = [];
    document.querySelectorAll("#repeater-lembaga input").forEach(inp => {
      if (inp.value.trim()) data.penerima_lembaga.push(inp.value.trim());
    });

    // Repeater: Masyarakat
    data.penerima_masyarakat = [];
    document.querySelectorAll("#repeater-masyarakat input").forEach(inp => {
      if (inp.value.trim()) data.penerima_masyarakat.push(inp.value.trim());
    });

    // Matriks Jadwal Bulanan (Checkbox)
    data.jadwal_bulan = { tahap1: [], tahap2: [], tahap3: [], tahap4: [] };
    for (let t = 1; t <= 4; t++) {
      for (let m = 1; m <= 12; m++) {
        const chk = form.querySelector(`input[name="jadwal_tahap${t}_${m}"]`);
        if (chk && chk.checked) {
          data.jadwal_bulan[`tahap${t}`].push(m);
        }
      }
    }

    return data;
  }

  function populateForm(data) {
    if (!data) return;

    const form = document.getElementById("kak-form");

    // Isi input & textarea
    Object.keys(data).forEach(key => {
      const el = form.querySelector(`[name="${key}"]`);
      if (el && typeof data[key] === "string") {
        el.value = data[key];
      }
    });

    // Isi repeaters jika ada
    if (Array.isArray(data.dasar_hukum)) {
      renderRepeater("repeater-dasar-hukum", data.dasar_hukum);
    }
    if (Array.isArray(data.penerima_lembaga)) {
      renderRepeater("repeater-lembaga", data.penerima_lembaga);
    }
    if (Array.isArray(data.penerima_masyarakat)) {
      renderRepeater("repeater-masyarakat", data.penerima_masyarakat);
    }

    // Isi matriks checkbox jadwal
    if (data.jadwal_bulan) {
      for (let t = 1; t <= 4; t++) {
        const arr = data.jadwal_bulan[`tahap${t}`] || [];
        for (let m = 1; m <= 12; m++) {
          const chk = form.querySelector(`input[name="jadwal_tahap${t}_${m}"]`);
          if (chk) {
            chk.checked = arr.includes(m);
          }
        }
      }
    }

    updateProgress();
  }

  // Auto-Save Debounced
  let saveTimeout = null;
  function triggerAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const data = getFormData();
      localStorage.setItem("kak_digitalizer_draft", JSON.stringify(data));
      const statusEl = document.getElementById("draft-status");
      if (statusEl) {
        const now = new Date();
        statusEl.textContent = `Tersimpan otomatis ${now.toLocaleTimeString("id-ID")}`;
      }
      updateProgress();
    }, 600);
  }

  document.getElementById("kak-form").addEventListener("input", triggerAutoSave);

  document.getElementById("btn-save-draft").addEventListener("click", () => {
    const data = getFormData();
    localStorage.setItem("kak_digitalizer_draft", JSON.stringify(data));
    showToast("✅ Draf berhasil disimpan ke memori browser!", "success");
  });

  // Tombol Muat Contoh Data KAK 2027
  document.getElementById("btn-load-demo").addEventListener("click", () => {
    if (typeof SAMPLE_KAK_DATA !== "undefined") {
      populateForm(SAMPLE_KAK_DATA);
      localStorage.setItem("kak_digitalizer_draft", JSON.stringify(SAMPLE_KAK_DATA));
      showToast("✨ Contoh data resmi KAK 2027 Kemenko PMK berhasil dimuat!", "success");
    }
  });

  // Tombol Ekspor Draf JSON
  document.getElementById("btn-export-draft").addEventListener("click", () => {
    const data = getFormData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const asdepName = (data.asdep_nama || "Kemenko_PMK").replace(/\s+/g, "_");
    saveAs(blob, `Draf_KAK_${asdepName}_${data.tahun_anggaran || "2027"}.json`);
    showToast("💾 Berkas draf JSON berhasil diunduh.", "success");
  });

  // Tombol Impor Draf JSON
  const importTrigger = document.getElementById("btn-import-trigger");
  const fileInput = document.getElementById("input-import-file");

  importTrigger.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        populateForm(importedData);
        localStorage.setItem("kak_digitalizer_draft", JSON.stringify(importedData));
        showToast("📂 Draf dari file JSON berhasil dimuat ke formulir!", "success");
      } catch (err) {
        showToast("❌ Gagal membaca file JSON draf.", "error");
      }
    };
    reader.readAsText(file);
    fileInput.value = "";
  });

  // Reset Form
  document.getElementById("btn-reset-form").addEventListener("click", () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan seluruh formulir? Data draf yang tersimpan akan dibersihkan.")) {
      localStorage.removeItem("kak_digitalizer_draft");
      document.getElementById("kak-form").reset();
      renderRepeater("repeater-dasar-hukum", [""]);
      renderRepeater("repeater-lembaga", [""]);
      renderRepeater("repeater-masyarakat", [""]);
      updateProgress();
      goToStep(1);
      showToast("Semua isian formulir telah di-reset.", "info");
    }
  });

  // Progress Bar calculation
  function updateProgress() {
    const requiredInputs = document.querySelectorAll("#kak-form [required]");
    let filled = 0;
    requiredInputs.forEach(inp => {
      if (inp.value && inp.value.trim().length > 0) filled++;
    });

    const percent = Math.min(100, Math.round((filled / Math.max(1, requiredInputs.length)) * 100));
    const fillEl = document.getElementById("progress-bar-fill");
    const percentEl = document.getElementById("progress-percentage");

    if (fillEl) fillEl.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `Kelengkapan: ${percent}% (${filled}/${requiredInputs.length} field wajib)`;
  }

  // ==========================================================================
  // Generate & Unduh Dokumen DOCX
  // ==========================================================================
  async function handleGenerateAndDownload() {
    const formData = getFormData();

    // Validasi dasar
    if (!formData.asdep_nama || !formData.ro_judul) {
      showToast("⚠️ Mohon lengkapi minimal Nama Asisten Deputi dan Judul RO pada Langkah 1.", "warning");
      goToStep(1);
      return;
    }

    showToast("⏳ Sedang memproses dokumen Word & membersihkan tanda kuning...", "info");

    try {
      // Pastikan template siap
      if (!docxEngine.templateArrayBuffer) {
        await docxEngine.loadTemplate();
      }

      const generatedBlob = await docxEngine.generateDocx(formData);

      const asdepClean = (formData.asdep_nama || "Kemenko_PMK").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `KAK_${asdepClean}_${formData.tahun_anggaran || "2027"}.docx`;

      // Unduh dokumen melalui FileSaver
      saveAs(generatedBlob, filename);

      showToast(`🎉 Berhasil! Dokumen "${filename}" telah diunduh bersih tanpa tanda kuning!`, "success");
    } catch (err) {
      console.error("Gagal generate dokumen:", err);
      showToast(`❌ Gagal menghasilkan dokumen: ${err.message}`, "error");
    }
  }

  // ==========================================================================
  // Toast Helper
  // ==========================================================================
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
