// State Management Module
// Manages voices, master clock, global state, and harmony

import { getAudioContext } from './utils.js';
import { HoneySynth } from './honey-engine.js';
import { VinegarSynth } from './vinegar-engine.js';
import { Sequencer } from './sequencer.js';
import { getAllowedNotes } from './harmony.js';

/**
 * Voice class - represents one of the three voices
 */
export class Voice {
    constructor(id) {
        this.id = id;
        this.type = 'honey';
        this.synth = new HoneySynth(getAudioContext());
        this.sequencer = new Sequencer(this.synth, id);
        this.synth.output.connect(getAudioContext().destination);
        this.transpose = 0;
        this.muted = false;
    }
    
    /**
     * Set the synth type (honey or vinegar)
     * @param {string} type - 'honey' or 'vinegar'
     */
    setType(type) {
        this.type = type;
        this.synth.output.disconnect();
        
        if (type === 'honey') {
            this.synth = new HoneySynth(getAudioContext());
        } else {
            this.synth = new VinegarSynth(getAudioContext());
        }
        
        this.synth.output.connect(getAudioContext().destination);
        this.sequencer.synth = this.synth;
    }
    
    /**
     * Set voice transpose
     * @param {number} semitones - Semitones to transpose (-12 to +12)
     */
    setTranspose(semitones) {
        this.transpose = semitones;
    }
    
    /**
     * Set mute state
     * @param {boolean} muted - Mute state
     */
    setMute(muted) {
        this.muted = muted;
        if (muted) {
            this.synth.noteOff();
        }
    }
    
    /**
     * Randomize both synth and sequencer
     */
    randomize() {
        this.synth.randomPatch();
        this.sequencer.randomize(state.harmony);
    }
}

/**
 * Global state object
 */
export const state = {
    voices: [
        new Voice(1),
        new Voice(2),
        new Voice(3)
    ],
    isPlaying: false,
    masterBPM: 120,
    masterTranspose: 0,
    clockInterval: null,
    clockCounter: 0,
    // Harmony system - controls which notes are "in key" for all voices
    harmony: {
        mode: 'scale',      // 'scale' | 'custom'
        root: 'C',          // Root note: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
        scaleType: 'major'  // Scale type: major, naturalMinor, dorian, etc.
    }
};

/**
 * Set harmony root note
 * @param {string} root - Root note (C, C#, D, etc.)
 */
export function setHarmonyRoot(root) {
    state.harmony.root = root;
    notifyHarmonyChange();
}

/**
 * Set harmony scale type
 * @param {string} scaleType - Scale type key
 */
export function setHarmonyScaleType(scaleType) {
    state.harmony.scaleType = scaleType;
    notifyHarmonyChange();
}

/**
 * Set harmony mode
 * @param {string} mode - 'scale' or 'custom'
 */
export function setHarmonyMode(mode) {
    state.harmony.mode = mode;
    notifyHarmonyChange();
}

/**
 * Notify all sequencers that harmony has changed
 * Regenerate sequences to respect new harmony
 */
function notifyHarmonyChange() {
    state.voices.forEach(voice => {
        voice.sequencer.generateSequence(state.harmony);
    });
}

/**
 * Start the master clock
 */
export function startClock() {
    if (state.clockInterval) return;
    
    const msPerBeat = (60 / state.masterBPM) * 1000;
    const msPerSixteenth = msPerBeat / 4;
    
    state.clockInterval = setInterval(() => {
        state.voices.forEach(voice => {
            // Check if this voice should tick on this clock cycle
            if (state.clockCounter % (16 / voice.sequencer.division) === 0) {
                voice.sequencer.tick(
                    getAudioContext().currentTime,
                    {
                        muted: voice.muted,
                        transpose: voice.transpose
                    },
                    state.masterTranspose
                );
            }
        });
        
        state.clockCounter++;
    }, msPerSixteenth);
}

/**
 * Stop the master clock
 */
export function stopClock() {
    if (state.clockInterval) {
        clearInterval(state.clockInterval);
        state.clockInterval = null;
    }
    state.clockCounter = 0;
}

/**
 * Set master BPM
 * @param {number} bpm - Beats per minute
 */
export function setMasterBPM(bpm) {
    state.masterBPM = bpm;
    if (state.isPlaying) {
        stopClock();
        startClock();
    }
}

/**
 * Set master transpose
 * @param {number} semitones - Semitones to transpose
 */
export function setMasterTranspose(semitones) {
    state.masterTranspose = semitones;
}

/**
 * Toggle play/pause
 * @returns {boolean} New playing state
 */
export function togglePlayPause() {
    state.isPlaying = !state.isPlaying;
    
    if (state.isPlaying) {
        getAudioContext().resume();
        startClock();
        state.voices.forEach(v => v.sequencer.isPlaying = true);
    } else {
        stopClock();
        state.voices.forEach(v => {
            v.sequencer.isPlaying = false;
            v.synth.noteOff();
        });
    }
    
    return state.isPlaying;
}

/**
 * Randomize all voices
 */
export function randomizeAll() {
    state.voices.forEach(v => v.randomize());
}
