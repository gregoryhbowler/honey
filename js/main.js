// Main Module
// Application entry point - initializes UI and mixer

import { initUI } from './ui.js';
import { createMixerUI, attachMixerListeners } from './mixer-ui.js';

/**
 * Initialize the application
 */
function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initUI();
            initMixer();
        });
    } else {
        initUI();
        initMixer();
    }
}

/**
 * Initialize mixer UI
 */
function initMixer() {
    const mixerPlaceholder = document.getElementById('mixerPlaceholder');
    if (mixerPlaceholder) {
        const mixerUI = createMixerUI();
        mixerPlaceholder.appendChild(mixerUI);
        attachMixerListeners();
    }
}

// Start the application
init();
