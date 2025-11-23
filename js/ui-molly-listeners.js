/**
 * Attach Molly synth parameter listeners
 */
export function attachMollyListeners(voice, synthSection) {
    // Polyphony
    const polyphony = synthSection.querySelector('.molly-polyphony');
    const polyphonyValue = synthSection.querySelector('.molly-polyphony-value');
    if (polyphony) {
        polyphony.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            polyphonyValue.textContent = val;
            voice.synth.setParam('polyphony', val);
        });
    }
    
    // Osc Wave Shape
    const oscWave = synthSection.querySelector('.molly-osc-wave');
    if (oscWave) {
        oscWave.addEventListener('change', (e) => {
            voice.synth.setParam('oscWaveShape', parseInt(e.target.value));
        });
    }
    
    // PW Mod
    const pwMod = synthSection.querySelector('.molly-pw-mod');
    const pwModValue = synthSection.querySelector('.molly-pw-mod-value');
    if (pwMod) {
        pwMod.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            pwModValue.textContent = val.toFixed(2);
            voice.synth.setParam('pwMod', val);
        });
    }
    
    // PW Source
    const pwSrc = synthSection.querySelector('.molly-pw-src');
    if (pwSrc) {
        pwSrc.addEventListener('change', (e) => {
            voice.synth.setParam('pwModSource', parseInt(e.target.value));
        });
    }
    
    // Freq Mod LFO
    const freqModLfo = synthSection.querySelector('.molly-freq-mod-lfo');
    const freqModLfoValue = synthSection.querySelector('.molly-freq-mod-lfo-value');
    if (freqModLfo) {
        freqModLfo.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            freqModLfoValue.textContent = val.toFixed(2);
            voice.synth.setParam('freqModLfo', val);
        });
    }
    
    // Freq Mod Env
    const freqModEnv = synthSection.querySelector('.molly-freq-mod-env');
    const freqModEnvValue = synthSection.querySelector('.molly-freq-mod-env-value');
    if (freqModEnv) {
        freqModEnv.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            freqModEnvValue.textContent = val > 0 ? '+' + val.toFixed(2) : val.toFixed(2);
            voice.synth.setParam('freqModEnv', val);
        });
    }
    
    // Glide
    const glide = synthSection.querySelector('.molly-glide');
    const glideValue = synthSection.querySelector('.molly-glide-value');
    if (glide) {
        glide.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            glideValue.textContent = val.toFixed(2) + 's';
            voice.synth.setParam('glide', val);
        });
    }
    
    // Main Osc Level
    const mainLevel = synthSection.querySelector('.molly-main-level');
    const mainLevelValue = synthSection.querySelector('.molly-main-level-value');
    if (mainLevel) {
        mainLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            mainLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('mainOscLevel', val);
        });
    }
    
    // Sub Osc Level
    const subLevel = synthSection.querySelector('.molly-sub-level');
    const subLevelValue = synthSection.querySelector('.molly-sub-level-value');
    if (subLevel) {
        subLevel.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            subLevelValue.textContent = val.toFixed(2);
            voice.synth.setParam('subOscLevel', val);
        });
    }
    
    // Sub Detune
    const subDetune = synthSection.querySelector('.molly-sub-detune');
    const subDetuneValue = synthSection.querySelector('.molly-sub-detune-value');
    if (subDetune) {
        subDetune.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            subDetuneValue.textContent = val.toFixed(1) + ' ST';
            voice.synth.setParam('subOscDetune', val);
        });
    }
    
    // Noise Level
    const noise = synthSection.querySelector('.molly-noise');
    const noiseValue = synthSection.querySelector('.molly-noise-value');
    if (noise) {
        noise.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            noiseValue.textContent = val.toFixed(2);
            voice.synth.setParam('noiseLevel', val);
        });
    }
    
    // HP Filter Cutoff
    const hpCutoff = synthSection.querySelector('.molly-hp-cutoff');
    const hpCutoffValue = synthSection.querySelector('.molly-hp-cutoff-value');
    if (hpCutoff) {
        hpCutoff.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            hpCutoffValue.textContent = val + ' Hz';
            voice.synth.setParam('hpFilterCutoff', val);
        });
    }
    
    // LP Filter Cutoff
    const lpCutoff = synthSection.querySelector('.molly-lp-cutoff');
    const lpCutoffValue = synthSection.querySelector('.molly-lp-cutoff-value');
    if (lpCutoff) {
        lpCutoff.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            lpCutoffValue.textContent = val + ' Hz';
            voice.synth.setParam('lpFilterCutoff', val);
        });
    }
    
    // LP Resonance
    const lpRes = synthSection.querySelector('.molly-lp-res');
    const lpResValue = synthSection.querySelector('.molly-lp-res-value');
    if (lpRes) {
        lpRes.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lpResValue.textContent = val.toFixed(2);
            voice.synth.setParam('lpFilterResonance', val);
        });
    }
    
    // LP Type
    const lpType = synthSection.querySelector('.molly-lp-type');
    if (lpType) {
        lpType.addEventListener('change', (e) => {
            voice.synth.setParam('lpFilterType', parseInt(e.target.value));
        });
    }
    
    // LP Env Select
    const lpEnvSel = synthSection.querySelector('.molly-lp-env-sel');
    if (lpEnvSel) {
        lpEnvSel.addEventListener('change', (e) => {
            voice.synth.setParam('lpFilterCutoffEnvSelect', parseInt(e.target.value));
        });
    }
    
    // LP Env Mod
    const lpEnvMod = synthSection.querySelector('.molly-lp-env-mod');
    const lpEnvModValue = synthSection.querySelector('.molly-lp-env-mod-value');
    if (lpEnvMod) {
        lpEnvMod.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lpEnvModValue.textContent = val > 0 ? '+' + val.toFixed(2) : val.toFixed(2);
            voice.synth.setParam('lpFilterCutoffModEnv', val);
        });
    }
    
    // LP LFO Mod
    const lpLfoMod = synthSection.querySelector('.molly-lp-lfo-mod');
    const lpLfoModValue = synthSection.querySelector('.molly-lp-lfo-mod-value');
    if (lpLfoMod) {
        lpLfoMod.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lpLfoModValue.textContent = val.toFixed(2);
            voice.synth.setParam('lpFilterCutoffModLfo', val);
        });
    }
    
    // LP Tracking
    const lpTracking = synthSection.querySelector('.molly-lp-tracking');
    const lpTrackingValue = synthSection.querySelector('.molly-lp-tracking-value');
    if (lpTracking) {
        lpTracking.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lpTrackingValue.textContent = val.toFixed(1) + ':1';
            voice.synth.setParam('lpFilterTracking', val);
        });
    }
    
    // LFO Freq
    const lfoFreq = synthSection.querySelector('.molly-lfo-freq');
    const lfoFreqValue = synthSection.querySelector('.molly-lfo-freq-value');
    if (lfoFreq) {
        lfoFreq.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            lfoFreqValue.textContent = val.toFixed(1) + ' Hz';
            voice.synth.setParam('lfoFreq', val);
        });
    }
    
    // LFO Wave
    const lfoWave = synthSection.querySelector('.molly-lfo-wave');
    if (lfoWave) {
        lfoWave.addEventListener('change', (e) => {
            voice.synth.setParam('lfoWaveShape', parseInt(e.target.value));
        });
    }
    
    // LFO Fade
    const lfoFade = synthSection.querySelector('.molly-lfo-fade');
    const lfoFadeValue = synthSection.querySelector('.molly-lfo-fade-value');
    if (lfoFade) {
        lfoFade.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const suffix = val < 0 ? 's out' : 's in';
            lfoFadeValue.textContent = Math.abs(val).toFixed(1) + suffix;
            voice.synth.setParam('lfoFade', val);
        });
    }
    
    // Env 1 ADSR
    ['a', 'd', 's', 'r'].forEach(stage => {
        const input = synthSection.querySelector(`.molly-env1-${stage}`);
        const valueSpan = synthSection.querySelector(`.molly-env1-${stage}-value`);
        if (input) {
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (stage === 's') {
                    valueSpan.textContent = val.toFixed(2);
                } else {
                    valueSpan.textContent = val.toFixed(3) + 's';
                }
                const paramName = {a: 'env1Attack', d: 'env1Decay', s: 'env1Sustain', r: 'env1Release'}[stage];
                voice.synth.setParam(paramName, val);
            });
        }
    });
    
    // Env 2 ADSR
    ['a', 'd', 's', 'r'].forEach(stage => {
        const input = synthSection.querySelector(`.molly-env2-${stage}`);
        const valueSpan = synthSection.querySelector(`.molly-env2-${stage}-value`);
        if (input) {
            input.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (stage === 's') {
                    valueSpan.textContent = val.toFixed(2);
                } else {
                    valueSpan.textContent = val.toFixed(3) + 's';
                }
                const paramName = {a: 'env2Attack', d: 'env2Decay', s: 'env2Sustain', r: 'env2Release'}[stage];
                voice.synth.setParam(paramName, val);
            });
        }
    });
    
    // Amp
    const amp = synthSection.querySelector('.molly-amp');
    const ampValue = synthSection.querySelector('.molly-amp-value');
    if (amp) {
        amp.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            ampValue.textContent = val.toFixed(1);
            voice.synth.setParam('amp', val);
        });
    }
    
    // Amp Mod
    const ampMod = synthSection.querySelector('.molly-amp-mod');
    const ampModValue = synthSection.querySelector('.molly-amp-mod-value');
    if (ampMod) {
        ampMod.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            ampModValue.textContent = val.toFixed(2);
            voice.synth.setParam('ampMod', val);
        });
    }
    
    // Ring Mod Freq
    const ringFreq = synthSection.querySelector('.molly-ring-freq');
    const ringFreqValue = synthSection.querySelector('.molly-ring-freq-value');
    if (ringFreq) {
        ringFreq.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            ringFreqValue.textContent = val + ' Hz';
            voice.synth.setParam('ringModFreq', val);
        });
    }
    
    // Ring Mod Fade
    const ringFade = synthSection.querySelector('.molly-ring-fade');
    const ringFadeValue = synthSection.querySelector('.molly-ring-fade-value');
    if (ringFade) {
        ringFade.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const suffix = val < 0 ? 's out' : 's in';
            ringFadeValue.textContent = Math.abs(val).toFixed(1) + suffix;
            voice.synth.setParam('ringModFade', val);
        });
    }
    
    // Ring Mod Mix
    const ringMix = synthSection.querySelector('.molly-ring-mix');
    const ringMixValue = synthSection.querySelector('.molly-ring-mix-value');
    if (ringMix) {
        ringMix.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            ringMixValue.textContent = val.toFixed(2);
            voice.synth.setParam('ringModMix', val);
        });
    }
    
    // Chorus Mix
    const chorusMix = synthSection.querySelector('.molly-chorus-mix');
    const chorusMixValue = synthSection.querySelector('.molly-chorus-mix-value');
    if (chorusMix) {
        chorusMix.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            chorusMixValue.textContent = val.toFixed(2);
            voice.synth.setParam('chorusMix', val);
        });
    }
    
    // Random Patch Button
    const randomBtn = synthSection.querySelector('.molly-random-btn');
    const flavorSelect = synthSection.querySelector('.molly-random-flavor');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const flavor = flavorSelect ? flavorSelect.value : 'any';
            voice.synth.randomPatch(flavor);
            // Note: Would ideally update UI controls to reflect new values
        });
    }
}
