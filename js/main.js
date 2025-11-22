// Main Module
// Application entry point - initializes and starts the app

import { initUI } from './ui.js';

/**
 * Initialize the application
 */
function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
}

// Start the application
init();
