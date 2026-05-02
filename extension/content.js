(() => {
  const STORAGE_KEY = "scrollCourtState";
  const MAX_EVIDENCE_ITEMS = 10;
  const MAX_CAPTION_CHARS = 1500;
  const FEEDBACK_TEST_EVERY_SHORT = true;
  const MAX_FRAME_ANALYSES_PER_SHORT = 5;
  const FRAME_ANALYSIS_INTERVAL_MS = 2000;
  const FIRST_FRAME_ANALYSIS_DELAY_MS = 1500;

  const RANKS = [
    { min: 90, name: "Oracle of Restraint" },
    { min: 70, name: "Stoic Swipe Survivor" },
    { min: 50, name: "Apprentice Philosopher" },
    { min: 25, name:  "Court Jester of Focus" },
    { min: -999, name: "Doomscroll Defendant" }
  ];
  const QUOTES = [
    "Socrates asked what you learned. Your thumb declined to comment.",
    "Plato's cave had shadows. Yours has Subway Surfers under a podcast clip.",
    "Diogenes searched for an honest attention span and closed the tab.",
    "Aristotle identified three causes of your downfall: autoplay, boredom, and one guy making pasta at 2x speed.",
    "The unexamined scroll is not worth swiping.",
    "Your thumb has filed for workers' compensation.",
    "Socrates asked for a definition of productivity. The court records show silence.",
    "Diogenes brought a lantern to find your focus. He found three gym edits and a prank.",
    "Plato left the cave. You opened another Short.",
    "The jury finds your attention span guilty of fleeing the scene."
  ];
  const SUMMONS_COPY = [
    "The court may summon you at any moment.",
    "Judgment arrives when wisdom fails.",
    "Summons timing: sealed by the court.",
    "The philosophers are watching the pattern, not the clock."
  ];
  const PHILOSOPHERS = [
    { name: "Socrates", asset: "assets/socrates.png", fallback: "S" },
    { name: "Plato", asset: "assets/plato.png", fallback: "P" },
    { name: "Diogenes", asset: "assets/diogenes.png", fallback: "D" },
    { name: "Aristotle", asset: "assets/aristotle.png", fallback: "A" }
  ];
  const TOPIC_KEYWORDS = {
    food: ["cook", "recipe", "food", "meal", "spicy", "eat", "restaurant"],
    fitness: ["gym", "bench", "workout", "lift", "protein", "run", "fitness"],
    sports: ["football", "soccer", "basketball", "goal", "match", "nba", "ucl"],
    money: ["money", "rich", "invest", "stock", "business", "side hustle"],
    gaming: ["game", "minecraft", "fortnite", "roblox", "valorant"],
    brainrot: ["sigma", "skibidi", "rizz", "prank", "meme", "subway surfers"],
    music: ["song", "music", "concert", "guitar", "piano", "beat"]
  };
  const FALLBACKS = [
    {
      question: "Witness testimony: what did the last few Shorts try to steal from your attention span?",
      answers: [
        { text: "A clear topic I can name", correct: true },
        { text: "A blur of edits and noise", correct: false },
        { text: "The legal right to my thumb", correct: false }
      ]
    },
    {
      question: "Cross-examination: how intentional was that last swipe?",
      answers: [
        { text: "Intentional. I chose the chaos.", correct: true },
        { text: "My thumb acted alone", correct: false },
        { text: "I was spiritually buffering", correct: false }
      ]
    },
    {
      question: "Court interrogation: the evidence is thin. What can you honestly testify?",
      answers: [
        { text: "I remember the general topic", correct: true },
        { text: "I remember every frame, allegedly", correct: false },
        { text: "I plead infinite-scroll confusion", correct: false }
      ]
    }
  ];

  const defaultState = {
    enabled: true,
    apiBase: "http://localhost:3000",
    demoPassword: "",
    watchedCount: 0,
    wisdom: 50,
    quizCount: 0,
    lastShortUrl: "",
    lastQuizAt: 0,
    nextJudgmentAt: 0,
    recentEvidence: [],
    sessionTopics: [],
    roastIntensity: "medium",
    lastQuote: "",
    sessionEnded: false
  };

  let state = { ...defaultState };
  let panelRoot;
  let overlayActive = false;
  let quizFetchInProgress = false;
  let activeVideoId = "";
  let captionBuffer = [];
  const frameAnalysisCounts = new Map();

  function storageGet() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        resolve({ ...defaultState, ...(result[STORAGE_KEY] || {}) });
      });
    });
  }

  function storageSet(nextState) {
    state = { ...state, ...nextState };
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: state }, resolve);
    });
  }

  function getRank(wisdom) {
    return RANKS.find((rank) => wisdom >= rank.min).name;
  }

  function clampWisdom(value) {
    return Math.max(0, Math.min(100, value));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  function getSummonsCopy() {
    return SUMMONS_COPY[state.watchedCount % SUMMONS_COPY.length];
  }

  function isShortsUrl() {
    return location.hostname === "www.youtube.com" && location.pathname.startsWith("/shorts/");
  }

  function extractVideoId() {
    return location.pathname.split("/shorts/")[1]?.split(/[/?#]/)[0] || "";
  }

  function getPhilosopherMarkup() {
    const philosopher = PHILOSOPHERS[state.watchedCount % PHILOSOPHERS.length];
    const url = chrome.runtime.getURL(philosopher.asset);
    return `
      <div class="sc-philosopher" aria-label="${philosopher.name}">
        <img class="sc-philosopher-img" src="${url}" alt="${philosopher.name}" />
        <span class="sc-philosopher-fallback">${philosopher.fallback}</span>
      </div>
    `;
  }

  function getTopicsFromText(text) {
    const lowerText = (text || "").toLowerCase();
    return Object.entries(TOPIC_KEYWORDS)
      .filter(([, keywords]) => keywords.some((keyword) => lowerText.includes(keyword)))
      .map(([topic]) => topic);
  }

  function getSessionTopics(evidenceItems) {
    return [
      ...new Set(
        (evidenceItems || []).flatMap((item) => [
          ...(item.metadataTopics || []),
          ...(item.frameTopics || [])
        ])
      )
    ].slice(0, 5);
  }

  function calculateEvidenceStrength(item) {
    if ((item.captions || "").trim().length > 80) return "strong";
    if (item.frameSummary && ["medium", "high"].includes(item.frameConfidence)) return "medium";
    return "weak";
  }

  function extractVideoMeta() {
    const videoId = extractVideoId();
    const title = document.title.replace(/\s*[-|]\s*YouTube\s*$/i, "").trim();
    let channel = "";
    const channelCandidates = [
      document.querySelector("ytd-reel-video-renderer[is-active] #channel-name a"),
      document.querySelector("ytd-reel-video-renderer[is-active] .ytd-channel-name"),
      document.querySelector(".ytd-reel-player-overlay-renderer #channel-name a"),
      document.querySelector("#owner-name a"),
      document.querySelector("a.yt-simple-endpoint.ytd-channel-name")
    ];

    for (const element of channelCandidates) {
      const text = element?.textContent?.trim();
      if (text) {
        channel = text;
        break;
      }
    }

    return {
      videoId,
      url: location.href.split("?")[0],
      title: title || "",
      channel,
      metadataTopics: getTopicsFromText(`${title} ${channel}`)
    };
  }

  async function upsertEvidence(partial) {
    if (!partial.videoId) return;

    const existing = state.recentEvidence || [];
    const index = existing.findIndex((item) => item.videoId === partial.videoId);
    const previous = index >= 0 ? existing[index] : {};
    const merged = {
      captions: "",
      frameSummary: "",
      frameTopics: [],
      frameConfidence: "low",
      metadataTopics: [],
      evidenceStrength: "weak",
      createdAt: Date.now(),
      ...previous,
      ...partial
    };
    merged.captions = (merged.captions || "").slice(0, MAX_CAPTION_CHARS);
    merged.evidenceStrength = calculateEvidenceStrength(merged);

    const nextEvidence = index >= 0
      ? [...existing.slice(0, index), merged, ...existing.slice(index + 1)]
      : [...existing, merged];
    const trimmed = nextEvidence.slice(-MAX_EVIDENCE_ITEMS);

    await storageSet({
      recentEvidence: trimmed,
      sessionTopics: getSessionTopics(trimmed)
    });
  }

  function getCaptionText() {
    const selectors = [
      ".ytp-caption-segment",
      ".captions-text",
      ".caption-window",
      ".ytp-caption-window-container"
    ];

    return selectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .map((element) => element.textContent?.replace(/\s+/g, " ").trim() || "")
      .filter(Boolean)
      .join(" ")
      .slice(0, 500);
  }

  async function flushCaptions(videoId = activeVideoId) {
    if (!videoId || captionBuffer.length === 0) return;
    const captions = [...new Set(captionBuffer)].join(" ").slice(0, MAX_CAPTION_CHARS);
    await upsertEvidence({ videoId, captions });
  }

  async function collectCaptions() {
    if (!isShortsUrl() || !activeVideoId) return;
    const text = getCaptionText();
    if (!text || captionBuffer.includes(text)) return;
    captionBuffer.push(text);
    captionBuffer = [captionBuffer.join(" ").slice(0, MAX_CAPTION_CHARS)];
    await flushCaptions(activeVideoId);
  }

  function selectEvidenceForJudgment() {
    const evidence = (state.recentEvidence || []).filter(Boolean).slice(-MAX_EVIDENCE_ITEMS);
    const previousEvidence = evidence.filter((item) => item.videoId && item.videoId !== activeVideoId);

    if (previousEvidence.length) {
      return previousEvidence[previousEvidence.length - 1];
    }

    return null;
  }

  function isQuizPending() {
    if (FEEDBACK_TEST_EVERY_SHORT) {
      return (
        state.enabled &&
        !state.sessionEnded &&
        state.watchedCount > 0 &&
        state.lastQuizAt !== state.watchedCount
      );
    }

    return (
      state.enabled &&
      !state.sessionEnded &&
      state.watchedCount > 0 &&
      state.nextJudgmentAt > 0 &&
      state.watchedCount >= state.nextJudgmentAt &&
      state.lastQuizAt !== state.nextJudgmentAt
    );
  }

  async function scheduleNextJudgment() {
    await storageSet({ nextJudgmentAt: state.watchedCount + randomInt(5, 7) });
  }

  function fallbackReceipt() {
    const topics = (state.sessionTopics || []).join(", ") || "unclassified internet fog";
    return [
      "SCROLL COURT RECEIPT",
      `Charges: ${state.watchedCount} Shorts entered into evidence.`,
      `Evidence: ${topics}.`,
      `Wisdom Damage: ${state.wisdom}/100, rank ${getRank(state.wisdom)}.`,
      "",
      "Philosopher Verdict: Socrates asked what you learned. The record shows a long pause and one suspicious swipe.",
      "",
      "Sentence: Close the tab, drink water, and let Diogenes stop searching for your focus."
    ].join("\n");
  }

  function getFallbackQuiz() {
    return FALLBACKS[state.watchedCount % FALLBACKS.length];
  }

  function lockScroll() {
    overlayActive = true;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  function unlockScroll() {
    overlayActive = false;
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }

  function blockNavKeys(event) {
    if (overlayActive && ["ArrowUp", "ArrowDown", " ", "k", "j"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function blockWheel(event) {
    if (overlayActive) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  async function dismissOverlay(overlay) {
    await storageSet({
      lastQuizAt: FEEDBACK_TEST_EVERY_SHORT ? state.watchedCount : state.nextJudgmentAt
    });
    await scheduleNextJudgment();
    overlay.remove();
    unlockScroll();
    render();
  }

  function fillLockedOverlay(overlay) {
    const modal = overlay.querySelector(".sc-modal");
    const statsEl = modal?.querySelector(".sc-modal-stats");
    if (!modal || !statsEl) return;
    modal.querySelector(".sc-modal-loading")?.remove();

    const message = document.createElement("p");
    message.className = "sc-modal-question";
    message.textContent = "Enter the demo password in the extension popup to unlock the court.";
    modal.insertBefore(message, statsEl);

    const button = document.createElement("button");
    button.className = "sc-modal-answer";
    button.type = "button";
    button.textContent = "Dismiss summons";
    button.addEventListener("click", () => dismissOverlay(overlay));
    modal.insertBefore(button, statsEl);
  }

  function fillQuizInOverlay(overlay, quiz) {
    const modal = overlay.querySelector(".sc-modal");
    const statsEl = modal?.querySelector(".sc-modal-stats");
    if (!modal || !statsEl) return;
    modal.querySelector(".sc-modal-loading")?.remove();

    const questionEl = document.createElement("p");
    questionEl.className = "sc-modal-question";
    questionEl.textContent = quiz.question;
    modal.insertBefore(questionEl, statsEl);

    const answersEl = document.createElement("div");
    answersEl.className = "sc-modal-answers";
    quiz.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.className = "sc-modal-answer";
      button.type = "button";
      button.textContent = answer.text;
      button.addEventListener("click", async () => {
        const buttons = [...answersEl.querySelectorAll(".sc-modal-answer")];
        buttons.forEach((answerButton) => {
          answerButton.disabled = true;
        });
        button.classList.add(answer.correct ? "sc-answer-correct" : "sc-answer-wrong");

        if (!answer.correct) {
          buttons.forEach((answerButton, index) => {
            if (quiz.answers[index]?.correct) answerButton.classList.add("sc-answer-reveal");
          });
        }

        await storageSet({
          wisdom: clampWisdom(state.wisdom + (answer.correct ? 15 : -12)),
          quizCount: state.quizCount + 1,
          lastQuizAt: FEEDBACK_TEST_EVERY_SHORT ? state.watchedCount : state.nextJudgmentAt
        });
        await scheduleNextJudgment();

        setTimeout(() => {
          overlay.remove();
          unlockScroll();
          render();
        }, 1100);
      });
      answersEl.appendChild(button);
    });
    modal.insertBefore(answersEl, statsEl);
  }

  async function analyzeOneFrame(meta) {
    if (!meta.videoId || !isShortsUrl() || extractVideoId() !== meta.videoId) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SCROLL_COURT_ANALYZE_FRAME",
        payload: {
          demoPassword: state.demoPassword,
          title: meta.title,
          channel: meta.channel,
          videoId: meta.videoId
        }
      });

      if (!response?.ok || response?.status === 401 || extractVideoId() !== meta.videoId) return;

      const previous = (state.recentEvidence || []).find((item) => item.videoId === meta.videoId);
      const existingSummary = previous?.frameSummary || "";
      const nextSummary = [existingSummary, response.data?.summary]
        .filter(Boolean)
        .join(" | ")
        .slice(0, 500);
      const nextTopics = [
        ...new Set([
          ...(previous?.frameTopics || []),
          ...(Array.isArray(response.data?.topics) ? response.data.topics : [])
        ])
      ].slice(0, 5);
      const confidenceRank = { low: 0, medium: 1, high: 2 };
      const previousConfidence = previous?.frameConfidence || "low";
      const responseConfidence = response.data?.confidence || "low";
      const frameConfidence =
        confidenceRank[responseConfidence] > confidenceRank[previousConfidence]
          ? responseConfidence
          : previousConfidence;

      await upsertEvidence({
        videoId: meta.videoId,
        frameSummary: nextSummary,
        frameTopics: nextTopics,
        frameConfidence
      });
      render();
    } catch {
      // Frame analysis is opportunistic; captions and metadata still keep the demo working.
    }
  }

  function analyzeFramesForVideo(meta) {
    if (!meta.videoId) return;
    frameAnalysisCounts.set(meta.videoId, 0);

    for (let index = 0; index < MAX_FRAME_ANALYSES_PER_SHORT; index += 1) {
      const delay = FIRST_FRAME_ANALYSIS_DELAY_MS + index * FRAME_ANALYSIS_INTERVAL_MS;
      setTimeout(async () => {
        if (!isShortsUrl() || extractVideoId() !== meta.videoId) return;
        const count = frameAnalysisCounts.get(meta.videoId) || 0;
        if (count >= MAX_FRAME_ANALYSES_PER_SHORT) return;
        frameAnalysisCounts.set(meta.videoId, count + 1);
        await analyzeOneFrame(meta);
      }, delay);
    }
  }

  async function renderOverlay() {
    const existing = document.getElementById("sc-overlay");
    if (!isShortsUrl() || !isQuizPending()) {
      if (existing) {
        existing.remove();
        unlockScroll();
      }
      return;
    }
    if (existing || quizFetchInProgress) return;

    lockScroll();
    quizFetchInProgress = true;
    const overlay = document.createElement("div");
    overlay.id = "sc-overlay";
    overlay.innerHTML = `
      <div class="sc-modal" role="dialog" aria-modal="true" aria-label="Scroll Court cross-examination">
        ${getPhilosopherMarkup()}
        <div class="sc-modal-badge">Scroll Court Cross-Examination</div>
        <p class="sc-modal-quote">${state.lastQuote || getRandomQuote()}</p>
        <p class="sc-modal-loading">The court is reviewing captions, frame evidence, and metadata...</p>
        <p class="sc-modal-stats">Shorts: ${state.watchedCount} | Wisdom: ${state.wisdom} | ${getRank(state.wisdom)}</p>
      </div>
    `;
    document.documentElement.appendChild(overlay);
    overlay.querySelector(".sc-philosopher-img")?.addEventListener("error", (event) => {
      event.currentTarget.style.display = "none";
    });

    try {
      await flushCaptions(activeVideoId);
      const selectedEvidence = selectEvidenceForJudgment();

      if (!selectedEvidence) {
        await dismissOverlay(overlay);
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "SCROLL_COURT_GENERATE_QUIZ",
        payload: {
          demoPassword: state.demoPassword,
          selectedEvidence,
          recentEvidence: state.recentEvidence || [],
          sessionTopics: state.sessionTopics || [],
          roastIntensity: state.roastIntensity || "medium",
          wisdom: state.wisdom,
          watchedCount: state.watchedCount
        }
      });

      if (response?.status === 401) {
        fillLockedOverlay(overlay);
      } else if (
        response?.ok &&
        typeof response.data?.question === "string" &&
        Array.isArray(response.data?.answers)
      ) {
        fillQuizInOverlay(overlay, response.data);
      } else {
        fillQuizInOverlay(overlay, getFallbackQuiz());
      }
    } catch {
      fillQuizInOverlay(overlay, getFallbackQuiz());
    } finally {
      quizFetchInProgress = false;
    }
  }

  function render() {
    if (!panelRoot) return;
    if (!isShortsUrl()) {
      panelRoot.innerHTML = "";
      return;
    }

    const quote = state.lastQuote || QUOTES[state.watchedCount % QUOTES.length];
    const topics = (state.sessionTopics || []).length
      ? state.sessionTopics.join(", ")
      : "evidence pending";
    const evidenceStrength = selectEvidenceForJudgment()?.evidenceStrength || "weak";

    panelRoot.innerHTML = `
      <section class="sc-panel ${state.enabled ? "" : "sc-closed"}" aria-label="Scroll Court panel">
        <header class="sc-header">
          <div class="sc-title">
            <strong>Scroll Court</strong>
            <span>${state.enabled ? "Court is in session" : "Court dismissed"}</span>
          </div>
          <button class="sc-icon-button" id="sc-toggle" type="button" title="${state.enabled ? "Collapse panel" : "Open panel"}">${state.enabled ? "-" : "+"}</button>
        </header>
        <div class="sc-body">
          <div class="sc-stats">
            <div class="sc-stat"><span>Shorts</span><strong>${state.watchedCount}</strong></div>
            <div class="sc-stat"><span>Wisdom</span><strong>${state.wisdom}</strong></div>
            <div class="sc-stat"><span>Rank</span><strong>${getRank(state.wisdom)}</strong></div>
          </div>
          <div class="sc-quote">${quote}</div>
          <p class="sc-muted">Wisdom is your session score for surviving court interrogations.</p>
          <p class="sc-muted">Uses captions, visible-frame analysis, and session metadata.</p>
          ${FEEDBACK_TEST_EVERY_SHORT ? '<p class="sc-muted">Feedback test mode: summons appears on every Short.</p>' : ""}
          <p class="sc-muted">${state.sessionEnded ? "Session ended. Receipt is ready for the archive." : getSummonsCopy()}</p>
          <p class="sc-muted">Evidence collected: ${topics} (${evidenceStrength})</p>
          <div class="sc-actions">
            <button class="sc-button" id="sc-end-session" type="button">End Session</button>
            <button class="sc-button sc-secondary" id="sc-reset" type="button">Reset</button>
          </div>
          <div class="sc-receipt" id="sc-receipt"></div>
        </div>
      </section>
    `;

    panelRoot.querySelector("#sc-toggle")?.addEventListener("click", async () => {
      await storageSet({ enabled: !state.enabled });
      render();
    });

    panelRoot.querySelector("#sc-reset")?.addEventListener("click", async () => {
      activeVideoId = "";
      captionBuffer = [];
      frameAnalysisCounts.clear();
      await storageSet({
        watchedCount: 0,
        wisdom: 50,
        quizCount: 0,
        lastQuizAt: 0,
        nextJudgmentAt: 0,
        recentEvidence: [],
        sessionTopics: [],
        lastQuote: "",
        sessionEnded: false,
        lastShortUrl: isShortsUrl() ? location.href : ""
      });
      await scheduleNextJudgment();
      render();
    });

    panelRoot.querySelector("#sc-end-session")?.addEventListener("click", endSession);
  }

  async function endSession() {
    await flushCaptions(activeVideoId);
    await storageSet({ sessionEnded: true });

    const receipt = panelRoot?.querySelector("#sc-receipt");
    if (!receipt) return;
    receipt.classList.add("sc-visible");
    receipt.textContent = "Session ended. The philosophers are writing your receipt...";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SCROLL_COURT_GENERATE_RECEIPT",
        payload: {
          demoPassword: state.demoPassword,
          watchedCount: state.watchedCount,
          wisdom: state.wisdom,
          rank: getRank(state.wisdom),
          quizCount: state.quizCount,
          recentEvidence: state.recentEvidence || [],
          sessionTopics: state.sessionTopics || [],
          roastIntensity: state.roastIntensity || "medium"
        }
      });

      receipt.textContent = response?.status === 401
        ? "Enter the demo password in the extension popup to unlock the court."
        : response?.data?.receipt || fallbackReceipt();
    } catch {
      receipt.textContent = fallbackReceipt();
    }
  }

  async function countCurrentShort() {
    if (!state.enabled || state.sessionEnded || !isShortsUrl()) return;

    const currentUrl = location.href.split("?")[0];
    const meta = extractVideoMeta();
    if (!meta.videoId || currentUrl === state.lastShortUrl) return;

    if (activeVideoId && activeVideoId !== meta.videoId) {
      await flushCaptions(activeVideoId);
      captionBuffer = [];
    }

    activeVideoId = meta.videoId;
    const lastQuote = getRandomQuote();
    await upsertEvidence({
      ...meta,
      captions: "",
      createdAt: Date.now()
    });
    await storageSet({
      watchedCount: state.watchedCount + 1,
      lastShortUrl: currentUrl,
      lastQuote
    });

    if (!state.nextJudgmentAt) {
      await scheduleNextJudgment();
    }

    analyzeFramesForVideo(meta);
    render();
    renderOverlay();
  }

  function watchUrlChanges() {
    let previousUrl = location.href;
    setInterval(() => {
      if (location.href !== previousUrl) {
        previousUrl = location.href;
        countCurrentShort();
      }
    }, 700);
  }

  async function init() {
    if (document.getElementById("scroll-court-root")) return;

    const storedState = await storageGet();
    state = {
      ...storedState,
      watchedCount: 0,
      wisdom: 50,
      quizCount: 0,
      lastShortUrl: "",
      lastQuizAt: 0,
      nextJudgmentAt: 0,
      recentEvidence: [],
      sessionTopics: [],
      lastQuote: "",
      sessionEnded: false
    };
    await storageSet(state);
    if (!state.nextJudgmentAt) {
      await scheduleNextJudgment();
    }

    panelRoot = document.createElement("div");
    panelRoot.id = "scroll-court-root";
    document.documentElement.appendChild(panelRoot);

    document.addEventListener("keydown", blockNavKeys, true);
    document.addEventListener("wheel", blockWheel, { capture: true, passive: false });

    render();
    renderOverlay();
    countCurrentShort();
    watchUrlChanges();
    setInterval(collectCaptions, 1000);

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) return;
      state = { ...defaultState, ...changes[STORAGE_KEY].newValue };
      render();
    });
  }

  init();
})();
