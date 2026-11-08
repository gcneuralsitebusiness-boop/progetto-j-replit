import { SEASON_2_START_DATE } from "@workspace/api-zod/seasons";

const DAY_MS = 86_400_000;

export function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function season2DayNumberForDate(value: string): number {
  return Math.floor(
    (Date.parse(`${value}T00:00:00.000Z`) - Date.parse(`${SEASON_2_START_DATE}T00:00:00.000Z`)) / DAY_MS,
  ) + 1;
}

/**
 * Season 1 dates are legacy archive values and are not remapped. The boundary
 * prevents cross-season saves; Season 2 uses a strict date-to-number mapping.
 */
export function validateSeasonDay(
  fase: number,
  numero: number,
  data: string,
  allowExistingSeason1BreakDate = false,
): string | null {
  if (fase !== 1 && fase !== 2) return "La fase deve essere 1 o 2.";
  if (!Number.isInteger(numero) || numero < 1) return "Il numero del giorno deve essere un intero positivo.";
  if (!isValidCalendarDate(data)) return "La data del giorno non è valida.";

  if (fase === 1) {
    if (numero > 180) return "La Fase 1 non può superare il giorno 180.";
    if (data >= SEASON_2_START_DATE) return "Una data della Stagione 2 non può essere salvata nell'archivio della Fase 1.";
    const lastSeason1Date = new Date(Date.parse(`${SEASON_2_START_DATE}T00:00:00.000Z`) - DAY_MS * 2)
      .toISOString().slice(0, 10);
    const breakDate = new Date(Date.parse(`${SEASON_2_START_DATE}T00:00:00.000Z`) - DAY_MS)
      .toISOString().slice(0, 10);
    if (data > lastSeason1Date && !(allowExistingSeason1BreakDate && data === breakDate)) {
      return `La Fase 1 si è conclusa il ${lastSeason1Date}; le nuove giornate devono rispettare questa data.`;
    }
    return null;
  }

  if (data < SEASON_2_START_DATE) return "La Fase 2 non può contenere date precedenti all'inizio della Stagione 2.";
  const expectedNumero = season2DayNumberForDate(data);
  if (numero !== expectedNumero) {
    return `Per la data ${data}, la Fase 2 richiede il giorno ${expectedNumero}.`;
  }
  return null;
}
