import { createState } from "./state.js";
import { createAudioEngine } from "./audioEngine.js";
import { createTTS } from "./tts.js";
import { createStageView } from "./components/stageView.js";
import { createControlsView } from "./components/controlsView.js";
import { createInstrumentHud } from "./components/instrumentHud.js";
import { createHelpPanel } from "./components/helpPanel.js";
import { createNotationView } from "./components/notationView.js";
import { createController } from "./controller.js";
import { createInputRouter } from "./inputRouter.js";
import { createRecorder } from "./recorder.js";
import { createPlayback } from "./playback.js";

const state = createState();
const audio = createAudioEngine();
const tts = createTTS();
const recorder = createRecorder();

const stageView = createStageView({
  stageEl: document.getElementById("stage"),
  playheadEl: document.getElementById("playhead"),
});

const instrumentHud = createInstrumentHud({
  hudEl: document.getElementById("hudMount"),
});
instrumentHud.mount();

const playback = createPlayback({
  audio,
  instrumentHud,
  hatIndicatorEl: document.getElementById("hatIndicator"),
});

const notationView = createNotationView({
  mountEl: document.getElementById("notationMount"),
});

const controlsView = createControlsView({
  ppsEl: document.getElementById("pps"),
  ppsLabel: document.getElementById("ppsLabel"),
  debounceEl: document.getElementById("debounce"),
  debounceLabel: document.getElementById("debounceLabel"),
  loadBtn: document.getElementById("loadBtn"),
  resetBtn: document.getElementById("resetBtn"),
  audioBtn: document.getElementById("audioBtn"),
  ttsBtn: document.getElementById("ttsBtn"),
  tts,
  audio,
  hatIndicatorEl: document.getElementById("hatIndicator"),
  burstDecelEl: document.getElementById("burstDecel"),
  recordBtn: document.getElementById("recordBtn"),
  recordingStatusEl: document.getElementById("recordingStatus"),
  recorder,
  playBtn: document.getElementById("playBtn"),
  playback,
  notationView,
});

const controller = createController({
  state,
  stageView,
  tts,
  getText: () => document.getElementById("textInput").value,
  setStatsHTML: (html) => {
    document.getElementById("stats").innerHTML = html;
  },
  getControls: () => controlsView.getControls(),
});

controlsView.mount(() => controller.loadFromTextarea());
controller.loadFromTextarea();

const helpPanel = createHelpPanel({
  openBtn: document.getElementById("helpBtn"),
  overlayEl: document.getElementById("helpOverlay"),
  closeBtn: document.getElementById("helpCloseBtn"),
});
helpPanel.mount();

const input = createInputRouter({
  audio,
  controller,
  tts,
  getDebounceMs: () => controlsView.getControls().debounceMs,
  setHatUI: controlsView.setHatUI,
  instrumentHud,
  isHelpOpen: helpPanel.isOpen,
  recorder,
});
input.mount();
