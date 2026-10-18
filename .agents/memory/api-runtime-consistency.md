---
name: API runtime consistency after source updates
description: Verify the running API's access policy after source updates; frontend hot reload alone does not verify the backend.
---

After API-affecting source updates, confirm that the managed API service is running the updated code before changing route permissions to match an observed response.

**Why:** The preview served unauthorized responses for public diary reads even though the current source defined them as public. Rebuilding the managed API restored the intended responses without changing permissions or diary data. Frontend hot reload had made the workspace appear updated while the API process was not.

**How to apply:** Include runtime checks of public reads and protected writes in API-update handoffs; do not infer a data loss or change an access policy from a generic frontend “server unavailable” message.
