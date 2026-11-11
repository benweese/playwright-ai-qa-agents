"""Fails if any agent or skill has frontmatter that isn't valid YAML.

`claude plugin validate` doesn't parse it, but Claude Code does when it loads the plugin,
and a plain value containing ": " (e.g. in a description) breaks it.
"""
import glob
import sys

import yaml

failed = False
for path in sorted(glob.glob("agents/*.md") + glob.glob("skills/*/SKILL.md")):
    text = open(path, encoding="utf-8").read()
    if not text.startswith("---\n"):
        print(f"FAIL {path}: no frontmatter")
        failed = True
        continue
    try:
        data = yaml.safe_load(text.split("---\n")[1])
        missing = [key for key in ("name", "description") if not data.get(key)]
        if missing:
            raise ValueError(f"missing {', '.join(missing)}")
        print(f"ok   {path}")
    except Exception as error:  # noqa: BLE001 - report any parse problem
        print(f"FAIL {path}: {str(error).splitlines()[0]}")
        failed = True
sys.exit(1 if failed else 0)
