// quadraverb-ui.js
// UI creation and event handling for QuadraVerb reverb

/**
 * Create QuadraVerb UI
 * @returns {HTMLElement} QuadraVerb container element
 */
export function createQuadraVerbUI() {
    const container = document.createElement('div');
    container.className = 'quadraverb-container';
    container.id = 'quadraverbContainer';
    
    container.innerHTML = `
        <div class="quadraverb-header">
            <div class="quadraverb-title">quadraverb reverb</div>
            <div class="quadraverb-preset-selector">
                <label>preset</label>
                <select id="quadraverbPreset">
                    <option value="custom">custom</option>
                    <option value="Large Hall">large hall</option>
                    <option value="Warm Plate">warm plate</option>
                    <option value="Rich Chamber">rich chamber</option>
                    <option value="Shimmer Verb">shimmer verb</option>
                    <option value="Echo Chamber">echo chamber</option>
                    <option value="Gated Verb">gated verb</option>
                    <option value="Small Room">small room</option>
                    <option value="Cathedral">cathedral</option>
                </select>
                <button class="randomize-btn" id="quadraverbRandomize">🎲</button>
            </div>
        </div>
        
        <div class="quadraverb-grid">
            <!-- Program Section -->
            <div class="quadraverb-section">
                <div class="quadraverb-section-title">program</div>
                
                <div class="quadraverb-program-selector">
                    <button class="program-btn active" data-program="hall">hall</button>
                    <button class="program-btn" data-program="plate">plate</button>
                    <button class="program-btn" data-program="rich">rich</button>
                    <button class="program-btn" data-program="chorusVerb">chorus</button>
                    <button class="program-btn" data-program="echoVerb">echo</button>
                    <button class="program-btn" data-program="gated">gated</button>
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">quality</span>
                    </div>
                    <select id="quadraverbQuality" class="quadraverb-select">
                        <option value="normal" selected>normal (4 lines)</option>
                        <option value="high">high (8 lines)</option>
                    </select>
                </div>
            </div>
            
            <!-- Basic Parameters Section -->
            <div class="quadraverb-section">
                <div class="quadraverb-section-title">basic</div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">mix (locked wet)</span>
                        <span class="quadraverb-param-value" id="quadraverbMixValue">100% (send)</span>
                    </div>
                    <input type="range"
                           id="quadraverbMix"
                           min="0"
                           max="1"
                           step="0.01"
                           value="1"
                           disabled>
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">pre-delay</span>
                        <span class="quadraverb-param-value" id="quadraverbPreDelayValue">0 ms</span>
                    </div>
                    <input type="range" 
                           id="quadraverbPreDelay" 
                           min="0" 
                           max="120" 
                           step="1" 
                           value="0">
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">decay</span>
                        <span class="quadraverb-param-value" id="quadraverbDecayValue">2.5 s</span>
                    </div>
                    <input type="range" 
                           id="quadraverbDecay" 
                           min="0.2" 
                           max="15" 
                           step="0.1" 
                           value="2.5">
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">damping</span>
                        <span class="quadraverb-param-value" id="quadraverbDampingValue">8000 Hz</span>
                    </div>
                    <input type="range" 
                           id="quadraverbDamping" 
                           min="4000" 
                           max="12000" 
                           step="100" 
                           value="8000">
                </div>
            </div>
            
            <!-- Advanced Parameters Section -->
            <div class="quadraverb-section">
                <div class="quadraverb-section-title">advanced</div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">diffusion</span>
                        <span class="quadraverb-param-value" id="quadraverbDiffusionValue">0.70</span>
                    </div>
                    <input type="range" 
                           id="quadraverbDiffusion" 
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0.7">
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">mod depth</span>
                        <span class="quadraverb-param-value" id="quadraverbModDepthValue">0.30</span>
                    </div>
                    <input type="range" 
                           id="quadraverbModDepth" 
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0.3">
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">mod rate</span>
                        <span class="quadraverb-param-value" id="quadraverbModRateValue">0.20 Hz</span>
                    </div>
                    <input type="range" 
                           id="quadraverbModRate" 
                           min="0.1" 
                           max="1" 
                           step="0.01" 
                           value="0.2">
                </div>
                
                <div class="quadraverb-param">
                    <div class="quadraverb-param-header">
                        <span class="quadraverb-param-label">stereo width</span>
                        <span class="quadraverb-param-value" id="quadraverbWidthValue">100%</span>
                    </div>
                    <input type="range" 
                           id="quadraverbWidth" 
                           min="0" 
                           max="2" 
                           step="0.01" 
                           value="1">
                </div>
            </div>
        </div>
        
        <!-- Send Controls -->
        <div class="quadraverb-send-controls">
            <div class="quadraverb-send-param">
                <label>send level</label>
                <input type="range" 
                       id="quadraverbSend" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value="0">
                <div class="quadraverb-send-value" id="quadraverbSendValue">0%</div>
            </div>
            
            <div class="quadraverb-send-param">
                <label>return level</label>
                <input type="range" 
                       id="quadraverbReturn" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value="1">
                <div class="quadraverb-send-value" id="quadraverbReturnValue">100%</div>
            </div>
        </div>
    `;
    
    return container;
}

/**
 * Attach event listeners to QuadraVerb controls
 * @param {Mixer} mixer - Mixer instance
 */
export function attachQuadraVerbListeners(mixer) {
    const quadraverb = mixer.getQuadraVerb();
    if (!quadraverb) return;

    // Lock mix to 100% wet for send/return safety
    const mixSlider = document.getElementById('quadraverbMix');
    const mixValue = document.getElementById('quadraverbMixValue');
    mixSlider.disabled = true;
    mixSlider.value = 1;
    mixSlider.title = 'Send effect: mix locked to 100% wet';
    mixValue.textContent = '100% (send)';

    // Program buttons
    document.querySelectorAll('.program-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const program = btn.dataset.program;
            quadraverb.setParam('program', program);
            
            // Update active state
            document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set preset to custom
            document.getElementById('quadraverbPreset').value = 'custom';
        });
    });
    
    // Quality selector
    const qualitySelect = document.getElementById('quadraverbQuality');
    qualitySelect.addEventListener('change', (e) => {
        quadraverb.setParam('quality', e.target.value);
        // Note: Quality changes require rebuilding the reverb
        console.log('Quality changed - this requires reinitializing the reverb');
    });
    
    // Mix (locked, but keep handler defensive if future modes allow changes)
    mixSlider.addEventListener('input', (e) => {
        if (mixSlider.disabled) return;
        const val = parseFloat(e.target.value);
        mixValue.textContent = Math.round(val * 100) + '%';
        quadraverb.setParam('mix', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Pre-delay
    const preDelaySlider = document.getElementById('quadraverbPreDelay');
    const preDelayValue = document.getElementById('quadraverbPreDelayValue');
    preDelaySlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        preDelayValue.textContent = val + ' ms';
        quadraverb.setParam('preDelay', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Decay
    const decaySlider = document.getElementById('quadraverbDecay');
    const decayValue = document.getElementById('quadraverbDecayValue');
    decaySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        decayValue.textContent = val.toFixed(1) + ' s';
        quadraverb.setParam('decay', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Damping
    const dampingSlider = document.getElementById('quadraverbDamping');
    const dampingValue = document.getElementById('quadraverbDampingValue');
    dampingSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        dampingValue.textContent = val + ' Hz';
        quadraverb.setParam('damping', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Diffusion
    const diffusionSlider = document.getElementById('quadraverbDiffusion');
    const diffusionValue = document.getElementById('quadraverbDiffusionValue');
    diffusionSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        diffusionValue.textContent = val.toFixed(2);
        quadraverb.setParam('diffusion', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Mod Depth
    const modDepthSlider = document.getElementById('quadraverbModDepth');
    const modDepthValue = document.getElementById('quadraverbModDepthValue');
    modDepthSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        modDepthValue.textContent = val.toFixed(2);
        quadraverb.setParam('modDepth', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Mod Rate
    const modRateSlider = document.getElementById('quadraverbModRate');
    const modRateValue = document.getElementById('quadraverbModRateValue');
    modRateSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        modRateValue.textContent = val.toFixed(2) + ' Hz';
        quadraverb.setParam('modRate', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Stereo Width
    const widthSlider = document.getElementById('quadraverbWidth');
    const widthValue = document.getElementById('quadraverbWidthValue');
    widthSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        widthValue.textContent = Math.round(val * 100) + '%';
        quadraverb.setParam('stereoWidth', val);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Preset selector
    const presetSelect = document.getElementById('quadraverbPreset');
    presetSelect.addEventListener('change', (e) => {
        const presetName = e.target.value;
        if (presetName !== 'custom') {
            quadraverb.loadPreset(presetName);
            updateQuadraVerbUI(quadraverb);
        }
    });
    
    // Randomize button
    const randomizeBtn = document.getElementById('quadraverbRandomize');
    randomizeBtn.addEventListener('click', () => {
        quadraverb.randomize();
        updateQuadraVerbUI(quadraverb);
        document.getElementById('quadraverbPreset').value = 'custom';
    });
    
    // Send level
    const sendSlider = document.getElementById('quadraverbSend');
    const sendValue = document.getElementById('quadraverbSendValue');
    sendSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        sendValue.textContent = Math.round(val * 100) + '%';
        mixer.getMaster().setQuadraVerbSend(val);
    });
    
    // Return level
    const returnSlider = document.getElementById('quadraverbReturn');
    const returnValue = document.getElementById('quadraverbReturnValue');
    returnSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        returnValue.textContent = Math.round(val * 100) + '%';
        mixer.getMaster().setQuadraVerbReturn(val);
    });
}

/**
 * Update UI to reflect current QuadraVerb parameters
 * @param {QuadraVerbReverb} quadraverb - QuadraVerb instance
 */
function updateQuadraVerbUI(quadraverb) {
    const params = quadraverb.getCurrentPreset();

    // Update sliders and values
    const mixSlider = document.getElementById('quadraverbMix');
    const mixValue = document.getElementById('quadraverbMixValue');
    const sendLocked = quadraverb.sendMode;

    mixSlider.value = sendLocked ? 1 : params.mix;
    mixValue.textContent = sendLocked
        ? '100% (send)'
        : Math.round(params.mix * 100) + '%';

    document.getElementById('quadraverbPreDelay').value = params.preDelay;
    document.getElementById('quadraverbPreDelayValue').textContent = params.preDelay + ' ms';
    
    document.getElementById('quadraverbDecay').value = params.decay;
    document.getElementById('quadraverbDecayValue').textContent = params.decay.toFixed(1) + ' s';
    
    document.getElementById('quadraverbDamping').value = params.damping;
    document.getElementById('quadraverbDampingValue').textContent = params.damping + ' Hz';
    
    document.getElementById('quadraverbDiffusion').value = params.diffusion;
    document.getElementById('quadraverbDiffusionValue').textContent = params.diffusion.toFixed(2);
    
    document.getElementById('quadraverbModDepth').value = params.modDepth;
    document.getElementById('quadraverbModDepthValue').textContent = params.modDepth.toFixed(2);
    
    document.getElementById('quadraverbModRate').value = params.modRate;
    document.getElementById('quadraverbModRateValue').textContent = params.modRate.toFixed(2) + ' Hz';
    
    document.getElementById('quadraverbWidth').value = params.stereoWidth;
    document.getElementById('quadraverbWidthValue').textContent = Math.round(params.stereoWidth * 100) + '%';
    
    // Update program buttons
    document.querySelectorAll('.program-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.program === params.program);
    });
}
