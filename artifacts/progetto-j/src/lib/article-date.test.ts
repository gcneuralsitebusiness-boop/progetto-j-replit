import test from "node:test";
import assert from "node:assert/strict";
import { dateKey, formatDateIt } from "./article-date.ts";

test("article and diary dates match without local timezone shifting", () => {
  assert.equal(dateKey("2026-10-15"), "2026-10-15");
  assert.equal(dateKey("2026-10-15T00:00:00+02:00"), "2026-10-15");
  assert.equal(dateKey("2026-10-15T23:00:00Z"), "2026-10-15");
  assert.equal(dateKey("2026-03-29T00:00:00+01:00"), "2026-03-29");
});

test("missing or invalid dates cannot create an invented diary link", () => {
  for (const value of [null, undefined, "", "not-a-date", "2026-13-01", "2026-02-30", "2026-10-151"]) {
    assert.equal(dateKey(value), null);
    assert.equal(formatDateIt(value), null);
  }
  assert.equal(dateKey("2024-02-29"), "2024-02-29");
  assert.equal(dateKey("2026-02-29"), null);
});

test("article date labels use the recorded day, not the browser's timezone", () => {
  assert.equal(formatDateIt("2026-10-15T00:00:00+02:00"), "15 ottobre 2026");
});
