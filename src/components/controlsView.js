export function createControlsView({
  ppsEl,
  ppsLabel,
  debounceEl,
  debounceLabel,
  loadBtn,
  resetBtn,
  audioBtn,
  ttsBtn,
  tts,
  audio,
  hatIndicatorEl,
}) {
  function getControls() {
    return {
      pps: parseInt(ppsEl.value, 10),
      debounceMs: parseInt(debounceEl.value, 10),
    };
  }

  function setHatUI(isOpen) {
    if (!hatIndicatorEl) return;
    hatIndicatorEl.textContent = `Hat: ${isOpen ? "Open" : "Closed"}`;
  }

  function mount(onLoadOrReset) {
    ppsLabel.textContent = ppsEl.value;
    debounceLabel.textContent = debounceEl.value;
    if (hatIndicatorEl) setHatUI(false);

    ppsEl.addEventListener("input", () => {
      ppsLabel.textContent = ppsEl.value;
      onLoadOrReset(); // simplest: re-render current text
    });

    debounceEl.addEventListener("input", () => {
      debounceLabel.textContent = debounceEl.value;
    });

    loadBtn.addEventListener("click", onLoadOrReset);
    resetBtn.addEventListener("click", onLoadOrReset);

    audioBtn.addEventListener("click", () => {
      audio.ensureAudio().then(() => {
        audioBtn.textContent = "Audio: On";
        audioBtn.disabled = true;
      });
    });

    ttsBtn.addEventListener("click", () => {
      const next = !tts.isEnabled();
      tts.setEnabled(next);
      ttsBtn.textContent = `TTS: ${next ? "On" : "Off"}`;
    });
  }

  return { getControls, mount, setHatUI };
}
