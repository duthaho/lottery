// storage.js - localStorage wrapper with auto-save

const STORAGE_KEY = 'lottery_state';

export const storage = {
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Failed to save state:', e);
      return false;
    }
  },

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load state:', e);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  export() {
    const state = this.load();
    if (!state) {
      console.warn('No state to export');
      return;
    }
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky-draw-state-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
