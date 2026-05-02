import {
  BadgeCheck,
  Brain,
  Chrome,
  Gavel,
  ReceiptText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { ProfileStatsPanel } from "./profile-stats";

const steps = [
  "Load the extension folder in Chrome developer mode.",
  "Open a YouTube Shorts URL.",
  "Watch the floating court panels track session and lifetime stats.",
  "Answer attention checks to improve your Recall Score and unlock ranks."
];

const features = [
  {
    icon: Gavel,
    title: "Court Panels",
    text: "Modern side panels sit beside the Shorts player with session evidence, recall score, and philosopher feedback."
  },
  {
    icon: Brain,
    title: "Visual Quizzes",
    text: "Frame screenshots, hard-coded subtitles, captions, and metadata are weighed to generate fair attention checks."
  },
  {
    icon: ReceiptText,
    title: "Receipts & History",
    text: "Session receipts are grouped as past reports so users can review patterns across multiple scrolling sessions."
  },
  {
    icon: ShieldCheck,
    title: "Local Control",
    text: "Stats can be reset at any time, while API keys stay server-side in the local Next.js app."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="border-b border-slate-400/15 bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,0.18),transparent_32%),linear-gradient(180deg,#121826,#080b13)]">
        <div className="mx-auto grid min-h-[86vh] w-full max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-[1fr_410px] md:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-100">
              <Gavel className="h-4 w-4" />
              YouTube Shorts attention court
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl">
              Scroll Court
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              A Chrome extension that watches your Shorts habit, quizzes what
              you actually noticed, tracks lifetime stats, and lets philosophers
              judge the evidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-300/10 transition hover:brightness-105"
                href="#install"
              >
                <Chrome className="h-4 w-4" />
                Load Extension
              </a>
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-400/20 bg-slate-950/70 px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/40 hover:bg-slate-800"
                href="#profile"
              >
                <Sparkles className="h-4 w-4" />
                View Profile & Reports
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-400/20 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-400/15 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-cyan-200">Case File</p>
                <p className="text-xs text-slate-400">Session evidence</p>
              </div>
              <Gavel className="h-5 w-5 text-amber-300" />
            </div>
            <div className="grid gap-4 p-4">
              <div className="rounded-lg border border-cyan-300/20 bg-slate-950/50 p-4 text-center">
                <p className="text-xs font-bold uppercase text-cyan-200">Recall Score</p>
                <p className="mt-1 text-5xl font-black text-white">78</p>
                <p className="mt-1 text-sm font-bold text-slate-300">Cautiously hopeful</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Session", "12"],
                  ["Lifetime", "186"],
                  ["Trials", "42"],
                  ["Rank", "Stoic"]
                ].map(([label, value]) => (
                  <div className="rounded-lg border border-slate-400/15 bg-white/[0.04] p-3" key={label}>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-xs font-bold uppercase text-amber-300">The judge whispers</p>
                <p className="mt-2 text-sm leading-6 text-amber-100">
                  Socrates approves one moment of focus. The record is still under investigation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 md:grid-cols-4 md:px-8">
          {features.map((feature) => (
            <article
              className="rounded-lg border border-slate-400/15 bg-slate-900/80 p-5 shadow-xl shadow-black/20"
              key={feature.title}
            >
              <feature.icon className="h-6 w-6 text-cyan-200" />
              <h2 className="mt-4 text-base font-black text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <ProfileStatsPanel />

      <section id="install" className="border-t border-slate-400/15 bg-slate-900 py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[360px_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-100">
              <Chrome className="h-4 w-4" />
              Demo Setup
            </div>
            <h2 className="text-3xl font-black tracking-normal text-white">
              Load the MVP and keep secrets server-side.
            </h2>
          </div>
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <li
                className="flex gap-3 rounded-lg border border-slate-400/15 bg-slate-950/60 p-4"
                key={step}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-cyan-300 text-sm font-black text-slate-950">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-slate-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="border-t border-slate-400/15 bg-slate-950 py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[1fr_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-100">
              <BadgeCheck className="h-4 w-4" />
              Security Checklist
            </div>
            <h2 className="text-3xl font-black tracking-normal text-white">
              Extension keys stay out of browser code.
            </h2>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-slate-300">
            <p>
              The extension stores local stats, session evidence, and optional
              demo access settings in <code>chrome.storage.local</code>.
            </p>
            <p>
              The OpenAI API key belongs only in <code>.env.local</code> for the
              Next.js server route. It is never bundled into extension files.
            </p>
            <p className="inline-flex items-start gap-2 rounded-lg border border-slate-400/15 bg-white/[0.04] p-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
              The profile ladder is designed for cumulative progress: session
              resets do not erase lifetime Shorts, reports, or streaks unless the user chooses Reset Stats.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
