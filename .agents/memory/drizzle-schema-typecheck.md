---
name: Drizzle schema downstream typecheck
description: What to rebuild after adding a new Drizzle table so downstream artifacts pass tsc.
---

After adding a new table schema to `lib/db/src/schema/` and exporting it from `lib/db/src/schema/index.ts`, downstream artifacts that reference `@workspace/db/schema` will fail typecheck with `'XxxTable' has no exported member` because they read the stale `dist/*.d.ts` declarations.

**Why:** `@workspace/db` emits declarations to `dist/` and other packages use project references that point to those emitted declarations, not the source files.

**How to apply:** Run `pnpm --filter @workspace/db exec tsc --build` before running the downstream artifact's typecheck or build. This regenerates `dist/*.d.ts` and includes the new table. Then run `pnpm --filter @workspace/api-server run build` (or the relevant artifact's build) to confirm.
