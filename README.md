# agent-kit

A context-isolated agent team for Claude Code. Each agent runs in its own
context window and returns a distilled report, so research and implementation
never fill the main session.

## The team

| Agent | Model / effort | Writes? | Use for |
|-------|----------------|---------|---------|
| `planner` | opus / high | no | Breaking a goal into parallel-safe task packets |
| `scout` | sonnet / medium | no | "Where is X, how is Y done here" |
| `web-scout` | sonnet / medium | no | Library docs, versions, external APIs |
| `obsidian` | sonnet / low | no | The user's own notes, on explicit request only |
| `coder` | sonnet / medium | yes | Implementing one scoped task plus its tests |
| `reviewer` | opus / high | no | Verifying a change, running the tests |
| `/durum` | — | — | "What has been done so far", ~200 tokens |

Thinking is concentrated where decisions are made - planning and review - not
where code is typed.

## Install

The agents are exposed to every project by junctioning this repo's `agents/`
and `commands/` into `~/.claude/`. Run this once, in PowerShell:

```bash
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\agents" -Target "C:\Projects\Ai\ClaudeAgent\agents"
```

```bash
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\commands" -Target "C:\Projects\Ai\ClaudeAgent\commands"
```

Then set the library root so `coder` can find reusable code:

```bash
[Environment]::SetEnvironmentVariable("AGENT_KIT_ROOT", "C:\Projects\Ai\ClaudeAgent", "User")
```

Restart Claude Code. Verify by asking it to list available subagents, or by
running `/durum` in any project - the command existing at all proves the
junction works.

Because these are junctions, editing a file in this repo takes effect
everywhere. There is no publish or update step.

> The `.claude-plugin/` manifests in this repo are dormant. `/plugin` is not
> available in the desktop environment; they are kept in case a CLI with
> marketplace support is used later.

## Use it in another project

Routing is already global: the dispatch table, parallelism rules, and
reporting rules live in `~/.claude/CLAUDE.md` and apply in every project with
no setup.

**Setting up on a new machine / for another person** — three pieces, in
order (the junctions above are step 2):

1. Copy this repo to the new machine (any path; adjust the junction targets
   and `AGENT_KIT_ROOT` to match).
2. Run the two junction commands and the env var from *Install*.
3. Copy the **"Agent Orchestration"** section from the original machine's
   `~/.claude/CLAUDE.md` into the new machine's `~/.claude/CLAUDE.md` —
   the dispatch table, "announce the route", dispatch-writing, parallelism
   and reporting rules. Without this block the agents exist but nothing
   routes to them; with it, routing works in every project automatically.

A project that already carries a committed `CLAUDE.md` (like Zest) needs
nothing else — clone it and the agents inherit its conventions. Only a brand
new project needs `/kurulum` (below).

## Project layout

Open the wrapper directory as the workspace, with code under `apps/<package>`,
even for a single package:

```
MyProject/
  CLAUDE.md          router - which package doc to read
  apps/mobile/       the app, with its own CLAUDE.md
```

An API or web layer added later becomes `apps/api` and `apps/admin` with
nothing moved and no paths rewritten. The root router costs a few lines per
dispatch; restructuring a live project costs considerably more.

The only per-project step is describing the project, and it is one command:

```
/kurulum
```

In a project that already has code, it dispatches `scout` to read the
conventions actually in use and writes `CLAUDE.md` from them. In an empty
project, it asks the few questions it cannot infer. Pass a hint to skip the
guessing: `/kurulum Flutter, Riverpod, Dio`.

It refuses to overwrite an existing `CLAUDE.md` without asking.

`templates/project-conventions.md` is the section list it fills in. Edit that
template to change what every project's `CLAUDE.md` covers.

Every agent loads `CLAUDE.md` automatically, so whatever is written there is
inherited free by every dispatch. Whatever is left out gets re-explained in
every dispatch, at full token price. That single file is where this kit's
token economics are won or lost.

## Optional: Obsidian

The `obsidian` agent stays dormant until you point it at a vault:

```powershell
[Environment]::SetEnvironmentVariable("OBSIDIAN_VAULT", "C:\Projects\Obsidian", "User")
```

Restart the terminal afterwards. Without this variable the agent refuses to
run rather than searching the disk.

## Optional: the library

`library/INDEX.md` is an index of working code you want reused rather than
rewritten - service classes, API clients, common utilities. `coder` reads the
index before writing anything and copies a matching entry into the project.

It starts empty. Add entries as patterns prove themselves; see the
instructions inside `library/INDEX.md`.

## How progress is tracked

Agents append one JSON line per finished task to
`.claude/state/progress.jsonl` **in the project being worked on**, not here.
`/durum` reads that file. Nothing else does.

Add it to the project's `.gitignore` unless you want the history shared.

## Updating

Edit the files in this repo. The junctions mean the change is already live for
every project - no install step. Restart the session, since agent definitions
are not guaranteed to reload mid-session.

## When not to use an agent

Dispatching costs a few thousand tokens before any work happens. For a single
known file and a single step, doing it directly is cheaper and faster. The
gain appears on multi-file work, wide searches, long reviews, and anything
that can genuinely run in parallel.
