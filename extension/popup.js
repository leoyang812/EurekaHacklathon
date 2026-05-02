const STORAGE_KEY = "scrollCourtState";
const DEFAULT_API_BASE = "http://localhost:3000";

const defaultState = {
  enabled: true,
  apiBase: DEFAULT_API_BASE,
  demoPassword: "",
  watchedCount: 0,
  wisdom: 50,
  quizCount: 0,
  sessionCorrectQuizCount: 0,
  sessionWrongQuizCount: 0,
  lastShortUrl: "",
  lastQuizAt: 0,
  nextJudgmentAt: 0,
  recentEvidence: [],
  sessionTopics: [],
  roastIntensity: "medium",
  lastQuote: "",
  lastPhilosopher: "",
  wrongStreak: 0,
  sessionEnded: false
};

let state = { ...defaultState };

function getCourtMood(wisdom) {
  if (wisdom >= 85) return "Impressed";
  if (wisdom >= 65) return "Cautiously hopeful";
  if (wisdom >= 45) return "Watching closely";
  if (wisdom >= 25) return "Deeply suspicious";
  return "Preparing charges";
}

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

function render() {
  document.querySelector("#watched").textContent = String(state.watchedCount);
  document.querySelector("#wisdom").textContent = String(state.wisdom);
  document.querySelector("#quiz-count").textContent = String(state.quizCount);
  document.querySelector("#trial-success").textContent = state.quizCount
    ? `${state.sessionCorrectQuizCount || 0}/${state.quizCount}`
    : "0/0";
  document.querySelector("#toggle").textContent = state.enabled ? "Interruptions On" : "Interruptions Off";
  document.querySelector("#api-base").value = state.apiBase || DEFAULT_API_BASE;
  document.querySelector("#demo-password").value = state.demoPassword || "";
  document.querySelector("#roast-intensity").value = state.roastIntensity || "medium";
  document.querySelector("#last-quote").textContent = state.lastQuote || "The trial awaits evidence.";
  document.querySelector("#topics").textContent = `Topics: ${
    (state.sessionTopics || []).length ? state.sessionTopics.join(", ") : "evidence pending"
  } | Evidence items: ${(state.recentEvidence || []).length}`;

  const passwordStatus = document.querySelector("#password-status");
  passwordStatus.textContent = state.demoPassword
    ? "Demo gate: access code saved locally."
    : "Demo gate: enter the access code to unlock AI trial actions.";
  passwordStatus.className = state.demoPassword ? "status-ok" : "status-err";
}

document.addEventListener("DOMContentLoaded", async () => {
  state = await storageGet();
  render();

  document.querySelector("#toggle").addEventListener("click", async () => {
    await storageSet({ enabled: !state.enabled });
    render();
  });

  document.querySelector("#save").addEventListener("click", async () => {
    const rawApiBase = document.querySelector("#api-base").value.trim();
    const apiBase = rawApiBase || DEFAULT_API_BASE;
    const demoPassword = document.querySelector("#demo-password").value.trim();
    const roastIntensity = document.querySelector("#roast-intensity").value;

    await storageSet({ apiBase, demoPassword, roastIntensity });

    const statusEl = document.querySelector("#status");
    statusEl.textContent = demoPassword
      ? "Settings saved. The tribunal recognizes your seal."
      : "Settings saved. Add the demo access code before using AI routes.";
    statusEl.className = demoPassword ? "status-ok" : "status-err";
    render();
  });

  document.querySelector("#reset").addEventListener("click", async () => {
    await storageSet({
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
      wrongStreak: 0,
      sessionEnded: false
    });

    const statusEl = document.querySelector("#status");
    statusEl.textContent = "Session reset. The trial has misplaced the evidence.";
    statusEl.className = "";
    render();
  });
});
