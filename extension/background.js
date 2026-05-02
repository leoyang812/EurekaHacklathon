const DEFAULT_API_BASE = "http://localhost:3000";
const STORAGE_KEY = "scrollCourtState";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "SCROLL_COURT_GENERATE_RECEIPT") {
    return false;
  }

  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const state = result[STORAGE_KEY] || {};
    const apiBase = (state.apiBase || DEFAULT_API_BASE).replace(/\/$/, "");

    fetch(`${apiBase}/api/generate-receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload || {})
    })
      .then((response) => response.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch(() => sendResponse({ ok: false }));
  });

  return true;
});
