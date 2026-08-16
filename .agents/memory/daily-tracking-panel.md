---
name: Daily tracking panel
description: Non-obvious persistence rules for the compact admin tracking workflow.
---

The daily tracking workflow should treat a training session and a completed or partial routine as activity for streak purposes. The quick-status UI must not reintroduce the old free-text routine controls; partial routine details are represented by explicit nullable toggles, including the separate force toggle.

**Why:** The form is designed for fast mobile entry and old optional values must not be cleared just because a control was not touched. The backend also owns the automatic A/B day classification so imports and non-admin clients follow the same rule.

**How to apply:** When changing the form, send optional fields only when they differ from the existing entry (or have a meaningful value on create). Preserve nullable values for explicit clearing, keep the A/B assignment server-side, and use the same activity predicate in statistics, public day pages, and card streak displays.