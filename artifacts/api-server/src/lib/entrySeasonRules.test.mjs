import test from "node:test";
import assert from "node:assert/strict";
import { validateSeasonDay } from "./entrySeasonRules.ts";

test("Season 1 archive stays before Season 2 and within day 180", () => {
  assert.equal(validateSeasonDay(1, 180, "2026-11-05"), null);
  assert.match(validateSeasonDay(1, 180, "2026-11-06"), /conclusa il 2026-11-05/);
  assert.equal(validateSeasonDay(1, 179, "2026-11-06", true), null);
  assert.match(validateSeasonDay(1, 181, "2026-11-05"), /giorno 180/);
  assert.match(validateSeasonDay(1, 180, "2026-11-07"), /conclusa il 2026-11-05/);
  assert.match(validateSeasonDay(1, 180, "2026-11-15"), /Stagione 2/);
});

test("Season 2 number must match its calendar date", () => {
  assert.equal(validateSeasonDay(2, 1, "2026-11-15"), null);
  assert.equal(validateSeasonDay(2, 2, "2026-11-16"), null);
  assert.match(validateSeasonDay(2, 1, "2026-11-16"), /richiede il giorno 2/);
  for (const date of [
    "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10",
    "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14",
  ]) {
    assert.match(validateSeasonDay(2, 1, date), /precedenti/);
  }
});

test("rejects invalid phase, number, and calendar dates", () => {
  assert.match(validateSeasonDay(3, 1, "2026-11-15"), /fase/);
  assert.match(validateSeasonDay(2, 0, "2026-11-15"), /intero positivo/);
  assert.match(validateSeasonDay(2, 1, "2026-02-30"), /non è valida/);
});
