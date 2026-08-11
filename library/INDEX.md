# Library Index

Reusable, already-working code. `coder` reads this file before writing
anything and copies a matching entry into the project instead of rewriting it.

## How to read this file

One row per entry. `coder` matches on **Solves**, then opens only that one
file. Nothing else in `library/` should ever be read speculatively.

| Entry | Stack | Solves | File |
|-------|-------|--------|------|
| _(empty)_ | | | |

## How to add an entry

1. Drop the file under `library/<stack>/<name>.<ext>`.
2. Add a row above. **Solves** is the search key - write it as the problem, not
   the implementation ("calls a REST endpoint and parses the response into a
   typed model", not "ApiService").
3. Keep the file dependency-light and free of project-specific names, so it
   drops into any project of that stack.

An entry that is not in this table does not exist as far as the agents are
concerned.
