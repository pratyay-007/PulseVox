import { GroqWordTimestamp } from "./groq";

export interface PauseItem {
  timestampSec: number;
  durationSec: number;
  afterWord: string;
}

export interface FillerBreakdown {
  type: string;
  count: number;
}

export interface SpeechStats {
  durationSec: number;
  wordCount: number;
  wpm: number;
  detectedFillersCount: number;
  fillersBreakdown: FillerBreakdown[];
  longPausesCount: number;
  longPauses: PauseItem[];
  vocabularyVarietyRatio: number; // 0 to 1
}

const COMMON_FILLERS = [
  "um",
  "umm",
  "uh",
  "uhh",
  "er",
  "err",
  "ah",
  "ahh",
  "hmm",
  "you know",
  "i mean",
  "basically",
  "actually",
  "kind of",
  "sort of",
];

function cleanWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "").trim();
}

/**
 * Computes deterministic speech statistics from transcript text and word-level timestamps.
 */
export function calculateSpeechStats(
  transcript: string,
  words: GroqWordTimestamp[] = [],
  durationSec: number = 0
): SpeechStats {
  const effectiveDurationSec = Math.max(1, durationSec);

  // Fallback word tokenization if word timestamps are missing
  const rawTokens = transcript
    .trim()
    .split(/\s+/)
    .map(cleanWord)
    .filter((w) => w.length > 0);

  const wordCount = words.length > 0 ? words.length : rawTokens.length;
  const wpm = Math.round((wordCount / effectiveDurationSec) * 60);

  // 1. Vocabulary Variety Ratio (Type-Token Ratio)
  const uniqueWords = new Set(rawTokens);
  const vocabularyVarietyRatio =
    rawTokens.length > 0
      ? Math.round((uniqueWords.size / rawTokens.length) * 100) / 100
      : 0;

  // 2. Pause Detection (pauses >= 1.5 seconds)
  const longPauses: PauseItem[] = [];
  if (words.length > 1) {
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      const gap = nextWord.start - currentWord.end;
      if (gap >= 1.5) {
        longPauses.push({
          timestampSec: Math.round(currentWord.end * 10) / 10,
          durationSec: Math.round(gap * 10) / 10,
          afterWord: currentWord.word.trim(),
        });
      }
    }
  }

  // 3. Filler Word Detection
  const fillerCounts = new Map<string, number>();

  // Check multi-word fillers in full text (e.g. "you know", "i mean", "kind of", "sort of")
  const lowerTranscript = ` ${transcript.toLowerCase().replace(/[^a-z0-9'\s]/g, " ")} `;
  const multiWordFillers = ["you know", "i mean", "kind of", "sort of"];

  for (const phrase of multiWordFillers) {
    const regex = new RegExp(`\\b${phrase}\\b`, "gi");
    const matches = lowerTranscript.match(regex);
    if (matches && matches.length > 0) {
      fillerCounts.set(phrase, matches.length);
    }
  }

  // Check single-word fillers
  // "like" and "so" are counted only as hesitations after a pause of >= 0.4s
  if (words.length > 0) {
    for (let i = 0; i < words.length; i++) {
      const w = cleanWord(words[i].word);
      if (!w) continue;

      if (["um", "umm", "uh", "uhh", "er", "err", "ah", "ahh", "hmm", "basically", "actually"].includes(w)) {
        const canonical = w.startsWith("um")
          ? "um"
          : w.startsWith("uh")
          ? "uh"
          : w.startsWith("er")
          ? "er"
          : w.startsWith("ah")
          ? "ah"
          : w;
        fillerCounts.set(canonical, (fillerCounts.get(canonical) || 0) + 1);
      } else if (w === "like" || w === "so") {
        // Count as hesitation if preceded by pause >= 0.4s or first word of speech
        const prevEnd = i > 0 ? words[i - 1].end : 0;
        const pauseBefore = words[i].start - prevEnd;
        if (i === 0 || pauseBefore >= 0.4) {
          fillerCounts.set(w, (fillerCounts.get(w) || 0) + 1);
        }
      }
    }
  } else {
    // Timestamp fallback: count standalone single-word fillers in raw tokens
    for (const w of rawTokens) {
      if (COMMON_FILLERS.includes(w)) {
        const canonical = w.startsWith("um")
          ? "um"
          : w.startsWith("uh")
          ? "uh"
          : w.startsWith("er")
          ? "er"
          : w.startsWith("ah")
          ? "ah"
          : w;
        fillerCounts.set(canonical, (fillerCounts.get(canonical) || 0) + 1);
      }
    }
  }

  let totalFillers = 0;
  const fillersBreakdown: FillerBreakdown[] = [];
  for (const [type, count] of fillerCounts.entries()) {
    if (count > 0) {
      totalFillers += count;
      fillersBreakdown.push({ type, count });
    }
  }

  fillersBreakdown.sort((a, b) => b.count - a.count);

  return {
    durationSec: effectiveDurationSec,
    wordCount,
    wpm,
    detectedFillersCount: totalFillers,
    fillersBreakdown,
    longPausesCount: longPauses.length,
    longPauses,
    vocabularyVarietyRatio,
  };
}

