---
name: Incompatible metric scales
description: Visualization rule for mixed exercise and routine metrics
---

Do not put repetitions, elapsed seconds, and categorical or level values on one shared y-axis. Render each metric with its own scale, preferably as small multiples when the series are sparse.

**Why:** A large-value metric such as plank seconds compresses repetition and level series into an apparently empty line, especially when only a few days contain routine data.

**How to apply:** When adding a routine metric to the statistics view, give it an explicit unit and independent domain/ticks; filter each mini-chart to the days where that metric has a value.