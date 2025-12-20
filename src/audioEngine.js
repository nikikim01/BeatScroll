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

  const isMelodyKey = (k) => Object.prototype.hasOwnProperty.call(NOTE_FREQ, k);

  return {
    ensureAudio,
    isEnabled,
    playKick,
    playNote,
    setModifierHeld,
    isMelodyKey,
  };
}
