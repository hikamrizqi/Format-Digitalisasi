# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Aplikasi Web Generator & Digitalisasi Dokumen KAK (Kerangka Acuan Kerja)
**Kementerian Koordinator Bidang Pembangunan Manusia dan Kebudayaan (Kemenko PMK)**

---

## 1. INFORMASI DOKUMEN & RINGKASAN EKSEKUTIF

| Atribut | Keterangan |
| :--- | :--- |
| **Nama Produk** | **KAK Digitalizer** (*Sistem Digitalisasi & Generator Dokumen Kerangka Acuan Kerja*) |
| **Versi Dokumen** | Versi 1.0 |
| **Tanggal Penyusunan** | 22 September 2026 |
| **File Acuan Template** | `Copy of Format Digitalisasi KAK.docx` |
| **Status Dokumen** | Disetujui untuk Implementasi (*Ready for Development*) |

### 1.1 Ringkasan Eksekutif
Dokumen KAK (*Kerangka Acuan Kerja / Term of Reference*) merupakan instrumen perencanaan anggaran dan kegiatan tahunan yang vital di lingkungan Kemenko PMK. Saat ini, penyusunan KAK masih dilakukan secara manual dengan mengisi dokumen Word mentah yang memuat ratusan placeholder kosong (ditandai dengan titik-titik `……` dan blok warna **kuning / yellow highlight**). 

Proses manual ini memiliki kelemahan:
1. Sering terlewatnya placeholder bertanda kuning.
2. Rusaknya tata letak (*layout/styling*) akibat perbedaan gaya pengetikan staf.
3. Lambatnya proses kompilasi narasi dari dasar hukum, sasaran RPJMN, hingga matriks anggaran.

**Solusi:** Membangun aplikasi web modern berbasis *form-wizard* cerdas yang membaca struktur template `Copy of Format Digitalisasi KAK.docx`, menyediakan formulir input data terpandu (*guided form*), dan secara otomatis mengompilasi serta menghasilkan (*export*) file DOCX resmi yang rapi, di mana seluruh tanda kuning/placeholder telah digantikan dengan nilai input pengguna dan sorotan (*highlight*) kuning dihapus secara bersih.

---

## 2. LATAR BELAKANG & ANALISIS MASALAH

### 2.1 Kondisi Saat Ini (Current State)
* Template KAK Kemenko PMK memiliki struktur kompleks (terdiri dari 320+ paragraf dan tabel, serta lebih dari 100 blok placeholder bertanda sorot kuning / `<w:highlight w:val="yellow"/>`).
* Placeholder mencakup:
  * Teks titik-titik `……`
  * Angka urutan `(1)`, `(2)`, `(3)`, dst.
  * Teks instruksi panduan (contoh: *"Cantumkan Undang-undang, PP, Perpres...", "Data terbaru terkait program..."*).
  * Variabel dinamis pada tabel tahapan kegiatan, matriks pelaksanaan bulanan (Jan–Des), dan Rincian Anggaran Biaya (RAB).
* Pengisian manual rentan menimbulkan inkonsistensi nama Deputi/Asdep, nomor urut peraturan, serta keterlambatan revisi.

### 2.2 Kondisi yang Diharapkan (Future State)
* Pengguna cukup membuka aplikasi web, mengisi formulir terstruktur langkah demi langkah (*step-by-step wizard*).
* Sistem menyediakan validasi otomatis sehingga tidak ada *field* wajib yang kosong.
* Tombol **"Generate & Unduh DOCX"** menghasilkan berkas Microsoft Word dengan format, margin, jenis huruf (*Times New Roman / Calibri / Arial*), ukuran font, spasi, penomoran hierarki, dan tabel yang **100% presisi identik** dengan dokumen master, tanpa sisa *highlight* kuning.

---

## 3. TUJUAN PRODUK & METRIK KEBERHASILAN (KPI)

### 3.1 Tujuan Utama
1. Menghilangkan kesalahan manusia (*human error*) berupa placeholder yang tertinggal atau lupa diisi.
2. Mempercepat waktu penyusunan dokumen KAK dari hitungan hari/jam menjadi beberapa menit.
3. Menjamin standardisasi format dokumen di seluruh Asisten Deputi dan Deputi Kemenko PMK.

### 3.2 Metrik Keberhasilan (KPI)
* **0% Sisa Placeholder Kuning:** Tidak ada satupun *run* teks bertanda sorot kuning pada file DOCX yang diunduh.
* **100% Format Integrity:** Tidak ada tabel yang terpotong, margin yang bergeser, atau perubahan *style* dokumen asli.
* **Waktu Pengisian Lebih Singkat:** Mengurangi waktu input dan editing KAK hingga > 60%.
* **Zero Data Loss:** Pengguna dapat menyimpan draf sementara (*Save Draft*) dan melanjutkan pengerjaan kapan saja tanpa kehilangan data.

---

## 4. TARGET PENGGUNA & PERSONA

| Persona | Peran | Kebutuhan Utama |
| :--- | :--- | :--- |
| **Staf Perencana / Konseptor KAK (Asdep)** | Pengisi data teknis kegiatan, narasi RPJMN, indikator kinerja, tahapan rapat, dan RAB. | Formulir yang intuitif, panduan penulisan per *field*, fitur simpan draf, dan ekspor langsung ke format `.docx`. |
| **Penyelia / Pejabat Pembuat Komitmen (PPK)** | Menelaah kesesuaian output dengan Renstra dan pagu anggaran. | Pratinjau (*preview*) ringkasan data sebelum dokumen final diunduh dan dicetak. |
| **Administrator Sistem** | Memperbarui template DOCX master jika terdapat perubahan regulasi atau format resmi kementerian. | Kemudahan mengunggah template master baru tanpa perlu mengubah kode sumber aplikasi (*template upload capability*). |

---

## 5. ALUR PENGGUNA (USER JOURNEY)

```mermaid
flowchart TD
    A[Mulai: Buka Web App] --> B[Pilih Template Master DOCX]
    B --> C[Langkah 1: Identitas KAK & Satker]
    C --> D[Langkah 2: Dasar Hukum & Tugas Fungsi]
    D --> E[Langkah 3: Narasi RPJMN, Isu Strategis & Kebijakan]
    E --> F[Langkah 4: Reformasi Birokrasi RB & Gender GAP]
    F --> G[Langkah 5: Penerima Manfaat & Tahapan Pelaksanaan]
    G --> H[Langkah 6: Matriks Waktu Jan-Des & Anggaran]
    H --> I[Langkah 7: Lembar Pengesahan / Tanda Tangan]
    I --> J{Validasi Kelengkapan Field}
    J -- Masih Ada Field Wajib Kosong --> K[Tampilkan Peringatan & Sorot Field Kosong]
    K --> I
    J -- Valid & Lengkap --> L[Pratinjau Data Ringkasan]
    L --> M[Klik: Generate Dokumen DOCX]
    M --> N[Mesin Pengganti DOCX: Ganti Placeholder & Hapus Yellow Highlight]
    N --> O[Unduh File: KAK_[Nama_Asdep]_[Tahun].docx]
    O --> P[Selesai]
```

---

## 6. SPESIFIKASI KEBUTUHAN FUNGSIONAL (FUNCTIONAL REQUIREMENTS)

### FR-1: Modul Template Ingestion & Placeholder Mapping
* **FR-1.1:** Sistem harus memuat template bawaan (`Copy of Format Digitalisasi KAK.docx`) secara otomatis sebagai basis pembentukan dokumen.
* **FR-1.2:** Sistem harus menyediakan opsi untuk mengunggah template `.docx` baru jika di masa depan ada pembaruan format dari Biro Perencanaan.
* **FR-1.3:** Sistem memetakan seluruh elemen XML OpenXML (`w:document.xml`) yang memiliki tag `<w:highlight w:val="yellow"/>` menjadi kunci variabel (*variable keys*) yang terhubung ke formulir input.

### FR-2: Modul Formulir Terpandu (*Multi-Step Form Wizard*)
Formulir dibagi menjadi 7 tab/tahapan logis agar pengguna tidak kewalahan (*avoid cognitive overload*):

* **Tahap 1: Cover & Identitas Dokumen**
  * Asisten Deputi, Deputi Bidang, Tahun Anggaran.
  * Program (036.CL), Kegiatan, Klasifikasi Rincian Output (KRO), Rincian Output (RO).
  * Sasaran Program, Indikator Kinerja Program, Sasaran Kegiatan, Indikator RO, Volume RO, dan Satuan RO.
* **Tahap 2: Dasar Hukum & Tugas Fungsi**
  * Nomor dan Judul Perpres SOTK Kemenko PMK (Perpres No ... Tahun ... tentang ...).
  * Urusan pemerintahan yang diselenggarakan.
  * Fungsi Deputi dan fungsi Asisten Deputi.
  * Daftar K/L di bawah koordinasi Asdep.
  * Daftar regulasi dasar hukum (Undang-Undang, PP, Perpres, Permen).
* **Tahap 3: Substansi RPJMN, Isu Strategis & Rekomendasi Kebijakan**
  * Prioritas Nasional (PN), Sasaran PN, Arah Kebijakan RKP.
  * Program & Indikator RPJMN (Lampiran III).
  * Narasi Data Terbaru, Isu Strategis, Gap Analysis, dan Konsentrasi Kewilayahan.
  * Output Rekomendasi Alternatif Kebijakan (Nama Rekomendasi, Tujuan, Fokus, dan Dampak yang diharapkan).
* **Tahap 4: Reformasi Birokrasi (RB) & Pengarusutamaan Gender (GAP)**
  * Indikator RB yang dikawal beserta catatan narasi (regulasi, capaian, isu strategis, faktor penghambat/pendorong, stakeholder).
  * Narasi PUG/GAP: kesenjangan gender, faktor penyebab, dan bentuk intervensi.
* **Tahap 5: Penerima Manfaat & Tahapan Pelaksanaan Kegiatan**
  * Daftar Lembaga Eksternal & Kelompok Masyarakat penerima manfaat.
  * Rincian Kegiatan Tahapan (Identifikasi Masalah, Sinkronisasi Koordinasi & Pengendalian/SKP, Monitoring & Evaluasi, Penyusunan Rekomendasi Kebijakan).
  * Detail per kegiatan: Lokasi (Prov/Kab/Kota & alasan pemilihan jika di luar Jakarta), Waktu (Bulan/Tahun), Daftar Peserta, Jumlah Peserta, Kebutuhan Narasumber, dan Output yang dicapai.
* **Tahap 6: Matriks Kurun Waktu & Anggaran (RAB)**
  * Matriks checklist pelaksanaan bulanan (Bulan 1 s.d. 12).
  * Total nominal anggaran yang dibutuhkan (Rp xxxxx).
* **Tahap 7: Lembar Pengesahan**
  * Tempat & Tanggal Dokumen (contoh: *Jakarta, 15 Januari 2027*).
  * Nama Pejabat / Asisten Deputi.
  * NIP Pejabat.

### FR-3: Modul Repeater & Komponen Dinamis
* **FR-3.1:** Mendukung penambahan baris dinamis (*dynamic add/remove row*) untuk daftar dasar hukum, daftar peserta rapat, dan butir-butir rekomendasi kebijakan.
* **FR-3.2:** Mendukung format angka mata uang otomatis (Rupiah `Rp xxx.xxx.xxx`) pada kolom anggaran.

### FR-4: Modul Manajemen Draf (Draft Auto-Save & Export/Import Draf)
* **FR-4.1 Auto-save:** Data input formulir tersimpan secara otomatis ke `localStorage` peramban pengguna setiap kali terjadi perubahan input.
* **FR-4.2 Export Draf (JSON):** Pengguna dapat mengunduh draf isian dalam format berkas `.json` agar dapat dipindahkan ke komputer lain atau dibagikan ke rekan kerja.
* **FR-4.3 Import Draf (JSON):** Pengguna dapat mengunggah kembali file draf `.json` untuk mengisi seluruh formulir secara instan.
* **FR-4.4 Reset Form:** Tombol pembersihan draf dengan konfirmasi dialog pencegah kehilangan data tidak sengaja.

### FR-5: Modul Validasi & Pemeriksaan Kelengkapan
* **FR-5.1:** Menampilkan indikator persentase kelengkapan pengisian dokumen (*Document Completion Progress Bar*, misal: *"85% Lengkap"*).
* **FR-5.2:** Menampilkan daftar *checklist* field yang belum terisi sebelum proses unduh diizinkan atau memberikan opsi *"Isi Default"* untuk bagian opsional.

### FR-6: Modul Mesin Penggantian DOCX (OpenXML Replacement Engine)
* **FR-6.1:** Membuka paket arsip `.docx` dan membaca `word/document.xml`.
* **FR-6.2:** Menelusuri seluruh *run element* (`<w:r>`) yang mengandung tanda sorot kuning (`<w:highlight w:val="yellow"/>`).
* **FR-6.3:** Mengganti nilai teks di dalam `<w:t>` dengan data masukan pengguna sesuai ID pemetaan variabel.
* **FR-6.4:** **Menghapus elemen `<w:highlight>`** dari *run* tersebut sehingga hasil teks di dokumen keluaran tidak lagi berwarna kuning (*clean text*).
* **FR-6.5:** Mempertahankan seluruh format font, ukuran, penebalan (*bold*), garis miring (*italic*), perataan paragraf (*alignment*), serta struktur tabel asli tanpa pergeseran.
* **FR-6.6:** Mengemas kembali arsip `.docx` dan menghasilkan berkas biner siap unduh melalui *Blob API*.

---

## 7. SPESIFIKASI KEBUTUHAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

| Kategori | Kebutuhan & Standar Kualitas |
| :--- | :--- |
| **Integritas Dokumen** | Dokumen hasil *generate* harus 100% valid dan dapat dibuka sempurna di Microsoft Word 2016+, Office 365, LibreOffice, maupun Google Docs tanpa peringatan korup (*no XML corruption*). |
| **Performa** | Proses penggantian teks dan pembuatan dokumen output DOCX di peramban harus selesai dalam waktu kurang dari **2 detik**. |
| **Keamanan & Privasi** | Pemrosesan dokumen dapat berjalan secara **100% Client-Side** (dalam browser pengguna) tanpa mengirimkan isi dokumen sensitif kementerian ke server eksternal pihak ketiga, menjamin kerahasiaan data perencanaan Kemenko PMK. |
| **Kompatibilitas** | Berjalan responsif dan mulus pada peramban modern (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari) pada resolusi desktop/laptop (min 1366x768). |
| **Aksesibilitas & Estetika (UI/UX)** | Antarmuka berstandar instansi pemerintah modern (palet warna Kemenko PMK: navy/biru kementerian, putih, abu-abu netral), tipografi jelas (*Inter/Plus Jakarta Sans*), indikator langkah yang komunikatif, dan responsif terhadap input pengguna. |

---

## 8. KAMUS PEMETAAN DATA (DATA MAPPING DICTIONARY)

Berikut adalah ringkasan pemetaan variabel input formulir ke placeholder dalam template dokumen:

| No | Nama Variabel | Label Form | Tipe Input | Lokasi di Template DOCX |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `asdep_nama` | Nama Asisten Deputi | Teks Singkat | Paragraf Cover & Header KAK |
| 2 | `deputi_bidang` | Deputi Bidang | Dropdown / Teks | Paragraf Cover & Narasi Bab 2.1 |
| 3 | `tahun_anggaran` | Tahun Anggaran | Angka (Tahun) | Header Dokumen, Subkomponen, RAB |
| 4 | `ro_judul` | Judul Rincian Output (RO) | Teks Area Singkat | Cover, Header KAK, Bab Latar Belakang |
| 5 | `ro_kode` | Kode RO | Teks Singkat | Penomoran RO |
| 6 | `kro_nama` | Klasifikasi Rincian Output | Teks Singkat | Header KAK |
| 7 | `kro_kode` | Kode KRO | Teks Singkat | Header KAK |
| 8 | `dasar_hukum_list` | Daftar Regulasi / Dasar Hukum | Repeater List | Poin 1. Dasar Hukum (Undang-Undang, PP, Perpres) |
| 9 | `perpres_sotk_no` | Nomor & Tahun Perpres SOTK | Teks Singkat | Bab 2.1 (Placeholder `(1)`) |
| 10 | `perpres_sotk_tentang`| Judul Perpres SOTK | Teks Area Singkat | Bab 2.1 (Placeholder `(2)`) |
| 11 | `urusan_pmk` | Urusan Pemerintahan Kemenko | Teks Area Singkat | Bab 2.1 (Placeholder `(3)`) |
| 12 | `fungsi_deputi` | Penyelenggaraan Fungsi Deputi | Teks Area | Bab 2.1 (Placeholder `(5)` & `(6)`) |
| 13 | `fungsi_asdep` | Fungsi Asisten Deputi | Teks Area | Bab 2.1 (Placeholder `(8)`) |
| 14 | `kl_terkait_asdep` | K/L di Bawah Koordinasi Asdep | Teks Area / Tag | Bab 2.1 (Placeholder `(10)`) |
| 15 | `rpjmn_pn_nomor` | Nomor Prioritas Nasional (PN) | Teks Singkat | Bab 2.1 (Placeholder `(12)`) |
| 16 | `rpjmn_pn_nama` | Judul Prioritas Nasional | Teks Area | Bab 2.1 (Placeholder `(13)`) |
| 17 | `rpjmn_pn_sasaran` | Sasaran Utama PN | Teks Area | Bab 2.1 (Placeholder `(15)`) |
| 18 | `rkp_arah_kebijakan` | Arah Kebijakan RKP | Teks Area | Bab 2.1 |
| 19 | `isu_strategis_narasi`| Narasi Isu & Gap Analysis | Teks Area Panjang | Bab 2.1 Paragraf Data Terbaru Program |
| 20 | `rekomendasi_kebijakan`| Daftar Butir Rekomendasi | Repeater List | Bab 2.1 (Tujuan, Fokus, Harapan) |
| 21 | `rb_indikator` | Indikator Reformasi Birokrasi | Teks Area | Bab 2.2 Pengawalan Indikator RB |
| 22 | `gap_kesenjangan` | Kesenjangan Gender | Teks Area | Bab 2.3 & Lampiran I Matriks GAP |
| 23 | `tahapan_kegiatan` | Rincian Tahapan Pelaksanaan | Repeater Multi-field | Bab C.2 Tahapan (Lokasi, Waktu, Peserta, Output) |
| 24 | `jadwal_matriks` | Matriks Jadwal Jan-Des | Checkbox Grid | Bab D Matriks Waktu Pelaksanaan |
| 25 | `total_anggaran` | Total Kebutuhan Anggaran | Currency / Teks | Bab E Biaya yang Dibutuhkan |
| 26 | `pejabat_nama` | Nama Lengkap Asdep / PPK | Teks Singkat | Lembar Pengesahan Akhir |
| 27 | `pejabat_nip` | NIP Pejabat | Angka / Teks | Lembar Pengesahan Akhir |
| 28 | `tanggal_pengesahan` | Tanggal Pengesahan Dokumen | Tanggal / Teks | Lembar Pengesahan (contoh: Jakarta, ...) |

---

## 9. DESAIN ARSITEKTUR TEKNOLOGI (TECH STACK TERPILIH)

Berdasarkan pertimbangan kemudahan dipelajari, kecepatan implementasi, nol dependensi (*zero dependencies/zero build-step*), dan keamanan data internal instansi, tech stack resmi yang digunakan adalah:

* **Frontend & UI Layer:**
  * **HTML5 Semantik:** Struktur formulir *multi-step wizard*, tabel matriks kegiatan, dan kontrol input.
  * **Modern Vanilla CSS:** Desain antarmuka berstandar instansi (palet warna Kemenko PMK: Deep Navy `#0B2B5C`, Royal Blue `#1E40AF`, Gold/Amber `#D97706`, dan latar netral modern). Mendukung *responsive layout* desktop/laptop tanpa memerlukan framework CSS berat.
  * **Vanilla JavaScript (ES6 Modules):** Mengelola logika formulir, navigasi tahapan (*step wizard*), kalkulasi persentase kelengkapan, *real-time auto-save*, serta ekspor/impor draf `.json`.

* **DOCX Manipulation Engine (100% Client-Side):**
  * **`JSZip`:** Membaca, mengekstrak arsip `.docx` di memori browser, memodifikasi berkas OpenXML internal (`word/document.xml`), dan mengemas kembali menjadi dokumen Word siap pakai.
  * **`DOMParser` & `XMLSerializer` bawaan Browser:** Menelusuri seluruh *run* teks `<w:r>` yang memiliki tag sorotan kuning `<w:highlight w:val="yellow"/>`, menyuntikkan nilai input pengguna, dan menghapus tag `<w:highlight>` secara bersih.
  * **`FileSaver.js`:** Memastikan berkas biner `.docx` hasil generate langsung terunduh secara konsisten di semua peramban (Chrome, Edge, Firefox, Safari).

* **Penyimpanan Data Draf:**
  * **Browser `localStorage`:** Menyimpan status isian formulir secara otomatis saat staf mengetik (*zero data loss*).
  * **File JSON Portabel:** Kemampuan ekspor dan impor file draf `.json` untuk kemudahan serah terima pekerjaan antar pegawai.

* **Keunggulan Arsitektur Ini:**
  1. **Nol Konfigurasi (*Zero Setup*):** Dapat dijalankan langsung dengan membuka berkas `index.html` di browser tanpa perlu menginstal Node.js, Python, atau database.
  2. **100% Aman & Konfidensial:** Seluruh data KAK diproses di laptop pengguna tanpa pernah dikirimkan ke server publik pihak ketiga.
  3. **Portabel & Mandiri:** Dapat digunakan secara *offline* tanpa memerlukan koneksi internet.

---

## 10. ROADMAP IMPLEMENTASI (FASE PENGEMBANGAN)

* **Fase 1 (Analisis & Ekstraksi Template):** Pemetaan presisi seluruh tag `<w:highlight>` pada template `Copy of Format Digitalisasi KAK.docx` ke skema JSON.
* **Fase 2 (Pengembangan UI Form Wizard):** Pembangunan antarmuka pengguna interaktif (Stepper 7 tahap, validasi field, penyimpanan draf di localStorage).
* **Fase 3 (Pembangunan Engine Pengganti DOCX):** Integrasi fungsi pembacaan arsip DOCX, penggantian string placeholder, pembersihan sorotan kuning, dan ekspor berkas `.docx`.
* **Fase 4 (Pengujian & Verifikasi):** Pengujian kesesuaian visual dokumen output terhadap sampel manual (`KAK-penanganan-bencana-2027.docx`).
* **Fase 5 (Deployment & Dokumentasi Pengguna):** Peluncuran aplikasi dan penyusunan panduan singkat (*User Guide*).
