import { describe, expect, it } from "vitest";
import { generatePlan, PHASES } from "./planGenerator.js";

const today = "2026-01-01";
const input = (examDate, hoursPerWeek = 6) => ({
  subject: " Biology ",
  examDate,
  hoursPerWeek,
});

describe("generatePlan", () => {
  it.each([
    ["tomorrow", "2026-01-02", 1],
    ["six days", "2026-01-07", 1],
    ["seven days", "2026-01-08", 1],
    ["eight days", "2026-01-09", 2],
  ])("calculates weeks for %s", (_label, examDate, expectedWeeks) => {
    expect(generatePlan(input(examDate), today).weeks).toBe(expectedWeeks);
  });

  it("uses calendar dates and returns client-generated activity ids", () => {
    const plan = generatePlan(input("2026-01-02"), today);
    expect(plan.weeks).toBe(1);
    expect(plan.subject).toBe("Biology");
    expect(plan.activities[0].id).toBeTruthy();
  });

  it("orders phases and reserves the final week for revision and a mock test", () => {
    const plan = generatePlan(input("2026-02-26", 2), today);
    const phases = [
      ...new Set(plan.activities.map((activity) => activity.phase)),
    ];
    expect(phases).toEqual(PHASES);
    expect(
      plan.activities
        .filter((activity) => activity.week === plan.weeks)
        .every((activity) => activity.phase === "Revision"),
    ).toBe(true);
    expect(
      plan.activities.some((activity) =>
        activity.name.includes("Revision and mock test"),
      ),
    ).toBe(true);
  });

  it("caps activities and keeps only final complete weeks", () => {
    const plan = generatePlan(input("2027-12-01", 60), today);
    expect(plan.activities.length).toBeGreaterThan(0);
    expect(plan.activities.length).toBeLessThanOrEqual(200);
    expect(plan.truncated).toBe(true);
    expect(plan.skippedWeeks).toBeGreaterThan(0);
    expect(plan.activities[0].week).toBe(plan.skippedWeeks + 1);
    expect(plan.activities.at(-1).week).toBe(plan.weeks);
  });

  it("keeps all session durations between one and two hours", () => {
    const plan = generatePlan(input("2026-02-26", 5.5), today);
    expect(
      plan.activities.every(({ duration }) => duration >= 1 && duration <= 2),
    ).toBe(true);
  });

  it("scales a short plan to the remaining days", () => {
    const plan = generatePlan(input("2026-01-04", 14), today);
    expect(plan.weeks).toBe(1);
    expect(plan.activities).toHaveLength(3);
  });
});
