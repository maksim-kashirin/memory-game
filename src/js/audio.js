export class AudioManager {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
    this.activeNodes = new Set();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.stopAll();
  }

  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
      if (this.context.state === 'suspended') this.context.resume();
    } catch {
      this.context = null;
    }
  }

  stopAll() {
    for (const node of this.activeNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    this.activeNodes.clear();
  }

  play(type) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    this.stopAll();
    const patterns = {
      flip: [[520, 0, 0.07]],
      mismatch: [[260, 0, 0.1], [210, 0.1, 0.13]],
      match: [[520, 0, 0.1], [660, 0.09, 0.12], [780, 0.18, 0.16]],
      win: [[523, 0, 0.16], [659, 0.15, 0.16], [784, 0.3, 0.2], [1047, 0.48, 0.3]],
    };
    for (const [frequency, offset, duration] of patterns[type] ?? []) this.#tone(frequency, offset, duration);
  }

  #tone(frequency, offset, duration) {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.11, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + duration + 0.02);
    this.activeNodes.add(oscillator);
    oscillator.addEventListener('ended', () => this.activeNodes.delete(oscillator), { once: true });
  }
}
