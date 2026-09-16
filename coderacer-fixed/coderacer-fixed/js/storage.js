const STORAGE_KEY = "coderacer_session";

function loadData() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestRuns: {}, history: [] };
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read session data:", err);
    return { bestRuns: {}, history: [] };
  }
}

function saveData(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to write session data:", err);
  }
}

export function getBestRun(snippetId) {
  return loadData().bestRuns[snippetId] || null;
}

/** Records a run, updates best-for-snippet if improved, returns whether it was a new best. */
export function recordRun(snippetId, run) {
  const data = loadData();
  const previousBest = data.bestRuns[snippetId];
  const isNewBest = !previousBest || run.wpm > previousBest.wpm;

  if (isNewBest) {
    data.bestRuns[snippetId] = run;
  }

  data.history.unshift({ snippetId, ...run, date: new Date().toISOString() });
  data.history = data.history.slice(0, 30);

  saveData(data);
  return isNewBest;
}

export function getHistory() {
  return loadData().history;
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}
