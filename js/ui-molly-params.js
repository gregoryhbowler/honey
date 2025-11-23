/**
 * Create Molly synth parameter UI with Juno/Jupiter/CS-80 controls
 * @returns {string} HTML string
 */
export function createMollyParams() {
    return `
        <div class="param-row">
            <span class="param-label">osc wave shape</span>
            <div class="param-control">
                <select class="molly-osc-wave">
                    <option value="0">Triangle</option>
                    <option value="1">Saw</option>
                    <option value="2" selected>Pulse</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">pw mod</span>
            <div class="param-control">
                <input type="range" class="molly-pw-mod" min="0" max="1" step="0.01" value="0.2">
                <span class="param-value molly-pw-mod-value">0.20</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">pw src</span>
            <div class="param-control">
                <select class="molly-pw-src">
                    <option value="0" selected>LFO</option>
                    <option value="1">Env 1</option>
                    <option value="2">Manual</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">freq mod lfo</span>
            <div class="param-control">
                <input type="range" class="molly-freq-mod-lfo" min="0" max="1" step="0.01" value="0">
                <span class="param-value molly-freq-mod-lfo-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">freq mod env</span>
            <div class="param-control">
                <input type="range" class="molly-freq-mod-env" min="-1" max="1" step="0.01" value="0">
                <span class="param-value molly-freq-mod-env-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">glide</span>
            <div class="param-control">
                <input type="range" class="molly-glide" min="0" max="5" step="0.01" value="0">
                <span class="param-value molly-glide-value">0.00s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">main osc level</span>
            <div class="param-control">
                <input type="range" class="molly-main-level" min="0" max="1" step="0.01" value="1">
                <span class="param-value molly-main-level-value">1.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">sub osc level</span>
            <div class="param-control">
                <input type="range" class="molly-sub-level" min="0" max="1" step="0.01" value="0">
                <span class="param-value molly-sub-level-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">sub detune</span>
            <div class="param-control">
                <input type="range" class="molly-sub-detune" min="-5" max="5" step="0.1" value="0">
                <span class="param-value molly-sub-detune-value">0.0 ST</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">noise level</span>
            <div class="param-control">
                <input type="range" class="molly-noise" min="0" max="1" step="0.01" value="0.1">
                <span class="param-value molly-noise-value">0.10</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">hp filter cutoff</span>
            <div class="param-control">
                <input type="range" class="molly-hp-cutoff" min="10" max="20000" step="10" value="10">
                <span class="param-value molly-hp-cutoff-value">10 Hz</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp filter cutoff</span>
            <div class="param-control">
                <input type="range" class="molly-lp-cutoff" min="20" max="20000" step="10" value="300">
                <span class="param-value molly-lp-cutoff-value">300 Hz</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp resonance</span>
            <div class="param-control">
                <input type="range" class="molly-lp-res" min="0" max="1" step="0.01" value="0.1">
                <span class="param-value molly-lp-res-value">0.10</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp type</span>
            <div class="param-control">
                <select class="molly-lp-type">
                    <option value="0">-12 dB/oct</option>
                    <option value="1" selected>-24 dB/oct</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp env select</span>
            <div class="param-control">
                <select class="molly-lp-env-sel">
                    <option value="0" selected>Env 1</option>
                    <option value="1">Env 2</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp env mod</span>
            <div class="param-control">
                <input type="range" class="molly-lp-env-mod" min="-1" max="1" step="0.01" value="0.25">
                <span class="param-value molly-lp-env-mod-value">0.25</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp lfo mod</span>
            <div class="param-control">
                <input type="range" class="molly-lp-lfo-mod" min="0" max="1" step="0.01" value="0">
                <span class="param-value molly-lp-lfo-mod-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lp tracking</span>
            <div class="param-control">
                <input type="range" class="molly-lp-tracking" min="0" max="2" step="0.1" value="1">
                <span class="param-value molly-lp-tracking-value">1.0:1</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lfo freq</span>
            <div class="param-control">
                <input type="range" class="molly-lfo-freq" min="0.05" max="20" step="0.05" value="5">
                <span class="param-value molly-lfo-freq-value">5.0 Hz</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lfo wave</span>
            <div class="param-control">
                <select class="molly-lfo-wave">
                    <option value="0" selected>Sine</option>
                    <option value="1">Triangle</option>
                    <option value="2">Saw</option>
                    <option value="3">Square</option>
                    <option value="4">Random</option>
                </select>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">lfo fade</span>
            <div class="param-control">
                <input type="range" class="molly-lfo-fade" min="-15" max="15" step="0.1" value="0">
                <span class="param-value molly-lfo-fade-value">0.0s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 1 attack</span>
            <div class="param-control">
                <input type="range" class="molly-env1-a" min="0.002" max="5" step="0.001" value="0.01">
                <span class="param-value molly-env1-a-value">0.010s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 1 decay</span>
            <div class="param-control">
                <input type="range" class="molly-env1-d" min="0.002" max="10" step="0.01" value="0.3">
                <span class="param-value molly-env1-d-value">0.30s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 1 sustain</span>
            <div class="param-control">
                <input type="range" class="molly-env1-s" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value molly-env1-s-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 1 release</span>
            <div class="param-control">
                <input type="range" class="molly-env1-r" min="0.002" max="10" step="0.01" value="0.5">
                <span class="param-value molly-env1-r-value">0.50s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 2 attack</span>
            <div class="param-control">
                <input type="range" class="molly-env2-a" min="0.002" max="5" step="0.001" value="0.01">
                <span class="param-value molly-env2-a-value">0.010s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 2 decay</span>
            <div class="param-control">
                <input type="range" class="molly-env2-d" min="0.002" max="10" step="0.01" value="0.3">
                <span class="param-value molly-env2-d-value">0.30s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 2 sustain</span>
            <div class="param-control">
                <input type="range" class="molly-env2-s" min="0" max="1" step="0.01" value="0.5">
                <span class="param-value molly-env2-s-value">0.50</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">env 2 release</span>
            <div class="param-control">
                <input type="range" class="molly-env2-r" min="0.002" max="10" step="0.01" value="0.5">
                <span class="param-value molly-env2-r-value">0.50s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">amp</span>
            <div class="param-control">
                <input type="range" class="molly-amp" min="0" max="11" step="0.1" value="0.5">
                <span class="param-value molly-amp-value">0.5</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">amp mod</span>
            <div class="param-control">
                <input type="range" class="molly-amp-mod" min="0" max="1" step="0.01" value="0">
                <span class="param-value molly-amp-mod-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">ring mod freq</span>
            <div class="param-control">
                <input type="range" class="molly-ring-freq" min="10" max="300" step="1" value="50">
                <span class="param-value molly-ring-freq-value">50 Hz</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">ring mod fade</span>
            <div class="param-control">
                <input type="range" class="molly-ring-fade" min="-15" max="15" step="0.1" value="0">
                <span class="param-value molly-ring-fade-value">0.0s</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">ring mod mix</span>
            <div class="param-control">
                <input type="range" class="molly-ring-mix" min="0" max="1" step="0.01" value="0">
                <span class="param-value molly-ring-mix-value">0.00</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">chorus mix</span>
            <div class="param-control">
                <input type="range" class="molly-chorus-mix" min="0" max="1" step="0.01" value="0.8">
                <span class="param-value molly-chorus-mix-value">0.80</span>
            </div>
        </div>
        <div class="param-row">
            <span class="param-label">random flavor</span>
            <div class="param-control">
                <select class="molly-random-flavor">
                    <option value="any" selected>any</option>
                    <option value="lead">lead</option>
                    <option value="pad">pad</option>
                    <option value="percussion">perc</option>
                </select>
            </div>
        </div>
        <button class="molly-random-btn" style="width:100%; margin-top:10px;">
            random patch
        </button>
    `;
}
