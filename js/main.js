import { TypingEngine } from "./typing.js";
import { RaceTrack } from "./race.js";
import { calculateWPM, calculateAccuracy, formatTime } from "./stats.js";
import { getBestRun, recordRun, getHistory, clearSession } from "./storage.js";
import { showScreen, renderStatsBar, renderResults, renderHistory } from "./ui.js";
import { CAR_COLORS, DEFAULT_CAR_COLOR } from "./colors.js";
import { burstConfetti } from "./confetti.js";
import * as sound from "./sound.js";

let snippets = [];
let currentSnippet = null;
let engine = null;
let track = null;
let selectedCarColor = DEFAULT_CAR_COLOR;

// ---------- Data loading ----------

async function loadSnippets() {
  const res = await fetch("data/snippets.json");
  if (!res.ok) throw new Error(`Failed to load snippets.json (${res.status})`);
  snippets = await res.json();
}

function pickRandomSnippet(language) {
  const pool = snippets.filter((s) => s.language === language);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---------- Color picker ----------

function setupColorPicker() {
  const swatchContainer = document.getElementById("color-swatches");
  const customInput = document.getElementById("custom-color-input");
  const preview = document.getElementById("home-car-preview")?.querySelector(".car-preview");

  swatchContainer.innerHTML = "";

  const applyColor = (hex) => {
    selectedCarColor = hex;
    if (preview) preview.style.color = hex;
  };

  CAR_COLORS.forEach((color, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch";
    btn.style.background = color.hex;
    btn.setAttribute("aria-label", color.name);
    if (i === 0) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      swatchContainer.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("selected"));
      btn.classList.add("selected");
      applyColor(color.hex);
    });

    swatchContainer.appendChild(btn);
  });

  customInput.addEventListener("input", () => {
    swatchContainer.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("selected"));
    applyColor(customInput.value);
  });

  applyColor(DEFAULT_CAR_COLOR);
}

// ---------- Language modal ----------

function openLanguageModal() {
  document.getElementById("language-picker").classList.remove("hidden");
}

function closeLanguageModal() {
  document.getElementById("language-picker").classList.add("hidden");
}

// ---------- Countdown ----------

function runCountdown(onDone) {
  const overlay = document.getElementById("countdown-overlay");
  const textEl = document.getElementById("countdown-text");
  const steps = ["3", "2", "1", "GO!"];
  let i = 0;

  overlay.classList.remove("hidden");

  const next = () => {
    if (i >= steps.length) {
      overlay.classList.add("hidden");
      onDone();
      return;
    }

    textEl.textContent = steps[i];
    // Retrigger the CSS animation by removing/re-adding the class.
    textEl.classList.remove("countdown-text");
    void textEl.offsetWidth;
    textEl.classList.add("countdown-text");

    if (i < steps.length - 1) {
      sound.playCountdownBeep();
    } else {
      sound.playGo();
    }

    i++;
    setTimeout(next, 650);
  };

  next();
}

// ---------- Race lifecycle ----------

function startRace(language) {
  const snippet = pickRandomSnippet(language);
  if (!snippet) {
    console.error(`No snippets available for language: ${language}`);
    return;
  }

  currentSnippet = snippet;
  closeLanguageModal();
  showScreen("screen-race");

  const codeContainer = document.getElementById("code-display");
  const playerCar = document.getElementById("player-car");
  const ghostCar = document.getElementById("ghost-car");
  const trackEl = document.getElementById("track");
  const hiddenInput = document.getElementById("hidden-input");

  playerCar.style.color = selectedCarColor;

  document.getElementById("snippet-label").textContent =
    `${snippet.language} \u00b7 ${snippet.difficulty} \u00b7 ${snippet.id}`;
  renderStatsBar({ wpm: 0, accuracy: 100 });

  const best = getBestRun(snippet.id);
  track = new RaceTrack(playerCar, ghostCar, trackEl, best ? best.wpm : null);
  track.reset();

  engine = new TypingEngine(snippet.code, snippet.language, codeContainer, {
    onProgress: (fraction) => track.setPlayerProgress(fraction),
    onKeystroke: ({ correct }) => {
      if (correct) sound.playTick();
      else sound.playError();

      const elapsed = engine.getElapsedMs();
      const wpm = calculateWPM(engine.correctKeystrokes, elapsed);
      const accuracy = calculateAccuracy(engine.correctKeystrokes, engine.totalKeystrokes);
      renderStatsBar({ wpm, accuracy });
    },
    onComplete: (finalStats) => finishRace(finalStats),
  });

  hiddenInput.value = "";
  hiddenInput.disabled = true; // stays disabled until countdown finishes

  runCountdown(() => {
    hiddenInput.disabled = false;
    hiddenInput.focus();
    if (best) track.startGhost(snippet.code.length);
  });
}

function finishRace(finalStats) {
  track.stop();
  sound.playFinish();

  const wpm = calculateWPM(finalStats.correctKeystrokes, finalStats.elapsedMs);
  const accuracy = calculateAccuracy(finalStats.correctKeystrokes, finalStats.totalKeystrokes);
  const timeLabel = formatTime(finalStats.elapsedMs);

  const previousBest = getBestRun(currentSnippet.id);
  const isNewBest = recordRun(currentSnippet.id, { wpm, accuracy, timeMs: finalStats.elapsedMs });

  renderResults({
    wpm,
    accuracy,
    timeLabel,
    isNewBest,
    bestWpm: previousBest?.wpm,
  });

  showScreen("screen-results");

  if (isNewBest) {
    burstConfetti(document.getElementById("confetti-container"));
  }
}

// ---------- Navigation ----------

function goHome() {
  showScreen("screen-home");
}

function goToHistory() {
  renderHistory(getHistory());
  showScreen("screen-history");
}

// ---------- Input capture ----------

function setupHiddenInputCapture() {
  const hiddenInput = document.getElementById("hidden-input");
  const raceScreen = document.getElementById("screen-race");

  raceScreen.addEventListener("click", () => {
    if (!hiddenInput.disabled) hiddenInput.focus();
  });

  hiddenInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab") e.preventDefault();
    engine?.handleKey(e.key);
  });
}

// ---------- Sound toggle ----------

function setupSoundToggle() {
  const btn = document.getElementById("btn-sound-toggle");
  const iconOn = btn.querySelector(".icon-sound-on");
  const iconOff = btn.querySelector(".icon-sound-off");

  btn.addEventListener("click", () => {
    const nowMuted = !sound.isMuted();
    sound.setMuted(nowMuted);
    iconOn.classList.toggle("hidden", nowMuted);
    iconOff.classList.toggle("hidden", !nowMuted);
    btn.setAttribute("aria-label", nowMuted ? "Unmute sound" : "Mute sound");
  });
}

// ---------- Init ----------

async function init() {
  try {
    await loadSnippets();
  } catch (err) {
    console.error(err);
    const codeDisplay = document.getElementById("code-display");
    if (codeDisplay) codeDisplay.textContent = "Failed to load snippets. Check the console.";
  }

  setupColorPicker();
  setupHiddenInputCapture();
  setupSoundToggle();

  document.getElementById("btn-home").addEventListener("click", goHome);
  document.getElementById("btn-history").addEventListener("click", goToHistory);
  document.getElementById("btn-race").addEventListener("click", openLanguageModal);
  document.getElementById("btn-lang-cancel").addEventListener("click", closeLanguageModal);

  document.getElementById("btn-lang-python").addEventListener("click", () => startRace("python"));
  document.getElementById("btn-lang-java").addEventListener("click", () => startRace("java"));
  const jsBtn = document.getElementById("btn-lang-javascript");
  if (jsBtn) jsBtn.addEventListener("click", () => startRace("javascript"));

  document.getElementById("btn-race-home").addEventListener("click", goHome);
  document.getElementById("btn-history-home").addEventListener("click", goHome);
  document.getElementById("btn-results-home").addEventListener("click", goHome);
  document.getElementById("btn-race-again").addEventListener("click", () => startRace(currentSnippet.language));

  document.getElementById("btn-clear-history").addEventListener("click", () => {
    clearSession();
    renderHistory([]);
  });

  goHome();
}

init();
