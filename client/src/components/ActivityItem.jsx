export default function ActivityItem({ activity, completed, onToggle }) {
  const inputId = `activity-${activity.id}`;
  return (
    <li className={`activity ${completed ? "is-complete" : ""}`}>
      <input
        id={inputId}
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(activity.id)}
      />
      <label htmlFor={inputId}>
        <span className="activity-name">{activity.name}</span>
        <span className="activity-meta">
          {activity.duration} {activity.duration === 1 ? "hour" : "hours"}
        </span>
      </label>
    </li>
  );
}
