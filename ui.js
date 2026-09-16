export function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.toggle("active", el.id === screenId);
  });
}

export function renderStatsBar({ wpm, accuracy }) {
  document.getElementById("live-wpm").textContent = wpm;
  document.getElementById("live-accuracy").textContent = `${accuracy}%`;
}

export function renderResults({ wpm, accuracy, timeLabel, isNewBest, bestWpm }) {
  document.getElementById("result-wpm").textContent = wpm;
  document.getElementById("result-accuracy").textContent = `${accuracy}%`;
  document.getElementById("result-time").textContent = timeLabel;

  const badge = document.getElementById("new-best-badge");
  badge.classList.toggle("hidden", !isNewBest);

  const bestLabel = document.getElementById("result-best");
  bestLabel.textContent = bestWpm ? `Personal best: ${bestWpm} WPM` : "First run on this snippet";

  if (isNewBest) triggerCelebration();
}

export function renderHistory(history) {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  list.innerHTML = "";
  empty.classList.toggle("hidden", history.length > 0);

  for (const run of history) {
    const item = document.createElement("li");
    item.className = "history-item";

    const details = document.createElement("div");
    details.className = "history-details";
    details.innerHTML = `<strong>${run.snippetId}</strong><span>${run.wpm} WPM · ${run.accuracy}% accuracy</span>`;

    const date = document.createElement("time");
    date.dateTime = run.date;
    date.textContent = new Date(run.date).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    item.append(details, date);
    list.appendChild(item);
  }
}

function triggerCelebration() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";

  const colors = ["#4fd1c5", "#f2b94b", "#e4573d", "#a78bfa", "#34d399"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.5 + "s";
    piece.style.animationDuration = 1 + Math.random() * 1.5 + "s";
    container.appendChild(piece);
  }
  setTimeout(() => {
    container.innerHTML = "";
  }, 3000);
}

export function openLanguagePicker() {
  document.getElementById("language-picker").classList.remove("hidden");
}

export function closeLanguagePicker() {
  document.getElementById("language-picker").classList.add("hidden");
}

/* ----------------------------------------------------------------
   HOME SCREEN — CAR COLOR
   ---------------------------------------------------------------- */
const CAR_COLORS = [
  "#00e5c3",
  "#f0b429",
  "#e4573d",
  "#a78bfa",
  "#4d9fff",
  "#34d399",
  "#ff6b9d",
  "#ff9f43",
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Applies the chosen color to the player theme (car, accents, etc.). */
export function applyCarColor(color) {
  const root = document.documentElement;
  root.style.setProperty("--player", color);
  root.style.setProperty("--player-dim", hexToRgba(color, 0.15));
  root.style.setProperty("--player-glow", hexToRgba(color, 0.4));
}

/** Wires up the home screen controls (color swatches, custom picker, start). */
export function setupHomeScreen({ onSelectColor, onStart }) {
  const swatches = document.getElementById("color-swatches");
  const customInput = document.getElementById("custom-color-input");
  const raceBtn = document.getElementById("btn-race");

  for (const color of CAR_COLORS) {
    const btn = document.createElement("button");
    btn.className = "color-swatch";
    btn.dataset.color = color;
    btn.style.backgroundColor = color;
    btn.title = color;
    btn.setAttribute("aria-label", `Car color ${color}`);
    btn.addEventListener("click", () => onSelectColor(color));
    swatches.appendChild(btn);
  }

  customInput.addEventListener("input", () => onSelectColor(customInput.value));
  raceBtn.addEventListener("click", onStart);
}

/** Reflects the current color in the home screen preview and swatches. */
export function updateHomeScreen(currentColor) {
  const preview = document.getElementById("home-car-preview");
  const swatches = document.getElementById("color-swatches");
  const customInput = document.getElementById("custom-color-input");

  preview.style.color = currentColor;
  customInput.value = currentColor;

  for (const btn of swatches.querySelectorAll(".color-swatch")) {
    btn.classList.toggle("selected", btn.dataset.color === currentColor);
  }
}
