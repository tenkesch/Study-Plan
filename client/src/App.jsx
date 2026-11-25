import { useEffect, useRef, useState } from "react";
import { createPlan } from "./api.js";
import PlanForm from "./components/PlanForm.jsx";
import PlanList from "./components/PlanList.jsx";
import PlanSwitcher from "./components/PlanSwitcher.jsx";
import { MAX_PLANS } from "./plans/planState.js";
import { usePlans } from "./hooks/usePlans.js";

export default function App() {
  const {
    plans,
    activePlan,
    addPlan,
    selectPlan,
    deletePlan,
    toggleActivity,
    storageError,
  } = usePlans();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const previousPlanCount = useRef(plans.length);

  useEffect(() => {
    if (previousPlanCount.current > 0 && plans.length === 0) {
      document.getElementById("subject")?.focus();
    }
    previousPlanCount.current = plans.length;
  }, [plans.length]);

  async function handleCreate(input) {
    setLoading(true);
    setError("");
    try {
      const plan = await createPlan(input);
      if (!addPlan(plan)) {
        setError("You can keep up to 20 study plans.");
        return;
      }
      setFormOpen(false);
      setError("");
    } catch (requestError) {
      const details = Array.isArray(requestError.details)
        ? requestError.details.map((item) => item.message).join(" ")
        : "";
      setError([requestError.message, details].filter(Boolean).join(" "));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className={`app-layout ${plans.length ? "has-plans" : ""}`}>
        {plans.length > 0 && (
          <PlanSwitcher
            plans={plans}
            activePlanId={activePlan?.id}
            onSelect={selectPlan}
            onDelete={deletePlan}
          />
        )}
        <div className="main-content">
          <header className="site-header">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <span>Study Plan</span>
          </header>
          <section className="intro">
            <p className="eyebrow">A CLEAR PLAN FOR WHAT’S NEXT</p>
            <h1>Make exam prep feel manageable.</h1>
            <p className="intro-copy">
              Tell us what you’re studying and we’ll map out focused sessions
              through exam day.
            </p>
          </section>
          {plans.length === 0 && (
            <p className="welcome-message">
              Welcome! Start by creating your first study plan.
            </p>
          )}
          {plans.length > 0 && !formOpen && (
            <div className="new-plan-actions">
              <button
                className="button primary"
                type="button"
                disabled={plans.length >= MAX_PLANS}
                onClick={() => {
                  setError("");
                  setFormOpen(true);
                }}
              >
                New plan
              </button>
              {plans.length >= MAX_PLANS && (
                <p className="plan-limit-message">
                  You’ve reached the 20-plan limit. Delete a plan to add
                  another.
                </p>
              )}
            </div>
          )}
          {(plans.length === 0 || formOpen) && (
            <section className="form-card" aria-labelledby="form-heading">
              <div className="form-heading-row">
                <h2 id="form-heading">
                  {plans.length ? "Create a new plan" : "Plan your study"}
                </h2>
                {plans.length > 0 && (
                  <button
                    className="button secondary"
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setFormOpen(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              <PlanForm onCreate={handleCreate} loading={loading} />
              {error && (
                <p className="error-banner" role="alert">
                  {error}
                </p>
              )}
            </section>
          )}
          {storageError && (
            <p className="error-banner storage-error" role="alert">
              Your changes are active for now, but couldn’t be saved on this
              device.
            </p>
          )}
          {activePlan && (
            <PlanList plan={activePlan} onToggle={toggleActivity} />
          )}
          <footer>Small steps, steady progress.</footer>
        </div>
      </div>
    </main>
  );
}
