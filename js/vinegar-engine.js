// Vinegar Synth Engine (Passersby/Buchla-inspired)
// West Coast synthesis with waveshaping, wave folding, and LPG (Low Pass Gate)

export class VinegarSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.output.gain.value = 0.3;
        
        // Main oscillator
        this.osc = ctx.createOscillator();
        this.oscGain = ctx.createGain();
        
        // Wave shaping and folding
        this.waveShaper = ctx.createWaveShaper();
        this.waveFolds = 0;
        this.waveShape = 0.5;
        
        // LPG (Low Pass Gate) simulation - combines filter and VCA
        this.lpg = {
            filter: ctx.createBiquadFilter(),
            gain: ctx.createGain()
        };
        this.lpg.filter.type = 'lowpass';
        this.lpg.filter.frequency.value = 2000;
        this.lpg.gain.gain.value = 0;
        
        // Envelope parameters (for LPG)
        this.envelope = {
            attack: 0.04,
            peak: 10000,
            decay: 1,
            amp: 1
        };
        
        // Drift - adds organic pitch variation
        this.drift = 0;
        this.driftLFO = ctx.createOscillator();
        this.driftGain = ctx.createGain();
        this.driftLFO.frequency.value = 0.1;
        this.driftGain.gain.value = 0;
        
        // Setup audio routing
        this.osc.connect(this.waveShaper);
        this.waveShaper.connect(this.oscGain);
        this.oscGain.connect(this.lpg.filter);
        this.lpg.filter.connect(this.lpg.gain);
        this.lpg.gain.connect(this.output);
        
        // Connect drift modulation
        this.driftLFO.connect(this.driftGain);
        this.driftGain.connect(this.osc.frequency);
        
        // Start oscillators
        this.osc.start();
        this.driftLFO.start();
        
        // Initialize waveshaping curve
        this.updateWaveShape();
    }
    
    /**
     * Update the waveshaping curve based on current parameters
     */
    updateWaveShape() {
        const curve = new Float32Array(256);
        const shape = this.waveShape;
        const folds = this.waveFolds;
        
        for (let i = 0; i < 256; i++) {
            let x = (i / 128) - 1;
            
            // Morph between waveforms based on shape parameter
            if (shape < 0.33) {
                // Sine to triangle
                const mix = shape / 0.33;
                x = (1 - mix) * Math.sin(x * Math.PI) + mix * x;
            } else if (shape < 0.66) {
                // Triangle to square
                const mix = (shape - 0.33) / 0.33;
                x = (1 - mix) * x + mix * Math.sign(x);
            } else {
                // Square to sawtooth
                const mix = (shape - 0.66) / 0.34;
                const saw = x;
                x = (1 - mix) * Math.sign(x) + mix * saw;
            }
            
            // Apply wave folding
            for (let j = 0; j < Math.floor(folds); j++) {
                x = Math.abs(x) * 2 - 1;
            }
            
            curve[i] = x;
        }
        
        this.waveShaper.curve = curve;
    }
    
    /**
     * Trigger a note on
     * @param {number} freq - Frequency in Hz
     * @param {number} velocity - Note velocity (0-1)
     */
    noteOn(freq, velocity = 1) {
        const now = this.ctx.currentTime;
        
        // Set oscillator frequency
        this.osc.frequency.setValueAtTime(freq, now);
        
        // LPG filter envelope (opening the gate)
        this.lpg.filter.frequency.cancelScheduledValues(now);
        this.lpg.filter.frequency.setValueAtTime(100, now);
        this.lpg.filter.frequency.exponentialRampToValueAtTime(
            this.envelope.peak,
            now + this.envelope.attack
        );
        this.lpg.filter.frequency.exponentialRampToValueAtTime(
            400,
            now + this.envelope.attack + this.envelope.decay
        );
        
        // LPG amplitude envelope
        this.lpg.gain.gain.cancelScheduledValues(now);
        this.lpg.gain.gain.setValueAtTime(0, now);
        this.lpg.gain.gain.linearRampToValueAtTime(
            this.envelope.amp * velocity,
            now + this.envelope.attack
        );
        this.lpg.gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + this.envelope.attack + this.envelope.decay
        );
    }
    
    /**
     * Trigger a note off (LPG-style notes decay naturally)
     */
    noteOff() {
        // LPG-style synthesis: notes decay naturally, no explicit note-off
    }
    
    /**
     * Set a synth parameter
     * @param {string} param - Parameter name
     * @param {*} value - Parameter value
     */
    setParam(param, value) {
        switch(param) {
            case 'waveShape':
                this.waveShape = value;
                this.updateWaveShape();
                break;
            case 'waveFolds':
                this.waveFolds = value;
                this.updateWaveShape();
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
            case 'drift':
                this.drift = value;
                this.driftGain.gain.value = value * 10;
                break;
        }
    }
    
    /**
     * Generate a random patch
     */
    randomPatch() {
        this.setParam('waveShape', Math.random());
        this.setParam('waveFolds', Math.random() * 3);
        this.setParam('attack', Math.pow(Math.random(), 4) * 0.5 + 0.003);
        this.setParam('peak', Math.random() * 9000 + 1000);
        this.setParam('decay', Math.pow(Math.random(), 2) * 3 + 0.1);
        this.setParam('amp', Math.pow(Math.random(), 2) * 0.8 + 0.2);
        this.setParam('drift', Math.random() * 0.3);
    }
}
