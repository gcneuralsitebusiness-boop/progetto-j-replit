---
name: Article HTML content
description: Product and security contract for article body markup.
---

Article bodies use raw HTML for authoring, but only a small presentation-oriented tag and attribute subset may reach the DOM. Existing plain-text/legacy article content must remain readable during migrations.

**Why:** Editors need headings, lists, emphasis, links, quotes, and separators without CSS classes, while unsanitized article HTML would create an avoidable XSS risk.

**How to apply:** Keep sanitization centralized and shared by admin preview and public rendering. Add new markup only deliberately, with matching styles and sanitizer allowlists.