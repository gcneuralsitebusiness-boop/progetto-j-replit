import test from "node:test";
import assert from "node:assert/strict";
import { applySeason2AutomaticValues } from "./entryAutomaticValues.ts";

test("does not derive or alter Season 1 values", () => {
  const input = { oreLavoro: 4, kcal: 1800, lavoroInizio: "09:00", lavoroFine: "17:00" };
  assert.deepEqual(applySeason2AutomaticValues(1, input), input);
});

test("derives work duration and daily calories for Season 2", () => {
  assert.deepEqual(
    applySeason2AutomaticValues(2, {
      lavoroInizio: "09:15",
      lavoroFine: "17:45",
      kcalColazione: 500,
      kcalPranzo: 900,
      kcalCena: 650,
    }),
    {
      lavoroInizio: "09:15",
      lavoroFine: "17:45",
      kcalColazione: 500,
      kcalPranzo: 900,
      kcalCena: 650,
      oreLavoro: 8.5,
      kcal: 2050,
    },
  );
});

test("computes overnight shifts and honors existing fields on partial updates", () => {
  assert.deepEqual(
    applySeason2AutomaticValues(
      2,
      { kcalCena: 400 },
      {
        lavoroInizio: "22:00:00",
        lavoroFine: "06:00:00",
        kcalColazione: 350,
        kcalPranzo: 700,
      },
    ),
    { kcalCena: 400, oreLavoro: 8, kcal: 1450 },
  );
});

test("clearing all meals clears the derived total and clearing a work time clears hours", () => {
  assert.deepEqual(
    applySeason2AutomaticValues(
      2,
      { lavoroInizio: null, kcalColazione: null, kcalPranzo: null, kcalCena: null },
      { lavoroInizio: "09:00", lavoroFine: "17:00", oreLavoro: 8, kcalColazione: 500, kcal: 500 },
    ),
    { lavoroInizio: null, kcalColazione: null, kcalPranzo: null, kcalCena: null, oreLavoro: null, kcal: null },
  );
});

test("leaves manually entered calories alone when no meal values are supplied", () => {
  assert.deepEqual(
    applySeason2AutomaticValues(2, { kcal: 2200 }),
    { kcal: 2200 },
  );
});
