const DEFAULT_API_BASE = "http://localhost:3000";
const STORAGE_KEY = "scrollCourtState";
const SHORTS_URL_PREFIX = "https://www.youtube.com/shorts/";
const activeShortsTabs = new Map();

function getApiBase(state) {
  return (state.apiBase || DEFAULT_API_BASE).replace(/\/$/, "");
}

function withDemoPassword(payload, state) {
  return {
    ...(payload || {}),
    demoPassword: state.demoPassword || ""
  };
}

function isYouTubeShortsUrl(url) {
  return typeof url === "string" && url.startsWith(SHORTS_URL_PREFIX);
}

function captureVisibleFrame(sender) {
  return new Promise((resolve) => {
    if (!isYouTubeShortsUrl(sender?.tab?.url)) {
      resolve({ ok: false, error: "Not a YouTube Shorts tab." });
      return;
    }

    if (!chrome.tabs?.captureVisibleTab) {
      resolve({ ok: false, error: "Screenshot capture is unavailable." });
      return;
    }

    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "jpeg", quality: 35 }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        resolve({ ok: false, error: "Screenshot capture failed." });
        return;
      }

      if (dataUrl.length > 1200000) {
        resolve({ ok: false, error: "Screenshot was too large." });
        return;
      }

      resolve({ ok: true, imageDataUrl: dataUrl });
    });
  });
}

function postJson(url, payload) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then((response) =>
    response.json().then((data) => ({
      status: response.status,
      ok: response.ok,
      data
    }))
  );
}

function buildTopicCounts(state) {
  const counts = {};
  const evidenceItems = Array.isArray(state.recentEvidence) ? state.recentEvidence : [];

  evidenceItems.forEach((item) => {
    const topics = [
      ...(Array.isArray(item.metadataTopics) ? item.metadataTopics : []),
      ...(Array.isArray(item.frameTopics) ? item.frameTopics : [])
    ];
    [...new Set(topics)].forEach((topic) => {
      if (!topic) return;
      counts[topic] = (counts[topic] || 0) + 1;
    });
  });

  return counts;
}

function inferFallbackTopics(state) {
  const evidenceItems = Array.isArray(state.recentEvidence) ? state.recentEvidence : [];
  const text = evidenceItems
    .map((item) => [item.title, item.channel, item.mainIdea, item.frameSummary, item.captions].filter(Boolean).join(" "))
    .join(" ")
    .toLowerCase();
  const watchedCount = Number(state.watchedCount || 0);
  const candidates = [
    ["food", ["cook", "recipe", "food", "meal", "eat", "restaurant", "spicy"]],
    ["fitness", ["gym", "workout", "lift", "protein", "run", "fitness", "training"]],
    ["sports", ["football", "soccer", "basketball", "goal", "match", "nba", "sports"]],
    ["gaming", ["game", "minecraft", "fortnite", "roblox", "valorant", "gaming"]],
    ["music", ["song", "music", "concert", "guitar", "piano", "beat"]],
    ["money", ["money", "invest", "stock", "business", "rich", "side hustle"]],
    ["memes", ["meme", "prank", "rizz", "sigma", "skibidi", "funny"]]
  ];
  const scored = candidates
    .map(([topic, keywords]) => ({
      topic,
      count: keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0)
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => item.topic);

  if (scored.length) return scored.slice(0, 5);
  if (watchedCount >= 15) return ["mixed clips", "long scroll", "autoplay trail"];
  if (watchedCount >= 6) return ["mixed clips", "shorts session", "attention trail"];
  return ["quick scroll", "mixed clips", "tab escape"];
}

function getCourtMood(wisdom) {
  if (wisdom >= 85) return "Impressed";
  if (wisdom >= 65) return "Cautiously hopeful";
  if (wisdom >= 45) return "Watching closely";
  if (wisdom >= 25) return "Deeply suspicious";
  return "Preparing charges";
}

function calculateEvidenceStrength(item) {
  if ((item.captions || "").trim().length > 40) return "strong";
  if ((item.captions || "").trim().length > 10) return "medium";
  if ((item.mainIdea || "").trim().length > 20) return "medium";
  if ((item.frameSummary || "").trim().length > 8) return "medium";
  if ((item.frameTopics || []).length || (item.metadataTopics || []).length) return "medium";
  if ((item.title || "").trim().length > 8) return "medium";
  return "weak";
}

function buildEvidenceStats(state) {
  const evidenceItems = Array.isArray(state.recentEvidence) ? state.recentEvidence : [];
  const counts = { weak: 0, medium: 0, strong: 0 };
  const sourceCounts = {
    captions: 0,
    frames: 0,
    metadata: 0,
    titles: 0
  };

  evidenceItems.forEach((item) => {
    const strength = ["weak", "medium", "strong"].includes(item.evidenceStrength)
      ? item.evidenceStrength
      : calculateEvidenceStrength(item);
    counts[strength] += 1;

    if ((item.captions || "").trim()) sourceCounts.captions += 1;
    if ((item.frameSummary || "").trim() || (item.frameTopics || []).length) sourceCounts.frames += 1;
    if ((item.metadataTopics || []).length) sourceCounts.metadata += 1;
    if ((item.title || "").trim()) sourceCounts.titles += 1;
  });

  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const strongestEvidence = counts.strong > 0 ? "Strong" : counts.medium > 0 ? "Medium" : "Weak";
  const weakestEvidenceSource = sourceEntries.length && sourceEntries[sourceEntries.length - 1][1] === 0
    ? sourceEntries[sourceEntries.length - 1][0]
    : counts.weak > 0
      ? "overall evidence"
      : "none";

  return {
    evidenceItems: evidenceItems.length,
    evidenceCounts: counts,
    evidenceSourceCounts: sourceCounts,
    strongestEvidence,
    weakestEvidenceSource
  };
}

function buildCloseReport(state) {
  const watchedCount = Number(state.watchedCount || 0);
  const quizCount = Number(state.quizCount || 0);
  const correctQuizCount = Number(state.sessionCorrectQuizCount || 0);
  const wrongQuizCount = Number(state.sessionWrongQuizCount || 0);
  const accuracy = quizCount ? Math.round((correctQuizCount / quizCount) * 100) : 0;
  const recall = Number(state.wisdom || 50);
  const evidenceStats = buildEvidenceStats(state);
  const detectedTopics = Array.isArray(state.sessionTopics) ? state.sessionTopics.slice(0, 5) : [];
  const topics = detectedTopics.length ? detectedTopics : inferFallbackTopics(state);
  const topicCounts = buildTopicCounts(state);
  if (!Object.keys(topicCounts).length) {
    topics.forEach((topic) => {
      topicCounts[topic] = 1;
    });
  }

  return {
    id: `real-${Date.now()}`,
    date: new Date().toLocaleString(),
    source: "tab-close",
    shorts: watchedCount,
    trials: quizCount,
    recall,
    accuracy,
    rank: recall >= 70 ? "Stoic Swipe Survivor" : "Doomscroll Defendant",
    courtMood: getCourtMood(recall),
    correctTrials: correctQuizCount,
    wrongTrials: wrongQuizCount,
    wrongStreak: Number(state.wrongStreak || 0),
    topics,
    topicCounts,
    ...evidenceStats,
    verdict: `You closed the tab after ${watchedCount} Shorts. The tribunal accepts this as evidence of escape.`,
    distractionPattern: watchedCount > 20
      ? "Long session detected. The algorithm presented a heavier docket than necessary."
      : "Short session detected. Closing the tab quickly is evidence in your favor.",
    productivityAction: quizCount
      ? `Sentence: ${accuracy}% trial accuracy. The tribunal recommends stopping before the next autoplay spiral.`
      : "Sentence: no trial testimony recorded. The tribunal remains suspicious.",
    totalShorts: Number(state.totalWatchedCount || watchedCount),
    totalTrials: Number(state.totalQuizCount || quizCount),
    correctAnswers: Number(state.correctQuizCount || 0),
    wrongAnswers: Number(state.wrongQuizCount || 0),
    bestRecall: Number(state.wisdom || 50)
  };
}

function openLandingReport(state) {
  if (!state || Number(state.watchedCount || 0) <= 0) return;

  const apiBase = getApiBase(state);
  const report = buildCloseReport(state);
  const encoded = encodeURIComponent(JSON.stringify(report));
  chrome.tabs.create({ url: `${apiBase}/?scrollCourtReport=${encoded}#reports` });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  if (message.type === "SCROLL_COURT_REGISTER_SHORTS_TAB") {
    if (sender?.tab?.id) {
      activeShortsTabs.set(sender.tab.id, true);
    }
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === "SCROLL_COURT_END_SESSION") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      const tabId = sender?.tab?.id;

      openLandingReport(state);

      if (tabId) {
        activeShortsTabs.delete(tabId);
        chrome.tabs.remove(tabId);
      }

      sendResponse({ ok: true });
    });

    return true;
  }

  if (message.type === "SCROLL_COURT_GENERATE_RECEIPT") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      const apiBase = getApiBase(state);

      postJson(`${apiBase}/api/generate-receipt`, withDemoPassword(message.payload, state))
        .then((result) => sendResponse(result))
        .catch(() => sendResponse({ ok: false }));
    });

    return true;
  }

  if (message.type === "SCROLL_COURT_GENERATE_QUIZ") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const state = result[STORAGE_KEY] || {};
      const apiBase = getApiBase(state);

      postJson(`${apiBase}/api/generate-quiz`, withDemoPassword(message.payload, state))
        .then((result) => sendResponse(result))
        .catch(() => sendResponse({ ok: false }));
    });

    return true;
  }

  if (message.type === "SCROLL_COURT_ANALYZE_FRAME") {
    chrome.storage.local.get([STORAGE_KEY], async (result) => {
      const state = result[STORAGE_KEY] || {};
      const apiBase = getApiBase(state);
      const capture = await captureVisibleFrame(sender);

      if (!capture.ok) {
        sendResponse({ ok: false, error: capture.error });
        return;
      }

      postJson(`${apiBase}/api/analyze-frame`, {
        ...withDemoPassword(message.payload, state),
        imageDataUrl: capture.imageDataUrl
      })
        .then((result) => sendResponse(result))
        .catch(() => sendResponse({ ok: false }));
    });

    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (!activeShortsTabs.has(tabId)) return;
  activeShortsTabs.delete(tabId);

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    openLandingReport(result[STORAGE_KEY] || {});
  });
});
