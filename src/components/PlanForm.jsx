import { useState } from "react";
import { validatePlanInput } from "../lib/validation.js";

export default function PlanForm({ onCreate }) {
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

  function submit(event) {
    event.preventDefault();
    const nextErrors = validatePlanInput(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const created = onCreate({
      subject: values.subject.trim(),
      examDate: values.examDate,
      hoursPerWeek: Number(values.hoursPerWeek),
    });
    if (created) {
      setValues({ subject: "", examDate: "", hoursPerWeek: "6" });
      setErrors({});
    }
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
      <button className="button primary" type="submit">
        Create plan
      </button>
    </form>
  );
}
