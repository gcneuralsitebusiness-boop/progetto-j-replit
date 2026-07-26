---
name: Vite artifact build environment variables
description: Vite config for this project requires PORT and BASE_PATH at build time, not just runtime.
---

The `vite.config.ts` in `artifacts/progetto-j` throws at import time if `PORT` or `BASE_PATH` are not set. This means any shell build command needs them exported, even for a static build.

**How to apply:** Run `PORT=<assigned> BASE_PATH=<artifact-path>/ pnpm --filter @workspace/progetto-j run build`. `pnpm -r --if-present run build` fails if a workspace package (e.g. `artifacts/mockup-sandbox`) also needs `PORT` and it is not set, so targeted builds are safer for this monorepo.
