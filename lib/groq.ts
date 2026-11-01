/**
 * Groq API Client for Speech-to-Text (Whisper) and Chat Completions (LLM).
 * Supports automatic model fallback (primary -> fallback) and strict JSON mode.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqWordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface GroqTranscriptionResult {
  text: string;
  duration?: number;
  words?: GroqWordTimestamp[];
}

function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing GROQ_API_KEY in environment.");
  }
  return key;
}

/**
 * Executes a single Groq chat completion request.
 */
async function callChatModel(
  model: string,
  messages: GroqChatMessage[],
  options: {
    jsonMode?: boolean;
    temperature?: number;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const apiKey = getGroqApiKey();
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 35000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      const status = res.status;
      throw new Error(`Groq chat API error [HTTP ${status}] for model ${model}: ${errorText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error(`Invalid response structure from Groq model ${model}`);
    }
    // Strip <think>...</think> wrapper that some models (e.g. Qwen) emit
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
    return cleaned || content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends a chat completion prompt to the primary Groq LLM.
 * On 429, timeout, or error, automatically retries on the fallback model.
 */
export async function callGroqChatWithFallback(
  messages: GroqChatMessage[],
  options: {
    jsonMode?: boolean;
    temperature?: number;
    timeoutMs?: number;
  } = {}
): Promise<{ text: string; modelUsed: string }> {
  const primaryModel = process.env.GROQ_LLM_MODEL || "qwen/qwen3.8-27b";
  const fallbackModel = process.env.GROQ_LLM_FALLBACK_MODEL || "openai/gpt-oss-20b";

  try {
    const result = await callChatModel(primaryModel, messages, options);
    return { text: result, modelUsed: primaryModel };
  } catch (primaryError) {
    // If primary failed and fallback is distinct, retry on fallback
    if (fallbackModel && fallbackModel !== primaryModel) {
      try {
        const fallbackResult = await callChatModel(fallbackModel, messages, options);
        return { text: fallbackResult, modelUsed: fallbackModel };
      } catch (fallbackError) {
        throw new Error(
          `Both primary (${primaryModel}) and fallback (${fallbackModel}) failed. Primary: ${
            primaryError instanceof Error ? primaryError.message : String(primaryError)
          }; Fallback: ${
            fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          }`
        );
      }
    }
    throw primaryError;
  }
}

/**
 * Transcribes audio via Groq Whisper with word-level timestamps.
 * Passes a hesitation-preserving prompt to encourage retention of fillers.
 */
export async function transcribeAudioWithGroq(
  audioBlob: Blob,
  fileName: string = "recording.webm"
): Promise<GroqTranscriptionResult> {
  const apiKey = getGroqApiKey();
  const sttModel = process.env.GROQ_STT_MODEL || "whisper-large-v3-turbo";

  const formData = new FormData();
  formData.append("file", audioBlob, fileName);
  formData.append("model", sttModel);
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");
  // Prompt with natural hesitations to discourage Whisper from filtering um/uh
  formData.append(
    "prompt",
    "Umm, so, let me think, uh, like, you know, actually, well, I mean, sort of, kind of."
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq Whisper STT error [HTTP ${res.status}]: ${errText}`);
    }

    const data = await res.json();
    return {
      text: data.text || "",
      duration: data.duration,
      words: Array.isArray(data.words) ? data.words : [],
    };
  } finally {
    clearTimeout(timer);
  }
}

