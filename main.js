import { TypingEngine } from "./typing.js";
import { RaceTrack } from "./race.js";
import { calculateWPM, calculateAccuracy, formatTime } from "./stats.js";
import {
  getBestRun,
  recordRun,
  getHistory,
  clearSessionHistory,
  getCarColor,
  setCarColor,
} from "./storage.js";
import {
  showScreen,
  renderStatsBar,
  renderResults,
  renderHistory,
  setupHomeScreen,
  updateHomeScreen,
  applyCarColor,
  openLanguagePicker,
  closeLanguagePicker,
} from "./ui.js";
import {
  setEnabled,
  isEnabled,
  playKeySound,
  playErrorSound,
  playCountdownBeep,
  playGoSound,
  playFinishSound,
} from "./audio.js";

let snippets = [];
let currentSnippet = null;
let engine = null;
let track = null;
let raceLocked = true;

async function loadSnippets() {
  const res = await fetch("data/snippets.json");
  snippets = await res.json();
}

/* ----------------------------------------------------------------
   COUNTDOWN
   ---------------------------------------------------------------- */
function runCountdown() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("countdown-overlay");
    const text = document.getElementById("countdown-text");

    overlay.classList.remove("hidden");
    raceLocked = true;

    const steps = ["3", "2", "1", "GO!"];
    let i = 0;

    function showNext() {
      if (i >= steps.length) {
        // Fade out overlay
        overlay.style.transition = "opacity 0.25s ease";
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.classList.add("hidden");
          overlay.style.transition = "";
          overlay.style.opacity = "";
          raceLocked = false;
          resolve();
        }, 250);
        return;
      }

      text.textContent = steps[i];
      // Re-trigger animation by removing and re-adding the element's animation
      text.style.animation = "none";
      // Force reflow
      void text.offsetWidth;
      text.style.animation = "";

      if (i < 3) {
        playCountdownBeep();
      } else {
        playGoSound();
      }

      i++;
      setTimeout(showNext, 800);
    }

    showNext();
  });
}

/* ----------------------------------------------------------------
   START / FINISH RACE
   ---------------------------------------------------------------- */
async function startRace(snippet) {
  currentSnippet = snippet;

  const codeContainer = document.getElementById("code-display");
  const playerCar = document.getElementById("player-car");
  const ghostCar = document.getElementById("ghost-car");
  const trackEl = document.getElementById("track");
  const hiddenInput = document.getElementById("hidden-input");

  showScreen("screen-race");
  document.getElementById("snippet-label").textContent =
    `${snippet.language} \u00B7 ${snippet.difficulty} \u00B7 ${snippet.id}`;
  renderStatsBar({ wpm: 0, accuracy: 100 });

  const best = getBestRun(snippet.id);
  track = new RaceTrack(playerCar, ghostCar, trackEl, best ? best.wpm : null);
  track.reset();

  engine = new TypingEngine(
    snippet.code,
    codeContainer,
    {
      onProgress: (fraction) => track.setPlayerProgress(fraction),
      onKeystroke: ({ correct }) => {
        if (correct) {
          playKeySound();
        } else {
          playErrorSound();
        }
        const elapsed = engine.getElapsedMs();
        const wpm = calculateWPM(engine.correctKeystrokes, elapsed);
        const accuracy = calculateAccuracy(
          engine.correctKeystrokes,
          engine.totalKeystrokes,
        );
        renderStatsBar({ wpm, accuracy });
      },
      onComplete: (finalStats) => finishRace(finalStats),
    },
    snippet.language,
  );

  hiddenInput.value = "";
  hiddenInput.focus();

  // Run countdown, then start the ghost and allow input
  await runCountdown();

  if (best) {
    track.startGhost(snippet.code.length);
  }
}

function finishRace(finalStats) {
  track.stop();
  playFinishSound();

  const wpm = calculateWPM(finalStats.correctKeystrokes, finalStats.elapsedMs);
  const accuracy = calculateAccuracy(
    finalStats.correctKeystrokes,
    finalStats.totalKeystrokes,
  );
  const timeLabel = formatTime(finalStats.elapsedMs);

  const previousBest = getBestRun(currentSnippet.id);
  const isNewBest = recordRun(currentSnippet.id, {
    wpm,
    accuracy,
    timeMs: finalStats.elapsedMs,
  });

  renderResults({
    wpm,
    accuracy,
    timeLabel,
    isNewBest,
    bestWpm: isNewBest ? null : previousBest?.wpm,
  });

  showScreen("screen-results");
}

/* ----------------------------------------------------------------
   NAVIGATION
   ---------------------------------------------------------------- */
function goToHome() {
  const color = getCarColor();
  applyCarColor(color);
  updateHomeScreen(color);
  showScreen("screen-home");
}

function goToHistory() {
  renderHistory(getHistory());
  showScreen("screen-history");
}

function handleSelectColor(color) {
  setCarColor(color);
  applyCarColor(color);
  updateHomeScreen(color);
}

/* ----------------------------------------------------------------
   LANGUAGE SELECTION
   ---------------------------------------------------------------- */
function startRaceWithLanguage(language) {
  const filtered = snippets.filter((s) => s.language === language);
  if (filtered.length === 0) return;
  const snippet = filtered[Math.floor(Math.random() * filtered.length)];
  closeLanguagePicker();
  startRace(snippet);
}

/* ----------------------------------------------------------------
   INPUT CAPTURE
   ---------------------------------------------------------------- */
function setupHiddenInputCapture() {
  const hiddenInput = document.getElementById("hidden-input");
  const raceScreen = document.getElementById("screen-race");

  raceScreen.addEventListener("click", () => hiddenInput.focus());

  hiddenInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab") e.preventDefault();
    if (raceLocked) return;
    engine?.handleKey(e.key);
  });
}

/* ----------------------------------------------------------------
   SOUND TOGGLE
   ---------------------------------------------------------------- */
function setupSoundToggle() {
  const btn = document.getElementById("btn-sound-toggle");
  const iconOn = btn.querySelector(".icon-sound-on");
  const iconOff = btn.querySelector(".icon-sound-off");

  function updateIcon() {
    const on = isEnabled();
    iconOn.classList.toggle("hidden", !on);
    iconOff.classList.toggle("hidden", on);
  }

  updateIcon();

  btn.addEventListener("click", () => {
    setEnabled(!isEnabled());
    updateIcon();
  });
}

/* ----------------------------------------------------------------
   INIT
   ---------------------------------------------------------------- */
async function init() {
  await loadSnippets();
  setupHiddenInputCapture();
  setupSoundToggle();

  setupHomeScreen({
    onSelectColor: handleSelectColor,
    onStart: openLanguagePicker,
  });

  document.getElementById("btn-home").addEventListener("click", goToHome);
  document.getElementById("btn-history").addEventListener("click", goToHistory);
  document.getElementById("btn-history-home").addEventListener("click", goToHome);
  document.getElementById("btn-clear-history").addEventListener("click", () => {
    clearSessionHistory();
    renderHistory([]);
  });
  document
    .getElementById("btn-race-home")
    .addEventListener("click", goToHome);
  document
    .getElementById("btn-race-again")
    .addEventListener("click", () => startRace(currentSnippet));
  document
    .getElementById("btn-results-home")
    .addEventListener("click", goToHome);

  document.getElementById("btn-lang-python").addEventListener("click", () => startRaceWithLanguage("python"));
  document.getElementById("btn-lang-java").addEventListener("click", () => startRaceWithLanguage("java"));
  document.getElementById("btn-lang-cancel").addEventListener("click", closeLanguagePicker);
  document.getElementById("language-picker").addEventListener("click", (e) => {
    if (e.target.id === "language-picker") closeLanguagePicker();
  });

  goToHome();
}

init();
