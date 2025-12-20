import { isPunctToken, tokenize } from "../tokenizer.js";

export function createStageView({ stageEl, playheadEl }) {
  let spans = [];

  function renderText(text) {
    const tokens = tokenize(text);
    spans = [];
    stageEl.innerHTML = "";

    tokens.forEach((t) => {
      const span = document.createElement("span");
      span.className = "token" + (isPunctToken(t) ? " punct" : "");
      span.textContent = t;
      stageEl.appendChild(span);
      spans.push(span);
    });

    return { tokens, spans };
  }

  function setActive(idx) {
    spans.forEach((s) => s.classList.remove("current"));
    if (spans[idx]) spans[idx].classList.add("current");
  }

  function cleanupPips() {
    stageEl.querySelectorAll(".pips").forEach((el) => el.remove());
  }

  function setPips(idx, pipText) {
    cleanupPips();
    const cur = spans[idx];
    if (!cur) return;
    const p = document.createElement("span");
    p.className = "pips";
    p.textContent = pipText;
    cur.appendChild(p);
  }

  function scrollToPlayhead(idx, force = false) {
    const cur = spans[idx];
    if (!cur) return;

    const stageRect = stageEl.getBoundingClientRect();
    const playheadY = stageRect.top + stageRect.height * 0.45;

    const curRect = cur.getBoundingClientRect();
    const curMidY = curRect.top + curRect.height / 2;

    const delta = curMidY - playheadY;
    if (force || Math.abs(delta) > 18) stageEl.scrollTop += delta;
  }

  return { renderText, setActive, setPips, scrollToPlayhead };
}
