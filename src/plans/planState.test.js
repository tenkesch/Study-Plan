import { describe, expect, it } from "vitest";
import {
  addPlanToState,
  deletePlanFromState,
  emptyPlanState,
  loadPlanState,
  MAX_PLANS,
  parsePlanState,
  renameActivityInState,
  selectPlanInState,
  toggleActivityInState,
} from "./planState.js";

function makePlan(id, subject = "Biology", examDate = "2026-02-01") {
  return {
    id,
    subject,
    examDate,
    hoursPerWeek: 4,
    createdAt: "2026-01-01T12:00:00.000Z",
    weeks: 2,
    truncated: false,
    skippedWeeks: 0,
    activities: [
      {
        id: `${id}-activity-1`,
        name: "Study",
        duration: 2,
        week: 1,
        phase: "In-depth study",
        completed: false,
      },
    ],
  };
}

describe("stored plan state", () => {
  it("migrates the old single-plan value and preserves completion", () => {
    const previousPlan = makePlan("old-activity");
    delete previousPlan.id;
    delete previousPlan.createdAt;
    previousPlan.activities[0].id = "old-activity";
    delete previousPlan.activities[0].completed;
    const loaded = loadPlanState(
      null,
      JSON.stringify({
        plan: previousPlan,
        completed: ["old-activity"],
      }),
      () => "migrated-plan",
    );
    expect(loaded.migrated).toBe(true);
    expect(loaded.state.activePlanId).toBe("migrated-plan");
    expect(loaded.state.plans[0].activities[0].completed).toBe(true);
  });

  it("validates stored structure, types, and lengths", () => {
    const stored = JSON.stringify({
      version: 2,
      activePlanId: "ok",
      plans: [makePlan("ok")],
    });
    expect(parsePlanState(stored)).not.toBeNull();
    expect(
      parsePlanState(
        JSON.stringify({
          version: 2,
          activePlanId: "bad",
          plans: [makePlan("bad", "x".repeat(101))],
        }),
      ),
    ).toBeNull();
    expect(
      parsePlanState(
        JSON.stringify({
          version: 2,
          activePlanId: "bad",
          plans: [
            {
              ...makePlan("bad"),
              activities: [{ ...makePlan("bad").activities[0], duration: 20 }],
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it("falls back on corrupted and unexpected storage", () => {
    expect(loadPlanState("{broken", null).state).toEqual(emptyPlanState());
    expect(
      loadPlanState(null, JSON.stringify({ plan: { subject: "broken" } }))
        .state,
    ).toEqual(emptyPlanState());
    expect(parsePlanState("x".repeat(2_000_001))).toBeNull();
  });

  it("falls back to the first plan when the active id is missing", () => {
    const parsed = parsePlanState(
      JSON.stringify({
        version: 2,
        activePlanId: "missing",
        plans: [makePlan("first")],
      }),
    );
    expect(parsed.activePlanId).toBe("first");
  });

  it("adds, selects, and tracks edits separately per plan", () => {
    let state = addPlanToState(emptyPlanState(), makePlan("one"));
    state = addPlanToState(state, makePlan("two", "Math"));
    state = selectPlanInState(state, "one");
    state = toggleActivityInState(state, "one", "one-activity-1");
    state = renameActivityInState(
      state,
      "one",
      "one-activity-1",
      "Read chapter one",
    );
    expect(state.activePlanId).toBe("one");
    expect(state.plans[0].activities[0]).toMatchObject({
      completed: true,
      name: "Read chapter one",
    });
    expect(state.plans[1].activities[0].completed).toBe(false);
  });

  it("deletes active plans, activates the nearest remaining plan, and empties", () => {
    let state = addPlanToState(
      emptyPlanState(),
      makePlan("late", "Late", "2026-03-01"),
    );
    state = addPlanToState(state, makePlan("early", "Early", "2026-01-15"));
    state = addPlanToState(state, makePlan("middle", "Middle", "2026-02-01"));
    state = selectPlanInState(state, "middle");
    state = deletePlanFromState(state, "middle");
    expect(state.activePlanId).toBe("late");
    state = deletePlanFromState(state, "early");
    state = deletePlanFromState(state, "late");
    expect(state).toEqual(emptyPlanState());
  });

  it("enforces the 20 plan limit", () => {
    let state = emptyPlanState();
    for (let index = 0; index < MAX_PLANS; index += 1) {
      state = addPlanToState(state, makePlan(`plan-${index}`));
    }
    expect(state.plans).toHaveLength(20);
    expect(addPlanToState(state, makePlan("overflow"))).toBe(state);
  });
});
