import test from "node:test";
import assert from "node:assert/strict";
import type { Entry, EntryInput } from "@workspace/api-client-react";
import { buildEntryPayload, assertEntrySaved } from "./entry-save.ts";
import { isCurrentDayPending } from "./current-day.ts";

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
