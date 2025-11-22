// Sequencer Module (meloDICER-inspired)
// Generative sequencing with probability-based note selection and rhythm variation

import { mtof } from './utils.js';

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
        
        // Note probability matrix
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
     * Generate a new sequence based on current parameters
     */
    generateSequence() {
        this.sequence = [];
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        for (let i = 0; i < this.steps; i++) {
            // Determine if this step should be a rest
            if (Math.random() < this.rest) {
                this.sequence.push({ type: 'rest' });
                continue;
            }
            
            // Select note based on probability distribution
            let selectedNote = null;
            const totalProb = Object.values(this.noteProbabilities).reduce((a, b) => a + b, 0);
            
            if (totalProb > 0) {
                let rand = Math.random() * totalProb;
                for (let [note, prob] of Object.entries(this.noteProbabilities)) {
                    if (prob > 0) {
                        rand -= prob;
                        if (rand <= 0) {
                            selectedNote = note;
                            break;
                        }
                    }
                }
            }
            
            if (!selectedNote) selectedNote = 'C';
            
            // Select octave within defined range
            const octave = Math.floor(
                Math.random() * (this.octaveRange[1] - this.octaveRange[0] + 1)
            ) + this.octaveRange[0] + 4; // +4 for middle C (C4) octave
            
            // Calculate MIDI note number
            const midiNote = 12 * octave + noteNames.indexOf(selectedNote);
            
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
     * Randomize all sequencer parameters
     */
    randomize() {
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
        
        // Randomize note probabilities using common scales
        const scales = [
            [1,0,1,0,1,1,0,1,0,1,0,1], // Major
            [1,0,1,1,0,1,0,1,1,0,1,0], // Minor
            [1,0,1,0,1,0,1,1,0,1,0,0], // Dorian
            [1,0,0,1,0,1,0,1,0,0,1,0], // Pentatonic
        ];
        
        const scale = scales[Math.floor(Math.random() * scales.length)];
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        noteNames.forEach((note, i) => {
            this.noteProbabilities[note] = scale[i] * (Math.random() * 0.7 + 0.3);
        });
        
        this.generateSequence();
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
     */
    setParam(param, value) {
        switch(param) {
            case 'steps':
                this.steps = value;
                this.generateSequence();
                break;
            case 'division':
                this.division = value;
                break;
            case 'rest':
                this.rest = value;
                this.generateSequence();
                break;
            case 'legato':
                this.legato = value;
                this.generateSequence();
                break;
            case 'octaveLow':
                this.octaveRange[0] = value;
                this.generateSequence();
                break;
            case 'octaveHigh':
                this.octaveRange[1] = value;
                this.generateSequence();
                break;
        }
    }
    
    /**
     * Set probability for a specific note
     * @param {string} note - Note name (C, C#, D, etc.)
     * @param {number} prob - Probability value (0-1)
     */
    setNoteProbability(note, prob) {
        this.noteProbabilities[note] = prob;
        this.generateSequence();
    }
}
