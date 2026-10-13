---
name: Shared browser test capacity
description: A testing-agent launch can be blocked by a run outside the current session; failed launches are not verification.
---

Browser-testing capacity is shared across the workspace. A launch can fail because another tester is running even when the current session has not started one; waiting on that failed launch repeats the capacity error.

**Why:** This contention blocked verification of a critical admin save flow. A failed launch must not be reported as a passing test or treated as a running job to wait on indefinitely.

**How to apply:** Prefer continuing a known existing tester. If no tester is available and verification cannot wait, run the focused flow directly with the installed Playwright runtime. Consume credentials only inside the test process, never print credentials or session cookies, and clean up only records created by the test.
