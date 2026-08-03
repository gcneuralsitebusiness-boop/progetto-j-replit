---
name: Email notification configuration
description: Durable configuration rule for Progetto J submission notifications.
---

Contact and newsletter submissions are persisted first, then notification delivery is best-effort. Both `RESEND_API_KEY` and `NOTIFICATION_EMAIL` must be configured for delivery; missing configuration must never make the HTTP submission fail.

**Why:** The public forms must remain reliable even when email delivery is unavailable, and credentials must stay in Replit Secrets rather than source code.

**How to apply:** Keep notification errors logged server-side, return the successful persistence response independently, and verify secrets by existence only.