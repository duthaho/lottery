// winners.js - Winner tracking & display

import { i18n } from './i18n.js';

export class WinnerManager {
  constructor(tableBodyId, adminListId) {
    this.tableBodyElement = document.getElementById(tableBodyId);
    this.adminListElement = adminListId ? document.getElementById(adminListId) : null;
    this.winners = [];
    this.onReaddCallback = null;
  }

  addWinner(participant, prize) {
    const winner = {
      ...participant,
      prize: {
        id: prize.id,
        name: prize.name,
        name_vi: prize.name_vi,
        instance: prize.instance,
        quantity: prize.quantity
      },
      timestamp: Date.now()
    };
    this.winners.push(winner);
    this.render();
    return winner;
  }

  removeLastWinner() {
    if (this.winners.length === 0) return null;
    const removed = this.winners.pop();
    this.render();
    return removed;
  }

  removeWinnerById(participantId) {
    const index = this.winners.findIndex(w => w.id === participantId);
    if (index === -1) return null;
    const removed = this.winners.splice(index, 1)[0];
    this.render();
    return removed;
  }

  getWinners() {
    return [...this.winners];
  }

  getWinnerIds() {
    return this.winners.map(w => w.id);
  }

  getWinnersByPrize(prizeId) {
    return this.winners.filter(w => w.prize.id === prizeId);
  }

  setOnReadd(callback) {
    this.onReaddCallback = callback;
  }

  render() {
    // The table rendering is now handled by app.js renderResultsModal
    // This method is kept for compatibility
  }

  getPrizeDisplayName(prize) {
    const name = i18n.getPrizeName(prize);
    if (prize.quantity > 1 && prize.instance) {
      return `${name} #${prize.instance}`;
    }
    return name;
  }

  reset() {
    this.winners = [];
    this.render();
  }

  // For state persistence
  getState() {
    return {
      winners: this.winners
    };
  }

  loadState(state) {
    if (state.winners) {
      this.winners = state.winners;
      this.render();
    }
  }
}
