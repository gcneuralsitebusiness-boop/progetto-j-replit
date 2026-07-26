---
name: Tailwind v4 custom component classes
description: How to avoid `@apply` errors when using custom CSS classes in Tailwind v4 projects.
---

In Tailwind v4, custom classes (e.g., `.metallic-sheen`, `.card-lift`) are **not** considered utilities. If you try to use `@apply metallic-sheen` inside another custom class, the compiler throws:

`Cannot apply unknown utility class ...`

**How to apply:**

1. Use **raw CSS properties** inside the new class instead of `@apply`.  
   Example: instead of `@apply metallic-sheen`, add the two elements together in the HTML: `className="kpi-card metallic-sheen"`.

2. For custom grid columns that go beyond Tailwind’s default 1–12, add tokens in `@theme inline` (e.g., `--grid-template-columns-15: repeat(15, minmax(0, 1fr))`). Then the utility `grid-cols-15` is generated automatically.

**Why:** Tailwind v4 treats `@apply` as a utility-only composition mechanism. Component classes with pseudo-elements or multiple declarations cannot be consumed through `@apply`.
