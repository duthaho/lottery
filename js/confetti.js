// confetti.js - Canvas-based confetti celebration

export class Confetti {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn('Confetti canvas not found');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.animationId = null;

    // Festive colors
    this.colors = [
      '#f59e0b', // amber
      '#3b82f6', // blue
      '#22c55e', // green
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316'  // orange
    ];

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 12 + 8;

    return {
      x,
      y,
      size: Math.random() * 12 + 6,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 10, // Initial upward bias
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity: 0.25,
      friction: 0.99,
      opacity: 1,
      fadeSpeed: 0.008 + Math.random() * 0.005,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    };
  }

  burst(x = this.canvas.width / 2, y = this.canvas.height / 2, count = 100) {
    if (!this.canvas) return;

    // Create particles
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(x, y));
    }

    // Start animation if not already running
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  animate() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.fadeSpeed;

      // Remove dead particles
      if (p.opacity <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      // Draw
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // Continue animation
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.isRunning = false;
      this.animationId = null;
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isRunning = false;
    this.particles = [];
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
