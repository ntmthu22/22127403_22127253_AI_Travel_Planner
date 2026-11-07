# Contract: `POST /plans/{planId}/save`

Saves a reviewed schedule and shares it with the group. This is the step after the user's
second confirmation. Nothing reaches the group before it succeeds. The validator always runs
again here, in the backend.

Status: **v1 (draft)**. Tests in `test/save-plan.contract.test.ts` follow this file.

## 1. Who may call it

| Caller                                       | Result                |
| -------------------------------------------- | --------------------- |
| Not signed in                                | `401 unauthenticated` |
| Not a member of the plan's group, or no plan | `404 plan-not-found`  |
| Group member who is not the plan's owner     | `403 not-plan-owner`  |
| The plan's owner (the member who created it) | allowed               |

Ownership rule: only the member who created the plan can save it. Non-members get 404, not 403,
so the existence of another group's plan is never revealed.

Authentication (development stub): header `X-User-Id: <userId>`. This is replaced by real
sign-in later; the rules above do not change.

## 2. Request

```
POST /plans/{planId}/save
X-User-Id: linh
Idempotency-Key: 7c1f0a52-3b9e-4c6e-a0a1-2f5d9d1e8b11
Content-Type: application/json

{ "confirmed": true, "note": "Final version for Saturday" }
```

| Part                     | Rule                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `planId` (path)          | string, id of an existing plan                                   |
| `Idempotency-Key` header | **required**, 1–128 characters, unique per intended save         |
| `confirmed` (body)       | **required**, must be the boolean `true` (the user pressed Save) |
| `note` (body)            | optional string, at most 200 characters                          |

Order of checks: authentication, then plan existence and membership, then ownership, then
request validation, then idempotency, then the validator.

## 3. Response `200 OK`

```json
{
  "id": "p1",
  "status": "saved",
  "savedAt": "2026-11-20T09:30:00.000Z",
  "sharedWith": ["linh", "an"]
}
```

| Field        | Type                  | Meaning                                           |
| ------------ | --------------------- | ------------------------------------------------- |
| `id`         | string                | plan id                                           |
| `status`     | `"saved"`             | always `saved` on success                         |
| `savedAt`    | string (UTC ISO 8601) | time of the first successful save                 |
| `sharedWith` | string[]              | ids of the group members who can now see the plan |

## 4. Errors (RFC 9457 problem details)

Every error is `application/problem+json` with `type`, `title`, `status`, `detail`. The `type`
is `https://travelplanner.example/problems/<slug>`.

| Slug                        | Status | When                                                                                         |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `validation-error`          | 400    | `Idempotency-Key` missing or too long; body not JSON; `confirmed` not `true`; `note` invalid |
| `unauthenticated`           | 401    | `X-User-Id` missing                                                                          |
| `not-plan-owner`            | 403    | caller is in the group but did not create the plan                                           |
| `plan-not-found`            | 404    | no such plan, or the caller is not in its group                                              |
| `idempotency-key-reuse`     | 422    | the same `Idempotency-Key` was used before with a different body                             |
| `plan-violates-constraints` | 422    | the validator rejected the plan; adds `violations: [{code, message}]`                        |
| `route-not-found`           | 404    | any unknown route                                                                            |
| `internal-error`            | 500    | unexpected server error                                                                      |

When the validator rejects, the plan stays `draft` and is **not** shared.

## 5. Idempotency (safe to repeat)

- Same `Idempotency-Key` and same body by the same user on the same plan: returns the
  **original response** again with header `Idempotent-Replayed: true`. No second save.
- Same key with a different body: `422 idempotency-key-reuse`.
- A plan that is already `saved`, called again with a **new** key: `200` with the same
  `savedAt` as the first save. `savedAt` never changes.
- Failed attempts (4xx/5xx) are not recorded, so the client may retry them with the same key.

## 6. Changes to this contract

- Adding an optional request field, a response field or a new error slug is backward
  compatible; note it here with the date.
- Removing or renaming a field, changing a status code, or making a field required is a
  breaking change: bump the version at the top and update the tests **in a separate commit
  that references this file**.
- The tests are never edited to make code pass. If the code and the contract disagree, the
  contract decides, unless the team changes the contract first.
