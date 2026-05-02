(() => {
  const STORAGE_KEY = "scrollCourtState";
  const MAX_EVIDENCE_ITEMS = 10;
  const MAX_CAPTION_CHARS = 1500;
  const FEEDBACK_TEST_EVERY_SHORT = true;
  const MAX_FRAME_ANALYSES_PER_SHORT = 5;
  const FRAME_ANALYSIS_INTERVAL_MS = 2000;
  const FIRST_FRAME_ANALYSIS_DELAY_MS = 1500;
  const MIN_WATCH_DWELL_MS = 3000;
  const JUDGMENT_MIN_SHORTS = 4;
  const JUDGMENT_MAX_SHORTS = 5;
  const JUMPSCARE_SOUND = "assets/sound/lordsonny-cinematic-hit-159487.mp3";
  const JUMPSCARE_DURATION_MS = 2000;
  const JUMPSCARE_IMAGES = [
    "assets/Images/socrates-jumpscare.png",
    "assets/Images/socrates-jumpscare2.png",
    "assets/Images/socrates-jumpscare3.png"
  ];

  const COURT_QUOTES = [
    { philosopher: "Socrates", text: '"If scrolling is your power, then what are you without it?" - Socrates' },
    { philosopher: "Socrates", text: '"The unexamined short is not worth watching." - Socrates' },
    { philosopher: "Sun Tzu", text: '"If scrolling is sure to result in victory, then you must scroll." - Sun Tzu' },
    { philosopher: "Aristotle", text: "Aristotle identified three causes of your downfall: autoplay, boredom, and one guy making pasta at 2x speed." },
    { philosopher: "Socrates", text: "The unexamined scroll is not worth swiping." },
    { philosopher: "Diogenes", text: "Diogenes inspected your thumb's testimony. It was not flattering." },
    { philosopher: "Socrates", text: "Socrates asked for a definition of productivity. The court records show silence." },
    { philosopher: "Diogenes", text: "Diogenes brought a lantern to find your focus. He found three gym edits and a prank." },
    { philosopher: "Plato", text: "Plato left the cave. You opened another Short." },
    { philosopher: "Marcus Aurelius", text: "Marcus Aurelius notes that attention is a choice made one moment at a time." }
  ];
  const QUOTES = COURT_QUOTES.map((quote) => quote.text);
  const WRONG_FEEDBACK_QUOTES = [
    { philosopher: "Socrates", text: "You watched it. Tell me: what did you actually understand?", use: "default" },
    { philosopher: "Socrates", text: "If you cannot answer, were you ever paying attention?", use: "default" },
    { philosopher: "Socrates", text: "You say you saw it. Then why can you not explain it?", use: "default" },
    { philosopher: "Socrates", text: "Is it knowledge you seek, or simply motion?", use: "mid" },
    { philosopher: "Socrates", text: "If scrolling is your power, why does it control you?", use: "strong" },
    { philosopher: "Diogenes", text: "I searched for thought. I found you watching clips.", use: "streak" },
    { philosopher: "Diogenes", text: "You consume endlessly. You produce nothing.", use: "streak" },
    { philosopher: "Diogenes", text: "Even a dog remembers what it sees.", use: "harsh" },
    { philosopher: "Diogenes", text: "I owned nothing. You have everything, and still this?", use: "harsh" },
    { philosopher: "Diogenes", text: "You scroll like a king. Yet rule nothing.", use: "harsh" },
    { philosopher: "Plato", text: "You stare at shadows, and call it understanding.", use: "default" },
    { philosopher: "Plato", text: "You left reality, only to enter another illusion.", use: "default" },
    { philosopher: "Plato", text: "The screen shows you movement. Your mind remains still.", use: "mid" },
    { philosopher: "Plato", text: "You mistake appearance for truth.", use: "mid" },
    { philosopher: "Plato", text: "You watch reflections, and believe you have learned.", use: "strong" },
    { philosopher: "Aristotle", text: "The mind is meant to think. Yours scrolls.", use: "default" },
    { philosopher: "Aristotle", text: "You gathered information. None became knowledge.", use: "default" },
    { philosopher: "Aristotle", text: "You observed the act, but not its meaning.", use: "mid" },
    { philosopher: "Aristotle", text: "Your attention exists. You simply misused it.", use: "mid" },
    { philosopher: "Aristotle", text: "You chose consumption over understanding.", use: "strong" },
    { philosopher: "Marcus Aurelius", text: "You had control. You chose not to use it.", use: "default" },
    { philosopher: "Marcus Aurelius", text: "Your attention was yours. Until you gave it away.", use: "default" },
    { philosopher: "Marcus Aurelius", text: "You let distraction win without resistance.", use: "mid" },
    { philosopher: "Marcus Aurelius", text: "You were present. But not awake.", use: "mid" },
    { philosopher: "Marcus Aurelius", text: "You lost nothing. Yet gained even less.", use: "strong" }
  ];
  const RIGHT_FEEDBACK_QUOTES = [
    { philosopher: "Socrates", text: "You answered correctly. But do you understand why?", use: "default" },
    { philosopher: "Socrates", text: "You noticed. Will you remember?", use: "default" },
    { philosopher: "Socrates", text: "You saw it. Most do not.", use: "default" },
    { philosopher: "Socrates", text: "You are aware. For now.", use: "mid" },
    { philosopher: "Socrates", text: "You understood this moment. What about the next?", use: "strong" },
    { philosopher: "Plato", text: "You looked past the illusion. Briefly.", use: "default" },
    { philosopher: "Plato", text: "You saw more than shadows. Do not return to them.", use: "default" },
    { philosopher: "Plato", text: "You recognized the image. Not yet the truth.", use: "mid" },
    { philosopher: "Plato", text: "Awareness is the first step out of the cave.", use: "mid" },
    { philosopher: "Plato", text: "You glimpsed reality. It did not last long.", use: "strong" },
    { philosopher: "Aristotle", text: "Your mind performed its function. Momentarily.", use: "default" },
    { philosopher: "Aristotle", text: "You understood. Now apply it.", use: "default" },
    { philosopher: "Aristotle", text: "You processed what you saw. That is rare here.", use: "mid" },
    { philosopher: "Aristotle", text: "Knowledge appeared. Will it remain?", use: "mid" },
    { philosopher: "Aristotle", text: "You used your attention correctly. Once.", use: "strong" },
    { philosopher: "Marcus Aurelius", text: "You were attentive. Continue.", use: "default" },
    { philosopher: "Marcus Aurelius", text: "A moment of clarity. Do not waste it.", use: "default" },
    { philosopher: "Marcus Aurelius", text: "You acted with awareness. That is enough.", use: "mid" },
    { philosopher: "Marcus Aurelius", text: "You did what was within your control.", use: "mid" },
    { philosopher: "Marcus Aurelius", text: "You remained present. Few do.", use: "strong" },
    { philosopher: "Sun Tzu", text: "You saw the pattern. The algorithm did not win.", use: "default" },
    { philosopher: "Sun Tzu", text: "You observed without losing control.", use: "default" },
    { philosopher: "Sun Tzu", text: "You understood the signal, not just the noise.", use: "mid" },
    { philosopher: "Sun Tzu", text: "Discipline appeared. Maintain it.", use: "mid" },
    { philosopher: "Sun Tzu", text: "You resisted distraction. Briefly.", use: "strong" }
  ];
  const TOPIC_FEEDBACK_QUOTES = {
    fitness: [
      { philosopher: "Aristotle", text: "Training the body is simpler than training attention.", use: "topic" },
      { philosopher: "Marcus Aurelius", text: "Strength without awareness is merely motion.", use: "topic" }
    ],
    food: [
      { philosopher: "Diogenes", text: "You remember the feast. Do you remember the point?", use: "topic" },
      { philosopher: "Aristotle", text: "Appetite noticed. Understanding pending.", use: "topic" }
    ],
    gaming: [
      { philosopher: "Sun Tzu", text: "You saw the game. Did you study the strategy?", use: "topic" },
      { philosopher: "Plato", text: "Another simulation. Another shadow.", use: "topic" }
    ],
    brainrot: [
      { philosopher: "Diogenes", text: "The empire declines one sound effect at a time.", use: "topic" },
      { philosopher: "Socrates", text: "Define rizz. Then define your purpose.", use: "topic" }
    ],
    sports: [
      { philosopher: "Sun Tzu", text: "You saw the contest. Did you notice the tactic?", use: "topic" },
      { philosopher: "Aristotle", text: "The action was visible. The cause was harder.", use: "topic" }
    ]
  };
  const SUMMONS_COPY = [
    "The court may summon you at any moment.",
    "Judgment arrives when recall fails.",
    "Summons timing: sealed by the court.",
    "The philosophers are watching the pattern, not the clock."
  ];
  const PHILOSOPHERS = [
    {
      name: "Socrates",
      fallback: "S",
      assets: {
        default: "assets/Images/socrates1.jpg",
        intense: "assets/Images/socrates2.jpg",
        harsh: "assets/Images/socrates3.jpg"
      }
    },
    {
      name: "Plato",
      fallback: "P",
      assets: {
        default: "assets/Images/plato1.jpg",
        intense: "assets/Images/plato2.png",
        harsh: "assets/Images/plato2.png"
      }
    },
    {
      name: "Diogenes",
      fallback: "D",
      assets: {
        default: "assets/Images/diogenes1.jpg",
        intense: "assets/Images/diogenes2.jpg",
        harsh: "assets/Images/diogenes2.jpg"
      }
    },
    {
      name: "Aristotle",
      fallback: "A",
      assets: {
        default: "assets/Images/aristotle1.jpg",
        intense: "assets/Images/aristotle2.jpg",
        harsh: "assets/Images/aristotle2.jpg"
      }
    },
    {
      name: "Marcus Aurelius",
      fallback: "M",
      assets: {
        default: "assets/Images/marcus1.jpg",
        intense: "assets/Images/marcus2.jpg",
        harsh: "assets/Images/marcus2.jpg"
      }
    },
    {
      name: "Sun Tzu",
      fallback: "S",
      assets: {
        default: "assets/Images/suntzu1.jpg",
        intense: "assets/Images/suntzu2.jpg",
        harsh: "assets/Images/suntzu2.jpg"
      }
    }
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
  const defaultState = {
    enabled: true,
    apiBase: "http://localhost:3000",
    demoPassword: "",
    watchedCount: 0,
    totalWatchedCount: 0,
    wisdom: 50,
    quizCount: 0,
    sessionCorrectQuizCount: 0,
    sessionWrongQuizCount: 0,
    totalQuizCount: 0,
    correctQuizCount: 0,
    wrongQuizCount: 0,
    lastShortUrl: "",
    lastQuizAt: 0,
    nextJudgmentAt: 0,
    recentEvidence: [],
    sessionTopics: [],
    roastIntensity: "medium",
    lastQuote: "",
    lastPhilosopher: "",
    lastPhilosopherAsset: "",
    wrongStreak: 0,
    caseFileOpen: true,
    sessionEnded: false
  };

  let state = { ...defaultState };
  let panelRoot;
  let overlayActive = false;
  let quizFetchInProgress = false;
  let activeVideoId = "";
  let activeMeta = null;
  let activeVideoStartedAt = 0;
  let dwellTimer = null;
  let captionBuffer = [];
  const frameAnalysisCounts = new Map();
  const countedVideoIds = new Set();
  let pausedVideosForCourt = [];
  let shouldResumeVideoAfterCourt = false;
  let judgePanelVisibleUntil = 0;
  let judgePanelTimer = null;
  let judgePanelShouldPop = false;

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

  function getCourtMood(wisdom) {
    if (wisdom >= 85) return "Impressed";
    if (wisdom >= 65) return "Cautiously hopeful";
    if (wisdom >= 45) return "Watching closely";
    if (wisdom >= 25) return "Deeply suspicious";
    return "Preparing charges";
  }

  function clampWisdom(value) {
    return Math.max(0, Math.min(100, value));
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getRandomQuote() {
    return getRandomCourtQuote().text;
  }

  function getRandomCourtQuote() {
    return COURT_QUOTES[Math.floor(Math.random() * COURT_QUOTES.length)];
  }

  function pickItem(items, seed) {
    if (!items.length) return null;
    return items[Math.abs(seed) % items.length];
  }

  function getTopicFeedback(topics, seed) {
    const topic = (topics || []).find((item) => TOPIC_FEEDBACK_QUOTES[item]);
    return topic ? pickItem(TOPIC_FEEDBACK_QUOTES[topic], seed) : null;
  }

  function selectFeedbackQuote({ correct, wrongStreak, recallScore, topics }) {
    const seed = state.watchedCount + state.quizCount + wrongStreak + recallScore;
    const topicQuote = getTopicFeedback(topics, seed);

    if (correct) {
      let candidates = RIGHT_FEEDBACK_QUOTES.filter((quote) => quote.use === "default" || quote.use === "mid");
      if (recallScore >= 65) {
        candidates = RIGHT_FEEDBACK_QUOTES.filter((quote) =>
          ["Marcus Aurelius", "Aristotle", "Sun Tzu"].includes(quote.philosopher)
        );
      }
      if (recallScore >= 85) {
        candidates = candidates.filter((quote) => quote.use === "mid" || quote.use === "strong");
      }
      return topicQuote && recallScore >= 65 ? topicQuote : pickItem(candidates, seed);
    }

    if (wrongStreak >= 3) {
      const harsh = WRONG_FEEDBACK_QUOTES.filter((quote) =>
        ["Diogenes", "Plato", "Socrates"].includes(quote.philosopher) &&
        (quote.use === "harsh" || quote.use === "strong")
      );
      return pickItem(harsh, seed);
    }

    if (wrongStreak >= 2) {
      const streak = WRONG_FEEDBACK_QUOTES.filter((quote) =>
        ["Diogenes", "Plato", "Socrates"].includes(quote.philosopher) &&
        (quote.use === "streak" || quote.use === "mid" || quote.use === "strong")
      );
      return pickItem(streak, seed);
    }

    const candidates = WRONG_FEEDBACK_QUOTES.filter((quote) => quote.use === "default" || quote.use === "mid");
    return topicQuote && recallScore < 45 ? topicQuote : pickItem(candidates, seed);
  }

  function getFeedbackImageTone({ correct, quoteUse, wrongStreak, recallScore }) {
    if (!correct && (wrongStreak >= 3 || quoteUse === "harsh")) return "harsh";
    if (!correct && (wrongStreak >= 2 || quoteUse === "strong" || quoteUse === "streak")) return "intense";
    if (correct && (recallScore >= 85 || quoteUse === "strong")) return "intense";
    return "default";
  }

  function getPhilosopherForName(name) {
    return PHILOSOPHERS.find((item) => item.name === name);
  }

  function getDefaultPhilosopherAsset(name) {
    return getPhilosopherForName(name)?.assets?.default || "";
  }

  function getFeedbackAsset(feedback, context) {
    const philosopher = getPhilosopherForName(feedback?.philosopher);
    if (!philosopher) return "";
    const tone = getFeedbackImageTone({
      ...context,
      quoteUse: feedback?.use
    });
    return philosopher.assets?.[tone] || philosopher.assets?.default || "";
  }

  function getSummonsCopy() {
    return SUMMONS_COPY[state.watchedCount % SUMMONS_COPY.length];
  }

  function isShortsUrl() {
    return location.hostname === "www.youtube.com" && location.pathname.startsWith("/shorts/");
  }

  function registerShortsTabForCloseReport() {
    if (!isShortsUrl()) return;
    try {
      chrome.runtime.sendMessage({ type: "SCROLL_COURT_REGISTER_SHORTS_TAB" }, () => {});
    } catch {
      // Close-report registration is opportunistic.
    }
  }

  function extractVideoId() {
    return location.pathname.split("/shorts/")[1]?.split(/[/?#]/)[0] || "";
  }

  function getPhilosopherMarkup(
    preferredName = state.lastPhilosopher,
    preferredAsset = state.lastPhilosopherAsset,
    extraClass = ""
  ) {
    const philosopher =
      getPhilosopherForName(preferredName) ||
      PHILOSOPHERS[state.watchedCount % PHILOSOPHERS.length];
    const asset = preferredAsset || philosopher.assets?.default || "";
    const img = asset
      ? `<img class="sc-philosopher-img" src="${chrome.runtime.getURL(asset)}" alt="${philosopher.name}" />`
      : "";
    return `
      <div class="sc-philosopher ${extraClass}" aria-label="${philosopher.name}">
        ${img}
        <span class="sc-philosopher-fallback">${philosopher.fallback}</span>
      </div>
    `;
  }

  function getLogoMarkup(extraClass = "") {
    return `<img class="sc-brand-logo ${extraClass}" src="${chrome.runtime.getURL("assets/Images/Logo.png")}" alt="The Recall Trial" />`;
  }

  function hideBrokenPhilosopherImage(root = document) {
    root.querySelector(".sc-philosopher-img")?.addEventListener("error", (event) => {
      event.currentTarget.style.display = "none";
    });
    root.querySelector(".sc-brand-logo")?.addEventListener("error", (event) => {
      event.currentTarget.style.display = "none";
    });
  }

  function triggerJumpscare() {
    document.getElementById("sc-jumpscare")?.remove();

    const imagePath = JUMPSCARE_IMAGES[Math.floor(Math.random() * JUMPSCARE_IMAGES.length)];
    const scare = document.createElement("div");
    scare.id = "sc-jumpscare";
    scare.setAttribute("aria-hidden", "true");
    scare.innerHTML = `
      <img class="sc-jumpscare-img" src="${chrome.runtime.getURL(imagePath)}" alt="" />
      <div class="sc-jumpscare-flash"></div>
    `;
    document.documentElement.appendChild(scare);

    const audio = new Audio(chrome.runtime.getURL(JUMPSCARE_SOUND));
    audio.volume = 0.82;
    audio.play().catch(() => {
      // Some browser autoplay policies still block extension audio.
    });

    setTimeout(() => {
      scare.classList.add("sc-jumpscare-out");
    }, JUMPSCARE_DURATION_MS - 260);

    setTimeout(() => {
      scare.remove();
    }, JUMPSCARE_DURATION_MS);
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
    if ((item.captions || "").trim().length > 40) return "strong";
    if ((item.captions || "").trim().length > 10) return "medium";
    if ((item.frameSummary || "").trim().length > 8) return "medium";
    if ((item.frameTopics || []).length || (item.metadataTopics || []).length) return "medium";
    if ((item.title || "").trim().length > 8) return "medium";
    return "weak";
  }

  function getEvidenceStrengthMeta(strength) {
    const value = ["weak", "medium", "strong"].includes(strength) ? strength : "weak";
    const copy = {
      weak: {
        label: "Weak",
        verdict: "Quiz skipped",
        detail: "Not enough reliable evidence for an attention check."
      },
      medium: {
        label: "Medium",
        verdict: "Questionable but admissible",
        detail: "Enough title, topic, caption, or frame evidence to ask carefully."
      },
      strong: {
        label: "Strong",
        verdict: "Admissible evidence",
        detail: "Captions or clear context support a specific attention check."
      }
    };

    return { value, ...copy[value] };
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

  function hasEvidenceForQuiz(item) {
    if (!item) return false;
    if (item.evidenceStrength === "weak") return false;
    return Boolean(
      (item.captions || "").trim().length > 10 ||
      (item.frameSummary || "").trim().length > 8 ||
      (item.title || "").trim().length > 3 ||
      (item.metadataTopics || []).length ||
      (item.frameTopics || []).length
    );
  }

  function isQuizPending() {
    if (FEEDBACK_TEST_EVERY_SHORT) {
      return (
        state.enabled &&
        !state.sessionEnded &&
        state.watchedCount > 1 &&
        state.lastQuizAt !== state.watchedCount &&
        Boolean(selectEvidenceForJudgment())
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
    await storageSet({
      nextJudgmentAt: state.watchedCount + randomInt(JUDGMENT_MIN_SHORTS, JUDGMENT_MAX_SHORTS)
    });
  }

  function fallbackReceipt() {
    const topics = (state.sessionTopics || []).join(", ") || "unclassified internet fog";
    return [
      "THE RECALL TRIAL RECEIPT",
      `Charges: ${state.watchedCount} Shorts entered into evidence.`,
      `Evidence: ${topics}.`,
      `Recall Score: ${state.wisdom}/100. Trial mood: ${getCourtMood(state.wisdom)}.`,
      "",
      "Philosopher Verdict: Socrates asked what you learned. The record shows a long pause and one suspicious swipe.",
      "",
      "Sentence: Close the tab, drink water, and let Diogenes stop searching for your focus."
    ].join("\n");
  }

  function lockScroll() {
    overlayActive = true;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }

  function unlockScroll() {
    overlayActive = false;
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow-y");
    document.documentElement.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow-y");
  }

  function hasCourtOverlay() {
    const overlay = document.getElementById("sc-overlay");
    return Boolean(overlay && overlay.isConnected);
  }

  function ensureScrollUnlockedWithoutOverlay() {
    if (!hasCourtOverlay()) {
      unlockScroll();
      return true;
    }
    return false;
  }

  function getActiveVideoElements() {
    const activeRenderer = document.querySelector("ytd-reel-video-renderer[is-active]");
    const videos = [
      ...(activeRenderer ? [...activeRenderer.querySelectorAll("video")] : []),
      ...document.querySelectorAll("video")
    ];

    return [...new Set(videos)].filter((video) => video instanceof HTMLVideoElement);
  }

  function pauseActiveVideoForCourt() {
    const videos = getActiveVideoElements();
    pausedVideosForCourt = videos.filter((video) => !video.paused);
    shouldResumeVideoAfterCourt = pausedVideosForCourt.length > 0;

    if (!videos.length) {
      return;
    }

    videos.forEach((video) => video.pause());

    [80, 240, 600].forEach((delay) => {
      setTimeout(() => {
        if (!overlayActive) return;
        getActiveVideoElements().forEach((video) => video.pause());
      }, delay);
    });
  }

  function resumeVideoAfterCourt() {
    if (!shouldResumeVideoAfterCourt || !pausedVideosForCourt.length) return;

    const videos = [...pausedVideosForCourt];
    pausedVideosForCourt = [];
    shouldResumeVideoAfterCourt = false;

    videos.forEach((video) => {
      if (!document.documentElement.contains(video)) return;
      video.play().catch(() => {
        // Chrome may block playback after some user/extension interactions.
      });
    });
  }

  function blockNavKeys(event) {
    const panelDismissKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "j"];
    if (!hasCourtOverlay() && Date.now() < judgePanelVisibleUntil && panelDismissKeys.includes(event.key)) {
      hideTemporaryJudgePanel();
    }

    if (!hasCourtOverlay()) {
      unlockScroll();
      return;
    }
    if (["ArrowUp", "ArrowDown", " ", "k", "j"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function blockWheel(event) {
    if (panelRoot?.contains(event.target)) return;

    if (!hasCourtOverlay() && Date.now() < judgePanelVisibleUntil) {
      hideTemporaryJudgePanel();
    }

    if (!hasCourtOverlay()) {
      unlockScroll();
      return;
    }
    if (overlayActive) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function startScrollUnlockWatchdog() {
    setInterval(() => {
      const bodyLocked = document.body.style.overflow || document.body.style.overflowY;
      const htmlLocked = document.documentElement.style.overflow || document.documentElement.style.overflowY;
      if (!hasCourtOverlay() && (overlayActive || bodyLocked || htmlLocked)) {
        unlockScroll();
      }
    }, 300);
  }

  function keepPanelScrollInsideCourt(event) {
    event.stopPropagation();
  }

  function hideTemporaryJudgePanel() {
    if (!judgePanelVisibleUntil && !judgePanelShouldPop) return;
    judgePanelVisibleUntil = 0;
    judgePanelShouldPop = false;
    if (judgePanelTimer) clearTimeout(judgePanelTimer);
    judgePanelTimer = null;
    render();
  }

  function showTemporaryJudgePanel(durationMs = 3600) {
    judgePanelVisibleUntil = Number.isFinite(durationMs) ? Date.now() + durationMs : Number.POSITIVE_INFINITY;
    judgePanelShouldPop = true;
    if (judgePanelTimer) clearTimeout(judgePanelTimer);
    judgePanelTimer = null;
    if (!Number.isFinite(durationMs)) {
      render();
      return;
    }
    judgePanelTimer = setTimeout(() => {
      judgePanelVisibleUntil = 0;
      judgePanelTimer = null;
      judgePanelShouldPop = false;
      render();
    }, durationMs);
  }

  async function dismissOverlay(overlay) {
    await storageSet({
      lastQuizAt: FEEDBACK_TEST_EVERY_SHORT ? state.watchedCount : state.nextJudgmentAt
    });
    await scheduleNextJudgment();
    overlay.remove();
    unlockScroll();
    resumeVideoAfterCourt();
    render();
  }

  function dismissOverlayWithoutEvaluation(overlay) {
    overlay?.remove();
    unlockScroll();
    resumeVideoAfterCourt();
    render();
  }

  function dismissWeakEvidenceJudgment(overlay) {
    dismissOverlayWithoutEvaluation(overlay);
  }

  function dismissUnavailableQuizJudgment(overlay) {
    dismissOverlayWithoutEvaluation(overlay);
  }

  function fillQuizUnavailableOverlay(overlay, evidence) {
    const modal = overlay.querySelector(".sc-modal");
    const statsEl = modal?.querySelector(".sc-modal-stats");
    if (!modal || !statsEl) return dismissOverlayWithoutEvaluation(overlay);
    modal.querySelector(".sc-modal-loading")?.remove();

    const meta = getEvidenceStrengthMeta(evidence?.evidenceStrength || "weak");

    const badge = document.createElement("div");
    badge.className = `sc-evidence-pill sc-evidence-${meta.value}`;
    badge.textContent = `Evidence strength: ${meta.label}`;
    modal.insertBefore(badge, statsEl);

    const message = document.createElement("p");
    message.className = "sc-modal-question";
    message.textContent = "Court recess: the evidence was admissible, but the clerk could not prepare a fair question.";
    modal.insertBefore(message, statsEl);

    const button = document.createElement("button");
    button.className = "sc-modal-answer";
    button.type = "button";
    button.textContent = "Dismiss summons";
    button.addEventListener("click", () => dismissOverlayWithoutEvaluation(overlay));
    modal.insertBefore(button, statsEl);

    setTimeout(() => {
      if (document.documentElement.contains(overlay)) dismissOverlayWithoutEvaluation(overlay);
    }, 2200);
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

        const nextRecallScore = clampWisdom(state.wisdom + (answer.correct ? 15 : -12));
        const nextWrongStreak = answer.correct ? 0 : (state.wrongStreak || 0) + 1;
        const selectedEvidence = selectEvidenceForJudgment();
        const topics = [
          ...(state.sessionTopics || []),
          ...(selectedEvidence?.metadataTopics || []),
          ...(selectedEvidence?.frameTopics || [])
        ];
        const feedback = selectFeedbackQuote({
          correct: answer.correct,
          wrongStreak: nextWrongStreak,
          recallScore: nextRecallScore,
          topics
        });
        const feedbackAsset = getFeedbackAsset(feedback, {
          correct: answer.correct,
          wrongStreak: nextWrongStreak,
          recallScore: nextRecallScore
        });
        const quoteEl = overlay.querySelector(".sc-modal-quote");
        if (quoteEl && feedback) {
          quoteEl.textContent = `${feedback.philosopher}: ${feedback.text}`;
        }
        const philosopherEl = overlay.querySelector(".sc-philosopher");
        if (philosopherEl && feedback) {
          philosopherEl.outerHTML = getPhilosopherMarkup(feedback.philosopher, feedbackAsset);
          hideBrokenPhilosopherImage(overlay);
        }

        await storageSet({
          wisdom: nextRecallScore,
          quizCount: state.quizCount + 1,
          sessionCorrectQuizCount: (state.sessionCorrectQuizCount || 0) + (answer.correct ? 1 : 0),
          sessionWrongQuizCount: (state.sessionWrongQuizCount || 0) + (answer.correct ? 0 : 1),
          totalQuizCount: (state.totalQuizCount || 0) + 1,
          correctQuizCount: (state.correctQuizCount || 0) + (answer.correct ? 1 : 0),
          wrongQuizCount: (state.wrongQuizCount || 0) + (answer.correct ? 0 : 1),
          lastQuizAt: FEEDBACK_TEST_EVERY_SHORT ? state.watchedCount : state.nextJudgmentAt,
          lastQuote: feedback?.text || state.lastQuote,
          lastPhilosopher: feedback?.philosopher || state.lastPhilosopher,
          lastPhilosopherAsset: feedbackAsset || state.lastPhilosopherAsset,
          wrongStreak: nextWrongStreak
        });
        await scheduleNextJudgment();
        showTemporaryJudgePanel(Number.POSITIVE_INFINITY);

        if (!answer.correct && nextWrongStreak > 0 && nextWrongStreak % 3 === 0) {
          setTimeout(() => {
            triggerJumpscare();
          }, 120);
        }

        setTimeout(() => {
          overlay.remove();
          unlockScroll();
          resumeVideoAfterCourt();
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
    pauseActiveVideoForCourt();
    quizFetchInProgress = true;
    const pendingEvidence = selectEvidenceForJudgment();
    const pendingEvidenceMeta = getEvidenceStrengthMeta(pendingEvidence?.evidenceStrength || "weak");
    const overlay = document.createElement("div");
    overlay.id = "sc-overlay";
    overlay.innerHTML = `
      <div class="sc-modal" role="dialog" aria-modal="true" aria-label="The Recall Trial cross-examination">
        ${getLogoMarkup("sc-brand-logo-modal")}
        ${getPhilosopherMarkup(state.lastPhilosopher, state.lastPhilosopherAsset)}
        <div class="sc-modal-badge">The Recall Trial</div>
        <p class="sc-modal-quote">${state.lastQuote || getRandomQuote()}</p>
        <p class="sc-modal-loading">The tribunal is reviewing captions, frame evidence, and metadata...</p>
        <p class="sc-modal-stats">Shorts: ${state.watchedCount} | Recall: ${state.wisdom} | Evidence: ${pendingEvidenceMeta.label}</p>
      </div>
    `;
    document.documentElement.appendChild(overlay);
    hideBrokenPhilosopherImage(overlay);

    try {
      const selectedEvidence = pendingEvidence;

      if (!hasEvidenceForQuiz(selectedEvidence)) {
        dismissWeakEvidenceJudgment(overlay);
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
        Array.isArray(response.data?.answers) &&
        response.data.answers.length === 5
      ) {
        fillQuizInOverlay(overlay, response.data);
      } else {
        dismissUnavailableQuizJudgment(overlay);
      }
    } catch {
      dismissUnavailableQuizJudgment(overlay);
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

    const hasJudgeFeedback = Boolean(
      state.lastQuote &&
      state.lastPhilosopher &&
      Date.now() < judgePanelVisibleUntil
    );
    const shouldPopJudgePanel = hasJudgeFeedback && judgePanelShouldPop;
    if (shouldPopJudgePanel) {
      judgePanelShouldPop = false;
      setTimeout(render, 260);
    }
    const quote = state.lastQuote || QUOTES[state.watchedCount % QUOTES.length];
    const topics = (state.sessionTopics || []).length
      ? state.sessionTopics.join(", ")
      : "evidence pending";
    const evidenceStrength = selectEvidenceForJudgment()?.evidenceStrength || "weak";
    const evidenceMeta = getEvidenceStrengthMeta(evidenceStrength);
    const courtMood = getCourtMood(state.wisdom);
    const trialSuccess = state.quizCount
      ? `${state.sessionCorrectQuizCount || 0}/${state.quizCount}`
      : "0/0";
    const judge =
      getPhilosopherForName(state.lastPhilosopher) ||
      PHILOSOPHERS[state.watchedCount % PHILOSOPHERS.length];
    const judgeName = judge.name;

    panelRoot.innerHTML = `
      <div class="sc-court-shell ${state.enabled ? "" : "sc-closed"}">
        ${hasJudgeFeedback ? `<section class="sc-panel sc-panel-left ${shouldPopJudgePanel ? "sc-panel-pop" : ""}" aria-label="The Recall Trial judge">
          <header class="sc-header">
            <div class="sc-header-mark">
              ${getLogoMarkup()}
              <div class="sc-title">
                <strong>The Recall Trial</strong>
                <span>${state.enabled ? "Trial is in session" : "Trial dismissed"}</span>
              </div>
            </div>
            <button class="sc-icon-button" id="sc-toggle" type="button" title="${state.enabled ? "Collapse panels" : "Open panels"}">${state.enabled ? "-" : "+"}</button>
          </header>
          <div class="sc-body">
            <div class="sc-judge-stage">
              ${getPhilosopherMarkup(state.lastPhilosopher, state.lastPhilosopherAsset, "sc-philosopher-judge")}
              <strong class="sc-philosopher-name">${judgeName}</strong>
            </div>
            <div class="sc-quote">
              <span>${judgeName} says</span>
              <p>${quote}</p>
            </div>
          </div>
        </section>` : ""}

        <aside class="sc-panel sc-panel-right ${state.caseFileOpen === false ? "sc-case-file-closed" : ""}" aria-label="The Recall Trial case file">
          <header class="sc-side-header">
            <div>
              <strong>Trial Record</strong>
              <span>Session evidence</span>
            </div>
            ${getLogoMarkup()}
            <button class="sc-icon-button" id="sc-case-toggle" type="button" title="${state.caseFileOpen === false ? "Open case file" : "Collapse case file"}">${state.caseFileOpen === false ? "+" : "-"}</button>
          </header>
          <div class="sc-body">
            <div class="sc-recall-card">
              <div>
                <span>Recall Score</span>
                <strong>${state.wisdom}/100</strong>
              </div>
              <p>${courtMood}</p>
            </div>
            <div class="sc-session-row">
              <div><span>Session Shorts</span><strong>${state.watchedCount}</strong></div>
              <div><span>Trials</span><strong>${state.quizCount}</strong></div>
              <div><span>Trial Success</span><strong>${trialSuccess}</strong></div>
            </div>
            <div class="sc-evidence-card sc-evidence-${evidenceMeta.value}">
              <div class="sc-evidence-row">
                <span>Evidence strength</span>
                <strong>${evidenceMeta.label}</strong>
              </div>
              <p>${evidenceMeta.verdict}. ${evidenceMeta.detail}</p>
            </div>
            <div class="sc-actions">
              <button class="sc-button" id="sc-end-session" type="button">End Session</button>
              <button class="sc-button sc-secondary" id="sc-reset" type="button">Reset</button>
            </div>
            <div class="sc-receipt" id="sc-receipt"></div>
          </div>
        </aside>
      </div>
    `;

    panelRoot.querySelector("#sc-toggle")?.addEventListener("click", async () => {
      await storageSet({ enabled: !state.enabled });
      render();
    });

    panelRoot.querySelector("#sc-case-toggle")?.addEventListener("click", async () => {
      await storageSet({ caseFileOpen: state.caseFileOpen === false });
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
        sessionCorrectQuizCount: 0,
        sessionWrongQuizCount: 0,
        lastQuizAt: 0,
        nextJudgmentAt: 0,
        recentEvidence: [],
        sessionTopics: [],
        lastQuote: "",
        lastPhilosopher: "",
        lastPhilosopherAsset: "",
        wrongStreak: 0,
        sessionEnded: false,
        lastShortUrl: isShortsUrl() ? location.href : ""
      });
      judgePanelVisibleUntil = 0;
      if (judgePanelTimer) clearTimeout(judgePanelTimer);
      judgePanelTimer = null;
      judgePanelShouldPop = false;
      await scheduleNextJudgment();
      render();
    });

    panelRoot.querySelector("#sc-end-session")?.addEventListener("click", endSession);
    hideBrokenPhilosopherImage(panelRoot);
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
          courtMood: getCourtMood(state.wisdom),
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

  async function markActiveShortWatched(meta) {
    if (!meta?.videoId || activeVideoId !== meta.videoId || countedVideoIds.has(meta.videoId)) return;
    if (Date.now() - activeVideoStartedAt < MIN_WATCH_DWELL_MS) return;

    countedVideoIds.add(meta.videoId);
    await flushCaptions(meta.videoId);

    const courtQuote = getRandomCourtQuote();
    await storageSet({
      watchedCount: state.watchedCount + 1,
      totalWatchedCount: (state.totalWatchedCount || 0) + 1,
      lastShortUrl: meta.url,
      lastQuote: courtQuote.text,
      lastPhilosopher: courtQuote.philosopher,
      lastPhilosopherAsset: getDefaultPhilosopherAsset(courtQuote.philosopher)
    });

    if (!state.nextJudgmentAt) {
      await scheduleNextJudgment();
    }

    render();
  }

  function scheduleDwellCheck(meta) {
    if (dwellTimer) {
      clearTimeout(dwellTimer);
    }

    dwellTimer = setTimeout(() => {
      markActiveShortWatched(meta);
    }, MIN_WATCH_DWELL_MS);
  }

  async function handleCurrentShort() {
    if (!state.enabled || state.sessionEnded || !isShortsUrl()) return;
    registerShortsTabForCloseReport();

    const currentUrl = location.href.split("?")[0];
    const meta = extractVideoMeta();
    if (!meta.videoId || currentUrl === state.lastShortUrl) return;

    if (activeVideoId && activeVideoId !== meta.videoId) {
      hideTemporaryJudgePanel();
      await flushCaptions(activeVideoId);
      captionBuffer = [];
    }

    activeVideoId = meta.videoId;
    activeMeta = meta;
    activeVideoStartedAt = Date.now();

    await upsertEvidence({
      ...meta,
      captions: "",
      createdAt: Date.now()
    });

    if (!state.nextJudgmentAt) {
      await scheduleNextJudgment();
    }

    analyzeFramesForVideo(meta);
    scheduleDwellCheck(meta);
    render();
    renderOverlay();
  }

  function watchUrlChanges() {
    let previousUrl = location.href;
    document.addEventListener("yt-navigate-finish", () => {
      previousUrl = location.href;
      handleCurrentShort();
    });

    setInterval(() => {
      if (location.href !== previousUrl) {
        previousUrl = location.href;
        handleCurrentShort();
      }
    }, 700);
  }

  async function init() {
    document.getElementById("scroll-court-root")?.remove();
    document.getElementById("sc-overlay")?.remove();
    unlockScroll();

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
      lastPhilosopher: "",
      lastPhilosopherAsset: "",
      wrongStreak: 0,
      sessionCorrectQuizCount: 0,
      sessionWrongQuizCount: 0,
      sessionEnded: false
    };
    await storageSet(state);
    if (!state.nextJudgmentAt) {
      await scheduleNextJudgment();
    }

    panelRoot = document.createElement("div");
    panelRoot.id = "scroll-court-root";
    document.documentElement.appendChild(panelRoot);
    panelRoot.addEventListener("wheel", keepPanelScrollInsideCourt, { capture: true, passive: true });
    panelRoot.addEventListener("touchmove", keepPanelScrollInsideCourt, { capture: true, passive: true });

    document.addEventListener("keydown", blockNavKeys, true);
    document.addEventListener("wheel", blockWheel, { capture: true, passive: false });

    render();
    renderOverlay();
    handleCurrentShort();
    registerShortsTabForCloseReport();
    watchUrlChanges();
    setInterval(collectCaptions, 1000);
    startScrollUnlockWatchdog();

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local" || !changes[STORAGE_KEY]) return;
      state = { ...defaultState, ...changes[STORAGE_KEY].newValue };
      render();
    });
  }

  init();
})();
