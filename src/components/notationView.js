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

const REVERSE_NOTE_INFO = Object.entries(NOTE_INFO).reduce(
  (acc, [key, info]) => {
    acc[`${info.step}:${info.accidental ?? "natural"}`] = key;
    return acc;
  },
  {}
);

export function keyForNote(note) {
  return REVERSE_NOTE_INFO[`${note.step}:${note.accidental ?? "natural"}`];
}

const STEP_TO_PITCH = [
  { letter: "C", octave: 4 },
  { letter: "D", octave: 4 },
  { letter: "E", octave: 4 },
  { letter: "F", octave: 4 },
  { letter: "G", octave: 4 },
  { letter: "A", octave: 4 },
  { letter: "B", octave: 4 },
  { letter: "C", octave: 5 },
];

const STAFF_LINE_YS = [60, 70, 80, 90, 100]; // F5..E4, top to bottom
const MARGIN = 30;
const NOTE_SPACING = 28;
const VIEWBOX_HEIGHT = 140;

function yForStep(step) {
  return 110 - step * 5;
}

function stepFromY(y) {
  const raw = Math.round((110 - y) / 5);
  return Math.max(0, Math.min(7, raw));
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function createNotationView({ mountEl }) {
  let notationDoc = [];
  let annotations = { breaths: [], accents: new Set(), hairpins: [] };
  let mode = "none";
  let hairpinDragStart = null;

  function render(events) {
    notationDoc = (events || [])
      .filter((e) => e.type === "note")
      .map((e) => {
        const info = NOTE_INFO[e.key];
        return info
          ? { step: info.step, accidental: info.accidental, t: e.t }
          : null;
      })
      .filter(Boolean);
    annotations = { breaths: [], accents: new Set(), hairpins: [] };
    renderDoc();
  }

  function setMode(newMode) {
    mode = newMode;
    hairpinDragStart = null;
  }

  function resetAnnotations() {
    annotations = { breaths: [], accents: new Set(), hairpins: [] };
    renderDoc();
  }

  function getDoc() {
    return notationDoc;
  }

  function getAnnotations() {
    return annotations;
  }

  function cleanupAnnotationsForDelete(index) {
    annotations.accents.delete(index);
    annotations.accents = new Set(
      [...annotations.accents].map((i) => (i > index ? i - 1 : i))
    );
    annotations.breaths = annotations.breaths
      .filter((g) => g !== index)
      .map((g) => (g > index ? g - 1 : g));
    annotations.hairpins = annotations.hairpins
      .filter((h) => !(h.from <= index && index <= h.to))
      .map((h) => ({
        ...h,
        from: h.from > index ? h.from - 1 : h.from,
        to: h.to > index ? h.to - 1 : h.to,
      }));
  }

  function attachNoteInteractions(head, index) {
    head.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      notationDoc.splice(index, 1);
      cleanupAnnotationsForDelete(index);
      renderDoc();
    });

    head.addEventListener("pointerdown", (e) => {
      e.stopPropagation();

      if (mode === "accent") {
        if (annotations.accents.has(index)) annotations.accents.delete(index);
        else annotations.accents.add(index);
        renderDoc();
        return;
      }

      if (mode === "cresc" || mode === "decresc") {
        hairpinDragStart = index;
        return;
      }

      head.setPointerCapture(e.pointerId);
      const svg = head.ownerSVGElement;

      const onMove = (moveEvent) => {
        const rect = svg.getBoundingClientRect();
        const scaleY = VIEWBOX_HEIGHT / rect.height;
        const y = (moveEvent.clientY - rect.top) * scaleY;
        head.setAttribute("cy", yForStep(stepFromY(y)));
      };

      const onUp = (upEvent) => {
        const rect = svg.getBoundingClientRect();
        const scaleY = VIEWBOX_HEIGHT / rect.height;
        const y = (upEvent.clientY - rect.top) * scaleY;
        notationDoc[index] = {
          ...notationDoc[index],
          step: stepFromY(y),
          accidental: null,
        };
        head.removeEventListener("pointermove", onMove);
        head.removeEventListener("pointerup", onUp);
        renderDoc();
      };

      head.addEventListener("pointermove", onMove);
      head.addEventListener("pointerup", onUp);
    });
  }

  function renderDoc() {
    const width =
      MARGIN * 2 + Math.max(notationDoc.length, 1) * NOTE_SPACING;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${VIEWBOX_HEIGHT}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", VIEWBOX_HEIGHT);
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

    notationDoc.forEach((note, i) => {
      const x = MARGIN + i * NOTE_SPACING;
      const y = yForStep(note.step);

      if (note.step === 0) {
        const ledger = document.createElementNS(SVG_NS, "line");
        ledger.setAttribute("x1", x - 8);
        ledger.setAttribute("x2", x + 8);
        ledger.setAttribute("y1", y);
        ledger.setAttribute("y2", y);
        ledger.setAttribute("class", "ledgerLine");
        svg.appendChild(ledger);
      }

      if (note.accidental === "sharp") {
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
      head.dataset.index = i;
      attachNoteInteractions(head, i);
      svg.appendChild(head);
    });

    annotations.accents.forEach((i) => {
      if (!notationDoc[i]) return;
      const x = MARGIN + i * NOTE_SPACING;
      const y = yForStep(notationDoc[i].step) - 10;
      const accent = document.createElementNS(SVG_NS, "text");
      accent.setAttribute("x", x - 4);
      accent.setAttribute("y", y);
      accent.setAttribute("class", "accentMark");
      accent.textContent = "›";
      svg.appendChild(accent);
    });

    annotations.breaths.forEach((afterIndex) => {
      const x = MARGIN + (afterIndex + 0.5) * NOTE_SPACING;
      const breath = document.createElementNS(SVG_NS, "text");
      breath.setAttribute("x", x);
      breath.setAttribute("y", STAFF_LINE_YS[0] - 8);
      breath.setAttribute("class", "breathMark");
      breath.textContent = ",";
      svg.appendChild(breath);
    });

    annotations.hairpins.forEach(({ type, from, to }) => {
      const x1 = MARGIN + from * NOTE_SPACING;
      const x2 = MARGIN + to * NOTE_SPACING;
      const yMid = 120;
      const wide = 6;
      const [leftHalf, rightHalf] = type === "cresc" ? [0, wide] : [wide, 0];
      const hairpin = document.createElementNS(SVG_NS, "path");
      hairpin.setAttribute(
        "d",
        `M ${x1} ${yMid - leftHalf} L ${x2} ${yMid - rightHalf} M ${x1} ${
          yMid + leftHalf
        } L ${x2} ${yMid + rightHalf}`
      );
      hairpin.setAttribute("class", "hairpin");
      svg.appendChild(hairpin);
    });

    svg.addEventListener("click", (e) => {
      if (e.target.classList.contains("noteHead")) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = VIEWBOX_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (mode === "breath") {
        const gapIndex = Math.round((x - MARGIN) / NOTE_SPACING) - 1;
        const existing = annotations.breaths.indexOf(gapIndex);
        if (existing === -1) annotations.breaths.push(gapIndex);
        else annotations.breaths.splice(existing, 1);
        renderDoc();
        return;
      }
      if (mode !== "none") return;

      const step = stepFromY(y);
      const insertAt = notationDoc.findIndex(
        (_, i) => MARGIN + i * NOTE_SPACING > x
      );
      const index = insertAt === -1 ? notationDoc.length : insertAt;
      notationDoc.splice(index, 0, { step, accidental: null, t: null });
      renderDoc();
    });

    svg.addEventListener("pointerup", (e) => {
      if (
        (mode === "cresc" || mode === "decresc") &&
        hairpinDragStart !== null
      ) {
        const target = e.target;
        const endIndex = Number(target?.dataset?.index);
        if (!Number.isNaN(endIndex) && endIndex !== hairpinDragStart) {
          annotations.hairpins.push({
            type: mode === "cresc" ? "cresc" : "decresc",
            from: Math.min(hairpinDragStart, endIndex),
            to: Math.max(hairpinDragStart, endIndex),
          });
          renderDoc();
        }
        hairpinDragStart = null;
      }
    });

    mountEl.innerHTML = "";
    mountEl.appendChild(svg);
  }

  function buildMusicXML() {
    const measures = [];
    for (let i = 0; i < notationDoc.length; i += 4) {
      measures.push(notationDoc.slice(i, i + 4));
    }

    const measureXML = measures
      .map((notes, mIndex) => {
        const attributes =
          mIndex === 0
            ? `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
            : "";
        const noteXML = notes
          .map((note) => {
            const pitch = STEP_TO_PITCH[note.step];
            const alter =
              note.accidental === "sharp" ? "<alter>1</alter>" : "";
            return `<note><pitch><step>${pitch.letter}</step>${alter}<octave>${pitch.octave}</octave></pitch><duration>1</duration><type>quarter</type></note>`;
          })
          .join("");
        return `<measure number="${
          mIndex + 1
        }">${attributes}${noteXML}</measure>`;
      })
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Voice</part-name></score-part></part-list><part id="P1">${measureXML}</part></score-partwise>`;
  }

  function getMusicXML() {
    return buildMusicXML();
  }

  return {
    render,
    getMusicXML,
    setMode,
    resetAnnotations,
    getDoc,
    getAnnotations,
  };
}
