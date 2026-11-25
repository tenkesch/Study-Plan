import { Router } from "express";
import { createPlanSchema } from "../schemas/planSchema.js";
import { generatePlan } from "../services/planService.js";

export const planRouter = Router();

planRouter.post("/", (req, res, next) => {
  const parsed = createPlanSchema().safeParse(req.body);
  if (!parsed.success) {
    const error = parsed.error;
    error.status = 400;
    return next(error);
  }
  return res.json(generatePlan(parsed.data));
});
