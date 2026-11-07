export interface Plan {
  id: string;
  ownerId: string;
  memberIds: string[];
  status: "draft" | "saved";
  totalCost: number;
  groupTotal: number;
  savedAt?: string;
}

export interface IdempotencyRecord {
  bodyHash: string;
  responseBody: unknown;
}

/** In-memory stand-in for the database. Replace with the real data layer later. */
export class Store {
  readonly plans = new Map<string, Plan>();
  readonly idempotency = new Map<string, IdempotencyRecord>();

  addPlan(plan: Plan): void {
    this.plans.set(plan.id, plan);
  }
}
