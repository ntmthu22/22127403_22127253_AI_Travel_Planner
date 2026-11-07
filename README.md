# AI Travel Planner

Class project CSC13114 (23KTPM1). Team: Nguyễn Trần Minh Thư (22127403), Hoàng Trí Luật (22127253).

## Setup

```bash
git clone <repo-url> && cd ai-travel-planner
npm ci
cp .env.example .env   # fill in values; never commit .env
```

## Checks (one command each; CI runs exactly these)

| Check        | Command                |
| ------------ | ---------------------- |
| Lint         | `npm run lint`         |
| Format check | `npm run format:check` |
| Type check   | `npm run typecheck`    |
| Tests        | `npm test`             |
| All four     | `npm run check`        |

`npm run format` fixes formatting. CI: `.github/workflows/ci.yml`. `main` is protected and
all four checks are required.

## Assistant permissions (`.claude/settings.json`)

- **Allowed:** run the four checks, `git status`, `git diff`, `git log`.
- **Ask first:** `git commit`, `git push`, `git checkout`, `npm install`, editing `docs/contract/**`.
- **Never:** read `.env`, force-push, push to `main`, `rm -rf`.

## Secrets and model cost

- Secrets live only in `.env` (gitignored). `.env.example` lists every variable without values.
- The model API key has a spending cap of **<AMOUNT> USD per month** set on the provider's
  dashboard (`<PROVIDER>`). <!-- TODO: fill in the real provider and amount -->

## Contract

`docs/contract/save-plan.md` is the contract of `POST /plans/{planId}/save`.
Tests: `test/save-plan.contract.test.ts`.
