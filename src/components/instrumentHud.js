const WHITE_KEYS = ["a", "s", "d", "f", "j", "k", "l", ";"];
const BLACK_KEYS = ["w", "e", "t", "i", "o"];

const WHITE_NOTE_NAMES = {
  a: "C",
  s: "D",
  d: "E",
  f: "F",
  j: "G",
  k: "A",
  l: "B",
  ";": "C",
};
const BLACK_NOTE_NAMES = {
  w: { sharp: "C♯", flat: "D♭" },
  e: { sharp: "D♯", flat: "E♭" },
  t: { sharp: "F♯", flat: "G♭" },
  i: { sharp: "G♯", flat: "A♭" },
  o: { sharp: "A♯", flat: "B♭" },
};
const BLACK_KEY_AFTER_WHITE_INDEX = { w: 0, e: 1, t: 3, i: 4, o: 5 };
const WHITE_KEY_W = 20; // px, must match .synthKeyWhite width in CSS
const BLACK_KEY_W = 14; // px, must match .synthKeyBlack width in CSS

const KEY_SIGNATURES = [
  { name: "C", flat: false },
  { name: "G", flat: false },
  { name: "D", flat: false },
  { name: "A", flat: false },
  { name: "E", flat: false },
  { name: "B", flat: false },
  { name: "F♯", flat: false },
  { name: "D♭", flat: true },
  { name: "A♭", flat: true },
  { name: "E♭", flat: true },
  { name: "B♭", flat: true },
  { name: "F", flat: true },
];

export function createInstrumentHud({ hudEl }) {
  let keyEls = {};
  let blackKeyEls = {};
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

  function setKeySignature(flat) {
    BLACK_KEYS.forEach((k) => {
      blackKeyEls[k].textContent = flat
        ? BLACK_NOTE_NAMES[k].flat
        : BLACK_NOTE_NAMES[k].sharp;
    });
  }

  function mount() {
    const wrap = document.createElement("div");
    wrap.className = "instrumentHud";

    const keySelect = document.createElement("select");
    keySelect.className = "keySignatureSelect";
    keySelect.setAttribute("aria-label", "Key signature");
    KEY_SIGNATURES.forEach(({ name, flat }) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      opt.dataset.flat = String(flat);
      keySelect.appendChild(opt);
    });
    keySelect.addEventListener("change", () => {
      const selected = KEY_SIGNATURES.find(
        (sig) => sig.name === keySelect.value
      );
      setKeySignature(selected.flat);
    });

    const keyboard = document.createElement("div");
    keyboard.className = "synthKeyboard";

    const whiteRow = document.createElement("div");
    whiteRow.className = "synthRowWhite";
    WHITE_KEYS.forEach((k) => {
      const el = document.createElement("div");
      el.className = "synthKey synthKeyWhite";
      el.dataset.key = k;
      el.textContent = WHITE_NOTE_NAMES[k];
      whiteRow.appendChild(el);
      keyEls[k] = el;
    });

    const blackRow = document.createElement("div");
    blackRow.className = "synthRowBlack";
    BLACK_KEYS.forEach((k) => {
      const el = document.createElement("div");
      el.className = "synthKey synthKeyBlack";
      el.dataset.key = k;
      el.style.left = `${
        (BLACK_KEY_AFTER_WHITE_INDEX[k] + 1) * WHITE_KEY_W - BLACK_KEY_W / 2
      }px`;
      el.textContent = BLACK_NOTE_NAMES[k].sharp;
      blackRow.appendChild(el);
      keyEls[k] = el;
      blackKeyEls[k] = el;
    });

    keyboard.appendChild(whiteRow);
    keyboard.appendChild(blackRow);

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

    wrap.appendChild(keySelect);
    wrap.appendChild(keyboard);
    wrap.appendChild(sticksEl);
    hudEl.appendChild(wrap);

    setKeySignature(false);
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
