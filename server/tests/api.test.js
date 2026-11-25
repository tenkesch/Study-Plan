import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a plan with request id", async () => {
    const response = await request(createApp())
      .post("/api/plan")
      .send({
        subject: "Math",
        examDate: new Date(Date.now() + 86400000 * 10)
          .toISOString()
          .slice(0, 10),
        hoursPerWeek: 4,
      });
    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body.activities.length).toBeGreaterThan(0);
  });

  it("returns 400 and a consistent error format for invalid input", async () => {
    const response = await request(createApp())
      .post("/api/plan")
      .send({ subject: "", examDate: "nope", hoursPerWeek: 0 });
    expect(response.status).toBe(400);
    expect(response.body.error.requestId).toBe(
      response.headers["x-request-id"],
    );
    expect(response.body.error.details).toBeInstanceOf(Array);
  });

  it("handles unknown routes", async () => {
    const response = await request(createApp()).get("/not-found");
    expect(response.status).toBe(404);
    expect(response.body.error.requestId).toBeTruthy();
  });

  it("rejects oversized JSON bodies", async () => {
    const response = await request(createApp())
      .post("/api/plan")
      .set("Content-Type", "application/json")
      .send(`{"value":"${"x".repeat(11000)}"}`);
    expect(response.status).toBe(413);
    expect(response.body.error.requestId).toBeTruthy();
  });

  it("returns 429 when the general rate limit is reached", async () => {
    const app = createApp({ rateLimitMax: 1 });
    await request(app).get("/api/health").expect(200);
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(429);
    expect(response.body.error.requestId).toBeTruthy();
  });

  it("serves health", async () => {
    const response = await request(createApp()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("does not expose stack traces in production errors", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await request(createApp()).get("/unknown");
    expect(response.status).toBe(404);
    expect(JSON.stringify(response.body)).not.toContain(" at ");
    expect(response.body.error.requestId).toBeTruthy();
  });
});
