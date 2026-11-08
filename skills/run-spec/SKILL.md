---
name: run-spec
description: Run a Playwright spec, project or test id through the repo's test script and summarize the results.
argument-hint: <spec path | project (smoke|api|ui) | test id like HOME-003> [headed] [TEST_ENV]
allowed-tools: Bash(npm test:*) Bash(npm run test:*) Bash(TEST_ENV=*)
disable-model-invocation: true
---

Run: $ARGUMENTS

Always go through `npm test` from the repo root (it loads the repo's config the same way every time). Never call `npx playwright test` directly.

Build the command from the arguments:
- a path → `npm test -- <path> --reporter=line`
- `smoke`, `api` or `ui` → `npm test -- --project=<name> --reporter=line`
- an id like `HOME-003` → `npm test -- --grep "HOME-003" --reporter=line`
- `headed` → add `--headed`
- `local`, `staging` or `prod` → prefix `TEST_ENV=<env>`

Report: passed/failed/skipped counts, and for each failure the test title, the first error line and the file:line. Suggest the ui-test-healer for UI locator failures. Don't edit any files.
