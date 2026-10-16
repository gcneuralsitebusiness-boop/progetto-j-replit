---
name: Public diary missing metrics
description: Preserve the distinction between recorded zero and missing diary measurements.
---

Public diary statistics must not invent measurements: missing values are unknown, not zero, and should display as a dash or an empty chart state.

**Why:** The user explicitly requested real recorded values only, including when comparing weeks and displaying financial progress.

**How to apply:** Preserve explicitly recorded zeros. Never supply a default workout intensity to calculate load. A financial balance needs observations for both income and expenses; an entirely missing series is not an assumed zero. A percentage increase from a zero baseline is undefined rather than an invented percentage.

Factual totals should display their actual value immediately, including before they scroll into view. Do not initialize these metrics to zero or count through intermediate values.

**Why:** Offscreen counters and count-up animations made valid diary totals appear to be incorrect or missing. Animate presentation rather than the measured value when accuracy is the priority.

Historical numeric corrections may use only measurements explicitly and unambiguously stated in the original diary text. Do not estimate durations, infer running-only totals from mixed distances, or rewrite the narrative to make it match a number.

**Why:** The user explicitly chose “Correggi gli originali solo dove il testo è esplicito” when asked how to reconcile running distances and workout durations.

**How to apply:** Recheck the original and current numeric value before any authorized correction; ambiguous cases remain unresolved rather than receiving an invented value.
