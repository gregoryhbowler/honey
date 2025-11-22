// Honey Synth Engine (Atlantix-inspired)
// Classic subtractive synthesis with dual VCOs, filter, and ADSR envelope

export class HoneySynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.output.gain.value = 0.3;
        
        // VCO A - Primary oscillator
        this.vcoA = {
            osc: ctx.createOscillator(),
            gain: ctx.createGain(),
            fmGain: ctx.createGain(),
            type: 'sawtooth',
            octave: 0,
            fine: 0
        };
        
        // VCO B - Secondary oscillator
        this.vcoB = {
            osc: ctx.createOscillator(),
            gain: ctx.createGain(),
            type: 'square',
            octave: -1,
            fine: 0
        };
        
        // Low-pass filter
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 1000;
        this.filter.Q.value = 1;
        
        // ADSR Envelope
        this.envelope = {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.5,
            release: 0.5
        };
        
        // VCA (Voltage Controlled Amplifier)
        this.vca = ctx.createGain();
        this.vca.gain.value = 0;
        
        // Setup audio routing
        this.vcoA.osc.connect(this.vcoA.gain);
        this.vcoB.osc.connect(this.vcoB.gain);
        this.vcoA.gain.connect(this.filter);
        this.vcoB.gain.connect(this.filter);
        this.filter.connect(this.vca);
        this.vca.connect(this.output);
        
        // Start oscillators
        this.vcoA.osc.start();
        this.vcoB.osc.start();
        
        // Set initial mixer levels
        this.vcoA.gain.gain.value = 0.5;
        this.vcoB.gain.gain.value = 0.3;
    }
    
    /**
     * Trigger a note on
     * @param {number} freq - Frequency in Hz
     * @param {number} velocity - Note velocity (0-1)
     */
    noteOn(freq, velocity = 1) {
        const now = this.ctx.currentTime;
        
        // Set VCO frequencies with octave and fine tuning
        this.vcoA.osc.frequency.setValueAtTime(
            freq * Math.pow(2, this.vcoA.octave) * Math.pow(2, this.vcoA.fine / 1200),
            now
        );
        this.vcoB.osc.frequency.setValueAtTime(
            freq * Math.pow(2, this.vcoB.octave) * Math.pow(2, this.vcoB.fine / 1200),
            now
        );
        
        // Apply ADSR envelope to VCA
        this.vca.gain.cancelScheduledValues(now);
        this.vca.gain.setValueAtTime(0, now);
        
        // Attack phase
        this.vca.gain.linearRampToValueAtTime(
            velocity,
            now + this.envelope.attack
        );
        
        // Decay to sustain level
        this.vca.gain.linearRampToValueAtTime(
            velocity * this.envelope.sustain,
            now + this.envelope.attack + this.envelope.decay
        );
    }
    
    /**
     * Trigger a note off
     */
    noteOff() {
        const now = this.ctx.currentTime;
        this.vca.gain.cancelScheduledValues(now);
        this.vca.gain.setValueAtTime(this.vca.gain.value, now);
        
        // Release phase
        this.vca.gain.linearRampToValueAtTime(0, now + this.envelope.release);
    }
    
    /**
     * Set a synth parameter
     * @param {string} param - Parameter name
     * @param {*} value - Parameter value
     */
    setParam(param, value) {
        switch(param) {
            case 'filterFreq':
                this.filter.frequency.value = value;
                break;
            case 'filterRes':
                this.filter.Q.value = value;
                break;
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
            case 'vcoAOctave':
                this.vcoA.octave = value;
                break;
            case 'vcoBOctave':
                this.vcoB.octave = value;
                break;
            case 'vcoAShape':
                this.vcoA.osc.type = value;
                break;
            case 'vcoBShape':
                this.vcoB.osc.type = value;
                break;
            case 'vcoALevel':
                this.vcoA.gain.gain.value = value;
                break;
            case 'vcoBLevel':
                this.vcoB.gain.gain.value = value;
                break;
        }
    }
    
    /**
     * Generate a random patch
     */
    randomPatch() {
        this.setParam('filterFreq', Math.random() * 4000 + 200);
        this.setParam('filterRes', Math.random() * 15 + 1);
        this.setParam('attack', Math.random() * 0.5 + 0.001);
        this.setParam('decay', Math.random() * 1 + 0.1);
        this.setParam('sustain', Math.random() * 0.8 + 0.2);
        this.setParam('release', Math.random() * 2 + 0.1);
        this.setParam('vcoALevel', Math.random() * 0.6 + 0.2);
        this.setParam('vcoBLevel', Math.random() * 0.6 + 0.2);
    }
}
