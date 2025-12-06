// carousel.js - Card carousel rendering & slot machine animation

export class Carousel {
  constructor(containerId, participants = []) {
    this.container = document.getElementById(containerId);
    this.participants = [...participants];
    this.visibleCount = 5;
    this.isSpinning = false;
    this.currentIndex = 0;
    this.cards = [];
  }

  setParticipants(participants) {
    this.participants = [...participants];
    if (this.currentIndex >= this.participants.length) {
      this.currentIndex = 0;
    }
    this.render();
  }

  getParticipants() {
    return [...this.participants];
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = '';
    this.cards = [];

    if (this.participants.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'carousel__empty';
      empty.textContent = 'No participants';
      this.container.appendChild(empty);
      return;
    }

    // Create card elements for visible slots
    for (let i = 0; i < this.visibleCount; i++) {
      const card = document.createElement('div');
      card.className = 'carousel__card';
      if (i === Math.floor(this.visibleCount / 2)) {
        card.classList.add('carousel__card--center');
      }

      // Create child elements for id and name (safe from XSS)
      const idSpan = document.createElement('span');
      idSpan.className = 'carousel__card-id';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'carousel__card-name';

      card.appendChild(idSpan);
      card.appendChild(nameSpan);
      this.container.appendChild(card);
      this.cards.push(card);
    }

    this.updateCards();
  }

  updateCards() {
    const len = this.participants.length;
    if (len === 0) return;

    this.cards.forEach((card, i) => {
      const offset = i - Math.floor(this.visibleCount / 2);
      const idx = ((this.currentIndex + offset) % len + len) % len;
      const participant = this.participants[idx];

      if (participant) {
        // Use textContent for safe DOM updates (prevents XSS)
        const idSpan = card.querySelector('.carousel__card-id');
        const nameSpan = card.querySelector('.carousel__card-name');
        if (idSpan) idSpan.textContent = participant.id;
        if (nameSpan) nameSpan.textContent = participant.name;
      }
    });
  }

  async spin(duration = 4000) {
    if (this.isSpinning || this.participants.length === 0) return null;

    this.isSpinning = true;
    this.container.classList.add('carousel--spinning');

    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * this.participants.length);

    // Calculate total rotations for animation effect
    // More rotations = more dramatic spin
    const minRotations = 3; // Minimum full cycles
    const totalSteps = (minRotations * this.participants.length) + winnerIndex;

    const startTime = performance.now();
    let lastIndex = this.currentIndex;

    return new Promise(resolve => {
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: cubic ease-out for natural deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentStep = Math.floor(eased * totalSteps);

        // Only update if we've moved to a new card
        const newIndex = currentStep % this.participants.length;
        if (newIndex !== lastIndex) {
          this.currentIndex = newIndex;
          this.updateCards();
          lastIndex = newIndex;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure we land exactly on the winner
          this.currentIndex = winnerIndex;
          this.updateCards();

          this.isSpinning = false;
          this.container.classList.remove('carousel--spinning');
          this.container.classList.add('carousel--winner');

          // Remove winner highlight after delay
          setTimeout(() => {
            this.container.classList.remove('carousel--winner');
          }, 2000);

          resolve(this.participants[winnerIndex]);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  removeParticipant(id) {
    const index = this.participants.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.participants.splice(index, 1);

    // Adjust currentIndex if needed
    if (this.participants.length === 0) {
      this.currentIndex = 0;
    } else if (this.currentIndex >= this.participants.length) {
      this.currentIndex = this.participants.length - 1;
    }

    this.render();
    return true;
  }

  addParticipant(participant) {
    // Avoid duplicates
    if (this.participants.some(p => p.id === participant.id)) {
      return false;
    }
    this.participants.push(participant);
    this.render();
    return true;
  }

  hasParticipants() {
    return this.participants.length > 0;
  }

  getParticipantCount() {
    return this.participants.length;
  }
}
