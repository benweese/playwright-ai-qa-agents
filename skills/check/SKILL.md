---
name: check
description: Lint the repo before committing, optionally auto-fixing.
argument-hint: [fix]
allowed-tools: Bash(npm run lint:*)
disable-model-invocation: true
---

Mode: $ARGUMENTS

- `fix` → run `npm run lint:fix`, then report what was fixed and what still needs a hand fix.
- otherwise → run `npm run lint` and report problems grouped by file. Don't change files.
