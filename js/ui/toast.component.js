/**
 * @file toast.component.js
 * @description Komponen notifikasi pop-up (Toast Component) yang reusable dan terisolasi.
 * Menangani umpan balik visual kepada pengguna untuk status sukses, info, peringatan, dan error.
 * Layer: UI / Presentation Component
 */

class ToastComponent {
  /**
   * @param {string} [containerId] - ID kontainer elemen toast
   */
  constructor(containerId = "toast-container") {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);

    // Buat kontainer jika belum ada di DOM
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = containerId;
      this.container.className = "toast-container";
      document.body.appendChild(this.container);
    }
  }

  /**
   * Menampilkan notifikasi toast
   * @param {string} message - Pesan yang ditampilkan
   * @param {"info"|"success"|"warning"|"error"} [type] - Tipe notifikasi
   * @param {number} [duration] - Durasi tampil dalam milidetik
   */
  show(message, type = "info", duration = 4000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };

    const icon = iconMap[type] || "ℹ️";
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-message">${message}</span>`;

    this.container.appendChild(toast);

    // Animasi keluar dan hapus elemen setelah durasi
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Shortcut untuk notifikasi sukses
   * @param {string} message 
   */
  success(message) {
    this.show(message, "success");
  }

  /**
   * Shortcut untuk notifikasi error
   * @param {string} message 
   */
  error(message) {
    this.show(message, "error", 5000);
  }

  /**
   * Shortcut untuk notifikasi peringatan
   * @param {string} message 
   */
  warning(message) {
    this.show(message, "warning", 4500);
  }

  /**
   * Shortcut untuk notifikasi info
   * @param {string} message 
   */
  info(message) {
    this.show(message, "info");
  }
}

// Pasang ke namespace global window
window.ToastComponent = ToastComponent;
