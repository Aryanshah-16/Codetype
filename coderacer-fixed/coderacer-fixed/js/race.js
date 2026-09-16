export class RaceTrack {
  /**
   * @param {HTMLElement} playerCar
   * @param {HTMLElement} ghostCar
   * @param {HTMLElement} trackEl
   * @param {number|null} ghostWpm - pace for the ghost, or null if no best time exists yet
   */
  constructor(playerCar, ghostCar, trackEl, ghostWpm) {
    this.playerCar = playerCar;
    this.ghostCar = ghostCar;
    this.trackEl = trackEl;
    this.ghostWpm = ghostWpm;

    this.ghostAnimationFrame = null;
    this.ghostStartTime = null;
    this.ghostDurationMs = null;
    this.lastParticleAt = 0;

    this.particleContainer = trackEl.querySelector(".particle-container") || this._createParticleContainer();

    this.ghostCar.style.display = ghostWpm ? "" : "none";
  }

  _createParticleContainer() {
    const el = document.createElement("div");
    el.className = "particle-container";
    this.trackEl.appendChild(el);
    return el;
  }

  setPlayerProgress(fraction) {
    this._setPosition(this.playerCar, fraction);
    this._maybeSpawnParticle(this.playerCar, "");
  }

  /** Starts the ghost car moving at a constant pace, timed to finish when it would at ghostWpm. */
  startGhost(targetCharCount) {
    if (!this.ghostWpm) return;

    const estimatedMinutes = targetCharCount / 5 / this.ghostWpm;
    this.ghostDurationMs = Math.max(estimatedMinutes * 60 * 1000, 300);
    this.ghostStartTime = performance.now();

    const step = (now) => {
      const elapsed = now - this.ghostStartTime;
      const fraction = Math.min(elapsed / this.ghostDurationMs, 1);
      this._setPosition(this.ghostCar, fraction);
      this._maybeSpawnParticle(this.ghostCar, "exhaust-ghost");

      if (fraction < 1) {
        this.ghostAnimationFrame = requestAnimationFrame(step);
      }
    };

    this.ghostAnimationFrame = requestAnimationFrame(step);
  }

  stop() {
    if (this.ghostAnimationFrame) {
      cancelAnimationFrame(this.ghostAnimationFrame);
      this.ghostAnimationFrame = null;
    }
  }

  reset() {
    this.stop();
    this._setPosition(this.playerCar, 0);
    this._setPosition(this.ghostCar, 0);
    this.particleContainer.innerHTML = "";
  }

  _setPosition(carEl, fraction) {
    const trackWidth = this.trackEl.clientWidth - carEl.clientWidth - 12;
    carEl.style.transform = `translate(${Math.max(fraction * trackWidth, 0)}px, -50%)`;
  }

  _maybeSpawnParticle(carEl, extraClass) {
    const now = performance.now();
    if (now - this.lastParticleAt < 70) return; // throttle
    this.lastParticleAt = now;

    const trackRect = this.trackEl.getBoundingClientRect();
    const carRect = carEl.getBoundingClientRect();

    const particle = document.createElement("span");
    particle.className = `exhaust-particle ${extraClass}`.trim();
    particle.style.left = `${carRect.left - trackRect.left}px`;
    particle.style.top = `${carRect.top - trackRect.top + carRect.height / 2}px`;

    this.particleContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}
