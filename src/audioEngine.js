const C4 = 261.625565;
const SEMI = (n) => C4 * Math.pow(2, n / 12);

const NOTE_FREQ = {
  // white keys
  a: SEMI(0),
  s: SEMI(2),
  d: SEMI(4),
  f: SEMI(5),
  j: SEMI(7),
  k: SEMI(9),
  l: SEMI(11),
  ";": SEMI(12),

  // black keys
  w: SEMI(1),
  e: SEMI(3),
  r: SEMI(6),
  u: SEMI(8),
  i: SEMI(10),
};

export function createAudioEngine() {
  let audioCtx = null;
  let enabled = false;

  let hatOpenHeld = false;
  let pHeld = false;
  let qHeld = false;

  let octaveShift = 0; // -12,0,+12

  function updateOctaveShift() {
    octaveShift = (pHeld ? 12 : 0) + (qHeld ? -12 : 0);
  }

  function freqWithShift(baseFreq) {
    return baseFreq * Math.pow(2, octaveShift / 12);
  }

  async function ensureAudio() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();
    enabled = true;
    return true;
  }

  function isEnabled() {
    return enabled;
  }

  function playHiHat() {
    if (!enabled) return;
    const now = audioCtx.currentTime;

    const bufferSize = audioCtx.sampleRate * 0.03;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6000, now);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    src.start(now);
    src.stop(now + 0.035);
  }

  function playOpenHiHat() {
    if (!enabled) return;
    const now = audioCtx.currentTime;

    const bufferSize = audioCtx.sampleRate * 0.25;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(4500, now);

    // Slight “wobble” in brightness for realism (LFO on filter cutoff)
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();

    // 5–7 Hz = subtle shimmer, not seasick
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(6, now);

    // Amount in Hz: small = realistic, big = cartoon
    lfoGain.gain.setValueAtTime(120, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    lfo.start(now);
    lfo.stop(now + 0.26);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    src.start(now);
    src.stop(now + 0.28);
  }

  function playKick() {
    if (!enabled) return;
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

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

  function playNote(key) {
    if (!enabled) return;

    const baseFreq = NOTE_FREQ[key];
    if (!baseFreq) return;
    const freq = freqWithShift(baseFreq);

    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  function setModifierHeld(key, held) {
    if (key === "p") pHeld = held;
    if (key === "q") qHeld = held;
    updateOctaveShift();
  }

  function playSnare() {
    if (!enabled) return;
    const now = audioCtx.currentTime;

    // Noise burst
    const bufferSize = audioCtx.sampleRate * 0.12;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1800, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noise.start(now);
    noise.stop(now + 0.13);

    // Body tone
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);

    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  function setHatOpenHeld(held) {
    hatOpenHeld = held;
  }

  function playHat() {
    if (hatOpenHeld) playOpenHiHat();
    else playHiHat();
  }

  const isMelodyKey = (k) => Object.prototype.hasOwnProperty.call(NOTE_FREQ, k);

  return {
    ensureAudio,
    isEnabled,
    playKick,
    playHat,
    playSnare,
    playNote,
    setModifierHeld,
    setHatOpenHeld,
    isMelodyKey,
  };
}
