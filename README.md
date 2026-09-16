# CodeRacer — fixed & completed

## What was actually broken

Your `index.html` and `style.css` were a complete, well-built visual design —
but the project had **no JavaScript at all**. `index.html` loads
`<script type="module" src="js/main.js">`, and that file (plus five others it
depends on) simply didn't exist. On GitHub Pages that's a silent 404 in the
console; the page renders but nothing is interactive.

Two smaller issues on top of that:
- `typing-prompts.txt` is plain text — the app needs `data/snippets.json`.
- The CSS has Prism token styles for Java, but only Prism's core + Python
  component were loaded. Java needs `prism-clike` too (Java's grammar
  depends on it).

## What's in this folder

```
coderacer-fixed/
├── index.html              # your file, + Prism deps + a JS language button
├── style.css                # your file, unchanged except one flex-wrap fix
├── typing-prompts.txt        # your file, unchanged (source of truth)
├── data/
│   └── snippets.json          # generated from typing-prompts.txt (60 snippets)
├── tools/
│   └── convert_prompts.py      # regenerate snippets.json after editing the .txt
└── js/
    ├── main.js                  # bootstraps everything, wires up all buttons
    ├── typing.js                 # Prism-tokenizing typing engine
    ├── race.js                    # player/ghost car movement + exhaust particles
    ├── stats.js                    # WPM / accuracy / time formatting
    ├── storage.js                   # sessionStorage (matches your "resets when
    │                                  session ends" copy on the history screen)
    ├── sound.js                      # synthesized beeps via Web Audio — no
    │                                  sound files needed
    ├── confetti.js                    # new-best confetti burst
    └── ui.js                           # screen switching, history/results rendering
```

## Two small additions beyond "just fix it"

1. **A JavaScript button in the language picker.** Your `typing-prompts.txt`
   has 20 JS snippets, but the modal only offered Python and Java. Since the
   data was already there, I added the button (`btn-lang-javascript`) rather
   than let 20 snippets go unused. Delete the button in `index.html` if you'd
   rather keep it to two languages.
2. **`window.Prism = { manual: true }`** before the Prism scripts load. Prism
   normally auto-scans the page for `<code class="language-xxx">` blocks on
   `DOMContentLoaded`. Your `#code-display` element doesn't have that class,
   so it likely wouldn't have interfered — but setting `manual: true` makes
   that safe by design instead of by coincidence, since `typing.js` calls
   `Prism.tokenize()` directly and renders the result itself.

## How the typing/highlighting works together

Prism tokenizes the snippet into typed chunks (keyword, string, function,
etc.). `typing.js` flattens that into one entry per character, then renders
each character as its own `<span>` carrying **both** a token class (for
color) and a typing-state class (pending/correct/incorrect/current) — which
is exactly what your CSS's `.char.correct.token.keyword`-style selectors
expect.

## Running locally

Fetching `data/snippets.json` requires an actual HTTP server (the browser
blocks `fetch` over `file://`):

```bash
cd coderacer-fixed
python3 -m http.server 8000
```
Then open `http://localhost:8000`. Or use the VS Code "Live Server" extension
on `index.html`.

## Updating snippets

Edit `typing-prompts.txt`, then run:
```bash
python3 tools/convert_prompts.py
```
It validates for duplicate IDs and empty snippets before writing
`data/snippets.json`, and prints a per-language count so you can confirm it
parsed correctly.

## Deploying to GitHub Pages

1. Push this whole folder's contents to the root of your repo (or a `docs/`
   folder, matching whatever you set as the Pages source).
2. Settings → Pages → set source to your branch/folder.
3. No build step — it's live as soon as GitHub finishes publishing.

If it still doesn't work after deploying, open the browser console (F12) on
the live page — a 404 there almost always means a file path is off by a
folder or the repo's Pages source setting doesn't match where you put the
files.
