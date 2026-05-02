"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Copy, Download, ExternalLink, Flame, ReceiptText, RotateCcw, ShieldCheck, Sparkles, Trophy } from "lucide-react";

type ProfileStats = {
  totalShorts: number;
  totalTrials: number;
  correctAnswers: number;
  wrongAnswers: number;
  bestRecall: number;
  streakDays: number;
};

type SessionReport = {
  id: string;
  date: string;
  source?: string;
  sessionNumber?: number;
  shorts: number;
  trials: number;
  recall: number;
  accuracy?: number;
  rank: string;
  courtMood?: string;
  correctTrials?: number;
  wrongTrials?: number;
  wrongStreak?: number;
  topics: string[];
  topicCounts?: Record<string, number>;
  evidenceItems?: number;
  evidenceCounts?: Record<string, number>;
  evidenceSourceCounts?: Record<string, number>;
  strongestEvidence?: string;
  weakestEvidenceSource?: string;
  verdict: string;
  distractionPattern: string;
  productivityAction: string;
};

const defaultStats: ProfileStats = {
  totalShorts: 0,
  totalTrials: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  bestRecall: 50,
  streakDays: 0
};

const defaultReports: SessionReport[] = [];

const storageKey = "scrollCourtLandingProfile";
const reportsStorageKey = "scrollCourtLandingReports";

const ranks = [
  {
    name: "Tung Tung Trogolodyte",
    minCorrectAnswers: 0,
    reward: "Unlocked: Court-appointed side eye"
  },
  {
    name: "Doomscrolling Defendant",
    minCorrectAnswers: 5,
    reward: "Unlocked: Bronze philosopher badge"
  },
  {
    name: "Sapient Scroller",
    minCorrectAnswers: 20,
    reward: "Unlocked: Cyan profile frame"
  },
  {
    name: "Locked-in Lawyer",
    minCorrectAnswers: 50,
    reward: "Unlocked: Golden verdict receipt"
  },
  {
    name: "Flow State",
    minCorrectAnswers: 100,
    reward: "Unlocked: Socrates jumpscare immunity token"
  }
];

const rankAliases: Record<string, string> = {
  "Doomscroll Defendant": "Tung Tung Trogolodyte",
  "Apprentice Witness": "Doomscrolling Defendant",
  "Stoic Swipe Survivor": "Sapient Scroller",
  "Oracle of Restraint": "Locked-in Lawyer",
  "Supreme Court of Focus": "Flow State"
};

function normalizeRankName(value: unknown) {
  if (typeof value === "string") {
    return rankAliases[value] ?? value;
  }
  return ranks[0].name;
}

function normalizeReport(report: SessionReport) {
  return {
    ...report,
    rank: normalizeRankName(report.rank)
  };
}

function getRank(correctAnswers: number) {
  return [...ranks].reverse().find((rank) => correctAnswers >= rank.minCorrectAnswers) ?? ranks[0];
}

function getNextRank(correctAnswers: number) {
  return ranks.find((rank) => correctAnswers < rank.minCorrectAnswers) ?? null;
}

function getRealReports(reports: SessionReport[]) {
  return reports.filter((report) => report.source === "tab-close");
}

function clampAccuracy(value: unknown) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function getNextSessionNumber(reports: SessionReport[]) {
  const realReports = getRealReports(reports);
  return realReports.reduce((max, report) => Math.max(max, report.sessionNumber || 0), 0) + 1;
}

function getDisplayStats(stats: ProfileStats, reports: SessionReport[]) {
  const realReports = getRealReports(reports);
  if (!realReports.length) return stats;

  const totalShorts = realReports.reduce((sum, report) => sum + report.shorts, 0);
  const totalTrials = realReports.reduce((sum, report) => sum + report.trials, 0);
  const weightedCorrect = realReports.reduce((sum, report) => {
    if (typeof report.accuracy !== "number") return sum;
    return sum + Math.round((clampAccuracy(report.accuracy) / 100) * report.trials);
  }, 0);
  const bestRecall = Math.max(...realReports.map((report) => report.recall), 50);

  return {
    ...stats,
    totalShorts,
    totalTrials,
    correctAnswers: weightedCorrect,
    wrongAnswers: Math.max(0, totalTrials - weightedCorrect),
    bestRecall
  };
}

function getReportAction(report: SessionReport) {
  if (report.source !== "tab-close") return report.productivityAction;

  const recall = clampAccuracy(report.recall);
  const variants = report.trials <= 0
    ? [
        "Sentence: no quiz testimony landed. The tribunal has only watch evidence and a raised eyebrow.",
        "Sentence: the next session must produce at least one answer before the court trusts the record.",
        "Sentence: admissible evidence was thin. The algorithm remains the main witness."
      ]
    : recall >= 80
      ? [
          `Sentence: ${recall}/100 recall. The tribunal grants temporary release from philosophical custody.`,
          `Sentence: strong recall at ${recall}/100. The algorithm failed to erase the witness.`,
          `Sentence: ${recall}/100 recall accepted. Socrates lowers the lantern, briefly.`
        ]
      : recall >= 50
        ? [
            `Sentence: ${recall}/100 recall. Usable testimony, questionable custody of attention.`,
            `Sentence: ${recall}/100 recall is admissible, but the jury detected buffering in the soul.`,
            `Sentence: partial awareness at ${recall}/100. The tribunal recommends fewer autoplay witnesses.`
          ]
        : [
            `Sentence: ${recall}/100 recall. The scroll was mostly fog with subtitles.`,
            `Sentence: ${recall}/100 recall. Diogenes found the tab open and the mind absent.`,
            `Sentence: low recall at ${recall}/100. The algorithm is ordered to stop looking smug.`
          ];

  return variants[(report.shorts + report.trials + report.recall) % variants.length];
}

function getReportVerdict(report: SessionReport) {
  if (report.source !== "tab-close") return report.verdict;

  const variants = report.shorts <= 5
    ? [
        `You escaped after ${report.shorts} Shorts. The court calls this restraint with witnesses present.`,
        `Only ${report.shorts} Shorts entered evidence. Socrates is suspicious, but impressed.`,
        `A short session of ${report.shorts} Shorts. The tab closed before the habit fully organized a defense.`
      ]
    : report.shorts <= 15
      ? [
          `${report.shorts} Shorts watched. The court sees a controlled scroll, pending further testimony.`,
          `You closed the tab after ${report.shorts} Shorts. Not heroic, not disastrous: admissible progress.`,
          `${report.shorts} Shorts made the record. The jury recommends stopping here more often.`
        ]
      : [
          `${report.shorts} Shorts is a heavier docket. The court appreciates that you eventually closed the tab.`,
          `The session reached ${report.shorts} Shorts. Diogenes requests a shorter trial next time.`,
          `${report.shorts} Shorts entered evidence. The verdict: entertaining, but expensive attention-wise.`
        ];

  return variants[(report.shorts + report.recall) % variants.length];
}

function getReportPattern(report: SessionReport) {
  if (report.source !== "tab-close") return report.distractionPattern;

  const topic = report.topics[0];
  const recall = clampAccuracy(report.recall);
  const variants = [
    topic
      ? `The strongest trail was ${topic}; that topic may be your easiest re-entry point into scrolling.`
      : "No dominant topic was recorded, which usually means the session moved quickly between unrelated clips.",
    report.trials > 0
      ? `${report.trials} quiz ${report.trials === 1 ? "trial" : "trials"} ended with ${recall}/100 recall, so attention ${recall >= 70 ? "held up" : "started leaking"} under pressure.`
      : "No quiz landed this session, so the pattern is based mostly on watch count and close timing.",
    report.shorts <= 5
      ? "The session ended quickly; that is the kind of interruption pattern worth repeating."
      : report.shorts <= 15
        ? "The session stayed medium-length; a fixed cap could turn this into a repeatable habit."
        : "The session ran long enough that attention likely became passive near the end."
  ];

  return variants[(report.shorts + report.trials + report.recall) % variants.length];
}

function getDisplaySessionNumber(report: SessionReport, reports: SessionReport[]) {
  const realReports = getRealReports(reports);
  const realIndex = realReports.findIndex((item) => item.id === report.id);
  if (realIndex < 0) return null;
  return realReports.length - realIndex;
}

function getTopicCountEntries(report: SessionReport) {
  const entries = Object.entries(report.topicCounts || {})
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length) return entries;
  return report.topics.map((topic) => [topic, 1] as [string, number]);
}

function formatTopicCounts(report: SessionReport) {
  const entries = getTopicCountEntries(report);
  return entries.length
    ? entries.map(([topic, count]) => `${count} ${topic}`).join(" / ")
    : "evidence unclassified";
}

function cleanNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function cleanCountRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value)
          .filter(([key, count]) => typeof key === "string" && typeof count === "number")
          .slice(0, 8)
      )
    : undefined;
}

function formatEvidenceCounts(report: SessionReport) {
  const counts = report.evidenceCounts || {};
  const weak = cleanNumber(counts.weak);
  const medium = cleanNumber(counts.medium);
  const strong = cleanNumber(counts.strong);

  if (!weak && !medium && !strong) return "no evidence file";
  return `${strong} strong / ${medium} medium / ${weak} weak`;
}

function getReceiptStatRows(report: SessionReport) {
  return [
    ["Court mood", report.courtMood || "Watching closely"],
    ["Rank", report.rank],
    ["Correct trials", cleanNumber(report.correctTrials)],
    ["Wrong trials", cleanNumber(report.wrongTrials)],
    ["Wrong streak", cleanNumber(report.wrongStreak)],
    ["Evidence items", cleanNumber(report.evidenceItems)],
    ["Evidence quality", formatEvidenceCounts(report)],
    ["Strongest evidence", report.strongestEvidence || "Weak"],
    ["Weakest source", report.weakestEvidenceSource || "unknown"],
    ["Lifetime shorts", cleanNumber((report as SessionReport & Partial<ProfileStats>).totalShorts, report.shorts)],
    ["Lifetime trials", cleanNumber((report as SessionReport & Partial<ProfileStats>).totalTrials, report.trials)],
    ["Best recall", `${cleanNumber((report as SessionReport & Partial<ProfileStats>).bestRecall, report.recall)}/100`]
  ];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getReportLabel(report: SessionReport, reports: SessionReport[]) {
  const sessionNumber = getDisplaySessionNumber(report, reports);
  return sessionNumber ? `Session ${sessionNumber}` : "Session";
}

function getShareText(report: SessionReport, reports: SessionReport[]) {
  return [
    `The Recall Trial judged my YouTube Shorts session.`,
    `${getReportLabel(report, reports)}: ${report.shorts} Shorts, ${report.trials} trials, ${report.recall}/100 recall.`,
    `Evidence: ${formatTopicCounts(report)}.`,
    getReportVerdict(report)
  ].join("\n");
}

function getReceiptSvg(report: SessionReport, reports: SessionReport[]) {
  const label = getReportLabel(report, reports).toUpperCase();
  const verdict = getReportVerdict(report).slice(0, 96);
  const action = getReportAction(report).slice(0, 104);
  const topics = formatTopicCounts(report);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#17130b"/>
      <stop offset="0.52" stop-color="#050505"/>
      <stop offset="1" stop-color="#21180a"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="78" y="78" width="924" height="1194" rx="34" fill="#090807" stroke="#f5d37a" stroke-width="3"/>
  <text x="540" y="170" text-anchor="middle" fill="#f5d37a" font-family="Georgia, serif" font-size="38" font-weight="700" letter-spacing="7">THE RECALL TRIAL</text>
  <text x="540" y="238" text-anchor="middle" fill="#fff7df" font-family="Georgia, serif" font-size="72" font-weight="700">VERDICT CARD</text>
  <line x1="170" y1="292" x2="910" y2="292" stroke="#f5d37a" stroke-width="2"/>
  <text x="150" y="372" fill="#f5d37a" font-family="Arial, sans-serif" font-size="31" font-weight="700">${escapeXml(label)}</text>
  <text x="150" y="426" fill="#fff7df" font-family="Arial, sans-serif" font-size="35" font-weight="700">${escapeXml(report.date)}</text>
  <rect x="150" y="500" width="240" height="146" rx="18" fill="#151515" stroke="#3b3424"/>
  <rect x="420" y="500" width="240" height="146" rx="18" fill="#151515" stroke="#3b3424"/>
  <rect x="690" y="500" width="240" height="146" rx="18" fill="#151515" stroke="#3b3424"/>
  <text x="190" y="555" fill="#c9bda5" font-family="Arial, sans-serif" font-size="28">Shorts</text>
  <text x="190" y="615" fill="#fff7df" font-family="Arial, sans-serif" font-size="54" font-weight="800">${report.shorts}</text>
  <text x="460" y="555" fill="#c9bda5" font-family="Arial, sans-serif" font-size="28">Trials</text>
  <text x="460" y="615" fill="#fff7df" font-family="Arial, sans-serif" font-size="54" font-weight="800">${report.trials}</text>
  <text x="730" y="555" fill="#c9bda5" font-family="Arial, sans-serif" font-size="28">Recall</text>
  <text x="730" y="615" fill="#fff7df" font-family="Arial, sans-serif" font-size="54" font-weight="800">${report.recall}/100</text>
  <text x="150" y="760" fill="#f5d37a" font-family="Arial, sans-serif" font-size="34" font-weight="800">VERDICT</text>
  <foreignObject x="150" y="790" width="780" height="145">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff7df;font:700 34px Arial;line-height:1.28">${escapeXml(verdict)}</div>
  </foreignObject>
  <text x="150" y="1000" fill="#f5d37a" font-family="Arial, sans-serif" font-size="30" font-weight="800">EVIDENCE</text>
  <text x="150" y="1050" fill="#fff7df" font-family="Arial, sans-serif" font-size="29">${escapeXml(topics)}</text>
  <text x="150" y="1138" fill="#f5d37a" font-family="Arial, sans-serif" font-size="30" font-weight="800">SENTENCE</text>
  <foreignObject x="150" y="1166" width="780" height="90">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color:#fff7df;font:400 28px Arial;line-height:1.25">${escapeXml(action)}</div>
  </foreignObject>
</svg>`;
}

export function ProfileStatsPanel() {
  const [stats, setStats] = useState<ProfileStats>(defaultStats);
  const [reports, setReports] = useState<SessionReport[]>(defaultReports);
  const [showReports, setShowReports] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const storedReports = window.localStorage.getItem(reportsStorageKey);

    try {
      if (stored) setStats({ ...defaultStats, ...JSON.parse(stored) });
      if (storedReports) {
        const parsedReports = JSON.parse(storedReports);
        setReports(Array.isArray(parsedReports)
          ? getRealReports(parsedReports.map((item: unknown) => normalizeReport(item as SessionReport)))
          : defaultReports);
      }
    } catch {
      setStats(defaultStats);
      setReports(defaultReports);
    }

    const rawReport = new URLSearchParams(window.location.search).get("scrollCourtReport");
    if (!rawReport) return;

    try {
      const parsed = JSON.parse(rawReport) as Partial<SessionReport> & Partial<ProfileStats>;
      const report: SessionReport = {
        id: typeof parsed.id === "string" ? parsed.id : `real-${Date.now()}`,
        date: typeof parsed.date === "string" ? parsed.date : new Date().toLocaleString(),
        source: parsed.source || "tab-close",
        sessionNumber: undefined,
        shorts: Number(parsed.shorts || 0),
        trials: Number(parsed.trials || 0),
        recall: Number(parsed.recall || 50),
        accuracy: typeof parsed.accuracy === "number" ? clampAccuracy(parsed.accuracy) : undefined,
        rank: normalizeRankName(typeof parsed.rank === "string" ? parsed.rank : undefined),
        courtMood: typeof parsed.courtMood === "string" ? parsed.courtMood : undefined,
        correctTrials: cleanNumber(parsed.correctTrials),
        wrongTrials: cleanNumber(parsed.wrongTrials),
        wrongStreak: cleanNumber(parsed.wrongStreak),
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
        topicCounts: cleanCountRecord(parsed.topicCounts),
        evidenceItems: cleanNumber(parsed.evidenceItems),
        evidenceCounts: cleanCountRecord(parsed.evidenceCounts),
        evidenceSourceCounts: cleanCountRecord(parsed.evidenceSourceCounts),
        strongestEvidence: typeof parsed.strongestEvidence === "string" ? parsed.strongestEvidence : undefined,
        weakestEvidenceSource: typeof parsed.weakestEvidenceSource === "string" ? parsed.weakestEvidenceSource : undefined,
        verdict: typeof parsed.verdict === "string" ? parsed.verdict : "The court received a closed-tab report.",
        distractionPattern: typeof parsed.distractionPattern === "string"
          ? parsed.distractionPattern
          : "No pattern was recorded.",
        productivityAction: typeof parsed.productivityAction === "string"
          ? parsed.productivityAction
          : "Sentence: the tribunal recorded the scroll and awaits cleaner testimony."
      };

      setShowReports(true);
      setReports((current) => {
        const sessionNumber = getNextSessionNumber(current);
        const numberedReport = { ...report, sessionNumber };
        const realCurrent = getRealReports(current);
        const next = realCurrent.some((item) => item.id === report.id)
          ? realCurrent
          : [numberedReport, ...realCurrent];
        window.localStorage.setItem(reportsStorageKey, JSON.stringify(next));
        return next;
      });
      setStats((current) => ({
        ...current,
        totalShorts: Number(parsed.totalShorts || report.shorts || 0),
        totalTrials: Number(parsed.totalTrials || report.trials || 0),
        correctAnswers: Number(parsed.correctAnswers || 0),
        wrongAnswers: Number(parsed.wrongAnswers || 0),
        bestRecall: Math.max(current.bestRecall, Number(parsed.bestRecall || report.recall || 50))
      }));
      window.history.replaceState({}, "", `${window.location.pathname}#reports`);
      window.setTimeout(() => {
        document.getElementById("reports")?.scrollIntoView({ block: "start" });
      }, 0);
    } catch {
      // Ignore malformed report URLs.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    window.localStorage.setItem(reportsStorageKey, JSON.stringify(reports));
  }, [reports]);

  const displayStats = useMemo(() => getDisplayStats(stats, reports), [stats, reports]);
  const rank = useMemo(() => getRank(displayStats.correctAnswers), [displayStats.correctAnswers]);
  const nextRank = useMemo(() => getNextRank(displayStats.correctAnswers), [displayStats.correctAnswers]);
  const accuracy = displayStats.totalTrials
    ? Math.round((displayStats.correctAnswers / displayStats.totalTrials) * 100)
    : 0;
  const progress = nextRank
    ? Math.min(100, Math.round((displayStats.correctAnswers / nextRank.minCorrectAnswers) * 100))
    : 100;
  const realReports = useMemo(() => getRealReports(reports), [reports]);
  const visibleReports = reportsExpanded ? realReports : realReports.slice(0, 6);
  const latestReport = realReports[0];
  const hiddenReportCount = Math.max(0, realReports.length - visibleReports.length);
  const realReportCount = realReports.length;
  const latestSessionNumber = realReportCount;

  function resetStats() {
    const reset = {
      totalShorts: 0,
      totalTrials: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      bestRecall: 50,
      streakDays: 0
    };
    setStats(reset);
  }

  function downloadShareCard(report: SessionReport) {
    const svg = getReceiptSvg(report, reports);
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recall-trial-${getReportLabel(report, reports).toLowerCase().replace(/\s+/g, "-")}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    setShareStatus("Verdict card downloaded.");
  }

  async function copyShareText(report: SessionReport) {
    await navigator.clipboard.writeText(getShareText(report, reports));
    setShareStatus("Share text copied.");
  }

  async function shareReport(report: SessionReport) {
    const text = getShareText(report, reports);
    if (navigator.share) {
      await navigator.share({ title: "The Recall Trial", text });
      setShareStatus("Shared.");
      return;
    }
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="profile" className="relative overflow-hidden border-t border-amber-100/15 bg-[#070605] py-16 text-stone-100">
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(245,211,122,0.08),transparent)]" />
      <div className="absolute bottom-12 left-6 hidden -rotate-6 border-4 border-red-900/20 px-8 py-3 font-serif text-3xl font-black uppercase tracking-[0.18em] text-red-900/20 md:block">
        Entered
      </div>
      <div className="relative mx-auto mb-8 w-full max-w-6xl px-5 md:px-8">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-100">Profile ledger</p>
        <h2 className="mt-2 max-w-3xl text-4xl font-black tracking-normal text-white">
          Your scrolling record, separated into stats, rewards, and receipts.
        </h2>
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-5 md:grid-cols-[1.08fr_0.92fr] md:px-8">
        <div className="overflow-hidden rounded-lg border border-amber-100/20 bg-[linear-gradient(180deg,#181309,#080706)] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-amber-100/15 bg-black/25 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-amber-100">Court ledger</p>
              <h2 className="text-2xl font-black tracking-normal text-white">Recall Trial Record</h2>
            </div>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-100/20 bg-black/70 px-3 text-sm font-bold text-stone-200 transition hover:border-amber-200/40 hover:bg-stone-900"
              onClick={resetStats}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Stats
            </button>
          </div>

          <div className="grid gap-5 p-5">
            <div className="relative overflow-hidden rounded-lg border border-amber-200/30 bg-[#f3e5bc] p-5 text-[#1b1711] shadow-xl shadow-black/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-red-900/10" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-red-900">Current rank</p>
                  <h3 className="mt-1 text-3xl font-black text-[#120f0b]">{rank.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{rank.reward}</p>
                </div>
                <Trophy className="h-8 w-8 text-red-900" />
              </div>
              <div className="mt-5 h-2 rounded-full bg-stone-300">
                <div
                  className="h-2 rounded-full bg-[#7f1d1d]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-stone-600">
                {nextRank
                  ? `${nextRank.minCorrectAnswers - displayStats.correctAnswers} correct trial answers until ${nextRank.name}`
                  : "Maximum rank unlocked"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {[
                ["Correct Answers", displayStats.correctAnswers],
                ["Total Shorts", displayStats.totalShorts],
                ["Trials", displayStats.totalTrials],
                ["Accuracy", `${accuracy}%`],
                ["Best Recall", `${displayStats.bestRecall}/100`],
                ["Reports", realReportCount || reports.length]
              ].map(([label, value]) => (
                <div className="rounded-lg border border-stone-500/15 bg-black/35 p-4 shadow-inner shadow-white/[0.02]" key={label}>
                  <p className="text-xs text-stone-400">{label}</p>
                  <p className="mt-1 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-200 px-4 text-sm font-black text-black transition hover:brightness-105"
              onClick={() => setShowReports((current) => !current)}
              type="button"
            >
              <ReceiptText className="h-4 w-4" />
              My Past Reports
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-teal-100/20 bg-[linear-gradient(180deg,#061918,#050606)] p-5 shadow-2xl shadow-black/50">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-teal-100">
            <Award className="h-4 w-4" />
            Rewards Ladder
          </div>
          <div className="grid gap-3">
            {ranks.map((item) => {
              const unlocked = displayStats.correctAnswers >= item.minCorrectAnswers;
              return (
                <div
                  className={`rounded-lg border p-4 ${
                    unlocked
                      ? "border-teal-200/30 bg-teal-300/10"
                      : "border-stone-400/15 bg-white/[0.035]"
                  }`}
                  key={item.name}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm text-white">{item.name}</strong>
                    {unlocked ? (
                      <ShieldCheck className="h-4 w-4 text-amber-100" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-stone-500" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-400">{item.minCorrectAnswers}+ correct trial answers</p>
                  <p className="mt-2 text-sm text-stone-300">{item.reward}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showReports ? (
        <div id="reports" className="relative mx-auto mt-10 w-full max-w-6xl scroll-mt-6 px-5 md:px-8">
          <div className="overflow-hidden rounded-lg border border-stone-800 bg-[#efe5cf] text-[#17130b] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b-2 border-stone-800 bg-[#17130b] px-5 py-4 text-stone-100">
              <div>
                <p className="text-sm font-bold text-amber-100">My Past Reports</p>
                <h3 className="text-2xl font-black text-white">Receipt History</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-100">
                <Flame className="h-4 w-4" />
                {stats.streakDays}-day streak
              </div>
            </div>
            <div className="grid gap-5 p-5">
              <p className="max-w-3xl border-l-4 border-red-900/60 pl-4 text-sm leading-6 text-stone-700">
                Productivity receipts should include session size, recall, topic counts,
                distraction patterns, weakest evidence source, and a court sentence.
                That turns the roast into a usable awareness loop.
              </p>
              {latestReport ? (
                <article className="overflow-hidden rounded-lg border-2 border-[#17130b] bg-[linear-gradient(180deg,#fff8e6,#e9d7ad)] shadow-xl shadow-stone-900/20">
                  <div className="border-b-2 border-[#17130b] bg-[#2a2012] px-5 py-4 text-stone-100">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100">
                          Latest verdict
                        </p>
                        <h4 className="mt-2 text-3xl font-black text-white">{getReportLabel(latestReport, reports)}</h4>
                        <p className="mt-1 text-sm font-bold text-amber-200">{latestReport.date}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200/25 bg-black/45 px-4 py-3 text-right">
                        <p className="text-xs font-black uppercase text-amber-100">Recall</p>
                        <p className="text-3xl font-black text-white">{latestReport.recall}/100</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="grid gap-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["Shorts", latestReport.shorts],
                          ["Trials", latestReport.trials],
                          ["Accuracy", latestReport.accuracy ? `${latestReport.accuracy}%` : "N/A"]
                        ].map(([label, value]) => (
                          <div className="rounded-lg border border-stone-900/15 bg-white/55 p-3" key={label}>
                            <p className="text-xs text-stone-500">{label}</p>
                            <p className="mt-1 text-xl font-black text-[#17130b]">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-lg border border-red-900/20 bg-red-900/10 p-4">
                        <p className="text-xs font-black uppercase text-red-900">Evidence</p>
                        <p className="mt-2 text-sm leading-6 text-stone-800">
                          {formatTopicCounts(latestReport)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-stone-900/20 bg-white/45 p-4">
                        <p className="text-xs font-black uppercase text-red-900">Receipt stats</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {getReceiptStatRows(latestReport).map(([label, value]) => (
                            <div className="rounded-md bg-[#17130b]/5 p-3" key={label}>
                              <p className="text-xs text-stone-500">{label}</p>
                              <p className="mt-1 text-sm font-black text-[#17130b]">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <p className="text-xl font-black leading-8 text-red-950">{getReportVerdict(latestReport)}</p>
                      <p className="text-sm leading-6 text-stone-800">
                        <strong className="text-[#17130b]">Pattern:</strong> {getReportPattern(latestReport)}
                      </p>
                      <p className="text-sm leading-6 text-stone-800">
                        <strong className="text-[#17130b]">Court sentence:</strong> {getReportAction(latestReport)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#17130b] px-3 text-sm font-black text-amber-100 transition hover:brightness-110"
                          onClick={() => shareReport(latestReport)}
                          type="button"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Share
                        </button>
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-900/20 bg-white/50 px-3 text-sm font-bold text-[#17130b] transition hover:bg-white"
                          onClick={() => downloadShareCard(latestReport)}
                          type="button"
                        >
                          <Download className="h-4 w-4" />
                          Card
                        </button>
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-900/20 bg-white/50 px-3 text-sm font-bold text-[#17130b] transition hover:bg-white"
                          onClick={() => copyShareText(latestReport)}
                          type="button"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </button>
                      </div>
                      {shareStatus ? <p className="text-xs font-bold text-red-900">{shareStatus}</p> : null}
                    </div>
                  </div>
                </article>
              ) : (
                <div className="rounded-lg border border-stone-900/20 bg-white/45 p-5 text-sm leading-6 text-stone-700">
                  No real sessions yet. Close a YouTube Shorts tab after using the extension to generate your first verdict card.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {visibleReports.map((report, index) => (
                  <article
                    className="rounded-lg border border-stone-900/20 bg-white/55 p-4 shadow-sm shadow-stone-900/10"
                    key={report.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-red-900">
                          {report.source === "tab-close" && getDisplaySessionNumber(report, reports) === latestSessionNumber
                            ? `Your latest session (Session ${getDisplaySessionNumber(report, reports)})`
                            : report.source === "tab-close"
                              ? `Your Session ${getDisplaySessionNumber(report, reports) || index + 1}`
                              : `Session ${index + 1}`}
                        </p>
                        <h4 className="mt-1 text-lg font-black text-[#17130b]">{report.date}</h4>
                        {report.source === "tab-close" ? (
                          <p className="mt-1 text-xs font-bold text-stone-600">Captured when YouTube tab closed</p>
                        ) : null}
                      </div>
                      <span className="rounded-md border border-red-900/20 bg-red-900/10 px-2 py-1 text-xs font-bold text-red-900">
                        Recall {report.recall}/100
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-[#17130b]/5 p-3">
                        <p className="text-xs text-stone-500">Shorts</p>
                        <p className="text-xl font-black text-[#17130b]">{report.shorts}</p>
                      </div>
                      <div className="rounded-md bg-[#17130b]/5 p-3">
                        <p className="text-xs text-stone-500">Trials</p>
                        <p className="text-xl font-black text-[#17130b]">{report.trials}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-bold text-red-950">{getReportVerdict(report)}</p>
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                      <strong className="text-[#17130b]">Pattern:</strong> {getReportPattern(report)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                      <strong className="text-[#17130b]">Sentence:</strong> {getReportAction(report)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {getReceiptStatRows(report).slice(0, 6).map(([label, value]) => (
                        <div className="rounded-md bg-[#17130b]/5 p-2" key={label}>
                          <p className="text-[11px] text-stone-500">{label}</p>
                          <p className="mt-1 text-xs font-black text-[#17130b]">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getTopicCountEntries(report).map(([topic, count]) => (
                        <span
                          className="rounded-md bg-stone-900/10 px-2 py-1 text-xs font-bold text-stone-700"
                          key={topic}
                        >
                          {count} {topic}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              {hiddenReportCount > 0 ? (
                <button
                  className="mx-auto inline-flex h-10 items-center justify-center rounded-md border border-stone-900/20 bg-[#17130b] px-4 text-sm font-black text-amber-100 transition hover:brightness-110"
                  onClick={() => setReportsExpanded(true)}
                  type="button"
                >
                  ... show {hiddenReportCount} more
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
