---
description: Show what the agents have done so far - point answer, no detail dump
argument-hint: [filter, e.g. coder | blocked | T3]
allowed-tools: Bash(tail:*), Bash(grep:*), Bash(cat:*), Bash(test:*)
---

Recent agent activity in this project:

!`test -f .claude/state/progress.jsonl && tail -n 40 .claude/state/progress.jsonl || echo "NO_LOG"`

Answer the user's question about progress using only the lines above.

- If the output is `NO_LOG`, say no agent has recorded work in this project yet
  and stop.
- If `$ARGUMENTS` is present, treat it as a filter (agent name, task id, or
  status) and report only matching lines.
- A task with a `started` line and no later line for the same task id is
  **still running**. Report it as in flight, with the files it owns.
- Answer in at most 8 lines. Group by task, newest first. Do not restate the
  raw JSON, do not open any of the referenced files, and do not speculate
  about work that is not in the log.
- Name blocked and failed tasks explicitly - those are what the user needs to
  act on.
