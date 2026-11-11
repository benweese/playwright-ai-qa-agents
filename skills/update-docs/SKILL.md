---
name: update-docs
description: Bring a repo's documentation up to date. Rewrites the README so it is detailed and matches the code, adds or fixes JSDoc on every function, class, method, type and option, and removes comments that only restate the code. Use when the user asks to update, review or clean up READMEs, JSDoc, code comments or documentation in general.
argument-hint: "[path to limit the sweep, e.g. src/ or api/]"
---

# Update docs

Scope: $ARGUMENTS (if empty, the whole repo).

Documentation only. Never change behaviour: no renamed identifiers, no reordered logic, no
"while I'm here" fixes. If you find a bug, report it at the end instead of fixing it.

## 1. Learn the repo first

- Read `CLAUDE.md` (if present), `package.json` (scripts, dependencies, `exports`), the lint
  config, CI workflows, and every source file in scope. Docs describe the code as it is, so
  read the code before writing about it.
- Note how the repo is meant to be used: what it exports or runs, how it is installed, how
  tests run, what lint checks.
- Note how it relates to other repos it names (dependencies, plugins, consumers).

## 2. JSDoc

Every function, class, method, exported constant, type, interface and option field in scope
gets a JSDoc block. In TypeScript, types come from the code, so JSDoc carries meaning, not types.

- **Summary:** one sentence on what it does or is, in plain words. Start with a verb for
  functions ("Builds…", "Asserts…"). Add a second paragraph only for behaviour a caller must
  know: side effects, what it waits for, what it disposes, soft vs hard assertions.
- **`@param name - …`** for every parameter, in order, names matching the code exactly. Say what
  it is and any default: "Default `1000`". For an options object, document its fields on the
  options type, and on the parameter write "see {@link FooOptions}".
- **`@returns …`** when it returns something useful. Describe the value, not the type.
- **`@throws Error if …`** when it throws on purpose.
- **`@template T - …`** for type parameters (the TypeScript JSDoc tag, not `@typeParam`).
- **`@example`** for the main entry points and anything whose usage isn't obvious: a short,
  real call taken from how the repo uses it.
- **`{@link Name}`** to point at related types or functions in the same codebase.
- **Constructors:** document parameters only; the class JSDoc carries the summary.
- **Option and interface fields:** one line each, with the default when there is one.
- **Module header** (`/** … */` at the top of a file): what the file is for, in two or three
  lines. Leave out `@module` unless the repo already uses it.
- **Fix wrong docs:** parameter names that no longer exist, defaults that changed, examples that
  no longer compile, descriptions of removed behaviour.
- Keep `// eslint-disable-next-line … -- reason` comments exactly where they are.
- Specs and tests: document helpers and fixtures. Test bodies are described by their titles
  and plans, so they need no comments beyond the "why" kind.

## 3. Comments

Keep a comment only if it says something the code can't: why a choice was made, a quirk of an
external system, a workaround and what it works around, a non-obvious constraint.

- **Remove:** comments that restate the code (`// loop over items`), commented-out code,
  outdated TODOs, banner and divider comments, and notes that are already in the JSDoc.
- **Move:** explanations of a value or field into JSDoc on that value or field, so editors show
  them on hover.
- **Shorten:** keep "why" comments to one or two lines.

## 4. README

Rewrite the README so a stranger can understand, install, use and change the repo without
reading the code first. Use the sections that apply, in this order:

1. **Title and badges** (CI status badges for the workflows that exist).
2. **What it is:** two or three sentences on what the repo does and why it exists.
3. **How it fits** with related repos: a table and, if it helps, a mermaid diagram.
4. **Requirements:** Node version (from `.nvmrc` or `engines`), other tools.
5. **Install / run it:** exact, copy-pasteable commands that work from a fresh clone.
6. **Usage:** the main workflows with short, real examples. For a library, a table of every
   export with a one-line description, then examples. For a test suite, how to run all, one
   project, one test, and see the report.
7. **Layout:** the folder tree with a short note per folder.
8. **Design decisions:** the non-obvious choices and why.
9. **Development:** lint, test, build and release commands, and how dependencies are kept
   current (including any pinned or overridden versions and why).
10. **License.**

Rules for the README:
- **Accurate over complete.** Every command, path, export, script and version must exist in the
  repo now. Check each one. Remove anything that describes code that is gone.
- **Don't oversell.** Describe what exists; mark planned work as planned.
- **Show, don't list:** prefer a short real example to a paragraph about it.
- Write plainly, in short sentences. Run the repo's formatter on the file if it has one.

If the repo has a `CLAUDE.md` or other docs (`docs/`, guides), check them against the code the
same way and fix anything out of date.

## 5. Verify

1. Run the repo's lint, type-check and tests (from `package.json` scripts). All must pass.
2. Prove only documentation changed. For TypeScript, compile the previous commit and the
   working tree with comments removed and compare:
   ```bash
   tmp=$(mktemp -d)
   git worktree add -q "$tmp/old" HEAD && ln -s "$PWD/node_modules" "$tmp/old/node_modules"
   npx tsc -p "$tmp/old" --removeComments --noEmit false --declaration false --declarationMap false --sourceMap false --outDir "$tmp/js-old"
   npx tsc -p . --removeComments --noEmit false --declaration false --declarationMap false --sourceMap false --outDir "$tmp/js-new"
   npx prettier --write "$tmp/js-old" "$tmp/js-new" >/dev/null
   diff -r "$tmp/js-old" "$tmp/js-new" && echo "compiled JavaScript identical"
   git worktree remove --force "$tmp/old"
   ```
   For other languages, read `git diff` and confirm every changed line is a comment, a docstring
   or documentation.
3. Check every command in the README still works, or at least that the scripts and paths it
   names exist.

## Report back

Files changed, grouped as JSDoc added, JSDoc fixed, comments removed or moved, README sections
rewritten. The verification results. Anything you found but did not change (bugs, unclear
behaviour, decisions the user should make).
