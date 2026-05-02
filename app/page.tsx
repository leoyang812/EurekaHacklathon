import {
  BadgeCheck,
  Brain,
  Chrome,
  Gavel,
  ReceiptText,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const steps = [
  "Load the extension folder in Chrome developer mode.",
  "Open a YouTube Shorts URL.",
  "Watch the floating court panel count Shorts and interrupt every 3 swipes.",
  "Use Face Judgment to generate the final receipt through the Next API."
];

const features = [
  {
    icon: Gavel,
    title: "Embedded Court Panel",
    text: "A floating side panel appears directly on YouTube Shorts so the interruption happens inside the habit loop."
  },
  {
    icon: Brain,
    title: "Attention Quizzes",
    text: "Every third Short triggers a quick, funny self-check that updates the user's Wisdom Rating."
  },
  {
    icon: ReceiptText,
    title: "Roast Receipt",
    text: "The final judgment turns session stats into a playful philosopher-style receipt."
  },
  {
    icon: ShieldCheck,
    title: "Server-Side AI",
    text: "The extension never stores an OpenAI key. AI receipts are requested from a Next.js API route with fallback output."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f2e8] text-[#151515]">
      <section className="border-b border-[#d7c6ad] bg-[#18181b] text-white">
        <div className="mx-auto grid min-h-[92vh] w-full max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[1fr_420px] md:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
              <Gavel className="h-4 w-4" />
              Chrome extension MVP for YouTube Shorts
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl">
              Scroll Court
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-200">
              Ancient philosophers judge your YouTube Shorts addiction, quiz
              your attention span, and issue a brutally funny receipt for your
              doomscrolling session.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-300 px-5 text-sm font-bold text-zinc-950 transition hover:bg-amber-200"
                href="#install"
              >
                <Chrome className="h-4 w-4" />
                Load Extension
              </a>
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-sm font-bold text-white transition hover:bg-white/10"
                href="#security"
              >
                <ShieldCheck className="h-4 w-4" />
                Security Notes
              </a>
            </div>
          </div>

          <div className="rounded-md border border-amber-300/40 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-amber-200">Scroll Court</p>
                <p className="text-xs text-zinc-400">Court is in session</p>
              </div>
              <Gavel className="h-5 w-5 text-amber-200" />
            </div>
            <div className="grid gap-4 p-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Shorts", "12"],
                  ["Wisdom", "38"],
                  ["Rank", "Court Jester"]
                ].map(([label, value]) => (
                  <div
                    className="rounded-md border border-white/10 bg-white/5 p-3"
                    key={label}
                  >
                    <p className="text-xs text-zinc-400">{label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                Socrates has summoned you to court because you watched 12
                Shorts and retained absolutely nothing.
              </div>
              <div className="rounded-md bg-emerald-300/10 p-4">
                <p className="text-sm font-bold text-emerald-100">
                  Can you recall one useful detail from this session?
                </p>
                <div className="mt-3 grid gap-2">
                  <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-white">
                    Yes, surprisingly
                  </div>
                  <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-white">
                    Only the sound effect
                  </div>
                </div>
              </div>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-300 text-sm font-bold text-zinc-950">
                <ReceiptText className="h-4 w-4" />
                Face Judgment
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d7c6ad] bg-[#f7f2e8] py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 md:grid-cols-4 md:px-8">
          {features.map((feature) => (
            <article
              className="rounded-md border border-[#d7c6ad] bg-white p-5"
              key={feature.title}
            >
              <feature.icon className="h-6 w-6 text-[#9b2c2c]" />
              <h2 className="mt-4 text-base font-black">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#57534e]">
                {feature.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="install" className="border-b border-[#d7c6ad] bg-white py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[360px_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-[#183a37] px-3 py-2 text-sm font-bold text-white">
              <Chrome className="h-4 w-4" />
              Demo Setup
            </div>
            <h2 className="text-3xl font-black tracking-normal">
              Load the MVP without exposing secrets.
            </h2>
          </div>
          <ol className="grid gap-3">
            {steps.map((step, index) => (
              <li
                className="flex gap-3 rounded-md border border-[#d7c6ad] bg-[#faf7f0] p-4"
                key={step}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#183a37] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-[#3f3a34]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="bg-[#183a37] py-14 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 md:grid-cols-[1fr_1fr] md:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-bold text-emerald-100">
              <BadgeCheck className="h-4 w-4" />
              Security Checklist
            </div>
            <h2 className="text-3xl font-black tracking-normal">
              Extension keys stay out of the extension.
            </h2>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-emerald-50">
            <p>
              The Chrome extension stores only local demo stats and the optional
              demo access code in <code>chrome.storage.local</code>.
            </p>
            <p>
              The OpenAI API key belongs only in <code>.env.local</code> for the
              Next.js server route. It is never bundled into extension files or
              browser code.
            </p>
            <p className="inline-flex items-start gap-2 rounded-md bg-white/10 p-4">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
              If OpenAI is unavailable, Scroll Court returns a hardcoded receipt
              so the hackathon demo keeps moving.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
