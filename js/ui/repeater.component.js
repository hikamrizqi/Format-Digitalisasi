/**
 * @file repeater.component.js
 * @description Komponen baris dinamis (Repeater Component) yang reusable.
 * Menangani penambahan, pengisian, dan penghapusan baris data berulang (Dasar Hukum, Lembaga, Masyarakat).
 * Layer: UI / Presentation Component
 */

class RepeaterComponent {
  /**
   * @param {Object} options
   * @param {string} options.containerId - ID elemen kontainer tempat baris dirender
   * @param {string} options.addButtonId - ID tombol untuk menambah baris baru
   * @param {string} [options.placeholder] - Teks petunjuk input
   * @param {Function} [options.onChange] - Callback saat ada baris ditambah, dihapus, atau diubah
   */
  constructor(options) {
    this.container = document.getElementById(options.containerId);
    this.addButton = document.getElementById(options.addButtonId);
    this.placeholder = options.placeholder || "Ketik butir data...";
    this.onChange = options.onChange || null;

    if (!this.container) {
      console.warn(`[RepeaterComponent] Kontainer #${options.containerId} tidak ditemukan.`);
    }

    this._initEvents();
  }

  /**
   * Mengikat event listener pada tombol tambah
   * @private
   */
  _initEvents() {
    if (this.addButton) {
      this.addButton.addEventListener("click", () => {
        this.addItem("");
        this._notifyChange();
      });
    }
  }

  /**
   * Menambahkan satu baris item ke kontainer
   * @param {string} [initialValue=""] - Nilai awal teks
   * @returns {HTMLElement} Elemen baris yang dibuat
   */
  addItem(initialValue = "") {
    if (!this.container) return null;

    const row = document.createElement("div");
    row.className = "repeater-item";

    const input = document.createElement("input");
    input.type = "text";
    input.value = initialValue;
    input.placeholder = this.placeholder;

    input.addEventListener("input", () => {
      this._notifyChange();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-remove-row";
    removeBtn.textContent = "✕";
    removeBtn.title = "Hapus baris ini";

    removeBtn.addEventListener("click", () => {
      row.remove();
      this._notifyChange();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    this.container.appendChild(row);

    return row;
  }

  /**
   * Me-render sekumpulan item sekaligus dari array
   * @param {Array<string>} itemsArray 
   */
  render(itemsArray = []) {
    if (!this.container) return;
    this.container.innerHTML = "";

    if (Array.isArray(itemsArray) && itemsArray.length > 0) {
      itemsArray.forEach((itemText) => {
        this.addItem(itemText);
      });
    } else {
      // Sediakan minimal 1 baris kosong
      this.addItem("");
    }
  }

  /**
   * Mengambil seluruh nilai baris yang tidak kosong
   * @returns {Array<string>}
   */
  getItems() {
    if (!this.container) return [];
    const inputs = this.container.querySelectorAll("input");
    const results = [];

    inputs.forEach((inp) => {
      const val = inp.value.trim();
      if (val.length > 0) {
        results.push(val);
      }
    });

    return results;
  }

  /**
   * Mengosongkan seluruh baris dan menyisakan satu baris kosong baru
   */
  clear() {
    this.render([""]);
  }

  /**
   * Memicu callback perubahan jika disediakan
   * @private
   */
  _notifyChange() {
    if (typeof this.onChange === "function") {
      this.onChange(this.getItems());
    }
  }
}

// Pasang ke namespace global window
window.RepeaterComponent = RepeaterComponent;
