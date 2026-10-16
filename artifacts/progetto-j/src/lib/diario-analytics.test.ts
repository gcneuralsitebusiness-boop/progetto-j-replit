import test from "node:test";
import assert from "node:assert/strict";
import type { EntryLight } from "@workspace/api-client-react";
import { diaryCoverage, entriesByDate, recordedEntries, isRecordedRest } from "./diario-analytics";

test("coverage preserves real zeros and excludes today's unfinished measurements", () => {
  const entries = [
    row(1, "2026-10-01", { durata: 0, km: 0 }),
    row(2, "2026-10-01", { durata: 60 }),
    row(3, "2026-10-02"),
    row(4, "2026-10-16", { durata: 300, km: 50, hasDiario: false }),
  ];
  assert.deepEqual(diaryCoverage(entries, "2026-10-16"), { records: 3, dates: 2, pending: 1, training: 2, duration: 2, distance: 1 });
  assert.equal(totalsFor(recordedEntries(entries, "2026-10-16")).find((m) => m.key === "ore")?.value, 1);
  assert.deepEqual(entriesByDate(entries).get("2026-10-01")?.map((e) => e.numero), [1, 2]);
});
import {
  correlations, januaryDays, isTraining, mondayOf, moneyTotals, monthlyMoney, periodEntries,
  personalRecords, romeDate, totalsFor, weeklyComparisons, weeklyLoad,
} from "./diario-analytics.ts";

const row = (numero: number, data: string, fields: Partial<EntryLight> = {}): EntryLight =>
  ({ id: numero, numero, data, hasDiario: false, ...fields });

test("flessioni: numeric value (including zero) wins over routine; fallback is counted only once", () => {
  const values = totalsFor([
    row(1, "2026-10-01", { flessioni: 20, routineFlessioni: "3x10", durata: 60 }),
    row(2, "2026-10-02", { routineFlessioni: "2 × 15", durata: 30 }),
    row(3, "2026-10-03", { flessioni: 0, routineFlessioni: "100" }),
  ]);
  assert.equal(values.find((m) => m.key === "flessioni")?.value, 50);
  assert.equal(values.find((m) => m.key === "ore")?.value, 1.5);
  assert.equal(values.find((m) => m.key === "addominali")?.value, null);
});

test("training sessions respect actual minutes or a non-rest type; missing is not invented", () => {
  assert.equal(isTraining(row(1, "2026-10-01", { tipoAllenamento: "NESSUNO", durata: 0 })), false);
  assert.equal(isTraining(row(2, "2026-10-02", { tipoAllenamento: "BJJ" })), true);
  assert.equal(isTraining(row(3, "2026-10-03", { durata: 45 })), true);
  assert.equal(isTraining(row(4, "2026-10-04", { tipoAllenamento: " rest " })), false);
  assert.equal(totalsFor([row(5, "2026-10-05")]).find((x) => x.key === "allenamenti")?.value, null);
  assert.equal(isRecordedRest(row(6, "2026-10-06")), false);
  assert.equal(isRecordedRest(row(7, "2026-10-07", { durata: 0 })), true);
  assert.equal(isRecordedRest(row(8, "2026-10-08", { tipoAllenamento: "RIPOSO" })), true);
});

test("weeks use Monday–Sunday based on Rome calendar, including the UTC Sunday boundary", () => {
  assert.equal(romeDate(new Date("2026-10-11T22:30:00Z")), "2026-10-12");
  assert.equal(mondayOf("2026-10-11"), "2026-10-05");
  assert.equal(mondayOf("2026-10-12"), "2026-10-12");
  const comparison = weeklyComparisons([
    row(1, "2026-10-11", { durata: 30, peso: 90, uscite: 40 }),
    row(2, "2026-10-12", { durata: 60, peso: 85, uscite: 20 }),
    row(3, "2026-10-05", { durata: 30 }),
    row(4, "2026-10-04", { durata: 1000 }),
  ], "2026-10-15");
  const minutes = comparison.find((m) => m.key === "minuti")!;
  assert.equal(minutes.previous, 60);
  assert.equal(minutes.current, 60);
  assert.equal(minutes.delta, 0);
  assert.equal(comparison.find((m) => m.key === "peso")?.trend, "better");
  assert.equal(comparison.find((m) => m.key === "uscite")?.trend, "better");
  assert.equal(comparison.find((m) => m.key === "sonno")?.current, null);
});

test("no fabricated percentage when previous value is zero", () => {
  const comparison = weeklyComparisons([
    row(1, "2026-10-05", { entrate: 0 }),
    row(2, "2026-10-12", { entrate: 10 }),
  ], "2026-10-15").find((m) => m.key === "entrate")!;
  assert.equal(comparison.delta, null);
  assert.equal(comparison.trend, "better");
});

test("money preserves recorded zeros and missing series; monthly chart stays chronological", () => {
  const rows = [
    row(2, "2026-10-01", { entrate: 100, uscite: 0 }),
    row(1, "2026-09-30", { entrate: 0, uscite: 20 }),
    row(3, "2026-10-02"),
  ];
  assert.deepEqual(moneyTotals(rows), { entrate: 100, uscite: 20, saldo: 80 });
  assert.deepEqual(moneyTotals([row(4, "2026-10-03", { entrate: 50 })]), { entrate: 50, uscite: null, saldo: null });
  assert.deepEqual(monthlyMoney(rows).map((m) => [m.month, m.saldo]), [["2026-09", -20], ["2026-10", 100]]);
  assert.equal(januaryDays("2027-01-30"), 1);
  assert.equal(januaryDays("2027-02-01"), 0);
});

test("period boundary includes today and six prior dates, independent of local timezone/DST", () => {
  const rows = [row(1, "2026-03-22"), row(2, "2026-03-23"), row(3, "2026-03-29"), row(4, "2026-03-30")];
  assert.deepEqual(periodEntries(rows, 7, "2026-03-29").map((e) => e.numero), [2, 3]);
  assert.equal(periodEntries(rows, 0, "2026-03-29").length, 4);
});

test("records retain the correct day; calendar gaps and duplicate dates don't inflate streaks", () => {
  const rows = [
    row(1, "2026-10-01", { durata: 30, peso: 85, routineFlessioni: "3x10" }),
    row(2, "2026-10-02", { durata: 40, peso: 84 }),
    row(3, "2026-10-04", { durata: 60, flessioni: 50 }),
    row(4, "2026-10-04", { routineCompletata: true }),
    row(5, "2026-10-05", { routineCompletata: true }),
    row(6, "2026-10-06", { routineCompletata: true, sonno: 9 }),
  ];
  const records = personalRecords(rows);
  assert.equal(records.find((r) => r.key === "flessioni")?.numero, 3);
  assert.equal(records.find((r) => r.key === "peso")?.numero, 2);
  assert.equal(records.find((r) => r.key === "streak")?.value, 3);
  assert.equal(records.find((r) => r.key === "streak")?.numero, 6);
});

test("correlations need eight COMPLETE pairs per group, not eight rows with missing measures", () => {
  const poor = Array.from({ length: 8 }, (_, n) => row(n + 1, "2026-10-01", { sonno: 5, intensita: 2, durata: 30, attrito: "stanchezza" }));
  const good = Array.from({ length: 8 }, (_, n) => row(n + 9, "2026-10-02", { sonno: 7, intensita: 4, durata: 60 }));
  assert.equal(correlations([...poor, ...good]).length, 2);
  assert.equal(correlations([...poor.slice(0, 7), ...good]).length, 0);
  assert.equal(correlations([...poor.map((e) => ({ ...e, intensita: null })), ...good]).length, 1);
});

test("weekly load never fills missing intensity with a default", () => {
  const rows = [row(1, "2026-10-12", { durata: 60 }), row(2, "2026-10-13", { durata: 30, intensita: 4 })];
  assert.equal(weeklyLoad(rows)[0].load, 120);
  assert.equal(weeklyLoad(rows)[0].minuti, 90);
  assert.equal(weeklyLoad(rows.slice(0, 1))[0].load, null);
});

test("a partial routine counts for streaks, not for the training session total", () => {
  const rows = [
    row(1, "2026-10-12", { durata: 30 }),
    row(2, "2026-10-13", { routineCompletata: false, routineForza: true }),
    row(3, "2026-10-14", { mobilita: true }),
    row(4, "2026-10-15", { grapplingVuoto: false, collo: false }),
  ];
  const streak = personalRecords(rows).find((r) => r.key === "streak");
  assert.equal(streak?.value, 3);
  assert.equal(streak?.numero, 3);
  assert.equal(totalsFor(rows).find((r) => r.key === "allenamenti")?.value, 1);
});
