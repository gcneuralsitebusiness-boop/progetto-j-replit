---
name: Orval query serialization
description: Silent loss of path-level query parameters in generated fetch clients and the required runtime verification.
---

Define query parameters on individual OpenAPI operations, not only on the parent path. Reuse a YAML anchor where multiple operations share the parameter.

**Why:** Orval 8.18 generated correctly typed season parameters and separate query-cache keys, but empty serialization loops for list operations with only path-level parameters. Requests silently used the default season, showing Season 1 in the Season 2 route and hiding saved Season 2 rows in admin. TypeScript passed.

**How to apply:** After changing API parameters, verify the actual generated URL functions with representative non-default values. Do not treat distinct cache keys or accepted parameter types as proof that the HTTP request includes the parameter.
