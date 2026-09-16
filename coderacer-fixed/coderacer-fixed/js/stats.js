// Standard typing-test WPM formula: (correct chars / 5) / minutes elapsed
export function calculateWPM(correctChars, elapsedMs) {
  const minutes = elapsedMs / 1000 / 60;
  if (minutes <= 0) return 0;
  return Math.round(correctChars / 5 / minutes);
}

export function calculateAccuracy(correctKeystrokes, totalKeystrokes) {
  if (totalKeystrokes === 0) return 100;
  return Math.round((correctKeystrokes / totalKeystrokes) * 100);
}

export function formatTime(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatRelativeDate(isoString) {
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}
