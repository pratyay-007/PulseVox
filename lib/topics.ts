import { getRedis } from "./redis";
import { getISTDateKey } from "./day";
import { fetchCurrentHeadlines, HeadlineItem } from "./rss";
import { callGroqChatWithFallback, GroqChatMessage } from "./groq";
import seedTopicsData from "@/data/seed-topics.json";

export type TopicGenre =
  | "current-affairs"
  | "technology"
  | "society-culture"
  | "personal-stories"
  | "debate"
  | "career-education"
  | "health-sports-lifestyle"
  | "entertainment"
  | "ethics-scenarios"
  | "business-money";

export type TopicType = "opinion" | "debate" | "story" | "describe";
export type TopicDifficulty = "easy" | "medium" | "hard";

export interface Topic {
  id: string;
  genre: TopicGenre;
  type: TopicType;
  title: string;
  hints: string[];
  difficulty: TopicDifficulty;
}

export const REQUIRED_GENRES: readonly TopicGenre[] = [
  "current-affairs",
  "technology",
  "society-culture",
  "personal-stories",
  "debate",
  "career-education",
  "health-sports-lifestyle",
  "entertainment",
  "ethics-scenarios",
  "business-money",
] as const;

export const TOPICS_PER_GENRE = 5;
export const TOTAL_TOPICS_PER_DAY = REQUIRED_GENRES.length * TOPICS_PER_GENRE; // 50

/**
 * Validates a list of topics to ensure exact shape, correct genre distribution, and hint counts.
 */
export function validateTopicPool(
  topics: unknown,
  existingTitles: Set<string> = new Set()
): { valid: boolean; errors: string[]; validatedTopics: Topic[] } {
  const errors: string[] = [];
  if (!Array.isArray(topics)) {
    return { valid: false, errors: ["Topics must be a JSON array."], validatedTopics: [] };
  }

  const validatedTopics: Topic[] = [];
  const genreCounts = new Map<string, number>();
  const seenTodayTitles = new Set<string>();

  for (let i = 0; i < topics.length; i++) {
    const t = topics[i] as Partial<Topic>;
    const idx = `Topic[${i}]`;

    if (!t || typeof t !== "object") {
      errors.push(`${idx} is not an object.`);
      continue;
    }

    if (!t.title || typeof t.title !== "string" || t.title.trim().length < 10) {
      errors.push(`${idx} has invalid or too short title.`);
      continue;
    }

    const normTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenTodayTitles.has(normTitle)) {
      errors.push(`${idx} title is a duplicate within today's pool: "${t.title}".`);
    }
    seenTodayTitles.add(normTitle);

    if (existingTitles.has(normTitle)) {
      errors.push(`${idx} title duplicates a topic from the last 7 days: "${t.title}".`);
    }

    if (!t.genre || !REQUIRED_GENRES.includes(t.genre as TopicGenre)) {
      errors.push(`${idx} has unknown genre "${t.genre}".`);
      continue;
    }

    if (!t.type || !["opinion", "debate", "story", "describe"].includes(t.type)) {
      errors.push(`${idx} has invalid type "${t.type}".`);
    }

    if (!t.difficulty || !["easy", "medium", "hard"].includes(t.difficulty)) {
      errors.push(`${idx} has invalid difficulty "${t.difficulty}".`);
    }

    if (!Array.isArray(t.hints) || t.hints.length < 2 || t.hints.length > 3) {
      errors.push(`${idx} hints must be an array of 2 or 3 guiding questions.`);
    }

    const currentCount = (genreCounts.get(t.genre) || 0) + 1;
    genreCounts.set(t.genre, currentCount);

    validatedTopics.push({
      id: t.id || `topic-${i + 1}`,
      genre: t.genre as TopicGenre,
      type: t.type as TopicType,
      title: t.title.trim(),
      hints: Array.isArray(t.hints) ? t.hints.map((h) => String(h).trim()) : [],
      difficulty: t.difficulty as TopicDifficulty,
    });
  }

  // Verify genre counts: exactly 5 per genre
  for (const genre of REQUIRED_GENRES) {
    const count = genreCounts.get(genre) || 0;
    if (count !== TOPICS_PER_GENRE) {
      errors.push(`Genre "${genre}" has ${count} topics; exactly ${TOPICS_PER_GENRE} required.`);
    }
  }

  if (validatedTopics.length !== TOTAL_TOPICS_PER_DAY) {
    errors.push(
      `Pool has ${validatedTopics.length} valid topics; exactly ${TOTAL_TOPICS_PER_DAY} required.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    validatedTopics,
  };
}

/**
 * Returns a fallback pool of 50 topics from seed data.
 */
export function getSeedFallbackPool(dayKey: string = getISTDateKey()): Topic[] {
  const seedList = seedTopicsData as Topic[];
  const pool: Topic[] = [];

  for (const genre of REQUIRED_GENRES) {
    const genreSeeds = seedList.filter((s) => s.genre === genre);
    // Take 5 items for this genre
    const selected = genreSeeds.slice(0, TOPICS_PER_GENRE);
    selected.forEach((item, index) => {
      pool.push({
        ...item,
        id: `${dayKey}-${item.genre.slice(0, 3)}-${index + 1}`,
      });
    });
  }

  return pool;
}

/**
 * Reads past 7 days of topic titles from Redis for deduplication.
 */
export async function getRecentTitlesForDedupe(dayKey: string = getISTDateKey()): Promise<Set<string>> {
  const seen = new Set<string>();
  try {
    const redis = getRedis();
    const [year, month, day] = dayKey.split("-").map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));

    const keys: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date(currentDate);
      pastDate.setUTCDate(pastDate.getUTCDate() - i);
      const pastKey = pastDate.toISOString().slice(0, 10);
      keys.push(`topics:${pastKey}`);
    }

    const pastPools = await Promise.all(keys.map((k) => redis.get<Topic[] | string>(k)));
    for (const raw of pastPools) {
      if (!raw) continue;
      const parsed: Topic[] = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.title) {
            seen.add(item.title.toLowerCase().replace(/[^a-z0-9]/g, ""));
          }
        }
      }
    }
  } catch {
    // If Redis is unavailable during dedupe read, proceed without blocking
  }
  return seen;
}

/**
 * Prompts Groq LLM to generate 50 structured daily speaking topics.
 */
export async function generateTopicsWithAI(
  dayKey: string = getISTDateKey(),
  headlines: HeadlineItem[]
): Promise<Topic[]> {
  const recentTitles = await getRecentTitlesForDedupe(dayKey);

  const headlineBulletList = headlines
    .slice(0, 15)
    .map((h) => `- [${h.source}] ${h.title}`)
    .join("\n");

  const systemPrompt = `You are a curriculum designer for PulseVox, an AI English-speaking coach.
Your job is to generate exactly 50 speaking topics (5 topics each across 10 specific genres) for date ${dayKey}.
Every topic must be engaging, clear, and relevant to modern adult learners practicing spoken fluency.

The 10 genres (EXACTLY 5 topics each, strictly following this naming):
1. "current-affairs" - MUST be based on the provided real news headlines below. Frame topics neutrally and constructively; never write one-sided political rhetoric.
2. "technology" - AI, software, computing, biotech, mobile, consumer tech.
3. "society-culture" - Social habits, community, cultural traditions, modern lifestyle trends.
4. "personal-stories" - Reflective narrative prompts ("A time when...", "An experience that taught you..."). Type MUST be "story".
5. "debate" - Two-sided philosophical, civic, or economic issues. Type MUST be "debate".
6. "career-education" - Workplace dynamics, mentorship, learning, skills, career decisions.
7. "health-sports-lifestyle" - Fitness, nutrition, sleep, outdoor recreation, athletics, wellness.
8. "entertainment" - Gaming, film, music, literature, streaming, live arts.
9. "ethics-scenarios" - Moral dilemmas, corporate ethics, bioethics, practical integrity.
10. "business-money" - Financial literacy, entrepreneurship, market trends, consumer psychology.

Strict Requirements:
- Output MUST be valid JSON adhering to: { "topics": [ ...50 items... ] }
- Each item MUST have:
  "id": "${dayKey}-{genreShort}-{01..05}",
  "genre": one of the 10 exact genres above,
  "type": "opinion" | "debate" | "story" | "describe",
  "title": clear speaking topic title string (10 to 90 characters),
  "hints": array of exactly 2 or 3 guiding questions to help the speaker structure their thoughts,
  "difficulty": "easy" | "medium" | "hard"
- Exactly 5 topics per genre = exactly 50 topics total.
- Do NOT output any markdown fences, explanation, or commentary outside the JSON.`;

  const userPrompt = `Here are today's real news headlines to build the 5 "current-affairs" topics from:
${headlineBulletList}

Please generate the complete 50-topic pool for ${dayKey} in valid JSON format.`;

  const messages: GroqChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // First attempt
  let completion = await callGroqChatWithFallback(messages, { jsonMode: true, temperature: 0.6 });
  let parsed: unknown;

  try {
    const raw = JSON.parse(completion.text);
    parsed = Array.isArray(raw) ? raw : raw.topics;
  } catch (err) {
    // Retry once with error appended
    messages.push({ role: "assistant", content: completion.text });
    messages.push({
      role: "user",
      content: `Your previous response was not valid JSON (${
        err instanceof Error ? err.message : String(err)
      }). Please return ONLY valid JSON matching { "topics": [ ...50 items... ] }.`,
    });
    completion = await callGroqChatWithFallback(messages, { jsonMode: true, temperature: 0.4 });
    const rawRetry = JSON.parse(completion.text);
    parsed = Array.isArray(rawRetry) ? rawRetry : rawRetry.topics;
  }

  const validation = validateTopicPool(parsed, recentTitles);
  if (!validation.valid) {
    // Attempt one self-correction retry
    messages.push({ role: "assistant", content: completion.text });
    messages.push({
      role: "user",
      content: `The generated topics had validation errors:\n${validation.errors.slice(0, 10).join("\n")}\nFix all issues and output the full 50 topics in valid JSON.`,
    });
    const retryCompletion = await callGroqChatWithFallback(messages, {
      jsonMode: true,
      temperature: 0.3,
    });
    const retryRaw = JSON.parse(retryCompletion.text);
    const retryParsed = Array.isArray(retryRaw) ? retryRaw : retryRaw.topics;
    const retryValidation = validateTopicPool(retryParsed, recentTitles);

    if (retryValidation.valid) {
      return retryValidation.validatedTopics;
    }
    throw new Error(`Topics validation failed after retry: ${retryValidation.errors.join("; ")}`);
  }

  return validation.validatedTopics;
}

/**
 * Lazy topic loader:
 * 1. Checks Redis cache `topics:{dayKey}`
 * 2. If missing, acquires lock `topics:lock:{dayKey}`
 * 3. Fetches RSS news headlines & calls Groq
 * 4. On failure, falls back to yesterday's pool, then seed topics
 * 5. Saves to Redis with 8-day expiry
 */
export async function getOrGenerateDailyTopics(dayKey: string = getISTDateKey()): Promise<Topic[]> {
  let redis;
  try {
    redis = getRedis();
  } catch {
    // If Redis is not configured, fallback to seed
    return getSeedFallbackPool(dayKey);
  }

  const cacheKey = `topics:${dayKey}`;
  const lockKey = `topics:lock:${dayKey}`;

  // 1. Read cache
  try {
    const cached = await redis.get<Topic[] | string>(cacheKey);
    if (cached) {
      const parsed: Topic[] = typeof cached === "string" ? JSON.parse(cached) : cached;
      if (Array.isArray(parsed) && parsed.length >= 50) {
        return parsed;
      }
    }
  } catch {
    // Cache read failure, proceed to generation
  }

  // 2. Try lock: stops two concurrent requests generating at once
  let acquiredLock = false;
  try {
    const lock = await redis.set(lockKey, "locked", { nx: true, ex: 120 });
    acquiredLock = lock === "OK";
  } catch {
    acquiredLock = true;
  }

  if (!acquiredLock) {
    // Lock was already taken by another request; wait 2.5s and re-read
    await new Promise((res) => setTimeout(res, 2500));
    try {
      const reRead = await redis.get<Topic[] | string>(cacheKey);
      if (reRead) {
        const parsed: Topic[] = typeof reRead === "string" ? JSON.parse(reRead) : reRead;
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      }
    } catch {
      // Re-read failed
    }
    // Still not ready; serve seed list
    return getSeedFallbackPool(dayKey);
  }

  // 3. Generate with Groq using live RSS headlines
  try {
    const headlines = await fetchCurrentHeadlines(20);
    const generated = await generateTopicsWithAI(dayKey, headlines);

    // 4. Store in Redis with 8-day expiry (691,200 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(generated), { ex: 8 * 24 * 60 * 60 });
      await redis.del(lockKey);
    } catch {
      // Save error
    }

    return generated;
  } catch {
    // AI generation failed; check yesterday's pool
    try {
      const [year, month, day] = dayKey.split("-").map(Number);
      const yesterdayDate = new Date(Date.UTC(year, month - 1, day));
      yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
      const yesterdayKey = yesterdayDate.toISOString().slice(0, 10);

      const yesterdayCached = await redis.get<Topic[] | string>(`topics:${yesterdayKey}`);
      if (yesterdayCached) {
        const parsed: Topic[] =
          typeof yesterdayCached === "string" ? JSON.parse(yesterdayCached) : yesterdayCached;
        if (Array.isArray(parsed) && parsed.length >= 50) {
          return parsed;
        }
      }
    } catch {
      // Yesterday read error
    }

    // Ultimate fallback: seed list
    return getSeedFallbackPool(dayKey);
  } finally {
    try {
      await redis.del(lockKey);
    } catch {
      // Ignore unlock failure
    }
  }
}

