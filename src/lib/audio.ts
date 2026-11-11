/**
 * Procedural Web Audio API sound synthesizer.
 * 100% original procedural audio: never loads external copyrighted audio files and only activates after user interaction.
 */

export interface AudioSettings {
  muted: boolean;
  masterVolume: number; // 0..1
  crowdVolume: number; // 0..1
  sfxVolume: number; // 0..1
  uiVolume: number; // 0..1
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings = {
    muted: false,
    masterVolume: 0.7,
    crowdVolume: 0.65,
    sfxVolume: 0.8,
    uiVolume: 0.6,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ufm_audio_settings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.settings.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ufm_audio_settings', JSON.stringify(this.settings));
      } catch {
        // ignore
      }
    }
    return this.getSettings();
  }

  public playUiClick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const gainVal = this.settings.masterVolume * this.settings.uiVolume * 0.15;
    if (gainVal <= 0.001) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.045);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  }

  public playWhistle(long = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const gainVal = this.settings.masterVolume * this.settings.sfxVolume * 0.25;
    if (gainVal <= 0.001) return;

    const duration = long ? 0.65 : 0.25;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2850, ctx.currentTime);
    osc.frequency.setValueAtTime(2980, ctx.currentTime + duration * 0.4);
    osc.frequency.setValueAtTime(2790, ctx.currentTime + duration * 0.8);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  public playKick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const gainVal = this.settings.masterVolume * this.settings.sfxVolume * 0.3;
    if (gainVal <= 0.001) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  }

  public playGoalCheer(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const gainVal = this.settings.masterVolume * this.settings.crowdVolume * 0.35;
    if (gainVal <= 0.001) return;

    // Synthesize white noise filtered into a warm stadium crowd roar
    const bufferSize = ctx.sampleRate * 1.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = ((i * 9301 + 49297) % 233280) / 116640 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.5);
    filter.frequency.linearRampToValueAtTime(750, ctx.currentTime + 1.8);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 1.85);
  }
}

export const soundManager = new SoundManager();
