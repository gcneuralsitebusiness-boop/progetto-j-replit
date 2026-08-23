---
name: Mockup sandbox typecheck
description: How to interpret sandbox validation when shared UI components resolve conflicting React type packages.
---

The mockup sandbox can report TypeScript errors in its bundled calendar and spinner components because two React type versions are resolved simultaneously. Treat those as pre-existing dependency-resolution noise unless the new mockup files are named in the error output; validate the new component through its Vite preview and browser console as well.

**Why:** A clean visual mockup should not be blocked by unrelated shared UI components that it does not import.

**How to apply:** Run the sandbox typecheck for awareness, then build or preview the isolated mockup route. If the failure only names the existing shared components and the preview renders without console errors, report the limitation rather than altering shared dependencies during a design task.