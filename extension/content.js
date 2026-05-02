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
    "Diogenes has entered the courtroom carrying only judgment."
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
    }
  ];

  const defaultState = {
    enabled: true,
    unlocked: false,
    demoPassword: "",
    watchedCount: 0,
    wisdom: 50,
    quizCount: 0,
    lastShortUrl: "",
    lastQuizAt: 0
  };

  let state = { ...defaultState };
  let root;
  let quizIndex = 0;

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

  function render() {
    if (!root) return;

    if (!isShortsUrl()) {
      root.innerHTML = "";
      return;
    }

    const currentQuiz = QUIZZES[quizIndex % QUIZZES.length];
    const showQuiz = state.enabled && state.watchedCount > 0 && state.watchedCount % 3 === 0 && state.lastQuizAt !== state.watchedCount;
    const quote = QUOTES[state.watchedCount % QUOTES.length];

    root.innerHTML = `
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
          ${
            showQuiz
              ? `<div class="sc-quiz">
                  <strong>${currentQuiz.question}</strong>
                  ${currentQuiz.answers
                    .map((answer, index) => `<button class="sc-answer" type="button" data-answer="${index}">${answer.text}</button>`)
                    .join("")}
                </div>`
              : `<p class="sc-muted">Next judgment at ${Math.ceil((state.watchedCount + 1) / 3) * 3} Shorts.</p>`
          }
          <div class="sc-actions">
            <button class="sc-button" id="sc-judge" type="button">Face Judgment</button>
            <button class="sc-button sc-secondary" id="sc-reset" type="button">Reset</button>
          </div>
          <div class="sc-receipt" id="sc-receipt"></div>
        </div>
      </section>
    `;

    root.querySelector("#sc-toggle")?.addEventListener("click", async () => {
      await storageSet({ enabled: !state.enabled });
      render();
    });

    root.querySelector("#sc-reset")?.addEventListener("click", async () => {
      await storageSet({
        watchedCount: 0,
        wisdom: 50,
        quizCount: 0,
        lastQuizAt: 0,
        lastShortUrl: isShortsUrl() ? location.href : ""
      });
      render();
    });

    root.querySelectorAll(".sc-answer").forEach((button) => {
      button.addEventListener("click", async () => {
        const answer = currentQuiz.answers[Number(button.getAttribute("data-answer"))];
        quizIndex += 1;
        await storageSet({
          wisdom: clampWisdom(state.wisdom + answer.delta),
          quizCount: state.quizCount + 1,
          lastQuizAt: state.watchedCount
        });
        render();
      });
    });

    root.querySelector("#sc-judge")?.addEventListener("click", showReceipt);
  }

  async function showReceipt() {
    const receipt = root?.querySelector("#sc-receipt");
    if (!receipt) return;

    receipt.classList.add("sc-visible");
    receipt.textContent = "The philosophers are reviewing the evidence...";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SCROLL_COURT_GENERATE_RECEIPT",
        payload: {
          demoPassword: state.demoPassword,
          watchedCount: state.watchedCount,
          wisdom: state.wisdom,
          rank: getRank(state.wisdom),
          quizCount: state.quizCount
        }
      });

      receipt.textContent = response?.data?.receipt || fallbackReceipt();
    } catch (error) {
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
  }

  function watchUrlChanges() {
    let previousUrl = location.href;
    setInterval(() => {
      if (location.href !== previousUrl) {
        previousUrl = location.href;
        render();
        countCurrentShort();
      }
    }, 700);
  }

  async function init() {
    if (document.getElementById("scroll-court-root")) return;

    state = await storageGet();
    root = document.createElement("div");
    root.id = "scroll-court-root";
    document.documentElement.appendChild(root);

    render();
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
