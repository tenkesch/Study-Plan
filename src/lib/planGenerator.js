import { localCalendarDayNumber } from "./dateUtils.js";

export const PHASES = [
  "Getting familiar with the material",
  "In-depth study",
  "Practice and exercises",
  "Revision",
];

export function createActivityId() {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    // Fall back when access to browser crypto is unavailable.
  }
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dateOnly(value) {
  if (typeof value === "string") return value;
  const year = String(value.getFullYear()).padStart(4, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const phaseIndex = Math.min(2, Math.floor(((week - 1) / (weeks - 1)) * 3));
  return PHASES[phaseIndex];
}

export function generatePlan(
  { subject, examDate, hoursPerWeek },
  today = new Date(),
) {
  const todayString = dateOnly(today);
  const daysUntilExam =
    localCalendarDayNumber(examDate) - localCalendarDayNumber(todayString);
  const weeks = Math.max(1, Math.ceil(daysUntilExam / 7));
  const shortPlan = daysUntilExam < 7;
  const activitiesByWeek = [];

  for (let week = 1; week <= weeks; week += 1) {
    const weekDays = shortPlan
      ? daysUntilExam
      : Math.min(7, daysUntilExam - (week - 1) * 7);
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
          id: createActivityId(),
          name: `${subject.trim()}: ${name}`,
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
    subject: subject.trim(),
    examDate,
    hoursPerWeek,
    weeks,
    activities: selected.flat(),
    truncated: skippedWeeks > 0,
    skippedWeeks,
  };
}
