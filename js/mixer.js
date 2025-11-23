// Mixer Module
// DJ-style 3-band EQ, Culture Vulture-inspired saturation, panning, and level controls
// NOW WITH: Mimeophon-inspired stereo delay send effect + QuadraVerb algorithmic reverb

/**
 * Channel Strip - One per voice
 * Signal flow: Input → EQ → Saturation → Pan → Fader → Output
 */
export class ChannelStrip {
    constructor(ctx, channelNumber) {
        this.ctx = ctx;
        this.channelNumber = channelNumber;
        
        // === Input ===
        this.input = ctx.createGain();
        this.input.gain.value = 1.0;
        
        // === 3-Band DJ EQ ===
        this.eq = {
            // Low shelf (20-250 Hz)
            low: ctx.createBiquadFilter(),
            lowGain: ctx.createGain(),
            lowKill: false,
            lowFreq: 100,
            lowAmount: 0, // -24 to +12 dB
            
            // Mid peak (250-2500 Hz)
            mid: ctx.createBiquadFilter(),
            midGain: ctx.createGain(),
            midKill: false,
            midFreq: 1000,
            midAmount: 0,
            
            // High shelf (2500+ Hz)
            high: ctx.createBiquadFilter(),
            highGain: ctx.createGain(),
            highKill: false,
            highFreq: 5000,
            highAmount: 0
        };
        
        // Configure EQ filters
        this.eq.low.type = 'lowshelf';
        this.eq.low.frequency.value = 100;
        this.eq.low.gain.value = 0;
        this.eq.lowGain.gain.value = 1;
        
        this.eq.mid.type = 'peaking';
        this.eq.mid.frequency.value = 1000;
        this.eq.mid.Q.value = 1.0;
        this.eq.mid.gain.value = 0;
        this.eq.midGain.gain.value = 1;
        
        this.eq.high.type = 'highshelf';
        this.eq.high.frequency.value = 5000;
        this.eq.high.gain.value = 0;
        this.eq.highGain.gain.value = 1;
        
        // === Saturation (Culture Vulture inspired) ===
        this.saturation = {
            shaper: ctx.createWaveShaper(),
            inputGain: ctx.createGain(),
            outputGain: ctx.createGain(),
            dryGain: ctx.createGain(),
            wetGain: ctx.createGain(),
            mode: 'tape', // 'tape', 'triode', 'pentode', 'transformer'
            drive: 0, // 0-1
            bias: 0, // -1 to 1 (asymmetric clipping)
            mix: 1.0, // 0-1 (dry/wet)
            harmonics: 'even' // 'even', 'odd', 'both'
        };
        
        this.saturation.inputGain.gain.value = 1;
        this.saturation.outputGain.gain.value = 1;
        this.saturation.dryGain.gain.value = 0;
        this.saturation.wetGain.gain.value = 1;
        
        // === Stereo Pan ===
        this.panner = ctx.createStereoPanner();
        this.panner.pan.value = 0; // -1 (left) to +1 (right)
        
        // === Channel Fader ===
        this.fader = ctx.createGain();
        this.fader.gain.value = 0.8; // Default at 80%
        
        // === Output ===
        this.output = ctx.createGain();
        this.output.gain.value = 1.0;
        
        // === Pre-fader send (for future FX sends) ===
        this.preFaderSend = ctx.createGain();
        this.preFaderSend.gain.value = 0;
        
        // === Routing ===
        // Main signal path
        this.input.connect(this.eq.low);
        this.eq.low.connect(this.eq.lowGain);
        this.eq.lowGain.connect(this.eq.mid);
        this.eq.mid.connect(this.eq.midGain);
        this.eq.midGain.connect(this.eq.high);
        this.eq.high.connect(this.eq.highGain);
        
        // Saturation parallel routing
        this.eq.highGain.connect(this.saturation.dryGain);
        this.eq.highGain.connect(this.saturation.inputGain);
        this.saturation.inputGain.connect(this.saturation.shaper);
        this.saturation.shaper.connect(this.saturation.outputGain);
        this.saturation.outputGain.connect(this.saturation.wetGain);
        
        // Merge dry/wet
        this.saturation.dryGain.connect(this.panner);
        this.saturation.wetGain.connect(this.panner);
        
        // Pan → Fader → Output
        this.panner.connect(this.fader);
        this.fader.connect(this.output);
        
        // Pre-fader send tap (for future use)
        this.panner.connect(this.preFaderSend);
        
        // Initialize saturation curve
        this.updateSaturationCurve();
        
        // Mute state
        this.muted = false;
    }
    
    /**
     * Update saturation waveshaping curve based on mode, drive, bias, and harmonics
     */
    updateSaturationCurve() {
        const samples = 2048;
        const curve = new Float32Array(samples);
        const drive = this.saturation.drive;
        const bias = this.saturation.bias;
        const mode = this.saturation.mode;
        const harmonics = this.saturation.harmonics;
        
        // Drive maps to pre-gain (1-20x)
        const preGain = 1 + drive * 19;
        
        for (let i = 0; i < samples; i++) {
            let x = (i * 2 / (samples - 1)) - 1;
            
            // Apply bias (DC offset before clipping)
            x += bias * 0.3;
            
            // Apply pre-gain
            x *= preGain;
            
            let y;
            
            switch(mode) {
                case 'tape':
                    // Soft tape saturation - smooth, musical
                    // Gentle compression with soft knee
                    y = this.tapeFormula(x, harmonics);
                    break;
                    
                case 'triode':
                    // Triode tube - warm, even harmonics
                    // Asymmetric, smooth clipping
                    y = this.triodeFormula(x, harmonics);
                    break;
                    
                case 'pentode':
                    // Pentode tube - brighter, more aggressive
                    // Sharper clipping, more odd harmonics
                    y = this.pentodeFormula(x, harmonics);
                    break;
                    
                case 'transformer':
                    // Transformer saturation - thick, compressed
                    // Symmetric, harder clipping
                    y = this.transformerFormula(x, harmonics);
                    break;
                    
                default:
                    y = x;
            }
            
            // Remove bias from output
            y -= bias * 0.2;
            
            // Soft limit final output
            y = Math.tanh(y);
            
            curve[i] = y;
        }
        
        this.saturation.shaper.curve = curve;
        
        // Update mix
        this.updateSaturationMix();
    }
    
    /**
     * Tape saturation formula
     */
    tapeFormula(x, harmonics) {
        // Gentle arctan-based saturation
        let y = (2/Math.PI) * Math.atan(x * 1.5);
        
        if (harmonics === 'even') {
            // Emphasize even harmonics (square the signal gently)
            y = Math.sign(y) * Math.pow(Math.abs(y), 0.8);
        } else if (harmonics === 'odd') {
            // Emphasize odd harmonics (cube the signal)
            y = Math.pow(y, 3) * 0.7 + y * 0.3;
        }
        
        return y;
    }
    
    /**
     * Triode tube formula (Culture Vulture "Triode" mode)
     */
    triodeFormula(x, harmonics) {
        // Asymmetric soft clipping - different curves for + and -
        let y;
        
        if (x > 0) {
            // Positive side: softer, more compressed
            y = 1.2 * x / (1 + Math.abs(x * 1.2));
        } else {
            // Negative side: slightly harder
            y = 1.5 * x / (1 + Math.abs(x * 1.5));
        }
        
        if (harmonics === 'even') {
            // Even harmonics: square law
            y = Math.sign(y) * Math.pow(Math.abs(y), 0.75);
        }
        
        return y * 0.9;
    }
    
    /**
     * Pentode tube formula (more aggressive)
     */
    pentodeFormula(x, harmonics) {
        // Sharper, more aggressive clipping
        let y = 1.8 * x / (1 + Math.pow(Math.abs(x), 1.5));
        
        if (harmonics === 'odd') {
            // Odd harmonics: add some cubic
            y = y * 0.7 + Math.pow(y, 3) * 0.3;
        }
        
        return y;
    }
    
    /**
     * Transformer saturation formula
     */
    transformerFormula(x, harmonics) {
        // Symmetric, hard clipping with soft knee
        const knee = 0.5;
        let y;
        
        if (Math.abs(x) < knee) {
            y = x;
        } else {
            y = Math.sign(x) * (knee + (Math.abs(x) - knee) / (1 + Math.pow((Math.abs(x) - knee) * 2, 2)));
        }
        
        if (harmonics === 'both') {
            // Both even and odd
            y = y * 0.6 + Math.pow(y, 2) * Math.sign(y) * 0.2 + Math.pow(y, 3) * 0.2;
        }
        
        return y;
    }
    
    /**
     * Update saturation dry/wet mix
     */
    updateSaturationMix() {
        const now = this.ctx.currentTime;
        const mix = this.saturation.mix;
        
        this.saturation.wetGain.gain.setTargetAtTime(mix, now, 0.01);
        this.saturation.dryGain.gain.setTargetAtTime(1 - mix, now, 0.01);
        
        // Compensate gain based on drive to maintain perceived loudness
        const driveCompensation = 1 / (1 + this.saturation.drive * 0.3);
        this.saturation.outputGain.gain.setTargetAtTime(driveCompensation, now, 0.01);
    }
    
    /**
     * Set EQ parameter
     */
    setEQ(band, param, value) {
        const now = this.ctx.currentTime;
        
        switch(band) {
            case 'low':
                if (param === 'gain') {
                    this.eq.lowAmount = value;
                    if (!this.eq.lowKill) {
                        this.eq.low.gain.setTargetAtTime(value, now, 0.01);
                    }
                } else if (param === 'freq') {
                    this.eq.lowFreq = value;
                    this.eq.low.frequency.setTargetAtTime(value, now, 0.01);
                } else if (param === 'kill') {
                    this.eq.lowKill = value;
                    this.eq.lowGain.gain.setTargetAtTime(value ? 0 : 1, now, 0.01);
                }
                break;
                
            case 'mid':
                if (param === 'gain') {
                    this.eq.midAmount = value;
                    if (!this.eq.midKill) {
                        this.eq.mid.gain.setTargetAtTime(value, now, 0.01);
                    }
                } else if (param === 'freq') {
                    this.eq.midFreq = value;
                    this.eq.mid.frequency.setTargetAtTime(value, now, 0.01);
                } else if (param === 'kill') {
                    this.eq.midKill = value;
                    this.eq.midGain.gain.setTargetAtTime(value ? 0 : 1, now, 0.01);
                }
                break;
                
            case 'high':
                if (param === 'gain') {
                    this.eq.highAmount = value;
                    if (!this.eq.highKill) {
                        this.eq.high.gain.setTargetAtTime(value, now, 0.01);
                    }
                } else if (param === 'freq') {
                    this.eq.highFreq = value;
                    this.eq.high.frequency.setTargetAtTime(value, now, 0.01);
                } else if (param === 'kill') {
                    this.eq.highKill = value;
                    this.eq.highGain.gain.setTargetAtTime(value ? 0 : 1, now, 0.01);
                }
                break;
        }
    }
    
    /**
     * Set saturation parameter
     */
    setSaturation(param, value) {
        switch(param) {
            case 'mode':
                this.saturation.mode = value;
                this.updateSaturationCurve();
                break;
            case 'drive':
                this.saturation.drive = value;
                this.updateSaturationCurve();
                break;
            case 'bias':
                this.saturation.bias = value;
                this.updateSaturationCurve();
                break;
            case 'mix':
                this.saturation.mix = value;
                this.updateSaturationMix();
                break;
            case 'harmonics':
                this.saturation.harmonics = value;
                this.updateSaturationCurve();
                break;
        }
    }
    
    /**
     * Set pan position
     */
    setPan(value) {
        const now = this.ctx.currentTime;
        this.panner.pan.setTargetAtTime(value, now, 0.01);
    }
    
    /**
     * Set channel fader level
     */
    setLevel(value) {
        const now = this.ctx.currentTime;
        this.fader.gain.setTargetAtTime(value, now, 0.01);
    }
    
    /**
     * Set mute state
     */
    setMute(muted) {
        this.muted = muted;
        const now = this.ctx.currentTime;
        this.output.gain.setTargetAtTime(muted ? 0 : 1, now, 0.01);
    }
}

/**
 * Master Bus - Sums all channels and provides master level control
 * NOW WITH: Mimeophon-inspired stereo delay + QuadraVerb algorithmic reverb send effects
 */
export class MasterBus {
    constructor(ctx) {
        this.ctx = ctx;
        
        // === Input Summing ===
        this.input = ctx.createGain();
        this.input.gain.value = 1.0;
        
        // === Master Fader ===
        this.fader = ctx.createGain();
        this.fader.gain.value = 0.85;
        
        // === Send Effects ===
        // Mimeophon send/return
        this.mimeophonSend = ctx.createGain();
        this.mimeophonSend.gain.value = 0;
        this.mimeophonReturn = ctx.createGain();
        this.mimeophonReturn.gain.value = 1.0;
        
        // Mimeophon will be connected later after worklet loads
        this.mimeophon = null;
        
        // QuadraVerb send/return
        this.quadraverbSend = ctx.createGain();
        this.quadraverbSend.gain.value = 0;
        this.quadraverbSendTrim = ctx.createGain();
        this.quadraverbSendTrim.gain.value = 0.65; // -3.7 dB to prevent hot send drive
        this.quadraverbReturn = ctx.createGain();
        this.quadraverbReturn.gain.value = 1.0;
        this.quadraverbReturnLimiter = ctx.createDynamicsCompressor();
        this.quadraverbReturnLimiter.threshold.value = -9;
        this.quadraverbReturnLimiter.knee.value = 12;
        this.quadraverbReturnLimiter.ratio.value = 8;
        this.quadraverbReturnLimiter.attack.value = 0.003;
        this.quadraverbReturnLimiter.release.value = 0.18;
        
        // QuadraVerb will be connected after initialization
        this.quadraverb = null;
        
        // === Output ===
        this.output = ctx.createGain();
        this.output.gain.value = 1.0;
        
        // === Routing ===
        // Main path
        this.input.connect(this.fader);
        this.fader.connect(this.output);
        
        // Mimeophon send path
        this.fader.connect(this.mimeophonSend);
        // mimeophonSend -> mimeophon -> mimeophonReturn -> output
        // (connected when mimeophon is initialized)
        this.mimeophonReturn.connect(this.output);
        
        // QuadraVerb send path
        this.fader.connect(this.quadraverbSend);
        this.quadraverbSend.connect(this.quadraverbSendTrim);
        // quadraverbSendTrim -> quadraverb -> quadraverbReturnLimiter -> quadraverbReturn -> output
        // (connected when quadraverb is initialized)
        this.quadraverbReturn.connect(this.output);
        
        // Output to speakers
        this.output.connect(ctx.destination);
    }
    
    /**
     * Set Mimeophon instance (called after worklet loads)
     */
    setMimeophon(mimeophonNode) {
        this.mimeophon = mimeophonNode;
        
        // Connect send path
        this.mimeophonSend.connect(mimeophonNode.input);
        mimeophonNode.output.connect(this.mimeophonReturn);
        
        // Set mimeophon to 100% wet since it's a send effect
        mimeophonNode.setMix(1.0);
    }
    
    /**
     * Set QuadraVerb instance
     */
    setQuadraVerb(quadraverbNode) {
        this.quadraverb = quadraverbNode;

        // Connect send path
        this.quadraverbSendTrim.connect(quadraverbNode.input);
        quadraverbNode.connect(this.quadraverbReturnLimiter);
        this.quadraverbReturnLimiter.connect(this.quadraverbReturn);

        // Set quadraverb to 100% wet since it's a send effect
        if (typeof quadraverbNode.enableSendMode === 'function') {
            quadraverbNode.enableSendMode();
        } else {
            quadraverbNode.setParam('mix', 1.0);
        }
    }
    
    /**
     * Set master level
     */
    setLevel(value) {
        const now = this.ctx.currentTime;
        this.fader.gain.setTargetAtTime(value, now, 0.01);
    }
    
    /**
     * Set Mimeophon send level
     */
    setMimeophonSend(value) {
        const now = this.ctx.currentTime;
        this.mimeophonSend.gain.setTargetAtTime(value, now, 0.01);
    }
    
    /**
     * Set Mimeophon return level
     */
    setMimeophonReturn(value) {
        const now = this.ctx.currentTime;
        this.mimeophonReturn.gain.setTargetAtTime(value, now, 0.01);
    }
    
    /**
     * Set QuadraVerb send level
     */
    setQuadraVerbSend(value) {
        const now = this.ctx.currentTime;
        this.quadraverbSend.gain.setTargetAtTime(value, now, 0.01);

        if (this.quadraverb) {
            this.quadraverb.setParam('sendLevel', value);
        }
    }
    
    /**
     * Set QuadraVerb return level
     */
    setQuadraVerbReturn(value) {
        const now = this.ctx.currentTime;
        this.quadraverbReturn.gain.setTargetAtTime(value, now, 0.01);
    }
}

/**
 * Mixer - Manages all channel strips and master bus
 * NOW WITH: Mimeophon + QuadraVerb effect integration
 */
export class Mixer {
    constructor(ctx, numChannels = 3) {
        this.ctx = ctx;
        this.numChannels = numChannels;
        
        // Create channel strips
        this.channels = [];
        for (let i = 0; i < numChannels; i++) {
            this.channels.push(new ChannelStrip(ctx, i + 1));
        }
        
        // Create master bus
        this.master = new MasterBus(ctx);
        
        // Connect all channels to master
        this.channels.forEach(channel => {
            channel.output.connect(this.master.input);
        });
        
        // Effects status
        this.mimeophonReady = false;
        this.quadraverbReady = false;
    }
    
    /**
     * Initialize Mimeophon effect
     * Must be called after user interaction to enable AudioWorklet
     */
    async initMimeophon() {
        try {
            const { MimeophonNode } = await import('./MimeophonNode.js');
            const mimeophon = new MimeophonNode(this.ctx);
            await mimeophon.init();
            
            this.master.setMimeophon(mimeophon);
            this.mimeophonReady = true;
            
            console.log('Mimeophon initialized successfully');
            return mimeophon;
        } catch (error) {
            console.error('Failed to initialize Mimeophon:', error);
            throw error;
        }
    }
    
    /**
     * Initialize QuadraVerb effect
     */
    async initQuadraVerb() {
        try {
            const { QuadraVerbReverb } = await import('./QuadraVerbReverb.js');
            const quadraverb = new QuadraVerbReverb(this.ctx);
            
            this.master.setQuadraVerb(quadraverb);
            this.quadraverbReady = true;
            
            console.log('QuadraVerb initialized successfully');
            return quadraverb;
        } catch (error) {
            console.error('Failed to initialize QuadraVerb:', error);
            throw error;
        }
    }
    
    /**
     * Get a specific channel
     */
    getChannel(index) {
        return this.channels[index];
    }
    
    /**
     * Get master bus
     */
    getMaster() {
        return this.master;
    }
    
    /**
     * Get Mimeophon effect
     */
    getMimeophon() {
        return this.master.mimeophon;
    }
    
    /**
     * Get QuadraVerb effect
     */
    getQuadraVerb() {
        return this.master.quadraverb;
    }
}
