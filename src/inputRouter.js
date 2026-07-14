export function createInputRouter({
  audio,
  controller,
  tts,
  getDebounceMs,
  setHatUI,
  instrumentHud,
}) {
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

    // octave modifiers
    if (k === "p" || k === "q") {
      audio.setModifierHeld(k, true);
      return;
    }

    // Open HI-HAT
    if (e.code === "ShiftLeft") {
      audio.setHatOpenHeld(true);
      setHatUI?.(true);
      instrumentHud?.hitDrum("openHat");
      return;
    }

    // Burst tempo (ramp)
    if (e.code === "ShiftRight") {
      if (e.repeat) return;
      controller.setBurstHeld(true);
      return;
    }

    // KICK
    if (e.code === "Space") {
      // Don't prevent browser shortcuts (Cmd/Ctrl/Alt + Space)
      const isSysCombo = e.metaKey || e.ctrlKey || e.altKey;
      if (!isSysCombo) e.preventDefault();
      if (!isSysCombo) {
        audio.ensureAudio().then(() => audio.playKick());
        instrumentHud?.hitDrum("kick");
      }
      return;
    }

    // HI-HAT
    if (k === "h") {
      // Respect system modifier keys (e.g., Cmd+Shift+H)
      const isSysCombo = e.metaKey || e.ctrlKey || e.altKey;
      if (!isSysCombo) {
        e.preventDefault();
        audio.ensureAudio().then(() => audio.playHat());
        instrumentHud?.hitDrum("hat");
      }
      return;
    }

    // SNARE
    if (k === "v") {
      const isSysCombo = e.metaKey || e.ctrlKey || e.altKey;
      if (!isSysCombo) {
        e.preventDefault();
        audio.ensureAudio().then(() => audio.playSnare());
        instrumentHud?.hitDrum("snare");
      }
      return;
    }

    // MELODY / SYLLABLE ADVANCE
    if (audio.isMelodyKey(k)) {
      // If the user is holding a system modifier, don't hijack the shortcut
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      if (!canPress()) return;

      instrumentHud?.flashKey(k);
      audio.ensureAudio().then(() => audio.playNote(k));
      controller.advanceOneSyllable();
    }
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (e.code === "ShiftLeft") {
      audio.setHatOpenHeld(false);
      setHatUI?.(false);
      return;
    }
    if (e.code === "ShiftRight") {
      controller.setBurstHeld(false);
      return;
    }
    if (k === "p" || k === "q") {
      audio.setModifierHeld(k, false);
      return;
    }
  }

  function mount() {
    document.addEventListener("keydown", onKeyDown, { passive: false });
    document.addEventListener("keyup", onKeyUp);
  }

  return { mount };
}
