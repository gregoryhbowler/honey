// Mimeophon Node - Wrapper for the AudioWorklet processor
// Provides a clean API for the Mimeophon-inspired stereo delay

export class MimeophonNode {
    constructor(audioContext) {
        this.context = audioContext;
        this.node = null;
        this.input = null;
        this.output = null;
        this.params = {};
        this.isReady = false;
    }
    
    /**
     * Initialize the worklet and create the node
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isReady) return;
        
        try {
            // Load the processor worklet
            await this.context.audioWorklet.addModule('./js/mimeophon-processor.js');
            
            // Create the worklet node
            this.node = new AudioWorkletNode(this.context, 'mimeophon-processor', {
                numberOfInputs: 1,
                numberOfOutputs: 1,
                outputChannelCount: [2],
                processorOptions: {
                    sampleRate: this.context.sampleRate
                }
            });
            
            // Create input and output gain nodes for easier connection
            this.input = this.context.createGain();
            this.output = this.context.createGain();
            
            // Connect: input -> worklet -> output
            this.input.connect(this.node);
            this.node.connect(this.output);
            
            // Store references to all parameters
            this.params = {
                zone: this.node.parameters.get('zone'),
                rate: this.node.parameters.get('rate'),
                microRate: this.node.parameters.get('microRate'),
                microRateFreq: this.node.parameters.get('microRateFreq'),
                skew: this.node.parameters.get('skew'),
                repeats: this.node.parameters.get('repeats'),
                color: this.node.parameters.get('color'),
                halo: this.node.parameters.get('halo'),
                mix: this.node.parameters.get('mix'),
                hold: this.node.parameters.get('hold'),
                flip: this.node.parameters.get('flip'),
                pingPong: this.node.parameters.get('pingPong'),
                swap: this.node.parameters.get('swap')
            };
            
            this.isReady = true;
        } catch (error) {
            console.error('Failed to initialize MimeophonNode:', error);
            throw error;
        }
    }
    
    /**
     * Connect the Mimeophon to a destination
     * @param {AudioNode} destination - Destination node
     */
    connect(destination) {
        if (!this.isReady) {
            console.warn('MimeophonNode not initialized yet');
            return;
        }
        this.output.connect(destination);
    }
    
    /**
     * Disconnect from all destinations
     */
    disconnect() {
        if (!this.isReady) return;
        this.output.disconnect();
    }
    
    /**
     * Set a parameter value
     * @param {string} paramName - Parameter name
     * @param {number} value - Parameter value
     * @param {number} [time] - Time to set the value (for automation)
     */
    setParam(paramName, value, time) {
        if (!this.isReady || !this.params[paramName]) {
            console.warn(`Parameter ${paramName} not found`);
            return;
        }
        
        const param = this.params[paramName];
        const when = time !== undefined ? time : this.context.currentTime;
        
        param.setValueAtTime(value, when);
    }
    
    /**
     * Ramp a parameter to a value
     * @param {string} paramName - Parameter name
     * @param {number} value - Target value
     * @param {number} duration - Ramp duration in seconds
     */
    rampParam(paramName, value, duration = 0.1) {
        if (!this.isReady || !this.params[paramName]) {
            console.warn(`Parameter ${paramName} not found`);
            return;
        }
        
        const param = this.params[paramName];
        const now = this.context.currentTime;
        
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
        param.linearRampToValueAtTime(value, now + duration);
    }
    
    /**
     * Set zone (0-3: A, B, C, D)
     * @param {number} zone - Zone index
     */
    setZone(zone) {
        this.setParam('zone', Math.max(0, Math.min(3, zone)));
    }
    
    /**
     * Set rate within the current zone (0-1)
     * @param {number} rate - Rate value
     */
    setRate(rate) {
        this.setParam('rate', Math.max(0, Math.min(1, rate)));
    }
    
    /**
     * Set delay time directly in seconds (will auto-select zone)
     * @param {number} seconds - Delay time in seconds
     */
    setDelayTime(seconds) {
        let zone, rate;
        
        if (seconds < 0.050) {
            // Zone A: 5-50ms
            zone = 0;
            rate = (seconds - 0.005) / 0.045;
        } else if (seconds < 0.400) {
            // Zone B: 50-400ms
            zone = 1;
            rate = (seconds - 0.050) / 0.350;
        } else if (seconds < 2.000) {
            // Zone C: 400-2000ms
            zone = 2;
            rate = (seconds - 0.400) / 1.600;
        } else {
            // Zone D: 2-10s
            zone = 3;
            rate = (seconds - 2.000) / 8.000;
        }
        
        this.setZone(zone);
        this.setRate(Math.max(0, Math.min(1, rate)));
    }
    
    /**
     * Set microRate modulation amount (0-1)
     * @param {number} amount - Modulation amount
     */
    setMicroRate(amount) {
        this.setParam('microRate', Math.max(0, Math.min(1, amount)));
    }
    
    /**
     * Set microRate LFO frequency (0.1-8 Hz)
     * @param {number} freq - Frequency in Hz
     */
    setMicroRateFreq(freq) {
        this.setParam('microRateFreq', Math.max(0.1, Math.min(8, freq)));
    }
    
    /**
     * Set skew amount (-1 to +1)
     * @param {number} skew - Skew amount
     */
    setSkew(skew) {
        this.setParam('skew', Math.max(-1, Math.min(1, skew)));
    }
    
    /**
     * Set repeats/feedback amount (0-1.2)
     * @param {number} repeats - Feedback amount
     */
    setRepeats(repeats) {
        this.setParam('repeats', Math.max(0, Math.min(1.2, repeats)));
    }
    
    /**
     * Set color/filter character (0-1)
     * @param {number} color - Color value
     */
    setColor(color) {
        this.setParam('color', Math.max(0, Math.min(1, color)));
    }
    
    /**
     * Set halo/diffusion amount (0-1)
     * @param {number} halo - Halo amount
     */
    setHalo(halo) {
        this.setParam('halo', Math.max(0, Math.min(1, halo)));
    }
    
    /**
     * Set dry/wet mix (0-1)
     * @param {number} mix - Mix amount
     */
    setMix(mix) {
        this.setParam('mix', Math.max(0, Math.min(1, mix)));
    }
    
    /**
     * Set hold state
     * @param {boolean} hold - Hold state
     */
    setHold(hold) {
        this.setParam('hold', hold ? 1 : 0);
    }
    
    /**
     * Set flip/reverse state
     * @param {boolean} flip - Flip state
     */
    setFlip(flip) {
        this.setParam('flip', flip ? 1 : 0);
    }
    
    /**
     * Set ping-pong mode
     * @param {boolean} pingPong - Ping-pong state
     */
    setPingPong(pingPong) {
        this.setParam('pingPong', pingPong ? 1 : 0);
    }
    
    /**
     * Set swap mode
     * @param {boolean} swap - Swap state
     */
    setSwap(swap) {
        this.setParam('swap', swap ? 1 : 0);
    }
    
    /**
     * Get current parameter values
     * @returns {Object} Current parameter values
     */
    getParams() {
        if (!this.isReady) return {};
        
        return {
            zone: this.params.zone.value,
            rate: this.params.rate.value,
            microRate: this.params.microRate.value,
            microRateFreq: this.params.microRateFreq.value,
            skew: this.params.skew.value,
            repeats: this.params.repeats.value,
            color: this.params.color.value,
            halo: this.params.halo.value,
            mix: this.params.mix.value,
            hold: this.params.hold.value > 0.5,
            flip: this.params.flip.value > 0.5,
            pingPong: this.params.pingPong.value > 0.5,
            swap: this.params.swap.value > 0.5
        };
    }
    
    /**
     * Load a preset
     * @param {Object} preset - Preset object
     */
    loadPreset(preset) {
        Object.entries(preset).forEach(([param, value]) => {
            this.setParam(param, value);
        });
    }
    
    /**
     * Get some useful presets
     * @returns {Object} Preset collection
     */
    static getPresets() {
        return {
            // Short delays
            karplus: {
                zone: 0,
                rate: 0.8,
                microRate: 0,
                skew: 0,
                repeats: 0.85,
                color: 0.3,
                halo: 0,
                mix: 0.5
            },
            
            flange: {
                zone: 0,
                rate: 0.3,
                microRate: 0.8,
                microRateFreq: 0.3,
                skew: 0.5,
                repeats: 0.7,
                color: 0.5,
                halo: 0.3,
                mix: 0.5
            },
            
            chorus: {
                zone: 1,
                rate: 0.2,
                microRate: 0.6,
                microRateFreq: 1.5,
                skew: 0.3,
                repeats: 0.3,
                color: 0.6,
                halo: 0.5,
                mix: 0.4
            },
            
            // Medium delays
            slapback: {
                zone: 1,
                rate: 0.4,
                microRate: 0,
                skew: 0,
                repeats: 0.3,
                color: 0.4,
                halo: 0.2,
                mix: 0.3
            },
            
            dubEcho: {
                zone: 2,
                rate: 0.5,
                microRate: 0.1,
                skew: 0.2,
                repeats: 0.6,
                color: 0.3,
                halo: 0.6,
                mix: 0.5
            },
            
            tapeDelay: {
                zone: 2,
                rate: 0.6,
                microRate: 0.2,
                microRateFreq: 0.5,
                skew: 0,
                repeats: 0.5,
                color: 0.45,
                halo: 0.4,
                mix: 0.4
            },
            
            // Long delays
            ambient: {
                zone: 3,
                rate: 0.5,
                microRate: 0.3,
                microRateFreq: 0.2,
                skew: 0.4,
                repeats: 0.8,
                color: 0.7,
                halo: 0.8,
                mix: 0.6
            },
            
            shimmer: {
                zone: 3,
                rate: 0.7,
                microRate: 0.4,
                microRateFreq: 2,
                skew: 0.6,
                repeats: 0.9,
                color: 0.85,
                halo: 1.0,
                mix: 0.7
            }
        };
    }
}
