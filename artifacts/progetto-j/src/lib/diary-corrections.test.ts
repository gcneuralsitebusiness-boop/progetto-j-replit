import { test } from "node:test";
import assert from "node:assert/strict";
import { explicitCorrection } from "./diary-corrections";

test("corrections require the exact day, original value and explicit evidence", () => {
  const entry = { numero: 25, testo: "Un’ora e mezza di grappling e lotta, poi 30 minuti di sacco Thai.", durata: 90, km: null };
  assert.equal(explicitCorrection(entry)?.after, 120);
  assert.equal(explicitCorrection({ ...entry, durata: null })?.after, 120);
  assert.equal(explicitCorrection({ ...entry, durata: 120 }), null);
  assert.equal(explicitCorrection({ ...entry, durata: 100 }), null);
  assert.equal(explicitCorrection({ ...entry, numero: 53 }), null);
  assert.equal(explicitCorrection({ ...entry, testo: "Circa un'ora di grappling." }), null);
});

test("explicit successive activities are added, not guessed from round counts", () => {
  const beach = { numero: 56, testo: "<p>6 round da 3 minuti di MMA sulla spiaggia.</p><p>Poi 2 ore di calcio sulla sabbia e lotta in mare.</p>", durata: 75, km: 5 };
  assert.equal(explicitCorrection(beach)?.after, 138);
  assert.equal(explicitCorrection({ ...beach, testo: "6 round di MMA. Poi calcio." }), null);
  assert.equal(explicitCorrection({ numero: 77, durata: 90, km: 0, testo: "Tennis, 10 km di corsa, 6 round di sparring." })?.after, 10);
});
