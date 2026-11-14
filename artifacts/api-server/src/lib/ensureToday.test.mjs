import test from "node:test";
import assert from "node:assert/strict";
import { getRomeCalendarDate, planDaysToCreate } from "./ensureTodayPlan.ts";

const season1Ended = { maxData: "2026-11-05", maxNumero: 180 };
const noSeason2Days = { maxData: null };

test("November 5 remains the final Season 1 day, and November 6–14 create nothing", () => {
  assert.deepEqual(
    planDaysToCreate("2026-11-05", { maxData: "2026-11-04", maxNumero: 179 }, noSeason2Days),
    [{ fase: 1, numero: 180, data: "2026-11-05" }],
  );
  for (const date of [
    "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10",
    "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14",
  ]) {
    assert.deepEqual(
      planDaysToCreate(date, season1Ended, noSeason2Days),
      [],
    );
  }
});

test("starts Season 2 on November 15 with day 1", () => {
  assert.deepEqual(planDaysToCreate("2026-11-15", season1Ended, noSeason2Days), [
    { fase: 2, numero: 1, data: "2026-11-15" },
  ]);
});

test("creates Season 2 day 2 on November 16 after day 1 exists", () => {
  assert.deepEqual(
    planDaysToCreate("2026-11-16", season1Ended, { maxData: "2026-11-15" }),
    [{ fase: 2, numero: 2, data: "2026-11-16" }],
  );
});

test("catches up both Season 2 days when first invoked on November 16", () => {
  assert.deepEqual(planDaysToCreate("2026-11-16", season1Ended, noSeason2Days), [
    { fase: 2, numero: 1, data: "2026-11-15" },
    { fase: 2, numero: 2, data: "2026-11-16" },
  ]);
});

test("never plans a Season 1 day above 180", () => {
  const planned = planDaysToCreate(
    "2026-11-05",
    { maxData: "2026-11-04", maxNumero: 180 },
    noSeason2Days,
  );
  assert.ok(planned.every((day) => day.fase !== 1 || day.numero <= 180));
  assert.deepEqual(planned, []);
});

test("uses Europe/Rome when determining today's date", () => {
  assert.equal(getRomeCalendarDate(new Date("2026-11-06T22:59:00Z")), "2026-11-06");
  assert.equal(getRomeCalendarDate(new Date("2026-11-14T23:00:00Z")), "2026-11-15");
});
