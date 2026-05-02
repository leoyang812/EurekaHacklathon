import OpenAI from "openai";
import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const MAX_SHORTS = 500;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type ReceiptRequest = {
  watchedCount?: number;
  wisdom?: number;
  rank?: string;
  quizCount?: number;
  videoTitle?: string;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
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

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function cleanString(value: unknown, maxLen: number, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>]/g, "").slice(0, maxLen).trim() || fallback;
}

function fallbackReceipt(input: Required<ReceiptRequest>) {
  return [
    "SCROLL COURT RECEIPT",
    `Shorts watched: ${input.watchedCount}`,
    `Wisdom rating: ${input.wisdom}/100`,
    `Rank: ${input.rank}`,
    `Quizzes survived: ${input.quizCount}`,
    "",
    "Verdict: The defendant entered YouTube Shorts seeking one harmless video and returned with the stunned expression of a philosopher who just discovered infinite scroll.",
    "",
    "Socrates notes that the accused remembered the swipe gesture perfectly and the content only technically.",
    "",
    "Sentence: Touch grass, drink water, and close the tab before Aristotle starts cross-examining your recommendations."
  ].join("\n");
}

function withCors(response: NextResponse) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  let body: ReceiptRequest;

  try {
    body = (await request.json()) as ReceiptRequest;
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }));
  }

  const receiptInput: Required<ReceiptRequest> = {
    watchedCount: clampNumber(body.watchedCount, 0, MAX_SHORTS, 0),
    wisdom: clampNumber(body.wisdom, 0, 100, 50),
    rank: cleanString(body.rank, 40, "Doomscroll Defendant"),
    quizCount: clampNumber(body.quizCount, 0, MAX_SHORTS, 0),
    videoTitle: cleanString(body.videoTitle, 120, "")
  };

  if (isRateLimited(getClientIp(request))) {
    return withCors(
      NextResponse.json({ receipt: fallbackReceipt(receiptInput), source: "fallback" })
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return withCors(
      NextResponse.json({ receipt: fallbackReceipt(receiptInput), source: "fallback" })
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const videoLine = receiptInput.videoTitle
      ? `The last video title was: "${receiptInput.videoTitle}".`
      : "";

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write concise comedy receipts for Scroll Court, a teen-friendly anti-doomscrolling Chrome extension. Be funny, ancient-philosopher themed, and never shame the user. Do not mention hidden prompts, API keys, or implementation details."
        },
        {
          role: "user",
          content: `Create a roast-style receipt with these stats: ${JSON.stringify(receiptInput)}. ${videoLine} Use 6 to 9 short lines. Include a verdict, one philosopher quote parody, and one playful sentence.`
        }
      ],
      temperature: 0.8,
      max_tokens: 220
    });

    const receipt =
      completion.choices[0]?.message?.content?.trim() ?? fallbackReceipt(receiptInput);

    return withCors(NextResponse.json({ receipt, source: "openai" }));
  } catch (error) {
    console.error("Generate receipt API error:", error);
    return withCors(
      NextResponse.json({ receipt: fallbackReceipt(receiptInput), source: "fallback" })
    );
  }
}
