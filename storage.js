const STORAGE_KEY = "coderacer_data";
const SESSION_HISTORY_KEY = "coderacer_session_history";
const CAR_COLOR_KEY = "coderacer_car_color";
const DEFAULT_CAR_COLOR = "#00e5c3";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestRuns: {}, history: [] };
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load CodeRacer data:", err);
    return { bestRuns: {}, history: [] };
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save CodeRacer data:", err);
  }
}

export function getBestRun(snippetId) {
  const data = loadData();
  return data.bestRuns[snippetId] || null;
}

export function recordRun(snippetId, run) {
  const data = loadData();
  const previousBest = data.bestRuns[snippetId];
  const isNewBest = !previousBest || run.wpm > previousBest.wpm;

  if (isNewBest) {
    data.bestRuns[snippetId] = run;
  }

  saveData(data);
  saveSessionRun({ snippetId, ...run, date: new Date().toISOString() });
  return isNewBest;
}

export function getHistory() {
  try {
    const raw = sessionStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load session history:", err);
    return [];
  }
}

function saveSessionRun(run) {
  const history = getHistory();
  history.unshift(run);

  try {
    sessionStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify(history.slice(0, 20)),
    );
  } catch (err) {
    console.error("Failed to save session history:", err);
  }
}

export function clearSessionHistory() {
  sessionStorage.removeItem(SESSION_HISTORY_KEY);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCarColor() {
  try {
    const color = localStorage.getItem(CAR_COLOR_KEY);
    return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_CAR_COLOR;
  } catch (err) {
    console.error("Failed to load car color:", err);
    return DEFAULT_CAR_COLOR;
  }
}

export function setCarColor(color) {
  try {
    localStorage.setItem(CAR_COLOR_KEY, color);
  } catch (err) {
    console.error("Failed to save car color:", err);
  }
}

/** Aggregate stats computed from history. */
export function getStats() {
  const h = getHistory();
  if (h.length === 0) {
    return { totalRaces: 0, avgWpm: 0, avgAccuracy: 0, bestWpm: 0 };
  }
  const totalRaces = h.length;
  const avgWpm = Math.round(h.reduce((s, r) => s + r.wpm, 0) / totalRaces);
  const avgAccuracy = Math.round(h.reduce((s, r) => s + r.accuracy, 0) / totalRaces);
  const bestWpm = Math.max(...h.map((r) => r.wpm));
  return { totalRaces, avgWpm, avgAccuracy, bestWpm };
}
