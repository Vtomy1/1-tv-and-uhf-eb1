/**
 * Tactical Web Audio Synthesizer for Emergency Band Radio Scanners
 * Generates RF white noise, squelch gating, squelch tails, EAS alert tones,
 * 2-tone paging tones, Roger beeps, and filtered radio speech synthesis.
 */

class RadioAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private radioFilter: BiquadFilterNode | null = null;
  private isInitialized = false;
  private isMuted = false;
  private currentVolume = 0.7;

  public init() {
    if (this.isInitialized && this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Communications bandpass filter (300Hz - 3200Hz voice frequency standard)
      this.radioFilter = this.ctx.createBiquadFilter();
      this.radioFilter.type = 'bandpass';
      this.radioFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.radioFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);
      this.radioFilter.connect(this.masterGain);

      // Noise generator for receiver RF static
      this.startNoiseFloor();
      this.isInitialized = true;
    } catch {
      // AudioContext unavailable in environment
    }
  }

  private startNoiseFloor() {
    if (!this.ctx || !this.radioFilter) return;

    // Create 2 seconds of pink/white RF static buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filtering for warm analog receiver static
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.1) * 0.15;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime); // Closed squelch initially

    this.noiseNode.connect(this.noiseGain);
    this.noiseGain.connect(this.radioFilter);
    this.noiseNode.start(0);
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : this.currentVolume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : this.currentVolume,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  public updateSquelchGate(hasSignal: boolean, squelchThreshold: number, signalRssi: number) {
    if (!this.ctx || !this.noiseGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Convert squelch threshold (0-100) to equivalent dBm (-115 to -50)
    const squelchDbm = -115 + (squelchThreshold / 100) * 65;

    // Squelch is OPEN if either threshold is at minimum (open squelch static)
    // or received signal is stronger than squelch threshold
    const isOpen = squelchThreshold < 5 || (hasSignal && signalRssi >= squelchDbm);

    let targetGain = 0;
    if (isOpen) {
      if (!hasSignal) {
        // Open squelch with no carrier = full receiver white noise
        targetGain = 0.18;
      } else {
        // Carrier present: background hash decreases as SNR improves
        const snrRatio = Math.max(0, Math.min(1, (signalRssi - squelchDbm) / 30));
        targetGain = 0.02 * (1 - snrRatio);
      }
    }

    this.noiseGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
  }

  /**
   * Play classic "squelch tail" burst when a transmission carrier drops
   */
  public playSquelchTail() {
    if (!this.ctx || !this.radioFilter || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Quick burst of high-frequency hash
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
      }

      const tailSource = this.ctx.createBufferSource();
      tailSource.buffer = buffer;

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      tailSource.connect(gain);
      gain.connect(this.radioFilter);
      tailSource.start(now);
    } catch {
      // Ignore
    }
  }

  /**
   * Play Motorola standard Roger Beep
   */
  public playRogerBeep() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1560, now);
      osc.frequency.setValueAtTime(1840, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  /**
   * Play Fire / EMS Quik-Call II 2-Tone alert paging tones
   */
  public playTwoToneAlert(toneA = 645.7, toneB = 855.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Tone A for 0.7 sec
      osc.frequency.setValueAtTime(toneA, now);
      // Tone B for 1.2 sec
      osc.frequency.setValueAtTime(toneB, now + 0.7);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.setValueAtTime(0.3, now + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.95);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.0);
    } catch {
      // Ignore
    }
  }

  /**
   * Play EAS (Emergency Alert System) 1050 Hz attention siren or SAME dual tone (853 Hz + 960 Hz)
   */
  public playEasAlertTone(durationSec = 2.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // FSK Header burst simulation (SAME preamble 1562.5 / 2083.3 Hz chirps)
      const chirpOsc = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      chirpOsc.type = 'square';
      chirpOsc.frequency.setValueAtTime(1562.5, now);
      chirpGain.gain.setValueAtTime(0.12, now);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      chirpOsc.connect(chirpGain);
      chirpGain.connect(this.masterGain);
      chirpOsc.start(now);
      chirpOsc.stop(now + 0.38);

      // EAS Dual Alert Siren: 853 Hz and 960 Hz combined
      const alertStart = now + 0.4;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const sirenGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(853, alertStart);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(960, alertStart);

      sirenGain.gain.setValueAtTime(0.22, alertStart);
      sirenGain.gain.setValueAtTime(0.22, alertStart + durationSec - 0.1);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, alertStart + durationSec);

      osc1.connect(sirenGain);
      osc2.connect(sirenGain);
      sirenGain.connect(this.masterGain);

      osc1.start(alertStart);
      osc2.start(alertStart);
      osc1.stop(alertStart + durationSec + 0.05);
      osc2.stop(alertStart + durationSec + 0.05);
    } catch {
      // Ignore
    }
  }

  /**
   * Synthesize real radio voice dispatch using SpeechSynthesis
   */
  public speakTransmission(text: string, onEnd?: () => void) {
    if (this.isMuted || !window.speechSynthesis) {
      if (onEnd) setTimeout(onEnd, 1500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // Quick, professional dispatcher tempo
      utterance.pitch = 0.95; // Crisp command tone

      // Try picking an English voice
      const voices = window.speechSynthesis.getVoices();
      const radioVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Guy') || v.name.includes('Zira') || v.name.includes('David')));
      if (radioVoice) {
        utterance.voice = radioVoice;
      }

      utterance.onend = () => {
        this.playRogerBeep();
        this.playSquelchTail();
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stopSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new RadioAudioEngine();
