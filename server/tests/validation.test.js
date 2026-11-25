import { describe, expect, it } from "vitest";
import { createPlanSchema } from "../src/schemas/planSchema.js";

const schema = createPlanSchema(new Date("2026-01-01T23:59:00Z"));
const valid = {
  subject: " Biology ",
  examDate: "2026-01-02",
  hoursPerWeek: 6,
};

describe("plan validation", () => {
  it("accepts valid input and trims the subject", () => {
    expect(schema.parse(valid).subject).toBe("Biology");
  });
  it.each([
    [{ ...valid, subject: "" }],
    [{ ...valid, subject: "x".repeat(101) }],
    [{ ...valid, examDate: "2026-02-30" }],
    [{ ...valid, examDate: "2026-1-02" }],
    [{ ...valid, examDate: "2026-01-01" }],
    [{ ...valid, examDate: "2028-01-02" }],
    [{ ...valid, hoursPerWeek: 0 }],
    [{ ...valid, hoursPerWeek: 61 }],
    [{ ...valid, hoursPerWeek: "6" }],
    [{ ...valid, extra: true }],
  ])("rejects invalid input %o", (value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});
