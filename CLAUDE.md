# agent-kit

A context-isolated agent team for Claude Code. This repository is the source
of truth; `agents/` and `commands/` are exposed to every project through
directory junctions at `~/.claude/agents` and `~/.claude/commands`.

## What lives where

```
agents/                          agent definitions
commands/                        slash commands
library/INDEX.md                 reusable code index - coder reads this first
templates/                       blocks to paste into consuming projects
.claude-plugin/                  dormant plugin manifests, see below
```

The `.claude-plugin/` manifests are kept but unused: the `/plugin` command is
unavailable in the desktop environment this kit runs in. They stay valid for
a CLI that supports plugin marketplaces. The junction layout is the live path.

Because the junctions point at this repo, editing a file here changes
behaviour everywhere. There is no publish step.

## Design invariants

Break any of these and the system stops paying for itself.

1. **Every agent has an output contract with a hard line limit.** The value of
   an agent is what it leaves out. An agent that returns file contents is a
   bug.
2. **Conventions live in the consuming project's CLAUDE.md, never in a
   dispatch.** Agents load CLAUDE.md automatically. Restating conventions per
   dispatch is the main failure mode this design exists to prevent.
3. **Nesting stays off.** No agent lists `Agent` in `tools`. Nested chains make
   token cost unpredictable.
4. **Read-only agents are read-only.** `scout`, `web-scout`, `obsidian`,
   `reviewer`, and `planner` all deny `Edit`, `Write`, `NotebookEdit`.
5. **Effort follows the decision, not the typing.** `opus` + `effort: high`
   for `planner` and `reviewer`; `sonnet` + `effort: medium` for production
   work. If a plan is correct, writing the code is mechanical.
6. **`maxTurns` on every agent.** It is the ceiling on a runaway loop.
7. **Bulk output goes through `ctx_*`, not Bash.** That is what keeps bytes out
   of an agent's own context, not just out of its answer.

## Editing agents

Agent frontmatter supports: `name`, `description`, `model`, `effort`,
`maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`,
`isolation`, `color`.

Agent changes are not guaranteed to reload live - restart the session after
editing.

## Conventions for this repo

- Markdown and JSON only.
- **No absolute machine paths anywhere.** Machine-specific values come from
  environment variables: `AGENT_KIT_ROOT` (this repo) and `OBSIDIAN_VAULT`.
  Agents resolve them at runtime and degrade gracefully when unset.
- Bump `version` in `.claude-plugin/plugin.json` when agent behaviour changes,
  so the manifests stay usable if the plugin path ever opens up.
