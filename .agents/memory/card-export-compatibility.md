---
name: Card export compatibility
description: Compatibility rule for replacing the shared daily card canvas renderer
---

When replacing a shared card export module, preserve narrow adapters for older card routes until those routes are migrated.

**Why:** A visually correct new card can still break the whole frontend if a separate legacy route imports the old renderer helpers.

**How to apply:** Keep the new daily-card contract focused, and expose compatibility wrappers rather than changing unrelated legacy pages or their stored-data flows.

Compatibility includes the visual and data contract, not just keeping imports working. A reel download must match its displayed preview, including photo, crop, overlay, summary, and day metrics; unrelated daily-card layouts are not interchangeable.

**Why:** A compatibility adapter routed the reel download through a different daily-card design and discarded the reel metrics, producing a different image despite a correct preview. The user explicitly requires the downloaded cover to match the preview with current day data.

**How to apply:** Keep one visual source for preview and download wherever possible. Exclude editing/crop guides from the exported artwork. Check actual downloaded pixels against the preview, including updated metrics and missing-image errors; a working preview or successful download alone is insufficient.