import { callGroqChatWithFallback, GroqChatMessage } from "./groq";
import { SpeechStats } from "./stats";

export interface GrammarCorrection {
  original: string;
  improved: string;
  reason: string;
}

export interface VocabularyUpgrade {
  original: string;
  better: string;
  note: string;
}

export interface PhrasingSuggestion {
  original: string;
  improved: string;
  why: string;
}

export interface SpeechStructure {
  opening: string;
  body: string;
  closing: string;
}

export interface FeedbackResult {
  summary: string;
  strengths: string[];
  grammar: GrammarCorrection[];
  vocabulary: VocabularyUpgrade[];
  phrasing: PhrasingSuggestion[];
  structure: SpeechStructure;
  confidence: string;
  topicRelevance: string;
  nextSteps: string[];
}

export function validateFeedbackSchema(data: unknown): {
  valid: boolean;
  errors: string[];
  feedback?: FeedbackResult;
} {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Feedback must be a JSON object."] };
  }

  const d = data as Partial<FeedbackResult>;

  if (typeof d.summary !== "string" || d.summary.trim().length < 20) {
    errors.push("Missing or too short 'summary' (must be 3-5 sentences).");
  }

  if (!Array.isArray(d.strengths) || d.strengths.length === 0) {
    errors.push("Missing or empty 'strengths' array.");
  }

  if (!Array.isArray(d.grammar)) {
    errors.push("'grammar' must be an array of corrections.");
  } else {
    for (let i = 0; i < d.grammar.length; i++) {
      const g = d.grammar[i];
      if (!g.original || !g.improved || !g.reason) {
        errors.push(`grammar[${i}] must have 'original', 'improved', and 'reason'.`);
      }
    }
  }

  if (!Array.isArray(d.vocabulary)) {
    errors.push("'vocabulary' must be an array of upgrades.");
  } else {
    for (let i = 0; i < d.vocabulary.length; i++) {
      const v = d.vocabulary[i];
      if (!v.original || !v.better || !v.note) {
        errors.push(`vocabulary[${i}] must have 'original', 'better', and 'note'.`);
      }
    }
  }

  if (!Array.isArray(d.phrasing)) {
    errors.push("'phrasing' must be an array of suggestions.");
  } else {
    for (let i = 0; i < d.phrasing.length; i++) {
      const p = d.phrasing[i];
      if (!p.original || !p.improved || !p.why) {
        errors.push(`phrasing[${i}] must have 'original', 'improved', and 'why'.`);
      }
    }
  }

  if (!d.structure || typeof d.structure !== "object") {
    errors.push("'structure' must be an object with opening, body, and closing.");
  } else {
    if (!d.structure.opening || !d.structure.body || !d.structure.closing) {
      errors.push("structure must include 'opening', 'body', and 'closing'.");
    }
  }

  if (typeof d.confidence !== "string" || !d.confidence) {
    errors.push("Missing 'confidence' evaluation.");
  }

  if (typeof d.topicRelevance !== "string" || !d.topicRelevance) {
    errors.push("Missing 'topicRelevance' evaluation.");
  }

  if (!Array.isArray(d.nextSteps) || d.nextSteps.length !== 3) {
    errors.push("'nextSteps' must contain exactly 3 concrete practice actions.");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    feedback: d as FeedbackResult,
  };
}

/**
 * Prompts Groq LLM to generate in-depth English speaking feedback.
 */
export async function generateFeedbackWithAI(
  topicTitle: string,
  transcript: string,
  stats: SpeechStats
): Promise<FeedbackResult> {
  const systemPrompt = `You are an expert, encouraging, and honest English speaking coach for PulseVox.
Analyze the user's spoken response to the assigned speaking topic.

CRITICAL RULES:
1. Every "original" field in grammar, vocabulary, and phrasing MUST be an EXACT quote from the transcript text below. The user interface uses this exact substring to highlight mistakes in the transcript.
2. If there are no grammar mistakes, return an empty array [] for grammar. DO NOT invent false mistakes.
3. If there are no vocabulary upgrades, return an empty array [] for vocabulary.
4. Reference real numbers from the speaker's statistics (e.g. ${stats.wpm} words/minute, ${stats.detectedFillersCount} detected fillers, ${stats.longPausesCount} long pauses) in the summary.
5. No numeric "score" (no "8/10", no percentages).
6. Provide exactly 3 concrete, actionable next steps in "nextSteps".
7. Return strictly valid JSON adhering to the required schema with no extra commentary or markdown fences.`;

  const userPrompt = `Speaking Topic: "${topicTitle}"

Speaker Stats:
- Speaking Duration: ${stats.durationSec} seconds
- Total Word Count: ${stats.wordCount} words
- Speaking Pace: ${stats.wpm} words per minute
- Detected Fillers: ${stats.detectedFillersCount} (${stats.fillersBreakdown
    .map((f) => `${f.type}: ${f.count}`)
    .join(", ") || "none"})
- Long Pauses (>1.5s): ${stats.longPausesCount}
- Vocabulary Variety Ratio: ${stats.vocabularyVarietyRatio}

Transcript:
"""
${transcript}
"""

Please respond with ONLY a valid JSON object matching this exact schema:
{
  "summary": "3-5 sentences speaking directly to the learner, referencing real numbers from their stats",
  "strengths": ["1-3 specific strong points observed in their speech"],
  "grammar": [
    { "original": "exact quote from transcript", "improved": "corrected version", "reason": "brief explanation" }
  ],
  "vocabulary": [
    { "original": "exact word/phrase from transcript", "better": "more precise/advanced alternative", "note": "why it's better" }
  ],
  "phrasing": [
    { "original": "exact clumsy phrasing from transcript", "improved": "natural idiom/flow", "why": "stylistic reason" }
  ],
  "structure": {
    "opening": "evaluation of how they introduced the topic",
    "body": "evaluation of argument development and examples",
    "closing": "evaluation of conclusion and final takeaway"
  },
  "confidence": "observation on speech flow, hesitation patterns, and perceived poise",
  "topicRelevance": "evaluation of how directly they answered the prompt",
  "nextSteps": [
    "action 1",
    "action 2",
    "action 3"
  ]
}`;

  const messages: GroqChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  let completion = await callGroqChatWithFallback(messages, { jsonMode: true, temperature: 0.4 });
  let parsed: unknown;

  try {
    parsed = JSON.parse(completion.text);
  } catch (err) {
    // Retry once with error appended
    messages.push({ role: "assistant", content: completion.text });
    messages.push({
      role: "user",
      content: `Invalid JSON response: ${
        err instanceof Error ? err.message : String(err)
      }. Return ONLY a valid JSON object matching the required schema.`,
    });
    completion = await callGroqChatWithFallback(messages, { jsonMode: true, temperature: 0.2 });
    parsed = JSON.parse(completion.text);
  }

  const validation = validateFeedbackSchema(parsed);
  if (!validation.valid) {
    // Retry once with validation errors
    messages.push({ role: "assistant", content: completion.text });
    messages.push({
      role: "user",
      content: `Schema validation failed:\n${validation.errors.join(
        "\n"
      )}\nPlease output corrected valid JSON.`,
    });
    const retryCompletion = await callGroqChatWithFallback(messages, {
      jsonMode: true,
      temperature: 0.2,
    });
    const retryParsed = JSON.parse(retryCompletion.text);
    const retryValidation = validateFeedbackSchema(retryParsed);
    if (retryValidation.valid && retryValidation.feedback) {
      return retryValidation.feedback;
    }
    throw new Error(`Feedback validation failed: ${retryValidation.errors.join("; ")}`);
  }

  return validation.feedback!;
}

