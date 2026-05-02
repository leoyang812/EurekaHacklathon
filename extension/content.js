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

  const defaultState = {
    enabled: true,
    apiBase: "http://localhost:3000",
    watchedCount: 0,
    wisdom: 50,
    quizCount: 0,
    lastShortUrl: "",
    lastQuizAt: 0,
    recentVideos: []
  };

  let state = { ...defaultState };
  let panelRoot;
  let overlayActive = false;
  let quizFetchInProgress = false;

  // ─── Storage ───────────────────────────────────────────────

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

  // ─── Helpers ───────────────────────────────────────────────

  function getRank(wisdom) {
    return RANKS.find((r) => wisdom >= r.min).name;
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

  function fallbackReceipt() {
    return [
      "SCROLL COURT RECEIPT",
      `Shorts watched: ${state.watchedCount}`,
      `Wisdom rating: ${state.wisdom}/100`,
      `Rank: ${getRank(state.wisdom)}`,
      "",
      "Verdict: The defendant entered YouTube Shorts seeking one harmless video and returned with the stunned expression of a philosopher who just discovered infinite scroll.",
      "",
      "Sentence: Close the tab, drink water, and pretend Marcus Aurelius did not see this."
    ].join("\n");
  }

  // ─── Video metadata extraction ─────────────────────────────

  function extractVideoMeta() {
    const videoId = location.pathname.split("/shorts/")[1]?.split("?")[0] || "";

    // document.title is the most reliable source — YouTube updates it on SPA nav
    const title = document.title.replace(/\s*[-–|]\s*YouTube\s*$/i, "").trim();

    // Channel name — try multiple selectors since YouTube's DOM changes often
    let channel = "";
    const channelCandidates = [
      document.querySelector("ytd-reel-video-renderer[is-active] #channel-name a"),
      document.querySelector("ytd-reel-video-renderer[is-active] .ytd-channel-name"),
      document.querySelector(".ytd-reel-player-overlay-renderer #channel-name a"),
      document.querySelector("#owner-name a"),
      document.querySelector("a.yt-simple-endpoint.ytd-channel-name")
    ];
    for (const el of channelCandidates) {
      const text = el?.textContent?.trim();
      if (text) { channel = text; break; }
    }

    return { videoId, title: title || "", channel };
  }

  // ─── Scroll lock ───────────────────────────────────────────

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

  // ─── Quiz overlay ──────────────────────────────────────────

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
      const btn = document.createElement("button");
      btn.className = "sc-modal-answer";
      btn.type = "button";
      btn.textContent = answer.text;

      btn.addEventListener("click", async () => {
        // Disable all buttons immediately to prevent double-click
        answersEl
          .querySelectorAll(".sc-modal-answer")
          .forEach((b) => { b.disabled = true; });

        btn.classList.add(answer.correct ? "sc-answer-correct" : "sc-answer-wrong");

        // Show the correct answer if they got it wrong
        if (!answer.correct) {
          answersEl.querySelectorAll(".sc-modal-answer").forEach((b) => {
            const isCorrect = quiz.answers[
              [...answersEl.querySelectorAll(".sc-modal-answer")].indexOf(b)
            ]?.correct;
            if (isCorrect) b.classList.add("sc-answer-reveal");
          });
        }

        const delta = answer.correct ? 15 : -12;
        await storageSet({
          wisdom: clampWisdom(state.wisdom + delta),
          quizCount: state.quizCount + 1,
          lastQuizAt: state.watchedCount
        });

        setTimeout(() => {
          overlay.remove();
          unlockScroll();
          render();
        }, 1100);
      });

      answersEl.appendChild(btn);
    });

    modal.insertBefore(answersEl, statsEl);
  }

  async function renderOverlay() {
    const existing = document.getElementById("sc-overlay");

    if (!isShortsUrl() || !isQuizPending()) {
      if (existing) { existing.remove(); unlockScroll(); }
      return;
    }

    if (existing || quizFetchInProgress) return;

    lockScroll();
    quizFetchInProgress = true;

    const overlay = document.createElement("div");
    overlay.id = "sc-overlay";

    const quote = QUOTES[state.watchedCount % QUOTES.length];

    overlay.innerHTML = `
      <div class="sc-modal" role="dialog" aria-modal="true" aria-label="Scroll Court quiz">
        <div class="sc-modal-badge">⚖️ Scroll Court</div>
        <p class="sc-modal-quote">${quote}</p>
        <p class="sc-modal-loading">The court is deliberating…</p>
        <p class="sc-modal-stats">Shorts: ${state.watchedCount} · Wisdom: ${state.wisdom} · ${getRank(state.wisdom)}</p>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SCROLL_COURT_GENERATE_QUIZ",
        payload: {
          recentVideos: state.recentVideos || [],
          wisdom: state.wisdom,
          watchedCount: state.watchedCount
        }
      });

      if (
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
    }

    quizFetchInProgress = false;
  }

  function getFallbackQuiz() {
    const FALLBACKS = [
      {
        question: "The court asks: what did your last few Shorts mostly contain?",
        answers: [
          { text: "I can name the topic", correct: true },
          { text: "A blur of edits and noise", correct: false },
          { text: "I plead algorithmic confusion", correct: false }
        ]
      },
      {
        question: "How intentional was that last swipe?",
        answers: [
          { text: "Intentional. I chose the chaos.", correct: true },
          { text: "My thumb acted alone", correct: false },
          { text: "I was spiritually buffering", correct: false }
        ]
      },
      {
        question: "Would Socrates be proud of your last 3 minutes?",
        answers: [
          { text: "He would nod, reluctantly", correct: true },
          { text: "He would ask probing questions", correct: false },
          { text: "He would leave the courtroom", correct: false }
        ]
      }
    ];
    return FALLBACKS[state.watchedCount % FALLBACKS.length];
  }

  // ─── Side panel ────────────────────────────────────────────

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
        recentVideos: [],
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
          videoTitle: (state.recentVideos || []).at(-1)?.title || ""
        }
      });

      receipt.textContent = response?.data?.receipt || fallbackReceipt();
    } catch {
      receipt.textContent = fallbackReceipt();
    }
  }

  // ─── Short counting + metadata ─────────────────────────────

  async function countCurrentShort() {
    if (!state.enabled || !isShortsUrl()) return;

    const currentUrl = location.href.split("?")[0];
    if (currentUrl === state.lastShortUrl) return;

    const meta = extractVideoMeta();
    const recentVideos = [...(state.recentVideos || []), meta].slice(-5);

    await storageSet({
      watchedCount: state.watchedCount + 1,
      lastShortUrl: currentUrl,
      recentVideos
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

  // ─── Init ──────────────────────────────────────────────────

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
    });
  }

  init();
})();
