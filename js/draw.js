// draw.js - Draw orchestration & state management

import { i18n } from './i18n.js';
import { audioManager } from './audio.js';

// Draw states
const STATE = {
  READY: 'ready',      // Ready to spin
  SPINNING: 'spinning', // Currently spinning (waiting for STOP)
  STOPPED: 'stopped',   // Stopped, awaiting confirmation
  COMPLETE: 'complete'  // All prizes awarded
};

export class DrawManager {
  constructor(slotMachine, prizeManager, winnerManager, confetti) {
    this.slotMachine = slotMachine;
    this.prizeManager = prizeManager;
    this.winnerManager = winnerManager;
    this.confetti = confetti;

    this.state = STATE.READY;
    this.pendingWinner = null;

    // UI Elements
    this.actionButtons = document.getElementById('actionButtons');
    this.prizeBadge = document.getElementById('prizeBadge');
    this.currentPrizeName = document.getElementById('currentPrizeName');
    this.winnerNameEl = document.getElementById('winnerName');

    this.onStateChange = null;

    // Listen for spin complete event
    if (this.slotMachine.container) {
      this.slotMachine.container.addEventListener('spinComplete', (e) => {
        this.onSpinComplete(e.detail.winner);
      });
    }
  }

  setOnStateChange(callback) {
    this.onStateChange = callback;
  }

  updateUI() {
    this.updatePrizeDisplay();
    this.updateButtons();
    this.updatePrizeBadge();
  }

  updatePrizeDisplay() {
    const prize = this.prizeManager.getCurrentPrize();
    if (this.currentPrizeName && prize) {
      this.currentPrizeName.textContent = i18n.getPrizeName(prize);
    }
  }

  updatePrizeBadge() {
    const prize = this.prizeManager.getCurrentPrize();
    if (this.prizeBadge && prize) {
      const badgeNumber = this.prizeBadge.querySelector('.prize-badge__number');
      if (badgeNumber) {
        badgeNumber.textContent = prize.id;
      }
    }
  }

  updateButtons() {
    if (!this.actionButtons) return;

    // Check completion based on actual winners, not queue position
    const totalPrizes = this.prizeManager.getTotalPrizes();
    const awardedCount = this.winnerManager.getWinners().length;
    const isComplete = awardedCount >= totalPrizes;
    const hasParticipants = this.slotMachine.hasParticipants();

    // Clear existing buttons
    this.actionButtons.innerHTML = '';

    if (isComplete || !hasParticipants) {
      this.state = STATE.COMPLETE;
      const btn = this.createButton(i18n.t('completed'), 'btn--primary btn--spin', true);
      this.actionButtons.appendChild(btn);
      return;
    }

    switch (this.state) {
      case STATE.READY:
        const spinBtn = this.createButton(i18n.t('spin'), 'btn--primary btn--spin');
        spinBtn.addEventListener('click', () => {
          audioManager.playClick();
          this.startSpin();
        });
        this.actionButtons.appendChild(spinBtn);
        break;

      case STATE.SPINNING:
        const stopBtn = this.createButton(i18n.t('stop'), 'btn--stop btn--spin');
        stopBtn.addEventListener('click', () => {
          audioManager.playClick();
          this.stopSpin();
        });
        this.actionButtons.appendChild(stopBtn);
        break;

      case STATE.STOPPED:
        const confirmBtn = this.createButton(i18n.t('confirm'), 'btn--confirm');
        confirmBtn.addEventListener('click', () => {
          audioManager.playClick();
          audioManager.playLevelUp();
          this.confirmWinner();
        });

        const respinBtn = this.createButton(i18n.t('respin'), 'btn--secondary');
        respinBtn.addEventListener('click', () => {
          audioManager.playClick();
          this.respin();
        });

        this.actionButtons.appendChild(confirmBtn);
        this.actionButtons.appendChild(respinBtn);
        break;
    }
  }

  createButton(text, className, disabled = false) {
    const btn = document.createElement('button');
    btn.className = `btn ${className}`;
    btn.textContent = text;
    btn.disabled = disabled;
    return btn;
  }

  startSpin() {
    if (this.state !== STATE.READY) return;
    // Check completion based on actual winners, not queue position
    const totalPrizes = this.prizeManager.getTotalPrizes();
    const awardedCount = this.winnerManager.getWinners().length;
    if (awardedCount >= totalPrizes) return;
    if (!this.slotMachine.hasParticipants()) return;

    const started = this.slotMachine.startSpin();
    if (started) {
      this.state = STATE.SPINNING;
      this.updateButtons();

      // Update winner name to show "drawing" text
      if (this.winnerNameEl) {
        this.winnerNameEl.textContent = i18n.t('drawing');
        this.winnerNameEl.classList.remove('winner-name--highlight');
      }
    }
  }

  stopSpin() {
    if (this.state !== STATE.SPINNING) return;

    // Request stop - winner will be selected and reels will stop
    this.slotMachine.stop();
    // State will change to STOPPED when spinComplete event fires
  }

  onSpinComplete(winner) {
    if (!winner) return;

    this.pendingWinner = winner;
    this.state = STATE.STOPPED;
    this.updateButtons();

    // Show confetti
    if (this.confetti) {
      const rect = this.slotMachine.container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.confetti.burst(centerX, centerY, 150);
    }
  }

  confirmWinner() {
    if (this.state !== STATE.STOPPED || !this.pendingWinner) return;

    const winner = this.pendingWinner;
    const currentPrize = this.prizeManager.getCurrentPrize();

    // Record the winner
    this.winnerManager.addWinner(winner, currentPrize);

    // Remove winner from pool
    this.slotMachine.removeParticipant(winner.id);

    // Advance to next prize
    this.prizeManager.advanceToNextPrize();

    // Clear pending
    this.pendingWinner = null;
    this.slotMachine.clearPendingWinner();

    // Reset state
    this.state = STATE.READY;
    this.updateUI();

    // Reset winner name display
    if (this.winnerNameEl) {
      this.winnerNameEl.textContent = i18n.t('pressToStart');
      this.winnerNameEl.classList.remove('winner-name--highlight');
    }

    // Reset slot machine display
    this.slotMachine.displayInitialState();

    // Notify state change for auto-save
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  respin() {
    if (this.state !== STATE.STOPPED) return;

    // Clear pending winner
    this.pendingWinner = null;
    this.slotMachine.clearPendingWinner();

    // Reset display
    this.slotMachine.reset();

    // Go back to ready state
    this.state = STATE.READY;
    this.updateButtons();

    // Reset winner name display
    if (this.winnerNameEl) {
      this.winnerNameEl.textContent = i18n.t('pressToStart');
      this.winnerNameEl.classList.remove('winner-name--highlight');
    }
  }

  undoLastDraw() {
    // Get the last winner
    const lastWinner = this.winnerManager.removeLastWinner();
    if (!lastWinner) return null;

    // Undo prize advancement
    this.prizeManager.undoLastPrize();

    // Add participant back
    this.slotMachine.addParticipant({
      id: lastWinner.id,
      name: lastWinner.name
    });

    // Notify state change
    if (this.onStateChange) {
      this.onStateChange();
    }

    this.state = STATE.READY;
    this.updateUI();
    return lastWinner;
  }

  readdWinner(participantId) {
    const winner = this.winnerManager.removeWinnerById(participantId);
    if (!winner) return null;

    this.slotMachine.addParticipant({
      id: winner.id,
      name: winner.name
    });

    if (this.onStateChange) {
      this.onStateChange();
    }

    return winner;
  }

  canDraw() {
    // Check completion based on actual winners, not queue position
    const totalPrizes = this.prizeManager.getTotalPrizes();
    const awardedCount = this.winnerManager.getWinners().length;
    const isComplete = awardedCount >= totalPrizes;
    return this.state === STATE.READY &&
           !isComplete &&
           this.slotMachine.hasParticipants();
  }

  reset(originalParticipants) {
    this.prizeManager.reset();
    this.winnerManager.reset();
    this.slotMachine.setParticipants(originalParticipants);
    this.slotMachine.reset();
    this.pendingWinner = null;
    this.state = STATE.READY;
    this.updateUI();

    if (this.winnerNameEl) {
      this.winnerNameEl.textContent = i18n.t('pressToStart');
      this.winnerNameEl.classList.remove('winner-name--highlight');
    }

    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  // For compatibility with old carousel interface
  get carousel() {
    return this.slotMachine;
  }
}
