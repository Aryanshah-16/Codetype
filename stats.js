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
  const totalSeconds = ms / 1000;
  return `${totalSeconds.toFixed(2)}s`;
}
