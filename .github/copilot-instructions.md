# GitHub Copilot / AI Agent instructions — BeatScroll (MVP)

Purpose: Quick, actionable context so an AI coding agent can be immediately productive working on this single-file MVP.

## Quick start ✅
- This is a static, single-file web app. Primary source: `src/index.html`.
- Run locally:
  - Quick: open `src/index.html` in a browser (double-click).
  - HTTP server (recommended for consistent behavior):
    - `cd src && python -m http.server 8000` → open `http://localhost:8000`
    - or `npx http-server ./src -p 8080`
- Manual test: type or paste text in the textarea then press keys `A S D F J K L ;` or `Space` to advance.

## Big picture (architecture) 🔧
- Single-file, no build system, no dependencies, no tests. All JS + CSS lives in `src/index.html` inside an IIFE.
- Major components (all in `src/index.html`):
  - Audio synth: `keyMap`, `playSoundForKey`, `ensureAudio`, `pitchCycle`.
  - Tokenization / rendering: `render()`, token regex `/[\w’']+|[.,;:!?()\[\]{}—–-]/g`, DOM `span.token` elements.
  - Progress & pacing: `estimateSyllables()`, `computeStepsForWord()` (uses `pps` control), `pipString()` visual feedback.
  - Scrolling & playhead: `scrollCurrentToPlayhead()`; playhead is visually fixed at 45% of the stage.
  - Input handling & debounce: `keydown` listener, `lastPressAt`, and `debounce` control in ms.

## Project-specific patterns & expectations 🧭
- No frameworks: changes should preserve the inline, IIFE-based, DOM-manipulation style unless explicitly migrating to a different structure.
- Audio requires an explicit user gesture. The UI exposes an `Enable Audio` button which calls `ensureAudio()`; sound will not play until audio is enabled.
- Punctuation tokens are treated specially (ignored for progress/counts via `isPunctToken()`).
- Syllable counting is intentionally heuristic (see `estimateSyllables()`): it's approximate and capped — don't assume linguistic precision.

## Common tasks & examples 💡
- Add a new key sound:
  - Edit `keyMap`, e.g. add `"g": { type: "sine", base: 392, detune:0, dur:0.06 }`.
- Force a re-render in console:
  - `render(document.getElementById('textInput').value)`
- Enable audio from console (simulate user gesture):
  - `ensureAudio()` (note: some browsers still require an actual user gesture to un-lock audio autoplay)
- Inspect runtime state (use DevTools):
  - `tokens`, `spans`, `wordIdx`, `stepsNeeded`, `stepsDone`

## Debugging / manual test checklist ✅
- Start server or open file; paste sample text into textarea; press keys `A,S,D,F,J,K,L,;` and `Space`.
- Confirm pips update, the playhead remains at ~45% of the viewport, and scrolling happens as expected.
- Verify audio only plays after clicking `Enable Audio` (or calling `ensureAudio()` from console).
- If scroll feels wrong, check `scrollCurrentToPlayhead()` and `stage.scrollTop` adjustments.

## Guidance for contributors / PRs 📋
- Keep changes small and self-contained. Add a short manual test plan to PR descriptions since there are no automated tests yet.
- If you add more files or build steps, include a short `README.md` and update this Copilot file with new run/test commands.

---
If anything is missing or you'd like this expanded to include a suggested test harness, CI steps, or a migration plan to a multi-file structure, tell me which direction you prefer and I'll iterate. 🙌