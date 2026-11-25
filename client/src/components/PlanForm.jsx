import { useState } from "react";

function validate(values) {
  const errors = {};
  const subject = values.subject.trim();
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const exam = new Date(`${values.examDate}T00:00:00.000Z`);
  const latest = new Date(todayUtc);
  latest.setUTCFullYear(latest.getUTCFullYear() + 2);
  if (!subject || subject.length > 100) {
    errors.subject = "* Enter a subject name.";
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.examDate) ||
    Number.isNaN(exam.getTime()) ||
    exam.toISOString().slice(0, 10) !== values.examDate ||
    exam <= todayUtc ||
    exam > latest
  ) {
    errors.examDate =
      "Choose a future exam date no more than two years from today.";
  }
  const hours = Number(values.hoursPerWeek);
  if (!Number.isFinite(hours) || hours < 1 || hours > 60) {
    errors.hoursPerWeek = "Enter between 1 and 60 hours per week.";
  }
  return errors;
}

export default function PlanForm({ onCreate, loading }) {
  const [values, setValues] = useState({
    subject: "",
    examDate: "",
    hoursPerWeek: "6",
  });
  const [errors, setErrors] = useState({});

  function update(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onCreate({
      subject: values.subject.trim(),
      examDate: values.examDate,
      hoursPerWeek: Number(values.hoursPerWeek),
    });
  }

  function openDatePicker(event) {
    const input = event.currentTarget;
    if (event.clientX >= input.getBoundingClientRect().right - 28) return;

    // Keep the native calendar icon's own click from toggling the picker twice.
    try {
      if (typeof input.showPicker === "function") input.showPicker();
    } catch {
      // Unsupported or blocked pickers fall back to the browser's native behavior.
    }
  }

  return (
    <form className="plan-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="subject">Subject</label>
        <input
          id="subject"
          name="subject"
          value={values.subject}
          onChange={update}
          maxLength={120}
          autoComplete="off"
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "subject-error" : undefined}
        />
        {errors.subject && (
          <span className="field-error" id="subject-error">
            {errors.subject}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="examDate">Exam date</label>
        <input
          id="examDate"
          name="examDate"
          type="date"
          value={values.examDate}
          onClick={openDatePicker}
          onChange={update}
          aria-invalid={Boolean(errors.examDate)}
          aria-describedby={errors.examDate ? "exam-date-error" : undefined}
        />
        {errors.examDate && (
          <span className="field-error" id="exam-date-error">
            {errors.examDate}
          </span>
        )}
      </div>
      <div className="field">
        <label htmlFor="hoursPerWeek">Study hours per week</label>
        <input
          id="hoursPerWeek"
          name="hoursPerWeek"
          type="number"
          min="1"
          max="60"
          step="any"
          value={values.hoursPerWeek}
          onChange={update}
          aria-invalid={Boolean(errors.hoursPerWeek)}
          aria-describedby={errors.hoursPerWeek ? "hours-error" : undefined}
        />
        {errors.hoursPerWeek && (
          <span className="field-error" id="hours-error">
            {errors.hoursPerWeek}
          </span>
        )}
      </div>
      <button className="button primary" type="submit" disabled={loading}>
        {loading ? "Creating plan…" : "Create plan"}
      </button>
    </form>
  );
}
