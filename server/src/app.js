import compression from "compression";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { planRouter } from "./routes/planRoutes.js";

export function createApp(overrides = {}) {
  const app = express();
  const settings = { ...config, ...overrides };
  const generalLimiter = rateLimit({
    windowMs: settings.rateLimitWindowMs,
    limit: settings.rateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      const error = new Error("Too many requests");
      error.status = 429;
      next(error);
    },
  });
  const planLimiter = rateLimit({
    windowMs: settings.rateLimitWindowMs,
    limit: settings.planRateLimitMax,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      const error = new Error("Too many requests");
      error.status = 429;
      next(error);
    },
  });

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin }));
  app.use(compression());
  app.use(express.json({ limit: "10kb" }));
  app.use(generalLimiter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/plan", planLimiter, planRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
