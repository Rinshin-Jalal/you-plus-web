class AudioService {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  init() {
    if (typeof window === 'undefined') return;
    
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
          this.ctx = new AudioContextClass();
          this.gainNode = this.ctx.createGain();
          this.gainNode.connect(this.ctx.destination);
      }
    }
    
    // Always try to resume if suspended (browsers block autoplay)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
          console.log("AudioContext resumed successfully");
      }).catch(err => {
          console.warn("AudioContext resume failed (waiting for gesture):", err);
      });
    }
  }

  playClick() {
    // If context isn't ready or suspended, try to init/resume but don't crash
    if (!this.ctx || this.ctx.state === 'suspended') {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;
    }

    if (!this.gainNode) return;

    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.gainNode);

        // High pitched, very short click (mechanical keyboard style)
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
        console.error("Audio error:", e);
    }
  }

  playBinauralBurst() {
     if (!this.ctx || this.ctx.state === 'suspended') {
        this.init();
        if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
        const t = this.ctx.currentTime;
        const duration = 0.3; // Short burst

        // Left Ear (200Hz)
        const oscL = this.ctx.createOscillator();
        const panL = this.ctx.createStereoPanner();
        const gainL = this.ctx.createGain();

        oscL.frequency.value = 200;
        panL.pan.value = -1;

        oscL.connect(gainL);
        gainL.connect(panL);
        panL.connect(this.gainNode);

        // Right Ear (240Hz) -> 40Hz Difference (Gamma)
        const oscR = this.ctx.createOscillator();
        const panR = this.ctx.createStereoPanner();
        const gainR = this.ctx.createGain();

        oscR.frequency.value = 240;
        panR.pan.value = 1;

        oscR.connect(gainR);
        gainR.connect(panR);
        panR.connect(this.gainNode);

        // Envelope (Swell and fade)
        gainL.gain.setValueAtTime(0, t);
        gainL.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gainL.gain.exponentialRampToValueAtTime(0.001, t + duration);

        gainR.gain.setValueAtTime(0, t);
        gainR.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gainR.gain.exponentialRampToValueAtTime(0.001, t + duration);

        oscL.start(t);
        oscL.stop(t + duration);
        oscR.start(t);
        oscR.stop(t + duration);
    } catch (e) {
        console.error("Audio error:", e);
    }
  }
}

export const audioService = new AudioService();
