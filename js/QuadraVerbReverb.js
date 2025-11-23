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

        // If enabled, locks the effect to 100% wet for safe send/return use
        this.sendMode = false;
        
        // === Parameters ===
        this.params = {
            mix: 0.3,
            preDelay: 0,              // 0-120 ms
            decay: 2.5,               // 0.2-15 s
            damping: 8000,            // 4-12 kHz (brightness tilt)
            hfTilt: 0,               // -1..1 darker/brighter tilt
            diffusion: 0.7,           // 0-1
            modDepth: 0.3,            // 0-1
            modRate: 0.2,             // 0.1-1 Hz
            program: 'hall',          // 'hall', 'plate', 'rich', 'chorusVerb', 'echoVerb', 'gated'
            bitReduction: 0,          // 0-1
            noiseAmount: 0,           // 0-1
            stereoWidth: 1.0,         // 0-2
            gateHold: 0.2,            // seconds gate stays open after trigger
            gateRelease: 0.15,        // seconds for gated tail to close
            gateLevel: 1.0,           // output level while gate is open
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

        // Extra headroom on wet path to prevent runaway when used as a hot send
        this.wetTrim = ctx.createGain();
        this.wetTrim.gain.value = 0.72;
        
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
        this.ensureLFOs();

        // === FDN (Feedback Delay Network) ===
        this.fdnLines = this.createFDN();
        
        // === Character Filters ===
        // High-shelf for "vintage digital" rolloff
        this.highShelf = ctx.createBiquadFilter();
        this.highShelf.type = 'highshelf';
        this.highShelf.frequency.value = 8000;
        this.highShelf.gain.value = -3;

        // Gentle low shelf/tilt to keep low end controlled
        this.lowShelf = ctx.createBiquadFilter();
        this.lowShelf.type = 'lowshelf';
        this.lowShelf.frequency.value = 180;
        this.lowShelf.gain.value = -1.5;

        // Gentle output limiter to prevent runaway feedback when used on a send
        this.outputLimiter = ctx.createDynamicsCompressor();
        this.outputLimiter.threshold.value = -18; // Catch hot feedback buildups
        this.outputLimiter.knee.value = 10;
        this.outputLimiter.ratio.value = 20;
        this.outputLimiter.attack.value = 0.002;
        this.outputLimiter.release.value = 0.15;
        
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

        // === Gated envelope ===
        this.gateEnvGain = ctx.createGain();
        this.gateEnvGain.gain.value = 1.0;
        this.gateDetector = this.createGateDetector();
        this.input.connect(this.gateDetector);
        this.gateDetector.connect(ctx.destination); // Silent tap to drive envelope follower
        
        // === Initial Routing ===
        this.setupRouting();

        // Prime modulation/diffusion with current defaults
        this.updateDiffusion(this.params.diffusion);
        this.updateModDepth(this.params.modDepth);

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
        // Ensure modulation sources exist before wiring modulation to the delay lines
        this.ensureLFOs();

        const quality = this.params.quality;
        // Normal: 3-4 shorter allpasses; High: 5-6 longer, denser allpasses
        const apTimes = quality === 'high'
            ? [7, 13, 19, 27, 33, 41]  // ms, incommensurate-ish
            : [9, 15, 23, 31];         // ms
        
        let prevNode = diffusion.input;
        
        apTimes.forEach((time, idx) => {
            const coeff = quality === 'high' ? 0.72 : 0.64;
            const ap = this.createAllpass(time / 1000, coeff);
            // Keep a tap handle so we can optionally bypass some at low diffusion
            ap.activeIndex = idx;
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
        // Ensure modulation sources exist before wiring them into the delay lines
        // (constructor order could be altered by future refactors)
        this.ensureLFOs();

        const quality = this.params.quality;
        const numLines = quality === 'high' ? 8 : 4;

        // Spread delay times wider (25–120 ms) and add tiny random dither to avoid combing
        const baseDelayTimes = [
            31, 47, 63, 79, 95, 109, 121, 137
        ].slice(0, numLines);
        const delayTimes = baseDelayTimes.map(time => {
            const jitter = (Math.random() * 6) - 3; // ±3 ms jitter
            return (time + jitter);
        });
        
        const lines = [];
        const mixer = this.ctx.createGain(); // Mix all FDN outputs
        
        for (let i = 0; i < numLines; i++) {
            const line = {
                input: this.ctx.createGain(),
                delay: this.ctx.createDelay(0.15),
                feedbackSum: this.ctx.createGain(),
                feedbackGain: this.ctx.createGain(),
                damping: this.ctx.createBiquadFilter(),
                output: this.ctx.createGain(),
                modGain: this.ctx.createGain(),
                modWeight1: this.ctx.createGain(),
                modWeight2: this.ctx.createGain(),
                panner: this.ctx.createStereoPanner()
            };
            
            // Set delay time
            line.delay.delayTime.value = delayTimes[i] / 1000;
            
            // Feedback coefficient (will be modulated by decay param)
            line.feedbackGain.gain.value = 0.7;
            
            // Damping filter (lowpass inside feedback loop)
            line.damping.type = 'lowpass';
            line.damping.frequency.value = 8000;
            line.damping.Q.value = 0.5;
            
            // Modulation depth control
            line.modGain.gain.value = 1.0; // Final modulation depth scaler
            line.modWeight1.gain.value = 0.0001;
            line.modWeight2.gain.value = 0.00008;
            line.modScale = 0.85 + Math.random() * 0.35;
            line.modBlend = 0.35 + Math.random() * 0.35; // blend between lfo1 (dominant) and lfo2
            
            // Pan each line for stereo
            line.panner.pan.value = (i / numLines) * 2 - 1; // Spread across stereo field
            
            // Routing: input → delay → damping → feedbackSum → feedbackGain → delay (loop)
            //                    delay → output
            line.input.connect(line.delay);
            line.delay.connect(line.damping);
            line.damping.connect(line.feedbackSum);
            line.feedbackSum.connect(line.feedbackGain);
            line.feedbackGain.connect(line.delay);
            line.delay.connect(line.output);
            line.output.connect(line.panner);
            line.panner.connect(mixer);

            // Decorrelated modulation: per-line blend of two LFOs
            this.lfo1.connect(line.modWeight1);
            this.lfo2.connect(line.modWeight2);
            line.modWeight1.connect(line.modGain);
            line.modWeight2.connect(line.modGain);
            line.modGain.connect(line.delay.delayTime);
            
            lines.push(line);
        }
        
        // Create proper unitary-ish mixing matrix between lines
        this.createFDNMixingMatrix(lines);

        return { lines, mixer };
    }

    /**
     * Create (or recreate) LFOs used for modulation in the FDN
     */
    ensureLFOs() {
        if (!this.lfo1) {
            this.lfo1 = this.ctx.createOscillator();
            this.lfo1.frequency.value = 0.2;
            this.lfo1.type = 'sine';
            this.lfo1.start();
        }

        if (!this.lfo2) {
            this.lfo2 = this.ctx.createOscillator();
            this.lfo2.frequency.value = 0.13;
            this.lfo2.type = 'triangle';
            this.lfo2.start();
        }
    }
    
    /**
     * Create feedback mixing matrix between FDN lines.
     *
     * We use a Hadamard-style matrix scaled by 1/sqrt(N) so it is energy-normalised.
     * The per-line feedbackGain node then controls the overall loop gain (RT60) safely.
     */
    createFDNMixingMatrix(lines) {
        const numLines = lines.length;
        const scale = 1 / Math.sqrt(numLines);
        // 4x4 and 8x8 Hadamard variants
        const hadamard4 = [
            [1, 1, 1, 1],
            [1, -1, 1, -1],
            [1, 1, -1, -1],
            [1, -1, -1, 1]
        ];
        const hadamard8 = [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, -1, 1, -1, 1, -1, 1, -1],
            [1, 1, -1, -1, 1, 1, -1, -1],
            [1, -1, -1, 1, 1, -1, -1, 1],
            [1, 1, 1, 1, -1, -1, -1, -1],
            [1, -1, 1, -1, -1, 1, -1, 1],
            [1, 1, -1, -1, -1, -1, 1, 1],
            [1, -1, -1, 1, -1, 1, 1, -1]
        ];

        const matrix = numLines === 8 ? hadamard8 : hadamard4;

        lines.forEach((fromLine, row) => {
            lines.forEach((toLine, col) => {
                const gain = this.ctx.createGain();
                gain.gain.value = matrix[row][col] * scale;
                // Feed damped output of each line into the feedback sum of every line
                fromLine.damping.connect(gain);
                gain.connect(toLine.feedbackSum);
            });
        });
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
     * Create a simple gate detector for gated/reverse programs.
     * Uses a ScriptProcessor to follow the input RMS and triggers an envelope on transients.
     */
    createGateDetector() {
        const processor = this.ctx.createScriptProcessor(1024, 1, 1);
        processor.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                const v = data[i];
                sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length);
            if (rms > 0.015) {
                this.triggerGateEnvelope();
            }
        };
        return processor;
    }

    /**
     * Trigger the gated envelope: instant attack, configurable hold + release
     */
    triggerGateEnvelope() {
        if (this.params.program !== 'gated' && this.params.program !== 'reverse') {
            return;
        }
        const now = this.ctx.currentTime;
        const hold = this.params.gateHold;
        const release = this.params.gateRelease;
        const level = this.params.gateLevel;

        this.gateEnvGain.gain.cancelScheduledValues(now);
        this.gateEnvGain.gain.setValueAtTime(level, now);
        this.gateEnvGain.gain.setValueAtTime(level, now + hold);
        this.gateEnvGain.gain.exponentialRampToValueAtTime(0.0001, now + hold + release);
        this.gateEnvGain.gain.setValueAtTime(0.0001, now + hold + release);
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
            case 'reverse':
                this.setupGatedRouting();
                break;
        }

        // Refresh modulation/diffusion in case program swap adjusted behavior
        this.updateDiffusion(this.params.diffusion);
        this.updateModDepth(this.params.modDepth);
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
            this.gateEnvGain.disconnect();
            this.highShelf.disconnect();
            this.lowShelf.disconnect();
            this.outputLimiter.disconnect();
            this.wetTrim.disconnect();
            this.wetGain.disconnect();
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

        // Route FDN mixer to envelope → tone stack → limiter
        this.fdnLines.mixer.connect(this.gateEnvGain);
        this.gateEnvGain.connect(this.highShelf);
        this.highShelf.connect(this.lowShelf);
        this.lowShelf.connect(this.outputLimiter);
        this.outputLimiter.connect(this.wetTrim);
        this.wetTrim.connect(this.wetGain);
        this.wetGain.connect(this.output);

        // Update parameters for hall sound
        const hallFeedback = this.applyProgramFeedbackScaling(this.calculateFeedback(this.params.decay));
        this.fdnLines.lines.forEach(line => {
            line.damping.frequency.value = this.computeDampingFreq(this.params.decay);
            line.feedbackGain.gain.value = hallFeedback;
            line.modGain.gain.value = 1.0;
        });
        this.highShelf.gain.value = -4.5;
        this.highShelf.frequency.value = 7800;
        this.lowShelf.gain.value = -1.5;
        this.gateEnvGain.gain.value = 1.0;
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

        this.fdnLines.mixer.connect(this.gateEnvGain);
        this.gateEnvGain.connect(this.highShelf);
        this.highShelf.connect(this.lowShelf);
        this.lowShelf.connect(this.outputLimiter);
        this.outputLimiter.connect(this.wetTrim);
        this.wetTrim.connect(this.wetGain);
        this.wetGain.connect(this.output);

        // Plate has brighter damping and higher feedback
        const plateFeedback = this.applyProgramFeedbackScaling(this.calculateFeedback(this.params.decay) * 0.98);
        this.fdnLines.lines.forEach(line => {
            line.damping.frequency.value = this.computeDampingFreq(this.params.decay) * 1.15;
            line.feedbackGain.gain.value = plateFeedback;
            line.modGain.gain.value = 1.05;
        });
        this.highShelf.gain.value = -5.5;
        this.highShelf.frequency.value = 8200;
        this.lowShelf.gain.value = -0.8;
        this.gateEnvGain.gain.value = 1.0;
    }
    
    /**
     * Setup ChorusVerb routing: Higher modulation depth
     */
    setupChorusVerbRouting() {
        this.setupHallRouting();

        // Increase modulation depth for chorus effect
        this.fdnLines.lines.forEach(line => {
            line.modGain.gain.value = 1.35; // Slight lift; actual depth is set by updateModDepth
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

        this.fdnLines.mixer.connect(this.gateEnvGain);
        this.gateEnvGain.connect(this.highShelf);
        this.highShelf.connect(this.lowShelf);
        this.lowShelf.connect(this.outputLimiter);
        this.outputLimiter.connect(this.wetTrim);
        this.wetTrim.connect(this.wetGain);
        this.wetGain.connect(this.output);

        this.highShelf.gain.value = -3.5;
        this.highShelf.frequency.value = 7600;
        this.lowShelf.gain.value = -1.0;
        this.gateEnvGain.gain.value = 1.0;
        this.fdnLines.lines.forEach(line => {
            line.modGain.gain.value = 1.0;
        });
    }
    
    /**
     * Setup Gated routing: Short decay with envelope
     */
    setupGatedRouting() {
        this.setupHallRouting();

        // Keep tank reasonably live, but gate output hard
        const feedback = this.applyProgramFeedbackScaling(this.calculateFeedback(this.params.decay * 0.8));
        this.fdnLines.lines.forEach(line => {
            line.feedbackGain.gain.value = feedback;
        });
        this.gateEnvGain.gain.value = 0.0001; // stays closed until triggered
        this.highShelf.gain.value = -6;
        this.lowShelf.gain.value = -2;
    }
    
    /**
     * Calculate feedback coefficient from decay time
     */
    calculateFeedback(decayTime) {
        // RT60 formula: feedback = 10^(-3 * delay / RT60)
        const avgDelay = 0.07; // Slightly longer average delay after widening spread
        const feedback = Math.pow(10, (-3 * avgDelay) / decayTime);

        // Keep headroom so the Hadamard matrix stays stable; energy preservation means
        // we can allow a bit more than before while staying < 1.0 overall.
        const SAFE_MAX = 0.78;
        const SAFETY_MARGIN = 0.85; // Additional cushion for extreme settings

        return Math.max(0, Math.min(SAFE_MAX, feedback * SAFETY_MARGIN));
    }

    /**
     * Apply program-specific feedback trims and global safety clamp
     */
    applyProgramFeedbackScaling(feedback) {
        let scaled = feedback;
        const program = this.params.program;

        if (program === 'plate' || program === 'rich') {
            scaled *= 0.95;
        } else if (program === 'chorusVerb' || program === 'echoVerb') {
            scaled *= 0.97;
        }

        // Hard clamp to keep the tank stable on hot sends
        return Math.min(0.78, scaled);
    }

    /**
     * Map decay + HF tilt to damping cutoff. Longer decays push the loop darker.
     */
    computeDampingFreq(decayTime) {
        const brightness = this.params.damping;
        const tilt = this.params.hfTilt;
        const decayNorm = Math.min(decayTime, 10) / 10;
        const minFreq = 4200;
        const maxFreq = Math.min(12000, brightness * 1.05);
        const base = maxFreq - (decayNorm * 5000);
        const tilted = base + (tilt * 1500);
        return Math.max(minFreq, Math.min(maxFreq, tilted));
    }
    
    /**
     * Set parameter
     */
    setParam(param, value) {
        if (param === 'mix' && this.sendMode) {
            value = 1.0;
        }

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
                const feedback = this.applyProgramFeedbackScaling(this.calculateFeedback(value));
                this.fdnLines.lines.forEach(line => {
                    line.feedbackGain.gain.setTargetAtTime(feedback, now, 0.05);
                    line.damping.frequency.setTargetAtTime(this.computeDampingFreq(value), now, 0.05);
                });
                break;

            case 'damping':
                this.fdnLines.lines.forEach(line => {
                    line.damping.frequency.setTargetAtTime(this.computeDampingFreq(this.params.decay), now, 0.05);
                });
                break;

            case 'hfTilt':
                this.fdnLines.lines.forEach(line => {
                    line.damping.frequency.setTargetAtTime(this.computeDampingFreq(this.params.decay), now, 0.05);
                });
                break;
                
            case 'diffusion':
                this.updateDiffusion(value);
                break;
                
            case 'modDepth':
                this.updateModDepth(value);
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

            case 'gateHold':
            case 'gateRelease':
            case 'gateLevel':
                // Envelope parameters are read during triggerGateEnvelope
                break;
                
            case 'stereoWidth':
                // Implemented via stereo matrix (future enhancement)
                break;
        }
    }

    /**
     * Lock the reverb for send usage (100% wet, dry muted)
     */
    enableSendMode() {
        this.sendMode = true;
        this.setParam('mix', 1.0);
    }

    updateDiffusion(value) {
        const now = this.ctx.currentTime;
        const allpasses = this.diffusionAllpasses.allpasses;
        const minActive = this.params.quality === 'high' ? 4 : 3;
        const targetActive = Math.min(allpasses.length, minActive + Math.floor(value * (allpasses.length - minActive + 0.99)));
        const baseCoeff = (this.params.quality === 'high' ? 0.6 : 0.55) + (value * 0.18);

        allpasses.forEach((ap, idx) => {
            const active = idx < targetActive;
            const coeff = active ? baseCoeff : 0.05;
            ap.feedbackGain.gain.setTargetAtTime(coeff, now, 0.01);
            ap.feedforwardGain.gain.setTargetAtTime(-coeff, now, 0.01);
        });
    }

    updateModDepth(value) {
        const now = this.ctx.currentTime;
        const baseDepth = this.params.program === 'chorusVerb' ? 0.00035 : 0.00018; // 0.18–0.35 ms
        const scaled = baseDepth * (0.25 + value * 0.85); // keep subtle even at max

        this.fdnLines.lines.forEach(line => {
            const weight1 = 0.55 + line.modBlend * 0.35;
            const weight2 = 0.35 + (1 - line.modBlend) * 0.25;
            line.modWeight1.gain.setTargetAtTime(scaled * weight1 * line.modScale, now, 0.05);
            line.modWeight2.gain.setTargetAtTime(scaled * weight2 * line.modScale * 0.75, now, 0.05);
        });
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
            'Small Room': {
                mix: 0.22,
                preDelay: 5,
                decay: 0.7,
                damping: 8500,
                diffusion: 0.55,
                modDepth: 0.12,
                modRate: 0.25,
                program: 'hall',
                hfTilt: 0.1
            },
            'Medium Room': {
                mix: 0.28,
                preDelay: 12,
                decay: 1.2,
                damping: 8200,
                diffusion: 0.65,
                modDepth: 0.15,
                modRate: 0.22,
                program: 'hall',
                hfTilt: 0
            },
            'Large Room': {
                mix: 0.32,
                preDelay: 18,
                decay: 2.3,
                damping: 7800,
                diffusion: 0.72,
                modDepth: 0.18,
                modRate: 0.2,
                program: 'hall',
                hfTilt: -0.05
            },
            'Studio Plate': {
                mix: 0.35,
                preDelay: 15,
                decay: 2.5,
                damping: 9500,
                diffusion: 0.82,
                modDepth: 0.22,
                modRate: 0.28,
                program: 'plate',
                hfTilt: 0.2
            },
            'Vocal Plate': {
                mix: 0.38,
                preDelay: 45,
                decay: 2.8,
                damping: 9000,
                diffusion: 0.85,
                modDepth: 0.18,
                modRate: 0.3,
                program: 'plate',
                hfTilt: 0.05
            },
            'Chamber': {
                mix: 0.3,
                preDelay: 22,
                decay: 3.2,
                damping: 7200,
                diffusion: 0.78,
                modDepth: 0.16,
                modRate: 0.18,
                program: 'hall',
                hfTilt: -0.05
            },
            'Concert Hall': {
                mix: 0.36,
                preDelay: 40,
                decay: 5.5,
                damping: 6500,
                diffusion: 0.88,
                modDepth: 0.14,
                modRate: 0.12,
                program: 'hall',
                hfTilt: -0.1
            },
            'Cathedral': {
                mix: 0.42,
                preDelay: 65,
                decay: 7.5,
                damping: 5800,
                diffusion: 0.92,
                modDepth: 0.12,
                modRate: 0.1,
                program: 'hall',
                hfTilt: -0.15
            },
            'Gated Snare': {
                mix: 0.48,
                preDelay: 8,
                decay: 1.8,
                damping: 7600,
                diffusion: 0.75,
                modDepth: 0.1,
                modRate: 0.16,
                program: 'gated',
                gateHold: 0.18,
                gateRelease: 0.12,
                gateLevel: 1.1,
                hfTilt: -0.05
            },
            'Reverse Verb': {
                mix: 0.45,
                preDelay: 70,
                decay: 3.5,
                damping: 7000,
                diffusion: 0.8,
                modDepth: 0.14,
                modRate: 0.2,
                program: 'reverse',
                gateHold: 0.35,
                gateRelease: 0.08,
                gateLevel: 1.0,
                hfTilt: -0.1
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
        const programs = ['hall', 'plate', 'rich', 'chorusVerb', 'echoVerb', 'gated', 'reverse'];
        
        this.setParam('program', programs[Math.floor(Math.random() * programs.length)]);
        this.setParam('mix', 0.2 + Math.random() * 0.4);
        this.setParam('preDelay', Math.random() * 60);
        this.setParam('decay', 0.5 + Math.random() * 5);
        this.setParam('damping', 5000 + Math.random() * 6000);
        this.setParam('diffusion', 0.5 + Math.random() * 0.4);
        this.setParam('modDepth', Math.random() * 0.5);
        this.setParam('modRate', 0.1 + Math.random() * 0.4);
        this.setParam('hfTilt', (Math.random() * 2 - 1) * 0.3);
    }
}
