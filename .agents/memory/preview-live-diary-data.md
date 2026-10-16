---
name: Preview and live diary data
description: Durable checks for separating development preview data from published diary data and preserving day-number links.
---

The preview and published Progetto J site can point at different PostgreSQL environments, so a missing or stale diary record in preview does not prove that the live record was deleted. Compare workout fields (`tipoAllenamento`, `durata`, `km`) as well as row counts: development can have the same day numbers but substantially fewer populated metrics. Public diary URLs should use the diary's `numero` (day number), not its internal database `id`.

**Why:** A preview refresh exposed stale development rows while the published database still contained the complete diary; a later statistics check found most development workout fields blank while production held the recorded values. Using internal IDs in day-number routes also opened the wrong day.

**How to apply:** When diary statistics appear low or data appears missing, compare both environments read-only first, including populated workout fields and totals. Do not copy or restore data without explicit confirmation. Verify `/giorno/{numero}` against the rendered day header and data before declaring success.