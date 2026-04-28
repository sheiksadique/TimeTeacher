# TimeTeacher

A small web quiz to practice reading an **analog clock** at **whole hours** and **half hours**. Spoken prompts use the browser’s **text-to-speech** so young children can play without reading full sentences (numbers still appear as a bridge).

It supports **two quiz types** (mixed randomly):
- **Normal**: see a clock → pick the correct time.
- **Reverse**: hear a time → pick the correct clock face (with an optional **Hint** button to show the digital time).

## Screenshots

Add one screenshot for each mode:

- `screenshots/normal.png`
- `screenshots/reverse.png`

Then (optionally) uncomment these lines to show them on GitHub:

<!--
![Normal question](screenshots/normal.png)
![Reverse question](screenshots/reverse.png)
-->

## How to run

Open the folder in a browser:

- **From disk:** double-click `index.html`, or drag it into Chrome / Safari / Firefox.
- **Local server (recommended):** `python3 -m http.server 8080` in this directory, then open `http://localhost:8080`.

## Using it with a child

1. Tap **Start** once (needed so audio can play, especially on **iPad/iPhone Safari**).
2. A clock appears at a random hour or half hour.
3. The app asks aloud what to do.
4. **Normal rounds**: tap the matching **time**.
5. **Reverse rounds**: tap the matching **clock face** (use **Hint** if needed).
6. **Say it again** repeats the question.

Wrong answers keep the same clock and re-enable the choices so the child can try another option.

## Voices

Speech uses your system / browser voices. English is preferred when available. If the voice sounds wrong on macOS or Windows, change the default voice in system accessibility or speech settings.

## Files

- `index.html` — layout, clock SVG shell, start overlay  
- `styles.css` — layout and touch-friendly buttons  
- `app.js` — clock geometry, quiz, `speechSynthesis`  

No build step or dependencies.
