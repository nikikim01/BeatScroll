const RESTS = {
  ",": 1,
  ";": 1,
  ":": 1,
  ".": 2,
  "!": 2,
  "?": 2,
  "—": 2,
  "–": 2,
  "(": 1,
  ")": 1,
};

(() => {
  // ---------- Audio (simple synth/noise, no assets) ----------
  let audioCtx = null;
  let audioEnabled = false;

  function ensureAudio() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    audioEnabled = true;
    document.getElementById("audioBtn").textContent = "Audio Enabled";
  }

  // Key → timbre “preset”
  const keyMap = {
    a: { type: "sine", base: 220, detune: 0, dur: 0.09 },
    s: { type: "triangle", base: 196, detune: 0, dur: 0.1 },
    d: { type: "square", base: 164, detune: 0, dur: 0.07 },
    f: { type: "sawtooth", base: 247, detune: 0, dur: 0.06 },
    j: { type: "noise", base: 0, detune: 0, dur: 0.05 },
    k: { type: "sine", base: 330, detune: 7, dur: 0.06 },
    l: { type: "triangle", base: 262, detune: -5, dur: 0.08 },
    ";": { type: "noise", base: 0, detune: 0, dur: 0.03 },
  };

  // “Pleasant enough” pitch cycle (pentatonic-ish)
  const pitchCycle = [0, 2, 4, 7, 9, 7, 4, 2]; // semitone offsets
  let pitchIdx = 0;

  function playSoundForKey(k) {
    if (!audioEnabled) return;

    ensureAudio();
    const preset = keyMap[k];
    if (!preset) return;

    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.dur);

    gain.connect(audioCtx.destination);

    if (preset.type === "noise") {
      // white noise burst
      const bufferSize = Math.floor(audioCtx.sampleRate * preset.dur);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++)
        data[i] = (Math.random() * 2 - 1) * 0.65;

      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(gain);
      src.start(now);
      src.stop(now + preset.dur);
      return;
    }

    // oscillator note
    const osc = audioCtx.createOscillator();
    osc.type = preset.type;

    const semi = pitchCycle[pitchIdx++ % pitchCycle.length];
    const freq = preset.base * Math.pow(2, semi / 12);

    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(preset.detune, now);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + preset.dur);
  }

  // ---------- Text/token rendering ----------
  const stage = document.getElementById("stage");
  const playhead = document.getElementById("playhead");
  const statsEl = document.getElementById("stats");
  const ppsEl = document.getElementById("pps");
  const ppsLabel = document.getElementById("ppsLabel");
  const debounceEl = document.getElementById("debounce");
  const debounceLabel = document.getElementById("debounceLabel");

  let tokens = [];
  let spans = [];
  let wordIdx = 0;

  // syllable-step state for current word
  let stepsNeeded = 1;
  let stepsDone = 0;

  function isPunctToken(t) {
    return /^[,.;:!?()\[\]{}—–-]+$/.test(t);
  }

  // Very rough syllable estimator (good enough for “press density” feel)
  function estimateSyllables(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 1;
    if (w.length <= 3) return 1;

    const vowels = w.match(/[aeiouy]+/g);
    let count = vowels ? vowels.length : 1;

    // common English tweak: trailing 'e'
    if (w.endsWith("e")) count = Math.max(1, count - 1);
    // 'le' ending
    if (w.endsWith("le") && w.length > 4) count += 1;

    return Math.max(1, Math.min(6, count));
  }

  function computeStepsForWord(word) {
    const pressesPerSyllable = parseInt(ppsEl.value, 10);
    const syll = estimateSyllables(word);
    return pressesPerSyllable * syll;
  }

  function pipString(done, needed) {
    // cap visual pips so it doesn't get silly
    const cap = Math.min(12, needed);
    const shownDone = Math.min(cap, Math.round((done * cap) / needed));
    return "●".repeat(shownDone) + "○".repeat(cap - shownDone);
  }

  function render(text) {
    // Split into tokens, keeping punctuation as separate tokens
    const raw =
      text
        .replace(/\s+/g, " ")
        .trim()
        .match(/[\w’']+|[.,;:!?()\[\]{}—–-]/g) || [];

    tokens = raw;
    spans = [];
    stage.innerHTML = "";

    raw.forEach((t) => {
      const span = document.createElement("span");
      span.className = "token" + (isPunctToken(t) ? " punct" : "");
      span.textContent = t;
      stage.appendChild(span);
      spans.push(span);
    });

    wordIdx = 0;
    stepsDone = 0;
    primeCurrentWord();
    updateStats();
    scrollCurrentToPlayhead(true);
  }

  function primeCurrentWord() {
    spans.forEach((s) => s.classList.remove("current"));
    // don't skip punctuations
    while (wordIdx < tokens.length && isPunctToken(tokens[wordIdx])) wordIdx++;
    if (wordIdx >= tokens.length) return;

    spans[wordIdx].classList.add("current");
    stepsNeeded = computeStepsForWord(tokens[wordIdx]);

    const t = tokens[wordIdx];
    if (isPunctToken(t)) {
      stepsNeeded = RESTS[t] ?? 1;
    } else {
      stepsNeeded = computeStepsForWord(t);
    }

    // attach pips display under current token
    cleanupPips();
    const pips = document.createElement("span");
    pips.className = "pips";
    pips.textContent = pipString(stepsDone, stepsNeeded);
    spans[wordIdx].appendChild(pips);
  }

  function cleanupPips() {
    stage.querySelectorAll(".pips").forEach((el) => el.remove());
  }

  function updatePips() {
    const current = spans[wordIdx];
    if (!current) return;
    const p = current.querySelector(".pips");
    if (p) p.textContent = pipString(stepsDone, stepsNeeded);
  }

  function updateStats() {
    const totalWords = tokens.filter((t) => !isPunctToken(t)).length;
    const doneWords = tokens
      .slice(0, wordIdx)
      .filter((t) => !isPunctToken(t)).length;
    const pressesPerSyllable = parseInt(ppsEl.value, 10);
    statsEl.innerHTML =
      `Words: <span class="kbd">${doneWords}</span> / <span class="kbd">${totalWords}</span> ` +
      `· Current steps: <span class="kbd">${stepsDone}</span> / <span class="kbd">${stepsNeeded}</span> ` +
      `· Presses/syllable: <span class="kbd">${pressesPerSyllable}</span>`;
  }

  function scrollCurrentToPlayhead(force = false) {
    const current = spans[wordIdx];
    if (!current) return;

    // playhead is at 45% of viewport height (see CSS)
    const stageRect = stage.getBoundingClientRect();
    const playheadY = stageRect.top + stageRect.height * 0.45;

    const curRect = current.getBoundingClientRect();
    const curMidY = curRect.top + curRect.height / 2;

    const delta = curMidY - playheadY;
    // only scroll if noticeably off, unless force
    if (force || Math.abs(delta) > 18) {
      stage.scrollTop += delta;
    }
  }

  // ---------- Input handling ----------
  let lastPressAt = 0;

  function handleAdvance(key) {
    const now = performance.now();
    const minInterval = parseInt(debounceEl.value, 10);
    if (now - lastPressAt < minInterval) return;
    lastPressAt = now;

    // If finished, do nothing
    if (wordIdx >= tokens.length) return;

    playSoundForKey(key);

    // If current word is unset (end), stop
    if (!tokens[wordIdx]) return;

    stepsDone++;
    updatePips();
    updateStats();

    // When steps complete: advance to next word
    if (stepsDone >= stepsNeeded) {
      stepsDone = 0;
      wordIdx++;
      primeCurrentWord();
      updateStats();
      scrollCurrentToPlayhead(false);
    } else {
      // micro-scroll to create motion even within a long word
      stage.scrollTop += 6;
    }
  }

  document.addEventListener(
    "keydown",
    (e) => {
      const k = e.key.toLowerCase();
      if (keyMap[k]) {
        e.preventDefault();
        handleAdvance(k);
      }
      // Spacebar can also advance (neutral sound)
      if (e.code === "Space") {
        e.preventDefault();
        // treat as "a" sound if enabled, otherwise silent
        handleAdvance("a");
      }
    },
    { passive: false }
  );

  // ---------- UI wiring ----------
  document.getElementById("loadBtn").addEventListener("click", () => {
    render(document.getElementById("textInput").value);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    render(document.getElementById("textInput").value);
  });

  document.getElementById("audioBtn").addEventListener("click", () => {
    ensureAudio();
  });

  ppsEl.addEventListener("input", () => {
    ppsLabel.textContent = ppsEl.value;
    // recompute steps for current word immediately
    if (tokens[wordIdx] && !isPunctToken(tokens[wordIdx])) {
      stepsNeeded = computeStepsForWord(tokens[wordIdx]);
      stepsDone = Math.min(stepsDone, stepsNeeded);
      updatePips();
      updateStats();
    }
  });

  debounceEl.addEventListener("input", () => {
    debounceLabel.textContent = debounceEl.value;
  });

  // Initial render
  ppsLabel.textContent = ppsEl.value;
  debounceLabel.textContent = debounceEl.value;
  render(document.getElementById("textInput").value);
})();
