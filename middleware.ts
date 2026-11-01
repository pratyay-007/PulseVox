import { NextResponse, type NextRequest } from "next/server";
import {
  DEVICE_COOKIE_NAME,
  DEVICE_COOKIE_MAX_AGE,
  verifyDeviceCookie,
  createNewSignedDevice,
} from "./lib/device";

export async function middleware(request: NextRequest) {
  const secret = process.env.COOKIE_SECRET || "fallback-secret-for-pulsevox-development";
  const existingCookie = request.cookies.get(DEVICE_COOKIE_NAME)?.value;

  const validDeviceId = await verifyDeviceCookie(existingCookie, secret);

  if (validDeviceId) {
    return NextResponse.next();
  }

  // Issue fresh signed device ID
  const { cookieValue } = await createNewSignedDevice(secret);

  const response = NextResponse.next();
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: DEVICE_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - fonts (custom font files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|fonts|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
