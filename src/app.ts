import express, { type NextFunction, type Request, type Response } from "express";
import { ProblemError, sendProblem } from "./problem.js";
import { savePlanHandler } from "./savePlan.js";
import type { Store } from "./store.js";

export function createApp(store: Store) {
  const app = express();
  app.use(express.json());

  app.post("/plans/:planId/save", savePlanHandler(store));

  app.use((_req, _res, next) => {
    next(new ProblemError(404, "route-not-found", "Route not found", "No such route."));
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    if (err instanceof ProblemError) return sendProblem(res, err);
    if (err instanceof SyntaxError) {
      return sendProblem(
        res,
        new ProblemError(400, "validation-error", "Request validation failed", "Malformed JSON."),
      );
    }
    return sendProblem(
      res,
      new ProblemError(500, "internal-error", "Internal error", "Unexpected error."),
    );
  });

  return app;
}
