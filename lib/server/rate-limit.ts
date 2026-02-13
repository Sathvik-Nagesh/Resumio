import { NextRequest, NextResponse } from "next/server";

import { consumeIpUsage, consumeMemoryUsage } from "@/lib/server/usage";

export const getRequestIp = (request: NextRequest) =>
  (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();

const toSeconds = (ms: number) => Math.max(1, Math.ceil(ms / 1000));

export const rateLimitErrorResponse = (params: {
  message: string;
  limit: number;
  resetAt: number;
}) => {
  const retryAfterSeconds = toSeconds(params.resetAt - Date.now());
  return NextResponse.json(
    {
      error: params.message,
      code: "rate_limited",
      limit: params.limit,
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
};

export const enforceIpRateLimit = (request: NextRequest, params: { key: string; limit: number; windowMs: number }) => {
  const ip = getRequestIp(request);
  return consumeIpUsage({ ip, key: params.key, limit: params.limit, windowMs: params.windowMs });
};

export const enforceSubjectRateLimit = (params: {
  subject: string;
  key: string;
  limit: number;
  windowMs: number;
}) => {
  return consumeMemoryUsage({
    subject: params.subject,
    key: params.key,
    limit: params.limit,
    windowMs: params.windowMs,
  });
};
