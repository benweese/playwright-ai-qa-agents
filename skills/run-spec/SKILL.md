---
name: run-spec
description: Run a Playwright spec, project or test id and summarize the results.
argument-hint: <spec path | project (smoke|api|ui) | test id like 12 or #0012> [headed] [TEST_ENV]
allowed-tools: Bash(npx playwright test:*) Bash(TEST_ENV=*)
disable-model-invocation: true
---

Run: $ARGUMENTS

Run `npx playwright test` from the repo root, where `playwright.config.js` lives, so the repo's config and environment always load.

Build the command from the arguments:
- a path → `npx playwright test <path> --reporter=line`
- `smoke`, `api` or `ui` → `npx playwright test --project=<name> --reporter=line`
- an id like `12` or `#0012` → `npx playwright test --grep "#0012" --reporter=line` (always the `#` and four digits, so it matches only that test)
- `headed` → add `--headed`
- `local`, `staging` or `prod` → prefix `TEST_ENV=<env>`

Report: passed/failed/skipped counts, and for each failure the test title, the first error line and the file:line. Suggest the ui-test-healer for UI locator failures. Don't edit any files.
