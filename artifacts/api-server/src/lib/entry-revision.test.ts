import { test } from "node:test";
import assert from "node:assert/strict";
import { entryRevision, matchesRevision } from "./entry-revision";

test("entry revisions protect numbers AND original text against concurrent changes", () => {
  const row = { numero: 25, durata: 90, testo: "Originale", createdAt: new Date("2026-01-01Z") };
  const revision = entryRevision(row);
  assert.equal(matchesRevision(revision, JSON.parse(JSON.stringify(row))), true);
  assert.equal(matchesRevision(revision, { ...row, durata: 120 }), false);
  assert.equal(matchesRevision(revision, { ...row, testo: "Nuova modifica" }), false);
  assert.equal(matchesRevision(`W/${revision}`, row), false);
  assert.equal(matchesRevision(`"old", ${revision}`, row), true);
});
