import { getRedis } from "./redis";
import { getISTDateKey } from "./day";

const EXPIRY_SECONDS_36H = 36 * 60 * 60; // 36 hours

export interface LimitsConfig {
  deviceCap: number;
  ipCap: number;
  globalCap: number;
  bypass: boolean;
}

export function getLimitsConfig(): LimitsConfig {
  return {
    deviceCap: parseInt(process.env.DAILY_TRIALS_PER_DEVICE || "3", 10),
    ipCap: parseInt(process.env.DAILY_TRIALS_PER_IP || "15", 10),
    globalCap: parseInt(process.env.DAILY_GLOBAL_CAP || "120", 10),
    bypass: process.env.DEV_BYPASS_LIMIT === "true",
  };
}

/**
 * Hashes an IP address using SHA-256 salted with COOKIE_SECRET.
 * Never stores or logs raw IP addresses in Redis.
 */
export async function hashIp(ip: string): Promise<string> {
  const secret = process.env.COOKIE_SECRET || "fallback-ip-salt";
  const enc = new TextEncoder();
  const data = enc.encode(`${secret}:${ip}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hashBuffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: "device_limit" | "ip_limit" | "global_limit";
  remainingDevice: number;
  deviceCap: number;
  capacityFull: boolean;
  counts: {
    device: number;
    ip: number;
    global: number;
  };
}

/**
 * Checks current usage against limits for a device, IP, and the entire app.
 */
export async function checkLimits(
  deviceId: string,
  ip: string,
  dayKey: string = getISTDateKey()
): Promise<LimitCheckResult> {
  const config = getLimitsConfig();

  if (config.bypass) {
    return {
      allowed: true,
      remainingDevice: config.deviceCap,
      deviceCap: config.deviceCap,
      capacityFull: false,
      counts: { device: 0, ip: 0, global: 0 },
    };
  }

  const redis = getRedis();
  const ipHash = await hashIp(ip);

  const deviceKey = `usage:device:${deviceId}:${dayKey}`;
  const ipKey = `usage:ip:${ipHash}:${dayKey}`;
  const globalKey = `usage:global:${dayKey}`;

  const [deviceCountRaw, ipCountRaw, globalCountRaw] = await Promise.all([
    redis.get<number>(deviceKey),
    redis.get<number>(ipKey),
    redis.get<number>(globalKey),
  ]);

  const deviceCount = Number(deviceCountRaw) || 0;
  const ipCount = Number(ipCountRaw) || 0;
  const globalCount = Number(globalCountRaw) || 0;

  const capacityFull = globalCount >= config.globalCap;
  const remainingDevice = Math.max(0, config.deviceCap - deviceCount);

  if (deviceCount >= config.deviceCap) {
    return {
      allowed: false,
      reason: "device_limit",
      remainingDevice: 0,
      deviceCap: config.deviceCap,
      capacityFull,
      counts: { device: deviceCount, ip: ipCount, global: globalCount },
    };
  }

  if (ipCount >= config.ipCap) {
    return {
      allowed: false,
      reason: "ip_limit",
      remainingDevice,
      deviceCap: config.deviceCap,
      capacityFull,
      counts: { device: deviceCount, ip: ipCount, global: globalCount },
    };
  }

  if (capacityFull) {
    return {
      allowed: false,
      reason: "global_limit",
      remainingDevice,
      deviceCap: config.deviceCap,
      capacityFull: true,
      counts: { device: deviceCount, ip: ipCount, global: globalCount },
    };
  }

  return {
    allowed: true,
    remainingDevice,
    deviceCap: config.deviceCap,
    capacityFull: false,
    counts: { device: deviceCount, ip: ipCount, global: globalCount },
  };
}

/**
 * Increments the device, IP, and global session counters with 36-hour expiry.
 * Must only be called after a speaking session has fully succeeded.
 */
export async function incrementUsageCounters(
  deviceId: string,
  ip: string,
  dayKey: string = getISTDateKey()
): Promise<void> {
  const config = getLimitsConfig();
  if (config.bypass) {
    return;
  }

  const redis = getRedis();
  const ipHash = await hashIp(ip);

  const deviceKey = `usage:device:${deviceId}:${dayKey}`;
  const ipKey = `usage:ip:${ipHash}:${dayKey}`;
  const globalKey = `usage:global:${dayKey}`;

  const pipe = redis.pipeline();
  pipe.incr(deviceKey);
  pipe.expire(deviceKey, EXPIRY_SECONDS_36H);
  pipe.incr(ipKey);
  pipe.expire(ipKey, EXPIRY_SECONDS_36H);
  pipe.incr(globalKey);
  pipe.expire(globalKey, EXPIRY_SECONDS_36H);

  await pipe.exec();
}

