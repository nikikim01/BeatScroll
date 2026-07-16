import { keyForNote } from "./components/notationView.js";

export function createNotationPlayback({ audio, instrumentHud }) {
  let timeouts = [];
  let playing = false;
  let paused = false;
  let doc = [];
  let annotations = { breaths: [], accents: new Set(), hairpins: [] };
  let tempoBpm = 100;
  let lastPlayedIndex = -1;
  let onCompleteCallback = null;

  function noteDelayMs() {
    return 60000 / tempoBpm;
  }

  function clearTimeouts() {
    timeouts.forEach((id) => clearTimeout(id));
    timeouts = [];
  }

  function playNoteAt(i) {
    lastPlayedIndex = i;
    const note = doc[i];
    if (!note) return;
    const key = keyForNote(note);
    if (!key) return;
    instrumentHud?.flashKey(key);
    audio.ensureAudio().then(() => audio.playNote(key));
  }

  function scheduleFrom(startIndex) {
    clearTimeouts();
    playing = true;
    paused = false;
    let t = 0;
    for (let i = startIndex; i < doc.length; i++) {
      const idx = i;
      timeouts.push(setTimeout(() => playNoteAt(idx), t));
      t += noteDelayMs();
      if (annotations.breaths.includes(i)) t += 400;
    }
    timeouts.push(
      setTimeout(() => {
        playing = false;
        onCompleteCallback?.();
      }, t)
    );
  }

  function play(newDoc, newAnnotations, bpm, onComplete) {
    // Snapshot so live edits to the staff during playback can't corrupt
    // already-scheduled note indices.
    doc = [...newDoc];
    annotations = {
      breaths: [...newAnnotations.breaths],
      accents: new Set(newAnnotations.accents),
      hairpins: [...newAnnotations.hairpins],
    };
    tempoBpm = bpm;
    lastPlayedIndex = -1;
    onCompleteCallback = onComplete || null;
    scheduleFrom(0);
  }

  function pause() {
    clearTimeouts();
    paused = true;
    playing = false;
  }

  function resume() {
    if (!paused) return;
    scheduleFrom(lastPlayedIndex + 1);
  }

  function stop() {
    clearTimeouts();
    playing = false;
    paused = false;
    lastPlayedIndex = -1;
  }

  function seekToMeasure(measureIndex) {
    const startIndex = measureIndex * 4;
    lastPlayedIndex = startIndex - 1;
    if (playing || paused) scheduleFrom(startIndex);
  }

  function setTempo(bpm) {
    tempoBpm = bpm;
  }

  function isPlaying() {
    return playing;
  }
  function isPaused() {
    return paused;
  }

  return {
    play,
    pause,
    resume,
    stop,
    seekToMeasure,
    setTempo,
    isPlaying,
    isPaused,
  };
}
