---
name: Drizzle non-TTY rename prompts
description: Safe handling when drizzle-kit mistakes a new table for a possible rename in Replit's non-interactive shell.
---

When `drizzle-kit push` asks whether a genuinely new table was renamed from an unrelated existing table, do not accept a rename or run force blindly. Inspect the prompt in a controlled pseudo-TTY and explicitly choose “create table” for each new table.

**Why:** In a non-TTY shell, both normal push and `--force` can fail before applying anything because rename resolution remains interactive. A wrong rename choice could damage existing data.

**How to apply:** First inspect the current development tables and confirm the supposed rename source must remain. Then allocate a pseudo-TTY, select the default “create table” row explicitly for each conflict, and verify afterward that old tables still exist and new-table counts are correct.