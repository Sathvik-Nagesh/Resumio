import { NextResponse } from "next/server";

/**
 * Test endpoint to verify GEMINI_API_KEY is loaded
 * Visit: /api/test-env
 * 
 * DELETE THIS FILE after testing for security!
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 8) || "NOT_SET",
    isPlaceholder: apiKey === "your_gemini_api_key_here",
    // NEVER return the full key!
  });
}
