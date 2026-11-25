import ActivityItem from "./ActivityItem.jsx";
import ProgressBar from "./ProgressBar.jsx";

export default function PlanList({ plan, onToggle, onRename }) {
  const completedCount = plan.activities.filter(
    (activity) => activity.completed,
  ).length;
  const weeks = [...new Set(plan.activities.map((activity) => activity.week))];

  return (
    <section className="plan-results" aria-labelledby="plan-heading">
      <div className="plan-heading-row">
        <div>
          <p className="eyebrow">YOUR STUDY PLAN</p>
          <h2 id="plan-heading">{plan.subject}</h2>
          <p className="plan-subtitle">
            Exam on {new Date(`${plan.examDate}T00:00:00`).toLocaleDateString()}{" "}
            · {plan.weeks} {plan.weeks === 1 ? "week" : "weeks"}
          </p>
        </div>
      </div>
      <ProgressBar completed={completedCount} total={plan.activities.length} />
      {plan.truncated && (
        <p className="notice" role="status">
          This plan is shortened to keep it manageable. {plan.skippedWeeks}{" "}
          earlier {plan.skippedWeeks === 1 ? "week was" : "weeks were"} omitted.
        </p>
      )}
      <div className="week-list">
        {weeks.map((week) => (
          <section className="week-card" key={week}>
            <h3>Week {week}</h3>
            <ul>
              {plan.activities
                .filter((activity) => activity.week === week)
                .map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    completed={activity.completed}
                    onToggle={onToggle}
                    onRename={onRename}
                  />
                ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
