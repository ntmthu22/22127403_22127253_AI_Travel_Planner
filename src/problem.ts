import type { Response } from "express";

export const PROBLEM_BASE = "https://travelplanner.example/problems/";

/** RFC 9457 problem details, thrown by handlers and rendered by the error middleware. */
export class ProblemError extends Error {
  constructor(
    public readonly status: number,
    public readonly slug: string,
    public readonly title: string,
    detail: string,
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(detail);
  }
}

export function sendProblem(res: Response, e: ProblemError): void {
  res
    .status(e.status)
    .type("application/problem+json")
    .json({
      type: PROBLEM_BASE + e.slug,
      title: e.title,
      status: e.status,
      detail: e.message,
      ...e.extra,
    });
}
