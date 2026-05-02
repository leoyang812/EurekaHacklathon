import OpenAI from "openai";
import { NextResponse } from "next/server";

type FrameRequest = {
  demoPassword?: string;
  imageDataUrl?: string;
  title?: string;
  channel?: string;
  videoId?: string;
};

type FrameAnalysis = {
  summary: string;
  topics: string[];
  confidence: "low" | "medium" | "high";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

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

function cleanString(value: unknown, maxLen: number) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").slice(0, maxLen).trim() : "";
}

function getSafeImageDataUrl(value: unknown) {
  if (typeof value !== "string") return "";
  if (!value.startsWith("data:image/")) return "";
  if (!value.includes(";base64,")) return "";
  if (value.length > 1200000) return "";
  return value;
}

function parseAnalysis(raw: string): FrameAnalysis | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    const data = JSON.parse(cleaned) as Partial<FrameAnalysis>;

    if (typeof data.summary !== "string") return null;
    if (!Array.isArray(data.topics)) return null;
    const confidence = data.confidence;
    if (!["low", "medium", "high"].includes(confidence || "")) return null;

    return {
      summary: cleanString(data.summary, 240),
      topics: data.topics
        .filter((topic) => typeof topic === "string")
        .map((topic) => cleanString(topic, 28))
        .filter(Boolean)
        .slice(0, 5),
      confidence: confidence as "low" | "medium" | "high"
    };
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  let body: FrameRequest;

  try {
    body = (await request.json()) as FrameRequest;
  } catch {
    return withCors(NextResponse.json({ error: "Invalid JSON" }, { status: 400 }));
  }

  const passwordError = validateDemoPassword(body.demoPassword);
  if (passwordError) return withCors(passwordError);

  const imageDataUrl = getSafeImageDataUrl(body.imageDataUrl);
  if (!imageDataUrl) {
    return withCors(NextResponse.json({ error: "Invalid image." }, { status: 400 }));
  }

  if (!process.env.OPENAI_API_KEY) {
    return withCors(
      NextResponse.json({
        summary: "",
        topics: [],
        confidence: "low"
      } satisfies FrameAnalysis)
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "You analyze one visible screenshot frame from a YouTube Shorts page for a comedy anti-doomscrolling extension. Describe only what is visible in this single frame. Do not claim to understand the whole video. Use cautious wording like 'appears to show'. Focus on broad content categories/topics. Do not identify real people, usernames, creators, commenters, private details, or profile names. Return JSON only with summary, topics, and confidence."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Frame metadata: title="${cleanString(body.title, 120)}", channel="${cleanString(body.channel, 60)}", videoId="${cleanString(body.videoId, 40)}". Return JSON: {"summary": string, "topics": string[], "confidence": "low" | "medium" | "high"}.`
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl }
            }
          ] as any
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const analysis = parseAnalysis(raw);

    return withCors(
      NextResponse.json(
        analysis ?? {
          summary: "",
          topics: [],
          confidence: "low"
        }
      )
    );
  } catch (error) {
    console.error("analyze-frame error:", error);
    return withCors(
      NextResponse.json({
        summary: "",
        topics: [],
        confidence: "low"
      } satisfies FrameAnalysis)
    );
  }
}
