---
name: Mobile static server safety
description: Safe pattern for serving Expo static assets when static analysis flags request-derived filesystem paths.
---

The static mobile server should build an in-memory index from the trusted build directory during startup. Requests may decode and validate a URL, then select an indexed asset by normalized key; they must never be used to construct a filesystem path or read arbitrary files.

**Why:** Path normalization and containment checks are correct defenses, but static analyzers may still flag dynamic filesystem reads. More importantly, an asset index makes the request-time trust boundary explicit and protects against encoded separators, dot segments, and symlink surprises.

**How to apply:** When changing the mobile static server, keep file discovery restricted to startup traversal of the known build root, reject malformed URL encodings and dot segments, and serve only assets found in the index.