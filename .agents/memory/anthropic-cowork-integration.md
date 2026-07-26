---
name: Anthropic Cowork integration via Replit AI Integrations
description: How to add Claude-powered editing inside the app without managing API keys.
---

## Rule
To let Claude edit app content from inside the admin panel:

1. **Provision via `setupReplitAIIntegrations({ providerSlug: "anthropic" })`** — it sets `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY`. No manual API key is needed. Phone verification may be required the first time.

2. **Use the provided `@workspace/integrations-anthropic-ai` client** — it is pre-configured to read the env vars. Import `anthropic` from that package and call `anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 8192, messages: [...] })`.

3. **For stateless editing you do not need the `conversations`/`messages` tables** that the Anthropic template copies. They are only useful if you want to persist chat history. If you skip them, do not export them from the DB schema barrel and do not run migrations for them.

4. **Parse Claude responses defensively.** Claude may return JSON inside markdown fences. Strip fences before `JSON.parse`, or return a 500 if the output is not valid JSON matching your expected shape (`{ explanation, changes }`).

5. **Never auto-save AI output.** Always show an explicit preview and require manual confirmation before applying changes to the database.

**Why:** Replit manages the Anthropic integration and billing; using the provided client avoids leaking API keys; manual confirmation prevents accidental data overwrites by the model.

**How to apply:** Add a protected admin endpoint that fetches the current entity, builds a strict prompt, calls Claude, parses the JSON, and returns `{ explanation, changes }`. The frontend renders the preview and uses the existing update mutations to apply confirmed changes.
