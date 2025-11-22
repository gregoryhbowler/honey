// UI Module
// Handles all UI creation, updates, and event handling
// Extended with comprehensive Honey synth (Atlantix-inspired) controls

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
 * Create Honey synth parameter UI with Atlantix-inspired controls
 * @returns {string} HTML string
 */
export function createHoneyParams() {
    return `
        <div class="param-row">
            <span class="param-label">VCO A Saw Level</span>
            <div class="param-control">
                <input type="range" class="vco-a-saw-level" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value vco-a-saw-level-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO A Pulse Level</span>
            <div class="param-control">
                <input type="range" class="vco-a-pulse-level" min="0" max="1" step="0.01" value="0">
                <span class="param-value vco-a-pulse-level-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO A Octave</span>
            <div class="param-control">
                <input type="range" class="vco-a-octave" min="-2" max="2" step="1" value="0">
                <span class="param-value vco-a-octave-value">0</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO A Fine</span>
            <div class="param-control">
                <input type="range" class="vco-a-fine" min="-100" max="100" step="1" value="0">
                <span class="param-value vco-a-fine-value">0</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">PWM Amount</span>
            <div class="param-control">
                <input type="range" class="pwm-amount" min="0" max="1" step="0.01" value="0">
                <span class="param-value pwm-amount-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">PWM Source</span>
            <div class="param-control">
                <select class="pwm-source">
                    <option value="lfo" selected>LFO</option>
                    <option value="env">Envelope</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO B Mode</span>
            <div class="param-control">
                <select class="vco-b-mode">
                    <option value="lfo" selected>LFO</option>
                    <option value="audio">Audio</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO B Shape</span>
            <div class="param-control">
                <select class="vco-b-shape">
                    <option value="sine" selected>Sine</option>
                    <option value="triangle">Triangle</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="square">Square</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO B Level</span>
            <div class="param-control">
                <input type="range" class="vco-b-level" min="0" max="1" step="0.01" value="0.3">
                <span class="param-value vco-b-level-value">0.30</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">VCO B Octave</span>
            <div class="param-control">
                <input type="range" class="vco-b-octave" min="-2" max="2" step="1" value="-1">
                <span class="param-value vco-b-octave-value">-1</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">LFO Rate</span>
            <div class="param-control">
                <input type="range" class="lfo-rate" min="0.1" max="20" step="0.1" value="2">
                <span class="param-value lfo-rate-value">2.0 Hz</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Sub Osc Level</span>
            <div class="param-control">
                <input type="range" class="sub-level" min="0" max="1" step="0.01" value="0">
                <span class="param-value sub-level-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Sub Type</span>
            <div class="param-control">
                <select class="sub-type">
                    <option value="-1" selected>-1 Octave</option>
                    <option value="-2">-2 Octaves</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Noise Level</span>
            <div class="param-control">
                <input type="range" class="noise-level" min="0" max="1" step="0.01" value="0">
                <span class="param-value noise-level-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Filter Freq</span>
            <div class="param-control">
                <input type="range" class="filter-freq" min="100" max="5000" value="1000">
                <span class="param-value filter-freq-value">1000 Hz</span>
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
            <span class="param-label">Env → Filter</span>
            <div class="param-control">
                <input type="range" class="env-to-filter" min="-1" max="1" step="0.01" value="0">
                <span class="param-value env-to-filter-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">LFO → Filter</span>
            <div class="param-control">
                <input type="range" class="lfo-to-filter" min="0" max="1" step="0.01" value="0">
                <span class="param-value lfo-to-filter-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">LFO → Pitch</span>
            <div class="param-control">
                <input type="range" class="lfo-to-pitch" min="0" max="1" step="0.01" value="0">
                <span class="param-value lfo-to-pitch-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">LFO → PWM</span>
            <div class="param-control">
                <input type="range" class="lfo-to-pwm" min="0" max="1" step="0.01" value="0">
                <span class="param-value lfo-to-pwm-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">LFO → Amp</span>
            <div class="param-control">
                <input type="range" class="lfo-to-amp" min="0" max="1" step="0.01" value="0">
                <span class="param-value lfo-to-amp-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Attack</span>
            <div class="param-control">
                <input type="range" class="env-attack" min="0.001" max="2" step="0.001" value="0.01">
                <span class="param-value env-attack-value">0.010</span>
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
            <span class="param-label">Env Rate</span>
            <div class="param-control">
                <select class="env-rate">
                    <option value="fast">Fast</option>
                    <option value="medium" selected>Medium</option>
                    <option value="slow">Slow</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Drive Mode</span>
            <div class="param-control">
                <select class="drive-mode">
                    <option value="off" selected>Off</option>
                    <option value="sym">Symmetric</option>
                    <option value="asym">Asymmetric</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">Drive Amount</span>
            <div class="param-control">
                <input type="range" class="drive-amount" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value drive-amount-value">0.50</span>
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
 */
export function updateProbabilitySliders() {
    const voice = state.voices[currentVoiceTab - 1];
    const panel = document.getElementById(`voice-${voice.id}`);
    if (!panel) return;
    
    const allowedNotes = state.harmony.mode === 'scale' 
        ? getAllowedNotes(state.harmony.root, state.harmony.scaleType)
        : NOTE_NAMES.reduce((acc, note) => { acc[note] = true; return acc; }, {});
    
    NOTE_NAMES.forEach(note => {
        const container = panel.querySelector(`.fader-container[data-note="${note}"]`);
        const slider = panel.querySelector(`.note-prob[data-note="${note}"]`);
        
        if (!container || !slider) return;
        
        if (state.harmony.mode === 'scale' && !allowedNotes[note]) {
            container.classList.add('disabled');
            slider.disabled = true;
            slider.value = 0;
        } else {
            container.classList.remove('disabled');
            slider.disabled = false;
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
 * Attach Honey synth parameter listeners with all new Atlantix-inspired controls
 */
function attachHoneyListeners(voice, synthSection) {
    // VCO A Saw Level
    const vcoASawLevel = synthSection.querySelector('.vco-a-saw-level');
    const vcoASawLevelValue = synthSection.querySelector('.vco-a-saw-level-value');
    if (vcoASawLevel) {
        vcoASawLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            vcoASawLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('vcoASawLevel', val);
        });
    }
    
    // VCO A Pulse Level
    const vcoAPulseLevel = synthSection.querySelector('.vco-a-pulse-level');
    const vcoAPulseLevelValue = synthSection.querySelector('.vco-a-pulse-level-value');
    if (vcoAPulseLevel) {
        vcoAPulseLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            vcoAPulseLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('vcoAPulseLevel', val);
        });
    }
    
    // VCO A Octave
    const vcoAOctave = synthSection.querySelector('.vco-a-octave');
    const vcoAOctaveValue = synthSection.querySelector('.vco-a-octave-value');
    if (vcoAOctave) {
        vcoAOctave.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            vcoAOctaveValue.textContent = val > 0 ? '+' + val : val;
            voice.synth.setParam('vcoAOctave', val);
        });
    }
    
    // VCO A Fine
    const vcoAFine = synthSection.querySelector('.vco-a-fine');
    const vcoAFineValue = synthSection.querySelector('.vco-a-fine-value');
    if (vcoAFine) {
        vcoAFine.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            vcoAFineValue.textContent = val > 0 ? '+' + val : val;
            voice.synth.setParam('vcoAFine', val);
        });
    }
    
    // PWM Amount
    const pwmAmount = synthSection.querySelector('.pwm-amount');
    const pwmAmountValue = synthSection.querySelector('.pwm-amount-value');
    if (pwmAmount) {
        pwmAmount.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            pwmAmountValue.textContent = val.toFixed(2);
            voice.synth.setParam('pwmAmount', val);
        });
    }
    
    // PWM Source
    const pwmSource = synthSection.querySelector('.pwm-source');
    if (pwmSource) {
        pwmSource.addEventListener('change', (e) => {
            voice.synth.setParam('pwmSource', e.target.value);
        });
    }
    
    // VCO B Mode
    const vcoBMode = synthSection.querySelector('.vco-b-mode');
    if (vcoBMode) {
        vcoBMode.addEventListener('change', (e) => {
            voice.synth.setParam('vcoBMode', e.target.value);
        });
    }
    
    // VCO B Shape
    const vcoBShape = synthSection.querySelector('.vco-b-shape');
    if (vcoBShape) {
        vcoBShape.addEventListener('change', (e) => {
            voice.synth.setParam('vcoBShape', e.target.value);
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
    
    // VCO B Octave
    const vcoBOctave = synthSection.querySelector('.vco-b-octave');
    const vcoBOctaveValue = synthSection.querySelector('.vco-b-octave-value');
    if (vcoBOctave) {
        vcoBOctave.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            vcoBOctaveValue.textContent = val > 0 ? '+' + val : val;
            voice.synth.setParam('vcoBOctave', val);
        });
    }
    
    // LFO Rate
    const lfoRate = synthSection.querySelector('.lfo-rate');
    const lfoRateValue = synthSection.querySelector('.lfo-rate-value');
    if (lfoRate) {
        lfoRate.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lfoRateValue.textContent = val.toFixed(1) + ' Hz';
            voice.synth.setParam('lfoRate', val);
        });
    }
    
    // Sub Level
    const subLevel = synthSection.querySelector('.sub-level');
    const subLevelValue = synthSection.querySelector('.sub-level-value');
    if (subLevel) {
        subLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            subLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('subLevel', val);
        });
    }
    
    // Sub Type
    const subType = synthSection.querySelector('.sub-type');
    if (subType) {
        subType.addEventListener('change', (e) => {
            voice.synth.setParam('subType', e.target.value);
        });
    }
    
    // Noise Level
    const noiseLevel = synthSection.querySelector('.noise-level');
    const noiseLevelValue = synthSection.querySelector('.noise-level-value');
    if (noiseLevel) {
        noiseLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            noiseLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('noiseLevel', val);
        });
    }
    
    // Filter Freq
    const filterFreq = synthSection.querySelector('.filter-freq');
    const filterFreqValue = synthSection.querySelector('.filter-freq-value');
    if (filterFreq) {
        filterFreq.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            filterFreqValue.textContent = val + ' Hz';
            voice.synth.setParam('filterFreq', val);
        });
    }
    
    // Filter Resonance
    const filterRes = synthSection.querySelector('.filter-res');
    const filterResValue = synthSection.querySelector('.filter-res-value');
    if (filterRes) {
        filterRes.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            filterResValue.textContent = val.toFixed(1);
            voice.synth.setParam('filterRes', val);
        });
    }
    
    // Env To Filter
    const envToFilter = synthSection.querySelector('.env-to-filter');
    const envToFilterValue = synthSection.querySelector('.env-to-filter-value');
    if (envToFilter) {
        envToFilter.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            envToFilterValue.textContent = val > 0 ? '+' + val.toFixed(2) : val.toFixed(2);
            voice.synth.setParam('envToFilter', val);
        });
    }
    
    // LFO To Filter
    const lfoToFilter = synthSection.querySelector('.lfo-to-filter');
    const lfoToFilterValue = synthSection.querySelector('.lfo-to-filter-value');
    if (lfoToFilter) {
        lfoToFilter.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lfoToFilterValue.textContent = val.toFixed(2);
            voice.synth.setParam('lfoToFilter', val);
        });
    }
    
    // LFO To Pitch
    const lfoToPitch = synthSection.querySelector('.lfo-to-pitch');
    const lfoToPitchValue = synthSection.querySelector('.lfo-to-pitch-value');
    if (lfoToPitch) {
        lfoToPitch.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lfoToPitchValue.textContent = val.toFixed(2);
            voice.synth.setParam('lfoToPitch', val);
        });
    }
    
    // LFO To PWM
    const lfoToPWM = synthSection.querySelector('.lfo-to-pwm');
    const lfoToPWMValue = synthSection.querySelector('.lfo-to-pwm-value');
    if (lfoToPWM) {
        lfoToPWM.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lfoToPWMValue.textContent = val.toFixed(2);
            voice.synth.setParam('lfoToPWM', val);
        });
    }
    
    // LFO To Amp
    const lfoToAmp = synthSection.querySelector('.lfo-to-amp');
    const lfoToAmpValue = synthSection.querySelector('.lfo-to-amp-value');
    if (lfoToAmp) {
        lfoToAmp.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lfoToAmpValue.textContent = val.toFixed(2);
            voice.synth.setParam('lfoToAmp', val);
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
    
    // Env Rate
    const envRate = synthSection.querySelector('.env-rate');
    if (envRate) {
        envRate.addEventListener('change', (e) => {
            voice.synth.setParam('envRate', e.target.value);
        });
    }
    
    // Drive Mode
    const driveMode = synthSection.querySelector('.drive-mode');
    if (driveMode) {
        driveMode.addEventListener('change', (e) => {
            voice.synth.setParam('driveMode', e.target.value);
        });
    }
    
    // Drive Amount
    const driveAmount = synthSection.querySelector('.drive-amount');
    const driveAmountValue = synthSection.querySelector('.drive-amount-value');
    if (driveAmount) {
        driveAmount.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            driveAmountValue.textContent = val.toFixed(2);
            voice.synth.setParam('driveAmount', val);
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
    updateProbabilitySliders();
}

/**
 * Update step indicators for all voices
 */
export function updateStepIndicators() {
    state.voices.forEach(voice => {
        const container = document.getElementById(`steps-${voice.id}`);
        if (!container) return;
        
        if (container.children.length !== voice.sequencer.steps) {
            container.innerHTML = '';
            for (let i = 0; i < voice.sequencer.steps; i++) {
                const step = document.createElement('div');
                step.className = 'step';
                step.textContent = i + 1;
                container.appendChild(step);
            }
        }
        
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
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.voice) === voiceNum);
    });
}

/**
 * Initialize all UI event listeners
 */
export function initUI() {
    showVoice(1);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const voiceNum = parseInt(btn.dataset.voice);
            showVoice(voiceNum);
        });
    });
    
    document.querySelectorAll('.mute-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const voiceNum = parseInt(btn.dataset.voice);
            const voice = state.voices[voiceNum - 1];
            voice.setMute(!voice.muted);
            btn.classList.toggle('active', !voice.muted);
        });
    });
    
    const bpmSlider = document.getElementById('masterBPM');
    const bpmValue = document.getElementById('bpmValue');
    bpmSlider.addEventListener('input', (e) => {
        const bpm = parseInt(e.target.value);
        bpmValue.textContent = bpm;
        setMasterBPM(bpm);
    });
    
    const transposeSlider = document.getElementById('masterTranspose');
    const transposeValue = document.getElementById('masterTransposeValue');
    transposeSlider.addEventListener('input', (e) => {
        const transpose = parseInt(e.target.value);
        transposeValue.textContent = transpose > 0 ? '+' + transpose : transpose;
        setMasterTranspose(transpose);
    });
    
    const playPauseBtn = document.getElementById('playPause');
    playPauseBtn.addEventListener('click', () => {
        const isPlaying = togglePlayPause();
        playPauseBtn.textContent = isPlaying ? 'pause' : 'play';
        playPauseBtn.classList.toggle('active', isPlaying);
    });
    
    document.getElementById('randomAll').addEventListener('click', () => {
        randomizeAll();
        showVoice(currentVoiceTab);
    });
    
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
    
    function animate() {
        updateStepIndicators();
        requestAnimationFrame(animate);
    }
    animate();
}

export { currentVoiceTab };
