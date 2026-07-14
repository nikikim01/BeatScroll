import { isPunctToken } from "./tokenizer.js";

function pipString(done, needed) {
  const cap = Math.min(12, needed);
  const shownDone = Math.min(cap, Math.round((done * cap) / needed));
  return "●".repeat(shownDone) + "○".repeat(cap - shownDone);
}

// Heuristic syllable splitter: “good enough to play”
function splitIntoSyllables(word) {
  const raw = String(word || "");
  const w = raw.toLowerCase();

  // Keep apostrophes inside words (don't / eat, can't, etc.)
  const cleaned = w.replace(/[^a-z’']/g, "");
  if (!cleaned) return [raw];

  // Treat short words as 1 syllable
  if (cleaned.length <= 3) return [raw];

  const vowels = "aeiouy";
  const chars = cleaned.split("");

  const chunks = [];
  let cur = "";

  // Build chunks around vowel groups + trailing consonants
  let i = 0;
  while (i < chars.length) {
    cur += chars[i];

    const isV = vowels.includes(chars[i]);
    const next = chars[i + 1];

    // Cut after a vowel group when next char begins a new vowel group later
    if (isV) {
      // consume consecutive vowels
      while (i + 1 < chars.length && vowels.includes(chars[i + 1])) {
        i++;
        cur += chars[i];
      }

      // grab 1 trailing consonant (helps “rea-ding”, “fo-cus” feel)
      if (i + 1 < chars.length && !vowels.includes(chars[i + 1])) {
        i++;
        cur += chars[i];
      }

      chunks.push(cur);
      cur = "";
    }

    i++;
  }

  if (cur) chunks.push(cur);

  // Map chunks back onto the original word length-ish.
  // We keep the original word displayed; these chunks are just counts.
  return chunks.length ? chunks : [raw];
}

export function createController({
  state,
  stageView,
  tts,
  getText,
  setStatsHTML,
  getControls, // still available, even if we stop using pps
}) {
  // Per-word syllable state
  state.sylls = [];
  state.syllIdx = 0;
  state.pressesInSyll = 0;
  state.burstHeld = false;
  state.burstLevel = 0;

  function setBurstHeld(held) {
    state.burstHeld = held;
    if (held) state.burstLevel = 0;
  }

  function prime() {
    if (state.wordIdx >= state.tokens.length) return;

    stageView.setActive(state.wordIdx);

    const t = state.tokens[state.wordIdx];

    if (isPunctToken(t)) {
      // punctuation consumes “rests”
      state.sylls = Array(state.rests[t] ?? 1).fill("•");
    } else {
      state.sylls = splitIntoSyllables(t);
    }

    state.syllIdx = 0;
    state.pressesInSyll = 0;
    stageView.setPips(
      state.wordIdx,
      pipString(state.syllIdx, state.sylls.length)
    );
  }

  function updateStats() {
    const totalWords = state.tokens.filter((t) => !isPunctToken(t)).length;
    const doneWords = state.tokens
      .slice(0, state.wordIdx)
      .filter((t) => !isPunctToken(t)).length;

    setStatsHTML(
      `Words: <span class="kbd">${doneWords}</span> / <span class="kbd">${totalWords}</span> ` +
        `· Syllables: <span class="kbd">${state.syllIdx}</span> / <span class="kbd">${state.sylls.length}</span>`
    );
  }

  function loadFromTextarea() {
    const text = getText();
    const { tokens, spans } = stageView.renderText(text);

    state.tokens = tokens;
    state.spans = spans;

    state.wordIdx = 0;
    state.syllIdx = 0;
    state.sylls = [];

    prime();
    updateStats();
    stageView.scrollToPlayhead(state.wordIdx, true);
  }

  function advanceOneSyllable() {
    if (state.wordIdx >= state.tokens.length) return;

    const { pps, debounceMs, burstDecel } = getControls();

    let credits;
    if (state.burstHeld) {
      credits = 1 + Math.pow(2, state.burstLevel);
      state.burstLevel++;
    } else if (state.burstLevel > 0 && burstDecel) {
      credits = 1 + Math.pow(2, state.burstLevel);
      state.burstLevel--;
    } else {
      credits = 1;
      state.burstLevel = 0;
    }

    while (credits > 0 && state.wordIdx < state.tokens.length) {
      const t = state.tokens[state.wordIdx];
      const requiredPresses = isPunctToken(t) ? 1 : pps;

      state.pressesInSyll++;
      credits--;
      if (state.pressesInSyll < requiredPresses) continue;

      state.pressesInSyll = 0;
      state.syllIdx++;
      stageView.setPips(
        state.wordIdx,
        pipString(state.syllIdx, state.sylls.length)
      );

      if (state.syllIdx >= state.sylls.length) {
        // Word/token complete → speak the full word (not syllables)
        tts.speakToken(
          state.tokens[state.wordIdx],
          (debounceMs / 1000) * 0.92
        );

        state.wordIdx++;
        prime();
        stageView.scrollToPlayhead(state.wordIdx, false);
      }
    }

    updateStats();
  }

  return { loadFromTextarea, advanceOneSyllable, setBurstHeld };
}
