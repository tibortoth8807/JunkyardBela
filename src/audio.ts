/** Synthesized sound effects (Web Audio API) - no audio files. */
export type SoundName = 'click' | 'wrench' | 'clunk' | 'glass' | 'bang' | 'cash' | 'nope' | 'crush' | 'win';

export class Sounds {
  muted = false;
  private ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    void this.ctx?.resume();
  }

  play(name: SoundName): void {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'click':
        this.tone(700, now, 0.04, 'square', 0.05);
        break;
      case 'wrench':
        for (let i = 0; i < 3; i++) this.noise(now + i * 0.035, 0.025, 4500, 0.22);
        this.tone(1300 + Math.random() * 400, now, 0.06, 'triangle', 0.06);
        break;
      case 'clunk':
        this.tone(120, now, 0.25, 'sine', 0.5, 55);
        this.noise(now, 0.12, 900, 0.35);
        break;
      case 'glass':
        for (let i = 0; i < 6; i++) this.tone(2500 + Math.random() * 3000, now + i * 0.03, 0.12, 'triangle', 0.08);
        this.noise(now, 0.25, 7000, 0.3);
        break;
      case 'bang':
        this.noise(now, 0.6, 1500, 0.9);
        this.tone(80, now, 0.5, 'sine', 0.7, 35);
        break;
      case 'cash':
        this.tone(1568, now, 0.09, 'square', 0.07);
        this.tone(2093, now + 0.08, 0.25, 'square', 0.07);
        break;
      case 'nope':
        this.tone(200, now, 0.15, 'sawtooth', 0.09, 150);
        break;
      case 'crush':
        this.noise(now, 1.4, 500, 0.6);
        this.tone(60, now, 1.4, 'sawtooth', 0.15, 35);
        for (let i = 0; i < 5; i++) this.noise(now + 0.2 + i * 0.22, 0.08, 3000, 0.35);
        break;
      case 'win':
        [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, now + i * 0.11, 0.28, 'square', 0.08));
        break;
    }
  }

  private tone(freq: number, start: number, duration: number, type: OscillatorType, volume: number, endFreq?: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private noise(start: number, duration: number, cutoff: number, volume: number): void {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(start);
  }
}
