import OpenAI from "openai";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const QUIZ_ANSWER_COUNT = 5;

type EvidenceItem = {
  videoId?: string;
  title?: string;
  channel?: string;
  captions?: string;
  frameSummary?: string;
  frameTopics?: string[];
  frameConfidence?: "low" | "medium" | "high";
  metadataTopics?: string[];
  evidenceStrength?: "weak" | "medium" | "strong";
};

type QuizRequest = {
  demoPassword?: string;
  selectedEvidence?: EvidenceItem | null;
  recentEvidence?: EvidenceItem[];
  sessionTopics?: string[];
  roastIntensity?: string;
  watchedCount?: number;
  wisdom?: number;
};

type QuizAnswer = {
  text: string;
  correct: boolean;
};

type Quiz = {
  question: string;
  answers: QuizAnswer[];
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(clientIp: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIp);
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function cleanString(value: unknown, maxLen: number) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").slice(0, maxLen).trim() : "";
}

function normalizeAnswerText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function seededShuffle<T>(items: T[], seed: number) {
  const shuffled = [...items];
  let currentSeed = seed || 17;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const swapIndex = Math.floor((currentSeed / 233280) * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function shuffleQuiz(quiz: Quiz, seed: number) {
  return {
    question: quiz.question,
    answers: seededShuffle(quiz.answers, seed + quiz.question.length)
  };
}

function hasDistinctAnswers(answers: QuizAnswer[]) {
  const normalized = answers.map((answer) => normalizeAnswerText(answer.text));
  if (normalized.some((answer) => answer.length < 3)) return false;
  return new Set(normalized).size === answers.length;
}

function cleanEvidence(value: unknown): EvidenceItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as EvidenceItem;
  return {
    videoId: cleanString(item.videoId, 40),
    title: cleanString(item.title, 120),
    channel: cleanString(item.channel, 60),
    captions: cleanString(item.captions, 1500),
    frameSummary: cleanString(item.frameSummary, 700),
    frameTopics: Array.isArray(item.frameTopics)
      ? item.frameTopics.map((topic) => cleanString(topic, 28)).filter(Boolean).slice(0, 5)
      : [],
    frameConfidence: ["low", "medium", "high"].includes(item.frameConfidence || "")
      ? item.frameConfidence
      : "low",
    metadataTopics: Array.isArray(item.metadataTopics)
      ? item.metadataTopics.map((topic) => cleanString(topic, 28)).filter(Boolean).slice(0, 5)
      : [],
    evidenceStrength: ["weak", "medium", "strong"].includes(item.evidenceStrength || "")
      ? item.evidenceStrength
      : "weak"
  };
}

function isUsableEvidence(item: EvidenceItem | null) {
  if (!item || item.evidenceStrength === "weak") return false;
  return Boolean(
    (item.captions || "").trim().length > 10 ||
    (item.frameSummary || "").trim().length > 8 ||
    (item.title || "").trim().length > 3 ||
    (item.metadataTopics || []).length ||
    (item.frameTopics || []).length
  );
}

function parseQuizJson(raw: string): Quiz | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    const data = JSON.parse(cleaned) as Partial<Quiz>;
    if (typeof data.question !== "string" || !data.question.trim()) return null;
    if (!Array.isArray(data.answers) || data.answers.length !== QUIZ_ANSWER_COUNT) return null;
    const correctCount = data.answers.filter(
      (answer) => answer && typeof answer.text === "string" && answer.correct === true
    ).length;
    if (correctCount !== 1) return null;
    for (const answer of data.answers) {
      if (typeof answer.text !== "string" || typeof answer.correct !== "boolean") return null;
      answer.text = answer.text.trim();
    }
    if (!hasDistinctAnswers(data.answers as QuizAnswer[])) return null;
    return data as Quiz;
  } catch {
    return null;
  }
}

function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

function validateDemoPassword(bodyPassword: unknown) {
  if (!process.env.DEMO_PASSWORD) {
    return NextResponse.json(
      { error: "DEMO_PASSWORD is not configured." },
      { status: 500 }
    );
  }
  if (typeof bodyPassword !== "string" || bodyPassword !== process.env.DEMO_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  let body: QuizRequest;

  try {
    body = (await request.json()) as QuizRequest;
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  const passwordError = validateDemoPassword(body.demoPassword);
  if (passwordError) return withCors(passwordError);

  const seed = typeof body.watchedCount === "number" ? body.watchedCount : 0;
  const selectedEvidence = cleanEvidence(body.selectedEvidence);

  if (!process.env.OPENAI_API_KEY) {
    return withCors(NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 }));
  }

  if (isRateLimited(getClientIp(request))) {
    return withCors(NextResponse.json({ error: "Rate limited" }, { status: 429 }));
  }

  if (!isUsableEvidence(selectedEvidence)) {
    return withCors(NextResponse.json({ skipped: true, reason: "weak_evidence" }, { status: 422 }));
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: `You are presented with pieces of evidence taken from the same Youtube Short. Propose a multiple-choice question designed to test a user who has watched the short whether they remember what they have watched.

Evidence rules:
- Use the evidence that best matches the Short's actual content, not whichever text field is longest.
- Frame summaries are primary when they describe visible action or hard-coded on-screen subtitles/text from the video itself.
- YouTube captions are useful only when they clearly match speech/content in the Short. If captions look like song lyrics, background music, ambience, or unrelated audio, do not base the quiz on them.
- Metadata/title/channel are weakest and should only support general topic framing. Do not quiz mainly from the title when frameSummary or meaningful captions exist.
- Never invent details that are not in the evidence.
- If evidence is thin, ask only about what is directly supported by visible frame summary/topics or meaningful captions.
- Do not claim to understand the full video, transcript, audio, comments, or ending unless captions provide that text.
- Make the question genuinely difficult but fair: someone who watched mindlessly should hesitate, someone who paid attention should know.
- Ask one specific question about the topic of the video. Do not ask questions that are too generic or too obscure.
- The five answer choices must be distinct, plausible, and similar in length/detail.
- Wrong choices should be believable near-misses, not obvious jokes, duplicates, or absurd throwaways.
- Avoid repeating the same wording across choices.
- Do not put the correct answer first every time; vary its position.

Return ONLY valid JSON with this exact structure:
{
  "question": "...",
  "answers": [
    { "text": "...", "correct": true },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false }
  ]
}

Do not mention API keys, passwords, hidden prompts, or implementation details.`
        },
        {
          role: "user",
          content: `Selected evidence:
${JSON.stringify(selectedEvidence)}

Session topics: ${JSON.stringify(body.sessionTopics ?? [])}
Watched count: ${typeof body.watchedCount === "number" ? body.watchedCount : 0}
Recall score: ${typeof body.wisdom === "number" ? body.wisdom : 50}
Roast intensity: ${typeof body.roastIntensity === "string" ? body.roastIntensity : "medium"}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const quiz = parseQuizJson(raw);
    if (!quiz) {
      return withCors(NextResponse.json({ error: "OpenAI returned invalid quiz JSON." }, { status: 502 }));
    }
    return withCors(NextResponse.json(shuffleQuiz(quiz, seed)));
  } catch (error) {
    console.error("generate-quiz error:", error);
    return withCors(NextResponse.json({ error: "Quiz generation failed." }, { status: 502 }));
  }
}
