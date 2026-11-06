export { SEASON_2_START_DATE } from "@workspace/api-zod/seasons";

export type Fase = 1 | 2;
export const seasonParams = (fase: number) => fase === 2 ? { fase: 2 as const } : undefined;
export const dayPath = (numero: number, fase = 1) => `${fase === 2 ? "/fase-2" : ""}/giorno/${numero}`;
export const cardSeasonQuery = (fase = 1) => fase === 2 ? "?fase=2" : "";
/** A stored SQL date is a calendar day, not UTC midnight. Keep legacy rendering unchanged. */
export const calendarDayDate = (data: string, fase = 1) =>
  new Date(fase === 2 ? `${data}T12:00:00` : data);
