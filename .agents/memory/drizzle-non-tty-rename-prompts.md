---
name: Drizzle non-TTY rename prompts
description: Safe handling when drizzle-kit mistakes a new table for a possible rename in Replit's non-interactive shell.
---

When `drizzle-kit push` asks whether a genuinely new table was renamed from an unrelated existing table, do not accept a rename or run force blindly. Inspect the prompt in a controlled pseudo-TTY and explicitly choose “create table” for each new table.

**Why:** In a non-TTY shell, both normal push and `--force` can fail before applying anything because rename resolution remains interactive. A wrong rename choice could damage existing data.

**How to apply:** First inspect the current development tables and confirm the supposed rename source must remain. Then allocate a pseudo-TTY, select the default “create table” row explicitly for each conflict, and verify afterward that old tables still exist and new-table counts are correct.

Even after resolving table-name prompts, inspect the final data-loss summary before confirming. The development database contains an `admin_sessions` table that is not represented in Drizzle schema; `push` can propose dropping it and its session records alongside unrelated additive changes. Abort that push rather than accepting or using `--force`; apply only the requested additive DDL and verify the existing session table remains intact.

**Why:** A live schedule schema update exposed this second, destructive prompt after both new table names had been explicitly selected for creation.

**How to apply:** Treat every final push summary as a separate approval boundary. If it includes unrelated tables or data, cancel and use a narrowly scoped, reviewed migration instead.