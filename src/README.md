# BeatScroll

BeatScroll is a web application designed to provide an interactive audio experience through text input. This README provides instructions on how to set up and run the application, as well as how to configure the development environment.

## Project Structure

```
BeatScroll/
├── LICENSE
└── src/
    ├── README.md
    ├── index.html
    ├── app.js
    ├── audioEngine.js
    ├── controller.js
    ├── inputRouter.js
    ├── state.js
    ├── tokenizer.js
    ├── tts.js
    ├── styles.css
    └── components/
        ├── controlsView.js
        └── stageView.js
```

## Running the Application

To run the BeatScroll application, follow these steps:

1. **Clone the repository:**

   ```
   git clone <repository-url>
   cd BeatScroll
   ```

2. **Run the application:**
   - Open `src/index.html` in a web browser directly (double-click).
   - Alternatively, you can run a local HTTP server for consistent behavior:
     ```
     cd src
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser.

## Usage

- Type or paste text into the textarea.
- Press `A S D F J K L ;` (white keys) or `W E T I O` (black keys) to play a
  note and advance one syllable-step.
- Hold `P` for octave up or `Q` for octave down while pressing a note key.
- Press `Space` for a kick, `H` for a closed hi-hat, `Shift+H` for an open
  hi-hat, and `V` for a snare (timekeeping only — these don't advance text).
- Click the "Enable Audio" button to allow sound playback (audio also
  auto-unlocks on your first keypress if you skip this).
- Click "TTS: Off" to toggle text-to-speech, which speaks each word aloud as
  you complete it.

## Contributing

Contributions are welcome! Please keep changes small and self-contained. Add a short manual test plan to pull request descriptions since there are no automated tests yet.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
