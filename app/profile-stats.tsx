"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Flame, ReceiptText, RotateCcw, ShieldCheck, Sparkles, Trophy } from "lucide-react";

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
  topics: string[];
  verdict: string;
  distractionPattern: string;
  productivityAction: string;
};

const defaultStats: ProfileStats = {
  totalShorts: 186,
  totalTrials: 42,
  correctAnswers: 27,
  wrongAnswers: 15,
  bestRecall: 78,
  streakDays: 6
};

const defaultReports: SessionReport[] = [
  {
    id: "demo-1",
    date: "Today",
    shorts: 18,
    trials: 5,
    recall: 82,
    rank: "Stoic Swipe Survivor",
    topics: ["fitness edits", "food clips", "hard-coded subtitles"],
    verdict: "Good recall, but the court noticed one suspicious return to autoplay.",
    distractionPattern: "You stayed longest on quick transformation clips and list-style advice.",
    productivityAction: "Before the next session, write one task you are avoiding and cap Shorts at 10."
  },
  {
    id: "demo-2",
    date: "Yesterday",
    shorts: 31,
    trials: 7,
    recall: 61,
    rank: "Apprentice Witness",
    topics: ["music lyrics", "gaming", "creator drama"],
    verdict: "The jury found partial attention and excessive confidence.",
    distractionPattern: "Background music captions distracted the quiz evidence more than the actual video.",
    productivityAction: "Use a 15-minute timer and stop after two wrong answers in a row."
  },
  {
    id: "demo-3",
    date: "This week",
    shorts: 44,
    trials: 9,
    recall: 48,
    rank: "Doomscroll Defendant",
    topics: ["memes", "sports", "reaction clips"],
    verdict: "Diogenes requested a lantern and a browser break.",
    distractionPattern: "Late-session recall dropped after repeated reaction clips.",
    productivityAction: "Move Shorts after work, not before work. Start with one concrete task first."
  }
];

const storageKey = "scrollCourtLandingProfile";
const reportsStorageKey = "scrollCourtLandingReports";

const ranks = [
  {
    name: "Doomscroll Defendant",
    minCorrectAnswers: 0,
    reward: "Unlocked: Court-appointed side eye"
  },
  {
    name: "Apprentice Witness",
    minCorrectAnswers: 5,
    reward: "Unlocked: Bronze philosopher badge"
  },
  {
    name: "Stoic Swipe Survivor",
    minCorrectAnswers: 20,
    reward: "Unlocked: Cyan profile frame"
  },
  {
    name: "Oracle of Restraint",
    minCorrectAnswers: 50,
    reward: "Unlocked: Golden verdict receipt"
  },
  {
    name: "Supreme Court of Focus",
    minCorrectAnswers: 100,
    reward: "Unlocked: Socrates jumpscare immunity token"
  }
];

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
        "Next time, stay long enough for one attention check, then close the tab on purpose.",
        "Before reopening Shorts, pick one task and finish its smallest first step.",
        "Set a 5-minute cap for the next session so the court can collect cleaner evidence."
      ]
    : recall >= 80
      ? [
          `You hit ${recall}/100 recall. Spend that attention on one offline task before opening Shorts again.`,
          `Strong recall at ${recall}/100. Bank the win: close YouTube and do one planned task now.`,
          `The court accepts ${recall}/100 recall. Your reward is one real-world errand, unfortunately.`
        ]
      : recall >= 50
        ? [
            `Review your ${recall}/100 recall score and write down the one detail you actually remembered.`,
            `${recall}/100 recall is usable evidence. Next session, stop after your first wrong answer.`,
            `You were half-present at ${recall}/100. Pick a shorter Shorts cap next time.`
          ]
        : [
            `${recall}/100 recall means the scroll was mostly fog. Do one non-screen task before returning.`,
            `The court recorded ${recall}/100 recall. Next time, pause after three Shorts and summarize one thing.`,
            `Low recall at ${recall}/100. Your next action is simple: close the loop with one real task.`
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

export function ProfileStatsPanel() {
  const [stats, setStats] = useState<ProfileStats>(defaultStats);
  const [reports, setReports] = useState<SessionReport[]>(defaultReports);
  const [showReports, setShowReports] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const storedReports = window.localStorage.getItem(reportsStorageKey);

    try {
      if (stored) setStats({ ...defaultStats, ...JSON.parse(stored) });
      if (storedReports) setReports(JSON.parse(storedReports));
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
        rank: typeof parsed.rank === "string" ? parsed.rank : "Doomscroll Defendant",
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
        verdict: typeof parsed.verdict === "string" ? parsed.verdict : "The court received a closed-tab report.",
        distractionPattern: typeof parsed.distractionPattern === "string"
          ? parsed.distractionPattern
          : "No pattern was recorded.",
        productivityAction: typeof parsed.productivityAction === "string"
          ? parsed.productivityAction
          : "Choose one concrete task before reopening Shorts."
      };

      setShowReports(true);
      setReports((current) => {
        const sessionNumber = getNextSessionNumber(current);
        const numberedReport = { ...report, sessionNumber };
        const next = current.some((item) => item.id === report.id)
          ? current
          : [numberedReport, ...current];
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
      window.history.replaceState({}, "", `${window.location.pathname}#profile`);
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
  const realReportCount = getRealReports(reports).length;
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

  return (
    <section id="profile" className="border-t border-amber-100/15 bg-[#030303] py-14 text-stone-100">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 md:grid-cols-[1.05fr_0.95fr] md:px-8">
        <div className="rounded-lg border border-amber-100/20 bg-[#11100d]/85 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-amber-100/15 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-amber-100">Profile</p>
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

          <div className="grid gap-4 p-5">
            <div className="rounded-lg border border-amber-200/25 bg-black/45 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-amber-100">Current rank</p>
                  <h3 className="mt-1 text-3xl font-black text-white">{rank.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{rank.reward}</p>
                </div>
                <Trophy className="h-8 w-8 text-amber-300" />
              </div>
              <div className="mt-5 h-2 rounded-full bg-stone-900">
                <div
                  className="h-2 rounded-full bg-amber-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-400">
                {nextRank
                  ? `${nextRank.minCorrectAnswers - displayStats.correctAnswers} correct trial answers until ${nextRank.name}`
                  : "Maximum rank unlocked"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Correct Answers", displayStats.correctAnswers],
                ["Total Shorts", displayStats.totalShorts],
                ["Trials", displayStats.totalTrials],
                ["Accuracy", `${accuracy}%`],
                ["Best Recall", `${displayStats.bestRecall}/100`],
                ["Reports", realReportCount || reports.length]
              ].map(([label, value]) => (
                <div className="rounded-lg border border-amber-100/15 bg-white/[0.04] p-4" key={label}>
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

        <div className="rounded-lg border border-amber-100/20 bg-[#11100d]/85 p-5 shadow-2xl shadow-black/50">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-amber-100">
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
                      ? "border-amber-200/30 bg-amber-200/10"
                      : "border-amber-100/15 bg-white/[0.035]"
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
        <div className="mx-auto mt-6 w-full max-w-6xl px-5 md:px-8">
          <div className="rounded-lg border border-slate-400/20 bg-slate-900/80 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-slate-400/15 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-amber-100">My Past Reports</p>
                <h3 className="text-2xl font-black text-white">Receipt History</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-100">
                <Flame className="h-4 w-4" />
                {stats.streakDays}-day streak
              </div>
            </div>
            <div className="grid gap-4 p-5">
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                Productivity receipts should include the session size, quiz accuracy,
                topics watched, distraction patterns, weakest evidence source, and one
                concrete next action. That turns the roast into a usable behavior loop.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {reports.map((report, index) => (
                  <article
                    className="rounded-lg border border-slate-400/15 bg-slate-950/55 p-4"
                    key={report.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-amber-100">
                          {report.source === "tab-close" && getDisplaySessionNumber(report, reports) === latestSessionNumber
                            ? `Your latest session (Session ${getDisplaySessionNumber(report, reports)})`
                            : report.source === "tab-close"
                              ? `Your Session ${getDisplaySessionNumber(report, reports) || index + 1}`
                              : `Demo Session ${index + 1}`}
                        </p>
                        <h4 className="mt-1 text-lg font-black text-white">{report.date}</h4>
                        {report.source === "tab-close" ? (
                          <p className="mt-1 text-xs text-amber-200">Captured when YouTube tab closed</p>
                        ) : null}
                      </div>
                      <span className="rounded-md border border-amber-200/20 bg-amber-200/10 px-2 py-1 text-xs font-bold text-amber-100">
                        Recall {report.recall}/100
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-white/[0.04] p-3">
                        <p className="text-xs text-slate-400">Shorts</p>
                        <p className="text-xl font-black text-white">{report.shorts}</p>
                      </div>
                      <div className="rounded-md bg-white/[0.04] p-3">
                        <p className="text-xs text-slate-400">Trials</p>
                        <p className="text-xl font-black text-white">{report.trials}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-bold text-amber-100">{getReportVerdict(report)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      <strong className="text-slate-100">Pattern:</strong> {getReportPattern(report)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      <strong className="text-slate-100">Next action:</strong> {getReportAction(report)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {report.topics.map((topic) => (
                        <span
                          className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300"
                          key={topic}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
