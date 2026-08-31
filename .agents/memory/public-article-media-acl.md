---
name: Public article media ACL
description: Rule for exposing uploaded article images without making private object storage public
---

Published article cover fields are public content only when the referenced object path belongs to a published article. The storage route must check both the editorial image and the optional card image before serving a private object entity to an anonymous visitor.

**Why:** Uploaded files live under the private object-entity path, so URL generation alone cannot make public article covers readable. The access decision must remain database-backed and must not expose draft media.

**How to apply:** Whenever a new public media field is added to a database-backed content type, add its published-state-aware object-path check to the storage ACL route.