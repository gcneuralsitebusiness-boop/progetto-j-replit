import { MONTHLY_MONEY_SHARES, WEEKLY_GOALS } from "../config/admin-goals";

export interface AdminGoalsEntry {
  data: string;
  flessioni: number | null;
  squat: number | null;
  addominali: number | null;
  shadowMinuti: number | null;
  allenamentoTecnica: boolean | null;
  allenamentoPesi: boolean | null;
  sparringFatto: boolean | null;
  pagineBibbia: number | null;
  pagineLibro: number | null;
  diarioFatto: boolean | null;
  brainstormingArticoli: boolean | null;
  dentiVolte: number | null;
  doccia: boolean | null;
  kcalColazione: number | null;
  kcalPranzo: number | null;
  kcalCena: number | null;
  km: number | null;
  videoPubblicati: number | null;
  caroselliPubblicati: number | null;
  youtubePubblicati: number | null;
  entrate: number | null;
  entrateOnline: number | null;
  fondoEmergenza: number | null;
  investimento: number | null;
  uscite: number | null;
}

function addDays(date: string, amount: number): string {
  return new Date(Date.parse(`${date}T12:00:00.000Z`) + amount * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function getRomeCalendarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: "year" | "month" | "day") => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getWeekRange(today: string): { startDate: string; endDate: string } {
  const weekday = new Date(`${today}T12:00:00.000Z`).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const startDate = addDays(today, -daysSinceMonday);
  return { startDate, endDate: addDays(startDate, 6) };
}

export function buildAdminGoals(entries: AdminGoalsEntry[], today: string) {
  const week = getWeekRange(today);
  const month = today.slice(0, 7);
  const weekEntries = entries.filter((entry) => entry.data >= week.startDate && entry.data <= week.endDate);
  const monthEntries = entries.filter((entry) => entry.data.startsWith(`${month}-`));
  const sum = (items: AdminGoalsEntry[], key: keyof AdminGoalsEntry) =>
    items.reduce((total, entry) => total + Number(entry[key] ?? 0), 0);
  const countDays = (predicate: (entry: AdminGoalsEntry) => boolean) =>
    weekEntries.filter(predicate).length;
  const goal = (key: string, label: string, done: number, target: number, unit: string) => ({
    key,
    label,
    done,
    target,
    unit,
    met: done >= target,
  });

  const weeklyGoals = [
    goal("allenamentoTecnica", "Allenamento tecnica", countDays((entry) => entry.allenamentoTecnica === true), WEEKLY_GOALS.allenamentoTecnica, "sessioni"),
    goal("allenamentoPesi", "Allenamento pesi", countDays((entry) => entry.allenamentoPesi === true), WEEKLY_GOALS.allenamentoPesi, "sessioni"),
    goal("sparringFatto", "Sparring", countDays((entry) => entry.sparringFatto === true), WEEKLY_GOALS.sparringFatto, "sessioni"),
    goal(
      "weekendKm",
      "Km sabato + domenica",
      weekEntries
        .filter((entry) => [0, 6].includes(new Date(`${entry.data}T12:00:00.000Z`).getUTCDay()))
        .reduce((total, entry) => total + Number(entry.km ?? 0), 0),
      WEEKLY_GOALS.weekendKm,
      "km",
    ),
    goal("warmupDays", "Riscaldamento completo", countDays((entry) =>
      Number(entry.flessioni ?? -1) >= WEEKLY_GOALS.daily.flessioni
      && Number(entry.squat ?? -1) >= WEEKLY_GOALS.daily.squat
      && Number(entry.addominali ?? -1) >= WEEKLY_GOALS.daily.addominali
      && Number(entry.shadowMinuti ?? -1) >= WEEKLY_GOALS.daily.shadowMinuti,
    ), WEEKLY_GOALS.warmupDays, "giorni"),
    goal("pagineBibbiaDays", "Lettura Bibbia", countDays((entry) => Number(entry.pagineBibbia ?? -1) >= WEEKLY_GOALS.daily.pagineBibbia), WEEKLY_GOALS.pagineBibbiaDays, "giorni"),
    goal("pagineLibroDays", "Lettura libro", countDays((entry) => Number(entry.pagineLibro ?? -1) >= WEEKLY_GOALS.daily.pagineLibro), WEEKLY_GOALS.pagineLibroDays, "giorni"),
    goal("diarioDays", "Diario completato", countDays((entry) => entry.diarioFatto === true), WEEKLY_GOALS.diarioDays, "giorni"),
    goal("brainstormingArticoli", "Brainstorming articoli", countDays((entry) => entry.brainstormingArticoli === true), WEEKLY_GOALS.brainstormingArticoli, "sessioni"),
    goal("dentiDays", "Denti · 3 volte", countDays((entry) => Number(entry.dentiVolte ?? -1) >= WEEKLY_GOALS.daily.dentiVolte), WEEKLY_GOALS.dentiDays, "giorni"),
    goal("docciaDays", "Doccia", countDays((entry) => entry.doccia === true), WEEKLY_GOALS.docciaDays, "giorni"),
    goal("mealsLoggedDays", "Tre pasti registrati", countDays((entry) =>
      entry.kcalColazione != null && entry.kcalPranzo != null && entry.kcalCena != null,
    ), WEEKLY_GOALS.mealsLoggedDays, "giorni"),
    goal("videoPubblicati", "Video pubblicati", sum(weekEntries, "videoPubblicati"), WEEKLY_GOALS.videoPubblicati, "video"),
    goal("caroselliPubblicati", "Caroselli pubblicati", sum(weekEntries, "caroselliPubblicati"), WEEKLY_GOALS.caroselliPubblicati, "caroselli"),
    goal("youtubePubblicati", "Video YouTube", sum(weekEntries, "youtubePubblicati"), WEEKLY_GOALS.youtubePubblicati, "video"),
  ];

  const income = Number((sum(monthEntries, "entrate") + sum(monthEntries, "entrateOnline")).toFixed(2));
  const moneyGoal = (key: keyof typeof MONTHLY_MONEY_SHARES, label: string, actual: number) => {
    const share = MONTHLY_MONEY_SHARES[key];
    const normalizedActual = Number(actual.toFixed(2));
    return {
      key,
      label,
      share,
      income,
      target: Number((income * share).toFixed(2)),
      actual: normalizedActual,
      actualPercent: income > 0 ? Number(((normalizedActual / income) * 100).toFixed(1)) : null,
    };
  };

  return {
    week: {
      startDate: week.startDate,
      endDate: week.endDate,
      goals: weeklyGoals,
    },
    monthlyMoney: {
      month,
      income,
      goals: [
        moneyGoal("fondoEmergenza", "Fondo emergenza", sum(monthEntries, "fondoEmergenza")),
        moneyGoal("investimento", "Investimento", sum(monthEntries, "investimento")),
        moneyGoal("consumo", "Consumo", sum(monthEntries, "uscite")),
      ],
    },
  };
}

export function getAdminGoalsQueryRange(today: string) {
  const { startDate, endDate } = getWeekRange(today);
  const [year, month] = today.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1, 12)).toISOString().slice(0, 10);
  const weekEndExclusive = addDays(endDate, 1);
  return {
    from: startDate < `${today.slice(0, 7)}-01` ? startDate : `${today.slice(0, 7)}-01`,
    toExclusive: weekEndExclusive > nextMonth ? weekEndExclusive : nextMonth,
    monthStart: `${today.slice(0, 7)}-01`,
  };
}
