# Project Conventions

<!--
Paste this section into a project's CLAUDE.md.

The dispatch table, parallelism rules, and reporting rules live in the global
~/.claude/CLAUDE.md and apply everywhere - do not copy them here.

This file carries only what changes from project to project. Every agent loads
CLAUDE.md automatically, so whatever you write here is inherited free by every
dispatch. Whatever you leave out gets re-explained in every dispatch, at full
token price.

Delete the prompts below as you fill each one in. Keep it factual and short -
this is not documentation, it is the context every agent starts with.
-->

**Stack:** <!-- language, framework, version -->

**Architecture:** <!-- layering, where each kind of file belongs -->

**HTTP:** <!-- client, interceptors, error handling, base URL config -->

**Dependency injection:** <!-- container, how to resolve, registration style -->

**State management:** <!-- approach, and where UI state stops and logic starts -->

**Folder layout:** <!-- the tree, one line per top-level directory -->

**Naming:** <!-- file, class, and member conventions if they differ from the default -->

**Localisation:** <!-- mechanism, and what counts as user-visible -->

**Config and secrets:** <!-- where they live, how they are read -->

**Commands:** <!-- run, test, lint, build - exact commands -->

**Do not touch:** <!-- generated files, vendored code, anything off limits -->
