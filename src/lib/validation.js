import {
  addLocalCalendarYears,
  isValidIsoDate,
  localDateString,
} from "./dateUtils.js";

export function validatePlanInput(values, today = new Date()) {
  const errors = {};
  const subject =
    typeof values.subject === "string" ? values.subject.trim() : "";
  const todayDate =
    today instanceof Date ? today : new Date(`${today}T12:00:00`);
  const todayString = localDateString(todayDate);
  const examDate = values.examDate;

  if (!subject || subject.length > 100) {
    errors.subject = "* Enter a subject name between 1 and 100 characters.";
  }

  if (
    !isValidIsoDate(examDate) ||
    examDate <= todayString ||
    examDate > addLocalCalendarYears(todayString, 2)
  ) {
    errors.examDate =
      "Choose a valid future exam date no more than two years from today.";
  }

  const hours =
    typeof values.hoursPerWeek === "number"
      ? values.hoursPerWeek
      : values.hoursPerWeek === ""
        ? Number.NaN
        : Number(values.hoursPerWeek);
  if (!Number.isFinite(hours) || hours < 1 || hours > 60) {
    errors.hoursPerWeek = "Enter between 1 and 60 hours per week.";
  }
  return errors;
}
