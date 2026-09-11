---
description: Generate this project's CLAUDE.md so agents inherit its conventions
argument-hint: [optional hint, e.g. "Flutter, Riverpod" or "NestJS + Prisma"]
allowed-tools: Read, Write, Glob, Grep, Agent, Bash(test:*), Bash(ls:*)
---

Set up this project's `CLAUDE.md` so every agent inherits its conventions.

## Steps

1. **Do not overwrite silently.** If `CLAUDE.md` already exists here, read it,
   report what it already covers and what is missing, and ask before changing
   anything. Stop there unless told to continue.

2. **Read the template** at `$AGENT_KIT_ROOT/templates/project-conventions.md`
   (resolve `AGENT_KIT_ROOT` from the environment). It defines the sections to
   fill. If the variable is unset, say so and stop.

3. **Determine the shape of the repository.** Look for manifests
   (`pubspec.yaml`, `package.json`, `*.csproj`, `go.mod`, ...).

   **If any manifest sits in a subdirectory rather than at the root, this is a
   packaged layout** - treat it as a monorepo even when there is only one
   package today. That is the standard shape here: the workspace root is the
   wrapper, code lives under `apps/<package>`, and a later API or web layer is
   added as a sibling with nothing moved.

   For a packaged layout, the root `CLAUDE.md` is a router, not a description:
   write it from `$AGENT_KIT_ROOT/templates/monorepo-index.md`, listing only
   the packages that actually exist. Never put stack conventions in the root
   file - it is prepended to every dispatch in every package. Then give each
   package its own `CLAUDE.md` from the conventions template.

   A manifest at the root and nowhere else means a single flat project; write
   one `CLAUDE.md` at the root and skip the router.

   Then, for each package (or for the flat project):

   - **Existing code:** dispatch `scout` to establish the conventions actually
     in use - stack and version, layering, HTTP client and interceptors, DI,
     state management, folder layout, naming, localisation, config handling,
     and the commands for run/test/lint. Give it the manifest and the source
     root as its starting points. Do not read the codebase yourself.
   - **Empty project:** ask me the smallest set of questions that cannot be
     inferred - stack, architecture, and how the project is run and tested.
     Ask them in one message, not one at a time. `$ARGUMENTS`, if present, is
     my hint about the stack; use it and ask only what it leaves open.

4. **Pull the stack's rules from the library.** Read
   `$AGENT_KIT_ROOT/library/INDEX.md` and look for a rules entry whose stack
   matches what step 3 established. If there is one, open only that file.
   If there is none, say so in the report and continue without inventing a
   list; a missing stack is a gap to fill later, deliberately, not something
   to improvise per project.

   A rules file is a source, not something to copy wholesale. Split it by
   its own `Enforce` column, because each carrier costs differently:

   - `lint` rows: the library ships the matching config next to the rules
     file (for example `web/eslint.config.mjs`). Copy that config into the
     project and add the run command to `CLAUDE.md`. These rows must NOT be
     repeated as prose in `CLAUDE.md`: the analyzer already decides them on
     every save, and a duplicated rule is paid for on every dispatch of
     every agent forever while changing nothing.
   - `packet` rows: they belong to the planner's acceptance template, not
     to `CLAUDE.md`. List them under a short "Acceptance defaults" heading
     so the planner can lift them, worded exactly as in the library,
     condition first.
   - `gate` rows: name them in one line each under "Gates to add", with no
     detail. They are hook work, tracked separately.
   - `review` rows: leave them out entirely. They reach a reviewer by
     design and cost context everywhere else.

   Where a library row contradicts what `scout` found in the existing code,
   the existing code wins and the difference is reported, not silently
   reconciled.

5. **Write `CLAUDE.md`** in the project root, following the template's
   sections. Rules for the content:
   - State what is true, not what would be nice. If a convention is not
     established, write `None` rather than inventing one.
   - Be specific and short. Exact commands, exact folder names, exact library
     names. This file is prepended to every agent's context - every wasted
     line is paid for on every dispatch.
   - Never include the dispatch table, parallelism rules, or reporting rules.
     Those live in the global `~/.claude/CLAUDE.md` and apply already.
   - Record anything that should override an agent's own defaults, such as
     "no test runner in this project - do not add one".

6. **Report** in at most 6 lines: what was written, which sections you could
   not determine and left as `None`, whether the library had an entry for
   this stack, and which lint config was installed.
