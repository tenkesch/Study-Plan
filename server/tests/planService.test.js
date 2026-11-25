import { describe, expect, it } from "vitest";
import { generatePlan, PHASES } from "../src/services/planService.js";

const today = new Date("2026-01-01T22:30:00.000Z");
const input = (examDate, hoursPerWeek = 6) => ({
  subject: "Biology",
  examDate,
  hoursPerWeek,
});

describe("generatePlan", () => {
  it.each([
    ["tomorrow", "2026-01-02", 1],
    ["six days", "2026-01-07", 1],
    ["seven days", "2026-01-08", 1],
    ["eight days", "2026-01-09", 2],
  ])("calculates weeks for %s", (_label, date, expectedWeeks) => {
    expect(generatePlan(input(date), today).weeks).toBe(expectedWeeks);
  });

  it("uses UTC calendar days regardless of time of day", () => {
    expect(generatePlan(input("2026-01-02"), today).weeks).toBe(1);
  });

  it("orders phases and reserves the final week for revision", () => {
    const plan = generatePlan(input("2026-02-05", 2), today);
    const phases = [...new Set(plan.activities.map((activity) => activity.phase))];
    expect(phases).toEqual(PHASES);
    expect(
      plan.activities.filter((activity) => activity.week === plan.weeks)
        .every((activity) => activity.phase === "Revision"),
    ).toBe(true);
    expect(
      plan.activities.some((activity) => activity.name.includes("mock test")),
    ).toBe(true);
  });

  it("caps activities at 200 and keeps final week numbers", () => {
    const plan = generatePlan(input("2027-12-01", 60), today);
    expect(plan.activities.length).toBeLessThanOrEqual(200);
    expect(plan.activities.length).toBeGreaterThan(0);
    expect(plan.truncated).toBe(true);
    expect(plan.skippedWeeks).toBeGreaterThan(0);
    expect(plan.activities[0].week).toBe(plan.skippedWeeks + 1);
    expect(plan.activities.at(-1).week).toBe(plan.weeks);
  });

  it("keeps all session durations between one and two hours", () => {
    const plan = generatePlan(input("2026-02-05", 5.5), today);
    expect(
      plan.activities.every(
        ({ duration }) => duration >= 1 && duration <= 2,
      ),
    ).toBe(true);
  });

  it("scales a short plan to the remaining days", () => {
    const plan = generatePlan(input("2026-01-03", 14), today);
    expect(plan.weeks).toBe(1);
    expect(plan.activities.length).toBe(2);
  });
});
