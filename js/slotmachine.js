// slotmachine.js - Vertical number slot machine animation

import { i18n } from './i18n.js';
import { audioManager } from './audio.js';

export class SlotMachine {
  constructor(containerId, participants = []) {
    this.container = document.getElementById(containerId);
    this.participants = [...participants];
    this.reelCount = 6; // 6 digit reels
    this.reels = [];
    this.isSpinning = false;
    this.currentWinner = null;
    this.winnerNameEl = document.getElementById('winnerName');

    // State for stop flow
    this.pendingWinner = null;
    this.stopRequested = false;
    this.animationId = null;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.createReels();
    this.displayInitialState();
  }

  createReels() {
    this.container.innerHTML = '';
    this.reels = [];

    for (let i = 0; i < this.reelCount; i++) {
      const reel = document.createElement('div');
      reel.className = 'reel';
      reel.dataset.index = i;

      const viewport = document.createElement('div');
      viewport.className = 'reel__viewport';

      const strip = document.createElement('div');
      strip.className = 'reel__strip';

      // Create number elements (0-9 + extra for smooth loop)
      for (let n = 0; n <= 10; n++) {
        const num = document.createElement('div');
        num.className = 'reel__number';
        num.textContent = n % 10;
        strip.appendChild(num);
      }

      viewport.appendChild(strip);
      reel.appendChild(viewport);
      this.container.appendChild(reel);
      this.reels.push({ element: reel, strip, currentNumber: 0 });
    }
  }

  setParticipants(participants) {
    this.participants = [...participants];
  }

  getParticipants() {
    return [...this.participants];
  }

  displayInitialState() {
    // Show zeros initially
    this.reels.forEach(reel => {
      this.setReelNumber(reel, 0);
    });
  }

  setReelNumber(reel, number) {
    const offset = number * 160; // Each number is 160px tall (card style)
    reel.strip.style.transform = `translateY(-${offset}px)`;
    reel.strip.style.transition = 'transform 0.3s ease-out';
    reel.currentNumber = number;
  }

  setReelNumberInstant(reel, number) {
    const offset = number * 160;
    reel.strip.style.transition = 'none';
    reel.strip.style.transform = `translateY(-${offset}px)`;
    reel.currentNumber = number;
  }

  // Generate a random 6-digit display
  generateRandomDisplay() {
    return Array(this.reelCount).fill(0).map(() => Math.floor(Math.random() * 10));
  }

  // Parse participant ID into array of digits (pad with zeros if needed)
  parseIdToDigits(id) {
    const digits = String(id).replace(/\D/g, '').slice(-this.reelCount);
    const paddedDigits = digits.padStart(this.reelCount, '0');
    return paddedDigits.split('').map(d => parseInt(d, 10));
  }

  // Start spinning continuously until stop() is called
  startSpin() {
    if (this.isSpinning || this.participants.length === 0) return false;

    this.isSpinning = true;
    this.stopRequested = false;
    this.pendingWinner = null;

    // Start all reels spinning
    this.reels.forEach(reel => {
      reel.element.classList.add('reel--spinning');
      reel.element.classList.remove('reel--stopped');
    });

    // Update winner name display
    if (this.winnerNameEl) {
      this.winnerNameEl.textContent = '...';
      this.winnerNameEl.classList.remove('winner-name--highlight');
    }

    // Let CSS animation handle the spinning visual
    // Just check for stop request
    const checkStop = () => {
      if (this.stopRequested) {
        this.finishSpin();
        return;
      }
      this.animationId = requestAnimationFrame(checkStop);
    };

    this.animationId = requestAnimationFrame(checkStop);
    return true;
  }

  // Stop spinning and reveal winner
  stop() {
    if (!this.isSpinning || this.stopRequested) return null;

    this.stopRequested = true;

    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * this.participants.length);
    this.pendingWinner = this.participants[winnerIndex];

    return this.pendingWinner;
  }

  // Finish the spin animation with staggered reel stops
  finishSpin() {
    if (!this.pendingWinner) return;

    const targetDigits = this.parseIdToDigits(this.pendingWinner.id);
    const staggerDelay = 200; // Delay between each reel stopping

    // Stop reels one by one
    this.reels.forEach((reel, i) => {
      setTimeout(() => {
        reel.element.classList.remove('reel--spinning');
        reel.element.classList.add('reel--stopped');
        this.setReelNumber(reel, targetDigits[i]);

        // Play reel stop sound
        audioManager.playReelStop(i);

        // After last reel stops, show winner
        if (i === this.reels.length - 1) {
          setTimeout(() => {
            this.isSpinning = false;
            this.currentWinner = this.pendingWinner;

            // Show winner name
            if (this.winnerNameEl) {
              this.winnerNameEl.textContent = this.pendingWinner.name;
              this.winnerNameEl.classList.add('winner-name--highlight');
            }

            // Dispatch event for draw manager
            this.container.dispatchEvent(new CustomEvent('spinComplete', {
              detail: { winner: this.pendingWinner }
            }));
          }, 300);
        }
      }, i * staggerDelay);
    });
  }

  // Display a specific ID on the reels
  displayId(id) {
    const digits = this.parseIdToDigits(id);
    this.reels.forEach((reel, i) => {
      this.setReelNumber(reel, digits[i]);
    });
  }

  // Get the currently displayed ID
  getDisplayedId() {
    return this.reels.map(r => r.currentNumber).join('');
  }

  removeParticipant(id) {
    const index = this.participants.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.participants.splice(index, 1);
    return true;
  }

  addParticipant(participant) {
    if (this.participants.some(p => p.id === participant.id)) {
      return false;
    }
    this.participants.push(participant);
    return true;
  }

  hasParticipants() {
    return this.participants.length > 0;
  }

  getParticipantCount() {
    return this.participants.length;
  }

  // Get pending winner (for confirmation flow)
  getPendingWinner() {
    return this.pendingWinner;
  }

  // Clear pending winner
  clearPendingWinner() {
    this.pendingWinner = null;
  }

  // Reset display
  reset() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.isSpinning = false;
    this.stopRequested = false;
    this.displayInitialState();
    if (this.winnerNameEl) {
      this.winnerNameEl.textContent = i18n.t('pressToStart');
      this.winnerNameEl.classList.remove('winner-name--highlight');
    }
    this.pendingWinner = null;
    this.currentWinner = null;
    this.reels.forEach(reel => {
      reel.element.classList.remove('reel--spinning', 'reel--stopped');
    });
  }
}
