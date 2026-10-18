---
name: Visual restyle verification
description: Project convention for safely applying visual-only changes to Progetto J.
---

Visual-only changes to Progetto J should preserve existing content, data fetching, mutations, URLs, and routing. Validate the result with the requested production build, targeted searches for removed effects/tokens, and responsive previews of the affected pages.

**Why:** The visual specifications explicitly prohibit refactors and unrelated behavioral changes, while CSS regressions are easiest to catch through both static checks and rendered previews.

**How to apply:** Treat new visual components as presentational, keep API contracts untouched, and run build + grep + desktop/mobile screenshots before delivery.