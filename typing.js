/* ---- Prism.js tokenizer helpers ---- */

function flattenTokens(tokens) {
  const out = [];
  for (const t of tokens) {
    if (typeof t === "string") {
      out.push({ type: "", text: t });
    } else if (Array.isArray(t.content)) {
      const flat = flattenTokens(t.content);
      for (const f of flat) out.push({ type: f.type || t.type, text: f.text });
    } else if (typeof t.content === "string") {
      out.push({ type: t.type, text: t.content });
    }
  }
  return out;
}

function getTokenMap(code, language) {
  const Prism = window.Prism;
  if (!Prism || !Prism.languages) return code.split("").map(() => "");

  const lang = language === "python" ? "python" : "javascript";
  const grammar = Prism.languages[lang];
  if (!grammar) return code.split("").map(() => "");

  const tokens = Prism.tokenize(code, grammar);
  const flat = flattenTokens(tokens);

  const map = [];
  for (const f of flat) {
    for (let i = 0; i < f.text.length; i++) map.push(f.type);
  }
  return map;
}

export class TypingEngine {
  /**
   * @param {string} targetText - the code snippet to type
   * @param {HTMLElement} container - element to render spans into
   * @param {object} callbacks - { onProgress(fraction), onKeystroke({correct}), onComplete(stats) }
   * @param {string} [language] - "javascript" or "python" for syntax highlighting
   */
  constructor(targetText, container, callbacks = {}, language = "javascript") {
    this.target = targetText;
    this.container = container;
    this.callbacks = callbacks;
    this.language = language;
    this.tokenMap = getTokenMap(targetText, language);

    this.typedIndex = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.startTime = null;
    this.endTime = null;
    this.finished = false;

    this._render();
  }

  _render() {
    this.container.innerHTML = "";
    this.charSpans = [];

    for (let i = 0; i < this.target.length; i++) {
      const ch = this.target[i];
      const span = document.createElement("span");
      span.className = "char pending";

      // Layer syntax-highlighting token class underneath the state class
      const tok = this.tokenMap[i];
      if (tok) span.classList.add("token", tok);

      span.textContent = ch === "\n" ? "\u21B5\n" : ch;
      this.container.appendChild(span);
      this.charSpans.push(span);
    }

    if (this.charSpans[0]) {
      this.charSpans[0].classList.add("current");
    }
  }

  /** Apply state classes while preserving token classes on a span. */
  _setState(index, state) {
    const span = this.charSpans[index];
    const tok = this.tokenMap[index];
    span.className = state;
    if (tok) span.classList.add("token", tok);
  }

  /** Call this on every keydown from the hidden input capturing focus. */
  handleKey(key) {
    if (this.finished) return;

    // Ignore modifier-only presses
    if (key.length > 1 && key !== "Enter" && key !== "Tab" && key !== "Backspace") {
      return;
    }

    if (this.startTime === null) {
      this.startTime = performance.now();
    }

    if (key === "Backspace") {
      this._handleBackspace();
      return;
    }

    const expectedChar = this.target[this.typedIndex];
    let inputChar = key;
    if (key === "Enter") inputChar = "\n";
    if (key === "Tab") inputChar = "\t";

    // Skip stray modifier keys we don't care about
    if (inputChar.length !== 1) return;

    this.totalKeystrokes++;
    const isCorrect = inputChar === expectedChar;

    if (isCorrect) {
      this.correctKeystrokes++;
      this._setState(this.typedIndex, "char correct");
    } else {
      this._setState(this.typedIndex, "char incorrect");
    }

    this.callbacks.onKeystroke?.({ correct: isCorrect });

    this.typedIndex++;

    if (this.charSpans[this.typedIndex]) {
      this.charSpans[this.typedIndex].classList.add("current");
    }

    this.callbacks.onProgress?.(this.typedIndex / this.target.length);

    if (this.typedIndex >= this.target.length) {
      this._finish();
    }
  }

  _handleBackspace() {
    // Flow mode: backspace lets you fix the previous character
    if (this.typedIndex === 0) return;

    if (this.charSpans[this.typedIndex]) {
      this.charSpans[this.typedIndex].classList.remove("current");
    }

    this.typedIndex--;
    this._setState(this.typedIndex, "char pending current");
  }

  _finish() {
    this.finished = true;
    this.endTime = performance.now();

    const elapsedMs = this.endTime - this.startTime;
    this.callbacks.onComplete?.({
      elapsedMs,
      correctKeystrokes: this.correctKeystrokes,
      totalKeystrokes: this.totalKeystrokes,
      totalChars: this.target.length,
    });
  }

  getElapsedMs() {
    if (this.startTime === null) return 0;
    const end = this.endTime ?? performance.now();
    return end - this.startTime;
  }
}
