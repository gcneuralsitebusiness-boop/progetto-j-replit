# Progetto J

A premium dark personal website documenting J's 180-day physical and spiritual transformation, with a private CRM for logging daily entries.

## Run & Operate

- `pnpm --filter @workspace/progetto-j run dev` — run the frontend (port from env)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter routing
- UI: Bebas Neue headings, Inter body, dark theme (#0A0A0A bg, #B81D1D accent)
- Charts: Recharts (dark-themed LineChart + BarChart)
- API: Express 5 + express-session (cookie-based admin auth)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/progetto-j/src/pages/` — all 4 pages (home, journaling, chi-sono, admin)
- `artifacts/progetto-j/src/components/Navbar.tsx` — shared fixed navbar
- `artifacts/api-server/src/routes/entries.ts` — journal entry CRUD routes
- `artifacts/api-server/src/routes/admin.ts` — admin auth routes (login/logout/me)
- `lib/db/src/schema/giorni.ts` — database schema for journal entries
- `lib/api-spec/openapi.yaml` — API contract (source of truth)

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Home — hero + 3 latest entries | Public |
| `/journaling` | Charts (Recharts) + full diary feed | Public |
| `/chi-sono` | About J, story blocks | Public |
| `/admin` | CRM — add/edit/delete entries | Password-gated |

## Architecture decisions

- **Session auth, not JWT**: Admin uses `express-session` with cookie-based sessions. Simple, no token refresh complexity. Password stored as `ADMIN_PASSWORD` secret.
- **PostgreSQL, not Replit KV**: The monorepo already provisions Postgres; the relational model is a better fit for sortable/chartable numeric data than a key-value store.
- **`trust proxy: 1`**: Set on Express so secure cookies work behind Replit's TLS-terminating reverse proxy.
- **`credentials: "include"`** on all API fetches so session cookies are sent cross-origin.
- **Recharts dark theme**: Grid lines `#262626`, axes `#9A9A9A`, all lines/bars `#B81D1D`.

## User preferences

- Design tokens are fixed: bg `#0A0A0A`, surface `#141414`, accent `#B81D1D`, border `#262626`
- Bebas Neue for all headings/numbers, Inter for body
- No border-radius anywhere, no box shadows — 1px borders only
- Film grain overlay on all sections
- No white backgrounds anywhere
- Orthodox cross ☩ used as section separator and footer signature

## Gotchas

- After editing `lib/api-spec/openapi.yaml`, always run codegen before touching routes or frontend
- DB schema in `lib/db/src/schema/giorni.ts` — run `pnpm --filter @workspace/db run push` after changes
- Session secret is `SESSION_SECRET` (already set). Admin password is `ADMIN_PASSWORD` (set by user).
- Google Fonts imports MUST be the very first line of `index.css` before all other `@import` statements
