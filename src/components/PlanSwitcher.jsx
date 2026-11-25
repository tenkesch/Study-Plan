import { useEffect, useRef, useState } from "react";
import { sortPlansByExamDate } from "../plans/planState.js";

function displayDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString();
}

export default function PlanSwitcher({
  plans,
  activePlanId,
  onSelect,
  onDelete,
}) {
  const [confirmingId, setConfirmingId] = useState(null);
  const cancelButton = useRef(null);
  const deleteButtons = useRef(new Map());
  const selectButtons = useRef(new Map());
  const previousConfirmation = useRef(null);
  const restoreFocus = useRef(false);
  const focusActiveAfterDelete = useRef(false);
  const deletedPlanId = useRef(null);
  const sortedPlans = sortPlansByExamDate(plans);

  useEffect(() => {
    if (confirmingId) {
      cancelButton.current?.focus();
    } else if (restoreFocus.current && previousConfirmation.current) {
      deleteButtons.current.get(previousConfirmation.current)?.focus();
      restoreFocus.current = false;
    }
    if (
      focusActiveAfterDelete.current &&
      !plans.some((plan) => plan.id === deletedPlanId.current)
    ) {
      selectButtons.current.get(activePlanId)?.focus();
      focusActiveAfterDelete.current = false;
      deletedPlanId.current = null;
    }
    previousConfirmation.current = confirmingId;
  }, [activePlanId, confirmingId, plans]);

  function cancelConfirmation() {
    restoreFocus.current = true;
    setConfirmingId(null);
  }

  function handleConfirmationKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelConfirmation();
    }
  }

  return (
    <aside className="plan-sidebar" aria-label="Study plans">
      <h2>Your plans</h2>
      <nav className="plan-switcher" aria-label="Switch study plan">
        {sortedPlans.map((plan) => {
          const completedCount = plan.activities.filter(
            (activity) => activity.completed,
          ).length;
          const isConfirming = confirmingId === plan.id;
          return (
            <div className="plan-switcher-row" key={plan.id}>
              <button
                ref={(element) => {
                  if (element) selectButtons.current.set(plan.id, element);
                  else selectButtons.current.delete(plan.id);
                }}
                type="button"
                className={`plan-switcher-select ${
                  plan.id === activePlanId ? "is-active" : ""
                }`}
                aria-current={plan.id === activePlanId ? "true" : undefined}
                onClick={() => onSelect(plan.id)}
              >
                <span className="switcher-subject">{plan.subject}</span>
                <span className="switcher-meta">
                  {displayDate(plan.examDate)} · {completedCount}/
                  {plan.activities.length}
                </span>
              </button>
              {isConfirming ? (
                <div
                  className="delete-confirm"
                  onKeyDown={handleConfirmationKeyDown}
                >
                  <span>Delete this plan?</span>
                  <button
                    className="delete-confirm-action"
                    type="button"
                    onClick={() => {
                      restoreFocus.current = false;
                      focusActiveAfterDelete.current = true;
                      deletedPlanId.current = plan.id;
                      setConfirmingId(null);
                      onDelete(plan.id);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    ref={cancelButton}
                    className="delete-confirm-cancel"
                    type="button"
                    onClick={cancelConfirmation}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  ref={(element) => {
                    if (element) deleteButtons.current.set(plan.id, element);
                    else deleteButtons.current.delete(plan.id);
                  }}
                  className="plan-delete-button"
                  type="button"
                  aria-label={`Delete plan: ${plan.subject}`}
                  onClick={() => setConfirmingId(plan.id)}
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
