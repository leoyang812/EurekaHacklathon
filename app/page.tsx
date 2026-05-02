import {
  BadgeCheck,
  Brain,
  Chrome,
  Gavel,
  ReceiptText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { HeroTrialPreview } from "./hero-trial-preview";
import { ProfileStatsPanel } from "./profile-stats";

const steps = [
  "Load the extension folder in Chrome developer mode.",
  "Open a YouTube Shorts URL.",
  "Watch the floating trial panels track session and lifetime stats.",
  "Answer attention checks to improve your Recall Score and unlock ranks."
];

const features = [
  {
    icon: Gavel,
    title: "Trial Panels",
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
    <main className="min-h-screen bg-[#030303] text-stone-100">
      <section className="border-b border-amber-200/15 bg-[radial-gradient(circle_at_50%_0%,rgba(245,203,108,0.2),transparent_34%),linear-gradient(180deg,#080808,#030303)]">
        <div className="mx-auto grid min-h-[86vh] w-full max-w-6xl items-center gap-8 px-5 py-12 md:grid-cols-[1fr_410px] md:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-sm font-bold text-amber-100">
              <Gavel className="h-4 w-4" />
              YouTube Shorts recall tribunal
            </div>
            <img
              alt="The Recall Trial logo"
              className="mb-6 h-28 w-28 rounded-full border border-amber-200/25 object-cover shadow-2xl shadow-amber-200/10"
              src="/logo.png"
            />
            <h1 className="text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl">
              The Recall Trial
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-300">
              A Chrome extension that watches your Shorts habit, quizzes what
              you actually noticed, tracks lifetime stats, and lets philosophers
              judge the evidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-200 px-5 text-sm font-bold text-black shadow-lg shadow-amber-200/10 transition hover:brightness-105"
                href="#install"
              >
                <Chrome className="h-4 w-4" />
                Load Extension
              </a>
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-amber-100/20 bg-black/70 px-5 text-sm font-bold text-stone-100 transition hover:border-amber-200/40 hover:bg-stone-900"
                href="#profile"
              >
                <Sparkles className="h-4 w-4" />
                View Profile & Reports
              </a>
            </div>
          </div>

          <HeroTrialPreview />
        </div>
      </section>

      <section className="bg-[#030303] py-14">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-7 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-100">How the trial works</p>
            <h2 className="mt-2 text-3xl font-black text-white">Awareness, not blockers.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              The extension turns autopilot scrolling into evidence, questions, verdicts, and shareable shame.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {features.map((feature) => (
              <article
                className="rounded-lg border border-amber-100/15 bg-[#11100d]/80 p-5 shadow-xl shadow-black/20"
                key={feature.title}
              >
                <feature.icon className="h-6 w-6 text-amber-200" />
                <h2 className="mt-4 text-base font-black text-white">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-400">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProfileStatsPanel />

      <section id="install" className="border-t border-amber-100/15 bg-[#11100d] py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[360px_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-amber-200/25 bg-amber-200/10 px-3 py-2 text-sm font-bold text-amber-100">
              <Chrome className="h-4 w-4" />
              Demo Stage
            </div>
            <h2 className="text-3xl font-black tracking-normal text-white">
              Load the extension and keep secrets server-side.
            </h2>
          </div>
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <li
                className="flex gap-3 rounded-lg border border-slate-400/15 bg-slate-950/60 p-4"
                key={step}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-200 text-sm font-black text-black">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-stone-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="border-t border-amber-100/15 bg-[#030303] py-14">
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
