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
  downloadMusicXmlBtn,
  annotationModeEl,
  resetAnnotationsBtn,
  notationPlayBtn,
  notationPauseBtn,
  tempoInput,
  notationPlayback,
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
    downloadMusicXmlBtn.disabled = true;
    notationPauseBtn.disabled = true;

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
        downloadMusicXmlBtn.disabled =
          events.filter((e) => e.type === "note").length === 0;
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

    downloadMusicXmlBtn.addEventListener("click", () => {
      const xml = notationView.getMusicXML();
      const blob = new Blob([xml], {
        type: "application/vnd.recordare.musicxml+xml",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beatscroll-recording.musicxml";
      a.click();
      URL.revokeObjectURL(url);
    });

    annotationModeEl.addEventListener("change", () => {
      notationView.setMode(annotationModeEl.value);
    });

    resetAnnotationsBtn.addEventListener("click", () => {
      notationView.resetAnnotations();
    });

    notationPlayBtn.addEventListener("click", () => {
      if (notationPlayback.isPaused()) {
        notationPlayback.resume();
      } else {
        const doc = notationView.getDoc();
        if (!doc.length) return;
        notationPlayback.play(
          doc,
          notationView.getAnnotations(),
          parseInt(tempoInput.value, 10),
          () => {
            notationPlayBtn.textContent = "Play Notation";
            notationPauseBtn.disabled = true;
          }
        );
      }
      notationPlayBtn.textContent = "Playing…";
      notationPauseBtn.disabled = false;
    });

    notationPauseBtn.addEventListener("click", () => {
      notationPlayback.pause();
      notationPlayBtn.textContent = "Resume Notation";
    });

    tempoInput.addEventListener("change", () => {
      notationPlayback.setTempo(parseInt(tempoInput.value, 10));
    });
  }

  return { getControls, mount, setHatUI };
}
