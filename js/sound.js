let audioCtx = null;
let muted = false;

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  // Some browsers start contexts suspended until a user gesture resumes them.
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function beep({ freq, duration, type = "sine", volume = 0.08, delay = 0 }) {
  if (muted) return;
  try {
    const ctx = getContext();
    const startAt = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  } catch (err) {
    console.error("Sound playback failed:", err);
  }
}

export function playTick() {
  beep({ freq: 740, duration: 0.045, type: "square", volume: 0.045 });
}

export function playError() {
  beep({ freq: 150, duration: 0.14, type: "sawtooth", volume: 0.07 });
}

export function playCountdownBeep() {
  beep({ freq: 440, duration: 0.12, type: "triangle", volume: 0.08 });
}

export function playGo() {
  beep({ freq: 660, duration: 0.22, type: "triangle", volume: 0.1 });
}

export function playFinish() {
  // Small ascending fanfare
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    beep({ freq, duration: 0.2, type: "triangle", volume: 0.09, delay: i * 0.09 });
  });
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}
