import { NextRequest, NextResponse } from "next/server";
import { getOrGenerateDailyTopics } from "@/lib/topics";
import { getISTDateKey } from "@/lib/day";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayKey = getISTDateKey();
  try {
    const topics = await getOrGenerateDailyTopics(dayKey);
    return NextResponse.json({
      success: true,
      day: dayKey,
      count: topics.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run cron topic generation" },
      { status: 500 }
    );
  }
}
