---
name: Object Storage web package in pnpm monorepo
description: How to wire a new workspace lib into Vite + TypeScript project references.
---

## Rule
When adding a new shared lib like `lib/object-storage-web` and importing it from an artifact:

1. **package.json exports must include `types`** — TypeScript/Vite resolution fails with a bare `".": "./src/index.ts"`. Use:
   ```json
   "exports": {
     ".": {
       "types": "./src/index.ts",
       "default": "./src/index.ts"
     }
   }
   ```

2. **Project references need `composite` + `emitDeclarationOnly`** for the shared lib, otherwise the consuming artifact's `tsc -p` typecheck reports:
   > Referenced project ... must have setting "composite": true.

3. **Run `tsc --build` (or `pnpm -w run typecheck:libs`) before the artifact typecheck** so `.d.ts` files are emitted for the shared lib. Plain `tsc -p tsconfig.json --noEmit` does not build references automatically.

4. **Restart the Vite dev server** after adding a new workspace dependency; HMR does not always pick up new symlinked packages.

**Why:** Vite + TypeScript project references rely on emitted declaration files for cross-package resolution, and package.json exports must be explicit about the type entrypoint for the bundler to resolve a `.ts` file from another package.

**How to apply:** Add lib → root `tsconfig.json` references and artifact `tsconfig.json` references; configure the lib tsconfig with `composite: true`, `emitDeclarationOnly: true`, `declarationMap: true`; update `exports` with `types`; then run `tsc --build` before the artifact typecheck.
