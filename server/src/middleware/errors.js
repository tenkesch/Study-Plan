export function notFound(req, res, next) {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, _next) {
  let status = error.status || error.statusCode || 500;
  let message = status >= 500 ? "Internal server error" : error.message;
  let details = error.details;

  if (error.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  } else if (error.name === "ZodError") {
    status = 400;
    message = "Invalid request";
    details = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (error.status === 429 || error.statusCode === 429) {
    status = 429;
    message = "Too many requests";
  }

  console.error(
    JSON.stringify({
      level: "error",
      requestId: req.id,
      status,
      message: error.message,
    }),
  );
  const payload = { message, requestId: req.id };
  if (details) payload.details = details;
  if (process.env.NODE_ENV !== "production" && status >= 500) {
    payload.details = "An unexpected server error occurred";
  }
  res.status(status).json({ error: payload });
}
