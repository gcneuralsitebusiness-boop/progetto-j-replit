import test from "node:test";
import assert from "node:assert/strict";
import { validateSeasonDay } from "./entrySeasonRules.ts";

test("Season 1 archive stays before Season 2 and within day 180", () => {
  assert.equal(validateSeasonDay(1, 180, "2026-11-05"), null);
  assert.match(validateSeasonDay(1, 180, "2026-11-06"), /conclusa il 2026-11-05/);
  assert.equal(validateSeasonDay(1, 179, "2026-11-06", true), null);
  assert.match(validateSeasonDay(1, 181, "2026-11-05"), /giorno 180/);
  assert.match(validateSeasonDay(1, 180, "2026-11-07"), /Stagione 2/);
});

test("Season 2 number must match its calendar date", () => {
  assert.equal(validateSeasonDay(2, 1, "2026-11-07"), null);
  assert.equal(validateSeasonDay(2, 2, "2026-11-08"), null);
  assert.match(validateSeasonDay(2, 1, "2026-11-08"), /richiede il giorno 2/);
  assert.match(validateSeasonDay(2, 1, "2026-11-06"), /precedenti/);
});

test("rejects invalid phase, number, and calendar dates", () => {
  assert.match(validateSeasonDay(3, 1, "2026-11-07"), /fase/);
  assert.match(validateSeasonDay(2, 0, "2026-11-07"), /intero positivo/);
  assert.match(validateSeasonDay(2, 1, "2026-02-30"), /non è valida/);
});
