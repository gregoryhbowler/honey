# Honey and Vinegar

A modular web-based synthesizer and sequencer with three independent voices. Each voice can be either a "Honey" synth (Atlantix-inspired subtractive synthesis) or a "Vinegar" synth (Passersby/Buchla-inspired west coast synthesis), with its own generative sequencer.

## Features

- **Three Independent Voices**: Each with its own synth engine and sequencer
- **Two Synth Types**:
  - **Honey**: Classic subtractive synthesis with dual VCOs, filter, and ADSR envelope
  - **Vinegar**: West coast synthesis with wave shaping, wave folding, and LPG (Low Pass Gate)
- **Generative Sequencing**: meloDICER-inspired probability-based sequencing
- **Master Controls**: Global tempo and transpose
- **Real-time Parameter Control**: Adjust all synth and sequencer parameters on the fly

## Project Structure

```
honey-and-vinegar/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── main.js             # Application entry point
│   ├── utils.js            # Utility functions (mtof, linlin, etc.)
│   ├── honey-engine.js     # Honey synth engine
│   ├── vinegar-engine.js   # Vinegar synth engine
│   ├── sequencer.js        # Sequencer module
│   ├── state-management.js # Voice management and global state
│   └── ui.js               # UI creation and event handling
└── README.md               # This file
```

## Deploying to GitHub Pages

### Option 1: Using the GitHub Web Interface

1. Create a new repository on GitHub
2. Click "uploading an existing file"
3. Drag and drop all files and folders from this project
4. Commit the changes
5. Go to Settings → Pages
6. Under "Source", select "main" branch and "/ (root)" folder
7. Click Save
8. Your site will be live at `https://[username].github.io/[repo-name]/`

### Option 2: Using Git Command Line

```bash
# Initialize git repo
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/[username]/[repo-name].git

# Push to GitHub
git branch -M main
git push -u origin main

# Enable GitHub Pages
# Go to Settings → Pages on GitHub
# Select "main" branch and "/ (root)" folder
```

### Option 3: Quick Deploy

If you already have a GitHub repo:

```bash
cd honey-and-vinegar
git init
git add .
git commit -m "Deploy honey and vinegar"
git remote add origin [your-repo-url]
git push -u origin main
```

Then enable GitHub Pages in your repository settings.

## Local Development

To run locally, you need to serve the files through a web server (due to ES6 module restrictions):

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve

# Or any other local web server
```

Then open `http://localhost:8000` in your browser.

## Usage

1. **Play/Pause**: Start or stop the sequencer
2. **Voice Tabs**: Switch between editing Voice 1, 2, or 3
3. **Voice Mute**: Toggle individual voices on/off
4. **Master Controls**: Adjust global tempo and transpose
5. **Synth Type**: Switch between Honey and Vinegar for each voice
6. **Sequencer**: Adjust steps, division, rest probability, legato probability
7. **Note Probabilities**: Set the likelihood of each note appearing in the sequence
8. **Random**: Randomize individual sequences or all parameters

## Browser Compatibility

Works in modern browsers with Web Audio API support:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Credits

Inspired by:
- Atlantix synthesizer (Honey synth)
- Buchla Music Easel / Passersby (Vinegar synth)
- Korg Volca meloDICER (Sequencer)

Built with vanilla JavaScript and the Web Audio API.
