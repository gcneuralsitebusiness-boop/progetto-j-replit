---
name: Card export compatibility
description: Compatibility rule for replacing the shared daily card canvas renderer
---

When replacing a shared card export module, preserve narrow adapters for older card routes until those routes are migrated.

**Why:** A visually correct new card can still break the whole frontend if a separate legacy route imports the old renderer helpers.

**How to apply:** Keep the new daily-card contract focused, and expose compatibility wrappers rather than changing unrelated legacy pages or their stored-data flows.