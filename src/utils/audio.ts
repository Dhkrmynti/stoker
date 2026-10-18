class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  /**
   * Browsers keep audio silent until the visitor clicks, taps or types on the page. Call this
   * from such an event so later sounds (the whistle when a burn lands) can play.
   */
  public unlock() {
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      // no audio on this device
    }
  }

  /** Rapping on the firebox door: a shovel thunk and a little rattle, loud enough for laptop speakers. */
  public playPokeSound() {
    this.playTone(196, 'square', 0.08, 0.07);
    setTimeout(() => this.playTone(523.25, 'square', 0.06, 0.05), 70);
    setTimeout(() => this.playTone(392, 'square', 0.09, 0.05), 140);
  }

  public playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio might require user interaction first
    }
  }

  public playAccumulateSound() {
    this.playTone(440, 'sine', 0.1, 0.04);
  }

  public playClaimSound() {
    this.playTone(523.25, 'sine', 0.12, 0.08); // C5
    setTimeout(() => this.playTone(784, 'triangle', 0.22, 0.09), 100); // G5
  }

  public playBuybackSound() {
    this.playTone(659.25, 'triangle', 0.12, 0.08); // E5
    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.09), 90); // A5
    setTimeout(() => this.playTone(1174.66, 'triangle', 0.25, 0.11), 180); // D6
  }

  public playBurnSound() {
    this.playTone(180, 'sawtooth', 0.25, 0.14);
    setTimeout(() => this.playTone(120, 'square', 0.35, 0.12), 60);
    setTimeout(() => this.playTone(70, 'triangle', 0.45, 0.18), 140);
  }
}

export const sounds = new SoundController();
