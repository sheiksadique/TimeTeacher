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

  /** @type {"time" | "numbers" | "letters"} */
  let currentMode = "time";

  // ——— Numbers (11–99) ———

  const NUMBER_POOL = Array.from({ length: 99 - 11 + 1 }, (_, i) => i + 11);

  // ——— Letters (A–Z + German extras; capitals + small) ———

  const LETTERS_BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const LETTERS_DE_EXTRAS = ["Ä", "Ö", "Ü", "ẞ", "ß"];

  function letterPoolForLang() {
    const base = [...LETTERS_BASE, ...LETTERS_BASE.map((x) => x.toLowerCase())];
    if (currentLang !== "de") return base;
    const extras = [...LETTERS_DE_EXTRAS, ...LETTERS_DE_EXTRAS.map((x) => x.toLowerCase())];
    return [...base, ...extras].filter((x, i, a) => a.indexOf(x) === i);
  }

  /** @param {string} ch */
  function isUpper(ch) {
    return ch === ch.toUpperCase() && ch !== ch.toLowerCase();
  }

  /** @param {string} ch */
  function isLower(ch) {
    return ch === ch.toLowerCase() && ch !== ch.toUpperCase();
  }

  /** @param {string} ch */
  function swapCase(ch) {
    if (ch === "ß") return "ẞ";
    if (ch === "ẞ") return "ß";
    if (isUpper(ch)) return ch.toLowerCase();
    if (isLower(ch)) return ch.toUpperCase();
    return ch;
  }

  /** @param {string} ch */
  function letterBaseNameEn(ch) {
    const up = ch.toUpperCase();
    if (up === "Ä") return "A umlaut";
    if (up === "Ö") return "O umlaut";
    if (up === "Ü") return "U umlaut";
    if (up === "ẞ") return "sharp s";
    if (up === "SS") return "S S";
    return up;
  }

  /** @param {string} ch */
  function letterBaseNameDe(ch) {
    const up = ch.toUpperCase();
    if (up === "Ä") return "Ä";
    if (up === "Ö") return "Ö";
    if (up === "Ü") return "Ü";
    if (up === "ẞ") return "Eszett";
    return up;
  }

  /**
   * Returns a speech phrase that includes case ("capital"/"small") when it helps.
   * @param {string} ch
   */
  function letterToSpeech(ch) {
    const upper = isUpper(ch) || ch === "ẞ";
    const lower = isLower(ch) || ch === "ß";
    if (currentLang === "de") {
      const base = letterBaseNameDe(ch);
      if (ch === "ß") return "Eszett";
      if (ch === "ẞ") return "großes Eszett";
      if (upper) return `großes ${base}`;
      if (lower) return `kleines ${base.toUpperCase()}`;
      return base;
    }
    const base = letterBaseNameEn(ch);
    if (ch === "ß") return "sharp s";
    if (ch === "ẞ") return "capital sharp s";
    if (upper) return `capital ${base}`;
    if (lower) return `lowercase ${letterBaseNameEn(ch.toUpperCase())}`;
    return base;
  }

  /** @param {string} ch */
  function letterToAria(ch) {
    return letterToSpeech(ch);
  }

  /** @param {number} n */
  function numberToSpeechEn(n) {
    const ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = {
      10: "ten",
      11: "eleven",
      12: "twelve",
      13: "thirteen",
      14: "fourteen",
      15: "fifteen",
      16: "sixteen",
      17: "seventeen",
      18: "eighteen",
      19: "nineteen",
    };
    const tensMap = {
      20: "twenty",
      30: "thirty",
      40: "forty",
      50: "fifty",
      60: "sixty",
      70: "seventy",
      80: "eighty",
      90: "ninety",
    };

    // @ts-ignore
    if (teens[n]) return teens[n];
    const tens = Math.floor(n / 10) * 10;
    const one = n % 10;
    // @ts-ignore
    if (one === 0) return tensMap[tens] || String(n);
    // @ts-ignore
    const tensWord = tensMap[tens] || String(tens);
    return `${tensWord}-${ones[one]}`;
  }

  /** @param {number} n */
  function numberToSpeechDe(n) {
    const ones = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
    const teens = {
      10: "zehn",
      11: "elf",
      12: "zwölf",
      13: "dreizehn",
      14: "vierzehn",
      15: "fünfzehn",
      16: "sechzehn",
      17: "siebzehn",
      18: "achtzehn",
      19: "neunzehn",
    };
    const tensMap = {
      20: "zwanzig",
      30: "dreißig",
      40: "vierzig",
      50: "fünfzig",
      60: "sechzig",
      70: "siebzig",
      80: "achtzig",
      90: "neunzig",
    };

    // @ts-ignore
    if (teens[n]) return teens[n];
    const tens = Math.floor(n / 10) * 10;
    const one = n % 10;
    // @ts-ignore
    if (one === 0) return tensMap[tens] || String(n);
    const oneWord = one === 1 ? "ein" : ones[one];
    // @ts-ignore
    const tensWord = tensMap[tens] || String(tens);
    return `${oneWord}und${tensWord}`;
  }

  /** @param {number} n */
  function numberToSpeech(n) {
    return currentLang === "de" ? numberToSpeechDe(n) : numberToSpeechEn(n);
  }

  /** @param {number} n */
  function numberToAria(n) {
    return numberToSpeech(n);
  }

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
   * Start a new "speech session" (cancels anything pending).
   * Anything queued in older sessions is ignored.
   */
  function startSpeechSession() {
    speechSynthesis.cancel();
    return ++speakSeq;
  }

  /**
   * Speak a single utterance within an existing session.
   * @param {number} sessionId
   * @param {string} text
   * @param {{ rate?: number, onend?: () => void }} [opts]
   */
  function speakInSession(sessionId, text, opts) {
    if (sessionId !== speakSeq) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts && opts.rate != null ? opts.rate : 0.92;
    u.pitch = 1;
    const v = getPreferredVoice();
    if (v) u.voice = v;
    u.onend = () => {
      if (sessionId === speakSeq && opts && opts.onend) opts.onend();
    };
    speechSynthesis.speak(u);
  }

  /**
   * Speak text; cancels pending utterances. Optional onend after this utterance.
   * @param {string} text
   * @param {{ rate?: number, onend?: () => void }} [opts]
   */
  function speak(text, opts) {
    const sessionId = startSpeechSession();
    speakInSession(sessionId, text, opts);
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

  /** @type {ClockTime | number | string | null} */
  let currentTarget = null;

  /** @type {"normal" | "reverse" | "audioToNumber" | "numberToAudio" | "audioToLetter" | "letterToAudio"} */
  let currentRoundType = "normal";

  /** @type {Array<ClockTime | number | string>} */
  let currentOptions = [];

  let interactionLocked = false;

  let hintShown = false;

  // ——— Per-mode session scoring (resets on refresh / Home) ———

  const scoreByMode = {
    time: { correct: 0, wrong: 0 },
    numbers: { correct: 0, wrong: 0 },
    letters: { correct: 0, wrong: 0 },
  };

  function resetScores() {
    scoreByMode.time.correct = 0;
    scoreByMode.time.wrong = 0;
    scoreByMode.numbers.correct = 0;
    scoreByMode.numbers.wrong = 0;
    scoreByMode.letters.correct = 0;
    scoreByMode.letters.wrong = 0;
    renderScores();
  }

  /**
   * @param {"time" | "numbers" | "letters"} mode
   * @param {boolean} isCorrect
   */
  function bumpScore(mode, isCorrect) {
    if (isCorrect) scoreByMode[mode].correct++;
    else scoreByMode[mode].wrong++;
    renderScores();
  }

  function renderScores() {
    const host = document.getElementById("session-scores");
    if (!host) return;
    host.replaceChildren();

    /** @param {"time" | "numbers" | "letters"} mode */
    const add = (mode) => {
      const s = scoreByMode[mode];
      const total = s.correct + s.wrong;
      // Barometer-style level: rises with accuracy (0–100).
      const level = total ? Math.round((s.correct / total) * 100) : 50;
      // Hue: 0 = red, 55 = amber, 120 = green.
      const hue = Math.max(0, Math.min(120, Math.round((level / 100) * 120)));

      const card = document.createElement("div");
      card.className = "scorecard";
      if (total === 0) card.setAttribute("aria-disabled", "true");
      card.setAttribute(
        "aria-label",
        `${mode === "time" ? "Time" : mode === "numbers" ? "Numbers" : "Letters"} score: ${s.correct} correct, ${s.wrong} wrong`
      );

      const label = document.createElement("span");
      label.className = "scorecard__label";
      label.textContent = mode === "time" ? "🕒" : mode === "numbers" ? "🔢" : "🔤";

      const gauge = document.createElement("div");
      gauge.className = "scoregauge";
      gauge.style.setProperty("--level", String(level));
      gauge.style.setProperty("--hue", String(hue));
      gauge.setAttribute("aria-hidden", "true");

      const fill = document.createElement("div");
      fill.className = "scoregauge__fill";
      gauge.appendChild(fill);

      const counts = document.createElement("span");
      counts.className = "scorecard__counts";
      counts.textContent = `✓ ${s.correct}  ✕ ${s.wrong}`;

      card.appendChild(label);
      card.appendChild(gauge);
      card.appendChild(counts);
      host.appendChild(card);
    };

    // Show both mode sessions; they’ll “wake up” once used.
    add("time");
    add("numbers");
    add("letters");
  }

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

  /** @param {number} target */
  function pickNumberDistractors(target) {
    /** @type {number[]} */
    const out = [];
    const add = (n) => {
      if (n < 11 || n > 99) return;
      if (n === target) return;
      if (out.includes(n)) return;
      out.push(n);
    };

    const tens = Math.floor(target / 10);
    const ones = target % 10;

    // Swapped digits (e.g. 34 vs 43)
    const swapped = ones * 10 + tens;
    add(swapped);

    // Same tens
    add(tens * 10 + ((ones + 3) % 10));
    add(tens * 10 + ((ones + 7) % 10));

    // Nearby
    add(target + 1);
    add(target - 1);
    add(target + 2);
    add(target - 2);

    // Fill randomly if needed
    const pool = shuffle(NUMBER_POOL.filter((n) => n !== target));
    for (const n of pool) {
      if (out.length >= 3) break;
      add(n);
    }

    return out.slice(0, 3);
  }

  /** @param {string} target */
  function pickLetterDistractors(target) {
    const poolByLang = letterPoolForLang();
    /** @type {string[]} */
    const out = [];
    const add = (x) => {
      if (!x) return;
      if (x === target) return;
      if (out.includes(x)) return;
      out.push(x);
    };

    // Prefer testing case confusion
    add(swapCase(target));

    // Prefer same-case distractors (kids often mix shape/case)
    const wantUpper = isUpper(target) || target === "ẞ";
    const wantLower = isLower(target) || target === "ß";
    const sameCasePool = poolByLang.filter((x) => {
      if (wantUpper) return isUpper(x) || x === "ẞ";
      if (wantLower) return isLower(x) || x === "ß";
      return true;
    });

    const pool = shuffle(sameCasePool.filter((x) => x !== target));
    for (const x of pool) {
      if (out.length >= 3) break;
      add(x);
    }

    // Fill from whole pool if needed
    if (out.length < 3) {
      const rest = shuffle(poolByLang.filter((x) => x !== target));
      for (const x of rest) {
        if (out.length >= 3) break;
        add(x);
      }
    }

    return out.slice(0, 3);
  }

  function newRound() {
    setLive("");
    hintShown = false;

    if (currentMode === "numbers") {
      const target = NUMBER_POOL[Math.floor(Math.random() * NUMBER_POOL.length)];
      currentTarget = target;
      currentRoundType = Math.random() < 0.5 ? "audioToNumber" : "numberToAudio";
      const wrong = pickNumberDistractors(target);
      currentOptions = shuffle([target, ...wrong]);
    } else if (currentMode === "letters") {
      const poolByLang = letterPoolForLang();
      const target = poolByLang[Math.floor(Math.random() * poolByLang.length)];
      currentTarget = target;
      currentRoundType = Math.random() < 0.5 ? "audioToLetter" : "letterToAudio";
      const wrong = pickLetterDistractors(target);
      currentOptions = shuffle([target, ...wrong]);
    } else {
      const target = TIME_POOL[Math.floor(Math.random() * TIME_POOL.length)];
      currentTarget = target;
      currentRoundType = Math.random() < 0.5 ? "reverse" : "normal";
      const wrong = pickDistractors(target);
      currentOptions = shuffle([target, ...wrong]);
    }

    renderClock();
    renderNumbers();
    renderLetters();
    renderChoices();
    interactionLocked = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        clearChoiceSpeaking();
        speakQuestion();
        interactionLocked = false;
      });
    });
  }

  function clearChoiceSpeaking() {
    const els = document.querySelectorAll("#choices-root .is-speaking");
    els.forEach((el) => el.classList.remove("is-speaking"));
  }

  /**
   * In Numbers → "numberToAudio" rounds, automatically read out each choice
   * while briefly highlighting the corresponding 🔊 button.
   * @param {number} sessionId
   */
  function autoReadNumberToAudioChoices(sessionId) {
    if (sessionId !== speakSeq) return;
    if (currentRoundType !== "numberToAudio") return;

    const btns = Array.from(document.querySelectorAll("#choices-root .btn--audiopick"));
    if (!btns.length) return;

    const values = btns.map((b) => Number(b.dataset.value || ""));
    let i = 0;

    const next = () => {
      if (sessionId !== speakSeq) return clearChoiceSpeaking();
      clearChoiceSpeaking();
      const btn = btns[i];
      const value = values[i];
      if (btn && Number.isFinite(value)) btn.classList.add("is-speaking");
      speakInSession(sessionId, numberToSpeech(value), {
        rate: 0.88,
        onend: () => {
          if (sessionId !== speakSeq) return clearChoiceSpeaking();
          if (btn) btn.classList.remove("is-speaking");
          i++;
          if (i >= btns.length) return;
          setTimeout(next, 160);
        },
      });
    };

    next();
  }

  function speakQuestion() {
    if (!currentTarget) return;
    const ui = tUi();

    if (currentRoundType === "audioToNumber") {
      const n = /** @type {number} */ (currentTarget);
      speak(`${ui.numbersAudioToNumberPrompt} ${numberToSpeech(n)}`, { onend: () => {} });
      return;
    }

    if (currentRoundType === "numberToAudio") {
      const sessionId = startSpeechSession();
      clearChoiceSpeaking();
      speakInSession(sessionId, ui.numbersNumberToAudioPrompt, {
        onend: () => autoReadNumberToAudioChoices(sessionId),
      });
      return;
    }

    if (currentRoundType === "audioToLetter") {
      const ch = /** @type {string} */ (currentTarget);
      speak(letterToSpeech(ch), { onend: () => {} });
      return;
    }

    if (currentRoundType === "letterToAudio") {
      const sessionId = startSpeechSession();
      clearChoiceSpeaking();
      speakInSession(sessionId, ui.lettersLetterToAudioPrompt, {
        onend: () => autoReadLetterToAudioChoices(sessionId),
      });
      return;
    }

    if (currentRoundType === "reverse") {
      const ui = tUi();
      const phrase = phraseForTime(/** @type {ClockTime} */ (currentTarget));
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
          titleTime: "Wie spät ist es?",
          titleNumbers: "Zahlen",
          titleLetters: "Buchstaben",
          hintTime: "Hör zu und tippe die richtige Antwort.",
          hintNumbersAudioToNumber: "Hör zu und tippe die richtige Zahl.",
          hintNumbersNumberToAudio: "Schau hin und tippe den richtigen Klang.",
          hintLettersAudioToLetter: "Hör zu und tippe den richtigen Buchstaben.",
          hintLettersLetterToAudio: "Schau hin und tippe den richtigen Klang.",
          repeat: "Nochmal sagen",
          repeatAria: "Frage nochmal sagen",
          hintBtn: "Tipp",
          hintAria: "Tipp anzeigen",
          reversePrompt: "Finde die Uhr für",
          numbersAudioToNumberPrompt: "Welche Zahl hast du gehört?",
          numbersNumberToAudioPrompt: "Welcher Klang passt zu dieser Zahl?",
          lettersAudioToLetterPrompt: "Welchen Buchstaben hast du gehört?",
          lettersLetterToAudioPrompt: "Welcher Klang passt zu diesem Buchstaben?",
          modeTime: "Zeit",
          modeNumbers: "Zahlen",
          modeLetters: "Buchstaben",
          listenAria: (p) => `Anhören: ${p}`,
          chooseAria: (p) => `Wähle ${p}`,
          chooseClockAria: (p) => `Wähle die Uhr: ${p}`,
          chooseNumberAria: (n) => `Wähle ${n}`,
          chooseSoundAria: (p) => `Wähle den Klang: ${p}`,
          chooseLetterAria: (c) => `Wähle ${c}`,
          correctLive: "Richtig!",
          tryAgainLive: "Nochmal versuchen.",
          notQuite: "Nicht ganz. Versuch eine andere Antwort.",
          ready: "Bereit für die nächste?",
          start: "Start",
          startHint: "Tippe Start — dann hörst du die Fragen (Audio braucht oft einen Tipp).",
          lookTime: "Schau auf die Uhr!",
          lookNumbers: "Los geht's mit Zahlen!",
          lookLetters: "Los geht's mit Buchstaben!",
          praises: ["Ja! Genau!", "Super!", "Toll gemacht!", "Richtig!"],
        }
      : {
          titleTime: "What time is it?",
          titleNumbers: "Numbers",
          titleLetters: "Letters",
          hintTime: "Listen, then tap the right answer.",
          hintNumbersAudioToNumber: "Listen, then tap the right number.",
          hintNumbersNumberToAudio: "Look, then tap the right sound.",
          hintLettersAudioToLetter: "Listen, then tap the right letter.",
          hintLettersLetterToAudio: "Look, then tap the right sound.",
          repeat: "Say it again",
          repeatAria: "Say the question again",
          hintBtn: "Hint",
          hintAria: "Show a hint",
          reversePrompt: "Find the clock for",
          numbersAudioToNumberPrompt: "Which number did you hear?",
          numbersNumberToAudioPrompt: "Which sound matches this number?",
          lettersAudioToLetterPrompt: "Which letter did you hear?",
          lettersLetterToAudioPrompt: "Which sound matches this letter?",
          modeTime: "Time",
          modeNumbers: "Numbers",
          modeLetters: "Letters",
          listenAria: (p) => `Listen: ${p}`,
          chooseAria: (p) => `Choose ${p}`,
          chooseClockAria: (p) => `Choose the clock: ${p}`,
          chooseNumberAria: (n) => `Choose ${n}`,
          chooseSoundAria: (p) => `Choose the sound: ${p}`,
          chooseLetterAria: (c) => `Choose ${c}`,
          correctLive: "Correct!",
          tryAgainLive: "Try again.",
          notQuite: "Not quite. Try another answer.",
          ready: "Ready for another one?",
          start: "Start",
          startHint: "Tap Start — then you will hear the questions (works best after a tap).",
          lookTime: "Let's look at the clock!",
          lookNumbers: "Let's do numbers!",
          lookLetters: "Let's do letters!",
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
    const btnModeTime = document.getElementById("btn-mode-time");
    const btnModeNumbers = document.getElementById("btn-mode-numbers");
    const btnModeLetters = document.getElementById("btn-mode-letters");
    const btnModeStartTime = document.getElementById("btn-mode-start-time");
    const btnModeStartNumbers = document.getElementById("btn-mode-start-numbers");
    const btnModeStartLetters = document.getElementById("btn-mode-start-letters");

    if (titleEl)
      titleEl.textContent =
        currentMode === "numbers" ? ui.titleNumbers : currentMode === "letters" ? ui.titleLetters : ui.titleTime;
    if (hintEl) {
      hintEl.textContent =
        currentMode === "numbers"
          ? currentRoundType === "numberToAudio"
            ? ui.hintNumbersNumberToAudio
            : ui.hintNumbersAudioToNumber
          : currentMode === "letters"
            ? currentRoundType === "letterToAudio"
              ? ui.hintLettersLetterToAudio
              : ui.hintLettersAudioToLetter
            : ui.hintTime;
    }
    if (repeatBtn) {
      repeatBtn.textContent = ui.repeat;
      repeatBtn.setAttribute("aria-label", ui.repeatAria);
    }
    if (hintBtn) {
      hintBtn.textContent = ui.hintBtn;
      hintBtn.setAttribute("aria-label", ui.hintAria);
    }
    if (startHint) startHint.textContent = ui.startHint;
    if (startBtn) startBtn.textContent = `▶️ ${ui.start}`;

    const langLabel = document.querySelector(".lang__label");
    if (langLabel) langLabel.textContent = currentLang === "de" ? "Sprache" : "Language";

    if (btnModeTime) btnModeTime.textContent = ui.modeTime;
    if (btnModeNumbers) btnModeNumbers.textContent = ui.modeNumbers;
    if (btnModeLetters) btnModeLetters.textContent = ui.modeLetters;
    if (btnModeStartTime) btnModeStartTime.textContent = `🕒 ${ui.modeTime}`;
    if (btnModeStartNumbers) btnModeStartNumbers.textContent = `🔢 ${ui.modeNumbers}`;
    if (btnModeStartLetters) btnModeStartLetters.textContent = `🔤 ${ui.modeLetters}`;
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
    if (!wrap) return;
    if (currentMode !== "time" || !currentTarget) {
      wrap.setAttribute("hidden", "");
      return;
    }
    if (currentRoundType === "reverse") {
      wrap?.setAttribute("hidden", "");
      refreshHintUi();
      return;
    }
    wrap?.removeAttribute("hidden");
    drawHands(/** @type {ClockTime} */ (currentTarget));
    refreshHintUi();
  }

  function renderNumbers() {
    const panel = document.getElementById("numbers-panel");
    const valueEl = document.getElementById("numbers-value");
    if (!panel || !valueEl) return;

    const show =
      currentMode === "numbers" && currentRoundType === "numberToAudio" && currentTarget != null;
    if (!show) {
      panel.setAttribute("hidden", "");
      return;
    }

    panel.removeAttribute("hidden");
    valueEl.textContent = String(/** @type {number} */ (currentTarget));
  }

  function renderLetters() {
    const panel = document.getElementById("letters-panel");
    const valueEl = document.getElementById("letters-value");
    if (!panel || !valueEl) return;

    const show = currentMode === "letters" && currentRoundType === "letterToAudio" && currentTarget != null;
    if (!show) {
      panel.setAttribute("hidden", "");
      return;
    }

    panel.removeAttribute("hidden");
    valueEl.textContent = String(/** @type {string} */ (currentTarget));
  }

  function renderChoices() {
    const root = document.getElementById("choices-root");
    if (!root || !currentTarget) return;
    root.replaceChildren();
    clearChoiceSpeaking();
    const isReverseTime = currentRoundType === "reverse";
    const isNumbersRound = currentRoundType === "audioToNumber" || currentRoundType === "numberToAudio";
    const isLettersRound = currentRoundType === "audioToLetter" || currentRoundType === "letterToAudio";
    root.classList.toggle("choices__grid--clocks", isReverseTime);
    root.classList.toggle("choices__grid--numbers", isNumbersRound);
    root.classList.toggle("choices__grid--letters", isLettersRound);

    if (currentRoundType === "audioToNumber") {
      const ui = tUi();
      currentOptions.forEach((n) => {
        const value = /** @type {number} */ (n);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--numberpick";
        btn.textContent = String(value);
        btn.setAttribute("aria-label", ui.chooseNumberAria(value));
        btn.addEventListener("click", () => {
          if (interactionLocked) return;
          onPick(value, btn);
        });
        root.appendChild(btn);
      });
      return;
    }

    if (currentRoundType === "numberToAudio") {
      const ui = tUi();
      currentOptions.forEach((n) => {
        const value = /** @type {number} */ (n);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--audiopick";
        btn.textContent = "\u{1F50A}";
        btn.dataset.value = String(value);
        btn.setAttribute("aria-label", ui.chooseSoundAria(numberToAria(value)));
        btn.addEventListener("click", () => {
          if (interactionLocked) return;
          onPick(value, btn);
        });
        root.appendChild(btn);
      });
      return;
    }

    if (currentRoundType === "audioToLetter") {
      const ui = tUi();
      currentOptions.forEach((c) => {
        const value = /** @type {string} */ (c);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--letterpick";
        btn.textContent = String(value);
        btn.setAttribute("aria-label", ui.chooseLetterAria(value));
        btn.addEventListener("click", () => {
          if (interactionLocked) return;
          onPick(value, btn);
        });
        root.appendChild(btn);
      });
      return;
    }

    if (currentRoundType === "letterToAudio") {
      const ui = tUi();
      currentOptions.forEach((c) => {
        const value = /** @type {string} */ (c);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--audiopick";
        btn.textContent = "\u{1F50A}";
        btn.dataset.value = String(value);
        btn.setAttribute("aria-label", ui.chooseSoundAria(letterToAria(value)));
        btn.addEventListener("click", () => {
          if (interactionLocked) return;
          onPick(value, btn);
        });
        root.appendChild(btn);
      });
      return;
    }

    if (currentRoundType === "reverse") {
      currentOptions.forEach((t) => {
        const tt = /** @type {ClockTime} */ (t);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--clockpick";
        btn.setAttribute("aria-label", tUi().chooseClockAria(ariaForTime(tt)));

        const svg = makeMiniClockSvg(tt);
        btn.appendChild(svg);

        btn.addEventListener("click", () => {
          if (interactionLocked) return;
          onPick(tt, btn);
        });

        root.appendChild(btn);
      });
      return;
    }

    currentOptions.forEach((t) => {
      const tt = /** @type {ClockTime} */ (t);
      const row = document.createElement("div");
      row.className = "choice-row";

      const listenBtn = document.createElement("button");
      listenBtn.type = "button";
      listenBtn.className = "btn btn--listen";
      listenBtn.setAttribute("aria-label", tUi().listenAria(phraseForTime(tt)));
      listenBtn.textContent = "\u{1F50A}";
      listenBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (interactionLocked) return;
        speak(phraseForTime(tt), { rate: 0.88 });
      });

      const pickBtn = document.createElement("button");
      pickBtn.type = "button";
      pickBtn.className = "btn btn--pick";
      pickBtn.setAttribute("aria-label", tUi().chooseAria(ariaForTime(tt)));
      pickBtn.innerHTML = `<span class="btn-pick__phrase">${phraseForTime(tt)}</span> <span class="btn-pick__time" style="opacity:0.75;font-weight:600">(${displayShort(tt)})</span>`;

      pickBtn.addEventListener("click", () => {
        if (interactionLocked) return;
        onPick(tt, pickBtn);
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
    clearChoiceSpeaking();
    interactionLocked = true;
    const all = document.querySelectorAll(
      "#choices-root .btn--pick, #choices-root .btn--listen, #choices-root .btn--clockpick, #choices-root .btn--numberpick, #choices-root .btn--letterpick, #choices-root .btn--audiopick"
    );
    all.forEach((b) => {
      b.disabled = true;
    });

    const pickedSpeech =
      currentMode === "numbers"
        ? numberToSpeech(/** @type {number} */ (picked))
        : currentMode === "letters"
          ? letterToSpeech(/** @type {string} */ (picked))
          : phraseForTime(/** @type {ClockTime} */ (picked));

    speak(pickedSpeech, {
      rate: 0.88,
      onend: () => {
        const correct =
          currentMode === "numbers"
            ? /** @type {number} */ (picked) === /** @type {number} */ (currentTarget)
            : currentMode === "letters"
              ? /** @type {string} */ (picked) === /** @type {string} */ (currentTarget)
              : timeKey(/** @type {ClockTime} */ (picked)) === timeKey(/** @type {ClockTime} */ (currentTarget));
        bumpScore(currentMode, correct);
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

  /**
   * In Letters → "letterToAudio" rounds, automatically read out each choice
   * while briefly highlighting the corresponding 🔊 button.
   * @param {number} sessionId
   */
  function autoReadLetterToAudioChoices(sessionId) {
    if (sessionId !== speakSeq) return;
    if (currentRoundType !== "letterToAudio") return;

    const btns = Array.from(document.querySelectorAll("#choices-root .btn--audiopick"));
    if (!btns.length) return;

    const values = btns.map((b) => String(b.dataset.value || ""));
    let i = 0;

    const next = () => {
      if (sessionId !== speakSeq) return clearChoiceSpeaking();
      clearChoiceSpeaking();
      const btn = btns[i];
      const value = values[i];
      if (btn && value) btn.classList.add("is-speaking");
      speakInSession(sessionId, letterToSpeech(value), {
        rate: 0.88,
        onend: () => {
          if (sessionId !== speakSeq) return clearChoiceSpeaking();
          if (btn) btn.classList.remove("is-speaking");
          i++;
          if (i >= btns.length) return;
          setTimeout(next, 160);
        },
      });
    };

    next();
  }

  // ——— Start / DOM ———

  function init() {
    buildTicks();
    buildHourNumbers();

    const overlay = document.getElementById("start-overlay");
    const app = document.getElementById("app");
    const btnStart = document.getElementById("btn-start");
    const btnHome = document.getElementById("btn-home");
    const btnRepeat = document.getElementById("btn-repeat");
    const btnHint = document.getElementById("btn-hint");
    const langSelect = document.getElementById("lang");
    const btnModeTime = document.getElementById("btn-mode-time");
    const btnModeNumbers = document.getElementById("btn-mode-numbers");
    const btnModeLetters = document.getElementById("btn-mode-letters");
    const btnModeStartTime = document.getElementById("btn-mode-start-time");
    const btnModeStartNumbers = document.getElementById("btn-mode-start-numbers");
    const btnModeStartLetters = document.getElementById("btn-mode-start-letters");

    initSpeechVoices();

    // Default language: auto-detect German, else English.
    const navLang = (navigator.language || "").toLowerCase();
    currentLang = navLang.startsWith("de") ? "de" : "en";
    document.documentElement.lang = currentLang;
    if (langSelect && "value" in langSelect) langSelect.value = currentLang;
    refreshUiText();

    function setMode(next) {
      currentMode = next === "numbers" ? "numbers" : next === "letters" ? "letters" : "time";

      const isTime = currentMode === "time";
      const isNumbers = currentMode === "numbers";
      const isLetters = currentMode === "letters";
      if (btnModeTime) btnModeTime.setAttribute("aria-pressed", isTime ? "true" : "false");
      if (btnModeNumbers) btnModeNumbers.setAttribute("aria-pressed", isNumbers ? "true" : "false");
      if (btnModeLetters) btnModeLetters.setAttribute("aria-pressed", isLetters ? "true" : "false");
      if (btnModeStartTime) btnModeStartTime.setAttribute("aria-pressed", isTime ? "true" : "false");
      if (btnModeStartNumbers) btnModeStartNumbers.setAttribute("aria-pressed", isNumbers ? "true" : "false");
      if (btnModeStartLetters) btnModeStartLetters.setAttribute("aria-pressed", isLetters ? "true" : "false");

      refreshUiText();
      refreshHintUi();
      renderClock();
      renderNumbers();
      renderLetters();
      renderChoices();
    }

    // Default mode: time.
    setMode("time");

    function goToStartScreen() {
      startSpeechSession();
      setLive("");
      interactionLocked = false;
      hintShown = false;
      currentTarget = null;
      currentOptions = [];
      resetScores();

      overlay?.removeAttribute("hidden");
      app?.setAttribute("hidden", "");
      refreshUiText();
      refreshHintUi();
      renderClock();
      renderNumbers();
      renderLetters();
      renderChoices();
      btnStart?.focus();
    }

    langSelect?.addEventListener("change", () => {
      currentLang = langSelect.value === "de" ? "de" : "en";
      document.documentElement.lang = currentLang;
      refreshUiText();
      renderNumbers();
      renderLetters();
      renderChoices();
      refreshHintUi();
      if (currentMode === "letters") newRound();
      else speakQuestion();
    });

    btnModeStartTime?.addEventListener("click", () => setMode("time"));
    btnModeStartNumbers?.addEventListener("click", () => setMode("numbers"));
    btnModeStartLetters?.addEventListener("click", () => setMode("letters"));
    btnModeTime?.addEventListener("click", () => {
      setMode("time");
      if (overlay?.hasAttribute("hidden")) newRound();
    });
    btnModeNumbers?.addEventListener("click", () => {
      setMode("numbers");
      if (overlay?.hasAttribute("hidden")) newRound();
    });
    btnModeLetters?.addEventListener("click", () => {
      setMode("letters");
      if (overlay?.hasAttribute("hidden")) newRound();
    });

    btnStart?.addEventListener("click", () => {
      overlay?.setAttribute("hidden", "");
      app?.removeAttribute("hidden");
      document.getElementById("btn-repeat")?.focus();
      renderScores();
      const ui = tUi();
      speak(currentMode === "numbers" ? ui.lookNumbers : currentMode === "letters" ? ui.lookLetters : ui.lookTime, {
        onend: () => newRound(),
      });
    });

    btnHome?.addEventListener("click", () => {
      goToStartScreen();
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

    // Initial render (start screen).
    renderScores();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
