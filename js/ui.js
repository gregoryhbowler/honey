// UI Module
// Handles all UI creation, updates, and event handling
// Now with global harmony controls and harmony-aware probability sliders

import { 
    state, 
    setMasterBPM, 
    setMasterTranspose, 
    togglePlayPause, 
    randomizeAll,
    setHarmonyRoot,
    setHarmonyScaleType,
    setHarmonyMode
} from './state-management.js';
import { NOTE_NAMES, getAllowedNotes, getScaleName, SCALE_TYPES } from './harmony.js';

let currentVoiceTab = 1;

/**
 * Create the UI for a voice panel
 * @param {Voice} voice - Voice object
 * @returns {HTMLElement} Voice panel element
 */
export function createVoiceUI(voice) {
    const panel = document.createElement('div');
    panel.className = `voice-panel ${voice.type}`;
    panel.id = `voice-${voice.id}`;
    
    panel.innerHTML = `
        <div class="voice-header">
            <div class="voice-title">voice ${voice.id}</div>
            <div class="voice-type-selector">
                <button class="type-btn ${voice.type === 'honey' ? 'active' : ''}" data-type="honey">honey</button>
                <button class="type-btn ${voice.type === 'vinegar' ? 'active' : ''}" data-type="vinegar">vinegar</button>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">voice transpose</div>
            <div class="param-row">
                <span class="param-label">transpose</span>
                <div class="param-control">
                    <input type="range" class="voice-transpose" min="-12" max="12" step="1" value="0">
                    <span class="param-value voice-transpose-value">0</span>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">sequencer</div>
            <div class="param-row">
                <span class="param-label">steps</span>
                <div class="param-control">
                    <input type="range" class="seq-steps" min="2" max="32" value="16">
                    <span class="param-value steps-value">16</span>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">division</span>
                <div class="param-control">
                    <select class="seq-division">
                        <option value="1">whole</option>
                        <option value="2">half</option>
                        <option value="4" selected>quarter</option>
                        <option value="8">eighth</option>
                        <option value="16">sixteenth</option>
                    </select>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">rest</span>
                <div class="param-control">
                    <input type="range" class="seq-rest" min="0" max="1" step="0.01" value="0">
                    <span class="param-value rest-value">0%</span>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">legato</span>
                <div class="param-control">
                    <input type="range" class="seq-legato" min="0" max="1" step="0.01" value="0">
                    <span class="param-value legato-value">0%</span>
                </div>
            </div>
            <div class="step-indicators" id="steps-${voice.id}"></div>
            <button class="seq-dice" style="width: 100%; margin-top: 10px;">random sequence</button>
        </div>
        
        <div class="section">
            <div class="section-title">melody range</div>
            <div class="param-row">
                <span class="param-label">octave low</span>
                <div class="param-control">
                    <input type="range" class="octave-low" min="0" max="4" value="0">
                    <span class="param-value octave-low-value">0</span>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">octave high</span>
                <div class="param-control">
                    <input type="range" class="octave-high" min="0" max="4" value="3">
                    <span class="param-value octave-high-value">3</span>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">note probabilities</div>
            <div class="probability-faders">
                ${NOTE_NAMES.map(note => `
                    <div class="fader-container" data-note="${note}">
                        <div class="fader-label">${note}</div>
                        <input type="range" 
                               class="vertical-slider note-prob" 
                               data-note="${note}"
                               min="0" 
                               max="1" 
                               step="0.01" 
                               value="${voice.sequencer.noteProbabilities[note]}"
                               orient="vertical">
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section synth-params-${voice.id}">
            <div class="section-title">synth parameters</div>
        </div>
        
        <button class="randomize-all-btn" style="width: 100%; margin-top: 15px;">
            random all
        </button>
    `;
    
    return panel;
}

/**
 * Create Honey synth parameter UI
 * @returns {string} HTML string
 */
export function createHoneyParams() {
    return `
        <div class="param-row">
            <span class="param-label">Filter Freq</span>
            <div class="param-control">
                <input type="range" class="filter-freq" min="100" max="5000" value="1000">
                <span class="param-value filter-freq-value">1000</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Filter Res</span>
            <div class="param-control">
                <input type="range" class="filter-res" min="0.1" max="20" step="0.1" value="1">
                <span class="param-value filter-res-value">1.0</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Attack</span>
            <div class="param-control">
                <input type="range" class="env-attack" min="0.001" max="2" step="0.001" value="0.01">
                <span class="param-value env-attack-value">0.01</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Decay</span>
            <div class="param-control">
                <input type="range" class="env-decay" min="0.01" max="3" step="0.01" value="0.3">
                <span class="param-value env-decay-value">0.30</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Sustain</span>
            <div class="param-control">
                <input type="range" class="env-sustain" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value env-sustain-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Release</span>
            <div class="param-control">
                <input type="range" class="env-release" min="0.01" max="4" step="0.01" value="0.5">
                <span class="param-value env-release-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO A Shape</span>
            <div class="param-control">
                <select class="vco-a-shape">
                    <option value="sine">Sine</option>
                    <option value="triangle">Triangle</option>
                    <option value="sawtooth" selected>Sawtooth</option>
                    <option value="square">Square</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO B Shape</span>
            <div class="param-control">
                <select class="vco-b-shape">
                    <option value="sine">Sine</option>
                    <option value="triangle">Triangle</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="square" selected>Square</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO A Level</span>
            <div class="param-control">
                <input type="range" class="vco-a-level" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value vco-a-level-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO B Level</span>
            <div class="param-control">
                <input type="range" class="vco-b-level" min="0" max="1" step="0.01" value="0.3">
                <span class="param-value vco-b-level-value">0.30</span>
            </div>
        </div>
    `;
}

/**
 * Create Vinegar synth parameter UI
 * @returns {string} HTML string
 */
export function createVinegarParams() {
    return `
        <div class="param-row">
            <span class="param-label">Wave Shape</span>
            <div class="param-control">
                <input type="range" class="wave-shape" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value wave-shape-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Wave Folds</span>
            <div class="param-control">
                <input type="range" class="wave-folds" min="0" max="3" step="0.1" value="0">
                <span class="param-value wave-folds-value">0.0</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Attack</span>
            <div class="param-control">
                <input type="range" class="lpg-attack" min="0.003" max="2" step="0.001" value="0.04">
                <span class="param-value lpg-attack-value">0.04</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Peak</span>
            <div class="param-control">
                <input type="range" class="lpg-peak" min="100" max="10000" step="10" value="2000">
                <span class="param-value lpg-peak-value">2000</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Decay</span>
            <div class="param-control">
                <input type="range" class="lpg-decay" min="0.01" max="4" step="0.01" value="1">
                <span class="param-value lpg-decay-value">1.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Amp</span>
            <div class="param-control">
                <input type="range" class="lpg-amp" min="0" max="1" step="0.01" value="1">
                <span class="param-value lpg-amp-value">1.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Drift</span>
            <div class="param-control">
                <input type="range" class="drift" min="0" max="1" step="0.01" value="0">
                <span class="param-value drift-value">0.00</span>
            </div>
        </div>
    `;
}

/**
 * Update probability sliders based on current harmony
 * Dims out-of-scale notes in scale mode, enables all in custom mode
 */
export function updateProbabilitySliders() {
    const voice = state.voices[currentVoiceTab - 1];
    const panel = document.getElementById(`voice-${voice.id}`);
    if (!panel) return;
    
    const allowedNotes = state.harmony.mode === 'scale' 
        ? getAllowedNotes(state.harmony.root, state.harmony.scaleType)
        : NOTE_NAMES.reduce((acc, note) => { acc[note] = true; return acc; }, {});
    
    // Update each fader container
    NOTE_NAMES.forEach(note => {
        const container = panel.querySelector(`.fader-container[data-note="${note}"]`);
        const slider = panel.querySelector(`.note-prob[data-note="${note}"]`);
        
        if (!container || !slider) return;
        
        if (state.harmony.mode === 'scale' && !allowedNotes[note]) {
            // Out of scale - dim and disable
            container.classList.add('disabled');
            slider.disabled = true;
            slider.value = 0;
        } else {
            // In scale or custom mode - enable
            container.classList.remove('disabled');
            slider.disabled = false;
            // Restore value from sequencer
            slider.value = voice.sequencer.noteProbabilities[note];
        }
    });
}

/**
 * Attach event listeners to voice UI elements
 * @param {Voice} voice - Voice object
 * @param {HTMLElement} panel - Panel element
 */
export function attachVoiceListeners(voice, panel) {
    // Type selector buttons
    panel.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            voice.setType(type);
            panel.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            panel.className = `voice-panel ${type}`;
            updateVoiceUI(voice);
        });
    });
    
    // Voice transpose
    const transposeSlider = panel.querySelector('.voice-transpose');
    const transposeValue = panel.querySelector('.voice-transpose-value');
    transposeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        transposeValue.textContent = val > 0 ? '+' + val : val;
        voice.setTranspose(val);
    });
    
    // Sequencer steps
    const stepsSlider = panel.querySelector('.seq-steps');
    const stepsValue = panel.querySelector('.steps-value');
    stepsSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        stepsValue.textContent = val;
        voice.sequencer.setParam('steps', val, state.harmony);
        updateStepIndicators();
    });
    
    // Sequencer division
    const divisionSelect = panel.querySelector('.seq-division');
    divisionSelect.addEventListener('change', (e) => {
        voice.sequencer.setParam('division', parseInt(e.target.value), state.harmony);
    });
    
    // Rest probability
    const restSlider = panel.querySelector('.seq-rest');
    const restValue = panel.querySelector('.rest-value');
    restSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        restValue.textContent = Math.round(val * 100) + '%';
        voice.sequencer.setParam('rest', val, state.harmony);
    });
    
    // Legato probability
    const legatoSlider = panel.querySelector('.seq-legato');
    const legatoValue = panel.querySelector('.legato-value');
    legatoSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        legatoValue.textContent = Math.round(val * 100) + '%';
        voice.sequencer.setParam('legato', val, state.harmony);
    });
    
    // Octave range
    const octaveLow = panel.querySelector('.octave-low');
    const octaveLowValue = panel.querySelector('.octave-low-value');
    octaveLow.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        octaveLowValue.textContent = val;
        voice.sequencer.setParam('octaveLow', val, state.harmony);
    });
    
    const octaveHigh = panel.querySelector('.octave-high');
    const octaveHighValue = panel.querySelector('.octave-high-value');
    octaveHigh.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        octaveHighValue.textContent = val;
        voice.sequencer.setParam('octaveHigh', val, state.harmony);
    });
    
    // Note probabilities
    panel.querySelectorAll('.note-prob').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const note = e.target.dataset.note;
            const prob = parseFloat(e.target.value);
            voice.sequencer.setNoteProbability(note, prob, state.harmony);
        });
    });
    
    // Random sequence button
    panel.querySelector('.seq-dice').addEventListener('click', () => {
        voice.sequencer.randomize(state.harmony);
        updateVoiceUI(voice);
    });
    
    // Random all button
    panel.querySelector('.randomize-all-btn').addEventListener('click', () => {
        voice.randomize();
        updateVoiceUI(voice);
    });
    
    // Attach synth parameter listeners
    attachSynthParamListeners(voice, panel);
}

/**
 * Attach synth-specific parameter listeners
 * @param {Voice} voice - Voice object
 * @param {HTMLElement} panel - Panel element
 */
function attachSynthParamListeners(voice, panel) {
    const synthSection = panel.querySelector(`.synth-params-${voice.id}`);
    
    if (voice.type === 'honey') {
        attachHoneyListeners(voice, synthSection);
    } else {
        attachVinegarListeners(voice, synthSection);
    }
}

/**
 * Attach Honey synth parameter listeners
 */
function attachHoneyListeners(voice, synthSection) {
    // Filter frequency
    const filterFreq = synthSection.querySelector('.filter-freq');
    const filterFreqValue = synthSection.querySelector('.filter-freq-value');
    if (filterFreq) {
        filterFreq.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            filterFreqValue.textContent = val;
            voice.synth.setParam('filterFreq', val);
        });
    }
    
    // Filter resonance
    const filterRes = synthSection.querySelector('.filter-res');
    const filterResValue = synthSection.querySelector('.filter-res-value');
    if (filterRes) {
        filterRes.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            filterResValue.textContent = val.toFixed(1);
            voice.synth.setParam('filterRes', val);
        });
    }
    
    // Attack
    const attack = synthSection.querySelector('.env-attack');
    const attackValue = synthSection.querySelector('.env-attack-value');
    if (attack) {
        attack.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            attackValue.textContent = val.toFixed(3);
            voice.synth.setParam('attack', val);
        });
    }
    
    // Decay
    const decay = synthSection.querySelector('.env-decay');
    const decayValue = synthSection.querySelector('.env-decay-value');
    if (decay) {
        decay.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            decayValue.textContent = val.toFixed(2);
            voice.synth.setParam('decay', val);
        });
    }
    
    // Sustain
    const sustain = synthSection.querySelector('.env-sustain');
    const sustainValue = synthSection.querySelector('.env-sustain-value');
    if (sustain) {
        sustain.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            sustainValue.textContent = val.toFixed(2);
            voice.synth.setParam('sustain', val);
        });
    }
    
    // Release
    const release = synthSection.querySelector('.env-release');
    const releaseValue = synthSection.querySelector('.env-release-value');
    if (release) {
        release.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            releaseValue.textContent = val.toFixed(2);
            voice.synth.setParam('release', val);
        });
    }
    
    // VCO A Shape
    const vcoAShape = synthSection.querySelector('.vco-a-shape');
    if (vcoAShape) {
        vcoAShape.addEventListener('change', (e) => {
            voice.synth.setParam('vcoAShape', e.target.value);
        });
    }
    
    // VCO B Shape
    const vcoBShape = synthSection.querySelector('.vco-b-shape');
    if (vcoBShape) {
        vcoBShape.addEventListener('change', (e) => {
            voice.synth.setParam('vcoBShape', e.target.value);
        });
    }
    
    // VCO A Level
    const vcoALevel = synthSection.querySelector('.vco-a-level');
    const vcoALevelValue = synthSection.querySelector('.vco-a-level-value');
    if (vcoALevel) {
        vcoALevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            vcoALevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('vcoALevel', val);
        });
    }
    
    // VCO B Level
    const vcoBLevel = synthSection.querySelector('.vco-b-level');
    const vcoBLevelValue = synthSection.querySelector('.vco-b-level-value');
    if (vcoBLevel) {
        vcoBLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            vcoBLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('vcoBLevel', val);
        });
    }
}

/**
 * Attach Vinegar synth parameter listeners
 */
function attachVinegarListeners(voice, synthSection) {
    // Wave shape
    const waveShape = synthSection.querySelector('.wave-shape');
    const waveShapeValue = synthSection.querySelector('.wave-shape-value');
    if (waveShape) {
        waveShape.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            waveShapeValue.textContent = val.toFixed(2);
            voice.synth.setParam('waveShape', val);
        });
    }
    
    // Wave folds
    const waveFolds = synthSection.querySelector('.wave-folds');
    const waveFoldsValue = synthSection.querySelector('.wave-folds-value');
    if (waveFolds) {
        waveFolds.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            waveFoldsValue.textContent = val.toFixed(1);
            voice.synth.setParam('waveFolds', val);
        });
    }
    
    // Attack
    const attack = synthSection.querySelector('.lpg-attack');
    const attackValue = synthSection.querySelector('.lpg-attack-value');
    if (attack) {
        attack.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            attackValue.textContent = val.toFixed(3);
            voice.synth.setParam('attack', val);
        });
    }
    
    // Peak
    const peak = synthSection.querySelector('.lpg-peak');
    const peakValue = synthSection.querySelector('.lpg-peak-value');
    if (peak) {
        peak.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            peakValue.textContent = val;
            voice.synth.setParam('peak', val);
        });
    }
    
    // Decay
    const decay = synthSection.querySelector('.lpg-decay');
    const decayValue = synthSection.querySelector('.lpg-decay-value');
    if (decay) {
        decay.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            decayValue.textContent = val.toFixed(2);
            voice.synth.setParam('decay', val);
        });
    }
    
    // Amp
    const amp = synthSection.querySelector('.lpg-amp');
    const ampValue = synthSection.querySelector('.lpg-amp-value');
    if (amp) {
        amp.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            ampValue.textContent = val.toFixed(2);
            voice.synth.setParam('amp', val);
        });
    }
    
    // Drift
    const drift = synthSection.querySelector('.drift');
    const driftValue = synthSection.querySelector('.drift-value');
    if (drift) {
        drift.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            driftValue.textContent = val.toFixed(2);
            voice.synth.setParam('drift', val);
        });
    }
}

/**
 * Update voice UI when synth type changes
 * @param {Voice} voice - Voice object
 */
export function updateVoiceUI(voice) {
    const panel = document.getElementById(`voice-${voice.id}`);
    if (!panel) return;
    
    const synthSection = panel.querySelector(`.synth-params-${voice.id}`);
    if (voice.type === 'honey') {
        synthSection.innerHTML = '<div class="section-title">synth parameters</div>' + createHoneyParams();
    } else {
        synthSection.innerHTML = '<div class="section-title">synth parameters</div>' + createVinegarParams();
    }
    
    attachSynthParamListeners(voice, panel);
    
    // Update probability sliders for current harmony
    updateProbabilitySliders();
}

/**
 * Update step indicators for all voices
 */
export function updateStepIndicators() {
    state.voices.forEach(voice => {
        const container = document.getElementById(`steps-${voice.id}`);
        if (!container) return;
        
        // Create steps if needed
        if (container.children.length !== voice.sequencer.steps) {
            container.innerHTML = '';
            for (let i = 0; i < voice.sequencer.steps; i++) {
                const step = document.createElement('div');
                step.className = 'step';
                step.textContent = i + 1;
                container.appendChild(step);
            }
        }
        
        // Update active step
        Array.from(container.children).forEach((step, i) => {
            step.classList.toggle('active', i === voice.sequencer.currentStep);
        });
    });
}

/**
 * Show a specific voice panel
 * @param {number} voiceNum - Voice number (1-3)
 */
export function showVoice(voiceNum) {
    currentVoiceTab = voiceNum;
    const container = document.getElementById('voiceContainer');
    const voice = state.voices[voiceNum - 1];
    
    container.innerHTML = '';
    const panel = createVoiceUI(voice);
    container.appendChild(panel);
    updateVoiceUI(voice);
    attachVoiceListeners(voice, panel);
    updateStepIndicators();
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.voice) === voiceNum);
    });
}

/**
 * Initialize all UI event listeners
 */
export function initUI() {
    // Show first voice
    showVoice(1);
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const voiceNum = parseInt(btn.dataset.voice);
            showVoice(voiceNum);
        });
    });
    
    // Mute buttons
    document.querySelectorAll('.mute-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const voiceNum = parseInt(btn.dataset.voice);
            const voice = state.voices[voiceNum - 1];
            voice.setMute(!voice.muted);
            btn.classList.toggle('active', !voice.muted);
        });
    });
    
    // Master BPM
    const bpmSlider = document.getElementById('masterBPM');
    const bpmValue = document.getElementById('bpmValue');
    bpmSlider.addEventListener('input', (e) => {
        const bpm = parseInt(e.target.value);
        bpmValue.textContent = bpm;
        setMasterBPM(bpm);
    });
    
    // Master transpose
    const transposeSlider = document.getElementById('masterTranspose');
    const transposeValue = document.getElementById('masterTransposeValue');
    transposeSlider.addEventListener('input', (e) => {
        const transpose = parseInt(e.target.value);
        transposeValue.textContent = transpose > 0 ? '+' + transpose : transpose;
        setMasterTranspose(transpose);
    });
    
    // Play/pause button
    const playPauseBtn = document.getElementById('playPause');
    playPauseBtn.addEventListener('click', () => {
        const isPlaying = togglePlayPause();
        playPauseBtn.textContent = isPlaying ? 'pause' : 'play';
        playPauseBtn.classList.toggle('active', isPlaying);
    });
    
    // Random all button
    document.getElementById('randomAll').addEventListener('click', () => {
        randomizeAll();
        showVoice(currentVoiceTab); // Refresh current view
    });
    
    // Harmony controls
    const harmonyRoot = document.getElementById('harmonyRoot');
    harmonyRoot.addEventListener('change', (e) => {
        setHarmonyRoot(e.target.value);
        updateProbabilitySliders();
    });
    
    const harmonyScale = document.getElementById('harmonyScale');
    harmonyScale.addEventListener('change', (e) => {
        setHarmonyScaleType(e.target.value);
        updateProbabilitySliders();
    });
    
    const harmonyMode = document.getElementById('harmonyMode');
    harmonyMode.addEventListener('change', (e) => {
        setHarmonyMode(e.target.value);
        updateProbabilitySliders();
    });
    
    // Setup animation loop for step indicators
    function animate() {
        updateStepIndicators();
        requestAnimationFrame(animate);
    }
    animate();
}

export { currentVoiceTab };
