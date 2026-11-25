import { useEffect, useState } from "react";

export default function ActivityItem({
  activity,
  completed,
  onToggle,
  onRename,
}) {
  const inputId = `activity-${activity.id}`;
  const [name, setName] = useState(activity.name);

  useEffect(() => {
    setName(activity.name);
  }, [activity.name]);

  function commitName() {
    const updatedName = name.trim();
    if (updatedName) onRename(activity.id, updatedName);
    else setName(activity.name);
  }

  return (
    <li className={`activity ${completed ? "is-complete" : ""}`}>
      <label className="activity-toggle" htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(activity.id)}
        />
        <span className="visually-hidden">Mark activity complete</span>
      </label>
      <input
        className="activity-name-input"
        type="text"
        maxLength={200}
        value={name}
        aria-label={`Activity name, week ${activity.week}`}
        onChange={(event) => setName(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      <span className="activity-meta">
        {activity.duration} {activity.duration === 1 ? "hour" : "hours"}
      </span>
    </li>
  );
}
