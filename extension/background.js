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

function buildCloseReport(state) {
  const watchedCount = Number(state.watchedCount || 0);
  const quizCount = Number(state.quizCount || 0);
  const correctQuizCount = Number(state.sessionCorrectQuizCount || 0);
  const wrongQuizCount = Number(state.sessionWrongQuizCount || 0);
  const accuracy = quizCount ? Math.round((correctQuizCount / quizCount) * 100) : 0;

  return {
    id: `real-${Date.now()}`,
    date: new Date().toLocaleString(),
    source: "tab-close",
    shorts: watchedCount,
    trials: quizCount,
    recall: Number(state.wisdom || 50),
    accuracy,
    rank: Number(state.wisdom || 50) >= 70 ? "Stoic Swipe Survivor" : "Doomscroll Defendant",
    topics: Array.isArray(state.sessionTopics) ? state.sessionTopics.slice(0, 5) : [],
    topicCounts: buildTopicCounts(state),
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
  chrome.tabs.create({ url: `${apiBase}/?scrollCourtReport=${encoded}#profile` });
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
