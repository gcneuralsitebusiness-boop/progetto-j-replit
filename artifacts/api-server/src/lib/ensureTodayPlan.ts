import { SEASON_2_START_DATE } from "@workspace/api-zod/seasons";

const MAX_BACKFILL_DAYS = 30;
const DAY_MS = 86_400_000;

export type DayCursor = {
  maxData: string | null;
  maxNumero: number;
};

export type PlannedDay = {
  fase: 1 | 2;
  numero: number;
  data: string;
};

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  return Math.floor(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS,
  );
}

function season2DayNumber(date: string): number {
  return daysBetween(SEASON_2_START_DATE, date) + 1;
}

export function getRomeCalendarDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(now);
}

export function planDaysToCreate(
  today: string,
  season1: DayCursor,
  season2: Pick<DayCursor, "maxData">,
): PlannedDay[] {
  if (today >= SEASON_2_START_DATE) {
    const firstDayBeforeSeason2 = addDays(SEASON_2_START_DATE, -1);
    const lastSeason2Date =
      season2.maxData && season2.maxData >= SEASON_2_START_DATE
        ? season2.maxData
        : firstDayBeforeSeason2;
    const gap = Math.max(0, daysBetween(lastSeason2Date, today));
    const daysToCreate = Math.min(gap, MAX_BACKFILL_DAYS);

    return Array.from({ length: daysToCreate }, (_, index) => {
      const data = addDays(lastSeason2Date, index + 1);
      return { fase: 2, numero: season2DayNumber(data), data };
    });
  }

  // November 6 is the one-day break before Season 2 starts on November 7.
  const lastSeason1Date = addDays(SEASON_2_START_DATE, -2);
  if (today > lastSeason1Date) return [];

  const lastDate = season1.maxData ?? today;
  const gap = Math.max(0, daysBetween(lastDate, today));
  const daysToCreate = Math.min(gap, MAX_BACKFILL_DAYS);
  const planned: PlannedDay[] = [];

  for (let offset = 1; offset <= daysToCreate; offset++) {
    const data = addDays(lastDate, offset);
    const numero = season1.maxNumero + offset;
    if (data > lastSeason1Date || numero > 180) break;
    planned.push({ fase: 1, numero, data });
  }

  return planned;
}
