import { Notifications } from "./core.js";

export class QuranReader {
  constructor() {
    this.surahs = [];
    this.viewMode = "surah"; // 'surah' or 'juz'
    this.modal = null;
    this.overlay = null;
  }

  async init() {
    if (!this.overlay) {
      this.createModal();
    }

    if (this.surahs.length === 0) {
      await this.loadSurahs();
    }

    if (this.viewMode === "surah") {
      this.renderSurahList();
    } else {
      this.renderJuzList();
    }
  }

  createModal() {
    this.overlay = document.createElement("div");
    this.overlay.className = "quran-modal-overlay";

    this.overlay.innerHTML = `
            <div class="quran-modal">
                <div class="quran-modal-header">
                    <div class="quran-header-title">
                        <i class="fa-solid fa-book-quran"></i>
                        <h2 id="quran-title-text">القرآن الكريم</h2>
                    </div>
                    <div class="quran-view-toggle">
                        <button class="toggle-btn active" id="toggle-surah" onclick="window.quranReader.setViewMode('surah')">السور</button>
                        <button class="toggle-btn" id="toggle-juz" onclick="window.quranReader.setViewMode('juz')">الأجزاء</button>
                    </div>
                    <button class="quran-close-btn" id="quran-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="quran-modal-content" id="quran-modal-content">
                    <div class="loading-state" style="text-align: center; padding: 3rem;">
                        <div class="spinner spinner-lg"></div>
                        <p style="margin-top: 1rem; color: var(--text-secondary);">جاري تحميل السور...</p>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(this.overlay);

    this.overlay.querySelector("#quran-close-btn").onclick = () => this.hide();
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.hide();
    };

    this.modalContent = this.overlay.querySelector("#quran-modal-content");
  }

  async loadSurahs() {
    try {
      const response = await fetch("https://api.alquran.cloud/v1/surah");
      const data = await response.json();

      if (data.code === 200) {
        this.surahs = data.data;
      } else {
        throw new Error("Failed to fetch surahs");
      }
    } catch (error) {
      console.error("Quran Reader Error:", error);
      Notifications.error("فشل تحميل قائمة السور");
      this.modalContent.innerHTML = `<p style="color: var(--color-error); text-align: center;">خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.</p>`;
    }
  }

  renderSurahList() {
    this.viewMode = "surah";
    this.updateToggleState();
    this.modalContent.innerHTML = `
            <div class="surah-grid">
                ${this.surahs
                  .map(
                    (surah) => `
                    <div class="surah-card" onclick="window.quranReader.showSurah(${surah.number})">
                        <div class="surah-number">${surah.number}</div>
                        <div class="surah-info">
                            <div class="surah-name-ar">${surah.name}</div>
                            <div class="surah-meta">
                                <span>${surah.numberOfAyahs} آية</span>
                            </div>
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  setViewMode(mode) {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.updateToggleState();
    if (mode === "surah") {
      this.renderSurahList();
    } else {
      this.renderJuzList();
    }
  }

  updateToggleState() {
    const surahBtn = this.overlay.querySelector("#toggle-surah");
    const juzBtn = this.overlay.querySelector("#toggle-juz");
    if (surahBtn && juzBtn) {
      surahBtn.classList.toggle("active", this.viewMode === "surah");
      juzBtn.classList.toggle("active", this.viewMode === "juz");
    }
  }

  renderJuzList() {
    this.modalContent.innerHTML = `
            <div class="surah-grid">
                ${Array.from({ length: 30 }, (_, i) => i + 1)
                  .map(
                    (number) => `
                    <div class="juz-container">
                        <div class="surah-card juz-card" id="juz-card-${number}" onclick="window.quranReader.toggleJuz(${number})">
                            <div class="surah-number">${number}</div>
                            <div class="surah-info">
                                <div class="surah-name-ar">الجزء ${this.toArabicDigits(
                                  number
                                )}</div>
                                <div class="surah-meta">30 جزء القرآن الكريم</div>
                            </div>
                            <i class="fa-solid fa-chevron-down juz-arrow"></i>
                        </div>
                        <div class="juz-dropdown" id="juz-dropdown-${number}"></div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  async toggleJuz(number) {
    const dropdown = this.overlay.querySelector(`#juz-dropdown-${number}`);
    const card = this.overlay.querySelector(`#juz-card-${number}`);

    if (dropdown.classList.contains("active")) {
      dropdown.classList.remove("active");
      card.classList.remove("expanded");
      return;
    }

    // Close other dropdowns
    this.overlay
      .querySelectorAll(".juz-dropdown.active")
      .forEach((el) => el.classList.remove("active"));
    this.overlay
      .querySelectorAll(".juz-card.expanded")
      .forEach((el) => el.classList.remove("expanded"));

    dropdown.classList.add("active");
    card.classList.add("expanded");

    if (dropdown.innerHTML === "") {
      dropdown.innerHTML = `<div style="padding: 1.5rem; text-align: center;"><div class="spinner"></div></div>`;
      try {
        const response = await fetch(
          `https://api.alquran.cloud/v1/juz/${number}`
        );
        const data = await response.json();

        if (data.code === 200) {
          const surahsInJuz = [];
          const seenSurahs = new Set();

          data.data.ayahs.forEach((ayah) => {
            if (!seenSurahs.has(ayah.surah.number)) {
              seenSurahs.add(ayah.surah.number);
              surahsInJuz.push(ayah.surah);
            }
          });

          dropdown.innerHTML = `
                        <div class="juz-surah-list">
                            ${surahsInJuz
                              .map(
                                (surah) => `
                                <div class="juz-surah-item" onclick="event.stopPropagation(); window.quranReader.showSurah(${surah.number})">
                                    <span>${surah.name}</span>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    `;
        }
      } catch (error) {
        dropdown.innerHTML = `<div style="padding: 1rem; color: var(--color-error);">فشل تحميل بيانات الجزء</div>`;
      }
    }
  }

  async showSurah(number) {
    this.modalContent.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 3rem;">
                <div class="spinner spinner-lg"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">جاري تحميل السورة...</p>
            </div>
        `;

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${number}`
      );
      const data = await response.json();

      if (data.code === 200) {
        const surah = data.data;
        this.renderReadingView(surah);
      } else {
        throw new Error("Failed to fetch surah content");
      }
    } catch (error) {
      console.error("Quran Reader Error:", error);
      Notifications.error("فشل تحميل السورة");
      if (this.viewMode === "surah") this.renderSurahList();
      else this.renderJuzList();
    }
  }

  renderReadingView(surah) {
    this.modalContent.innerHTML = `
            <div class="reading-view">
                <button class="back-to-list" onclick="window.quranReader.${
                  this.viewMode === "surah"
                    ? "renderSurahList()"
                    : "renderJuzList()"
                }">
                    <i class="fa-solid fa-arrow-right"></i>
                    العودة ل${
                      this.viewMode === "surah"
                        ? "قائمة السور"
                        : "قائمة الأجزاء"
                    }
                </button>
                
                <div class="reading-header">
                    <h1 class="surah-title-large">${surah.name}</h1>
                    <p class="surah-meta" style="font-size: 1rem;">
                        ${
                          surah.revelationType === "Meccan" ? "مكية" : "مدنية"
                        } • ${surah.numberOfAyahs} آية
                    </p>
                </div>

                ${
                  surah.number !== 1 && surah.number !== 9
                    ? `
                    <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                `
                    : ""
                }

                <div class="verses-container">
                    ${surah.ayahs
                      .map(
                        (ayah) => `
                        <span class="verse">
                            ${ayah.text.replace(
                              "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                              ""
                            )}
                            <span class="verse-number">${this.toArabicDigits(
                              ayah.numberInSurah
                            )}</span>
                        </span>
                    `
                      )
                      .join(" ")}
                </div>
            </div>
        `;

    this.modalContent.scrollTop = 0;
  }

  toArabicDigits(num) {
    const id = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return num.toString().replace(/[0-9]/g, (w) => id[+w]);
  }

  show() {
    this.init().then(() => {
      this.overlay.style.display = "flex";
      setTimeout(() => this.overlay.classList.add("active"), 10);
    });
  }

  hide() {
    this.overlay.classList.remove("active");
    setTimeout(() => {
      this.overlay.style.display = "none";
    }, 300);
  }
}

// Global instance for onclick handlers in HTML strings
window.quranReader = new QuranReader();
