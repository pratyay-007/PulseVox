import { NextRequest } from "next/server";
import { DEVICE_COOKIE_NAME, verifyDeviceCookie } from "@/lib/device";
import { checkLimits, incrementUsageCounters } from "@/lib/limits";
import { getISTDateKey } from "@/lib/day";
import { transcribeAudioWithGroq } from "@/lib/groq";
import { calculateSpeechStats } from "@/lib/stats";
import { generateFeedbackWithAI } from "@/lib/feedback";

export const maxDuration = 60; // Max allowed for Vercel Hobby functions

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a transform stream for streaming NDJSON stage events
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (data: Record<string, unknown>) => {
    try {
      await writer.write(encoder.encode(JSON.stringify(data) + "\n"));
    } catch {
      // Client disconnected
    }
  };

  // Run the pipeline asynchronously in background while streaming
  (async () => {
    let deviceId: string | null = null;
    let ip = "127.0.0.1";
    const dayKey = getISTDateKey();

    try {
      // 1. Verify device identity cookie
      const secret = process.env.COOKIE_SECRET || "fallback-secret-for-pulsevox-development";
      const cookieVal = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
      deviceId = await verifyDeviceCookie(cookieVal, secret);

      if (!deviceId) {
        await sendEvent({
          stage: "error",
          error: "Invalid or missing device session. Please refresh the page.",
        });
        await writer.close();
        return;
      }

      // Extract client IP
      const forwarded = request.headers.get("x-forwarded-for");
      ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      // 2. Check limits BEFORE making any external AI calls
      const limitResult = await checkLimits(deviceId, ip, dayKey);
      if (!limitResult.allowed) {
        let msg = "Daily limit reached, resets at midnight IST.";
        if (limitResult.reason === "global_limit" || limitResult.capacityFull) {
          msg = "Today's free capacity is full. Please try again tomorrow at midnight IST.";
        } else if (limitResult.reason === "ip_limit") {
          msg = "Daily IP trial limit reached. Please try again tomorrow at midnight IST.";
        }
        await sendEvent({ stage: "error", error: msg });
        await writer.close();
        return;
      }

      // Parse multipart form data
      const formData = await request.formData();
      const audioFile = formData.get("audio");
      const durationSecRaw = formData.get("durationSec");
      const topicTitleRaw = formData.get("topicTitle");

      if (!audioFile || !(audioFile instanceof Blob)) {
        await sendEvent({ stage: "error", error: "Missing audio recording file." });
        await writer.close();
        return;
      }

      const durationSec = durationSecRaw ? Math.max(1, parseInt(String(durationSecRaw), 10)) : 180;
      const topicTitle = topicTitleRaw ? String(topicTitleRaw).trim() : "Speaking Practice";

      // Stage 1: Transcribing
      await sendEvent({ stage: "transcribing" });

      const transcription = await transcribeAudioWithGroq(audioFile, "recording.webm");
      const transcriptText = transcription.text.trim();
      const words = transcription.words || [];

      // 3. Reject recordings under ~30 words as "too short" (does NOT burn a trial)
      const tokenCount = words.length > 0 ? words.length : transcriptText.split(/\s+/).filter(Boolean).length;
      if (tokenCount < 30) {
        await sendEvent({
          stage: "error",
          error: `Recording too short (${tokenCount} words detected). Please speak for at least 30 words to receive coaching feedback. No daily trial was used.`,
        });
        await writer.close();
        return;
      }

      // 4. Deterministic code statistics (word count, WPM, fillers, pauses, vocabulary variety)
      const stats = calculateSpeechStats(transcriptText, words, durationSec);

      // Stage 2: Analysing
      await sendEvent({ stage: "analysing" });

      const feedback = await generateFeedbackWithAI(topicTitle, transcriptText, stats);

      // 5. Increment usage counters ONLY upon complete pipeline success!
      await incrementUsageCounters(deviceId, ip, dayKey);

      // Stage 3: Done with full result payload
      await sendEvent({
        stage: "done",
        result: {
          id: `${dayKey}-${Date.now()}`,
          date: new Date().toISOString(),
          topicTitle,
          durationSec,
          transcript: transcriptText,
          words,
          stats,
          feedback,
        },
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unexpected error occurred during analysis.";
      await sendEvent({ stage: "error", error: errorMsg });
    } finally {
      try {
        await writer.close();
      } catch {
        // Stream might already be closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
