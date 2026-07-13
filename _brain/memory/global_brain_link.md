# GLOBAL BRAIN LINK

> Optional. Points this project at a personal "global brain" repo — a separate repo holding
> your cross-project preferences and patterns, shared by every project you link to it. See the
> main `README.md` § Global Brain (Optional) for how to create your own — it's just three files:
> `GLOBAL.md`, `preferences.md`, `patterns/pattern_log.md`.
>
> This file is project data — the installer/updater never touches it once you set it.

---

## Path
C:/Users/STRATA-IAN/OneDrive/Claude-projects/ANX/idt-global-brain

## Rule
If Path is not "none":
- Read `<path>/GLOBAL.md` and `<path>/preferences.md` once per session, right after this
  project's own `claude.md`, before BOOTSTRAP_MODE spec collection or EXECUTION_MODE task
  selection — whichever comes first
- If anything there conflicts with this project's own `_brain/` files, THIS project's files
  win — the global repo supplies defaults, never overrides
- Only read `<path>/patterns/pattern_log.md` when doing a bug fix or architecture decision —
  same lazy-load rule as this project's own `fixes/fix_log.md`
