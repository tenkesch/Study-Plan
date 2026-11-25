import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export function createPlanSchema(today = new Date()) {
  const todayDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const latestDate = new Date(todayDate);
  latestDate.setUTCFullYear(latestDate.getUTCFullYear() + 2);

  return z.object({
    subject: z.string().trim().min(1).max(100),
    examDate: z
      .string()
      .regex(isoDatePattern, "Exam date must use YYYY-MM-DD format")
      .refine((value) => {
        const parsed = new Date(`${value}T00:00:00.000Z`);
        return (
          !Number.isNaN(parsed.getTime()) &&
          parsed.toISOString().slice(0, 10) === value &&
          parsed > todayDate &&
          parsed <= latestDate
        );
      }, "Exam date must be in the future and no more than two years away"),
    hoursPerWeek: z.number().min(1).max(60),
  }).strict();
}

export const planSchema = createPlanSchema();
