import { isValidIsoDate } from "../lib/dateUtils.js";

export const MAX_PLANS = 20;
const MAX_STORED_LENGTH = 2_000_000;
const MAX_ACTIVITY_NAME_LENGTH = 200;

export function createPlanId() {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // Fall back when the browser does not allow access to crypto.
  }
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyPlanState() {
  return { version: 2, activePlanId: null, plans: [] };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePlan(plan) {
  if (
    !isRecord(plan) ||
    Object.keys(plan).some(
      (key) =>
        ![
          "id",
          "subject",
          "examDate",
          "hoursPerWeek",
          "createdAt",
          "weeks",
          "truncated",
          "skippedWeeks",
          "activities",
        ].includes(key),
    ) ||
    typeof plan.id !== "string" ||
    !plan.id ||
    plan.id.length > 200 ||
    typeof plan.subject !== "string" ||
    plan.subject.trim().length < 1 ||
    plan.subject.length > 100 ||
    typeof plan.examDate !== "string" ||
    !isValidIsoDate(plan.examDate) ||
    typeof plan.hoursPerWeek !== "number" ||
    !Number.isFinite(plan.hoursPerWeek) ||
    plan.hoursPerWeek < 1 ||
    plan.hoursPerWeek > 60 ||
    typeof plan.createdAt !== "string" ||
    plan.createdAt.length > 40 ||
    typeof plan.weeks !== "number" ||
    !Number.isInteger(plan.weeks) ||
    plan.weeks < 1 ||
    plan.weeks > 105 ||
    typeof plan.truncated !== "boolean" ||
    typeof plan.skippedWeeks !== "number" ||
    !Number.isInteger(plan.skippedWeeks) ||
    plan.skippedWeeks < 0 ||
    plan.skippedWeeks > 104 ||
    !Array.isArray(plan.activities) ||
    plan.activities.length > 200
  ) {
    return null;
  }

  const activityIds = new Set();
  const activities = [];
  for (const activity of plan.activities) {
    if (
      !isRecord(activity) ||
      Object.keys(activity).some(
        (key) =>
          !["id", "name", "duration", "week", "phase", "completed"].includes(
            key,
          ),
      ) ||
      typeof activity.id !== "string" ||
      !activity.id ||
      activity.id.length > 200 ||
      activityIds.has(activity.id) ||
      typeof activity.name !== "string" ||
      activity.name.trim().length < 1 ||
      activity.name.length > MAX_ACTIVITY_NAME_LENGTH ||
      typeof activity.duration !== "number" ||
      !Number.isFinite(activity.duration) ||
      activity.duration < 1 ||
      activity.duration > 2 ||
      typeof activity.week !== "number" ||
      !Number.isInteger(activity.week) ||
      activity.week < 1 ||
      activity.week > plan.weeks ||
      typeof activity.phase !== "string" ||
      activity.phase.length > 100 ||
      typeof activity.completed !== "boolean"
    ) {
      return null;
    }
    activityIds.add(activity.id);
    activities.push({
      id: activity.id,
      name: activity.name,
      duration: activity.duration,
      week: activity.week,
      phase: activity.phase,
      completed: activity.completed,
    });
  }

  return {
    id: plan.id,
    subject: plan.subject,
    examDate: plan.examDate,
    hoursPerWeek: plan.hoursPerWeek,
    createdAt: plan.createdAt,
    weeks: plan.weeks,
    truncated: plan.truncated,
    skippedWeeks: plan.skippedWeeks,
    activities,
  };
}

function parseJson(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parsePlanState(value) {
  if (typeof value !== "string" || value.length > MAX_STORED_LENGTH)
    return null;
  const parsed = parseJson(value);
  if (
    !isRecord(parsed) ||
    Object.keys(parsed).some(
      (key) => !["version", "activePlanId", "plans"].includes(key),
    ) ||
    parsed.version !== 2 ||
    !Array.isArray(parsed.plans) ||
    parsed.plans.length > MAX_PLANS ||
    (parsed.activePlanId !== null && typeof parsed.activePlanId !== "string")
  ) {
    return null;
  }

  const ids = new Set();
  const plans = [];
  for (const candidate of parsed.plans) {
    const plan = normalizePlan(candidate);
    if (!plan || ids.has(plan.id)) return null;
    ids.add(plan.id);
    plans.push(plan);
  }
  const activePlanId = plans.some((plan) => plan.id === parsed.activePlanId)
    ? parsed.activePlanId
    : (plans[0]?.id ?? null);
  return { version: 2, activePlanId, plans };
}

function migrateLegacyPlan(value, idFactory) {
  if (typeof value !== "string" || value.length > MAX_STORED_LENGTH)
    return null;
  const legacy = parseJson(value);
  if (
    !isRecord(legacy) ||
    Object.keys(legacy).some((key) => !["plan", "completed"].includes(key)) ||
    !isRecord(legacy.plan) ||
    (legacy.completed !== undefined &&
      (!Array.isArray(legacy.completed) || legacy.completed.length > 200)) ||
    !Array.isArray(legacy.plan.activities) ||
    legacy.plan.activities.length > 200
  ) {
    return null;
  }
  const completed = new Set(
    Array.isArray(legacy.completed)
      ? legacy.completed.filter(
          (id) => typeof id === "string" && id.length <= 200,
        )
      : [],
  );
  const plan = normalizePlan({
    ...legacy.plan,
    id: idFactory(),
    createdAt:
      typeof legacy.plan.createdAt === "string" ? legacy.plan.createdAt : "",
    activities: legacy.plan.activities.map((activity) => ({
      ...activity,
      completed: completed.has(activity?.id),
    })),
  });
  return plan ? { version: 2, activePlanId: plan.id, plans: [plan] } : null;
}

export function loadPlanState(
  currentValue,
  legacyValue,
  idFactory = createPlanId,
) {
  const current = parsePlanState(currentValue);
  if (current) return { state: current, migrated: false };

  const migrated = migrateLegacyPlan(legacyValue, idFactory);
  if (migrated) return { state: migrated, migrated: true };
  return { state: emptyPlanState(), migrated: false };
}

export function sortPlansByExamDate(plans) {
  return [...plans].sort(
    (first, second) =>
      first.examDate.localeCompare(second.examDate) ||
      first.subject.localeCompare(second.subject) ||
      first.id.localeCompare(second.id),
  );
}

export function addPlanToState(state, plan) {
  if (state.plans.length >= MAX_PLANS) return state;
  return {
    version: 2,
    activePlanId: plan.id,
    plans: [...state.plans, plan],
  };
}

export function selectPlanInState(state, planId) {
  if (!state.plans.some((plan) => plan.id === planId)) return state;
  return { ...state, activePlanId: planId };
}

export function deletePlanFromState(state, planId) {
  const ordered = sortPlansByExamDate(state.plans);
  const deletedIndex = ordered.findIndex((plan) => plan.id === planId);
  if (deletedIndex < 0) return state;
  const plans = state.plans.filter((plan) => plan.id !== planId);
  let activePlanId = state.activePlanId;

  if (activePlanId === planId) {
    const remaining = ordered.filter((plan) => plan.id !== planId);
    activePlanId =
      remaining[Math.min(deletedIndex, remaining.length - 1)]?.id ?? null;
  }
  return { version: 2, activePlanId, plans };
}

export function toggleActivityInState(state, planId, activityId) {
  let changed = false;
  const plans = state.plans.map((plan) => {
    if (plan.id !== planId) return plan;
    let planChanged = false;
    const activities = plan.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      changed = true;
      planChanged = true;
      return { ...activity, completed: !activity.completed };
    });
    return planChanged ? { ...plan, activities } : plan;
  });
  return changed ? { ...state, plans } : state;
}

export function renameActivityInState(state, planId, activityId, name) {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > MAX_ACTIVITY_NAME_LENGTH
  ) {
    return state;
  }
  let changed = false;
  const plans = state.plans.map((plan) => {
    if (plan.id !== planId) return plan;
    let planChanged = false;
    const activities = plan.activities.map((activity) => {
      if (activity.id !== activityId) return activity;
      changed = true;
      planChanged = true;
      return { ...activity, name };
    });
    return planChanged ? { ...plan, activities } : plan;
  });
  return changed ? { ...state, plans } : state;
}
