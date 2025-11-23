// Mimeophon UI Module
// Creates and manages UI for the Mimeophon stereo delay effect

/**
 * Create Mimeophon UI
 * @returns {HTMLElement} Mimeophon container element
 */
export function createMimeophonUI() {
    const container = document.createElement('div');
    container.className = 'mimeophon-container';
    container.id = 'mimeophonContainer';
    
    container.innerHTML = `
        <div class="mimeophon-header">
            <div class="mimeophon-title">mimeophon-inspired stereo delay</div>
            <div class="mimeophon-preset-selector">
                <label>preset:</label>
                <select id="mimeophonPreset">
                    <option value="">-- select --</option>
                    <option value="karplus">Karplus String</option>
                    <option value="flange">Flange</option>
                    <option value="chorus">Chorus</option>
                    <option value="slapback">Slapback</option>
                    <option value="dubEcho">Dub Echo</option>
                    <option value="tapeDelay">Tape Delay</option>
                    <option value="ambient">Ambient</option>
                    <option value="shimmer">Shimmer</option>
                </select>
            </div>
        </div>
        
        <div class="mimeophon-grid">
            <!-- Zone & Delay Section -->
            <div class="mimeophon-section">
                <div class="mimeophon-section-title">zone & delay</div>
                
                <div class="mimeophon-zone-selector">
                    <button class="mimeophon-zone-btn active" data-zone="0">
                        A<br><span style="font-size: 0.7em;">5-50ms</span>
                    </button>
                    <button class="mimeophon-zone-btn" data-zone="1">
                        B<br><span style="font-size: 0.7em;">50-400ms</span>
                    </button>
                    <button class="mimeophon-zone-btn" data-zone="2">
                        C<br><span style="font-size: 0.7em;">0.4-2s</span>
                    </button>
                    <button class="mimeophon-zone-btn" data-zone="3">
                        D<br><span style="font-size: 0.7em;">2-10s</span>
                    </button>
                </div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">rate</span>
                        <span class="mimeophon-param-value" id="mimeophonRate">50%</span>
                    </div>
                    <input type="range" 
                           id="mimeophonRateSlider" 
                           class="mimeophon-rate"
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0.5">
                </div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">μRate amount</span>
                        <span class="mimeophon-param-value" id="mimeophonMicroRate">0%</span>
                    </div>
                    <input type="range" 
                           id="mimeophonMicroRateSlider" 
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0">
                </div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">μRate freq</span>
                        <span class="mimeophon-param-value" id="mimeophonMicroRateFreq">2.0 Hz</span>
                    </div>
                    <input type="range" 
                           id="mimeophonMicroRateFreqSlider" 
                           min="0.1" 
                           max="8" 
                           step="0.1" 
                           value="2">
                </div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">skew</span>
                        <span class="mimeophon-param-value" id="mimeophonSkew">0</span>
                    </div>
                    <input type="range" 
                           id="mimeophonSkewSlider" 
                           min="-1" 
                           max="1" 
                           step="0.01" 
                           value="0">
                </div>
            </div>
            
            <!-- Feedback Section -->
            <div class="mimeophon-section">
                <div class="mimeophon-section-title">feedback</div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">repeats</span>
                        <span class="mimeophon-param-value" id="mimeophonRepeats">30%</span>
                    </div>
                    <input type="range" 
                           id="mimeophonRepeatsSlider" 
                           min="0" 
                           max="1.2" 
                           step="0.01" 
                           value="0.3">
                </div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">color</span>
                        <span class="mimeophon-param-value" id="mimeophonColor">tape</span>
                    </div>
                    <input type="range" 
                           id="mimeophonColorSlider" 
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0.5">
                </div>
                
                <div class="mimeophon-param">
                    <div class="mimeophon-param-header">
                        <span class="mimeophon-param-label">halo</span>
                        <span class="mimeophon-param-value" id="mimeophonHalo">0%</span>
                    </div>
                    <input type="range" 
                           id="mimeophonHaloSlider" 
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value="0">
                </div>
                
                <div class="mimeophon-toggles">
                    <button class="mimeophon-toggle-btn" id="mimeophonPingPong">
                        ping-pong
                    </button>
                    <button class="mimeophon-toggle-btn" id="mimeophonSwap">
                        swap
                    </button>
                </div>
            </div>
            
            <!-- Special Controls Section -->
            <div class="mimeophon-section">
                <div class="mimeophon-section-title">special controls</div>
                
                <div class="mimeophon-toggles">
                    <button class="mimeophon-toggle-btn" id="mimeophonHold">
                        hold
                    </button>
                    <button class="mimeophon-toggle-btn" id="mimeophonFlip">
                        flip
                    </button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.05); border-radius: 10px; font-size: 0.75em; color: #666; line-height: 1.4;">
                    <strong>tips:</strong><br>
                    • <strong>hold</strong> freezes the buffer for non-destructive modulation<br>
                    • <strong>flip</strong> reverses playback (protonic reversal in short zones)<br>
                    • <strong>ping-pong</strong> bounces delays between L/R<br>
                    • <strong>swap</strong> exchanges L/R delay times<br>
                    • <strong>μRate</strong> adds vibrato/chorus modulation<br>
                    • <strong>skew</strong> creates stereo width by offsetting L/R times
                </div>
            </div>
        </div>
        
        <!-- Send Controls -->
        <div class="mimeophon-send-controls">
            <div class="mimeophon-send-param">
                <label>send level</label>
                <input type="range" 
                       id="mimeophonSend" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value="0">
                <div class="mimeophon-send-value" id="mimeophonSendValue">0%</div>
            </div>
            
            <div class="mimeophon-send-param">
                <label>return level</label>
                <input type="range" 
                       id="mimeophonReturn" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value="1">
                <div class="mimeophon-send-value" id="mimeophonReturnValue">100%</div>
            </div>
        </div>
    `;
    
    return container;
}

/**
 * Get color mode name from color value
 */
function getColorModeName(colorValue) {
    if (colorValue < 0.2) return 'dark';
    if (colorValue < 0.4) return 'BBD';
    if (colorValue < 0.6) return 'tape';
    if (colorValue < 0.8) return 'bright';
    return 'crisp';
}

/**
 * Attach event listeners to Mimeophon controls
 * @param {Mixer} mixer - Mixer instance with Mimeophon
 */
export function attachMimeophonListeners(mixer) {
    const mimeophon = mixer.getMimeophon();
    
    if (!mimeophon) {
        console.warn('Mimeophon not initialized');
        return;
    }
    
    // Zone buttons
    document.querySelectorAll('.mimeophon-zone-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const zone = parseInt(btn.dataset.zone);
            
            // Update active state
            document.querySelectorAll('.mimeophon-zone-btn').forEach(b => 
                b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set zone
            mimeophon.setZone(zone);
        });
    });
    
    // Rate slider
    const rateSlider = document.getElementById('mimeophonRateSlider');
    const rateValue = document.getElementById('mimeophonRate');
    rateSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        rateValue.textContent = Math.round(val * 100) + '%';
        mimeophon.setRate(val);
    });
    
    // μRate amount
    const microRateSlider = document.getElementById('mimeophonMicroRateSlider');
    const microRateValue = document.getElementById('mimeophonMicroRate');
    microRateSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        microRateValue.textContent = Math.round(val * 100) + '%';
        mimeophon.setMicroRate(val);
    });
    
    // μRate frequency
    const microRateFreqSlider = document.getElementById('mimeophonMicroRateFreqSlider');
    const microRateFreqValue = document.getElementById('mimeophonMicroRateFreq');
    microRateFreqSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        microRateFreqValue.textContent = val.toFixed(1) + ' Hz';
        mimeophon.setMicroRateFreq(val);
    });
    
    // Skew
    const skewSlider = document.getElementById('mimeophonSkewSlider');
    const skewValue = document.getElementById('mimeophonSkew');
    skewSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0) {
            skewValue.textContent = 'R' + Math.round(val * 100);
        } else if (val < 0) {
            skewValue.textContent = 'L' + Math.round(Math.abs(val) * 100);
        } else {
            skewValue.textContent = '0';
        }
        mimeophon.setSkew(val);
    });
    
    // Repeats
    const repeatsSlider = document.getElementById('mimeophonRepeatsSlider');
    const repeatsValue = document.getElementById('mimeophonRepeats');
    repeatsSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        repeatsValue.textContent = Math.round(val * 100) + '%';
        mimeophon.setRepeats(val);
    });
    
    // Color
    const colorSlider = document.getElementById('mimeophonColorSlider');
    const colorValue = document.getElementById('mimeophonColor');
    colorSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        colorValue.textContent = getColorModeName(val);
        mimeophon.setColor(val);
    });
    
    // Halo
    const haloSlider = document.getElementById('mimeophonHaloSlider');
    const haloValue = document.getElementById('mimeophonHalo');
    haloSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        haloValue.textContent = Math.round(val * 100) + '%';
        mimeophon.setHalo(val);
    });
    
    // Ping-Pong toggle
    const pingPongBtn = document.getElementById('mimeophonPingPong');
    pingPongBtn.addEventListener('click', () => {
        pingPongBtn.classList.toggle('active');
        const active = pingPongBtn.classList.contains('active');
        mimeophon.setPingPong(active);
    });
    
    // Swap toggle
    const swapBtn = document.getElementById('mimeophonSwap');
    swapBtn.addEventListener('click', () => {
        swapBtn.classList.toggle('active');
        const active = swapBtn.classList.contains('active');
        mimeophon.setSwap(active);
    });
    
    // Hold toggle
    const holdBtn = document.getElementById('mimeophonHold');
    holdBtn.addEventListener('click', () => {
        holdBtn.classList.toggle('active');
        const active = holdBtn.classList.contains('active');
        mimeophon.setHold(active);
    });
    
    // Flip toggle
    const flipBtn = document.getElementById('mimeophonFlip');
    flipBtn.addEventListener('click', () => {
        flipBtn.classList.toggle('active');
        const active = flipBtn.classList.contains('active');
        mimeophon.setFlip(active);
    });
    
    // Send level
    const sendSlider = document.getElementById('mimeophonSend');
    const sendValue = document.getElementById('mimeophonSendValue');
    sendSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        sendValue.textContent = Math.round(val * 100) + '%';
        mixer.getMaster().setMimeophonSend(val);
    });
    
    // Return level
    const returnSlider = document.getElementById('mimeophonReturn');
    const returnValue = document.getElementById('mimeophonReturnValue');
    returnSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        returnValue.textContent = Math.round(val * 100) + '%';
        mixer.getMaster().setMimeophonReturn(val);
    });
    
    // Preset selector
    const presetSelect = document.getElementById('mimeophonPreset');
    presetSelect.addEventListener('change', (e) => {
        const presetName = e.target.value;
        if (!presetName) return;
        
        const { MimeophonNode } = window;
        const presets = MimeophonNode.getPresets();
        const preset = presets[presetName];
        
        if (preset) {
            // Load preset
            mimeophon.loadPreset(preset);
            
            // Update UI to reflect preset values
            updateMimeophonUI(preset);
        }
        
        // Reset selector
        setTimeout(() => {
            presetSelect.value = '';
        }, 100);
    });
}

/**
 * Update UI to reflect parameter values
 * @param {Object} params - Parameter values
 */
function updateMimeophonUI(params) {
    // Zone
    if (params.zone !== undefined) {
        document.querySelectorAll('.mimeophon-zone-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.zone) === params.zone);
        });
    }
    
    // Rate
    if (params.rate !== undefined) {
        document.getElementById('mimeophonRateSlider').value = params.rate;
        document.getElementById('mimeophonRate').textContent = 
            Math.round(params.rate * 100) + '%';
    }
    
    // μRate
    if (params.microRate !== undefined) {
        document.getElementById('mimeophonMicroRateSlider').value = params.microRate;
        document.getElementById('mimeophonMicroRate').textContent = 
            Math.round(params.microRate * 100) + '%';
    }
    
    // μRate Freq
    if (params.microRateFreq !== undefined) {
        document.getElementById('mimeophonMicroRateFreqSlider').value = params.microRateFreq;
        document.getElementById('mimeophonMicroRateFreq').textContent = 
            params.microRateFreq.toFixed(1) + ' Hz';
    }
    
    // Skew
    if (params.skew !== undefined) {
        document.getElementById('mimeophonSkewSlider').value = params.skew;
        const val = params.skew;
        let display;
        if (val > 0) {
            display = 'R' + Math.round(val * 100);
        } else if (val < 0) {
            display = 'L' + Math.round(Math.abs(val) * 100);
        } else {
            display = '0';
        }
        document.getElementById('mimeophonSkew').textContent = display;
    }
    
    // Repeats
    if (params.repeats !== undefined) {
        document.getElementById('mimeophonRepeatsSlider').value = params.repeats;
        document.getElementById('mimeophonRepeats').textContent = 
            Math.round(params.repeats * 100) + '%';
    }
    
    // Color
    if (params.color !== undefined) {
        document.getElementById('mimeophonColorSlider').value = params.color;
        document.getElementById('mimeophonColor').textContent = 
            getColorModeName(params.color);
    }
    
    // Halo
    if (params.halo !== undefined) {
        document.getElementById('mimeophonHaloSlider').value = params.halo;
        document.getElementById('mimeophonHalo').textContent = 
            Math.round(params.halo * 100) + '%';
    }
    
    // Mix
    if (params.mix !== undefined && params.mix !== 1.0) {
        // Note: send effects typically stay at 100% wet
    }
}
