import type { Plan } from "./store.js";

export interface Violation {
  code: string;
  message: string;
}

/** Stub of the backend validator. Real rules (hours, travel time, caps, rain) come in PA#3. */
export function validatePlan(plan: Plan): Violation[] {
  const violations: Violation[] = [];
  if (plan.totalCost > plan.groupTotal) {
    violations.push({
      code: "over_group_total",
      message: `Total cost ${plan.totalCost} exceeds the group total ${plan.groupTotal}.`,
    });
  }
  return violations;
}
