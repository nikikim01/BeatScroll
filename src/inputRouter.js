export function createInputRouter({ audio, controller, tts, getDebounceMs }) {
  let lastPressAt = 0;

  function canPress() {
    const now = performance.now();
    const minInterval = getDebounceMs();
    if (tts.isEnabled() && tts.isBusy()) return false;
    if (now - lastPressAt < minInterval) return false;
    lastPressAt = now;
    return true;
  }

  function onKeyDown(e) {
    const target = e.target;
    const isTextEntry =
      target &&
      (target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.isContentEditable);
    if (isTextEntry) return;

    const k = e.key.toLowerCase();

    if (k === "p" || k === "q") {
      audio.setModifierHeld(k, true);
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (!canPress()) return;
      audio.ensureAudio().then(() => audio.playKick());
      controller.advanceOneStep();
      return;
    }

    if (audio.isMelodyKey(k)) {
      e.preventDefault();
      if (!canPress()) return;
      audio.ensureAudio().then(() => audio.playNote(k));
      controller.advanceOneStep();
    }
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === "p" || k === "q") audio.setModifierHeld(k, false);
  }

  function mount() {
    document.addEventListener("keydown", onKeyDown, { passive: false });
    document.addEventListener("keyup", onKeyUp);
  }

  return { mount };
}
