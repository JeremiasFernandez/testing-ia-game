import soundtrackUrl from '@/sounds/Soundtrack.mp3';

class SoundManager {
  private enabled = true;
  private bgmEnabled = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('soundEnabled') !== 'false';
      this.bgmEnabled = localStorage.getItem('bgmEnabled') === 'true';
      if (this.bgmEnabled) {
        this.ensureBgm();
        this.playBgm();
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', String(enabled));

    if (!enabled) {
      this.pauseBgm();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setBgmEnabled(on: boolean) {
    this.bgmEnabled = on;
    localStorage.setItem('bgmEnabled', String(on));
    if (!this.enabled) return;
    if (on) {
      this.ensureBgm();
      this.playBgm();
    } else {
      this.pauseBgm();
    }
  }

  isBgmEnabled() {
    return this.bgmEnabled;
  }

  // Sonido de victoria (melodía simple)
  playVictory() {
    if (!this.enabled) return;
    this.playTone(523, 100); // DO
    setTimeout(() => this.playTone(659, 100), 150); // MI
    setTimeout(() => this.playTone(784, 200), 300); // SOL
  }

  // Sonido de derrota
  playDefeat() {
    if (!this.enabled) return;
    this.playTone(392, 150); // SOL
    setTimeout(() => this.playTone(349, 300), 150); // FA
  }

  // Sonido de subida de nivel
  playLevelUp() {
    if (!this.enabled) return;
    this.playTone(523, 100); // DO
    setTimeout(() => this.playTone(659, 100), 120); // MI
    setTimeout(() => this.playTone(784, 100), 240); // SOL
    setTimeout(() => this.playTone(1047, 200), 360); // DO alto
  }

  // Sonido de torneo ganado
  playTournamentWin() {
    if (!this.enabled) return;
    [523, 659, 784, 1047, 784, 659].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 150), i * 180);
    });
  }

  // Background music
  private ensureBgm() {
    if (this.bgmAudio) return;
    if (typeof window === 'undefined') return;
    this.bgmAudio = new Audio(soundtrackUrl);
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.35;
  }

  private playBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.play().catch(() => {});
  }

  private pauseBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
  }

  private playTone(frequency: number, duration: number) {
    if (!this.enabled || typeof window === 'undefined') return;
    
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      // Audio context no disponible
    }
  }
}

export const soundManager = new SoundManager();
