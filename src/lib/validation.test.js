import { describe, expect, it } from "vitest";
import { validatePlanInput } from "./validation.js";

const today = "2026-01-01";
const valid = {
  subject: " Biology ",
  examDate: "2026-01-02",
  hoursPerWeek: "6",
};

describe("validatePlanInput", () => {
  it("accepts valid input and permits whitespace around a subject", () => {
    expect(validatePlanInput(valid, today)).toEqual({});
  });

  it.each([
    ["empty subject", { ...valid, subject: "" }],
    ["whitespace subject", { ...valid, subject: "   " }],
    ["subject too long", { ...valid, subject: "x".repeat(101) }],
    ["missing subject", { ...valid, subject: null }],
    ["invalid date format", { ...valid, examDate: "2026-1-02" }],
    ["impossible date", { ...valid, examDate: "2026-02-30" }],
    ["past date", { ...valid, examDate: "2025-12-31" }],
    ["today", { ...valid, examDate: "2026-01-01" }],
    ["date beyond two years", { ...valid, examDate: "2028-01-02" }],
    ["hours below minimum", { ...valid, hoursPerWeek: "0" }],
    ["hours above maximum", { ...valid, hoursPerWeek: "61" }],
    ["non-numeric hours", { ...valid, hoursPerWeek: "abc" }],
    ["empty hours", { ...valid, hoursPerWeek: "" }],
  ])("rejects %s", (_label, value) => {
    expect(Object.keys(validatePlanInput(value, today)).length).toBeGreaterThan(
      0,
    );
  });

  it("accepts both hour boundaries and the two-year date boundary", () => {
    expect(
      validatePlanInput(
        { subject: "Math", examDate: "2028-01-01", hoursPerWeek: 1 },
        today,
      ),
    ).toEqual({});
    expect(
      validatePlanInput(
        { subject: "Math", examDate: "2026-01-02", hoursPerWeek: 60 },
        today,
      ),
    ).toEqual({});
  });
});
