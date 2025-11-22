# Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│                    (Main HTML structure)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ├──> css/styles.css (All styling)
                       │
                       └──> js/main.js (Entry point)
                                │
                                ├──> js/ui.js
                                │    │
                                │    ├─> Creates all UI elements
                                │    ├─> Handles user interactions
                                │    └─> Updates visual feedback
                                │
                                └──> js/state-management.js
                                     │
                                     ├─> Voice class (3 instances)
                                     ├─> Master clock
                                     └─> Global state
                                          │
                                          ├──> js/honey-engine.js
                                          │    └─> HoneySynth class
                                          │        (Subtractive synthesis)
                                          │
                                          ├──> js/vinegar-engine.js
                                          │    └─> VinegarSynth class
                                          │        (West coast synthesis)
                                          │
                                          ├──> js/sequencer.js
                                          │    └─> Sequencer class
                                          │        (Generative sequencing)
                                          │
                                          └──> js/utils.js
                                               ├─> mtof() - MIDI to frequency
                                               ├─> linlin() - Linear interpolation
                                               └─> getAudioContext()
```

## Data Flow

```
User Input → UI Event Handlers → State Management → Audio Engines
                                         ↓
                                   Master Clock
                                         ↓
                                    Sequencer
                                         ↓
                                   Synth Engines → Web Audio API → Sound
```

## Key Relationships

- **main.js**: Bootstrap application, calls initUI()
- **ui.js**: Creates DOM elements, attaches event listeners
- **state-management.js**: Central state, owns Voice instances
- **Voice**: Contains one synth + one sequencer
- **Synths**: Independent audio engines (Honey or Vinegar)
- **Sequencer**: Generates and plays note sequences
- **utils.js**: Shared utility functions

## Benefits of This Architecture

1. **Separation of Concerns**: Each module has a single responsibility
2. **Easy to Extend**: Add new synth types by creating new engine files
3. **Testable**: Each module can be tested independently
4. **Maintainable**: Clear dependencies, easy to understand
5. **GitHub Pages Ready**: All client-side, no build step required
