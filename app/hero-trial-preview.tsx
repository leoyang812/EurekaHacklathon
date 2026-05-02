"use client";

import { useEffect, useMemo, useState } from "react";

type ProfileStats = {
  totalShorts: number;
  totalTrials: number;
  correctAnswers: number;
  bestRecall: number;
};

type SessionReport = {
  shorts: number;
  trials: number;
  recall: number;
  accuracy?: number;
  source?: string;
};

const defaultStats: ProfileStats = {
  totalShorts: 0,
  totalTrials: 0,
  correctAnswers: 0,
  bestRecall: 50
};

const storageKey = "scrollCourtLandingProfile";
const reportsStorageKey = "scrollCourtLandingReports";

const ranks = [
  { name: "Doomscroll Defendant", minCorrectAnswers: 0 },
  { name: "Apprentice Witness", minCorrectAnswers: 5 },
  { name: "Stoic Swipe Survivor", minCorrectAnswers: 20 },
  { name: "Oracle of Restraint", minCorrectAnswers: 50 },
  { name: "Supreme Court of Focus", minCorrectAnswers: 100 }
];

function getRank(correctAnswers: number) {
  return [...ranks].reverse().find((rank) => correctAnswers >= rank.minCorrectAnswers)?.name ?? ranks[0].name;
}

function getRealReports(reports: SessionReport[]) {
  return reports.filter((report) => report.source === "tab-close");
}

function getDisplayStats(stats: ProfileStats, reports: SessionReport[]) {
  const realReports = getRealReports(reports);
  if (!realReports.length) return stats;

  const totalShorts = realReports.reduce((sum, report) => sum + report.shorts, 0);
  const totalTrials = realReports.reduce((sum, report) => sum + report.trials, 0);
  const correctAnswers = realReports.reduce((sum, report) => {
    if (typeof report.accuracy !== "number") return sum;
    return sum + Math.round((Math.max(0, Math.min(100, report.accuracy)) / 100) * report.trials);
  }, 0);
  const bestRecall = Math.max(...realReports.map((report) => report.recall), 50);

  return {
    totalShorts,
    totalTrials,
    correctAnswers,
    bestRecall
  };
}

export function HeroTrialPreview() {
  const [stats, setStats] = useState(defaultStats);
  const [reports, setReports] = useState<SessionReport[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const storedReports = window.localStorage.getItem(reportsStorageKey);
      if (stored) setStats({ ...defaultStats, ...JSON.parse(stored) });
      if (storedReports) {
        const parsedReports = JSON.parse(storedReports);
        setReports(Array.isArray(parsedReports) ? parsedReports : []);
      }
    } catch {
      setStats(defaultStats);
      setReports([]);
    }
  }, []);

  const displayStats = useMemo(() => getDisplayStats(stats, reports), [stats, reports]);
  const rank = getRank(displayStats.correctAnswers);

  return (
    <div className="rounded-lg border border-amber-100/20 bg-[#11100d]/85 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="flex items-center justify-between border-b border-amber-100/15 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-amber-100">Trial Record</p>
          <p className="text-xs text-stone-400">Session evidence</p>
        </div>
        <img
          alt=""
          className="h-10 w-10 rounded-full border border-amber-200/25 object-cover"
          src="/logo.png"
        />
      </div>
      <div className="grid gap-4 p-4">
        <div className="rounded-lg border border-amber-200/25 bg-black/45 p-4 text-center">
          <p className="text-xs font-bold uppercase text-amber-100">Best Recall</p>
          <p className="mt-1 text-5xl font-black text-white">{displayStats.bestRecall}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Total Shorts", displayStats.totalShorts],
            ["Trials", displayStats.totalTrials],
            ["Correct", displayStats.correctAnswers],
            ["Rank", rank]
          ].map(([label, value]) => (
            <div className="rounded-lg border border-amber-100/15 bg-white/[0.04] p-3" key={label}>
              <p className="text-xs text-stone-400">{label}</p>
              <p className="mt-1 text-sm font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4">
          <p className="text-xs font-bold uppercase text-amber-300">The judge whispers</p>
          <p className="mt-2 text-sm leading-6 text-amber-100">
            {rank === "Doomscroll Defendant"
              ? "The record is still under investigation."
              : `${rank} is now entered into the court record.`}
          </p>
        </div>
      </div>
    </div>
  );
}
