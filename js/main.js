// Main Module
// Application entry point - initializes UI and mixer

import { initUI } from './ui.js';
import { createMixerUI, attachMixerListeners } from './mixer-ui.js';
import { createMimeophonUI, attachMimeophonListeners } from './mimeophon-ui.js';
import { initMimeophon } from './state-management.js';
import { state } from './state-management.js';

/**
 * Initialize the application
 */
async function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            initUI();
            await initMixer();
        });
    } else {
        initUI();
        await initMixer();
    }
}

/**
 * Initialize mixer UI
 */
async function initMixer() {
    const mixerPlaceholder = document.getElementById('mixerPlaceholder');
    if (mixerPlaceholder) {
        const mixerUI = createMixerUI();
        mixerPlaceholder.appendChild(mixerUI);
        attachMixerListeners();
    }

    const mimeophonInitialized = await initMimeophon();

    if (mimeophonInitialized) {
        // Add Mimeophon UI after mixer
        const mimeophonUI = createMimeophonUI();
        mixerPlaceholder.parentNode.insertBefore(
            mimeophonUI,
            mixerPlaceholder.nextSibling
        );

        // Attach Mimeophon listeners
        attachMimeophonListeners(state.mixer);
    }
}

// Start the application
init();
