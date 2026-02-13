import { NextRequest, NextResponse } from "next/server";
import { enforceIpRateLimit, rateLimitErrorResponse } from "@/lib/server/rate-limit";

const MAX_FIELD_LENGTH = 3000;

const sanitize = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  return value.slice(0, MAX_FIELD_LENGTH);
};

export async function POST(request: NextRequest) {
  try {
    const limiter = enforceIpRateLimit(request, {
      key: "api_log_error",
      limit: 120,
      windowMs: 60 * 60 * 1000,
    });
    if (!limiter.allowed) {
      return rateLimitErrorResponse({
        message: "Too many log submissions from this client.",
        limit: limiter.limit,
        resetAt: limiter.resetAt,
      });
    }

    const body = await request.json().catch(() => ({}));
    const payload = {
      message: sanitize(body?.message),
      stack: sanitize(body?.stack),
      context: body?.context && typeof body.context === "object" ? body.context : undefined,
      url: sanitize(body?.url),
      ts: sanitize(body?.ts),
      userAgent: sanitize(request.headers.get("user-agent")),
    };

    console.error("[client-error]", payload);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
