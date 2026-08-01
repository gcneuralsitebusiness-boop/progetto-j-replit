---
name: Autoscale diary day creation
description: Diary day creation must be request-triggered because an autoscale API process may sleep through midnight.
---

Use a shared idempotent helper for diary-day creation and invoke it asynchronously from a normal public request, while retaining the in-process cron as a secondary trigger.

**Why:** Autoscale services can be asleep at midnight, so a cron-only implementation can miss a day entirely. The request path must not delay or fail the normal response if creation fails.

**How to apply:** Keep the Europe/Rome date check and `MAX(numero) + 1` calculation in one helper; protect concurrent execution with the date check and a unique-conflict-safe insert.