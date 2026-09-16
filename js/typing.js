/**
 * Flattens a Prism.tokenize() result into a flat array of
 * { ch, tokenType } — one entry per character, in original order,
 * so `chars.map(c => c.ch).join("")` reconstructs the source exactly.
 */
function flattenTokens(tokens) {
  const chars = [];

  const walkContent = (content, type) => {
    if (typeof content === "string") {
      for (const ch of content) chars.push({ ch, tokenType: type });
      return;
    }
    if (Array.isArray(content)) {
      for (const item of content) {
        if (typeof item === "string") {
          for (const ch of item) chars.push({ ch, tokenType: type });
        } else {
          walkContent(item.content, item.type);
        }
      }
    }
  };

  for (const token of tokens) {
    if (typeof token === "string") {
      for (const ch of token) chars.push({ ch, tokenType: null });
    } else {
      walkContent(token.content, token.type);
    }
  }

  return chars;
}

/** Tokenizes code for a given Prism language name; falls back to plain (untyped) chars if unavailable. */
function tokenizeToChars(code, languageName) {
  const grammar = window.Prism?.languages?.[languageName];
  if (!grammar || typeof window.Prism.tokenize !== "function") {
    return [...code].map((ch) => ({ ch, tokenType: null }));
  }

  try {
    const tokens = window.Prism.tokenize(code, grammar);
    const chars = flattenTokens(tokens);

    // Safety check: tokenizing must never add/remove/reorder characters.
    if (chars.map((c) => c.ch).join("") !== code) {
      console.warn("Prism tokenization mismatch — falling back to plain text.");
      return [...code].map((ch) => ({ ch, tokenType: null }));
    }
    return chars;
  } catch (err) {
    console.error("Prism tokenization failed:", err);
    return [...code].map((ch) => ({ ch, tokenType: null }));
  }
}

export class TypingEngine {
  /**
   * @param {string} targetText - the code snippet to type
   * @param {string} language - Prism language key (e.g. "python", "java", "javascript")
   * @param {HTMLElement} container - element to render character spans into
   * @param {object} callbacks - { onProgress(fraction), onKeystroke({correct}), onComplete(stats) }
   */
  constructor(targetText, language, container, callbacks = {}) {
    this.target = targetText;
    this.language = language;
    this.container = container;
    this.callbacks = callbacks;

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

    const charData = tokenizeToChars(this.target, this.language);

    for (const { ch, tokenType } of charData) {
      const span = document.createElement("span");
      span.dataset.base = "pending";
      span.dataset.tokenClasses = tokenType ? `token ${tokenType}` : "";
      span.textContent = ch === "\n" ? "\u21B5\n" : ch;
      this._applyClasses(span);
      this.container.appendChild(span);
      this.charSpans.push(span);
    }

    if (this.charSpans[0]) {
      this.charSpans[0].dataset.current = "1";
      this._applyClasses(this.charSpans[0]);
    }
  }

  _applyClasses(span) {
    const classes = ["char", span.dataset.base];
    if (span.dataset.current === "1") classes.push("current");
    if (span.dataset.tokenClasses) classes.push(span.dataset.tokenClasses);
    span.className = classes.join(" ");
  }

  /** Call with e.key from a keydown handler on the hidden capture input. */
  handleKey(key) {
    if (this.finished) return;

    if (key.length > 1 && key !== "Enter" && key !== "Tab" && key !== "Backspace") {
      return; // ignore modifier/arrow/etc keys
    }

    if (this.startTime === null) {
      this.startTime = performance.now();
    }

    if (key === "Backspace") {
      this._handleBackspace();
      return;
    }

    let inputChar = key;
    if (key === "Enter") inputChar = "\n";
    if (key === "Tab") inputChar = "\t";
    if (inputChar.length !== 1) return;

    const expectedChar = this.target[this.typedIndex];
    this.totalKeystrokes++;
    const isCorrect = inputChar === expectedChar;

    const span = this.charSpans[this.typedIndex];
    span.dataset.base = isCorrect ? "correct" : "incorrect";
    span.dataset.current = "0";
    this._applyClasses(span);

    if (isCorrect) this.correctKeystrokes++;
    this.callbacks.onKeystroke?.({ correct: isCorrect });

    this.typedIndex++;

    const nextSpan = this.charSpans[this.typedIndex];
    if (nextSpan) {
      nextSpan.dataset.current = "1";
      this._applyClasses(nextSpan);
    }

    this.callbacks.onProgress?.(this.typedIndex / this.target.length);

    if (this.typedIndex >= this.target.length) {
      this._finish();
    }
  }

  _handleBackspace() {
    if (this.typedIndex === 0) return;

    const current = this.charSpans[this.typedIndex];
    if (current) {
      current.dataset.current = "0";
      this._applyClasses(current);
    }

    this.typedIndex--;
    const span = this.charSpans[this.typedIndex];
    span.dataset.base = "pending";
    span.dataset.current = "1";
    this._applyClasses(span);
  }

  _finish() {
    this.finished = true;
    this.endTime = performance.now();

    this.callbacks.onComplete?.({
      elapsedMs: this.endTime - this.startTime,
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
