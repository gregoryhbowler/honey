// Vinegar Synth Engine (Passersby/Buchla-inspired)
// West Coast synthesis with waveshaping, wave folding, LPG, FM, LFO routing, and reverb
// Closely mirrors Passersby parameter ranges and behavior

export class VinegarSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.output.gain.value = 0.3;
        
        // === Core VCO (Variable waveform oscillator) ===
        this.vco = ctx.createOscillator();
        this.vcoGain = ctx.createGain();
        this.vco.type = 'sine';
        this.vcoGain.gain.value = 1.0;
        this.currentFreq = 440;
        
        // === FM Modulators ===
        this.fmLow = {
            osc: ctx.createOscillator(),
            gain: ctx.createGain(),
            ratio: 0.66,  // Default from Passersby
            amount: 0
        };
        this.fmLow.osc.type = 'sine';
        this.fmLow.gain.gain.value = 0;
        
        this.fmHigh = {
            osc: ctx.createOscillator(),
            gain: ctx.createGain(),
            ratio: 3.3,  // Default from Passersby
            amount: 0
        };
        this.fmHigh.osc.type = 'sine';
        this.fmHigh.gain.gain.value = 0;
        
        // === Waveshaper + Wavefolder ===
        this.waveShaper = ctx.createWaveShaper();
        this.waveShape = 0.5;  // 0-1: Sine→Tri→Square→Saw
        this.waveFolds = 0;    // 0-3: smooth folding amount
        
        // === LPG (Low Pass Gate) ===
        this.lpg = {
            filter: ctx.createBiquadFilter(),
            vca: ctx.createGain()
        };
        this.lpg.filter.type = 'lowpass';
        this.lpg.filter.frequency.value = 1000;
        this.lpg.filter.Q.value = 0.5;
        this.lpg.vca.gain.value = 0;
        
        // === Envelope ===
        this.envelope = {
            type: 0,        // 0 = LPG (AR), 1 = Sustain (ADSR-like)
            attack: 0.04,   // 0.003-8.0s
            peak: 10000,    // 100-10000 Hz
            decay: 1.0,     // 0.01-8.0s
            amp: 1.0        // 0-11 (mapped to 0-1 gain, with drive potential)
        };
        
        // === Glide (Portamento) ===
        this.glide = 0;  // 0-5 seconds
        
        // === Drift (Analog-style pitch instability) ===
        this.drift = 0;
        this.driftLFO = ctx.createOscillator();
        this.driftGain = ctx.createGain();
        this.driftLFO.type = 'sine';
        this.driftLFO.frequency.value = 0.2;
        this.driftGain.gain.value = 0;
        
        // === LFO (Modulation source) ===
        this.lfo = {
            osc: ctx.createOscillator(),
            shape: 0,      // 0=Triangle, 1=Ramp, 2=Square, 3=Random/S&H
            freq: 0.5,     // 0.001-10 Hz
            // Routing gains for each destination
            toFreq: ctx.createGain(),
            toWaveShape: ctx.createGain(),
            toWaveFolds: ctx.createGain(),
            toFmLow: ctx.createGain(),
            toFmHigh: ctx.createGain(),
            toAttack: ctx.createGain(),
            toPeak: ctx.createGain(),
            toDecay: ctx.createGain(),
            toReverbMix: ctx.createGain()
        };
        this.lfo.osc.type = 'triangle';
        this.lfo.osc.frequency.value = 0.5;
        
        // LFO modulation amounts (user-facing)
        this.lfoAmounts = {
            toFreq: 0,
            toWaveShape: 0,
            toWaveFolds: 0,
            toFmLow: 0,
            toFmHigh: 0,
            toAttack: 0,
            toPeak: 0,
            toDecay: 0,
            toReverbMix: 0
        };
        
        // Initialize all LFO routing gains to 0
        Object.values(this.lfo).forEach(node => {
            if (node && node.gain) {
                node.gain.value = 0;
            }
        });
        
        // === Reverb ===
        this.reverb = {
            delay1: ctx.createDelay(),
            delay2: ctx.createDelay(),
            delay3: ctx.createDelay(),
            delay4: ctx.createDelay(),
            feedback1: ctx.createGain(),
            feedback2: ctx.createGain(),
            feedback3: ctx.createGain(),
            feedback4: ctx.createGain(),
            wet: ctx.createGain(),
            dry: ctx.createGain(),
            mix: 0  // 0-1
        };
        
        // Simple multi-tap delay reverb
        this.reverb.delay1.delayTime.value = 0.037;
        this.reverb.delay2.delayTime.value = 0.053;
        this.reverb.delay3.delayTime.value = 0.071;
        this.reverb.delay4.delayTime.value = 0.089;
        this.reverb.feedback1.gain.value = 0.4;
        this.reverb.feedback2.gain.value = 0.37;
        this.reverb.feedback3.gain.value = 0.35;
        this.reverb.feedback4.gain.value = 0.33;
        this.reverb.wet.gain.value = 0;
        this.reverb.dry.gain.value = 1;
        
        // === Audio Routing ===
        
        // FM routing
        this.fmLow.osc.connect(this.fmLow.gain);
        this.fmHigh.osc.connect(this.fmHigh.gain);
        this.fmLow.gain.connect(this.vco.frequency);
        this.fmHigh.gain.connect(this.vco.frequency);
        
        // Main signal path
        this.vco.connect(this.waveShaper);
        this.waveShaper.connect(this.vcoGain);
        this.vcoGain.connect(this.lpg.filter);
        this.lpg.filter.connect(this.lpg.vca);
        
        // Reverb routing (parallel wet/dry)
        this.lpg.vca.connect(this.reverb.dry);
        this.lpg.vca.connect(this.reverb.delay1);
        
        this.reverb.delay1.connect(this.reverb.feedback1);
        this.reverb.feedback1.connect(this.reverb.delay2);
        this.reverb.delay2.connect(this.reverb.feedback2);
        this.reverb.feedback2.connect(this.reverb.delay3);
        this.reverb.delay3.connect(this.reverb.feedback3);
        this.reverb.feedback3.connect(this.reverb.delay4);
        this.reverb.delay4.connect(this.reverb.feedback4);
        
        // Mix all delays to wet
        this.reverb.delay1.connect(this.reverb.wet);
        this.reverb.delay2.connect(this.reverb.wet);
        this.reverb.delay3.connect(this.reverb.wet);
        this.reverb.delay4.connect(this.reverb.wet);
        
        // Feedback loops
        this.reverb.feedback1.connect(this.reverb.delay1);
        this.reverb.feedback2.connect(this.reverb.delay2);
        this.reverb.feedback3.connect(this.reverb.delay3);
        this.reverb.feedback4.connect(this.reverb.delay4);
        
        // Output mix
        this.reverb.dry.connect(this.output);
        this.reverb.wet.connect(this.output);
        
        // Drift routing
        this.driftLFO.connect(this.driftGain);
        this.driftGain.connect(this.vco.frequency);
        
        // LFO routing (will be connected to parameters via modulation)
        this.lfo.osc.connect(this.lfo.toFreq);
        this.lfo.osc.connect(this.lfo.toWaveShape);
        this.lfo.osc.connect(this.lfo.toWaveFolds);
        this.lfo.osc.connect(this.lfo.toFmLow);
        this.lfo.osc.connect(this.lfo.toFmHigh);
        this.lfo.osc.connect(this.lfo.toAttack);
        this.lfo.osc.connect(this.lfo.toPeak);
        this.lfo.osc.connect(this.lfo.toDecay);
        this.lfo.osc.connect(this.lfo.toReverbMix);
        
        // Connect LFO to destinations
        this.lfo.toFreq.connect(this.vco.frequency);
        
        // Start all oscillators
        this.vco.start();
        this.fmLow.osc.start();
        this.fmHigh.osc.start();
        this.driftLFO.start();
        this.lfo.osc.start();
        
        // Initialize waveshaping curve
        this.updateWaveShape();
        
        // Track note state
        this.isNotePlaying = false;
    }
    
    /**
     * Exponential mapping helper (for Passersby-style ControlSpec)
     * @param {number} norm - Normalized value 0-1
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Exponentially mapped value
     */
    mapExp(norm, min, max) {
        if (min <= 0) min = 0.001;
        const ratio = max / min;
        return min * Math.pow(ratio, norm);
    }
    
    /**
     * Linear mapping helper
     * @param {number} norm - Normalized value 0-1
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Linearly mapped value
     */
    mapLin(norm, min, max) {
        return min + (max - min) * norm;
    }
    
    /**
     * Update the waveshaping curve based on current waveShape and waveFolds
     * Implements smooth morphing and anti-aliased folding
     */
    updateWaveShape() {
        const resolution = 2048;  // High resolution for smooth curves
        const curve = new Float32Array(resolution);
        const shape = this.waveShape;
        const folds = this.waveFolds;
        
        for (let i = 0; i < resolution; i++) {
            // Input range: -1 to +1
            let x = (i / (resolution - 1)) * 2 - 1;
            
            // === Step 1: Morph base waveform (Sine→Triangle→Square→Saw) ===
            let y;
            if (shape < 0.33) {
                // Sine → Triangle
                const mix = shape / 0.33;
                const sine = Math.sin(x * Math.PI / 2);
                const tri = x;
                y = sine * (1 - mix) + tri * mix;
            } else if (shape < 0.66) {
                // Triangle → Square
                const mix = (shape - 0.33) / 0.33;
                const tri = x;
                const square = Math.sign(x) * 0.8;
                y = tri * (1 - mix) + square * mix;
            } else {
                // Square → Sawtooth
                const mix = (shape - 0.66) / 0.34;
                const square = Math.sign(x) * 0.8;
                const saw = x;
                y = square * (1 - mix) + saw * mix;
            }
            
            // === Step 2: Apply smooth wavefolder ===
            if (folds > 0) {
                // Pre-gain based on fold amount
                const preGain = 1 + folds * 1.5;
                y *= preGain;
                
                // Soft symmetric folding using tanh and mirroring
                // This creates smooth folds without harsh discontinuities
                const k = 1.5;  // Fold sharpness
                y = Math.tanh(y * k);
                
                // Apply additional fold cycles for fractional folds
                const wholeFolds = Math.floor(folds);
                const fractionalFold = folds - wholeFolds;
                
                for (let j = 0; j < wholeFolds; j++) {
                    // Mirror-fold: reflect around ±1
                    if (y > 1) y = 2 - y;
                    if (y < -1) y = -2 - y;
                    y = Math.abs(y) * 2 - 1;
                }
                
                // Apply fractional fold for smooth transitions
                if (fractionalFold > 0) {
                    const folded = Math.abs(y) * 2 - 1;
                    y = y * (1 - fractionalFold) + folded * fractionalFold;
                }
                
                // Post-gain compensation to maintain consistent level
                // More folds = more complexity but we compensate to avoid volume drop
                const postGain = 1 / (1 + folds * 0.3);
                y *= postGain;
            }
            
            // Ensure output stays in valid range
            y = Math.max(-1, Math.min(1, y));
            curve[i] = y;
        }
        
        this.waveShaper.curve = curve;
    }
    
    /**
     * Update FM modulator frequencies based on carrier frequency
     * @param {number} carrierFreq - Carrier frequency in Hz
     */
    updateFMFrequencies(carrierFreq) {
        const now = this.ctx.currentTime;
        
        // FM Low: ratio 0.1-1.0 of carrier
        const fmLowFreq = carrierFreq * this.fmLow.ratio;
        this.fmLow.osc.frequency.setTargetAtTime(fmLowFreq, now, 0.001);
        
        // FM High: ratio 1.0-10.0 of carrier
        const fmHighFreq = carrierFreq * this.fmHigh.ratio;
        this.fmHigh.osc.frequency.setTargetAtTime(fmHighFreq, now, 0.001);
        
        // Update FM depths (scaled to musical amounts)
        // Using semitone-based scaling for musical FM depth
        const fmLowDepth = this.fmLow.amount * carrierFreq * 0.2;
        const fmHighDepth = this.fmHigh.amount * carrierFreq * 0.5;
        
        this.fmLow.gain.gain.setTargetAtTime(fmLowDepth, now, 0.001);
        this.fmHigh.gain.gain.setTargetAtTime(fmHighDepth, now, 0.001);
    }
    
    /**
     * Trigger a note on with click-free envelope
     * @param {number} freq - Frequency in Hz
     * @param {number} velocity - Note velocity (0-1)
     */
    noteOn(freq, velocity = 1) {
        const now = this.ctx.currentTime;
        this.isNotePlaying = true;
        
        // === Update VCO frequency with glide ===
        if (this.glide > 0.001) {
            // Smooth glide from current frequency to target
            this.vco.frequency.cancelScheduledValues(now);
            this.vco.frequency.setValueAtTime(this.currentFreq, now);
            this.vco.frequency.linearRampToValueAtTime(freq, now + this.glide);
        } else {
            // Instant frequency change (but still smooth to avoid clicks)
            this.vco.frequency.setTargetAtTime(freq, now, 0.001);
        }
        
        this.currentFreq = freq;
        
        // === Update FM frequencies ===
        this.updateFMFrequencies(freq);
        
        // === Update LFO modulation depths ===
        this.lfo.toFreq.gain.setValueAtTime(this.lfoAmounts.toFreq * freq * 0.1, now);
        
        // === Apply envelope based on type ===
        const attack = Math.max(0.003, this.envelope.attack);
        const decay = Math.max(0.01, this.envelope.decay);
        const peak = Math.max(100, Math.min(10000, this.envelope.peak));
        const amp = Math.min(1.0, this.envelope.amp / 11.0);  // Map 0-11 to 0-1
        
        // Get current values for smooth transitions
        const currentVcaGain = this.lpg.vca.gain.value;
        const currentFilterFreq = this.lpg.filter.frequency.value;
        
        if (this.envelope.type === 0) {
            // === LPG Mode (AR envelope, no sustain) ===
            
            // VCA envelope
            this.lpg.vca.gain.cancelScheduledValues(now);
            this.lpg.vca.gain.setValueAtTime(currentVcaGain, now);
            this.lpg.vca.gain.linearRampToValueAtTime(amp * velocity, now + attack);
            this.lpg.vca.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);
            
            // Filter envelope (tracks VCA for classic LPG behavior)
            this.lpg.filter.frequency.cancelScheduledValues(now);
            this.lpg.filter.frequency.setValueAtTime(Math.max(20, currentFilterFreq), now);
            this.lpg.filter.frequency.exponentialRampToValueAtTime(peak, now + attack);
            this.lpg.filter.frequency.exponentialRampToValueAtTime(100, now + attack + decay);
            
        } else {
            // === Sustain Mode (ADSR-like envelope) ===
            
            const sustainLevel = amp * 0.7;  // Sustain at 70% of peak
            
            // VCA envelope
            this.lpg.vca.gain.cancelScheduledValues(now);
            this.lpg.vca.gain.setValueAtTime(currentVcaGain, now);
            this.lpg.vca.gain.linearRampToValueAtTime(amp * velocity, now + attack);
            this.lpg.vca.gain.linearRampToValueAtTime(sustainLevel * velocity, now + attack + decay);
            
            // Filter envelope
            this.lpg.filter.frequency.cancelScheduledValues(now);
            this.lpg.filter.frequency.setValueAtTime(Math.max(20, currentFilterFreq), now);
            this.lpg.filter.frequency.exponentialRampToValueAtTime(peak, now + attack);
            this.lpg.filter.frequency.exponentialRampToValueAtTime(
                Math.max(300, peak * 0.3),
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
        
        if (this.envelope.type === 1) {
            // Only apply release in Sustain mode
            const release = Math.max(0.01, this.envelope.decay * 0.5);
            
            // Get current values
            const currentVcaGain = this.lpg.vca.gain.value;
            const currentFilterFreq = this.lpg.filter.frequency.value;
            
            // VCA release
            this.lpg.vca.gain.cancelScheduledValues(now);
            this.lpg.vca.gain.setValueAtTime(currentVcaGain, now);
            this.lpg.vca.gain.exponentialRampToValueAtTime(0.001, now + release);
            
            // Filter release
            this.lpg.filter.frequency.cancelScheduledValues(now);
            this.lpg.filter.frequency.setValueAtTime(Math.max(20, currentFilterFreq), now);
            this.lpg.filter.frequency.exponentialRampToValueAtTime(100, now + release);
        }
        // In LPG mode (type 0), notes decay naturally - no action needed
    }
    
    /**
     * Set a synth parameter
     * @param {string} param - Parameter name
     * @param {*} value - Parameter value
     */
    setParam(param, value) {
        const now = this.ctx.currentTime;
        
        switch(param) {
            // === Glide ===
            case 'glide':
                this.glide = value;
                break;
            
            // === Wave Shape & Folding ===
            case 'waveShape':
                this.waveShape = value;
                this.updateWaveShape();
                break;
            case 'waveFolds':
                this.waveFolds = value;
                this.updateWaveShape();
                break;
            
            // === FM Parameters ===
            case 'fmLowRatio':
                this.fmLow.ratio = value;
                if (this.isNotePlaying) {
                    this.updateFMFrequencies(this.currentFreq);
                }
                break;
            case 'fmHighRatio':
                this.fmHigh.ratio = value;
                if (this.isNotePlaying) {
                    this.updateFMFrequencies(this.currentFreq);
                }
                break;
            case 'fmLowAmount':
                this.fmLow.amount = value;
                if (this.isNotePlaying) {
                    this.updateFMFrequencies(this.currentFreq);
                }
                break;
            case 'fmHighAmount':
                this.fmHigh.amount = value;
                if (this.isNotePlaying) {
                    this.updateFMFrequencies(this.currentFreq);
                }
                break;
            
            // === Envelope ===
            case 'envType':
                this.envelope.type = value;
                break;
            case 'attack':
                this.envelope.attack = value;
                break;
            case 'peak':
                this.envelope.peak = value;
                break;
            case 'decay':
                this.envelope.decay = value;
                break;
            case 'amp':
                this.envelope.amp = value;
                break;
            
            // === Reverb ===
            case 'reverbMix':
                this.reverb.mix = value;
                this.reverb.wet.gain.setTargetAtTime(value * 0.4, now, 0.01);
                this.reverb.dry.gain.setTargetAtTime(1 - value * 0.3, now, 0.01);
                break;
            
            // === LFO ===
            case 'lfoShape':
                // 0=Triangle, 1=Ramp, 2=Square, 3=Random
                this.lfo.shape = value;
                const shapes = ['triangle', 'sawtooth', 'square', 'square'];
                this.lfo.osc.type = shapes[value] || 'triangle';
                break;
            case 'lfoFreq':
                this.lfo.freq = value;
                this.lfo.osc.frequency.setTargetAtTime(value, now, 0.01);
                break;
            
            // === LFO Routing Amounts ===
            case 'lfo_to_freq_amount':
                this.lfoAmounts.toFreq = value;
                if (this.isNotePlaying) {
                    this.lfo.toFreq.gain.setValueAtTime(value * this.currentFreq * 0.1, now);
                }
                break;
            case 'lfo_to_wave_shape_amount':
                this.lfoAmounts.toWaveShape = value;
                // Note: would need real-time waveshape modulation for this
                break;
            case 'lfo_to_wave_folds_amount':
                this.lfoAmounts.toWaveFolds = value;
                // Note: would need real-time wavefold modulation for this
                break;
            case 'lfo_to_fm_low_amount':
                this.lfoAmounts.toFmLow = value;
                this.lfo.toFmLow.gain.setValueAtTime(value * 100, now);
                break;
            case 'lfo_to_fm_high_amount':
                this.lfoAmounts.toFmHigh = value;
                this.lfo.toFmHigh.gain.setValueAtTime(value * 200, now);
                break;
            case 'lfo_to_attack_amount':
                this.lfoAmounts.toAttack = value;
                // Note: envelope params modulation would need dynamic scheduling
                break;
            case 'lfo_to_peak_amount':
                this.lfoAmounts.toPeak = value;
                break;
            case 'lfo_to_decay_amount':
                this.lfoAmounts.toDecay = value;
                break;
            case 'lfo_to_reverb_mix_amount':
                this.lfoAmounts.toReverbMix = value;
                this.lfo.toReverbMix.gain.setValueAtTime(value * 0.3, now);
                this.lfo.toReverbMix.connect(this.reverb.wet.gain);
                break;
            
            // === Drift ===
            case 'drift':
                this.drift = value;
                // Drift: ±5 cents at max (0.05 semitones)
                this.driftGain.gain.setTargetAtTime(value * this.currentFreq * 0.0029, now, 0.01);
                break;
        }
    }
    
    /**
     * Generate a random patch with Passersby-style randomization logic
     * Mirrors the probability distributions from the Lua code
     */
    randomPatch() {
        // Glide: often zero, sometimes up to 5s
        if (Math.random() > 0.7) {
            this.setParam('glide', Math.pow(Math.random(), 2) * 5);
        } else {
            this.setParam('glide', 0);
        }
        
        // Wave Shape: full range
        this.setParam('waveShape', Math.random());
        
        // Wave Folds: biased toward lower values
        this.setParam('waveFolds', Math.pow(Math.random(), 2) * 3);
        
        // FM Low Ratio: 0.1-1.0
        this.setParam('fmLowRatio', this.mapLin(Math.random(), 0.1, 1.0));
        
        // FM High Ratio: 1.0-10.0
        this.setParam('fmHighRatio', this.mapLin(Math.random(), 1.0, 10.0));
        
        // FM Amounts: often zero, sometimes moderate
        if (Math.random() > 0.6) {
            this.setParam('fmLowAmount', Math.pow(Math.random(), 2) * 0.8);
        } else {
            this.setParam('fmLowAmount', 0);
        }
        
        if (Math.random() > 0.6) {
            this.setParam('fmHighAmount', Math.pow(Math.random(), 2) * 0.7);
        } else {
            this.setParam('fmHighAmount', 0);
        }
        
        // Env Type: favor LPG mode
        this.setParam('envType', Math.random() > 0.7 ? 1 : 0);
        
        // Attack: exponential, biased toward fast
        this.setParam('attack', this.mapExp(Math.pow(Math.random(), 4), 0.003, 8.0));
        
        // Peak: exponential, full range
        this.setParam('peak', this.mapExp(Math.random(), 100, 10000));
        
        // Decay: exponential, biased toward medium lengths
        this.setParam('decay', this.mapExp(Math.pow(Math.random(), 1.5), 0.01, 8.0));
        
        // Amp: usually high, sometimes lower
        this.setParam('amp', Math.pow(Math.random(), 0.5) * 11);
        
        // Reverb: often zero, sometimes moderate
        if (Math.random() > 0.65) {
            this.setParam('reverbMix', Math.pow(Math.random(), 2) * 0.6);
        } else {
            this.setParam('reverbMix', 0);
        }
        
        // LFO Shape: random
        this.setParam('lfoShape', Math.floor(Math.random() * 4));
        
        // LFO Freq: exponential, biased toward slower
        this.setParam('lfoFreq', this.mapExp(Math.pow(Math.random(), 2), 0.001, 10.0));
        
        // LFO routings: sparse (often zero)
        const lfoParams = [
            'lfo_to_freq_amount',
            'lfo_to_wave_shape_amount',
            'lfo_to_wave_folds_amount',
            'lfo_to_fm_low_amount',
            'lfo_to_fm_high_amount',
            'lfo_to_attack_amount',
            'lfo_to_peak_amount',
            'lfo_to_decay_amount',
            'lfo_to_reverb_mix_amount'
        ];
        
        lfoParams.forEach(param => {
            if (Math.random() > 0.75) {
                this.setParam(param, Math.pow(Math.random(), 2) * 0.7);
            } else {
                this.setParam(param, 0);
            }
        });
        
        // Drift: usually subtle, sometimes moderate
        this.setParam('drift', Math.pow(Math.random(), 3) * 0.6);
    }
}
