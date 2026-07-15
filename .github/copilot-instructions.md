# GitHub Copilot / AI Agent instructions — BeatScroll (MVP)

Purpose: Quick, actionable context so an AI coding agent can be immediately productive working on this MVP.

## Quick start ✅
- Static ES-module web app, no build step. Entry point: `src/index.html`
  loads `<script type="module" src="./app.js">`.
- Run locally:
  - Quick: open `src/index.html` in a browser (double-click).
  - HTTP server (recommended for consistent behavior):
    - `cd src && python -m http.server 8000` → open `http://localhost:8000`
    - or `npx http-server ./src -p 8080`
- Manual test: type or paste text in the textarea, then (with focus outside
  the textarea) press `A S D F J K L ;` / `W E U I O` to advance, `Space` for
  kick, `H`/`Shift+H` for hi-hat, `V` for snare, `P`/`Q` held for octave
  shift.

## Big picture (architecture) 🔧
- No build system, no dependencies, no tests. Plain ES modules loaded
  directly by the browser — `src/app.js` is the composition root that wires
  everything else together.
- Modules:
  - `state.js` — plain mutable state object (tokens, wordIdx, rests table).
  - `audioEngine.js` — Web Audio synths for notes/kick/hi-hat/snare and the
    `P`/`Q` octave-shift modifiers.
  - `tts.js` — thin wrapper over `SpeechSynthesis` that speaks each
    completed word.
  - `tokenizer.js` — splits text into word/punctuation tokens
    (`isPunctToken`, `tokenize`).
  - `controller.js` — core game logic: syllable-splitting, per-word
    progress (`advanceOneSyllable`), and the `pps` ("presses per syllable")
    gating.
  - `inputRouter.js` — keyboard event → audio/controller dispatch; guards
    against hijacking keystrokes while a text-entry element is focused.
  - `components/stageView.js` — renders tokens into the scrolling reading
    stage and keeps the playhead (fixed at 45% of the stage) in sync via
    `scrollToPlayhead`.
  - `components/controlsView.js` — wires the sliders/buttons in the sidebar.

## Project-specific patterns & expectations 🧭
- No frameworks: keep changes as plain ES modules with DOM manipulation,
  matching the existing module boundaries above.
- Audio requires an explicit user gesture. The "Enable Audio" button calls
  `audio.ensureAudio()`; audio also auto-unlocks as a side effect of the
  first melody/kick/hat/snare keypress.
- Punctuation tokens are treated specially (ignored by `pps` gating, given a
  fixed "rest" count via `state.rests` instead — see `isPunctToken()`).
- Syllable counting is intentionally heuristic (see `splitIntoSyllables()`
  in `controller.js`): it's approximate — don't assume linguistic precision.
- `inputRouter.js`'s keydown guard must stay ahead of every shortcut check —
  don't add new global shortcuts above it.

## Common tasks & examples 💡
- Add a new key sound:
  - Edit `NOTE_FREQ` in `src/audioEngine.js`, e.g. add a new key/frequency
    pair for a white or black key.
- Inspect runtime state:
  - With ES modules, `state`, `tokens`, `wordIdx`, etc. are no longer global
    `window` variables, so the old "inspect in console" trick doesn't work.
    Add a temporary `console.log` in `app.js` or `controller.js` instead, or
    use DevTools' module breakpoints.

## Debugging / manual test checklist ✅
- Start a server or open the file; paste sample text into the textarea
  (typing should never trigger sound — see `inputRouter.js`'s text-entry
  guard); then, with focus outside the textarea, press
  `A S D F J K L ;` / `W E U I O`, `Space`, `H`, `Shift+H`, `V`, and hold
  `P`/`Q`.
- Confirm pips update, the playhead remains at ~45% of the viewport, and
  scrolling happens as expected.
- Verify audio plays after clicking "Enable Audio", and also works via the
  implicit auto-unlock-on-keypress path if you skip that button.
- If scroll feels wrong, check `scrollToPlayhead()` in
  `components/stageView.js` and its `stageEl.scrollTop` adjustment.

## Guidance for contributors / PRs 📋
- Keep changes small and self-contained. Add a short manual test plan to PR descriptions since there are no automated tests yet.
- If you add more files or build steps, include a short `README.md` and update this Copilot file with new run/test commands.

---
If anything is missing or you'd like this expanded to include a suggested test harness, CI steps, or a migration plan to a multi-file structure, tell me which direction you prefer and I'll iterate. 🙌