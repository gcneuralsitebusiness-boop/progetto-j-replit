---
name: Preview and live diary data
description: Durable checks for separating development preview data from published diary data and preserving day-number links.
---

The preview and published Progetto J site can point at different PostgreSQL environments, so a missing or stale diary record in preview does not prove that the live record was deleted. Public diary URLs should use the diary's `numero` (day number), not its internal database `id`.

**Why:** A preview refresh exposed stale development rows while the published database still contained the complete diary; using internal IDs in day-number routes also opened the wrong day.

**How to apply:** When diary data appears missing, compare both environments read-only first. Restore only after explicit confirmation, and verify `/giorno/{numero}` against the rendered day header and data before declaring success.