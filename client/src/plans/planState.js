export const MAX_PLANS = 20;

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

function normalizePlan(plan, idFactory) {
  if (
    !isRecord(plan) ||
    typeof plan.subject !== "string" ||
    typeof plan.examDate !== "string" ||
    !Array.isArray(plan.activities)
  ) {
    return null;
  }

  const activities = plan.activities
    .filter(
      (activity) =>
        isRecord(activity) &&
        typeof activity.id === "string" &&
        typeof activity.name === "string" &&
        typeof activity.duration === "number" &&
        typeof activity.week === "number" &&
        typeof activity.phase === "string",
    )
    .map((activity) => ({
      ...activity,
      completed: activity.completed === true,
    }));

  return {
    id: typeof plan.id === "string" && plan.id ? plan.id : idFactory(),
    subject: plan.subject,
    examDate: plan.examDate,
    hoursPerWeek: typeof plan.hoursPerWeek === "number" ? plan.hoursPerWeek : 0,
    createdAt: typeof plan.createdAt === "string" ? plan.createdAt : "",
    weeks: typeof plan.weeks === "number" ? plan.weeks : 0,
    truncated: plan.truncated === true,
    skippedWeeks: typeof plan.skippedWeeks === "number" ? plan.skippedWeeks : 0,
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

export function parsePlanState(value, idFactory = createPlanId) {
  const parsed = parseJson(value);
  if (
    !isRecord(parsed) ||
    parsed.version !== 2 ||
    !Array.isArray(parsed.plans)
  ) {
    return null;
  }

  const ids = new Set();
  const plans = [];
  for (const candidate of parsed.plans) {
    const plan = normalizePlan(candidate, idFactory);
    if (!plan || ids.has(plan.id)) continue;
    ids.add(plan.id);
    plans.push(plan);
  }
  const activePlanId = plans.some((plan) => plan.id === parsed.activePlanId)
    ? parsed.activePlanId
    : (plans[0]?.id ?? null);
  return { version: 2, activePlanId, plans };
}

function migrateLegacyPlan(value, idFactory) {
  const legacy = parseJson(value);
  if (!isRecord(legacy) || !isRecord(legacy.plan)) return null;
  const completed = new Set(
    Array.isArray(legacy.completed)
      ? legacy.completed.filter((id) => typeof id === "string")
      : [],
  );
  const plan = normalizePlan(
    {
      ...legacy.plan,
      id: idFactory(),
      createdAt:
        typeof legacy.plan.createdAt === "string" ? legacy.plan.createdAt : "",
      activities: Array.isArray(legacy.plan.activities)
        ? legacy.plan.activities.map((activity) => ({
            ...activity,
            completed: completed.has(activity?.id),
          }))
        : legacy.plan.activities,
    },
    idFactory,
  );
  return plan ? { version: 2, activePlanId: plan.id, plans: [plan] } : null;
}

export function loadPlanState(
  currentValue,
  legacyValue,
  idFactory = createPlanId,
) {
  const current = parsePlanState(currentValue, idFactory);
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
