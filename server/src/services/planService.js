const PHASES = [
  "Getting familiar with the material",
  "In-depth study",
  "Practice and exercises",
  "Revision",
];

function utcDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function daysBetween(start, end) {
  return Math.round((end - start) / 86400000);
}

function splitIntoSessions(hours) {
  const sessionCount = Math.max(1, Math.ceil(hours / 2));
  const sessionDuration = hours / sessionCount;
  return Array.from({ length: sessionCount }, () =>
    Number(sessionDuration.toFixed(2)),
  );
}

function phaseForWeek(week, weeks) {
  if (week === weeks) return PHASES[3];
  if (weeks <= 1) return PHASES[3];
  const phaseIndex = Math.min(
    2,
    Math.floor(((week - 1) / (weeks - 1)) * 3),
  );
  return PHASES[phaseIndex];
}

export function generatePlan(
  { subject, examDate, hoursPerWeek },
  today = new Date(),
) {
  const start = utcDate(today);
  const exam = utcDate(examDate);
  const daysUntilExam = daysBetween(start, exam);
  const weeks = Math.max(1, Math.ceil(daysUntilExam / 7));
  const shortPlan = daysUntilExam < 7;
  const activitiesByWeek = [];

  for (let week = 1; week <= weeks; week += 1) {
    const weekDays =
      shortPlan ? daysUntilExam : Math.min(7, daysUntilExam - (week - 1) * 7);
    const weeklyHours = shortPlan
      ? Math.max(1, (hoursPerWeek * weekDays) / 7)
      : hoursPerWeek;
    const durations = splitIntoSessions(weeklyHours);
    const phase = phaseForWeek(week, weeks);
    activitiesByWeek.push(
      durations.map((duration, index) => {
        let name = `${phase} session`;
        if (phase === PHASES[3]) {
          name =
            index === durations.length - 1
              ? "Revision and mock test"
              : "Revision session";
        }
        return {
          id: `week-${week}-activity-${index + 1}`,
          name: `${subject}: ${name}`,
          duration,
          week,
          phase,
        };
      }),
    );
  }

  let skippedWeeks = 0;
  let selected = activitiesByWeek;
  if (activitiesByWeek.reduce((sum, items) => sum + items.length, 0) > 200) {
    selected = [];
    let count = 0;
    for (let index = activitiesByWeek.length - 1; index >= 0; index -= 1) {
      const current = activitiesByWeek[index];
      if (count + current.length > 200) break;
      selected.unshift(current);
      count += current.length;
    }
    skippedWeeks = activitiesByWeek.length - selected.length;
  }

  return {
    subject,
    examDate,
    hoursPerWeek,
    weeks,
    activities: selected.flat(),
    truncated: skippedWeeks > 0,
    skippedWeeks,
  };
}

export { PHASES };
