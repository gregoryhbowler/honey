// Honey Synth Engine (Atlantix/SH-101-inspired)
// Modern Web Audio take on classic subtractive synthesis
// VCO A/B → Mixer → Filter → Drive → VCA with comprehensive modulation

export class HoneySynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.output.gain.value = 0.3;
        
        // === VCO A (Primary SH-101-style oscillator) ===
        this.vcoA = {
            sawOsc: ctx.createOscillator(),
            pulseOsc: ctx.createOscillator(),
            sawGain: ctx.createGain(),
            pulseGain: ctx.createGain(),
            octave: 0,
            fine: 0,
            pulseWidth: 0.5,
            pwmAmount: 0,
            pwmSource: 'lfo', // 'lfo' | 'env'
            fmAmount: 0
        };
        
        // Initialize VCO A oscillators
        this.vcoA.sawOsc.type = 'sawtooth';
        this.vcoA.pulseOsc.type = 'square';
        this.vcoA.sawGain.gain.value = 0.5;
        this.vcoA.pulseGain.gain.value = 0;
        
        // === VCO B (Secondary oscillator OR LFO) ===
        this.vcoB = {
            osc: ctx.createOscillator(),
            audioGain: ctx.createGain(),
            lfoGain: ctx.createGain(),
            mode: 'lfo', // 'audio' | 'lfo'
            shape: 'sine',
            octave: -1,
            fine: 0,
            level: 0.3,
            rate: 2 // LFO rate in Hz
        };
        
        this.vcoB.osc.type = 'sine';
        this.vcoB.osc.frequency.value = 2;
        this.vcoB.audioGain.gain.value = 0;
        this.vcoB.lfoGain.gain.value = 0;
        
        // === Sub Oscillator ===
        this.sub = {
            osc: ctx.createOscillator(),
            gain: ctx.createGain(),
            type: '-1', // '-1' (one octave) | '-2' (two octaves)
            level: 0
        };
        
        this.sub.osc.type = 'square';
        this.sub.gain.gain.value = 0;
        
        // === Noise Generator ===
        this.noise = {
            buffer: this.createNoiseBuffer(),
            source: null,
            gain: ctx.createGain(),
            level: 0
        };
        
        this.noise.gain.gain.value = 0;
        this.startNoiseSource();
        
        // === Mixer (sums all sources) ===
        this.mixer = ctx.createGain();
        this.mixer.gain.value = 0.4;
        
        // === Filter (24dB/oct resonant lowpass) ===
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 1000;
        this.filter.Q.value = 1;
        
        // Filter modulation amounts
        this.filterMod = {
            envAmount: 0,
            lfoAmount: 0,
            keyTrack: 0,
            envGain: ctx.createGain(),
            lfoGain: ctx.createGain()
        };
        
        this.filterMod.envGain.gain.value = 0;
        this.filterMod.lfoGain.gain.value = 0;
        
        // === ADSR Envelope ===
        this.envelope = {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.5,
            release: 0.5,
            rateRange: 'medium', // 'fast' | 'medium' | 'slow'
            attackMult: 1,
            decayMult: 1,
            releaseMult: 1
        };
        
        this.updateEnvelopeMultipliers();
        
        // Envelope followers for modulation
        this.envFollower = ctx.createGain();
        this.envFollower.gain.value = 0;
        
        // === Drive/Saturation ===
        this.drive = {
            shaper: ctx.createWaveShaper(),
            mode: 'off', // 'off' | 'sym' | 'asym'
            amount: 0.5
        };
        
        this.updateDriveCurve();
        
        // === VCA (Voltage Controlled Amplifier) ===
        this.vca = ctx.createGain();
        this.vca.gain.value = 0;
        
        // === PWM Modulation Setup ===
        this.pwmMod = {
            envGain: ctx.createGain(),
            lfoGain: ctx.createGain(),
            constantSource: ctx.createConstantSource()
        };
        
        this.pwmMod.envGain.gain.value = 0;
        this.pwmMod.lfoGain.gain.value = 0;
        this.pwmMod.constantSource.offset.value = 0.5;
        
        // === LFO Modulation Routing ===
        this.lfoMod = {
            pitchGain: ctx.createGain(),
            filterGain: ctx.createGain(),
            pwmGain: ctx.createGain(),
            ampGain: ctx.createGain(),
            pitchAmount: 0,
            filterAmount: 0,
            pwmAmount: 0,
            ampAmount: 0
        };
        
        this.lfoMod.pitchGain.gain.value = 0;
        this.lfoMod.filterGain.gain.value = 0;
        this.lfoMod.pwmGain.gain.value = 0;
        this.lfoMod.ampGain.gain.value = 0;
        
        // === Audio Routing ===
        // VCO A routing
        this.vcoA.sawOsc.connect(this.vcoA.sawGain);
        this.vcoA.pulseOsc.connect(this.vcoA.pulseGain);
        this.vcoA.sawGain.connect(this.mixer);
        this.vcoA.pulseGain.connect(this.mixer);
        
        // VCO B routing (will connect based on mode)
        this.vcoB.osc.connect(this.vcoB.audioGain);
        this.vcoB.osc.connect(this.vcoB.lfoGain);
        
        // Sub oscillator routing
        this.sub.osc.connect(this.sub.gain);
        this.sub.gain.connect(this.mixer);
        
        // Noise routing
        this.noise.gain.connect(this.mixer);
        
        // Main signal path
        this.mixer.connect(this.filter);
        this.filter.connect(this.drive.shaper);
        this.drive.shaper.connect(this.vca);
        this.vca.connect(this.output);
        
        // Connect envelope follower (for modulation)
        this.envFollower.connect(this.filterMod.envGain);
        this.envFollower.connect(this.pwmMod.envGain);
        
        // Connect LFO routing
        this.vcoB.lfoGain.connect(this.lfoMod.pitchGain);
        this.vcoB.lfoGain.connect(this.lfoMod.filterGain);
        this.vcoB.lfoGain.connect(this.lfoMod.pwmGain);
        this.vcoB.lfoGain.connect(this.lfoMod.ampGain);
        
        // Connect modulation to destinations
        this.lfoMod.pitchGain.connect(this.vcoA.sawOsc.frequency);
        this.lfoMod.pitchGain.connect(this.vcoA.pulseOsc.frequency);
        this.lfoMod.filterGain.connect(this.filter.frequency);
        this.lfoMod.ampGain.connect(this.vca.gain);
        
        this.filterMod.envGain.connect(this.filter.frequency);
        this.filterMod.lfoGain.connect(this.filter.frequency);
        
        // Start all oscillators
        this.vcoA.sawOsc.start();
        this.vcoA.pulseOsc.start();
        this.vcoB.osc.start();
        this.sub.osc.start();
        this.pwmMod.constantSource.start();
        
        // Store current frequency for pitch tracking
        this.currentFreq = 440;
        this.isNotePlaying = false;
    }
    
    /**
     * Create white noise buffer
     */
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
    
    /**
     * Start noise source (continuous)
     */
    startNoiseSource() {
        if (this.noise.source) {
            this.noise.source.stop();
        }
        
        this.noise.source = this.ctx.createBufferSource();
        this.noise.source.buffer = this.noise.buffer;
        this.noise.source.loop = true;
        this.noise.source.connect(this.noise.gain);
        this.noise.source.start();
    }
    
    /**
     * Update envelope time multipliers based on rate range
     */
    updateEnvelopeMultipliers() {
        switch(this.envelope.rateRange) {
            case 'fast':
                this.envelope.attackMult = 0.2;
                this.envelope.decayMult = 0.3;
                this.envelope.releaseMult = 0.3;
                break;
            case 'slow':
                this.envelope.attackMult = 3;
                this.envelope.decayMult = 2.5;
                this.envelope.releaseMult = 2.5;
                break;
            default: // 'medium'
                this.envelope.attackMult = 1;
                this.envelope.decayMult = 1;
                this.envelope.releaseMult = 1;
        }
    }
    
    /**
     * Update drive waveshaping curve
     */
    updateDriveCurve() {
        const amount = this.drive.amount;
        const mode = this.drive.mode;
        
        if (mode === 'off') {
            this.drive.shaper.curve = null;
            return;
        }
        
        const n_samples = 256;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < n_samples; i++) {
            const x = (i * 2) / n_samples - 1;
            let y;
            
            if (mode === 'sym') {
                // Symmetric soft clipping
                const k = amount * 50 + 1;
                y = (x * k) / (1 + Math.abs(x * k));
            } else {
                // Asymmetric clipping (more aggressive on positive)
                const k = amount * 30 + 1;
                if (x >= 0) {
                    y = Math.tanh(x * k * 1.5);
                } else {
                    y = Math.tanh(x * k * 0.8);
                }
            }
            
            curve[i] = y;
        }
        
        this.drive.shaper.curve = curve;
    }
    
    /**
     * Update VCO B mode and routing
     */
    updateVcoBMode() {
        if (this.vcoB.mode === 'audio') {
            // Audio mode: route to mixer, disconnect from LFO routing
            this.vcoB.audioGain.disconnect();
            this.vcoB.audioGain.connect(this.mixer);
            this.vcoB.audioGain.gain.value = this.vcoB.level;
            this.vcoB.lfoGain.gain.value = 0;
            
            // Set to audio rate
            const freq = this.currentFreq * Math.pow(2, this.vcoB.octave) * 
                         Math.pow(2, this.vcoB.fine / 1200);
            this.vcoB.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        } else {
            // LFO mode: disconnect from mixer, enable LFO routing
            this.vcoB.audioGain.disconnect();
            this.vcoB.audioGain.gain.value = 0;
            this.vcoB.lfoGain.gain.value = 1;
            
            // Set to LFO rate
            this.vcoB.osc.frequency.setValueAtTime(this.vcoB.rate, this.ctx.currentTime);
        }
    }
    
    /**
     * Trigger a note on with click-free envelope
     * @param {number} freq - Frequency in Hz
     * @param {number} velocity - Note velocity (0-1)
     */
    noteOn(freq, velocity = 1) {
        const now = this.ctx.currentTime;
        this.currentFreq = freq;
        this.isNotePlaying = true;
        
        // Calculate VCO A frequencies
        const vcoAFreq = freq * Math.pow(2, this.vcoA.octave) * 
                        Math.pow(2, this.vcoA.fine / 1200);
        
        // Update VCO A frequencies with small ramp to avoid clicks
        this.vcoA.sawOsc.frequency.setTargetAtTime(vcoAFreq, now, 0.001);
        this.vcoA.pulseOsc.frequency.setTargetAtTime(vcoAFreq, now, 0.001);
        
        // Update sub oscillator frequency
        const subOctaveShift = this.sub.type === '-2' ? -2 : -1;
        const subFreq = freq * Math.pow(2, subOctaveShift);
        this.sub.osc.frequency.setTargetAtTime(subFreq, now, 0.001);
        
        // Update VCO B if in audio mode
        if (this.vcoB.mode === 'audio') {
            const vcoBFreq = freq * Math.pow(2, this.vcoB.octave) * 
                            Math.pow(2, this.vcoB.fine / 1200);
            this.vcoB.osc.frequency.setTargetAtTime(vcoBFreq, now, 0.001);
        }
        
        // Setup LFO modulation depths
        this.lfoMod.pitchGain.gain.setValueAtTime(
            this.lfoMod.pitchAmount * vcoAFreq * 0.05,
            now
        );
        this.lfoMod.filterGain.gain.setValueAtTime(
            this.lfoMod.filterAmount * 1000,
            now
        );
        this.lfoMod.pwmGain.gain.setValueAtTime(
            this.lfoMod.pwmAmount * 0.4,
            now
        );
        this.lfoMod.ampGain.gain.setValueAtTime(
            this.lfoMod.ampAmount * 0.2,
            now
        );
        
        // Get current VCA gain for smooth attack from current level
        const currentGain = this.vca.gain.value;
        
        // Apply envelope times with rate multiplier
        const attack = Math.max(0.003, this.envelope.attack * this.envelope.attackMult);
        const decay = Math.max(0.01, this.envelope.decay * this.envelope.decayMult);
        
        // Cancel scheduled values and set current value
        this.vca.gain.cancelScheduledValues(now);
        this.vca.gain.setValueAtTime(currentGain, now);
        
        // Attack phase
        this.vca.gain.linearRampToValueAtTime(velocity, now + attack);
        
        // Decay to sustain level
        this.vca.gain.linearRampToValueAtTime(
            velocity * this.envelope.sustain,
            now + attack + decay
        );
        
        // Envelope follower for modulation (tracks VCA envelope)
        this.envFollower.gain.cancelScheduledValues(now);
        this.envFollower.gain.setValueAtTime(this.envFollower.gain.value, now);
        this.envFollower.gain.linearRampToValueAtTime(1, now + attack);
        this.envFollower.gain.linearRampToValueAtTime(
            this.envelope.sustain,
            now + attack + decay
        );
        
        // Apply filter envelope modulation
        const filterBase = this.filter.frequency.value;
        const envToFilter = this.filterMod.envAmount;
        
        if (Math.abs(envToFilter) > 0.01) {
            const filterTarget = filterBase + (envToFilter * 3000);
            const filterSustain = filterBase + (envToFilter * 3000 * this.envelope.sustain);
            
            this.filterMod.envGain.gain.cancelScheduledValues(now);
            this.filterMod.envGain.gain.setValueAtTime(0, now);
            this.filterMod.envGain.gain.linearRampToValueAtTime(
                envToFilter * 3000,
                now + attack
            );
            this.filterMod.envGain.gain.linearRampToValueAtTime(
                envToFilter * 3000 * this.envelope.sustain,
                now + attack + decay
            );
        }
        
        // Apply PWM envelope modulation if selected
        if (this.vcoA.pwmSource === 'env' && this.vcoA.pwmAmount > 0) {
            this.pwmMod.envGain.gain.cancelScheduledValues(now);
            this.pwmMod.envGain.gain.setValueAtTime(0, now);
            this.pwmMod.envGain.gain.linearRampToValueAtTime(
                this.vcoA.pwmAmount * 0.4,
                now + attack
            );
            this.pwmMod.envGain.gain.linearRampToValueAtTime(
                this.vcoA.pwmAmount * 0.4 * this.envelope.sustain,
                now + attack + decay
            );
        }
    }
    
    /**
     * Trigger a note off with click-free release
     */
    noteOff() {
        const now = this.ctx.currentTime;
        this.isNotePlaying = false;
        
        // Get current gain value for smooth release
        const currentGain = this.vca.gain.value;
        const release = Math.max(0.003, this.envelope.release * this.envelope.releaseMult);
        
        // Cancel scheduled values and set current value
        this.vca.gain.cancelScheduledValues(now);
        this.vca.gain.setValueAtTime(currentGain, now);
        
        // Release phase
        this.vca.gain.linearRampToValueAtTime(0, now + release);
        
        // Release envelope follower
        this.envFollower.gain.cancelScheduledValues(now);
        this.envFollower.gain.setValueAtTime(this.envFollower.gain.value, now);
        this.envFollower.gain.linearRampToValueAtTime(0, now + release);
        
        // Release filter envelope
        this.filterMod.envGain.gain.cancelScheduledValues(now);
        this.filterMod.envGain.gain.setValueAtTime(
            this.filterMod.envGain.gain.value,
            now
        );
        this.filterMod.envGain.gain.linearRampToValueAtTime(0, now + release);
        
        // Release PWM envelope
        this.pwmMod.envGain.gain.cancelScheduledValues(now);
        this.pwmMod.envGain.gain.setValueAtTime(
            this.pwmMod.envGain.gain.value,
            now
        );
        this.pwmMod.envGain.gain.linearRampToValueAtTime(0, now + release);
    }
    
    /**
     * Set a synth parameter
     * @param {string} param - Parameter name
     * @param {*} value - Parameter value
     */
    setParam(param, value) {
        const now = this.ctx.currentTime;
        
        switch(param) {
            // VCO A parameters
            case 'vcoAOctave':
                this.vcoA.octave = value;
                break;
            case 'vcoAFine':
                this.vcoA.fine = value;
                break;
            case 'vcoASawLevel':
                this.vcoA.sawGain.gain.setTargetAtTime(value, now, 0.01);
                break;
            case 'vcoAPulseLevel':
                this.vcoA.pulseGain.gain.setTargetAtTime(value, now, 0.01);
                break;
            case 'pulseWidth':
                this.vcoA.pulseWidth = value;
                // Note: Web Audio doesn't support variable pulse width directly
                // This would require custom oscillator implementation
                break;
            case 'pwmAmount':
                this.vcoA.pwmAmount = value;
                break;
            case 'pwmSource':
                this.vcoA.pwmSource = value;
                break;
            
            // VCO B parameters
            case 'vcoBMode':
                this.vcoB.mode = value;
                this.updateVcoBMode();
                break;
            case 'vcoBShape':
                this.vcoB.shape = value;
                this.vcoB.osc.type = value;
                break;
            case 'vcoBOctave':
                this.vcoB.octave = value;
                if (this.vcoB.mode === 'audio') {
                    this.updateVcoBMode();
                }
                break;
            case 'vcoBFine':
                this.vcoB.fine = value;
                if (this.vcoB.mode === 'audio') {
                    this.updateVcoBMode();
                }
                break;
            case 'vcoBLevel':
                this.vcoB.level = value;
                if (this.vcoB.mode === 'audio') {
                    this.vcoB.audioGain.gain.setTargetAtTime(value, now, 0.01);
                }
                break;
            case 'lfoRate':
                this.vcoB.rate = value;
                if (this.vcoB.mode === 'lfo') {
                    this.vcoB.osc.frequency.setTargetAtTime(value, now, 0.01);
                }
                break;
            
            // Sub oscillator
            case 'subType':
                this.sub.type = value;
                break;
            case 'subLevel':
                this.sub.level = value;
                this.sub.gain.gain.setTargetAtTime(value, now, 0.01);
                break;
            
            // Noise
            case 'noiseLevel':
                this.noise.level = value;
                this.noise.gain.gain.setTargetAtTime(value, now, 0.01);
                break;
            
            // Filter
            case 'filterFreq':
                this.filter.frequency.setTargetAtTime(value, now, 0.01);
                break;
            case 'filterRes':
                this.filter.Q.setTargetAtTime(value, now, 0.01);
                break;
            case 'filterType':
                this.filter.type = value;
                break;
            case 'envToFilter':
                this.filterMod.envAmount = value;
                break;
            case 'lfoToFilter':
                this.filterMod.lfoAmount = value;
                this.lfoMod.filterGain.gain.setValueAtTime(value * 1000, now);
                break;
            case 'keyTrack':
                this.filterMod.keyTrack = value;
                break;
            
            // Envelope
            case 'attack':
                this.envelope.attack = value;
                break;
            case 'decay':
                this.envelope.decay = value;
                break;
            case 'sustain':
                this.envelope.sustain = value;
                break;
            case 'release':
                this.envelope.release = value;
                break;
            case 'envRate':
                this.envelope.rateRange = value;
                this.updateEnvelopeMultipliers();
                break;
            
            // Drive
            case 'driveMode':
                this.drive.mode = value;
                this.updateDriveCurve();
                break;
            case 'driveAmount':
                this.drive.amount = value;
                this.updateDriveCurve();
                break;
            
            // LFO Modulation
            case 'lfoToPitch':
                this.lfoMod.pitchAmount = value;
                break;
            case 'lfoToPWM':
                this.lfoMod.pwmAmount = value;
                break;
            case 'lfoToAmp':
                this.lfoMod.ampAmount = value;
                this.lfoMod.ampGain.gain.setValueAtTime(value * 0.2, now);
                break;
            
            // Legacy compatibility
            case 'vcoAShape':
                this.vcoA.sawOsc.type = value;
                break;
            case 'vcoBShape':
                this.vcoB.osc.type = value;
                break;
            case 'vcoALevel':
                this.vcoA.sawGain.gain.setTargetAtTime(value, now, 0.01);
                break;
        }
    }
    
    /**
     * Generate a musically sensible random patch
     */
    randomPatch() {
        // VCO A settings
        const vcoAShapes = ['sawtooth', 'square', 'triangle'];
        this.setParam('vcoASawLevel', Math.random() > 0.3 ? Math.random() * 0.5 + 0.3 : 0);
        this.setParam('vcoAPulseLevel', Math.random() > 0.5 ? Math.random() * 0.4 + 0.2 : 0);
        this.setParam('vcoAOctave', Math.floor(Math.random() * 5) - 2);
        this.setParam('vcoAFine', (Math.random() - 0.5) * 50);
        
        // PWM settings (occasionally)
        if (Math.random() > 0.6) {
            this.setParam('pwmAmount', Math.random() * 0.6 + 0.2);
            this.setParam('pwmSource', Math.random() > 0.5 ? 'lfo' : 'env');
        } else {
            this.setParam('pwmAmount', 0);
        }
        
        // VCO B settings
        const vcoBShapes = ['sine', 'triangle', 'sawtooth', 'square'];
        this.setParam('vcoBMode', Math.random() > 0.7 ? 'audio' : 'lfo');
        this.setParam('vcoBShape', vcoBShapes[Math.floor(Math.random() * vcoBShapes.length)]);
        this.setParam('vcoBOctave', Math.floor(Math.random() * 4) - 2);
        this.setParam('vcoBLevel', Math.random() * 0.4 + 0.1);
        
        // LFO rate (when in LFO mode)
        if (Math.random() > 0.2) {
            // Mostly sub-audio rates
            this.setParam('lfoRate', Math.pow(Math.random(), 2) * 8 + 0.1);
        } else {
            // Occasionally audio rate
            this.setParam('lfoRate', Math.random() * 20 + 10);
        }
        
        // Sub oscillator (occasionally)
        if (Math.random() > 0.5) {
            this.setParam('subLevel', Math.random() * 0.5 + 0.2);
            this.setParam('subType', Math.random() > 0.5 ? '-1' : '-2');
        } else {
            this.setParam('subLevel', 0);
        }
        
        // Noise (occasionally, usually low)
        if (Math.random() > 0.7) {
            this.setParam('noiseLevel', Math.random() * 0.2 + 0.05);
        } else {
            this.setParam('noiseLevel', 0);
        }
        
        // Filter (biased toward musical range)
        const filterFreq = Math.pow(Math.random(), 1.5) * 3700 + 300;
        this.setParam('filterFreq', filterFreq);
        this.setParam('filterRes', Math.pow(Math.random(), 2) * 12 + 0.5);
        
        // Filter modulation
        this.setParam('envToFilter', (Math.random() - 0.3) * 0.8);
        this.setParam('lfoToFilter', Math.random() > 0.6 ? Math.random() * 0.6 : 0);
        
        // Envelope (biased toward snappy attacks)
        this.setParam('attack', Math.pow(Math.random(), 3) * 0.3 + 0.003);
        this.setParam('decay', Math.pow(Math.random(), 1.5) * 1.5 + 0.1);
        this.setParam('sustain', Math.random() * 0.6 + 0.3);
        this.setParam('release', Math.pow(Math.random(), 1.5) * 2 + 0.05);
        
        // Envelope rate (usually medium)
        const rateRand = Math.random();
        if (rateRand < 0.15) {
            this.setParam('envRate', 'fast');
        } else if (rateRand > 0.85) {
            this.setParam('envRate', 'slow');
        } else {
            this.setParam('envRate', 'medium');
        }
        
        // Drive (occasionally)
        if (Math.random() > 0.6) {
            this.setParam('driveMode', Math.random() > 0.5 ? 'sym' : 'asym');
            this.setParam('driveAmount', Math.random() * 0.6 + 0.2);
        } else {
            this.setParam('driveMode', 'off');
        }
        
        // LFO modulation routing
        this.setParam('lfoToPitch', Math.random() > 0.7 ? Math.random() * 0.5 : 0);
        this.setParam('lfoToPWM', Math.random() > 0.6 ? Math.random() * 0.6 : 0);
        this.setParam('lfoToAmp', Math.random() > 0.8 ? Math.random() * 0.4 : 0);
    }
}
