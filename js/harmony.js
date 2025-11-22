// Harmony Module
// Defines musical scales and provides utilities for harmony management

/**
 * Scale definitions as semitone patterns (1 = in scale, 0 = not in scale)
 * Patterns start from root note (C=0, C#=1, D=2, etc.)
 */
export const SCALE_TYPES = {
    major: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
    naturalMinor: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    harmonicMinor: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1],
    melodicMinor: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    dorian: [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0],
    phrygian: [1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0],
    lydian: [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
    mixolydian: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0],
    locrian: [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
    majorPentatonic: [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    minorPentatonic: [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
    blues: [1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0],
    wholeTone: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    diminished: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
    chromatic: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
};

/**
 * Note names in chromatic order
 */
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Get the semitone offset for a note name
 * @param {string} noteName - Note name (C, C#, D, etc.)
 * @returns {number} Semitone offset (0-11)
 */
export function getNoteOffset(noteName) {
    return NOTE_NAMES.indexOf(noteName);
}

/**
 * Get allowed notes for a given root and scale type
 * @param {string} root - Root note (C, C#, D, etc.)
 * @param {string} scaleType - Scale type key from SCALE_TYPES
 * @returns {Object} Object with note names as keys and boolean values indicating if in scale
 */
export function getAllowedNotes(root, scaleType) {
    const rootOffset = getNoteOffset(root);
    const scalePattern = SCALE_TYPES[scaleType] || SCALE_TYPES.major;
    
    const allowedNotes = {};
    
    NOTE_NAMES.forEach((note, index) => {
        // Calculate which scale degree this note represents relative to the root
        const degreeFromRoot = (index - rootOffset + 12) % 12;
        allowedNotes[note] = scalePattern[degreeFromRoot] === 1;
    });
    
    return allowedNotes;
}

/**
 * Get array of note names that are in the scale
 * @param {string} root - Root note
 * @param {string} scaleType - Scale type
 * @returns {Array<string>} Array of note names in the scale
 */
export function getScaleNotes(root, scaleType) {
    const allowedNotes = getAllowedNotes(root, scaleType);
    return NOTE_NAMES.filter(note => allowedNotes[note]);
}

/**
 * Get a human-readable scale name
 * @param {string} scaleType - Scale type key
 * @returns {string} Human-readable name
 */
export function getScaleName(scaleType) {
    const names = {
        major: 'Major',
        naturalMinor: 'Natural Minor',
        harmonicMinor: 'Harmonic Minor',
        melodicMinor: 'Melodic Minor',
        dorian: 'Dorian',
        phrygian: 'Phrygian',
        lydian: 'Lydian',
        mixolydian: 'Mixolydian',
        locrian: 'Locrian',
        majorPentatonic: 'Major Pentatonic',
        minorPentatonic: 'Minor Pentatonic',
        blues: 'Blues',
        wholeTone: 'Whole Tone',
        diminished: 'Diminished',
        chromatic: 'Chromatic'
    };
    return names[scaleType] || scaleType;
}
