export default function ProgressBar({ completed, total }) {
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="progress-wrap">
      <div className="progress-copy">
        <span>
          {completed} of {total} activities completed
        </span>
        <span>{percentage}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Study plan progress"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
