# Sparta AI — Public Repository Guide

## Structure

```
.opencode/              — opencode config (model tiers, settings)
packages/opencode/src/  — Agent prompt, compression, sandbox, tools
packages/core/src/      — Agent plugin
packages/tui/src/       — TUI theme
packages/ui/src/        — Desktop UI theme
skills/sparta/          — Skills overview
specs/storage/          — Full spec (SPARTA.md, SPARTA-SKILLS.md)
```

## Setup

```bash
npm install
```

Requires opencode installed separately: `npm install -g opencode`

## Sync with Private Repo

This is the public release. The full development monorepo is at `sparta-private`.
Cherry-pick Sparta-specific commits from private to public periodically.

## Conventions

- Branch names: short, hyphen-separated, no type prefixes
- Commits: `type(scope): summary` (feat, fix, docs, chore, refactor)
