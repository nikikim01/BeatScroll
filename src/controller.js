import { isPunctToken } from "./tokenizer.js";

function estimateSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 1;
  if (w.length <= 3) return 1;
  const vowels = w.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  if (w.endsWith("e")) count = Math.max(1, count - 1);
  if (w.endsWith("le") && w.length > 4) count += 1;
  return Math.max(1, Math.min(6, count));
}

function pipString(done, needed) {
  const cap = Math.min(12, needed);
  const shownDone = Math.min(cap, Math.round((done * cap) / needed));
  return "●".repeat(shownDone) + "○".repeat(cap - shownDone);
}

export function createController({
  state,
  stageView,
  tts,
  getText,
  setStatsHTML,
  getControls,
}) {
  function computeStepsForWord(word) {
    const { pps } = getControls();
    return pps * estimateSyllables(word);
  }

  function prime() {
    if (state.wordIdx >= state.tokens.length) return;

    stageView.setActive(state.wordIdx);

    const t = state.tokens[state.wordIdx];
    state.stepsNeeded = isPunctToken(t)
      ? state.rests[t] ?? 1
      : computeStepsForWord(t);
    stageView.setPips(
      state.wordIdx,
      pipString(state.stepsDone, state.stepsNeeded)
    );
  }

  function updateStats() {
    const totalWords = state.tokens.filter((t) => !isPunctToken(t)).length;
    const doneWords = state.tokens
      .slice(0, state.wordIdx)
      .filter((t) => !isPunctToken(t)).length;
    const { pps } = getControls();

    setStatsHTML(
      `Words: <span class="kbd">${doneWords}</span> / <span class="kbd">${totalWords}</span> ` +
        `· Current steps: <span class="kbd">${state.stepsDone}</span> / <span class="kbd">${state.stepsNeeded}</span> ` +
        `· Presses/syllable: <span class="kbd">${pps}</span>`
    );
  }

  function loadFromTextarea() {
    const text = getText();
    const { tokens, spans } = stageView.renderText(text);
    state.tokens = tokens;
    state.spans = spans;
    state.wordIdx = 0;
    state.stepsDone = 0;
    prime();
    updateStats();
    stageView.scrollToPlayhead(state.wordIdx, true);
  }

  function advanceOneStep() {
    if (state.wordIdx >= state.tokens.length) return;

    state.stepsDone++;
    stageView.setPips(
      state.wordIdx,
      pipString(state.stepsDone, state.stepsNeeded)
    );
    updateStats();

    if (state.stepsDone >= state.stepsNeeded) {
      const { debounceMs } = getControls();
      tts.speakToken(state.tokens[state.wordIdx], (debounceMs / 1000) * 0.92);

      state.stepsDone = 0;
      state.wordIdx++;
      prime();
      updateStats();
      stageView.scrollToPlayhead(state.wordIdx, false);
    }
  }

  return { loadFromTextarea, advanceOneStep, updateStats, prime };
}
