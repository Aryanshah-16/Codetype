export class RaceTrack {
  /**
   * @param {HTMLElement} playerCar
   * @param {HTMLElement} ghostCar
   * @param {HTMLElement} trackEl - the track container, used to measure width
   * @param {number|null} ghostWpm - the pace the ghost should run at (null = no ghost)
   */
  constructor(playerCar, ghostCar, trackEl, ghostWpm) {
    this.playerCar = playerCar;
    this.ghostCar = ghostCar;
    this.trackEl = trackEl;
    this.ghostWpm = ghostWpm;
    this.ghostAnimationFrame = null;
    this.ghostStartTime = null;
    this.ghostDurationMs = null;
    this.lastPlayerX = 0;

    if (!ghostWpm) {
      this.ghostCar.style.display = "none";
    }

    // Particle container lives inside the track for absolute positioning
    this.particleContainer = document.createElement("div");
    this.particleContainer.className = "particle-container";
    this.trackEl.appendChild(this.particleContainer);
  }

  setPlayerProgress(fraction) {
    const x = this._setPosition(this.playerCar, fraction);
    if (Math.abs(x - this.lastPlayerX) > 4) {
      this._spawnParticle(x, false);
      this.lastPlayerX = x;
    }
  }

  /** Starts the ghost car moving at a constant pace toward the finish line. */
  startGhost(targetCharCount) {
    if (!this.ghostWpm) return;

    const estimatedMinutes = targetCharCount / 5 / this.ghostWpm;
    this.ghostDurationMs = estimatedMinutes * 60 * 1000;
    this.ghostStartTime = performance.now();

    let lastGhostX = 0;

    const step = (now) => {
      const elapsed = now - this.ghostStartTime;
      const fraction = Math.min(elapsed / this.ghostDurationMs, 1);
      const x = this._setPosition(this.ghostCar, fraction);

      if (Math.abs(x - lastGhostX) > 6 && fraction < 1) {
        this._spawnParticle(x, true);
        lastGhostX = x;
      }

      if (fraction < 1) {
        this.ghostAnimationFrame = requestAnimationFrame(step);
      }
    };

    this.ghostAnimationFrame = requestAnimationFrame(step);
  }

  stop() {
    if (this.ghostAnimationFrame) {
      cancelAnimationFrame(this.ghostAnimationFrame);
    }
  }

  reset() {
    this.stop();
    this._setPosition(this.playerCar, 0);
    this._setPosition(this.ghostCar, 0);
    this.lastPlayerX = 0;
    if (this.particleContainer) this.particleContainer.innerHTML = "";
  }

  _setPosition(carEl, fraction) {
    const trackWidth = this.trackEl.clientWidth - carEl.clientWidth;
    const x = fraction * trackWidth;
    carEl.style.transform = `translate(${x}px, -50%)`;
    return x;
  }

  _spawnParticle(x, isGhost) {
    if (!this.particleContainer) return;
    // Cap particle count to avoid DOM bloat
    if (this.particleContainer.childElementCount > 30) return;

    const p = document.createElement("div");
    p.className = "exhaust-particle" + (isGhost ? " exhaust-ghost" : "");
    p.style.left = x + "px";

    // Position vertically in the correct lane (each lane is ~44px)
    const trackH = this.trackEl.clientHeight;
    const laneH = trackH / 2;
    p.style.top = (isGhost ? laneH * 1.5 : laneH * 0.5) + "px";

    this.particleContainer.appendChild(p);

    // Clean up after animation completes (CSS animation is 0.45s)
    p.addEventListener("animationend", () => p.remove());
    setTimeout(() => {
      if (p.parentNode) p.remove();
    }, 550);
  }
}
