---
name: Autoscale diary day creation
description: Diary day creation must be request-triggered because an autoscale API process may sleep through midnight.
---

Use a shared idempotent helper for diary-day creation and invoke it asynchronously from public GET requests for either season, while retaining the in-process cron as a secondary trigger.

**Calendar rule:** Season 1 ended at day 180 on 2026-11-04. November 5–6 are a break; Season 2 starts on 2026-11-07, with its day number derived from the Europe/Rome calendar date.

**Why:** Autoscale services can be asleep at midnight, so a cron-only implementation can miss a day entirely. The request path must not delay or fail the normal response if creation fails. The season boundary and two-day break are explicit product rules.

**How to apply:** Use the shared season start date; keep the Europe/Rome date check, Season 1 limit of 180, and date-derived Season 2 numbering in one helper. Protect concurrent execution with a unique-conflict-safe insert.