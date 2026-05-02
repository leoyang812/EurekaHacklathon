const STORAGE_KEY = "scrollCourtState";
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
const ranks = [
  { min: 90, name: "Oracle of Restraint" },
  { min: 70, name: "Stoic Swipe Survivor" },
  { min: 50, name: "Apprentice Philosopher" },
  { min: 25, name: "Court Jester of Focus" },
  { min: -999, name: "Doomscroll Defendant" }
];

let state = { ...defaultState };

function getRank(wisdom) {
  return ranks.find((rank) => wisdom >= rank.min).name;
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
  document.querySelector("#rank").textContent = getRank(state.wisdom);
  document.querySelector("#toggle").textContent = state.enabled ? "On" : "Off";
  document.querySelector("#demo-password").value = state.demoPassword || "";
  document.querySelector("#status").textContent = state.unlocked
    ? "Unlocked. AI receipts can be requested through your Next API."
    : "Locked receipts use fallback judgment until unlocked.";
}

document.addEventListener("DOMContentLoaded", async () => {
  state = await storageGet();
  render();

  document.querySelector("#toggle").addEventListener("click", async () => {
    await storageSet({ enabled: !state.enabled });
    render();
  });

  document.querySelector("#save").addEventListener("click", async () => {
    const demoPassword = document.querySelector("#demo-password").value.trim();
    await storageSet({ demoPassword, unlocked: demoPassword.length > 0 });
    render();
  });

  document.querySelector("#reset").addEventListener("click", async () => {
    await storageSet({
      watchedCount: 0,
      wisdom: 50,
      quizCount: 0,
      lastShortUrl: "",
      lastQuizAt: 0
    });
    render();
  });
});
