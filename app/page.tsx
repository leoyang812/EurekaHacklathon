import {
  BadgeCheck,
  Brain,
  Chrome,
  Gavel,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  VenetianMask
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
    <main className="min-h-screen bg-[#050403] text-stone-100">
      <section className="relative overflow-hidden border-b border-amber-200/15 bg-[linear-gradient(120deg,#070605_0%,#120d08_48%,#040404_100%)]">
        <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,#d6b456_0_34px,#111_34px_47px,#7f1d1d_47px_52px)]" />
        <div className="absolute left-0 top-16 hidden h-[74%] w-14 border-y border-r border-amber-200/10 bg-[repeating-linear-gradient(180deg,rgba(245,211,122,0.08)_0_18px,transparent_18px_36px)] md:block" />
        <div className="absolute right-0 top-24 hidden h-56 w-56 rotate-12 rounded-full border border-amber-200/10 text-center font-serif text-5xl font-black uppercase leading-[0.85] text-amber-100/5 md:grid md:place-items-center">
          Guilty
        </div>
        <div className="mx-auto grid min-h-[86vh] w-full max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1fr_410px] md:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-200/30 bg-black/40 px-3 py-2 text-sm font-bold text-amber-100 shadow-lg shadow-black/30">
              <Gavel className="h-4 w-4" />
              YouTube Shorts recall tribunal
            </div>
            <div className="mb-7 flex items-end gap-4">
              <img
                alt="The Recall Trial logo"
                className="h-28 w-28 rounded-full border border-amber-200/25 object-cover shadow-2xl shadow-amber-200/10"
                src="/logo.png"
              />
              <div className="mb-2 hidden border-l border-amber-200/20 pl-4 text-xs font-black uppercase tracking-[0.24em] text-stone-500 sm:block">
                Case no. 404
                <br />
                People v. Autoplay
              </div>
            </div>
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-200 px-5 text-sm font-bold text-black shadow-lg shadow-amber-200/10 transition hover:-translate-y-0.5 hover:brightness-105"
                href="#install"
              >
                <Chrome className="h-4 w-4" />
                Load Extension
              </a>
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-teal-200/20 bg-teal-950/30 px-5 text-sm font-bold text-stone-100 transition hover:-translate-y-0.5 hover:border-teal-200/40 hover:bg-teal-900/30"
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

      <section className="relative overflow-hidden bg-[#ece4d2] py-16 text-[#1b1711]">
        <div className="absolute inset-y-0 left-0 w-2 bg-[repeating-linear-gradient(180deg,#7f1d1d_0_18px,#d6b456_18px_34px,#1b1711_34px_40px)]" />
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="mb-9 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-red-900">How the trial works</p>
              <h2 className="mt-2 text-4xl font-black tracking-normal text-[#120f0b]">Awareness, not blockers.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-stone-700 md:pt-7">
              The extension turns autopilot scrolling into evidence, questions, verdicts, and shareable shame. Each piece has a job: observe, interrupt, remember, and close the loop.
            </p>
          </div>
          <div className="grid gap-0 overflow-hidden rounded-lg border-2 border-[#1b1711] bg-[#1b1711] shadow-2xl shadow-stone-900/20 md:grid-cols-4">
            {features.map((feature, index) => (
              <article
                className="relative min-h-[220px] border-[#1b1711] bg-[#f8f0db] p-5 text-[#1b1711] md:border-r last:md:border-r-0"
                key={feature.title}
              >
                <span className="absolute right-4 top-4 font-serif text-5xl font-black text-red-900/10">
                  0{index + 1}
                </span>
                <div className="grid h-11 w-11 place-items-center rounded-md bg-[#1b1711] text-amber-100">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-black text-[#120f0b]">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-stone-700">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProfileStatsPanel />

      <section id="install" className="relative overflow-hidden border-t border-amber-100/15 bg-[#10100f] py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-200/30 to-transparent" />
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[360px_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200/25 bg-teal-300/10 px-3 py-2 text-sm font-bold text-teal-100">
              <Chrome className="h-4 w-4" />
              Demo Stage
            </div>
            <h2 className="text-3xl font-black tracking-normal text-white md:text-4xl">
              Load the extension and keep secrets server-side.
            </h2>
          </div>
          <ol className="grid gap-3 border-l border-teal-200/20 pl-5">
            {steps.map((step, index) => (
              <li
                className="relative flex gap-3 rounded-lg border border-teal-200/15 bg-[#061918]/70 p-4 shadow-lg shadow-black/20"
                key={step}
              >
                <span className="absolute -left-[34px] top-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-teal-100/30 bg-[#10100f] text-xs font-black text-teal-100">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-stone-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="border-t border-amber-100/15 bg-[linear-gradient(180deg,#050403,#120908)] py-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[1fr_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-red-300/25 bg-red-950/30 px-3 py-2 text-sm font-bold text-red-100">
              <BadgeCheck className="h-4 w-4" />
              Security Checklist
            </div>
            <h2 className="text-3xl font-black tracking-normal text-white md:text-4xl">
              Extension keys stay out of browser code.
            </h2>
            <div className="mt-5 flex gap-3 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
              <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4" /> Local court</span>
              <span className="inline-flex items-center gap-2"><VenetianMask className="h-4 w-4" /> No hidden keys</span>
            </div>
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
            <p className="inline-flex items-start gap-2 rounded-lg border border-red-200/15 bg-red-950/20 p-4">
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
