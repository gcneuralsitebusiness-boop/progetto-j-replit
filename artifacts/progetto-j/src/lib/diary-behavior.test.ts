import test from "node:test";
import assert from "node:assert/strict";
import type { Entry, EntryInput } from "@workspace/api-client-react";
import { buildEntryPayload, assertEntrySaved } from "./entry-save.ts";
import { isCurrentDayPending } from "./current-day.ts";
import { calendarDayDate, dayPath, seasonParams } from "./seasons.ts";

const initial = { id: 1, numero: 40, data: "2026-10-12", peso: 80, kcal: 2000, alcol: true, testo: "Diario", cardTitolo: "Intatto" } as Entry;

test("cleared numeric values survive JSON as explicit null; unrelated fields are preserved", () => {
  const payload = buildEntryPayload({ ...initial, peso: undefined, kcal: undefined, alcol: false }, initial);
  const json = JSON.parse(JSON.stringify(payload));
  assert.equal(json.peso, null);
  assert.equal(json.kcal, null);
  assert.equal(json.alcol, false);
  assert.equal("testo" in json, false);
  assert.equal("cardTitolo" in json, false);
});

test("zero, false, blank strings and legacy numeric/boolean drafts are handled correctly", () => {
  const payload = buildEntryPayload({ numero: 41, data: "2026-10-13", entrate: 0, alcol: false, testo: "", peso: "81.5", routineCompletata: "false" } as unknown as Partial<EntryInput>);
  assert.equal(payload.entrate, 0);
  assert.equal(payload.alcol, false);
  assert.equal(payload.peso, 81.5);
  assert.equal(payload.routineCompletata, false);
  assert.equal("testo" in payload, false);
});

test("an edit can clear text and verifies the database response", () => {
  const payload = buildEntryPayload({ ...initial, testo: " " }, initial);
  assert.equal(payload.testo, null);
  assert.doesNotThrow(() => assertEntrySaved(payload, { ...initial, testo: null }));
  assert.throws(() => assertEntrySaved(payload, initial), /non ha confermato/);
});

test("server-owned day type does not cause a false save failure", () => {
  assert.doesNotThrow(() => assertEntrySaved({ numero: 40, data: initial.data, tipoGiorno: "B" }, { ...initial, tipoGiorno: "A" }));
});

test("only today's incomplete day is hidden; historic blanks and completed days are visible", () => {
  const rows = [{ numero: 1, data: "2026-10-12", testo: null }, { numero: 2, data: "2026-10-13", testo: "  " }];
  assert.equal(isCurrentDayPending(rows, 1, "2026-10-13"), false);
  assert.equal(isCurrentDayPending(rows, 2, "2026-10-13"), true);
  assert.equal(isCurrentDayPending([{ ...rows[1], testo: "Completato" }], 2, "2026-10-13"), false);
});

test("midnight creation race and catch-up gaps show today's loader without hiding missing historic days", () => {
  const rows = [{ numero: 30, data: "2026-10-11", testo: "Finito" }];
  assert.equal(isCurrentDayPending(rows, 32, "2026-10-13"), true);
  assert.equal(isCurrentDayPending(rows, 31, "2026-10-13"), false);
  assert.equal(isCurrentDayPending(rows, 33, "2026-10-13"), false);
  assert.equal(isCurrentDayPending(rows, NaN, "2026-10-13"), false);
});

test("season two restarts at one without changing legacy day URLs or request defaults", () => {
  assert.equal(dayPath(1), "/giorno/1");
  assert.equal(dayPath(1, 2), "/fase-2/giorno/1");
  assert.equal(seasonParams(1), undefined);
  assert.deepEqual(seasonParams(2), { fase: 2 });
});

test("season two fields survive saves and legacy drafts without mixing financial values", () => {
  const payload = buildEntryPayload({
    numero: 1, fase: 2, data: "2026-11-04", entrate: 100, uscite: 20,
    risparmio: "12.34", entrateOnline: "23.45", roundSparring: "3",
    roundPao: 4, roundTecnica: 5, oreLavoro: "7.5", videoPubblicati: 2,
    articoliPubblicati: 1, follower: 1710, pagineLette: 8, minutiScrittura: 15,
    alcol: false, oraSveglia: "05:30",
  } as unknown as Partial<EntryInput>);
  assert.equal(payload.fase, 2);
  assert.equal(payload.numero, 1);
  assert.equal(payload.risparmio, 12.34);
  assert.equal(payload.entrateOnline, 23.45);
  assert.equal(payload.entrate, 100);
  assert.equal(payload.uscite, 20);
  assert.equal(payload.roundSparring, 3);
  assert.equal(payload.oreLavoro, 7.5);
  assert.doesNotThrow(() => assertEntrySaved(payload, { ...payload, id: 999, oraSveglia: "05:30:00" } as Entry));
});

test("cleared season two fields send explicit null and preserve other saved values", () => {
  const saved = { ...initial, fase: 2, numero: 1, roundPao: 4, oraSveglia: "05:30:00", risparmio: 12.34 } as Entry;
  const payload = buildEntryPayload({ ...saved, roundPao: undefined, oraSveglia: "" }, saved);
  assert.equal(payload.roundPao, null);
  assert.equal(payload.oraSveglia, null);
  assert.equal("risparmio" in payload, false);
  assert.equal("testo" in payload, false);
});

test("season two calendar dates do not shift in American or European time zones", () => {
  const previousTZ = process.env.TZ;
  try {
    for (const timeZone of ["America/Los_Angeles", "Europe/Rome", "Pacific/Kiritimati"]) {
      process.env.TZ = timeZone;
      const date = calendarDayDate("2026-11-04", 2);
      assert.equal(date.getFullYear(), 2026);
      assert.equal(date.getMonth(), 10);
      assert.equal(date.getDate(), 4);
      assert.equal(calendarDayDate("2026-11-04", 1).getTime(), new Date("2026-11-04").getTime());
    }
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});
