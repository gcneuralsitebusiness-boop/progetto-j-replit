---
name: Visual restyle verification
description: Project convention for safely applying visual-only changes to Progetto J.
---

Visual-only changes to Progetto J should preserve existing content, data fetching, mutations, URLs, and routing. Validate the result with the requested production build, targeted searches for removed effects/tokens, and responsive previews of the affected pages.

**Why:** The visual specifications explicitly prohibit refactors and unrelated behavioral changes, while CSS regressions are easiest to catch through both static checks and rendered previews.

**How to apply:** Treat new visual components as presentational, keep API contracts untouched, and run build + grep + desktop/mobile screenshots before delivery.

Use the artifact app-preview proxy for browser verification, and audit application elements rather than every element in the document.

**Why:** The public development domain can inject a platform preview banner outside the app. Its own small text and pointer interception can produce false typography failures and block navigation tests; the embedded app preview does not have that banner.

**How to apply:** Use the same proxy target resolved by app-preview screenshots. Exclude platform-injected UI from application typography checks without changing or hiding it in application code.

L’utente vuole la home grafica precedente al restyling semplificato e vuole mantenere tutte le correzioni al diario.

**Why:** Ha rifiutato esplicitamente il restyling della home, soprattutto su mobile, e ha ribadito che il diario deve restare invariato.

**How to apply:** Negli interventi sulla home preservare la sua identità grafica; non usare un ripristino dell’intero progetto per annullare modifiche limitate alla home.