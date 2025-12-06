// i18n.js - Bilingual support (EN/VI)

const translations = {
  en: {
    title: 'Lottery',
    admin: 'Admin',
    results: 'Results',
    guide: 'Guide',
    spin: 'SPIN',
    stop: 'STOP',
    confirm: 'CONFIRM',
    respin: 'RE-SPIN',
    pressToStart: 'Press SPIN to start',
    noWinnersYet: 'No winners yet',
    allPrizesAwarded: 'All prizes awarded!',
    reset: 'Reset',
    undo: 'Undo',
    export: 'Export',
    confirmReset: 'Are you sure you want to reset everything?',
    importParticipants: 'Import Participants',
    importPrizes: 'Import Prizes',
    importData: 'Import Data',
    drawing: 'Drawing...',
    winner: 'Winner!',
    completed: 'COMPLETED',
    drawResults: 'Lottery Results',
    fullName: 'Full Name',
    download: 'Download',
    sessionTitle: 'Draw Session',
    actions: 'Actions',
    // Prize names
    grandPrize: 'GRAND PRIZE',
    firstPrize: 'FIRST PRIZE',
    secondPrize: 'SECOND PRIZE',
    thirdPrize: 'THIRD PRIZE',
    consolation: 'CONSOLATION',
    // Help content
    helpPrepare: '1. Prepare Data',
    helpPrepareDesc: 'Create CSV files with participant list (id, name) and prizes (id, name, name_vi, quantity).',
    helpSpin: '2. Spin',
    helpSpinDesc: 'Press "SPIN" button or Spacebar to start the draw.',
    helpConfirm: '3. Confirm Result',
    helpConfirmDesc: 'Press "STOP" to stop, then "CONFIRM" to save or "RE-SPIN" to draw again.',
    helpView: '4. View Results',
    helpViewDesc: 'Press "Results" in footer to view all winners.'
  },
  vi: {
    title: 'Quay Số May Mắn',
    admin: 'Quản trị',
    results: 'Kết quả',
    guide: 'Hướng dẫn',
    spin: 'QUAY SỐ',
    stop: 'CHỐT',
    confirm: 'XÁC NHẬN',
    respin: 'QUAY LẠI',
    pressToStart: 'Nhấn nút Quay số để bắt đầu',
    noWinnersYet: 'Chưa có người trúng giải',
    allPrizesAwarded: 'Đã trao hết giải!',
    reset: 'Đặt lại',
    undo: 'Hoàn tác',
    export: 'Xuất kết quả',
    confirmReset: 'Bạn có chắc muốn đặt lại tất cả?',
    importParticipants: 'Nhập người tham gia',
    importPrizes: 'Nhập giải thưởng',
    importData: 'Nhập dữ liệu',
    drawing: 'Đang quay...',
    winner: 'Trúng giải!',
    completed: 'HOÀN THÀNH',
    drawResults: 'Kết quả quay số may mắn',
    fullName: 'Họ tên',
    download: 'Tải xuống',
    sessionTitle: 'Phiên quay thưởng',
    actions: 'Hành động',
    // Prize names
    grandPrize: 'GIẢI ĐẶC BIỆT',
    firstPrize: 'GIẢI NHẤT',
    secondPrize: 'GIẢI NHÌ',
    thirdPrize: 'GIẢI BA',
    consolation: 'GIẢI KHUYẾN KHÍCH',
    // Help content
    helpPrepare: '1. Chuẩn bị dữ liệu',
    helpPrepareDesc: 'Tạo file CSV với danh sách người tham gia (id, name) và giải thưởng (id, name, name_vi, quantity).',
    helpSpin: '2. Quay số',
    helpSpinDesc: 'Nhấn nút "QUAY SỐ" hoặc phím Space để bắt đầu quay.',
    helpConfirm: '3. Chốt kết quả',
    helpConfirmDesc: 'Nhấn "CHỐT" để dừng, sau đó "XÁC NHẬN" để lưu hoặc "QUAY LẠI" để quay lại.',
    helpView: '4. Xem kết quả',
    helpViewDesc: 'Nhấn "Kết quả" ở footer để xem danh sách người trúng giải.'
  }
};

let currentLang = 'vi'; // Default to Vietnamese
let onChangeCallbacks = [];

export const i18n = {
  get lang() {
    return currentLang;
  },

  setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      this.updateDOM();
      document.documentElement.lang = lang;
      // Notify listeners
      onChangeCallbacks.forEach(cb => cb(lang));
    }
  },

  toggle() {
    this.setLang(currentLang === 'en' ? 'vi' : 'en');
    return currentLang;
  },

  t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
  },

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = this.t(key);
      if (text) {
        el.textContent = text;
      }
    });
  },

  onChange(callback) {
    onChangeCallbacks.push(callback);
  },

  // Get prize name in current language
  getPrizeName(prize) {
    if (currentLang === 'vi' && prize.name_vi) {
      return prize.name_vi;
    }
    return prize.name;
  }
};
