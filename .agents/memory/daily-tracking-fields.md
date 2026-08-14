---
name: Daily tracking fields
description: Durable data-model decisions for nutrition, training, routine, and statistics tracking.
---

New routine exercise descriptions are separate from legacy numeric exercise counters because existing public charts and cards depend on the original numeric meaning. All tracking fields remain nullable so automatically created diary days stay valid and public views omit empty sections.

**Why:** The diary creates placeholder days automatically, and the existing `flessioni` field is already used as a numeric metric. Reusing either would corrupt historical data or make “at least 14 days” statistics count empty placeholders.

**How to apply:** When adding analytics or streak calculations, filter for entries with at least one actual tracking value rather than counting every row; treat routine text fields as descriptive input and parse them only in the force-progression view.