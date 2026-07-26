---
name: Drizzle Date vs Zod string mismatch
description: Drizzle returns timestamp columns as JS Date objects; Orval-generated Zod schemas expect strings — causes 500 on response parse.
---

## Rule
Before calling `.parse()` on any Drizzle DB row for a response, coerce Date objects to ISO strings with:

```ts
const ser = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
res.json(SomeResponseSchema.parse(ser(row)));
```

**Why:** Drizzle ORM maps PostgreSQL `timestamp` columns to JS `Date` objects. Orval generates Zod schemas from the OpenAPI spec where date-time fields are typed as `string`. Calling `.parse()` directly on DB rows crashes with `ZodError: Expected string, received date` → 500 to the client.

**How to apply:** Every route that (a) fetches rows from Drizzle and (b) runs Zod response parsing must use `ser()`. Routes that return rows directly via `res.json(rows)` without Zod parse are unaffected (Express JSON serializer handles Date → ISO string automatically).
