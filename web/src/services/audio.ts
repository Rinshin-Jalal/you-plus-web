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

  // Achievement/milestone celebration sound - triumphant rising tone
  playMilestone() {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
      const t = this.ctx.currentTime;
      
      // Rising arpeggio - 3 quick notes
      const frequencies = [440, 554, 659]; // A4, C#5, E5 (A major chord)
      
      frequencies.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.connect(gain);
        gain.connect(this.gainNode!);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.1);
        
        gain.gain.setValueAtTime(0, t + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
        
        osc.start(t + i * 0.1);
        osc.stop(t + i * 0.1 + 0.3);
      });
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  // Transition whoosh sound - subtle movement indicator
  playWhoosh() {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
      const t = this.ctx.currentTime;
      
      // White noise burst with filter sweep
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      
      noise.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
      filter.Q.value = 1;
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode);
      
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      
      noise.start(t);
      noise.stop(t + 0.2);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  // Deep resonant tone for breather/reflection moments
  playDeepTone() {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t); // Low A2
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.3);
      gain.gain.setValueAtTime(0.1, t + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      
      osc.start(t);
      osc.stop(t + 1.5);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  // Quick success tick - for completing individual questions
  playTick() {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  // Speed bonus power-up sound
  playPowerUp() {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);
      
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      
      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  // Pillar complete - satisfying completion sound
  playPillarComplete() {
    if (!this.ctx || this.ctx.state === 'suspended') {
      this.init();
      if (!this.ctx || this.ctx.state === 'suspended') return;
    }
    
    if (!this.gainNode) return;

    try {
      const t = this.ctx.currentTime;
      
      // Two-tone completion chime
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();
      
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(this.gainNode);
      gain2.connect(this.gainNode);
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(523, t); // C5
      osc2.frequency.setValueAtTime(659, t + 0.1); // E5
      
      gain1.gain.setValueAtTime(0.12, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.setValueAtTime(0.12, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      
      osc1.start(t);
      osc1.stop(t + 0.3);
      osc2.start(t + 0.1);
      osc2.stop(t + 0.4);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }
}

export const audioService = new AudioService();
