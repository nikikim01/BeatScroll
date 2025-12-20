import { isPunctToken } from "./tokenizer.js";

export function createTTS() {
  let enabled = false;
  let busy = false;
  let voice = null;

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices?.length) return null;
    return voices.find((v) => /en/i.test(v.lang)) || voices[0];
  }

  function estimateWordSeconds(word) {
    const letters = String(word || "").replace(/[^A-Za-z]/g, "").length;
    return 0.18 + letters * 0.035;
  }

  function setEnabled(next) {
    enabled = next;
    if (!enabled && "speechSynthesis" in window) speechSynthesis.cancel();
    if (enabled) voice = pickVoice();
  }

  function isEnabled() {
    return enabled;
  }
  function isBusy() {
    return busy;
  }

  function speakToken(token, targetSeconds = 0.35) {
    if (!enabled) return;
    if (!("speechSynthesis" in window)) return;
    if (!token || isPunctToken(token)) return;

    const clean = String(token).replace(/[^A-Za-z0-9’']/g, "");
    if (!clean) return;

    // Avoid backlog, but don't cut current word mid-flight:
    if (speechSynthesis.pending) speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(clean);
    u.voice = voice || pickVoice();
    u.pitch = 1.0;
    u.volume = 1.0;

    const est = estimateWordSeconds(clean);
    u.rate = clamp(est / targetSeconds, 0.85, 2.2);

    busy = true;
    u.onend = () => {
      busy = false;
    };
    u.onerror = () => {
      busy = false;
    };

    speechSynthesis.speak(u);
  }

  if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = () => {
      voice = pickVoice();
    };
  }

  return { setEnabled, isEnabled, isBusy, speakToken };
}
