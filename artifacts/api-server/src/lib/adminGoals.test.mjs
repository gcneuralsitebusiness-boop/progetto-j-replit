import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAdminGoals,
  getAdminGoalsQueryRange,
  getRomeCalendarDate,
  getWeekRange,
} from "./adminGoals.ts";

test("uses Rome's calendar date and Monday-to-Sunday week boundaries", () => {
  assert.equal(getRomeCalendarDate(new Date("2026-11-08T23:30:00.000Z")), "2026-11-09");
  assert.deepEqual(getWeekRange("2026-11-11"), {
    startDate: "2026-11-09",
    endDate: "2026-11-15",
  });
  assert.deepEqual(getAdminGoalsQueryRange("2026-11-11"), {
    from: "2026-11-01",
    toExclusive: "2026-12-01",
    monthStart: "2026-11-01",
  });
});

test("scores weekly goals and calculates monthly money shares", () => {
  const entries = [
    {
      data: "2026-11-09",
      flessioni: 30, squat: 30, addominali: 30, shadowMinuti: 3,
      allenamentoTecnica: true, allenamentoPesi: true, sparringFatto: true,
      pagineBibbia: 3, pagineLibro: 2, diarioFatto: true, brainstormingArticoli: true,
      dentiVolte: 3, doccia: true, kcalColazione: 400, kcalPranzo: 700, kcalCena: 600,
      km: 0, videoPubblicati: 1, caroselliPubblicati: 1, youtubePubblicati: 1,
      entrate: 1000, entrateOnline: 200, fondoEmergenza: 240, investimento: 360, uscite: 600,
    },
    {
      data: "2026-11-14",
      flessioni: 0, squat: 0, addominali: 0, shadowMinuti: 0,
      allenamentoTecnica: false, allenamentoPesi: false, sparringFatto: false,
      pagineBibbia: 0, pagineLibro: 0, diarioFatto: false, brainstormingArticoli: false,
      dentiVolte: 0, doccia: false, kcalColazione: 200, kcalPranzo: 0, kcalCena: 300,
      km: 6, videoPubblicati: 1, caroselliPubblicati: 1, youtubePubblicati: 0,
      entrate: 0, entrateOnline: 0, fondoEmergenza: 0, investimento: 0, uscite: 0,
    },
    {
      data: "2026-11-15",
      flessioni: null, squat: null, addominali: null, shadowMinuti: null,
      allenamentoTecnica: null, allenamentoPesi: null, sparringFatto: null,
      pagineBibbia: null, pagineLibro: null, diarioFatto: null, brainstormingArticoli: null,
      dentiVolte: null, doccia: null, kcalColazione: null, kcalPranzo: null, kcalCena: null,
      km: 4, videoPubblicati: 0, caroselliPubblicati: 0, youtubePubblicati: 0,
      entrate: 0, entrateOnline: 0, fondoEmergenza: 0, investimento: 0, uscite: 0,
    },
    {
      data: "2026-10-31",
      flessioni: 100, squat: 100, addominali: 100, shadowMinuti: 10,
      allenamentoTecnica: true, allenamentoPesi: true, sparringFatto: true,
      pagineBibbia: 10, pagineLibro: 10, diarioFatto: true, brainstormingArticoli: true,
      dentiVolte: 3, doccia: true, kcalColazione: 500, kcalPranzo: 500, kcalCena: 500,
      km: 20, videoPubblicati: 10, caroselliPubblicati: 10, youtubePubblicati: 10,
      entrate: 500, entrateOnline: 100, fondoEmergenza: 120, investimento: 180, uscite: 300,
    },
  ];

  const result = buildAdminGoals(entries, "2026-11-11");
  const findGoal = (key) => result.week.goals.find((item) => item.key === key);
  assert.equal(findGoal("weekendKm").done, 10);
  assert.equal(findGoal("weekendKm").target, 10);
  assert.equal(findGoal("weekendKm").met, true);
  assert.equal(findGoal("warmupDays").done, 1);
  assert.equal(findGoal("warmupDays").target, 7);
  assert.equal(findGoal("mealsLoggedDays").done, 2);

  assert.equal(result.monthlyMoney.income, 1200);
  assert.deepEqual(
    result.monthlyMoney.goals.map(({ key, target, actual, actualPercent }) => ({ key, target, actual, actualPercent })),
    [
      { key: "fondoEmergenza", target: 240, actual: 240, actualPercent: 20 },
      { key: "investimento", target: 360, actual: 360, actualPercent: 30 },
      { key: "consumo", target: 600, actual: 600, actualPercent: 50 },
    ],
  );
});

test("returns an unavailable usage percentage when monthly income is zero", () => {
  const result = buildAdminGoals([], "2026-11-11");
  assert.equal(result.monthlyMoney.income, 0);
  assert.ok(result.monthlyMoney.goals.every((goal) => goal.actualPercent === null));
});
