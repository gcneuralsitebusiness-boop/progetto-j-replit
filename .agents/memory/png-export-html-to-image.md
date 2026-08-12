---
name: PNG export with html-to-image
description: Pitfalls that make card PNG exports come out black/missing — cross-origin stylesheets, non-inlined images, fonts.
---

Rules for the card PNG export pipeline (shared helper wraps `toPng`):

1. **Every cross-origin `<link rel="stylesheet">` (e.g. Google Fonts) must carry `crossorigin="anonymous"`.** Otherwise html-to-image throws `SecurityError: Failed to read the 'cssRules' property from 'CSSStyleSheet'` and the export fails silently — no download, no on-page error.
   **Why:** browsers block JS access to cssRules of stylesheets loaded without CORS; html-to-image needs to read them to inline styles.
   **How to apply:** when adding any external stylesheet to an artifact that exports DOM to PNG, add the crossorigin attribute; when an export "does nothing", check the console for this error first.

2. **All images inside the exported element must be data URLs before `toPng` runs.** The shared export helper fetches each `<img>`/`background-image`, converts blob → base64, waits for decode, and now hard-fails with an Italian error if any src is still remote. Object-storage images served from the API otherwise taint the canvas or race the clone.

3. **Fonts:** the helper explicitly calls `document.fonts.load()` for the display font (Bebas Neue) before `document.fonts.ready` — `fonts.ready` alone only covers loads already in flight.

4. Verify exports end-to-end with the testing subagent (downloads enabled, pixel-sample the PNG for non-black corners) — a passing preview screenshot does NOT prove the downloaded PNG is correct.
