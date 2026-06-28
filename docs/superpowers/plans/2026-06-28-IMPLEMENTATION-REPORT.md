# M0-M5 Implementation Report

## Status: code complete, runtime verification pending

All 30 tasks in the implementation plan have been written and committed.
The runtime verification steps (pnpm install, dev server, astro build,
Lighthouse) were deferred per user choice (no network / no dependency install
in the sandbox).

## Commits

27 commits across the lifetime of the project. See `git log --oneline`.

## What you need to do locally

```bash
# 1. Install dependencies
pnpm install

# 2. Download web fonts
cd apps/web/public/fonts
# See README.md in this directory for the three curl commands.

# 3. Run dev server
cd ../..  # back to repo root
pnpm dev
# Open http://localhost:4321

# 4. Build production
pnpm build
# Output: apps/web/dist
# Pagefind index: apps/web/dist/pagefind/
```

## Manual acceptance walkthrough (T29)

- [ ] M1 Note: visit /edit, write a note with `[[welcome]]`, save it under apps/web/src/content/notes, expect reverse-link panel to show "被 1 处引用"
- [ ] M2 Categories + tags: /tree expands 杂学, /tags lists `meta`
- [ ] M3 Search: /search type "欢迎", Cmd+K on any page types "welcome"
- [ ] M5 Visual: home shows magazine hero, dark mode toggle works

## Spec coverage

- M1 Note — T8-T13
- M2 Clipped — T6 schema + content folder; M2 extension deferred to v0.5
- M3 Tree — T9, T15, T16
- M4 Tag — T14, T17
- M5 Search — T20-T22
- M6 Wiki link / backlinks — T12, T19
- M7 Visual + theme — T23-T25
- Deploy — T27
