// app.js - Main entry point, initialization & wiring

import { AdminPanel } from './admin.js';
import { audioManager } from './audio.js';
import { Confetti } from './confetti.js';
import { DrawManager } from './draw.js';
import { i18n } from './i18n.js';
import { PrizeManager } from './prizes.js';
import { SlotMachine } from './slotmachine.js';
import { storage } from './storage.js';
import { WinnerManager } from './winners.js';

class LotteryApp {
  constructor() {
    this.originalParticipants = [];
    this.originalPrizes = [];
    this.slotMachine = null;
    this.prizeManager = null;
    this.winnerManager = null;
    this.drawManager = null;
    this.confetti = null;
    this.adminPanel = null;
  }

  async init() {
    // Load data
    await this.loadData();

    // Initialize components
    this.initComponents();

    // Load saved state if exists
    this.loadSavedState();

    // Setup event listeners
    this.setupEventListeners();

    // Setup modals
    this.setupModals();

    // Setup prize selector
    this.setupPrizeSelector();

    // Initial render
    this.drawManager.updateUI();
    i18n.updateDOM();

    // Auto-select correct starting prize (lowest priority first) - must be after i18n.updateDOM()
    this.autoSelectNextAvailablePrize();

    console.log('Lottery App initialized');
  }

  async loadData() {
    try {
      const participantsResponse = await fetch('data/participants.json');
      if (participantsResponse.ok) {
        this.originalParticipants = await participantsResponse.json();
      }
    } catch (err) {
      console.warn('Failed to load participants.json, using defaults');
      this.originalParticipants = [
        { id: '100001', name: 'Nguyen Van A' },
        { id: '100002', name: 'Tran Thi B' },
        { id: '100003', name: 'Le Van C' }
      ];
    }

    try {
      const prizesResponse = await fetch('data/prizes.json');
      if (prizesResponse.ok) {
        this.originalPrizes = await prizesResponse.json();
      }
    } catch (err) {
      console.warn('Failed to load prizes.json, using defaults');
      this.originalPrizes = [
        { id: 1, name: 'Grand Prize', name_vi: 'Giai Dac Biet', quantity: 1 },
        { id: 2, name: 'First Prize', name_vi: 'Giai Nhat', quantity: 2 },
        { id: 3, name: 'Second Prize', name_vi: 'Giai Nhi', quantity: 3 }
      ];
    }
  }

  initComponents() {
    // Initialize confetti
    this.confetti = new Confetti('confettiCanvas');

    // Initialize prize manager
    this.prizeManager = new PrizeManager(this.originalPrizes);

    // Initialize winner manager
    this.winnerManager = new WinnerManager('winnersTableBody', null);

    // Initialize slot machine
    this.slotMachine = new SlotMachine('reels', this.originalParticipants);

    // Initialize draw manager
    this.drawManager = new DrawManager(
      this.slotMachine,
      this.prizeManager,
      this.winnerManager,
      this.confetti
    );

    // Set up auto-save and prize selector refresh
    this.drawManager.setOnStateChange(() => {
      this.saveState();
      this.setupPrizeSelector(); // Refresh remaining counts
      this.autoSelectNextAvailablePrize(); // Auto-select if current is exhausted
    });

    // Initialize admin panel
    this.adminPanel = new AdminPanel(
      this.drawManager,
      this.originalParticipants,
      this.originalPrizes
    );

    // Setup audio event listeners
    this.setupAudio();

    // Handle data import from admin
    this.adminPanel.setOnDataImport((type, data) => {
      if (type === 'participants') {
        this.originalParticipants = data;
        this.prizeManager.reset();
        this.winnerManager.reset();
        this.slotMachine.setParticipants(data);
        this.adminPanel.setOriginalData(data, this.originalPrizes);
        storage.clear();
      } else if (type === 'prizes') {
        this.originalPrizes = data;
        this.prizeManager.setPrizes(data);
        this.winnerManager.reset();
        this.slotMachine.setParticipants(this.originalParticipants);
        this.adminPanel.setOriginalData(this.originalParticipants, data);
        this.setupPrizeSelector();
        storage.clear();
      }
      this.drawManager.updateUI();
    });
  }

  setupAudio() {
    // Listen for spin events from slot machine
    if (this.slotMachine.container) {
      // Spin start - listen via DrawManager
      const originalStartSpin = this.drawManager.startSpin.bind(this.drawManager);
      this.drawManager.startSpin = () => {
        audioManager.playSpinStart();
        originalStartSpin();
      };

      // Spin complete - winner announcement
      this.slotMachine.container.addEventListener('spinComplete', () => {
        audioManager.playWinner();
        audioManager.playConfetti();
      });
    }

    // Start background music on first user interaction
    const startMusicOnInteraction = () => {
      if (audioManager.musicEnabled) {
        audioManager.playBackgroundMusic();
      }
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('keydown', startMusicOnInteraction);
    };
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);

    // Setup audio toggle button
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        const enabled = audioManager.toggleSound();
        this.updateAudioToggleIcon(enabled);
      });
      // Set initial icon state
      this.updateAudioToggleIcon(audioManager.enabled);
    }

    // Setup music toggle button
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
      musicToggle.addEventListener('click', () => {
        audioManager.playClick();
        const enabled = audioManager.toggleMusic();
        this.updateMusicToggleIcon(enabled);
      });
      // Set initial icon state
      this.updateMusicToggleIcon(audioManager.musicEnabled);
    }

    // Add click sounds to footer nav buttons
    document.querySelectorAll('.footer__nav-item').forEach(btn => {
      btn.addEventListener('click', () => audioManager.playClick());
    });

    // Add click sound to prize selector
    const prizeSelectorBtn = document.getElementById('prizeSelectorBtn');
    if (prizeSelectorBtn) {
      prizeSelectorBtn.addEventListener('click', () => audioManager.playClick());
    }
  }

  updateAudioToggleIcon(enabled) {
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
      const icon = audioToggle.querySelector('span');
      if (icon) {
        icon.textContent = enabled ? '\u{1F50A}' : '\u{1F507}'; // Speaker icons
      }
      audioToggle.title = enabled ? 'Mute sounds' : 'Unmute sounds';
    }
  }

  updateMusicToggleIcon(enabled) {
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle) {
      const icon = musicToggle.querySelector('span');
      if (icon) {
        icon.textContent = enabled ? '\u{1F3B5}' : '\u{1F3B5}'; // Music note
        icon.style.opacity = enabled ? '1' : '0.5';
      }
      musicToggle.title = enabled ? 'Mute music' : 'Unmute music';
    }
  }

  setupEventListeners() {
    // Keyboard shortcut (Spacebar)
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (this.isAnyModalOpen()) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (this.drawManager.canDraw()) {
          this.drawManager.performSpin();
        }
      }
    });

    // Language toggle
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        audioManager.playClick();
        i18n.toggle();
        this.drawManager.updateUI();
        this.winnerManager.render();
        this.setupPrizeSelector();
        this.saveState();
      });
    }

    // Update UI when language changes
    i18n.onChange(() => {
      this.drawManager.updateUI();
      this.winnerManager.render();
    });
  }

  setupModals() {
    // Results Modal
    const resultsBtn = document.getElementById('resultsBtn');
    const resultsModal = document.getElementById('resultsModal');
    const resultsModalClose = document.getElementById('resultsModalClose');

    if (resultsBtn && resultsModal) {
      resultsBtn.addEventListener('click', () => {
        this.renderResultsModal();
        resultsModal.hidden = false;
      });
    }

    if (resultsModalClose && resultsModal) {
      resultsModalClose.addEventListener('click', () => {
        resultsModal.hidden = true;
      });
      resultsModal.addEventListener('click', (e) => {
        if (e.target === resultsModal) {
          resultsModal.hidden = true;
        }
      });
    }

    // Help Modal
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const helpModalClose = document.getElementById('helpModalClose');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        helpModal.hidden = false;
      });
    }

    if (helpModalClose && helpModal) {
      helpModalClose.addEventListener('click', () => {
        helpModal.hidden = true;
      });
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.hidden = true;
        }
      });
    }

    // Admin Modal
    const adminBtn = document.getElementById('adminBtn');
    const adminModal = document.getElementById('adminModal');
    const adminModalClose = document.getElementById('adminModalClose');

    if (adminBtn && adminModal) {
      adminBtn.addEventListener('click', () => {
        adminModal.hidden = false;
      });
    }

    if (adminModalClose && adminModal) {
      adminModalClose.addEventListener('click', () => {
        adminModal.hidden = true;
      });
      adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
          adminModal.hidden = true;
        }
      });
    }

    // Download Results
    const downloadBtn = document.getElementById('downloadResultsBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadResults();
      });
    }

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (resultsModal) resultsModal.hidden = true;
        if (helpModal) helpModal.hidden = true;
        if (adminModal) adminModal.hidden = true;
      }
    });
  }

  setupPrizeSelector() {
    const prizeSelector = document.getElementById('prizeSelector');
    const prizeSelectorBtn = document.getElementById('prizeSelectorBtn');
    const prizeDropdown = document.getElementById('prizeDropdown');
    const currentPrizeName = document.getElementById('currentPrizeName');

    if (!prizeSelector || !prizeSelectorBtn || !prizeDropdown) return;

    // Build dropdown options
    prizeDropdown.innerHTML = '';
    const prizes = this.prizeManager.originalPrizes;

    // Calculate remaining for each prize type based on WINNERS, not queue position
    prizes.forEach(prize => {
      const awarded = this.winnerManager.getWinnersByPrize(prize.id).length;
      const remaining = prize.quantity - awarded;

      const option = document.createElement('button');
      option.className = 'prize-selector__option';
      option.textContent = `${i18n.getPrizeName(prize)} (${remaining}/${prize.quantity})`;
      option.dataset.prizeId = prize.id;
      option.disabled = remaining === 0;

      if (remaining === 0) {
        option.classList.add('prize-selector__option--disabled');
      }

      option.addEventListener('click', () => {
        if (remaining > 0) {
          this.selectPrize(prize.id);
          prizeDropdown.hidden = true;
          prizeSelector.classList.remove('prize-selector--open');
        }
      });

      prizeDropdown.appendChild(option);
    });

    // Only add toggle event listener once
    if (!prizeSelectorBtn._hasToggleListener) {
      prizeSelectorBtn._hasToggleListener = true;
      prizeSelectorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.getElementById('prizeDropdown');
        const selector = document.getElementById('prizeSelector');
        if (dropdown && selector) {
          const isOpen = !dropdown.hidden;
          dropdown.hidden = isOpen;
          selector.classList.toggle('prize-selector--open', !isOpen);
        }
      });
    }

    // Close dropdown on outside click (only add once)
    if (!this._prizeSelectorOutsideClickHandler) {
      this._prizeSelectorOutsideClickHandler = (e) => {
        if (!prizeSelector.contains(e.target)) {
          prizeDropdown.hidden = true;
          prizeSelector.classList.remove('prize-selector--open');
        }
      };
      document.addEventListener('click', this._prizeSelectorOutsideClickHandler);
    }

    // Update active option
    this.updatePrizeSelectorActive();
  }

  selectPrize(prizeId) {
    // Find the NEXT available slot for this prize type based on how many already awarded
    const queue = this.prizeManager.prizeQueue;
    const prize = this.originalPrizes.find(p => p.id === prizeId);

    if (!prize) return;

    const awarded = this.winnerManager.getWinnersByPrize(prizeId).length;

    // Check if there are remaining prizes of this type
    if (awarded >= prize.quantity) return;

    // Find the (awarded + 1)th slot for this prize type in the queue
    let count = 0;
    const index = queue.findIndex((p) => {
      if (p.id === prizeId) {
        count++;
        return count === awarded + 1;
      }
      return false;
    });

    if (index !== -1) {
      this.prizeManager.currentIndex = index;
      this.drawManager.updateUI();
      this.updatePrizeSelectorActive();

      // Also update the prize selector button text directly
      const currentPrizeName = document.getElementById('currentPrizeName');
      const currentPrize = this.prizeManager.getCurrentPrize();
      if (currentPrizeName && currentPrize) {
        currentPrizeName.textContent = i18n.getPrizeName(currentPrize);
      }

      this.setupPrizeSelector(); // Refresh to update remaining counts
    }
  }

  updatePrizeSelectorActive() {
    const prizeDropdown = document.getElementById('prizeDropdown');
    if (!prizeDropdown) return;

    const currentPrize = this.prizeManager.getCurrentPrize();
    const options = prizeDropdown.querySelectorAll('.prize-selector__option');

    options.forEach(option => {
      const isActive = currentPrize && option.dataset.prizeId == currentPrize.id;
      option.classList.toggle('prize-selector__option--active', isActive);
    });
  }

  autoSelectNextAvailablePrize() {
    // Check if current prize type has remaining slots
    const currentPrize = this.prizeManager.getCurrentPrize();
    if (currentPrize) {
      const awarded = this.winnerManager.getWinnersByPrize(currentPrize.id).length;
      const prize = this.originalPrizes.find(p => p.id === currentPrize.id);
      if (prize && awarded < prize.quantity) {
        return; // Current prize still has remaining slots
      }
    }

    // Find first prize type with remaining slots (sorted by ID descending - lowest priority first)
    const sortedPrizes = [...this.originalPrizes].sort((a, b) => b.id - a.id);
    for (const prize of sortedPrizes) {
      const awarded = this.winnerManager.getWinnersByPrize(prize.id).length;
      if (awarded < prize.quantity) {
        this.selectPrize(prize.id);
        return;
      }
    }
  }

  renderResultsModal() {
    const prizeTabs = document.getElementById('prizeTabs');
    const winnersTableBody = document.getElementById('winnersTableBody');
    const sessionTitle = document.getElementById('sessionTitle');

    if (!prizeTabs || !winnersTableBody) return;

    const winners = this.winnerManager.getWinners();
    const prizes = this.originalPrizes;

    // Build tabs
    prizeTabs.innerHTML = '';
    prizes.forEach(prize => {
      const tab = document.createElement('button');
      tab.className = 'tabs__btn';
      tab.textContent = i18n.getPrizeName(prize);
      tab.dataset.prizeId = prize.id;

      tab.addEventListener('click', () => {
        this.renderWinnersForPrize(prize.id);
        prizeTabs.querySelectorAll('.tabs__btn').forEach(t => t.classList.remove('tabs__btn--active'));
        tab.classList.add('tabs__btn--active');
      });

      prizeTabs.appendChild(tab);
    });

    // Select first prize by default
    if (prizes.length > 0) {
      const firstTab = prizeTabs.querySelector('.tabs__btn');
      if (firstTab) {
        firstTab.classList.add('tabs__btn--active');
        this.renderWinnersForPrize(prizes[0].id);
      }
    }
  }

  renderWinnersForPrize(prizeId) {
    const winnersTableBody = document.getElementById('winnersTableBody');
    const sessionTitle = document.getElementById('sessionTitle');

    if (!winnersTableBody) return;

    const winners = this.winnerManager.getWinners().filter(w => w.prize.id === prizeId);
    const prize = this.originalPrizes.find(p => p.id === prizeId);

    if (sessionTitle && prize) {
      sessionTitle.textContent = `${i18n.t('sessionTitle')} - ${i18n.getPrizeName(prize)}`;
    }

    winnersTableBody.innerHTML = '';

    if (winners.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 3;
      cell.textContent = i18n.t('noWinnersYet');
      cell.style.textAlign = 'center';
      cell.style.color = '#94a3b8';
      row.appendChild(cell);
      winnersTableBody.appendChild(row);
      return;
    }

    winners.forEach((winner, index) => {
      const row = document.createElement('tr');

      const numCell = document.createElement('td');
      numCell.textContent = index + 1;

      const idCell = document.createElement('td');
      idCell.textContent = winner.id;

      const nameCell = document.createElement('td');
      nameCell.textContent = winner.name;

      row.appendChild(numCell);
      row.appendChild(idCell);
      row.appendChild(nameCell);
      winnersTableBody.appendChild(row);
    });
  }

  downloadResults() {
    const winners = this.winnerManager.getWinners();
    const dateStr = new Date().toISOString().split('T')[0];

    // Helper to escape CSV fields
    const escapeCSV = (field) => {
      if (field == null) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    // Generate CSV content
    const header = 'ID,Name,Prize,Time';
    const rows = winners.map(w =>
      [
        escapeCSV(w.id),
        escapeCSV(w.name),
        escapeCSV(i18n.getPrizeName(w.prize)),
        escapeCSV(new Date(w.timestamp).toLocaleString())
      ].join(',')
    );
    const csvContent = header + '\n' + rows.join('\n');

    // Download CSV with BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lucky-draw-results-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  isAnyModalOpen() {
    const modals = document.querySelectorAll('.modal');
    return Array.from(modals).some(m => !m.hidden);
  }

  saveState() {
    const state = {
      lang: i18n.lang,
      participants: this.slotMachine.getParticipants(),
      prizes: this.prizeManager.getState(),
      winners: this.winnerManager.getState(),
      originalParticipants: this.originalParticipants,
      originalPrizes: this.originalPrizes
    };
    storage.save(state);
  }

  loadSavedState() {
    const state = storage.load();
    if (!state) return;

    console.log('Restoring saved state...');

    // Restore language
    if (state.lang) {
      i18n.setLang(state.lang);
    }

    // Restore original data
    if (state.originalParticipants) {
      this.originalParticipants = state.originalParticipants;
      this.adminPanel.setOriginalData(
        state.originalParticipants,
        state.originalPrizes || this.originalPrizes
      );
    }
    if (state.originalPrizes) {
      this.originalPrizes = state.originalPrizes;
    }

    // Restore prizes state
    if (state.prizes) {
      this.prizeManager.loadState(state.prizes);
    }

    // Restore winners
    if (state.winners) {
      this.winnerManager.loadState(state.winners);
    }

    // Restore remaining participants
    if (state.participants) {
      this.slotMachine.setParticipants(state.participants);
    }

    // Auto-select next available prize if current is exhausted
    this.autoSelectNextAvailablePrize();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new LotteryApp();
  app.init();
});
