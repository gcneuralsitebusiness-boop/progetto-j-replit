---
name: Public diary freshness
description: Keep diary projections and browser caching consistent after admin saves.
---

Day changes must refresh every public projection, including the lightweight dataset used by home and diary, not only the old full list and summary.

**Why:** React Query matches array-key segments, not URL prefixes. Invalidating a key containing `/api/entries` does not invalidate a distinct segment containing `/api/entries/light`. The browser can also reuse an HTTP-cached response after the client cache is invalidated.

**How to apply:** Cover create, update, delete and bulk import. Invalidate all affected projection keys, require HTTP revalidation for live metrics, and give other browser sessions a finite refresh path. Keep the featured-day feed fresh after midnight even when its previous latest entry was already complete.
