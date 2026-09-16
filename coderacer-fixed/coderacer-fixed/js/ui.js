import { formatRelativeDate } from "./stats.js";

export function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.toggle("active", el.id === screenId);
  });
}

export function renderStatsBar({ wpm, accuracy }) {
  document.getElementById("live-wpm").textContent = wpm;
  document.getElementById("live-accuracy").textContent = accuracy;
}

export function renderResults({ wpm, accuracy, timeLabel, isNewBest, bestWpm }) {
  document.getElementById("result-wpm").textContent = wpm;
  document.getElementById("result-accuracy").textContent = `${accuracy}%`;
  document.getElementById("result-time").textContent = timeLabel;

  document.getElementById("new-best-badge").classList.toggle("hidden", !isNewBest);

  const bestLabel = document.getElementById("result-best");
  bestLabel.textContent = isNewBest
    ? "This is your fastest run yet on this snippet."
    : bestWpm
      ? `Personal best on this snippet: ${bestWpm} WPM`
      : "";
}

export function renderHistory(history) {
  const list = document.getElementById("history-list");
  const emptyMsg = document.getElementById("history-empty");
  list.innerHTML = "";

  emptyMsg.classList.toggle("hidden", history.length > 0);
  if (history.length === 0) return;

  for (const run of history) {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="history-details">
        <strong>${run.snippetId}</strong>
        <span>${run.wpm} WPM &middot; ${run.accuracy}% accuracy</span>
      </div>
      <time>${formatRelativeDate(run.date)}</time>
    `;
    list.appendChild(li);
  }
}
