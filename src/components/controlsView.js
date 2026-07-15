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
  burstDecelEl,
  recordBtn,
  recordingStatusEl,
  recorder,
  playBtn,
  playback,
  notationView,
}) {
  function getControls() {
    return {
      pps: parseInt(ppsEl.value, 10),
      debounceMs: parseInt(debounceEl.value, 10),
      burstDecel: burstDecelEl.checked,
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
    playBtn.disabled = true;

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

    recordBtn.addEventListener("click", () => {
      if (recorder.isRecording()) {
        const events = recorder.stop();
        recordBtn.textContent = "Record";
        playBtn.disabled = events.length === 0;
        notationView.render(events);
        const durationSec = events.length
          ? (events[events.length - 1].t / 1000).toFixed(1)
          : "0.0";
        if (recordingStatusEl) {
          recordingStatusEl.textContent = `Recorded ${events.length} event${
            events.length === 1 ? "" : "s"
          } over ${durationSec}s`;
        }
      } else {
        recorder.start();
        recordBtn.textContent = "Stop Recording";
        playBtn.disabled = true;
        if (recordingStatusEl) recordingStatusEl.textContent = "";
      }
    });

    playBtn.addEventListener("click", () => {
      if (playback.isPlaying()) {
        playback.stop();
        playBtn.textContent = "Play Recording";
        recordBtn.disabled = false;
      } else {
        const events = recorder.getLastRecording();
        if (!events.length) return;
        playBtn.textContent = "Stop Playback";
        recordBtn.disabled = true;
        playback.play(events, () => {
          playBtn.textContent = "Play Recording";
          recordBtn.disabled = false;
        });
      }
    });
  }

  return { getControls, mount, setHatUI };
}
