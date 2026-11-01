import { NextRequest, NextResponse } from "next/server";
import { DEVICE_COOKIE_NAME, verifyDeviceCookie } from "@/lib/device";
import { checkLimits } from "@/lib/limits";
import { getISTDateKey } from "@/lib/day";

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.COOKIE_SECRET || "fallback-secret-for-pulsevox-development";
    const cookieVal = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
    const deviceId = await verifyDeviceCookie(cookieVal, secret);

    if (!deviceId) {
      return NextResponse.json(
        { error: "Invalid or missing device session", remaining: 0, limit: 3, capacityFull: false },
        { status: 401 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const dayKey = getISTDateKey();

    const limitResult = await checkLimits(deviceId, ip, dayKey);

    return NextResponse.json({
      remaining: limitResult.remainingDevice,
      limit: limitResult.deviceCap,
      day: dayKey,
      capacityFull: limitResult.capacityFull,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message, remaining: 0, limit: 3, capacityFull: false },
      { status: 500 }
    );
  }
}
