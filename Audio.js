class AudioController {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Chain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.4;

        // Tape Warble Effect (Global)
        this.warbleDelay = this.ctx.createDelay();
        this.warbleDelay.delayTime.value = 0.01; // 10ms base
        this.warbleLFO = this.ctx.createOscillator();
        this.warbleLFO.frequency.value = 0.5; // Slow drift
        this.warbleGain = this.ctx.createGain();
        this.warbleGain.gain.value = 0.0005; // Subtle pitch shift

        this.warbleLFO.connect(this.warbleGain);
        this.warbleGain.connect(this.warbleDelay.delayTime);
        this.warbleLFO.start();

        // Connect Chain: Master -> Warble -> Destination
        this.masterGain.connect(this.warbleDelay);
        this.warbleDelay.connect(this.ctx.destination);

        // Engine State
        this.engineSource = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.enginePanner = null;

        // Phasing Effect
        this.phaserDelay = null;
        this.phaserLFO = null;
        this.phaserGain = null;

        // Idle Beep State
        this.idleBeepTimer = null;
    }

    // Helper: Pink Noise Generator
    createPinkNoise() {
        const bufferSize = 4096;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }
        return buffer;
    }

    initEngine() {
        // 1. Pink Noise Source
        this.engineSource = this.ctx.createBufferSource();
        this.engineSource.buffer = this.createPinkNoise();
        this.engineSource.loop = true;

        // 2. Lowpass Filter (Engine Tone)
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.Q.value = 1;
        this.engineFilter.frequency.value = 200; // Start very muffled

        // 3. Phaser / Flanger Effect (The "Jet" sound)
        this.phaserDelay = this.ctx.createDelay();
        this.phaserDelay.delayTime.value = 0.005; // 5ms base

        this.phaserLFO = this.ctx.createOscillator();
        this.phaserLFO.frequency.value = 0.2; // Slow sweep
        this.phaserGain = this.ctx.createGain();
        this.phaserGain.gain.value = 0.002; // Modulation depth

        this.phaserLFO.connect(this.phaserGain);
        this.phaserGain.connect(this.phaserDelay.delayTime);
        this.phaserLFO.start();

        // 4. Panner
        this.enginePanner = this.ctx.createStereoPanner();
        this.enginePanner.pan.value = 0;

        // 5. Gain
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0.2;

        // Routing: Noise -> Filter -> Split (Dry + Phaser) -> Panner -> Master
        this.engineSource.connect(this.engineFilter);

        // Dry path
        this.engineFilter.connect(this.enginePanner);

        // Wet path (Phaser)
        this.engineFilter.connect(this.phaserDelay);
        this.phaserDelay.connect(this.enginePanner);

        this.enginePanner.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        this.engineSource.start();
    }

    updateEngine(speedRatio, panX, isIdle = false) {
        if (!this.engineSource) return;

        const now = this.ctx.currentTime;

        if (isIdle) {
            // Faint, muffled idle sound
            this.engineFilter.frequency.setTargetAtTime(100, now, 0.5); // Very low cutoff
            this.engineGain.gain.setTargetAtTime(0.05, now, 0.5); // Very quiet
            this.enginePanner.pan.setTargetAtTime(0, now, 0.5);
            this.phaserLFO.frequency.setTargetAtTime(0.1, now, 0.5); // Slow phaser
        } else {
            // Active gameplay sound
            // Filter opens up with speed (Wind/Engine noise)
            const cutoff = 200 + (speedRatio * 800);
            this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.1);

            // Volume up
            this.engineGain.gain.setTargetAtTime(0.2, now, 0.1);

            // Panning
            this.enginePanner.pan.setTargetAtTime(panX * 0.8, now, 0.1);

            // Phaser Intensity based on turning (Stronger phasing when banking)
            const turnAmount = Math.abs(panX);
            const lfoRate = 0.2 + (turnAmount * 2.0); // Faster sweep when turning
            this.phaserLFO.frequency.setTargetAtTime(lfoRate, now, 0.1);
        }
    }

    startIdleBeep() {
        if (this.idleBeepTimer) return;

        const playDoubleBeep = () => {
            const t = this.ctx.currentTime;

            // Beep 1
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.value = 250; // Low urging beep

            gain1.gain.setValueAtTime(0, t);
            gain1.gain.linearRampToValueAtTime(0.15, t + 0.05);
            gain1.gain.linearRampToValueAtTime(0, t + 0.15);

            osc1.connect(gain1);
            gain1.connect(this.masterGain);

            osc1.start(t);
            osc1.stop(t + 0.15);

            // Beep 2 (shortly after)
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();

            osc2.type = 'sine';
            osc2.frequency.value = 250;

            gain2.gain.setValueAtTime(0, t + 0.2);
            gain2.gain.linearRampToValueAtTime(0.15, t + 0.25);
            gain2.gain.linearRampToValueAtTime(0, t + 0.35);

            osc2.connect(gain2);
            gain2.connect(this.masterGain);

            osc2.start(t + 0.2);
            osc2.stop(t + 0.35);
        };

        playDoubleBeep(); // Play immediately
        // Total cycle: 0.35s (double beep) + 0.8s (silence) = 1.15s
        this.idleBeepTimer = setInterval(playDoubleBeep, 1150);
    }

    stopIdleBeep() {
        if (this.idleBeepTimer) {
            clearInterval(this.idleBeepTimer);
            this.idleBeepTimer = null;
        }
    }

    playShoot() {
        const t = this.ctx.currentTime;

        // Osc 1: Main Tone
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(880, t);
        osc1.frequency.exponentialRampToValueAtTime(110, t + 0.2);

        // Osc 2: Detuned Harmony (Thicker sound)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(890, t); // Slight detune
        osc2.frequency.exponentialRampToValueAtTime(115, t + 0.2);

        // Filter Envelope (Pew!)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start();
        osc2.start();
        osc1.stop(t + 0.2);
        osc2.stop(t + 0.2);
    }

    playEnemyHit() {
        // Small Explosion / Pop
        const t = this.ctx.currentTime;
        const duration = 0.3;

        // White Noise Burst
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Lowpass Sweep (Closing fast)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(50, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }

    playShipCrash() {
        // Deep Impact + Warning Beeps
        const t = this.ctx.currentTime;
        const duration = 2.5;

        // 1. Deep Impact (Sub Bass + Noise)
        // Sub Bass - Lower frequency to avoid "Tom drum" pitch drop
        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(60, t); // Start low
        sub.frequency.exponentialRampToValueAtTime(30, t + duration); // Stay low

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(1.0, t);
        subGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start();
        sub.stop(t + duration);

        // Noise Rumble
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t); // Lower cutoff
        filter.frequency.exponentialRampToValueAtTime(20, t + duration);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();

        // 2. Warning Beeps (3 beeps)
        // Beep 1
        this.playWarningBeep(t + 0.2);
        // Beep 2
        this.playWarningBeep(t + 0.6);
        // Beep 3
        this.playWarningBeep(t + 1.0);
    }

    playWarningBeep(startTime) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 400; // Low-mid warning tone

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
    }

    playExplosion() {
        this.playShipCrash();
    }

    playComboSound(comboCount) {
        // Casino-like Bell Sound - FM Synthesis
        const t = this.ctx.currentTime;

        // Base frequency C4 (261.63 Hz) - one octave lower
        // Rises by whole tone per combo level (starting from combo 2)
        // Whole tone = 2 semitones = ratio of 1.12246
        const baseFreq = 261.63;
        const freq = baseFreq * Math.pow(1.12246, (comboCount - 2) * 2);

        // Carrier (Bell tone)
        const carrier = this.ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.value = freq;

        // Modulator (Brightness)
        const modulator = this.ctx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.value = freq * 3.5; // Harmonic ratio

        const modGain = this.ctx.createGain();
        modGain.gain.setValueAtTime(200, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + 0.4);

        // Envelope
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(gain);
        gain.connect(this.masterGain);

        carrier.start(t);
        modulator.start(t);
        carrier.stop(t + 0.6);
        modulator.stop(t + 0.6);
    }

    playWaveComplete() {
        // Two quick beeps
        const t = this.ctx.currentTime;

        // Beep 1
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 880;

        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.3, t);
        gain1.gain.linearRampToValueAtTime(0, t + 0.1);

        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(t);
        osc1.stop(t + 0.1);

        // Beep 2
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 880;

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.3, t + 0.15);
        gain2.gain.linearRampToValueAtTime(0, t + 0.25);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.25);
    }

    playWaveCountdown() {
        // Short tick sound
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playWaveStart() {
        // Single louder beep
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }
}
