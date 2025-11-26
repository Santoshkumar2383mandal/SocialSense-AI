// src/app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const geminiApiKey = process.env.GEMINI_API_KEY || "";
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const OCR_BACKEND_URL =
  process.env.OCR_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:5001";

// ---- CONFIG LIMITS ----
const MAX_PDF_BYTES = 5 * 1024 * 1024;        // 5 MB max
const PDF_PARSE_TIMEOUT_MS = 15_000;          // 15 seconds
const MIN_TEXT_LENGTH = 50;                   // minimum characters after extraction

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildRuleBasedAnalysis(text: string) {
  const trimmed = text.trim();
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const words = trimmed.split(/\s+/).filter(Boolean);
  const hashtags = (trimmed.match(/#[\w-]+/g) || []).map((tag) =>
    tag.toLowerCase()
  );
  const links = trimmed.match(/https?:\/\/\S+/gi) || [];
  const emojis = trimmed.match(
    /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/gu
  ) || [];

  let score = 55;
  if (words.length > 180) score -= 10;
  if (words.length < 30) score -= 8;
  if (hashtags.length >= 3 && hashtags.length <= 8) score += 10;
  if (hashtags.length === 0) score -= 5;
  if (links.length > 1) score -= 5;
  if (emojis.length > 0 && emojis.length <= 3) score += 5;
  score = Math.max(10, Math.min(95, score));

  const suggestions: string[] = [];
  if (words.length > 150) suggestions.push("Shorten the copy to keep it punchy.");
  if (words.length < 40)
    suggestions.push("Add more context so the audience understands the value.");
  if (hashtags.length < 3)
    suggestions.push("Include 3-6 relevant hashtags for discoverability.");
  if (!/[!?]$/.test(sentences[0] || ""))
    suggestions.push("Open with a question or bold claim to hook readers.");
  if (links.length === 0)
    suggestions.push("Add a clear call-to-action or helpful link.");

  const topicHint = sentences[0]?.split(" ").slice(0, 6).join(" ") || "your niche";
  const trendingIdeas = [
    `Turn ${topicHint} into a carousel with actionable tips.`,
    `Record a short reel explaining ${topicHint} in plain language.`,
    `Share a before/after story that highlights ${topicHint}.`,
  ];

  const recommendedHashtags =
    hashtags.length > 0
      ? Array.from(new Set(hashtags)).slice(0, 10)
      : ["#socialmedia", "#marketingtips", "#contentstrategy", "#growth", "#branding"];

  return {
    summary:
      sentences.slice(0, 2).join(" ") ||
      "The post needs more detail to generate a meaningful summary.",
    score,
    suggestions,
    trendingIdeas,
    hashtags: recommendedHashtags,
  };
}

async function generateGeminiAnalysis(
  normalizedText: string,
  rawText: string,
  isPDF: boolean
) {
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const safeText = normalizedText.replace(/"/g, '\\"');

  const prompt = `
You are a social media content analyst.

The extracted text from the user's ${isPDF ? "PDF document" : "image"} is:
"${safeText}"

Based on this text, provide a detailed analysis report including:
1. A concise summary of the content.
2. An engagement score (0-100).
3. Suggestions to improve the post (hooks, CTAs, clarity, structure, etc.).
4. 3 new trending post ideas related to this content.
5. A list of relevant hashtags (5–15 hashtags).

Format the response as a JSON object with the following structure:
{
  "summary": "string",
  "score": number,
  "suggestions": ["string", "string"],
  "trendingIdeas": ["string", "string", "string"],
  "hashtags": ["string", "string"]
}

Do not include markdown formatting. Just return a raw JSON string.
  `;

  const result = await model.generateContent([prompt]);
  const aiResponse = await result.response;
  const raw = aiResponse.text();

  const jsonString = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  const analysisData = JSON.parse(jsonString);

  return {
    summary: analysisData.summary || "No summary available",
    score: typeof analysisData.score === "number" ? analysisData.score : 0,
    suggestions: Array.isArray(analysisData.suggestions)
      ? analysisData.suggestions
      : [],
    trendingIdeas: Array.isArray(analysisData.trendingIdeas)
      ? analysisData.trendingIdeas
      : [],
    hashtags: Array.isArray(analysisData.hashtags) ? analysisData.hashtags : [],
  };
}

// Generic timeout wrapper for async functions
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage = "Operation timed out"
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    if (!isImage && !isPDF) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF or an image (PNG, JPG, JPEG, WEBP).",
        },
        { status: 400 }
      );
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // ---------- SIZE CHECK FOR PDF ----------
    if (isPDF && buffer.length > MAX_PDF_BYTES) {
      const mb = (buffer.length / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `PDF is too large (${mb} MB). Maximum allowed size is ${
            MAX_PDF_BYTES / (1024 * 1024)
          } MB. Please upload a smaller file or split the document.`,
        },
        { status: 413 } // Payload Too Large
      );
    }

    let extractedText = "";

    // ---------- PDF FLOW ----------
    if (isPDF) {
      try {
        // Wrap pdfParse with timeout
        const pdfData = await withTimeout(
          pdfParse(buffer),
          PDF_PARSE_TIMEOUT_MS,
          "PDF processing took too long. Please upload a smaller or simpler document."
        );

        extractedText = (pdfData.text || "").trim();

        if (!extractedText) {
          return NextResponse.json(
            {
              error:
                "No text found in PDF. The PDF might be image-based, encrypted, or empty.",
            },
            { status: 400 }
          );
        }

        if (extractedText.length < MIN_TEXT_LENGTH) {
          return NextResponse.json(
            {
              error:
                "Extracted text from PDF is too short to analyze. Please upload a document with more visible text.",
            },
            { status: 400 }
          );
        }
      } catch (pdfError: any) {
        console.error("PDF Parse Error:", pdfError);
        const msg =
          pdfError?.message?.includes("timed out") ||
          pdfError?.message?.includes("took too long")
            ? pdfError.message
            : `Failed to extract text from PDF: ${
                pdfError?.message || "Invalid or corrupted PDF file"
              }`;
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // ---------- IMAGE → OCR BACKEND FLOW ----------
    if (isImage) {
      try {
        const ocrForm = new FormData();
        ocrForm.append(
          "file",
          new Blob([buffer], { type: file.type }),
          file.name
        );

        const ocrResponse = await fetch(`${OCR_BACKEND_URL}/ocr`, {
          method: "POST",
          body: ocrForm,
        });

        if (!ocrResponse.ok) {
          const errData = await ocrResponse.json().catch(() => null);
          return NextResponse.json(
            {
              error:
                errData?.error ||
                "OCR backend failed to extract text from the image.",
            },
            { status: 500 }
          );
        }

        const ocrData = (await ocrResponse.json()) as { text: string };
        extractedText = (ocrData.text || "").trim();

        if (!extractedText) {
          return NextResponse.json(
            {
              error:
                "OCR backend returned empty text. Try a clearer image with visible text.",
            },
            { status: 400 }
          );
        }

        if (extractedText.length < MIN_TEXT_LENGTH) {
          return NextResponse.json(
            {
              error:
                "Extracted text from image is too short to analyze. Please upload an image with more text.",
            },
            { status: 400 }
          );
        }
      } catch (ocrError: any) {
        console.error("OCR proxy error:", ocrError);
        return NextResponse.json(
          {
            error: `Failed to call OCR backend: ${
              ocrError?.message || "Network/connection error"
            }`,
          },
          { status: 500 }
        );
      }
    }

    const normalized = normalizeText(extractedText);
    if (!normalized) {
      return NextResponse.json(
        { error: "Extracted text is empty after normalization." },
        { status: 400 }
      );
    }

    let analysisResult = buildRuleBasedAnalysis(normalized);

    if (genAI) {
      try {
        const geminiResult = await generateGeminiAnalysis(
          normalized,
          extractedText,
          isPDF
        );
        if (geminiResult) {
          analysisResult = geminiResult;
        }
      } catch (geminiError: any) {
        console.error("Gemini Error:", geminiError);
      }
    }

    return NextResponse.json({
      text: extractedText,
      analysis: analysisResult,
    });
  } catch (error: any) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      {
        error: `Internal server error: ${
          error?.message || "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
