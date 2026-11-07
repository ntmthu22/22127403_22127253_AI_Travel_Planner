import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import { ProblemError } from "./problem.js";
import type { Store } from "./store.js";
import { validatePlan } from "./validator.js";

interface SaveBody {
  confirmed: true;
  note?: string;
}

function parseBody(raw: unknown): SaveBody {
  const fail = (detail: string) =>
    new ProblemError(400, "validation-error", "Request validation failed", detail);
  if (typeof raw !== "object" || raw === null) throw fail("Body must be a JSON object.");
  const b = raw as Record<string, unknown>;
  if (b.confirmed !== true) throw fail("Field 'confirmed' must be the boolean true.");
  if (b.note !== undefined && (typeof b.note !== "string" || b.note.length > 200)) {
    throw fail("Field 'note' must be a string of at most 200 characters.");
  }
  return { confirmed: true, note: b.note as string | undefined };
}

/** POST /plans/:planId/save. See docs/contract/save-plan.md. */
export function savePlanHandler(store: Store) {
  return (req: Request, res: Response): void => {
    // 1. Authentication (stub: X-User-Id header; replaced by real auth later)
    const userId = req.header("X-User-Id");
    if (!userId) {
      throw new ProblemError(
        401,
        "unauthenticated",
        "Authentication required",
        "Missing X-User-Id.",
      );
    }

    // 2. Plan existence and membership. Non-members get 404 so a plan's existence is not leaked.
    const planId = String(req.params.planId);
    const plan = store.plans.get(planId);
    if (!plan || !plan.memberIds.includes(userId)) {
      throw new ProblemError(404, "plan-not-found", "Plan not found", `No plan ${planId}.`);
    }

    // 3. Ownership: only the creator may save.
    if (plan.ownerId !== userId) {
      throw new ProblemError(
        403,
        "not-plan-owner",
        "Only the plan owner can save",
        "Only the member who created this plan can save it.",
      );
    }

    // 4. Request validation
    const key = req.header("Idempotency-Key");
    if (!key || key.length > 128) {
      throw new ProblemError(
        400,
        "validation-error",
        "Request validation failed",
        "Header 'Idempotency-Key' is required (max 128 characters).",
      );
    }
    const body = parseBody(req.body);

    // 5. Idempotency replay
    const bodyHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
    const recordKey = `${userId}:${planId}:${key}`;
    const prior = store.idempotency.get(recordKey);
    if (prior) {
      if (prior.bodyHash !== bodyHash) {
        throw new ProblemError(
          422,
          "idempotency-key-reuse",
          "Idempotency-Key reused with a different body",
          "This Idempotency-Key was already used with a different request body.",
        );
      }
      res.set("Idempotent-Replayed", "true").status(200).json(prior.responseBody);
      return;
    }

    // 6. Already saved (with another key): repeating Save is safe and returns the same result.
    // 7. Otherwise the validator must pass before anything is shared.
    if (plan.status !== "saved") {
      const violations = validatePlan(plan);
      if (violations.length > 0) {
        throw new ProblemError(
          422,
          "plan-violates-constraints",
          "Plan violates constraints",
          "The validator rejected this plan; it was not saved or shared.",
          { violations },
        );
      }
      plan.status = "saved";
      plan.savedAt = new Date().toISOString();
    }

    const responseBody = {
      id: plan.id,
      status: plan.status,
      savedAt: plan.savedAt,
      sharedWith: plan.memberIds,
    };
    store.idempotency.set(recordKey, { bodyHash, responseBody });
    res.status(200).json(responseBody);
  };
}
