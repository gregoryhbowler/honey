// Sequencer Module (meloDICER-inspired)
// Generative sequencing with probability-based note selection and rhythm variation
// Now with harmony-aware note filtering

import { mtof } from './utils.js';
import { getAllowedNotes, NOTE_NAMES } from './harmony.js';

export class Sequencer {
    constructor(synth, id) {
        this.synth = synth;
        this.id = id;
        this.steps = 16;
        this.currentStep = 0;
        this.division = 4; // Quarter notes
        this.isPlaying = false;
        
        // Rhythm parameters
        this.noteValue = 16; // 16th notes
        this.variation = 0.5;
        this.legato = 0;
        this.rest = 0;
        
        // Melody parameters - octave range (relative to C4)
        this.octaveRange = [0, 3]; // 0-3 octaves above C4
        
        // Note probability matrix - user-adjustable weights for each note
        // These are the user's preferences, which get filtered by harmony settings
        this.noteProbabilities = {
            'C': 1.0, 'C#': 0, 'D': 0, 'D#': 0,
            'E': 0.5, 'F': 0, 'F#': 0,
            'G': 0.8, 'G#': 0, 'A': 0, 'A#': 0, 'B': 0
        };
        
        this.sequence = [];
        this.generateSequence();
        
        this.lastNoteTime = 0;
        this.scheduledNotes = [];
    }
    
    /**
     * Generate a new sequence based on current parameters and harmony
     * @param {Object} harmony - Harmony configuration {mode, root, scaleType}
     */
    generateSequence(harmony = null) {
        this.sequence = [];
        
        for (let i = 0; i < this.steps; i++) {
            // Determine if this step should be a rest
            if (Math.random() < this.rest) {
                this.sequence.push({ type: 'rest' });
                continue;
            }
            
            // Select note based on probability distribution and harmony constraints
            const selectedNote = this.selectNote(harmony);
            
            if (!selectedNote) {
                // No valid notes available, create a rest
                this.sequence.push({ type: 'rest' });
                continue;
            }
            
            // Select octave within defined range
            const octave = Math.floor(
                Math.random() * (this.octaveRange[1] - this.octaveRange[0] + 1)
            ) + this.octaveRange[0] + 4; // +4 for middle C (C4) octave
            
            // Calculate MIDI note number
            const midiNote = 12 * octave + NOTE_NAMES.indexOf(selectedNote);
            
            // Determine if this note should be legato (tied to next note)
            const isLegato = Math.random() < this.legato;
            
            this.sequence.push({
                type: 'note',
                midi: midiNote,
                freq: mtof(midiNote),
                legato: isLegato
            });
        }
    }
    
    /**
     * Select a note based on probability distribution and harmony constraints
     * @param {Object} harmony - Harmony configuration {mode, root, scaleType}
     * @returns {string|null} Selected note name or null if none available
     */
    selectNote(harmony) {
        let allowedNotes = {};
        
        if (harmony && harmony.mode === 'scale') {
            // In scale mode: filter to only notes in the current scale
            const scaleNotes = getAllowedNotes(harmony.root, harmony.scaleType);
            
            // Build effective probabilities: only in-scale notes with user probability > 0
            NOTE_NAMES.forEach(note => {
                if (scaleNotes[note] && this.noteProbabilities[note] > 0) {
                    allowedNotes[note] = this.noteProbabilities[note];
                }
            });
            
            // If no notes have probability > 0, give all in-scale notes equal probability
            if (Object.keys(allowedNotes).length === 0) {
                NOTE_NAMES.forEach(note => {
                    if (scaleNotes[note]) {
                        allowedNotes[note] = 0.5;
                    }
                });
            }
        } else {
            // In custom mode: use all notes with probability > 0
            NOTE_NAMES.forEach(note => {
                if (this.noteProbabilities[note] > 0) {
                    allowedNotes[note] = this.noteProbabilities[note];
                }
            });
            
            // If no notes enabled, default to root
            if (Object.keys(allowedNotes).length === 0) {
                const root = harmony ? harmony.root : 'C';
                allowedNotes[root] = 1.0;
            }
        }
        
        // Select note using weighted random selection
        const totalProb = Object.values(allowedNotes).reduce((a, b) => a + b, 0);
        if (totalProb === 0) return null;
        
        let rand = Math.random() * totalProb;
        for (let [note, prob] of Object.entries(allowedNotes)) {
            rand -= prob;
            if (rand <= 0) {
                return note;
            }
        }
        
        // Fallback to first allowed note
        return Object.keys(allowedNotes)[0] || null;
    }
    
    /**
     * Randomize all sequencer parameters with harmony awareness
     * @param {Object} harmony - Harmony configuration {mode, root, scaleType}
     */
    randomize(harmony = null) {
        // Randomize rhythm parameters
        this.noteValue = [4, 8, 16][Math.floor(Math.random() * 3)];
        this.variation = Math.random();
        this.legato = Math.random() * 0.5;
        this.rest = Math.random() * 0.3;
        
        // Randomize melody range
        this.octaveRange = [
            Math.floor(Math.random() * 2),
            Math.floor(Math.random() * 2) + 2
        ];
        
        // Randomize note probabilities respecting harmony
        if (harmony && harmony.mode === 'scale') {
            // In scale mode: only randomize in-scale notes
            const scaleNotes = getAllowedNotes(harmony.root, harmony.scaleType);
            
            NOTE_NAMES.forEach(note => {
                if (scaleNotes[note]) {
                    // In-scale notes get random probabilities
                    // Root note gets higher weight
                    if (note === harmony.root) {
                        this.noteProbabilities[note] = Math.random() * 0.4 + 0.6; // 0.6-1.0
                    } else {
                        this.noteProbabilities[note] = Math.random() * 0.7 + 0.2; // 0.2-0.9
                    }
                } else {
                    // Out-of-scale notes forced to 0
                    this.noteProbabilities[note] = 0;
                }
            });
        } else {
            // In custom mode: can use any chromatic pattern
            // For musicality, still bias toward consonant intervals
            const root = harmony ? harmony.root : 'C';
            const rootIndex = NOTE_NAMES.indexOf(root);
            
            NOTE_NAMES.forEach((note, i) => {
                const interval = (i - rootIndex + 12) % 12;
                // Favor consonant intervals: unison, 3rd, 5th, 7th
                const consonance = [1.0, 0.3, 0.6, 0.3, 0.7, 0.8, 0.2, 0.9, 0.3, 0.6, 0.3, 0.5];
                this.noteProbabilities[note] = Math.random() * consonance[interval];
            });
        }
        
        this.generateSequence(harmony);
    }
    
    /**
     * Execute one sequencer tick
     * @param {number} time - Current audio context time
     * @param {Object} voiceState - Voice state (muted, transpose)
     * @param {number} masterTranspose - Global transpose value
     */
    tick(time, voiceState, masterTranspose) {
        if (!this.isPlaying) return;
        
        const step = this.sequence[this.currentStep];
        
        // Skip if voice is muted
        if (voiceState.muted) {
            this.currentStep = (this.currentStep + 1) % this.steps;
            return;
        }
        
        if (step && step.type === 'note') {
            // Apply transpose (master + voice)
            const totalTranspose = masterTranspose + voiceState.transpose;
            let transposedMidi = step.midi + totalTranspose;
            
            // Keep within valid MIDI range
            transposedMidi = Math.max(0, Math.min(127, transposedMidi));
            
            const transposedFreq = mtof(transposedMidi);
            
            // Trigger note if not legato or at sequence start
            if (!step.legato || this.currentStep === 0) {
                this.synth.noteOn(transposedFreq, 0.8);
            }
        } else if (step && step.type === 'rest') {
            this.synth.noteOff();
        }
        
        this.currentStep = (this.currentStep + 1) % this.steps;
    }
    
    /**
     * Set a sequencer parameter
     * @param {string} param - Parameter name
     * @param {*} value - Parameter value
     * @param {Object} harmony - Optional harmony config for regeneration
     */
    setParam(param, value, harmony = null) {
        switch(param) {
            case 'steps':
                this.steps = value;
                this.generateSequence(harmony);
                break;
            case 'division':
                this.division = value;
                break;
            case 'rest':
                this.rest = value;
                this.generateSequence(harmony);
                break;
            case 'legato':
                this.legato = value;
                this.generateSequence(harmony);
                break;
            case 'octaveLow':
                this.octaveRange[0] = value;
                this.generateSequence(harmony);
                break;
            case 'octaveHigh':
                this.octaveRange[1] = value;
                this.generateSequence(harmony);
                break;
        }
    }
    
    /**
     * Set probability for a specific note
     * @param {string} note - Note name (C, C#, D, etc.)
     * @param {number} prob - Probability value (0-1)
     * @param {Object} harmony - Optional harmony config for regeneration
     */
    setNoteProbability(note, prob, harmony = null) {
        this.noteProbabilities[note] = prob;
        this.generateSequence(harmony);
    }
}
