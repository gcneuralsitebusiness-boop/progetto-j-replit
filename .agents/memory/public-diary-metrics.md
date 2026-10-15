---
name: Public diary missing metrics
description: Preserve the distinction between recorded zero and missing diary measurements.
---

Public diary statistics must not invent measurements: missing values are unknown, not zero, and should display as a dash or an empty chart state.

**Why:** The user explicitly requested real recorded values only, including when comparing weeks and displaying financial progress.

**How to apply:** Preserve explicitly recorded zeros. Never supply a default workout intensity to calculate load. A financial balance needs observations for both income and expenses; an entirely missing series is not an assumed zero. A percentage increase from a zero baseline is undefined rather than an invented percentage.
