---
name: Highmaps journey map projection
description: The checked-in world SVG uses a compact projected coordinate system with unused vertical space.
---

The journey map SVG is not raw equirectangular geography: its main landmass occupies only the upper portion of the original tall viewBox, while marker placement needs a calibrated latitude transform.

**Why:** Applying a generic latitude-to-percent formula placed Thailand and Brazil away from their land areas, especially on narrow screens.

**How to apply:** Preserve the cropped 2:1 viewBox and the calibrated marker projection together; changing either one requires rechecking every marker at mobile width.