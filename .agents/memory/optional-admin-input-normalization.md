---
name: Optional admin input normalization
description: Boundary rule for optional values arriving from admin forms and persisted drafts.
---

Optional admin controls can arrive as empty strings, especially when a form restores an older autosaved draft. Empty strings are not SQL NULL and can cause PostgreSQL cast failures for boolean, numeric, and enum columns.

**Why:** A real diary update previously combined blank optional controls with a decimal duration and reached the database without normalization, producing an HTTP 500 instead of a user-facing validation result.

**How to apply:** Normalize only known optional entry fields at the API boundary: blank values become `null`, numeric strings become numbers, and boolean strings become booleans. Keep required identity/date fields untouched so schema validation can reject invalid requests.