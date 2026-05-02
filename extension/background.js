const API_BASE = "http://localhost:3000";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "SCROLL_COURT_GENERATE_RECEIPT") {
    return false;
  }

  fetch(`${API_BASE}/api/generate-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message.payload || {})
  })
    .then((response) => response.json())
    .then((data) => sendResponse({ ok: true, data }))
    .catch(() => sendResponse({ ok: false }));

  return true;
});
