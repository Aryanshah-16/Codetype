const COLORS = ["#00e5c3", "#f0b429", "#7c5cfc", "#e4573d", "#ffffff"];

export function burstConfetti(container, count = 70) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.animationDuration = `${1.6 + Math.random() * 1.3}s`;
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);

    setTimeout(() => piece.remove(), 3400);
  }
}
