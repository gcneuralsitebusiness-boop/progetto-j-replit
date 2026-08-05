---
name: SPA route scroll restoration
description: Scroll behavior contract for the Progetto J web router.
---

Public-page navigation uses the document window as its scroll container. Forward/link navigations reset only when the pathname changes; query/hash-only changes preserve position, while browser POP navigations defer to native history restoration.

**Why:** Users should start new pages at the beginning without losing their reading position when using Back or Forward.

**How to apply:** Keep route scroll logic mounted inside the wouter router and avoid replacing native history restoration with a global unconditional scroll reset.