export function createRecorder() {
  let recording = false;
  let startedAt = 0;
  let events = [];
  let lastRecording = [];

  function start() {
    recording = true;
    startedAt = performance.now();
    events = [];
  }

  function stop() {
    recording = false;
    lastRecording = events;
    return lastRecording;
  }

  function isRecording() {
    return recording;
  }

  function record(type, key) {
    if (!recording) return;
    events.push({ t: performance.now() - startedAt, type, key });
  }

  function getLastRecording() {
    return lastRecording;
  }

  return { start, stop, isRecording, record, getLastRecording };
}
