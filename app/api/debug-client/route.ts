// app/api/debug-client/route.ts
// Debug endpoint to test client-side API calls

export async function GET() {
  return Response.json({
    success: true,
    message: "API endpoint is accessible",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasFreAPI: !!process.env.FRED_API_KEY,
    hasAlphaVantage: !!process.env.ALPHA_VANTAGE_API_KEY
  });
}