const DEFAULT_API_BASE = "http://localhost:3000";
const STORAGE_KEY = "scrollCourtState";
const SHORTS_URL_PREFIX = "https://www.youtube.com/shorts/";

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

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
