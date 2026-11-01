/**
 * Device identity helpers for signed anonymous cookies.
 * Uses Web Crypto API (crypto.subtle) so it runs both on Edge (middleware) and Node.js runtimes.
 */

export const DEVICE_COOKIE_NAME = "pv_device";
export const DEVICE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a deviceId using HMAC-SHA256 and returns `${deviceId}.${signatureHex}`.
 */
export async function signDeviceId(deviceId: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(deviceId));
  const sigHex = bufferToHex(signatureBuffer);
  return `${deviceId}.${sigHex}`;
}

/**
 * Verifies a signed device cookie value.
 * If valid, returns the deviceId. If invalid, tampered or missing, returns null.
 */
export async function verifyDeviceCookie(
  cookieValue: string | undefined | null,
  secret: string
): Promise<string | null> {
  if (!cookieValue || typeof cookieValue !== "string") {
    return null;
  }

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex <= 0) {
    return null;
  }

  const deviceId = cookieValue.slice(0, dotIndex);
  const expectedSigHex = cookieValue.slice(dotIndex + 1);
  if (!deviceId || !expectedSigHex) {
    return null;
  }

  try {
    const key = await getHmacKey(secret);
    const enc = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(deviceId));
    const computedSigHex = bufferToHex(signatureBuffer);

    // Constant-time length and value check
    if (computedSigHex.length !== expectedSigHex.length) {
      return null;
    }

    let mismatch = 0;
    for (let i = 0; i < computedSigHex.length; i++) {
      mismatch |= computedSigHex.charCodeAt(i) ^ expectedSigHex.charCodeAt(i);
    }

    return mismatch === 0 ? deviceId : null;
  } catch {
    return null;
  }
}

/**
 * Creates a fresh device ID and signed cookie value.
 */
export async function createNewSignedDevice(
  secret: string
): Promise<{ deviceId: string; cookieValue: string }> {
  const deviceId = crypto.randomUUID();
  const cookieValue = await signDeviceId(deviceId, secret);
  return { deviceId, cookieValue };
}

