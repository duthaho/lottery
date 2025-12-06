// audio.js - Audio manager for sound effects and background music

const AUDIO_STORAGE_KEY = 'lottery_audio';

class AudioManager {
  constructor() {
    this.enabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.7;
    this.musicVolume = 0.3;

    // Audio elements cache
    this.sounds = {};
    this.bgMusic = null;

    // Spinning loop reference
    this.spinLoop = null;
    this.isSpinLoopPlaying = false;

    // Track if user has interacted (required for autoplay)
    this.userInteracted = false;

    // Load saved preferences
    this.loadPreferences();

    // Preload sounds
    this.preloadSounds();

    // Setup user interaction listener
    this.setupInteractionListener();
  }

  setupInteractionListener() {
    const enableAudio = () => {
      this.userInteracted = true;
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
  }

  // Preload all sound effects
  preloadSounds() {
    const soundFiles = {
      click: 'audio/game-click-s2.mp3',
      spinStart: 'audio/sm-spin.mp3',
      spinLoop: 'audio/sm-roller-loop.mp3',
      reelStop: 'audio/sm-bet.mp3',
      winner: 'audio/fanfare-winner.mp3',
      jackpot: 'audio/game-sm-jackpot-win.mp3',
      confetti: 'audio/game-tada.mp3',
      countdown: 'audio/game-countdown.mp3',
      turnOn: 'audio/sm-turnon.mp3',
      turnOff: 'audio/sm-turnoff.mp3',
      swoosh: 'audio/swoosh.mp3',
      levelUp: 'audio/game-levelup-s3.mp3'
    };

    for (const [name, src] of Object.entries(soundFiles)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = this.sfxVolume;
      this.sounds[name] = audio;
    }

    // Setup background music
    this.bgMusic = new Audio('audio/background.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.musicVolume;
    this.bgMusic.preload = 'auto';

    // Setup spin loop for continuous spinning sound
    this.spinLoop = this.sounds.spinLoop;
    if (this.spinLoop) {
      this.spinLoop.loop = true;
    }
  }

  // Play a sound effect
  playSound(name, options = {}) {
    if (!this.enabled || !this.userInteracted) return;

    const sound = this.sounds[name];
    if (!sound) return;

    // Clone the audio for overlapping sounds
    const audio = options.clone ? sound.cloneNode() : sound;
    audio.volume = this.sfxVolume * (options.volume || 1);
    audio.currentTime = 0;

    audio.play().catch(e => {
      // Ignore autoplay errors silently
    });

    return audio;
  }

  // Public methods for playing specific sounds
  playClick() {
    this.playSound('click', { volume: 0.5 });
  }

  playSpinStart() {
    this.playSound('spinStart');
    this.startSpinLoop();
  }

  startSpinLoop() {
    if (!this.enabled || !this.userInteracted || this.isSpinLoopPlaying) return;

    if (this.spinLoop) {
      this.spinLoop.volume = this.sfxVolume * 0.4;
      this.spinLoop.currentTime = 0;
      this.spinLoop.play().catch(() => {});
      this.isSpinLoopPlaying = true;
    }
  }

  stopSpinLoop() {
    if (this.spinLoop && this.isSpinLoopPlaying) {
      this.spinLoop.pause();
      this.spinLoop.currentTime = 0;
      this.isSpinLoopPlaying = false;
    }
  }

  playReelStop(reelIndex) {
    // Play with slight pitch/volume variation per reel
    const volume = 0.4 + (reelIndex * 0.1);
    this.playSound('reelStop', { volume, clone: true });

    // Stop loop after last reel
    if (reelIndex === 5) {
      setTimeout(() => this.stopSpinLoop(), 100);
    }
  }

  playWinner() {
    this.stopSpinLoop();
    this.playSound('winner');
  }

  playJackpot() {
    this.stopSpinLoop();
    this.playSound('jackpot');
  }

  playConfetti() {
    this.playSound('confetti', { volume: 0.6 });
  }

  playCountdown() {
    this.playSound('countdown');
  }

  playTurnOn() {
    this.playSound('turnOn', { volume: 0.5 });
  }

  playTurnOff() {
    this.playSound('turnOff', { volume: 0.5 });
  }

  playSwoosh() {
    this.playSound('swoosh', { volume: 0.4 });
  }

  playLevelUp() {
    this.playSound('levelUp', { volume: 0.6 });
  }

  // Background music methods
  playBackgroundMusic() {
    if (!this.musicEnabled || !this.bgMusic || !this.userInteracted) return;

    this.bgMusic.volume = this.musicVolume;
    this.bgMusic.play().catch(e => {
      // Autoplay blocked - will play after user interaction
    });
  }

  pauseBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  stopBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  // Volume and toggle controls
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopSpinLoop();
    }
    this.savePreferences();
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.pauseBackgroundMusic();
    } else if (this.userInteracted) {
      this.playBackgroundMusic();
    }
    this.savePreferences();
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update all sound volumes
    for (const sound of Object.values(this.sounds)) {
      sound.volume = this.sfxVolume;
    }
    this.savePreferences();
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgMusic) {
      this.bgMusic.volume = this.musicVolume;
    }
    this.savePreferences();
  }

  toggleSound() {
    const newState = !this.enabled;
    this.setEnabled(newState);

    // Play toggle sound feedback
    if (newState) {
      this.playTurnOn();
    }

    return newState;
  }

  toggleMusic() {
    const newState = !this.musicEnabled;
    this.setMusicEnabled(newState);
    return newState;
  }

  // Persistence
  savePreferences() {
    const prefs = {
      enabled: this.enabled,
      musicEnabled: this.musicEnabled,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume
    };
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(prefs));
  }

  loadPreferences() {
    try {
      const data = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (data) {
        const prefs = JSON.parse(data);
        this.enabled = prefs.enabled ?? true;
        this.musicEnabled = prefs.musicEnabled ?? true;
        this.sfxVolume = prefs.sfxVolume ?? 0.7;
        this.musicVolume = prefs.musicVolume ?? 0.3;
      }
    } catch (e) {
      console.warn('Failed to load audio preferences:', e);
    }
  }

  // Get current state for UI
  getState() {
    return {
      enabled: this.enabled,
      musicEnabled: this.musicEnabled,
      sfxVolume: this.sfxVolume,
      musicVolume: this.musicVolume
    };
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
