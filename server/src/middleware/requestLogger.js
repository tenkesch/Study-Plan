import morgan from "morgan";

export const requestLogger = morgan(
  (tokens, req, res) =>
    JSON.stringify({
      method: tokens.method(req, res),
      path: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      responseTimeMs: Number(tokens["response-time"](req, res)),
      requestId: req.id,
    }),
);
