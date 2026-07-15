export function createPlayback({ audio, instrumentHud, hatIndicatorEl }) {
  let timeouts = [];
  let playing = false;

  function setHatIndicator(isOpen) {
    if (!hatIndicatorEl) return;
    hatIndicatorEl.textContent = `Hat: ${isOpen ? "Open" : "Closed"}`;
  }

  function applyEvent(event) {
    switch (event.type) {
      case "note":
        instrumentHud?.flashKey(event.key);
        audio.ensureAudio().then(() => audio.playNote(event.key));
        break;
      case "kick":
        instrumentHud?.hitDrum("kick");
        audio.ensureAudio().then(() => audio.playKick());
        break;
      case "hat":
        instrumentHud?.hitDrum("hat");
        audio.ensureAudio().then(() => audio.playHat());
        break;
      case "snare":
        instrumentHud?.hitDrum("snare");
        audio.ensureAudio().then(() => audio.playSnare());
        break;
      case "cowbell":
        instrumentHud?.hitDrum("cowbell");
        audio.ensureAudio().then(() => audio.playCowbell());
        break;
      case "stickClick":
        instrumentHud?.hitDrum("stickClick");
        audio.ensureAudio().then(() => audio.playStickClick());
        break;
      case "modifierDown":
        if (event.key === "shiftLeft") {
          audio.setHatOpenHeld(true);
          setHatIndicator(true);
        } else {
          audio.setModifierHeld(event.key, true);
        }
        break;
      case "modifierUp":
        if (event.key === "shiftLeft") {
          audio.setHatOpenHeld(false);
          setHatIndicator(false);
        } else {
          audio.setModifierHeld(event.key, false);
        }
        break;
    }
  }

  function resetModifiers() {
    audio.setModifierHeld("p", false);
    audio.setModifierHeld("q", false);
    audio.setHatOpenHeld(false);
    setHatIndicator(false);
  }

  function stop() {
    timeouts.forEach((id) => clearTimeout(id));
    timeouts = [];
    playing = false;
    resetModifiers();
  }

  function play(events, onComplete) {
    stop();
    if (!events || !events.length) return;
    playing = true;
    timeouts = events.map((event) =>
      setTimeout(() => applyEvent(event), event.t)
    );
    const lastT = events[events.length - 1].t;
    timeouts.push(
      setTimeout(() => {
        playing = false;
        resetModifiers();
        onComplete?.();
      }, lastT + 50)
    );
  }

  function isPlaying() {
    return playing;
  }

  return { play, stop, isPlaying };
}
