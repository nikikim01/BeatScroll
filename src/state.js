export function createState() {
  return {
    tokens: [],
    spans: [],
    wordIdx: 0,
    stepsNeeded: 1,
    stepsDone: 0,

    // UI controls
    pps: 1,
    debounceMs: 100,

    // punctuation rests
    rests: {
      ",": 1,
      ";": 1,
      ":": 1,
      ".": 2,
      "!": 2,
      "?": 2,
      "—": 2,
      "–": 2,
      "(": 1,
      ")": 1,
    },
  };
}
