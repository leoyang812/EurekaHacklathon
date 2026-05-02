(() => {
  const STORAGE_KEY = "scrollCourtState";
  const RANKS = [
    { min: 90, name: "Oracle of Restraint" },
    { min: 70, name: "Stoic Swipe Survivor" },
    { min: 50, name: "Apprentice Philosopher" },
    { min: 25, name: "Court Jester of Focus" },
    { min: -999, name: "Doomscroll Defendant" }
  ];
  const QUOTES = [
    "Socrates objects: you have watched, yet you cannot testify.",
    "Plato saw the cave. You saw three cooking clips and a prank.",
    "Marcus Aurelius whispers: the feed is endless, your attention is not.",
    "Aristotle requests evidence that you remember the previous Short.",
    "Diogenes has entered the courtroom carrying only judgment.",
    "Sun Tzu observes: you know your enemy's algorithm far better than yourself.",
    "Confucius says: he who swipes without purpose arrives at confusion."
  ];
  const QUIZZES = [
    {
      question: "The court asks: what did your last few Shorts mostly contain?",
      answers: [
        { text: "I can name the topic", delta: 12 },
        { text: "A blur of edits and noise", delta: -8 },
        { text: "I plead algorithmic confusion", delta: -4 }
      ]
    },
    {
      question: "How intentional was that last swipe?",
      answers: [
        { text: "Intentional. I chose the chaos.", delta: 6 },
        { text: "My thumb acted alone", delta: -10 },
        { text: "I was spiritually buffering", delta: -5 }
      ]
    },
    {
      question: "Can you recall one useful detail from this session?",
      answers: [
        { text: "Yes, surprisingly", delta: 14 },
        { text: "Only the sound effect", delta: -6 },
        { text: "The defendant remembers nothing", delta: -12 }
      ]
    },
    {
      question: "Would Socrates be proud of your last 3 minutes?",
      answers: [
        { text: "He would nod, reluctantly", delta: 8 },
        { text: "He would ask probing questions", delta: -3 },
        { text: "He would leave the courtroom", delta: -10 }
      ]
    }
  ];

  const defaultState = {
    enabled: true,
    apiBase: "http://localhost:3000",
    watchedCount: 0,
    wisdom: 50,
    quizCount: 0,
    lastShortUrl: "",
    lastQuizAt: 0
  };

  let state = { ...defaultState };
  let panelRoot;
  let quizIndex = 0;
  let overlayActive = false;

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

  function isShortsUrl() {
    return location.hostname === "www.youtube.com" && location.pathname.startsWith("/shorts/");
  }

  function isQuizPending() {
    return (
      state.enabled &&
      state.watchedCount > 0 &&
      state.watchedCount % 3 === 0 &&
      state.lastQuizAt !== state.watchedCount
    );
  }

  function getCurrentVideoTitle() {
    const el =
      document.querySelector("ytd-reel-video-renderer[is-active] .title") ||
      document.querySelector("#shorts-container .title") ||
      document.querySelector("h2.title yt-formatted-string") ||
      document.title.replace(" - YouTube", "").trim();
    return typeof el === "string" ? el : el?.textContent?.trim() || "";
  }

  function fallbackReceipt() {
    return [
      "SCROLL COURT RECEIPT",
      `Shorts watched: ${state.watchedCount}`,
      `Wisdom rating: ${state.wisdom}/100`,
      `Rank: ${getRank(state.wisdom)}`,
      "",
      "Verdict: The defendant entered YouTube Shorts for one video and emerged several swipes later with the confidence of a scholar and the memory of a loading spinner.",
      "",
      "Sentence: Close the tab, drink water, and pretend Marcus Aurelius did not see this."
    ].join("\n");
  }

  // --- Scroll lock ---

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

  function blockNavKeys(e) {
    if (overlayActive && ["ArrowUp", "ArrowDown", " ", "k", "j"].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function blockWheel(e) {
    if (overlayActive) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // --- Blocking quiz overlay ---

  function renderOverlay() {
    const existing = document.getElementById("sc-overlay");

    if (!isShortsUrl() || !isQuizPending()) {
      if (existing) {
        existing.remove();
        unlockScroll();
      }
      return;
    }

    if (existing) return; // overlay is already showing, wait for answer

    lockScroll();

    const overlay = document.createElement("div");
    overlay.id = "sc-overlay";

    const currentQuiz = QUIZZES[quizIndex % QUIZZES.length];
    const quote = QUOTES[state.watchedCount % QUOTES.length];

    overlay.innerHTML = `
      <div class="sc-modal" role="dialog" aria-modal="true" aria-label="Scroll Court interruption">
        <div class="sc-modal-badge">⚖️ Scroll Court</div>
        <p class="sc-modal-quote">${quote}</p>
        <strong class="sc-modal-question">${currentQuiz.question}</strong>
        <div class="sc-modal-answers">
          ${currentQuiz.answers
            .map(
              (answer, index) =>
                `<button class="sc-modal-answer" type="button" data-answer="${index}">${answer.text}</button>`
            )
            .join("")}
        </div>
        <p class="sc-modal-stats">Shorts: ${state.watchedCount} · Wisdom: ${state.wisdom} · ${getRank(state.wisdom)}</p>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    overlay.querySelectorAll(".sc-modal-answer").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const answer = currentQuiz.answers[Number(btn.getAttribute("data-answer"))];
        quizIndex += 1;
        await storageSet({
          wisdom: clampWisdom(state.wisdom + answer.delta),
          quizCount: state.quizCount + 1,
          lastQuizAt: state.watchedCount
        });
        overlay.remove();
        unlockScroll();
        render();
      });
    });
  }

  // --- Side panel ---

  function render() {
    if (!panelRoot) return;

    if (!isShortsUrl()) {
      panelRoot.innerHTML = "";
      return;
    }

    const quote = QUOTES[state.watchedCount % QUOTES.length];
    const nextQuizAt = Math.ceil((state.watchedCount + 1) / 3) * 3;

    panelRoot.innerHTML = `
      <section class="sc-panel ${state.enabled ? "" : "sc-closed"}" aria-label="Scroll Court panel">
        <header class="sc-header">
          <div class="sc-title">
            <strong>Scroll Court</strong>
            <span>${state.enabled ? "Court is in session" : "Court dismissed"}</span>
          </div>
          <button class="sc-icon-button" id="sc-toggle" type="button" title="${state.enabled ? "Collapse panel" : "Open panel"}">${state.enabled ? "−" : "+"}</button>
        </header>
        <div class="sc-body">
          <div class="sc-stats">
            <div class="sc-stat"><span>Shorts</span><strong>${state.watchedCount}</strong></div>
            <div class="sc-stat"><span>Wisdom</span><strong>${state.wisdom}</strong></div>
            <div class="sc-stat"><span>Rank</span><strong>${getRank(state.wisdom)}</strong></div>
          </div>
          <div class="sc-quote">${quote}</div>
          <p class="sc-muted">Next judgment at ${nextQuizAt} Shorts.</p>
          <div class="sc-actions">
            <button class="sc-button" id="sc-judge" type="button">Face Judgment</button>
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
      await storageSet({
        watchedCount: 0,
        wisdom: 50,
        quizCount: 0,
        lastQuizAt: 0,
        lastShortUrl: isShortsUrl() ? location.href : ""
      });
      render();
    });

    panelRoot.querySelector("#sc-judge")?.addEventListener("click", showReceipt);
  }

  async function showReceipt() {
    const receipt = panelRoot?.querySelector("#sc-receipt");
    if (!receipt) return;

    receipt.classList.add("sc-visible");
    receipt.textContent = "The philosophers are reviewing the evidence…";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SCROLL_COURT_GENERATE_RECEIPT",
        payload: {
          watchedCount: state.watchedCount,
          wisdom: state.wisdom,
          rank: getRank(state.wisdom),
          quizCount: state.quizCount,
          videoTitle: getCurrentVideoTitle()
        }
      });

      receipt.textContent = response?.data?.receipt || fallbackReceipt();
    } catch {
      receipt.textContent = fallbackReceipt();
    }
  }

  async function countCurrentShort() {
    if (!state.enabled || !isShortsUrl()) return;

    const currentUrl = location.href.split("?")[0];
    if (currentUrl === state.lastShortUrl) return;

    await storageSet({
      watchedCount: state.watchedCount + 1,
      lastShortUrl: currentUrl
    });

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

    state = await storageGet();

    panelRoot = document.createElement("div");
    panelRoot.id = "scroll-court-root";
    document.documentElement.appendChild(panelRoot);

    document.addEventListener("keydown", blockNavKeys, true);
    document.addEventListener("wheel", blockWheel, { capture: true, passive: false });

    render();
    renderOverlay();
    countCurrentShort();
    watchUrlChanges();

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) return;
      state = { ...defaultState, ...changes[STORAGE_KEY].newValue };
      render();
      renderOverlay();
    });
  }

  init();
})();
