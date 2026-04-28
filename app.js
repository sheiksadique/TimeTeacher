/**
 * TimeTeacher — hours & half-hours quiz with speech + SVG clock
 */
(function () {
  "use strict";

  const CX = 100;
  const CY = 100;
  const R = 92;
  // Move numbers slightly inward to leave more space from tick marks
  const R_NUM = 66;

  /** @type {"en" | "de"} */
  let currentLang = "en";

  const NUMBER_WORDS_EN = [
    "twelve",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
  ];

  const NUMBER_WORDS_DE = [
    "zwölf",
    "eins",
    "zwei",
    "drei",
    "vier",
    "fünf",
    "sechs",
    "sieben",
    "acht",
    "neun",
    "zehn",
    "elf",
    "zwölf",
  ];

  /** @typedef {{ hour: number, minute: number }} ClockTime */

  /** @returns {ClockTime[]} */
  function allTimes() {
    const out = [];
    for (let h = 1; h <= 12; h++) {
      out.push({ hour: h, minute: 0 }, { hour: h, minute: 30 });
    }
    return out;
  }

  const TIME_POOL = allTimes();

  /** @param {ClockTime} t */
  function timeKey(t) {
    return `${t.hour}:${t.minute}`;
  }

  /** @param {ClockTime} t */
  function phraseForTime(t) {
    if (currentLang === "de") {
      if (t.minute === 0) {
        // In German: "ein Uhr", "zwei Uhr", ...
        const word = t.hour === 1 ? "ein" : NUMBER_WORDS_DE[t.hour];
        return `${word} Uhr`;
      }
      // German half-hours are commonly relative to the next hour: 1:30 => "halb zwei"
      const next = t.hour === 12 ? 1 : t.hour + 1;
      return `halb ${NUMBER_WORDS_DE[next]}`;
    }

    if (t.minute === 0) return `${NUMBER_WORDS_EN[t.hour]} o'clock`;
    return `half past ${NUMBER_WORDS_EN[t.hour]}`;
  }

  /** @param {ClockTime} t */
  function displayShort(t) {
    const h = t.hour;
    const m = t.minute === 0 ? "00" : "30";
    return `${h}:${m}`;
  }

  /** @param {ClockTime} t */
  function ariaForTime(t) {
    if (currentLang === "de") {
      if (t.minute === 0) return `${t.hour} Uhr`;
      const next = t.hour === 12 ? 1 : t.hour + 1;
      return `halb ${next}`;
    }
    return t.minute === 0 ? `${t.hour} o'clock` : `half past ${t.hour}`;
  }

  // ——— Speech ———

  let speakSeq = 0;

  function desiredVoiceLang() {
    return currentLang === "de" ? "de-DE" : "en-US";
  }

  function getPreferredVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    const want = desiredVoiceLang();
    let v =
      voices.find(
        (x) => x.lang === want && /female|samantha|victoria|karen|moira/i.test(x.name || "")
      ) ||
      voices.find((x) => x.lang === want) ||
      voices.find(
        (x) =>
          x.lang &&
          x.lang.toLowerCase().startsWith(want.slice(0, 2).toLowerCase())
      );
    return v || voices[0];
  }

  /**
   * Speak text; cancels pending utterances. Optional onend after this utterance.
   * @param {string} text
   * @param {{ rate?: number, onend?: () => void }} [opts]
   */
  function speak(text, opts) {
    const myId = ++speakSeq;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts && opts.rate != null ? opts.rate : 0.92;
    u.pitch = 1;
    const v = getPreferredVoice();
    if (v) u.voice = v;
    u.onend = () => {
      if (myId === speakSeq && opts && opts.onend) opts.onend();
    };
    speechSynthesis.speak(u);
  }

  function speakLater(text, ms, opts) {
    setTimeout(() => speak(text, opts), ms);
  }

  // ——— Clock SVG ———

  function buildTicks() {
    const g = document.getElementById("clock-ticks");
    if (!g) return;
    g.replaceChildren();
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const len = major ? 12 : 6;
      const w = major ? 3 : 1.5;
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const inner = R - len - 2;
      const outer = R - 2;
      const x1 = CX + inner * Math.cos(angle);
      const y1 = CY + inner * Math.sin(angle);
      const x2 = CX + outer * Math.cos(angle);
      const y2 = CY + outer * Math.sin(angle);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", major ? "var(--tick-major)" : "var(--tick-minor)");
      line.setAttribute("stroke-width", String(w));
      line.setAttribute("stroke-linecap", "round");
      g.appendChild(line);
    }
  }

  function buildHourNumbers() {
    const g = document.getElementById("clock-numbers");
    if (!g) return;
    g.replaceChildren();
    for (let h = 1; h <= 12; h++) {
      const angle = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2;
      const x = CX + R_NUM * Math.cos(angle);
      const y = CY + R_NUM * Math.sin(angle);
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(y));
      text.textContent = String(h);
      g.appendChild(text);
    }
  }

  /**
   * Create a hand as a line + small triangle tip (polygon).
   * This avoids SVG marker rendering quirks on some browsers (notably Safari).
   * @param {SVGGElement} group
   * @param {number} strokeWidth
   * @param {string} stroke
   * @returns {{ line: SVGLineElement, tip: SVGPolygonElement }}
   */
  function createHand(group, strokeWidth, stroke) {
    group.replaceChildren();
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(CX));
    line.setAttribute("y1", String(CY));
    line.setAttribute("x2", String(CX));
    line.setAttribute("y2", String(CY));
    line.setAttribute("stroke", stroke);
    line.setAttribute("stroke-width", String(strokeWidth));
    line.setAttribute("stroke-linecap", "round");
    group.appendChild(line);

    const tip = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    tip.setAttribute("fill", stroke);
    tip.setAttribute("points", `${CX},${CY} ${CX},${CY} ${CX},${CY}`);
    group.appendChild(tip);

    return { line, tip };
  }

  /**
   * @param {ClockTime} t
   */
  function drawHands(t) {
    const hourG = document.getElementById("hand-hour");
    const minuteG = document.getElementById("hand-minute");
    if (!hourG || !minuteG) return;

    const minute = createHand(minuteG, 5, "#1f6feb");
    const hour = createHand(hourG, 8, "#d1242f");

    // Total length (center -> arrow tip)
    const minuteTotalLen = 68;
    const hourTotalLen = 46;

    const minuteAngle = ((t.minute * 6 - 90) * Math.PI) / 180;
    const hourAngle = (((t.hour % 12) * 30 + t.minute * 0.5 - 90) * Math.PI) / 180;

    // Triangle tips at the end of each hand.
    // Arrow size is 50% larger; the shaft is shortened by the same arrow length
    // so the overall hand (shaft + arrow) stays readable.
    function tipMetrics(strokeW) {
      const scale = 1.5; // requested 50% larger
      const tipLen = (10 + strokeW * 0.3) * scale;
      const tipWide = (7 + strokeW * 0.25) * scale;
      return { tipLen, tipWide };
    }

    function pointAtLen(totalLen, angleRad) {
      return {
        x: CX + totalLen * Math.cos(angleRad),
        y: CY + totalLen * Math.sin(angleRad),
      };
    }

    function setTip(tipEl, apexX, apexY, angleRad, tipLen, tipWide) {
      const bx = apexX - tipLen * Math.cos(angleRad);
      const by = apexY - tipLen * Math.sin(angleRad);
      const px = Math.cos(angleRad + Math.PI / 2);
      const py = Math.sin(angleRad + Math.PI / 2);
      const x1 = bx + (tipWide / 2) * px;
      const y1 = by + (tipWide / 2) * py;
      const x2 = bx - (tipWide / 2) * px;
      const y2 = by - (tipWide / 2) * py;
      tipEl.setAttribute("points", `${apexX},${apexY} ${x1},${y1} ${x2},${y2}`);
    }

    const mTip = tipMetrics(5);
    const hTip = tipMetrics(8);

    const minuteApex = pointAtLen(minuteTotalLen, minuteAngle);
    const hourApex = pointAtLen(hourTotalLen, hourAngle);

    const minuteShaftEnd = pointAtLen(Math.max(10, minuteTotalLen - mTip.tipLen), minuteAngle);
    const hourShaftEnd = pointAtLen(Math.max(10, hourTotalLen - hTip.tipLen), hourAngle);

    minute.line.setAttribute("x2", String(minuteShaftEnd.x));
    minute.line.setAttribute("y2", String(minuteShaftEnd.y));
    hour.line.setAttribute("x2", String(hourShaftEnd.x));
    hour.line.setAttribute("y2", String(hourShaftEnd.y));

    setTip(minute.tip, minuteApex.x, minuteApex.y, minuteAngle, mTip.tipLen, mTip.tipWide);
    setTip(hour.tip, hourApex.x, hourApex.y, hourAngle, hTip.tipLen, hTip.tipWide);
  }

  // ——— Quiz ———

  /** @type {ClockTime | null} */
  let currentTarget = null;

  /** @type {"normal" | "reverse"} */
  let currentRoundType = "normal";

  /** @type {ClockTime[]} */
  let currentOptions = [];

  let interactionLocked = false;

  let hintShown = false;

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickDistractors(target) {
    const key = timeKey(target);
    const others = TIME_POOL.filter((t) => timeKey(t) !== key);
    const shuffled = shuffle(others);
    return shuffled.slice(0, 3);
  }

  function newRound() {
    setLive("");
    hintShown = false;
    currentTarget = TIME_POOL[Math.floor(Math.random() * TIME_POOL.length)];
    currentRoundType = Math.random() < 0.5 ? "reverse" : "normal";
    const wrong = pickDistractors(currentTarget);
    currentOptions = shuffle([currentTarget, ...wrong]);
    renderClock();
    renderChoices();
    interactionLocked = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        speakQuestion();
        interactionLocked = false;
      });
    });
  }

  function speakQuestion() {
    if (!currentTarget) return;
    if (currentRoundType === "reverse") {
      const ui = tUi();
      const phrase = phraseForTime(currentTarget);
      speak(`${ui.reversePrompt} ${phrase}`, { onend: () => {} });
      return;
    }

    speak(currentLang === "de" ? "Wie spät ist es?" : "What time does the clock show?", { onend: () => {} });
  }

  function setLive(text) {
    const el = document.getElementById("live-region");
    if (el) el.textContent = text;
  }

  function tUi() {
    return currentLang === "de"
      ? {
          title: "Wie spät ist es?",
          hint: "Hör zu und tippe die richtige Antwort.",
          repeat: "Nochmal sagen",
          repeatAria: "Frage nochmal sagen",
          hintBtn: "Tipp",
          hintAria: "Tipp anzeigen",
          reversePrompt: "Finde die Uhr für",
          listenAria: (p) => `Anhören: ${p}`,
          chooseAria: (p) => `Wähle ${p}`,
          chooseClockAria: (p) => `Wähle die Uhr: ${p}`,
          correctLive: "Richtig!",
          tryAgainLive: "Nochmal versuchen.",
          notQuite: "Nicht ganz. Versuch eine andere Antwort.",
          ready: "Bereit für die nächste?",
          start: "Start",
          startHint: "Tippe Start — dann hörst du die Fragen (Audio braucht oft einen Tipp).",
          look: "Schau auf die Uhr!",
          praises: ["Ja! Genau!", "Super!", "Toll gemacht!", "Richtig!"],
        }
      : {
          title: "What time is it?",
          hint: "Listen, then tap the right answer.",
          repeat: "Say it again",
          repeatAria: "Say the question again",
          hintBtn: "Hint",
          hintAria: "Show a hint",
          reversePrompt: "Find the clock for",
          listenAria: (p) => `Listen: ${p}`,
          chooseAria: (p) => `Choose ${p}`,
          chooseClockAria: (p) => `Choose the clock: ${p}`,
          correctLive: "Correct!",
          tryAgainLive: "Try again.",
          notQuite: "Not quite. Try another answer.",
          ready: "Ready for another one?",
          start: "Start",
          startHint: "Tap Start — then you will hear the questions (works best after a tap).",
          look: "Let's look at the clock!",
          praises: ["Yes! That's right!", "Great job!", "You got it!", "Super!"],
        };
  }

  function refreshUiText() {
    const ui = tUi();
    const titleEl = document.querySelector(".app__title");
    const hintEl = document.getElementById("choices-hint");
    const repeatBtn = document.getElementById("btn-repeat");
    const hintBtn = document.getElementById("btn-hint");
    const startHint = document.querySelector(".start-hint");
    const startBtn = document.getElementById("btn-start");

    if (titleEl) titleEl.textContent = ui.title;
    if (hintEl) hintEl.textContent = ui.hint;
    if (repeatBtn) {
      repeatBtn.textContent = ui.repeat;
      repeatBtn.setAttribute("aria-label", ui.repeatAria);
    }
    if (hintBtn) {
      hintBtn.textContent = ui.hintBtn;
      hintBtn.setAttribute("aria-label", ui.hintAria);
    }
    if (startHint) startHint.textContent = ui.startHint;
    if (startBtn) startBtn.textContent = ui.start;

    const langLabel = document.querySelector(".lang__label");
    if (langLabel) langLabel.textContent = currentLang === "de" ? "Sprache" : "Language";
  }

  function refreshHintUi() {
    const hintBtn = document.getElementById("btn-hint");
    const hintText = document.getElementById("hint-text");
    if (!hintBtn || !hintText) return;

    const showHintControls = currentRoundType === "reverse" && !!currentTarget;
    if (!showHintControls) {
      hintBtn.setAttribute("hidden", "");
      hintText.setAttribute("hidden", "");
      hintText.textContent = "";
      return;
    }

    hintBtn.removeAttribute("hidden");
    if (hintShown) {
      hintText.removeAttribute("hidden");
      hintText.textContent = displayShort(currentTarget);
    } else {
      hintText.setAttribute("hidden", "");
      hintText.textContent = "";
    }
  }

  function renderClock() {
    const wrap = document.querySelector(".clock-wrap");
    if (!currentTarget) return;
    if (currentRoundType === "reverse") {
      wrap?.setAttribute("hidden", "");
      refreshHintUi();
      return;
    }
    wrap?.removeAttribute("hidden");
    drawHands(currentTarget);
    refreshHintUi();
  }

  function renderChoices() {
    const root = document.getElementById("choices-root");
    if (!root || !currentTarget) return;
    root.replaceChildren();
    root.classList.toggle("choices__grid--clocks", currentRoundType === "reverse");

    if (currentRoundType === "reverse") {
      currentOptions.forEach((t) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--clockpick";
        btn.setAttribute("aria-label", tUi().chooseClockAria(ariaForTime(t)));

        const svg = makeMiniClockSvg(t);
        btn.appendChild(svg);

        btn.addEventListener("click", () => {
          if (interactionLocked) return;
          onPick(t, btn);
        });

        root.appendChild(btn);
      });
      return;
    }

    currentOptions.forEach((t) => {
      const row = document.createElement("div");
      row.className = "choice-row";

      const listenBtn = document.createElement("button");
      listenBtn.type = "button";
      listenBtn.className = "btn btn--listen";
      listenBtn.setAttribute("aria-label", tUi().listenAria(phraseForTime(t)));
      listenBtn.textContent = "\u{1F50A}";
      listenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (interactionLocked) return;
        speak(phraseForTime(t), { rate: 0.88 });
      });

      const pickBtn = document.createElement("button");
      pickBtn.type = "button";
      pickBtn.className = "btn btn--pick";
      pickBtn.setAttribute("aria-label", tUi().chooseAria(ariaForTime(t)));
      pickBtn.innerHTML = `<span class="btn-pick__phrase">${phraseForTime(t)}</span> <span class="btn-pick__time" style="opacity:0.75;font-weight:600">(${displayShort(t)})</span>`;

      pickBtn.addEventListener("click", () => {
        if (interactionLocked) return;
        onPick(t, pickBtn);
      });

      row.appendChild(listenBtn);
      row.appendChild(pickBtn);
      root.appendChild(row);
    });
  }

  /**
   * Small clock used as a choice in reverse mode.
   * @param {ClockTime} t
   */
  function makeMiniClockSvg(t) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.setAttribute("width", "120");
    svg.setAttribute("height", "120");
    svg.setAttribute("class", "mini-clock");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const face = document.createElementNS(NS, "circle");
    face.setAttribute("cx", "100");
    face.setAttribute("cy", "100");
    face.setAttribute("r", "92");
    face.setAttribute("class", "mini-clock__face");
    svg.appendChild(face);

    const ticks = document.createElementNS(NS, "g");
    ticks.setAttribute("class", "mini-clock__ticks");
    svg.appendChild(ticks);

    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const len = major ? 12 : 6;
      const w = major ? 3 : 1.5;
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const inner = R - len - 2;
      const outer = R - 2;
      const x1 = CX + inner * Math.cos(angle);
      const y1 = CY + inner * Math.sin(angle);
      const x2 = CX + outer * Math.cos(angle);
      const y2 = CY + outer * Math.sin(angle);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
      line.setAttribute("stroke", major ? "var(--tick-major)" : "var(--tick-minor)");
      line.setAttribute("stroke-width", String(w));
      line.setAttribute("stroke-linecap", "round");
      ticks.appendChild(line);
    }

    const numbers = document.createElementNS(NS, "g");
    numbers.setAttribute("class", "mini-clock__numbers");
    svg.appendChild(numbers);
    for (let h = 1; h <= 12; h++) {
      const angle = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2;
      const x = CX + R_NUM * Math.cos(angle);
      const y = CY + R_NUM * Math.sin(angle);
      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(y));
      text.textContent = String(h);
      numbers.appendChild(text);
    }

    const minuteAngle = ((t.minute * 6 - 90) * Math.PI) / 180;
    const hourAngle = (((t.hour % 12) * 30 + t.minute * 0.5 - 90) * Math.PI) / 180;

    const minute = document.createElementNS(NS, "line");
    minute.setAttribute("x1", String(CX));
    minute.setAttribute("y1", String(CY));
    minute.setAttribute("x2", String(CX + 68 * Math.cos(minuteAngle)));
    minute.setAttribute("y2", String(CY + 68 * Math.sin(minuteAngle)));
    minute.setAttribute("stroke", "#1f6feb");
    minute.setAttribute("stroke-width", "5");
    minute.setAttribute("stroke-linecap", "round");
    svg.appendChild(minute);

    const hour = document.createElementNS(NS, "line");
    hour.setAttribute("x1", String(CX));
    hour.setAttribute("y1", String(CY));
    hour.setAttribute("x2", String(CX + 46 * Math.cos(hourAngle)));
    hour.setAttribute("y2", String(CY + 46 * Math.sin(hourAngle)));
    hour.setAttribute("stroke", "#d1242f");
    hour.setAttribute("stroke-width", "8");
    hour.setAttribute("stroke-linecap", "round");
    svg.appendChild(hour);

    const cap = document.createElementNS(NS, "circle");
    cap.setAttribute("cx", "100");
    cap.setAttribute("cy", "100");
    cap.setAttribute("r", "4");
    cap.setAttribute("fill", "var(--clock-border)");
    svg.appendChild(cap);

    return svg;
  }

  /**
   * @param {ClockTime} picked
   * @param {HTMLButtonElement} btn
   */
  function onPick(picked, btn) {
    if (!currentTarget) return;
    interactionLocked = true;
    const all = document.querySelectorAll(
      "#choices-root .btn--pick, #choices-root .btn--listen, #choices-root .btn--clockpick"
    );
    all.forEach((b) => {
      b.disabled = true;
    });

    speak(phraseForTime(picked), {
      rate: 0.88,
      onend: () => {
        const correct = timeKey(picked) === timeKey(currentTarget);
        if (correct) {
          const ui = tUi();
          setLive(ui.correctLive);
          speak(ui.praises[Math.floor(Math.random() * ui.praises.length)], {
            onend: () => {
              speakLater(ui.ready, 120, {
                onend: () => {
                  newRoundAfterDelay();
                },
              });
            },
          });
        } else {
          const ui = tUi();
          setLive(ui.tryAgainLive);
          speak(ui.notQuite, {
            onend: () => {
              interactionLocked = false;
              all.forEach((b) => {
                b.disabled = false;
              });
              btn.focus();
            },
          });
        }
      },
    });
  }

  function newRoundAfterDelay() {
    interactionLocked = false;
    newRound();
  }

  function initSpeechVoices() {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener("voiceschanged", () => {
      speechSynthesis.getVoices();
    });
  }

  // ——— Start / DOM ———

  function init() {
    buildTicks();
    buildHourNumbers();

    const overlay = document.getElementById("start-overlay");
    const app = document.getElementById("app");
    const btnStart = document.getElementById("btn-start");
    const btnRepeat = document.getElementById("btn-repeat");
    const btnHint = document.getElementById("btn-hint");
    const langSelect = document.getElementById("lang");

    initSpeechVoices();

    // Default language: auto-detect German, else English.
    const navLang = (navigator.language || "").toLowerCase();
    currentLang = navLang.startsWith("de") ? "de" : "en";
    document.documentElement.lang = currentLang;
    if (langSelect && "value" in langSelect) langSelect.value = currentLang;
    refreshUiText();

    langSelect?.addEventListener("change", () => {
      currentLang = langSelect.value === "de" ? "de" : "en";
      document.documentElement.lang = currentLang;
      refreshUiText();
      renderChoices();
      refreshHintUi();
      speakQuestion();
    });

    btnStart?.addEventListener("click", () => {
      overlay?.setAttribute("hidden", "");
      app?.removeAttribute("hidden");
      document.getElementById("btn-repeat")?.focus();
      speak(tUi().look, {
        onend: () => newRound(),
      });
    });

    btnRepeat?.addEventListener("click", () => {
      if (interactionLocked) return;
      speakQuestion();
    });

    btnHint?.addEventListener("click", () => {
      if (interactionLocked) return;
      if (currentRoundType !== "reverse" || !currentTarget) return;
      hintShown = !hintShown;
      refreshHintUi();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
