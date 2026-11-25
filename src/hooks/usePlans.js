import { useEffect, useRef, useState } from "react";
import {
  addPlanToState,
  createPlanId,
  deletePlanFromState,
  emptyPlanState,
  loadPlanState,
  MAX_PLANS,
  parsePlanState,
  renameActivityInState,
  selectPlanInState,
  toggleActivityInState,
} from "../plans/planState.js";

const STORAGE_KEY = "study-plans";
const LEGACY_STORAGE_KEY = "study-plan";

function readPlanStorage() {
  try {
    const currentValue = localStorage.getItem(STORAGE_KEY);
    const current = parsePlanState(currentValue);
    if (current) return { state: current, migrated: false };
    const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY);
    return loadPlanState(currentValue, legacyValue);
  } catch {
    return { state: emptyPlanState(), migrated: false };
  }
}

function createPlanRecord(plan) {
  return {
    ...plan,
    id: createPlanId(),
    createdAt: new Date().toISOString(),
    activities: plan.activities.map((activity) => ({
      ...activity,
      completed: false,
    })),
  };
}

export function usePlans() {
  const [initial] = useState(readPlanStorage);
  const [state, setState] = useState(initial.state);
  const [storageError, setStorageError] = useState(false);
  const migratedRef = useRef(initial.migrated);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (migratedRef.current) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        migratedRef.current = false;
      }
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  const plans = state.plans;
  const activePlan =
    plans.find((plan) => plan.id === state.activePlanId) ?? plans[0] ?? null;

  function addPlan(serverPlan) {
    if (plans.length >= MAX_PLANS) return false;
    const newPlan = createPlanRecord(serverPlan);
    setState((current) => addPlanToState(current, newPlan));
    return true;
  }

  function selectPlan(planId) {
    setState((current) => selectPlanInState(current, planId));
  }

  function deletePlan(planId) {
    setState((current) => deletePlanFromState(current, planId));
  }

  function toggleActivity(activityId) {
    if (!activePlan) return;
    setState((current) =>
      toggleActivityInState(current, current.activePlanId, activityId),
    );
  }

  function renameActivity(activityId, name) {
    if (!activePlan) return;
    setState((current) =>
      renameActivityInState(current, current.activePlanId, activityId, name),
    );
  }

  return {
    plans,
    activePlan,
    addPlan,
    selectPlan,
    deletePlan,
    toggleActivity,
    renameActivity,
    storageError,
  };
}
