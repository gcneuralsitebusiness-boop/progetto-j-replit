---
name: Generated API types stale vs runtime
description: tsc fails on content keys while vite build still succeeds because the generated API types are narrower than the runtime response.
---

`@workspace/api-client-react` is generated from `lib/api-spec/openapi.yaml`. When the backend returns a dynamic map (e.g. `/api/content`) with keys that are not in the generated `SiteContent` schema, `tsc` in `artifacts/progetto-j` reports missing properties on `SiteContent`.

**Why:** Vite does not run TypeScript type-checking during `vite build`, so the production bundle compiles even when `tsc` errors. The errors are in the generated declaration files, not in the application code.

**How to apply:** To get a clean `pnpm run typecheck`, update the OpenAPI spec to include the missing keys and regenerate the client with Orval (`pnpm --filter @workspace/api-client-react generate` or the equivalent script). Alternatively, treat the generated type as a runtime contract and rely on `vite build` for deployment verification, noting that typecheck will be noisy until the types are regenerated.
