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

const C4 = 261.625565; // Middle C
const SEMI = (n) => C4 * Math.pow(2, n / 12);

const NOTE_FREQ = {
  // white keys
  a: SEMI(0), // C4
  s: SEMI(2), // D4
  d: SEMI(4), // E4
  f: SEMI(5), // F4
  j: SEMI(7), // G4
  k: SEMI(9), // A4
  l: SEMI(11), // B4
  ";": SEMI(12), // C5

  // black keys
  w: SEMI(1), // C#4
  e: SEMI(3), // D#4
  r: SEMI(6), // F#4
  u: SEMI(8), // G#4
  i: SEMI(10), // A#4
};

let octaveShift = 0; // -12, 0, +12
let pHeld = false;
let qHeld = false;

function updateOctaveShift() {
  octaveShift = (pHeld ? 12 : 0) + (qHeld ? -12 : 0);
}

function freqWithShift(baseFreq) {
  // 12 semitones = x2; -12 = /2
  return baseFreq * Math.pow(2, octaveShift / 12);
}
// ---------- TTS (Web Speech API) ----------
let ttsBusy = false;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// crude duration estimate (good enough for pacing)
function estimateWordSeconds(word) {
  const w = String(word || "");
  const letters = w.replace(/[^A-Za-z]/g, "").length;
  // baseline: short words ~0.20s, longer words scale up
  return 0.18 + letters * 0.035;
}
let ttsEnabled = false;
let ttsVoice = null;

function pickVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;
  // Prefer English if available
  return voices.find((v) => /en/i.test(v.lang)) || voices[0];
}

function isPunctToken(t) {
  return /^[,.;:!?()\[\]{}—–-]+$/.test(t);
}

function speakToken(token, targetSeconds = null) {
  if (!ttsEnabled) return;
  if (!("speechSynthesis" in window)) return;

  if (!token || isPunctToken(token)) return;

  const clean = String(token).replace(/[^A-Za-z0-9’']/g, "");
  if (!clean) return;

  // If already speaking, DON'T cancel (that causes cutoffs).
  // Instead: mark busy and let the caller block input until this finishes.
  // Also: clear any queued utterances so we don't get backlog.
  if (speechSynthesis.pending) speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(clean);
  u.voice = ttsVoice || pickVoice();
  u.pitch = 1.0;
  u.volume = 1.0;

  // Try to speed up to fit within the beat window (debounce interval).
  // If no target provided, use a reasonable default.
  const est = estimateWordSeconds(clean);
  const tgt = targetSeconds ?? 0.35;
  // rate > 1.0 = faster speech; browsers clamp internally
  u.rate = clamp(est / tgt, 0.85, 2.2);

  ttsBusy = true;
  u.onend = () => {
    ttsBusy = false;
  };
  u.onerror = () => {
    ttsBusy = false;
  };

  speechSynthesis.speak(u);
}

// Voices often load async
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => {
    ttsVoice = pickVoice();
  };
}

(() => {
  // ---------- Audio (simple synth/noise, no assets) ----------
  let audioCtx = null;
  let audioEnabled = false;

  async function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume(); // keypress counts as a user gesture
    }
    audioEnabled = true;

    const btn = document.getElementById("audioBtn");
    if (btn) btn.textContent = "Audio Enabled";
  }

  // Key → pitched “preset”
  const keyMap = {
    // white keys
    a: { type: "sine", dur: 0.09 },
    s: { type: "triangle", dur: 0.1 },
    d: { type: "square", dur: 0.07 },
    f: { type: "sawtooth", dur: 0.06 },
    j: { type: "sine", dur: 0.07 },
    k: { type: "triangle", dur: 0.06 },
    l: { type: "sine", dur: 0.08 },
    ";": { type: "triangle", dur: 0.06 },

    // black keys
    w: { type: "sine", dur: 0.07 },
    e: { type: "triangle", dur: 0.07 },
    r: { type: "sawtooth", dur: 0.06 },
    u: { type: "sine", dur: 0.06 },
    i: { type: "triangle", dur: 0.06 },
  };
  // “Pleasant enough” pitch cycle (pentatonic-ish)
  const pitchCycle = [0, 2, 4, 7, 9, 7, 4, 2]; // semitone offsets
  let pitchIdx = 0;

  function playKick() {
    // requires audioCtx + audioEnabled
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Kick shape: quick drop in frequency + quick decay in volume
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  async function playSoundForKey(k) {
    await ensureAudio(); // <-- unlock audio on first keypress
    if (!audioEnabled) return;

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

    const baseFreq = NOTE_FREQ[k];
    if (!baseFreq) return;

    const freq = freqWithShift(baseFreq);
    osc.frequency.setValueAtTime(freq, now);

    osc.detune.setValueAtTime(preset.detune ?? 0, now);
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
    if (wordIdx >= tokens.length) return;

    spans[wordIdx].classList.add("current");

    const t = tokens[wordIdx];
    if (isPunctToken(t)) {
      stepsNeeded = RESTS[t] ?? 1;
    } else {
      stepsNeeded = computeStepsForWord(t);
    }

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

  async function handleAdvance(key) {
    const now = performance.now();
    if (ttsEnabled && ttsBusy) return;
    const minInterval = parseInt(debounceEl.value, 10);
    if (now - lastPressAt < minInterval) return;
    lastPressAt = now;

    // If finished, do nothing
    if (wordIdx >= tokens.length) return;

    if (key === "__kick__") {
      // kick drum for timekeeping
      ensureAudio().then(() => {
        if (audioEnabled) playKick();
      });
    } else {
      playSoundForKey(key);
    }

    // If current word is unset (end), stop
    if (!tokens[wordIdx]) return;

    stepsDone++;
    updatePips();
    updateStats();

    // When steps complete: advance to next word
    if (stepsDone >= stepsNeeded) {
      // Speak the token we just completed (words only)
      const minInterval = parseInt(debounceEl.value, 10);
      speakToken(tokens[wordIdx], (minInterval / 1000) * 0.92);

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

      // octave modifiers (momentary while held)
      if (k === "p") {
        pHeld = true;
        updateOctaveShift();
        return;
      }
      if (k === "q") {
        qHeld = true;
        updateOctaveShift();
        return;
      }

      if (keyMap[k]) {
        e.preventDefault();
        handleAdvance(k);
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleAdvance("__kick__");
      }
    },
    { passive: false }
  );

  document.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (k === "p") {
      pHeld = false;
      updateOctaveShift();
    }
    if (k === "q") {
      qHeld = false;
      updateOctaveShift();
    }
  });
  // Wire in TTS
  document.getElementById("ttsBtn").addEventListener("click", () => {
    ttsEnabled = !ttsEnabled;
    document.getElementById("ttsBtn").textContent = `TTS: ${
      ttsEnabled ? "On" : "Off"
    }`;
    if (ttsEnabled) {
      ttsVoice = pickVoice();
    } else {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    }
  });

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
