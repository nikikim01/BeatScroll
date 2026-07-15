const NOTE_INFO = {
  a: { step: 0, accidental: null },
  s: { step: 1, accidental: null },
  d: { step: 2, accidental: null },
  f: { step: 3, accidental: null },
  j: { step: 4, accidental: null },
  k: { step: 5, accidental: null },
  l: { step: 6, accidental: null },
  ";": { step: 7, accidental: null },
  w: { step: 0, accidental: "sharp" },
  e: { step: 1, accidental: "sharp" },
  u: { step: 3, accidental: "sharp" },
  i: { step: 4, accidental: "sharp" },
  o: { step: 5, accidental: "sharp" },
};

const STAFF_LINE_YS = [60, 70, 80, 90, 100]; // F5..E4, top to bottom
const MARGIN = 30;
const NOTE_SPACING = 28;

function yForStep(step) {
  return 110 - step * 5;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function createNotationView({ mountEl }) {
  function render(events) {
    const notes = (events || []).filter((e) => e.type === "note");
    const width = MARGIN * 2 + Math.max(notes.length, 1) * NOTE_SPACING;
    const height = 140;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.classList.add("notationStaff");

    STAFF_LINE_YS.forEach((y) => {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", 0);
      line.setAttribute("x2", width);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("class", "staffLine");
      svg.appendChild(line);
    });

    notes.forEach((event, i) => {
      const info = NOTE_INFO[event.key];
      if (!info) return;
      const x = MARGIN + i * NOTE_SPACING;
      const y = yForStep(info.step);

      if (info.step === 0) {
        const ledger = document.createElementNS(SVG_NS, "line");
        ledger.setAttribute("x1", x - 8);
        ledger.setAttribute("x2", x + 8);
        ledger.setAttribute("y1", y);
        ledger.setAttribute("y2", y);
        ledger.setAttribute("class", "ledgerLine");
        svg.appendChild(ledger);
      }

      if (info.accidental === "sharp") {
        const sharp = document.createElementNS(SVG_NS, "text");
        sharp.setAttribute("x", x - 10);
        sharp.setAttribute("y", y + 3);
        sharp.setAttribute("class", "accidental");
        sharp.textContent = "♯";
        svg.appendChild(sharp);
      }

      const head = document.createElementNS(SVG_NS, "ellipse");
      head.setAttribute("cx", x);
      head.setAttribute("cy", y);
      head.setAttribute("rx", 5);
      head.setAttribute("ry", 4);
      head.setAttribute("class", "noteHead");
      svg.appendChild(head);
    });

    mountEl.innerHTML = "";
    mountEl.appendChild(svg);
  }

  return { render };
}
