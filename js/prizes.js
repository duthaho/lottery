// prizes.js - Prize list management

import { i18n } from './i18n.js';

export class PrizeManager {
  constructor(prizes = []) {
    // Store original prizes and expand by quantity
    this.originalPrizes = [...prizes];
    this.prizeQueue = this.buildPrizeQueue(prizes);
    this.currentIndex = 0;
  }

  // Build prize queue in reverse order (consolation first, grand prize last)
  buildPrizeQueue(prizes) {
    const queue = [];
    // Sort by id descending (higher id = lower priority prize)
    const sorted = [...prizes].sort((a, b) => b.id - a.id);

    for (const prize of sorted) {
      for (let i = 0; i < prize.quantity; i++) {
        queue.push({
          ...prize,
          instance: i + 1 // Track which instance (e.g., "Third Prize #2")
        });
      }
    }
    return queue;
  }

  setPrizes(prizes) {
    this.originalPrizes = [...prizes];
    this.prizeQueue = this.buildPrizeQueue(prizes);
    this.currentIndex = 0;
  }

  getCurrentPrize() {
    if (this.currentIndex >= this.prizeQueue.length) {
      return null;
    }
    return this.prizeQueue[this.currentIndex];
  }

  // Get display name for current prize
  getCurrentPrizeDisplay() {
    const prize = this.getCurrentPrize();
    if (!prize) return i18n.t('allPrizesAwarded');

    const name = i18n.getPrizeName(prize);
    // If there are multiple of this prize, show instance number
    if (prize.quantity > 1) {
      return `${name} #${prize.instance}`;
    }
    return name;
  }

  advanceToNextPrize() {
    if (this.currentIndex < this.prizeQueue.length) {
      this.currentIndex++;
    }
    return this.getCurrentPrize();
  }

  undoLastPrize() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.prizeQueue[this.currentIndex];
    }
    return null;
  }

  isComplete() {
    return this.currentIndex >= this.prizeQueue.length;
  }

  getTotalPrizes() {
    return this.prizeQueue.length;
  }

  getAwardedCount() {
    return this.currentIndex;
  }

  reset() {
    this.currentIndex = 0;
  }

  // For state persistence
  getState() {
    return {
      originalPrizes: this.originalPrizes,
      currentIndex: this.currentIndex
    };
  }

  loadState(state) {
    if (state.originalPrizes && Array.isArray(state.originalPrizes)) {
      this.originalPrizes = state.originalPrizes;
      this.prizeQueue = this.buildPrizeQueue(state.originalPrizes);
    }
    if (typeof state.currentIndex === 'number') {
      // Security: Ensure currentIndex is within valid bounds
      this.currentIndex = Math.max(0, Math.min(
        Math.floor(state.currentIndex), // Ensure integer
        this.prizeQueue.length
      ));
    }
  }
}
