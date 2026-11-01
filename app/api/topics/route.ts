import { NextResponse } from "next/server";
import { getOrGenerateDailyTopics, getSeedFallbackPool } from "@/lib/topics";
import { getISTDateKey } from "@/lib/day";

export async function GET() {
  const dayKey = getISTDateKey();
  try {
    const topics = await getOrGenerateDailyTopics(dayKey);
    return NextResponse.json({
      topics,
      day: dayKey,
      total: topics.length,
    });
  } catch (error) {
    // Fail-safe: never leave user with an empty pool or broken screen
    const seedPool = getSeedFallbackPool(dayKey);
    return NextResponse.json({
      topics: seedPool,
      day: dayKey,
      total: seedPool.length,
      fallback: true,
      error: error instanceof Error ? error.message : "Failed to generate topics",
    });
  }
}
