---
name: author-tests
description: Author Playwright tests for a feature of the site. Use when the user asks to write, plan or generate tests for a feature, page, endpoint, URL or requirements file. Writes a brief, runs the right planner, stops for review, then generates, runs and (for UI) heals.
argument-hint: <feature description | page URL | path to a requirements file>
---

# Author tests

Input: $ARGUMENTS

If there's no input, ask what feature, page or endpoint to test.

```
brief → (page-mapper, UI only) → planner → HUMAN REVIEW → generator → run and review → (healer, UI only)
```

Stop at **HUMAN REVIEW** until the user approves, unless they explicitly asked to run everything without stopping.

## 1. Write the brief

Create `briefs/<feature>-brief.md` (kebab-case feature name). Gather:

- **What it is:** the user's description, the requirements file, or what you can see at the URL.
- **Type:** API (endpoints), UI (pages), or both. Split into an API part and a UI part if both.
- **Acceptance criteria:** numbered, testable statements. If the input is vague, write your best reading and list questions under "Open questions".
- **Existing coverage:** `ls tests/api tests/ui/specs plans docs/pages`, and anything relevant you find.
- **API clients available:** `ls api`.

## 2. Map the page (UI only)

If `docs/pages/<page>.md` is missing or the user says the page changed, run the **page-mapper** agent for that page.

## 3. Plan

- API → **api-test-planner** with the brief.
- UI → **ui-test-planner** with the brief and page reference.
- Both → run both; they write separate sections or separate plan files.

## 4. Human review — STOP

Summarize for the user:
- scenarios planned (ids and titles), and anything skipped as already covered
- clients, helpers or files to create
- site changes needed (missing labels/test ids)
- open questions

Wait for approval. Apply their changes to the plan before going on.

## 5. Generate

- API → **api-test-generator** with `plans/<feature>.md`.
- UI → **ui-test-generator** with `plans/<feature>.md`.

## 6. Run and review

```bash
npm test -- <spec path> --reporter=line
```

Go through the results with the user. If the site doesn't match the plan, the test stays failing; don't change the assertion. Offer `/playwright-qa-agents:bug-report`.

## 7. Heal (UI only, if needed)

Locator or timing failures → **ui-test-healer**. API failures are fixed in the spec or reported as bugs, not healed.

## Wrap up

Report: plan path, files created or extended, test ids, run result, open bugs or questions.
