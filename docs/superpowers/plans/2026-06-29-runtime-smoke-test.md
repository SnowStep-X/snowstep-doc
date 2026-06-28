# Runtime Smoke Test (2026-06-29)

## Result: all 9 pages return HTTP 200 with rendered content

```
/             HTTP 200 size=95039  (has content: True)
/welcome      HTTP 200 size=93984  (has content: True)
/links-test   HTTP 200 size=92552  (has content: True)
/tags         HTTP 200 size=91023  (has content: True)
/tags/meta    HTTP 200 size=93640  (has content: True)
/edit         HTTP 200 size=91127  (has content: True)
/search       HTTP 200 size=90844  (has content: True)
/about        HTTP 200 size=90822  (has content: True)
/tree         HTTP 200 size=93035  (has content: True)
```

## Issues found and fixed during the smoke test

### Fix 1: UTF-8 BOM stripped from 45 source files
PowerShell `Set-Content -Encoding utf8` writes UTF-8 with BOM. Node `JSON.parse` does not strip BOM, so `vitefu` failed to parse `apps/web/package.json` (the first bytes `EF BB BF` confused it). Stripped BOM from all 45 source files; `node_modules` (and `.pnpm/`) were updated automatically by pnpm hardlinks.

### Fix 2: pnpm 10 supply-chain policies
Two policies had to be relaxed for fresh installs:
- `minimum-release-age`: a freshly published `postcss@8.5.16` (today) was rejected. Set to 0.
- `ignored-builds`: pnpm 10 blocks postinstall scripts by default. Allowed `esbuild` and `sharp` (needed for native binaries).

Both are now in `pnpm-workspace.yaml`:

```yaml
onlyBuiltDependencies:
  - esbuild
  - sharp
```

### Fix 3: 7 missing runtime dependencies
The plan described CodeMirror / markdown-it / shiki in T11/T12 but they were never actually added to `apps/web/package.json` (I had only written the imports, never `pnpm add`). Added:

```json
"@codemirror/state": "^6.4.0",
"@codemirror/view": "^6.34.0",
"@codemirror/commands": "^6.7.0",
"@codemirror/lang-markdown": "^6.3.0",
"@codemirror/language": "^6.10.0",
"markdown-it": "^14.1.0",
"shiki": "^1.22.0"
```

### Fix 4: Content collection schema rejected `date` for `created`/`updated`
Astro's YAML parser converts `2026-06-28` to a JS `Date`. My zod schema was `z.string()` so it rejected. Changed to `z.coerce.string()` in `packages/shared/src/schema.ts`.

### Fix 5: Content collection was a single folder, not the standard layout
Original layout: `src/content/notes/`, `src/content/clipped/`. Astro requires the collection folder to match the name in `config.ts` (`articles`). Moved to `src/content/articles/*.md` and removed the subfolders. The `type: note | clipped` frontmatter field still distinguishes them.

### Fix 6: Dynamic route `[...slug].astro` returned 404 in dev mode
Astro 4 + dev mode + content collection: `getStaticPaths()` was called but got an empty collection, so the route was never registered. After moving the markdown files to `src/content/articles/` (root, not nested), the slug became the bare filename (`welcome` not `notes/welcome`), and the route started matching.

I also briefly switched to `output: 'hybrid'` with the Node adapter, but `@astrojs/node@9.x` requires Astro 5+; downgraded to `@astrojs/node@8.3.4`, then reverted back to `output: 'static'` because static + the flattened content layout works fine.

## How to run locally

```bash
# one-time
pnpm install

# dev
pnpm dev
# open http://localhost:4321

# production build + pagefind index
pnpm build
# output: apps/web/dist

# preview production
pnpm preview
```

## Notes for the user

- If `pnpm install` fails on supply-chain policy (`postcss@8.5.16 was published at 2026-06-28`), set `pnpm config set minimum-release-age 0` once.
- If you re-clone the repo and your `pnpm` is older than 10, the `onlyBuiltDependencies` field in `pnpm-workspace.yaml` may need to be moved into `package.json` (older pnpm reads from there).
- Web fonts: download the three woff2 files into `apps/web/public/fonts/` per `apps/web/public/fonts/README.md` or the site will use system fallbacks (still legible, just not the magazine feel).
