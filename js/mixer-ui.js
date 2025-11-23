// Mixer UI Module
// Creates and manages UI for mixer controls

import { state } from './state-management.js';

/**
 * Create mixer UI
 * @returns {HTMLElement} Mixer container element
 */
export function createMixerUI() {
    const container = document.createElement('div');
    container.className = 'mixer-container';
    container.id = 'mixerContainer';
    
    container.innerHTML = `
        <div class="mixer-title">mixer</div>
        
        <div class="mixer-channels">
            ${[1, 2, 3].map(i => createChannelUI(i)).join('')}
        </div>
        
        <div class="master-section">
            <div class="master-header">master</div>
            <div class="master-fader">
                <label>level</label>
                <input type="range" 
                       id="masterLevel" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value="0.85">
                <div class="master-value" id="masterLevelValue">85%</div>
            </div>
        </div>
    `;
    
    return container;
}

/**
 * Create UI for a single channel
 * @param {number} channelNum - Channel number (1-3)
 * @returns {string} HTML string
 */
function createChannelUI(channelNum) {
    return `
        <div class="mixer-channel" id="channel-${channelNum}">
            <div class="channel-header">voice ${channelNum}</div>
            
            <!-- EQ Section -->
            <div class="eq-section">
                <div class="eq-band">
                    <div class="eq-band-header">
                        <span class="eq-band-label">low</span>
                        <button class="kill-switch" data-channel="${channelNum}" data-band="low">kill</button>
                    </div>
                    <div class="eq-controls">
                        <input type="range" 
                               class="eq-low-gain"
                               data-channel="${channelNum}"
                               min="-24" 
                               max="12" 
                               step="0.5" 
                               value="0">
                        <span class="param-value eq-low-value">0 dB</span>
                    </div>
                </div>
                
                <div class="eq-band">
                    <div class="eq-band-header">
                        <span class="eq-band-label">mid</span>
                        <button class="kill-switch" data-channel="${channelNum}" data-band="mid">kill</button>
                    </div>
                    <div class="eq-controls">
                        <input type="range" 
                               class="eq-mid-gain"
                               data-channel="${channelNum}"
                               min="-24" 
                               max="12" 
                               step="0.5" 
                               value="0">
                        <span class="param-value eq-mid-value">0 dB</span>
                    </div>
                </div>
                
                <div class="eq-band">
                    <div class="eq-band-header">
                        <span class="eq-band-label">high</span>
                        <button class="kill-switch" data-channel="${channelNum}" data-band="high">kill</button>
                    </div>
                    <div class="eq-controls">
                        <input type="range" 
                               class="eq-high-gain"
                               data-channel="${channelNum}"
                               min="-24" 
                               max="12" 
                               step="0.5" 
                               value="0">
                        <span class="param-value eq-high-value">0 dB</span>
                    </div>
                </div>
            </div>
            
            <!-- Saturation Section -->
            <div class="saturation-section">
                <div class="saturation-title">saturation</div>
                
                <div class="saturation-mode">
                    <button class="sat-mode-btn active" data-channel="${channelNum}" data-mode="tape">tape</button>
                    <button class="sat-mode-btn" data-channel="${channelNum}" data-mode="triode">triode</button>
                    <button class="sat-mode-btn" data-channel="${channelNum}" data-mode="pentode">pentode</button>
                    <button class="sat-mode-btn" data-channel="${channelNum}" data-mode="transformer">xfmr</button>
                </div>
                
                <div class="saturation-controls">
                    <div class="sat-control-row">
                        <label>drive</label>
                        <input type="range" 
                               class="sat-drive"
                               data-channel="${channelNum}"
                               min="0" 
                               max="1" 
                               step="0.01" 
                               value="0">
                        <span class="param-value sat-drive-value">0%</span>
                    </div>
                    
                    <div class="sat-control-row">
                        <label>bias</label>
                        <input type="range" 
                               class="sat-bias"
                               data-channel="${channelNum}"
                               min="-1" 
                               max="1" 
                               step="0.01" 
                               value="0">
                        <span class="param-value sat-bias-value">0</span>
                    </div>
                    
                    <div class="sat-control-row">
                        <label>mix</label>
                        <input type="range" 
                               class="sat-mix"
                               data-channel="${channelNum}"
                               min="0" 
                               max="1" 
                               step="0.01" 
                               value="1">
                        <span class="param-value sat-mix-value">100%</span>
                    </div>
                    
                    <div class="sat-control-row">
                        <label>harm</label>
                        <select class="harmonics-select" data-channel="${channelNum}">
                            <option value="even" selected>even</option>
                            <option value="odd">odd</option>
                            <option value="both">both</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Pan and Level Section -->
            <div class="pan-level-section">
                <div class="pan-control">
                    <label>pan</label>
                    <input type="range" 
                           class="channel-pan"
                           data-channel="${channelNum}"
                           min="-1" 
                           max="1" 
                           step="0.01" 
                           value="0">
                    <span class="param-value pan-value">C</span>
                </div>
                
                <div class="level-control">
                    <label>level</label>
                    <input type="range" 
                           class="channel-level"
                           data-channel="${channelNum}"
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0.8">
                    <span class="param-value level-value">80%</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners to mixer controls
 */
export function attachMixerListeners() {
    // EQ Kill switches
    document.querySelectorAll('.kill-switch').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const channelNum = parseInt(e.target.dataset.channel);
            const band = e.target.dataset.band;
            const channel = state.mixer.getChannel(channelNum - 1);
            
            btn.classList.toggle('active');
            const isKilled = btn.classList.contains('active');
            channel.setEQ(band, 'kill', isKilled);
        });
    });
    
    // EQ Gain controls
    ['low', 'mid', 'high'].forEach(band => {
        document.querySelectorAll(`.eq-${band}-gain`).forEach(slider => {
            const channelNum = parseInt(slider.dataset.channel);
            const valueSpan = document.querySelector(`#channel-${channelNum} .eq-${band}-value`);
            
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                valueSpan.textContent = val.toFixed(1) + ' dB';
                const channel = state.mixer.getChannel(channelNum - 1);
                channel.setEQ(band, 'gain', val);
            });
        });
    });
    
    // Saturation Mode buttons
    document.querySelectorAll('.sat-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const channelNum = parseInt(e.target.dataset.channel);
            const mode = e.target.dataset.mode;
            const channel = state.mixer.getChannel(channelNum - 1);
            
            // Update active state
            document.querySelectorAll(`#channel-${channelNum} .sat-mode-btn`)
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            channel.setSaturation('mode', mode);
        });
    });
    
    // Saturation Drive
    document.querySelectorAll('.sat-drive').forEach(slider => {
        const channelNum = parseInt(slider.dataset.channel);
        const valueSpan = document.querySelector(`#channel-${channelNum} .sat-drive-value`);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            valueSpan.textContent = Math.round(val * 100) + '%';
            const channel = state.mixer.getChannel(channelNum - 1);
            channel.setSaturation('drive', val);
        });
    });
    
    // Saturation Bias
    document.querySelectorAll('.sat-bias').forEach(slider => {
        const channelNum = parseInt(slider.dataset.channel);
        const valueSpan = document.querySelector(`#channel-${channelNum} .sat-bias-value`);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            valueSpan.textContent = val.toFixed(2);
            const channel = state.mixer.getChannel(channelNum - 1);
            channel.setSaturation('bias', val);
        });
    });
    
    // Saturation Mix
    document.querySelectorAll('.sat-mix').forEach(slider => {
        const channelNum = parseInt(slider.dataset.channel);
        const valueSpan = document.querySelector(`#channel-${channelNum} .sat-mix-value`);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            valueSpan.textContent = Math.round(val * 100) + '%';
            const channel = state.mixer.getChannel(channelNum - 1);
            channel.setSaturation('mix', val);
        });
    });
    
    // Harmonics selector
    document.querySelectorAll('.harmonics-select').forEach(select => {
        const channelNum = parseInt(select.dataset.channel);
        
        select.addEventListener('change', (e) => {
            const channel = state.mixer.getChannel(channelNum - 1);
            channel.setSaturation('harmonics', e.target.value);
        });
    });
    
    // Pan controls
    document.querySelectorAll('.channel-pan').forEach(slider => {
        const channelNum = parseInt(slider.dataset.channel);
        const valueSpan = document.querySelector(`#channel-${channelNum} .pan-value`);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            
            if (val === 0) {
                valueSpan.textContent = 'C';
            } else if (val < 0) {
                valueSpan.textContent = 'L' + Math.abs(Math.round(val * 100));
            } else {
                valueSpan.textContent = 'R' + Math.round(val * 100);
            }
            
            const channel = state.mixer.getChannel(channelNum - 1);
            channel.setPan(val);
        });
    });
    
    // Level controls
    document.querySelectorAll('.channel-level').forEach(slider => {
        const channelNum = parseInt(slider.dataset.channel);
        const valueSpan = document.querySelector(`#channel-${channelNum} .level-value`);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            valueSpan.textContent = Math.round(val * 100) + '%';
            const channel = state.mixer.getChannel(channelNum - 1);
            channel.setLevel(val);
        });
    });
    
    // Master Level
    const masterLevel = document.getElementById('masterLevel');
    const masterLevelValue = document.getElementById('masterLevelValue');
    
    masterLevel.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        masterLevelValue.textContent = Math.round(val * 100) + '%';
        state.mixer.getMaster().setLevel(val);
    });
}
