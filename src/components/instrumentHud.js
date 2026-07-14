const WHITE_KEYS = ["a", "s", "d", "f", "j", "k", "l", ";"];
const BLACK_KEYS = ["w", "e", "r", "u", "i"];

export function createInstrumentHud({ hudEl }) {
  let keyEls = {};
  let sticksEl = null;

  function restartAnimation(el, className, animationName) {
    el.classList.remove(className);
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add(className);
    el.addEventListener(
      "animationend",
      (e) => {
        if (e.animationName === animationName) el.classList.remove(className);
      },
      { once: true }
    );
  }

  function spawnWisp(keyEl) {
    const wisp = document.createElement("span");
    wisp.className = "wisp";
    wisp.addEventListener("animationend", () => wisp.remove());
    keyEl.appendChild(wisp);
  }

  function mount() {
    const wrap = document.createElement("div");
    wrap.className = "instrumentHud";

    const keyboard = document.createElement("div");
    keyboard.className = "synthKeyboard";

    const whiteRow = document.createElement("div");
    whiteRow.className = "synthRow synthRowWhite";
    WHITE_KEYS.forEach((k) => {
      const el = document.createElement("div");
      el.className = "synthKey synthKeyWhite";
      el.dataset.key = k;
      el.textContent = k.toUpperCase();
      whiteRow.appendChild(el);
      keyEls[k] = el;
    });

    const blackRow = document.createElement("div");
    blackRow.className = "synthRow synthRowBlack";
    BLACK_KEYS.forEach((k) => {
      const el = document.createElement("div");
      el.className = "synthKey synthKeyBlack";
      el.dataset.key = k;
      el.textContent = k.toUpperCase();
      blackRow.appendChild(el);
      keyEls[k] = el;
    });

    keyboard.appendChild(blackRow);
    keyboard.appendChild(whiteRow);

    sticksEl = document.createElement("div");
    sticksEl.className = "drumsticks";
    sticksEl.innerHTML = `
      <svg viewBox="0 0 60 40" aria-hidden="true">
        <line class="stick stickLeft" x1="6" y1="34" x2="26" y2="8" />
        <circle class="stickTip" cx="26" cy="8" r="3" />
        <line class="stick stickRight" x1="54" y1="34" x2="34" y2="8" />
        <circle class="stickTip" cx="34" cy="8" r="3" />
      </svg>
    `;

    wrap.appendChild(keyboard);
    wrap.appendChild(sticksEl);
    hudEl.appendChild(wrap);
  }

  function flashKey(k) {
    const el = keyEls[k];
    if (!el) return;
    restartAnimation(el, "keyActive", "keyFlash");
    spawnWisp(el);
  }

  function hitDrum(type) {
    if (!sticksEl) return;
    if (type === "stickClick") {
      restartAnimation(sticksEl, "sticksClick", "stickClickLeft");
    } else {
      restartAnimation(sticksEl, "sticksHit", "stickHitLeft");
    }
  }

  return { mount, flashKey, hitDrum };
}
