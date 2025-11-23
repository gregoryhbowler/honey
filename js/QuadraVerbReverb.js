// QuadraVerbReverb.js
// Quadraverb-inspired algorithmic reverb with FDN topology
// Dense, lush, slightly grainy 1990s digital reverb aesthetic

/**
 * NODE GRAPH DIAGRAM:
 * 
 * Input → PreDelay → EarlyReflections ↘
 *                                      → Diffusion → FDN → HighShelf → Stereo → Output
 *                    MultiTapDelay    ↗            (4-8 lines)        Width
 *                    (Echo mode)                   + Modulation
 *                                                  + Damping
 *                                                  + Crossfeed
 * 
 * FDN Structure (per line):
 * Input → DelayNode ← FeedbackGain ← LowpassFilter ← Output
 *             ↓
 *         Modulation (LFO)
 */

export class QuadraVerbReverb {
    constructor(ctx) {
        this.ctx = ctx;
        
        // === Parameters ===
        this.params = {
            mix: 0.3,
            preDelay: 0,              // 0-120 ms
            decay: 2.5,               // 0.2-15 s
            damping: 8000,            // 4-12 kHz
            diffusion: 0.7,           // 0-1
            modDepth: 0.3,            // 0-1
            modRate: 0.2,             // 0.1-1 Hz
            program: 'hall',          // 'hall', 'plate', 'rich', 'chorusVerb', 'echoVerb', 'gated'
            bitReduction: 0,          // 0-1
            noiseAmount: 0,           // 0-1
            stereoWidth: 1.0,         // 0-2
            quality: 'normal'         // 'normal', 'high'
        };
        
        // === Core Nodes ===
        this.input = ctx.createGain();
        this.input.gain.value = 1.0;
        
        this.output = ctx.createGain();
        this.output.gain.value = 1.0;
        
        // Dry/Wet mix
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();
        this.dryGain.gain.value = 0.7;
        this.wetGain.gain.value = 0.3;
        
        // === Pre-delay ===
        this.preDelayNode = ctx.createDelay(0.12);
        this.preDelayNode.delayTime.value = 0;
        
        // === Early Reflections ===
        this.earlyReflections = this.createEarlyReflections();
        
        // === Multi-tap Echo (for Echo mode) ===
        this.multiTapEcho = this.createMultiTapEcho();
        
        // === Diffusion Stage ===
        this.diffusionAllpasses = this.createDiffusionStage();

        // === Modulation LFOs ===
        // Must be created before the FDN so modulation targets exist when lines are wired
        this.lfo1 = ctx.createOscillator();
        this.lfo1.frequency.value = 0.2;
        this.lfo1.type = 'sine';
        this.lfo1.start();

        this.lfo2 = ctx.createOscillator();
        this.lfo2.frequency.value = 0.13;
        this.lfo2.type = 'triangle';
        this.lfo2.start();

        // === FDN (Feedback Delay Network) ===
        this.fdnLines = this.createFDN();
        
        // === Character Filters ===
        // High-shelf for "vintage digital" rolloff
        this.highShelf = ctx.createBiquadFilter();
        this.highShelf.type = 'highshelf';
        this.highShelf.frequency.value = 8000;
        this.highShelf.gain.value = -3;
        
        // === Stereo Width ===
        this.stereoWidthMerger = ctx.createChannelMerger(2);
        this.stereoWidthSplitter = ctx.createChannelSplitter(2);
        this.leftGain = ctx.createGain();
        this.rightGain = ctx.createGain();
        this.crossGain = ctx.createGain();
        
        // === Noise Generator (optional) ===
        this.noiseBuffer = this.createNoiseBuffer();
        this.noiseSource = null;
        this.noiseGain = ctx.createGain();
        this.noiseGain.gain.value = 0;
        
        // === Initial Routing ===
        this.setupRouting();
        
        // === Presets ===
        this.presets = this.createPresets();
    }
    
    /**
     * Create early reflections - synthetic, geometric taps
     */
    createEarlyReflections() {
        const ers = {
            input: this.ctx.createGain(),
            output: this.ctx.createGain(),
            taps: []
        };
        
        // 8 early reflection taps with geometric spacing
        const tapTimes = [5, 11, 17, 23, 31, 37, 43, 53]; // ms, prime-ish spacing
        const tapGains = [0.8, 0.7, 0.65, 0.6, 0.5, 0.45, 0.4, 0.35];
        
        tapTimes.forEach((time, i) => {
            const delay = this.ctx.createDelay(0.1);
            delay.delayTime.value = time / 1000;
            
            const gain = this.ctx.createGain();
            gain.gain.value = tapGains[i];
            
            // Pan each tap slightly for stereo
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = (i % 2 === 0) ? -0.3 : 0.3;
            
            ers.input.connect(delay);
            delay.connect(gain);
            gain.connect(panner);
            panner.connect(ers.output);
            
            ers.taps.push({ delay, gain, panner });
        });
        
        return ers;
    }
    
    /**
     * Create multi-tap echo for Echo mode
     */
    createMultiTapEcho() {
        const echo = {
            input: this.ctx.createGain(),
            output: this.ctx.createGain(),
            taps: []
        };
        
        // 4 rhythmic echo taps
        const tapTimes = [150, 300, 450, 600]; // ms
        const tapGains = [0.6, 0.4, 0.3, 0.2];
        
        tapTimes.forEach((time, i) => {
            const delay = this.ctx.createDelay(1.0);
            delay.delayTime.value = time / 1000;
            
            const gain = this.ctx.createGain();
            gain.gain.value = tapGains[i];
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 6000 - (i * 1000);
            
            echo.input.connect(delay);
            delay.connect(filter);
            filter.connect(gain);
            gain.connect(echo.output);
            
            echo.taps.push({ delay, gain, filter });
        });
        
        return echo;
    }
    
    /**
     * Create diffusion stage - serial allpass filters
     */
    createDiffusionStage() {
        const diffusion = {
            input: this.ctx.createGain(),
            output: this.ctx.createGain(),
            allpasses: []
        };
        
        // Allpass delay times in ms (prime-ish for dense diffusion)
        const quality = this.params.quality;
        const apTimes = quality === 'high' 
            ? [7, 13, 19, 29]  // 4 allpasses in high quality
            : [11, 23];         // 2 allpasses in normal quality
        
        let prevNode = diffusion.input;
        
        apTimes.forEach(time => {
            const ap = this.createAllpass(time / 1000, 0.7);
            prevNode.connect(ap.input);
            prevNode = ap.output;
            diffusion.allpasses.push(ap);
        });
        
        prevNode.connect(diffusion.output);
        
        return diffusion;
    }
    
    /**
     * Create a single allpass filter using delay + feedback
     */
    createAllpass(delayTime, coefficient) {
        const ap = {
            input: this.ctx.createGain(),
            output: this.ctx.createGain(),
            delay: this.ctx.createDelay(0.1),
            feedbackGain: this.ctx.createGain(),
            feedforwardGain: this.ctx.createGain()
        };
        
        ap.delay.delayTime.value = delayTime;
        ap.feedbackGain.gain.value = coefficient;
        ap.feedforwardGain.gain.value = -coefficient;
        
        // Allpass topology: input → delay → output
        //                          ↓ feedback
        //                   input → feedforward → output
        ap.input.connect(ap.delay);
        ap.delay.connect(ap.feedbackGain);
        ap.feedbackGain.connect(ap.delay);
        ap.delay.connect(ap.output);
        
        ap.input.connect(ap.feedforwardGain);
        ap.feedforwardGain.connect(ap.output);
        
        return ap;
    }
    
    /**
     * Create FDN (Feedback Delay Network)
     */
    createFDN() {
        const quality = this.params.quality;
        const numLines = quality === 'high' ? 8 : 4;
        
        // Prime-ish delay times in ms for nice diffusion
        const delayTimes = [
            37, 41, 43, 47, 53, 59, 61, 67
        ].slice(0, numLines);
        
        const lines = [];
        const mixer = this.ctx.createGain(); // Mix all FDN outputs
        
        for (let i = 0; i < numLines; i++) {
            const line = {
                input: this.ctx.createGain(),
                delay: this.ctx.createDelay(0.15),
                feedback: this.ctx.createGain(),
                damping: this.ctx.createBiquadFilter(),
                output: this.ctx.createGain(),
                modGain: this.ctx.createGain(),
                panner: this.ctx.createStereoPanner()
            };
            
            // Set delay time
            line.delay.delayTime.value = delayTimes[i] / 1000;
            
            // Feedback coefficient (will be modulated by decay param)
            line.feedback.gain.value = 0.7;
            
            // Damping filter (lowpass inside feedback loop)
            line.damping.type = 'lowpass';
            line.damping.frequency.value = 8000;
            line.damping.Q.value = 0.5;
            
            // Modulation depth control
            line.modGain.gain.value = 0.002; // Small modulation depth
            
            // Pan each line for stereo
            line.panner.pan.value = (i / numLines) * 2 - 1; // Spread across stereo field
            
            // Routing: input → delay → damping → feedback → delay (loop)
            //                    delay → output
            line.input.connect(line.delay);
            line.delay.connect(line.damping);
            line.damping.connect(line.feedback);
            line.feedback.connect(line.delay);
            line.delay.connect(line.output);
            line.output.connect(line.panner);
            line.panner.connect(mixer);
            
            // Connect LFO modulation to delay time
            this.lfo1.connect(line.modGain);
            line.modGain.connect(line.delay.delayTime);
            
            lines.push(line);
        }
        
        // Crossfeed between lines for richness
        this.createFDNCrossfeed(lines);
        
        return { lines, mixer };
    }
    
    /**
     * Create crossfeed matrix between FDN lines
     */
    createFDNCrossfeed(lines) {
        const numLines = lines.length;
        
        for (let i = 0; i < numLines; i++) {
            // Each line feeds into the next line (circular)
            const nextLine = (i + 1) % numLines;
            const crossGain = this.ctx.createGain();
            crossGain.gain.value = 0.3; // Crossfeed amount
            
            lines[i].output.connect(crossGain);
            crossGain.connect(lines[nextLine].input);
        }
    }
    
    /**
     * Create noise buffer for subtle noise floor
     */
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.02; // Very quiet noise
        }
        
        return buffer;
    }
    
    /**
     * Setup initial routing based on current program
     */
    setupRouting() {
        this.setProgram(this.params.program);
    }
    
    /**
     * Connect input to output through the reverb
     */
    connect(destination) {
        this.output.connect(destination);
    }
    
    /**
     * Disconnect all outputs
     */
    disconnect() {
        this.output.disconnect();
    }
    
    /**
     * Set reverb program (routing topology)
     */
    setProgram(program) {
        this.params.program = program;
        
        // Disconnect all internal routing first
        this.disconnectAllRouting();
        
        // Setup routing based on program
        switch(program) {
            case 'hall':
                this.setupHallRouting();
                break;
            case 'plate':
            case 'rich':
                this.setupPlateRouting();
                break;
            case 'chorusVerb':
                this.setupChorusVerbRouting();
                break;
            case 'echoVerb':
                this.setupEchoVerbRouting();
                break;
            case 'gated':
                this.setupGatedRouting();
                break;
        }
    }
    
    /**
     * Disconnect all internal routing
     */
    disconnectAllRouting() {
        try {
            this.input.disconnect();
            this.preDelayNode.disconnect();
            this.earlyReflections.output.disconnect();
            this.multiTapEcho.output.disconnect();
            this.diffusionAllpasses.output.disconnect();
            this.fdnLines.mixer.disconnect();
            this.highShelf.disconnect();
        } catch(e) {
            // Some nodes may not be connected, that's ok
        }
    }
    
    /**
     * Setup Hall routing: Input → Early → Diffusion → FDN → Output
     */
    setupHallRouting() {
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);
        
        this.input.connect(this.preDelayNode);
        this.preDelayNode.connect(this.earlyReflections.input);
        this.earlyReflections.output.connect(this.diffusionAllpasses.input);
        this.diffusionAllpasses.output.connect(this.fdnLines.lines[0].input);
        
        // Route FDN mixer to high shelf
        this.fdnLines.mixer.connect(this.highShelf);
        this.highShelf.connect(this.wetGain);
        this.wetGain.connect(this.output);
        
        // Update parameters for hall sound
        this.fdnLines.lines.forEach(line => {
            line.damping.frequency.value = this.params.damping;
            line.feedback.gain.value = this.calculateFeedback(this.params.decay);
        });
    }
    
    /**
     * Setup Plate routing: Input → Pre-delay → Heavy Diffusion → FDN → Output
     */
    setupPlateRouting() {
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);
        
        this.input.connect(this.preDelayNode);
        this.preDelayNode.connect(this.diffusionAllpasses.input);
        this.diffusionAllpasses.output.connect(this.fdnLines.lines[0].input);
        
        this.fdnLines.mixer.connect(this.highShelf);
        this.highShelf.connect(this.wetGain);
        this.wetGain.connect(this.output);
        
        // Plate has brighter damping and higher feedback
        this.fdnLines.lines.forEach(line => {
            line.damping.frequency.value = this.params.damping * 1.2;
            line.feedback.gain.value = this.calculateFeedback(this.params.decay) * 1.1;
        });
    }
    
    /**
     * Setup ChorusVerb routing: Higher modulation depth
     */
    setupChorusVerbRouting() {
        this.setupHallRouting();
        
        // Increase modulation depth for chorus effect
        this.fdnLines.lines.forEach(line => {
            line.modGain.gain.value = 0.005; // 2.5x normal modulation
        });
    }
    
    /**
     * Setup EchoVerb routing: Multi-tap → Diffusion → FDN
     */
    setupEchoVerbRouting() {
        this.input.connect(this.dryGain);
        this.dryGain.connect(this.output);
        
        this.input.connect(this.preDelayNode);
        this.preDelayNode.connect(this.multiTapEcho.input);
        this.multiTapEcho.output.connect(this.diffusionAllpasses.input);
        this.diffusionAllpasses.output.connect(this.fdnLines.lines[0].input);
        
        this.fdnLines.mixer.connect(this.highShelf);
        this.highShelf.connect(this.wetGain);
        this.wetGain.connect(this.output);
    }
    
    /**
     * Setup Gated routing: Short decay with envelope
     */
    setupGatedRouting() {
        this.setupHallRouting();
        
        // Very short decay for gated effect
        this.fdnLines.lines.forEach(line => {
            line.feedback.gain.value = 0.4; // Short decay
        });
    }
    
    /**
     * Calculate feedback coefficient from decay time
     */
    calculateFeedback(decayTime) {
        // RT60 formula: feedback = 10^(-3 * delay / RT60)
        const avgDelay = 0.05; // Average delay line time in seconds
        const feedback = Math.pow(10, (-3 * avgDelay) / decayTime);
        return Math.max(0, Math.min(0.99, feedback));
    }
    
    /**
     * Set parameter
     */
    setParam(param, value) {
        this.params[param] = value;
        const now = this.ctx.currentTime;
        
        switch(param) {
            case 'mix':
                this.wetGain.gain.setTargetAtTime(value, now, 0.01);
                this.dryGain.gain.setTargetAtTime(1 - value, now, 0.01);
                break;
                
            case 'preDelay':
                this.preDelayNode.delayTime.setTargetAtTime(value / 1000, now, 0.01);
                break;
                
            case 'decay':
                const feedback = this.calculateFeedback(value);
                this.fdnLines.lines.forEach(line => {
                    line.feedback.gain.setTargetAtTime(feedback, now, 0.05);
                });
                break;
                
            case 'damping':
                this.fdnLines.lines.forEach(line => {
                    line.damping.frequency.setTargetAtTime(value, now, 0.01);
                });
                break;
                
            case 'diffusion':
                this.diffusionAllpasses.allpasses.forEach(ap => {
                    const coeff = 0.5 + (value * 0.3);
                    ap.feedbackGain.gain.setTargetAtTime(coeff, now, 0.01);
                    ap.feedforwardGain.gain.setTargetAtTime(-coeff, now, 0.01);
                });
                break;
                
            case 'modDepth':
                this.fdnLines.lines.forEach(line => {
                    const baseDepth = this.params.program === 'chorusVerb' ? 0.005 : 0.002;
                    line.modGain.gain.setTargetAtTime(baseDepth * value, now, 0.01);
                });
                break;
                
            case 'modRate':
                this.lfo1.frequency.setTargetAtTime(0.1 + (value * 0.5), now, 0.01);
                this.lfo2.frequency.setTargetAtTime(0.05 + (value * 0.25), now, 0.01);
                break;
                
            case 'program':
                this.setProgram(value);
                break;
                
            case 'noiseAmount':
                this.noiseGain.gain.setTargetAtTime(value * 0.001, now, 0.01);
                break;
                
            case 'stereoWidth':
                // Implemented via stereo matrix (future enhancement)
                break;
        }
    }
    
    /**
     * Get parameter value
     */
    getParam(param) {
        return this.params[param];
    }
    
    /**
     * Create preset library
     */
    createPresets() {
        return {
            'Large Hall': {
                mix: 0.35,
                preDelay: 30,
                decay: 4.5,
                damping: 7000,
                diffusion: 0.8,
                modDepth: 0.2,
                modRate: 0.15,
                program: 'hall'
            },
            'Warm Plate': {
                mix: 0.4,
                preDelay: 10,
                decay: 2.5,
                damping: 9000,
                diffusion: 0.9,
                modDepth: 0.15,
                modRate: 0.25,
                program: 'plate'
            },
            'Rich Chamber': {
                mix: 0.3,
                preDelay: 5,
                decay: 1.8,
                damping: 8500,
                diffusion: 0.75,
                modDepth: 0.25,
                modRate: 0.2,
                program: 'rich'
            },
            'Shimmer Verb': {
                mix: 0.45,
                preDelay: 20,
                decay: 6.0,
                damping: 10000,
                diffusion: 0.85,
                modDepth: 0.6,
                modRate: 0.35,
                program: 'chorusVerb'
            },
            'Echo Chamber': {
                mix: 0.35,
                preDelay: 0,
                decay: 3.0,
                damping: 6000,
                diffusion: 0.6,
                modDepth: 0.3,
                modRate: 0.18,
                program: 'echoVerb'
            },
            'Gated Verb': {
                mix: 0.5,
                preDelay: 0,
                decay: 0.8,
                damping: 7500,
                diffusion: 0.7,
                modDepth: 0.1,
                modRate: 0.12,
                program: 'gated'
            },
            'Small Room': {
                mix: 0.25,
                preDelay: 5,
                decay: 0.6,
                damping: 8000,
                diffusion: 0.65,
                modDepth: 0.2,
                modRate: 0.22,
                program: 'hall'
            },
            'Cathedral': {
                mix: 0.4,
                preDelay: 50,
                decay: 8.0,
                damping: 6500,
                diffusion: 0.9,
                modDepth: 0.15,
                modRate: 0.1,
                program: 'hall'
            }
        };
    }
    
    /**
     * Load a preset
     */
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        Object.keys(preset).forEach(param => {
            this.setParam(param, preset[param]);
        });
    }
    
    /**
     * Get current preset as object
     */
    getCurrentPreset() {
        return { ...this.params };
    }
    
    /**
     * Randomize parameters (musically constrained)
     */
    randomize() {
        const programs = ['hall', 'plate', 'rich', 'chorusVerb', 'echoVerb', 'gated'];
        
        this.setParam('program', programs[Math.floor(Math.random() * programs.length)]);
        this.setParam('mix', 0.2 + Math.random() * 0.4);
        this.setParam('preDelay', Math.random() * 60);
        this.setParam('decay', 0.5 + Math.random() * 5);
        this.setParam('damping', 5000 + Math.random() * 6000);
        this.setParam('diffusion', 0.5 + Math.random() * 0.4);
        this.setParam('modDepth', Math.random() * 0.5);
        this.setParam('modRate', 0.1 + Math.random() * 0.4);
    }
}
