import "dotenv/config";

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: positiveInt(process.env.PORT, 3001),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
  rateLimitWindowMs: positiveInt(process.env.RATE_LIMIT_WINDOW_MS, 900000),
  rateLimitMax: positiveInt(process.env.RATE_LIMIT_MAX, 100),
  planRateLimitMax: positiveInt(process.env.PLAN_RATE_LIMIT_MAX, 10),
};
