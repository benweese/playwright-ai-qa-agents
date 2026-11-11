---
name: bug-report
description: Write a bug report for a problem found while testing the site, saved as a markdown file in bugs/.
argument-hint: <what's wrong, and the test id if a test found it>
disable-model-invocation: true
---

Write a bug report for: $ARGUMENTS

Fill gaps with your best reading of the description; leave out sections you can't fill rather than writing placeholders. If a test id is given, read that test and its plan scenario for the steps and expected result, and add the last run's error output if you have it.

Show the report first. On approval, save it to `bugs/YYYY-MM-DD-<short-slug>.md`.

```markdown
# <Area> - <short summary>

**Found by:** <test id, or "manual">
**Environment:** <site URL>, <browser if UI>
**Date:** YYYY-MM-DD

<What is broken vs what should happen.>

## Steps to reproduce
1. ...

## Expected
...

## Actual
... (exact error text, status code or values)

## Evidence
<error output, screenshot or trace path from test-results/>
```
