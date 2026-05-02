const DEFAULT_API_BASE = "http://localhost:3000";
const STORAGE_KEY = "scrollCourtState";

function getApiBase(state) {
  return (state.apiBase || DEFAULT_API_BASE).replace(/\/$/, "");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message) return false;

  if (message.type === "SCROLL_COURT_GENERATE_RECEIPT") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const apiBase = getApiBase(result[STORAGE_KEY] || {});

      fetch(`${apiBase}/api/generate-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload || {})
      })
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch(() => sendResponse({ ok: false }));
    });

    return true;
  }

  if (message.type === "SCROLL_COURT_GENERATE_QUIZ") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const apiBase = getApiBase(result[STORAGE_KEY] || {});

      fetch(`${apiBase}/api/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.payload || {})
      })
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch(() => sendResponse({ ok: false }));
    });

    return true;
  }

  return false;
});
