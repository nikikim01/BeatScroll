import { createState } from "./state.js";
import { createAudioEngine } from "./audioEngine.js";
import { createTTS } from "./tts.js";
import { createStageView } from "./components/stageView.js";
import { createControlsView } from "./components/controlsView.js";
import { createController } from "./controller.js";
import { createInputRouter } from "./inputRouter.js";

const state = createState();
const audio = createAudioEngine();
const tts = createTTS();

const stageView = createStageView({
  stageEl: document.getElementById("stage"),
  playheadEl: document.getElementById("playhead"),
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

const input = createInputRouter({
  audio,
  controller,
  tts,
  getDebounceMs: () => controlsView.getControls().debounceMs,
  setHatUI: controlsView.setHatUI,
});
input.mount();
