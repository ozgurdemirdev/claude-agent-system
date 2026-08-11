# Monorepo Index

<!--
This is the ROOT CLAUDE.md of a monorepo. It routes; it does not describe.

Keep it short. It is prepended to every agent's context on every dispatch, in
every package. Stack conventions belong in the per-package CLAUDE.md, never
here - otherwise the mobile agent pays for the database rules and the backend
agent pays for the styling rules.

Delete this comment once filled in.
-->

Read the document for the package you are working in. Read that one only.

| Your work is in | Read |
|---|---|
| `apps/mobile/**` | `apps/mobile/CLAUDE.md` |
| `apps/api/**` | `apps/api/CLAUDE.md` |
| `apps/admin/**` | `apps/admin/CLAUDE.md` |
| `packages/contracts/**` | `packages/contracts/CLAUDE.md` |

If a task spans two packages, it is two tasks. Say so rather than reaching
across the boundary.

## Cross-cutting rules

These are the only rules that live at the root, because they belong to no
single package:

- **Contracts are the single source of truth.** Request and response shapes,
  shared enums, and error codes live in `packages/contracts`. Never redeclare
  a shape locally, on either side of the wire.
- **A contract change lands alone.** It is its own wave, before any consumer
  is touched. Producers and consumers are only parallel-safe once the shape
  is fixed.
- **Never edit another package's files.** Cross-package work is coordinated
  through contracts, not through direct edits.

<!--
Add further root-level rules only when they genuinely apply to every package -
shared tooling, commit conventions, release process. Everything else goes down
one level.
-->
