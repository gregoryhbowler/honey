// Utility Functions for Audio Processing

/**
 * Convert MIDI note number to frequency
 * @param {number} midi - MIDI note number (0-127)
 * @returns {number} Frequency in Hz
 */
export const mtof = (midi) => {
    return 440 * Math.pow(2, (midi - 69) / 12);
};

/**
 * Linear interpolation from one range to another
 * @param {number} x - Input value
 * @param {number} inMin - Input minimum
 * @param {number} inMax - Input maximum
 * @param {number} outMin - Output minimum
 * @param {number} outMax - Output maximum
 * @returns {number} Interpolated value
 */
export const linlin = (x, inMin, inMax, outMin, outMax) => {
    return ((x - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
};

/**
 * Get or create audio context
 * @returns {AudioContext} The audio context instance
 */
let audioContextInstance = null;

export const getAudioContext = () => {
    if (!audioContextInstance) {
        audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextInstance;
};
