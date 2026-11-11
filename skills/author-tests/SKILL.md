---
name: author-tests
description: Author Playwright tests for a feature of the site. Use when the user asks to write, plan or generate tests for a feature, page, endpoint, URL or requirements file. Gathers context, runs the right planner (which writes acceptance criteria and scenarios), stops for review, then generates, runs and (for UI) heals.
argument-hint: <feature description | page URL | path to a requirements file>
---

# Author tests

Input: $ARGUMENTS

If there's no input, ask what feature, page or endpoint to test.

```
description → (page-mapper, UI only) → planner → HUMAN REVIEW → generator → run and review → (healer, UI only)
```

Stop at **HUMAN REVIEW** until the user approves, unless they explicitly asked to run everything without stopping.

## 1. Gather context

Nothing is written to disk in this step. Collect what the planners need, to pass in their prompts:

- **The input as given:** the user's description verbatim, the requirements file's path (the planner reads it), or the URL and what you can see there.
- **Feature name:** kebab-case, used for `plans/<feature>.md`.
- **Type:** API (endpoints), UI (pages), or both.
- **Existing coverage:** `ls tests/api tests/ui/specs plans docs/pages`, and any plan or spec that already covers this feature.
- **API clients available:** `ls api`.

If the input is too vague to plan from, ask the user one or two questions now rather than guessing.

## 2. Map the page (UI only)

If `docs/pages/<page>.md` is missing or the user says the page changed, run the **page-mapper** agent for that page.

## 3. Plan

Give each planner, in its prompt: the input as given, the feature name, and the context from step 1. The planner writes numbered **acceptance criteria** at the top of the plan, then scenarios that each say which criteria they cover.

- API → **api-test-planner**.
- UI → **ui-test-planner**, plus the page reference path.
- Both → run both into the same `plans/<feature>.md`: one shared acceptance criteria list, then an API section and a UI section.

## 4. Human review — STOP

Summarize for the user:
- the acceptance criteria, and any the scenarios don't cover (with the reason)
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
