import OpenAI from "openai";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

type VideoMeta = {
  title?: string;
  channel?: string;
  videoId?: string;
};

type QuizRequest = {
  recentVideos?: VideoMeta[];
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

const FALLBACK_QUIZZES: Quiz[] = [
  {
    question: "The court asks: what did your last few Shorts mostly contain?",
    answers: [
      { text: "I can name the topic", correct: true },
      { text: "A blur of edits and noise", correct: false },
      { text: "I plead algorithmic confusion", correct: false }
    ]
  },
  {
    question: "How intentional was that last swipe?",
    answers: [
      { text: "Intentional. I chose the chaos.", correct: true },
      { text: "My thumb acted alone", correct: false },
      { text: "I was spiritually buffering", correct: false }
    ]
  },
  {
    question: "Would Socrates be proud of your last 3 minutes?",
    answers: [
      { text: "He would nod, reluctantly", correct: true },
      { text: "He would ask probing questions", correct: false },
      { text: "He would leave the courtroom", correct: false }
    ]
  }
];

function getFallbackQuiz(seed: number): Quiz {
  return FALLBACK_QUIZZES[seed % FALLBACK_QUIZZES.length];
}

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

function parseQuizJson(raw: string): Quiz | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    const data = JSON.parse(cleaned) as Partial<Quiz>;

    if (typeof data.question !== "string" || !data.question.trim()) return null;
    if (!Array.isArray(data.answers) || data.answers.length !== 3) return null;

    const correctCount = data.answers.filter(
      (a) => a && typeof a.text === "string" && a.correct === true
    ).length;
    if (correctCount !== 1) return null;

    for (const answer of data.answers) {
      if (typeof answer.text !== "string" || typeof answer.correct !== "boolean") return null;
    }

    return data as Quiz;
  } catch {
    return null;
  }
}

function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
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

  const seed = typeof body.watchedCount === "number" ? body.watchedCount : 0;

  if (!process.env.OPENAI_API_KEY) {
    return withCors(NextResponse.json(getFallbackQuiz(seed)));
  }

  if (isRateLimited(getClientIp(request))) {
    return withCors(NextResponse.json(getFallbackQuiz(seed)));
  }

  const videos = (body.recentVideos ?? [])
    .filter((v) => typeof v.title === "string" && v.title.length > 3)
    .slice(-3);

  if (videos.length === 0) {
    return withCors(NextResponse.json(getFallbackQuiz(seed)));
  }

  // Use the most recent video with a meaningful title
  const video = videos[videos.length - 1];

  const channelPart = video.channel ? ` from channel "${video.channel}"` : "";

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You generate quiz questions for Scroll Court, an anti-doomscrolling Chrome extension that quizzes users on YouTube Shorts they just watched.

Return ONLY valid JSON with this exact structure:
{
  "question": "...",
  "answers": [
    { "text": "...", "correct": true },
    { "text": "...", "correct": false },
    { "text": "...", "correct": false }
  ]
}

Rules:
- Make the question specific to what this video was likely about, based on the title
- Exactly ONE answer must have correct: true — place it in a random position, not always first
- The wrong answers should be plausible alternatives (similar topics, related but wrong details)
- Keep tone fun and light — this is a comedy extension, not a school quiz
- The correct answer should be obvious to someone who actually watched the video`
        },
        {
          role: "user",
          content: `YouTube Short title: "${video.title}"${channelPart}`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const quiz = parseQuizJson(raw);

    if (!quiz) {
      console.error("Quiz parse failed, raw:", raw.slice(0, 200));
      return withCors(NextResponse.json(getFallbackQuiz(seed)));
    }

    return withCors(NextResponse.json(quiz));
  } catch (error) {
    console.error("generate-quiz error:", error);
    return withCors(NextResponse.json(getFallbackQuiz(seed)));
  }
}
