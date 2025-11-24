import { NextResponse } from "next/server";

/**
 * Enhanced test endpoint to debug GEMINI_API_KEY loading
 * Visit: /api/test-env
 * 
 * DELETE THIS FILE after testing for security!
 */
export async function GET() {
  // Access the API key from process.env
  const apiKey = process.env.GEMINI_API_KEY;

  // Get all environment variable keys (safely, without values)
  const allEnvKeys = Object.keys(process.env).filter(key =>
    key.includes('GEMINI') ||
    key.includes('API') ||
    key.includes('NEXT') ||
    key.includes('NODE') ||
    key.includes('NETLIFY') ||
    key.includes('VERCEL')
  );

  return NextResponse.json({
    // Main check
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 8) || "NOT_SET",
    isPlaceholder: apiKey === "your_gemini_api_key_here",

    // Environment info
    nodeEnv: process.env.NODE_ENV,
    platform: process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : 'Unknown',

    // Available env keys (for debugging)
    availableEnvKeys: allEnvKeys,

    // Total env vars count
    totalEnvVars: Object.keys(process.env).length,

    // Debugging info
    debug: {
      hasProcessEnv: typeof process !== 'undefined' && typeof process.env !== 'undefined',
      geminiKeyType: typeof apiKey,
      geminiKeyValue: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT_SET',
    }
  });
}
