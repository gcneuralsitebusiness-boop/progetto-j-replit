const MEAL_FIELDS = ["kcalColazione", "kcalPranzo", "kcalCena"] as const;
const WORK_TIME_FIELDS = ["lavoroInizio", "lavoroFine"] as const;

function minutesSinceMidnight(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function applySeason2AutomaticValues(
  fase: number,
  input: Record<string, unknown>,
  current: Record<string, unknown> = {},
): Record<string, unknown> {
  if (fase !== 2) return input;
  const values = { ...input };

  const start = "lavoroInizio" in values ? values.lavoroInizio : current.lavoroInizio;
  const end = "lavoroFine" in values ? values.lavoroFine : current.lavoroFine;
  const startMinutes = minutesSinceMidnight(start);
  const endMinutes = minutesSinceMidnight(end);
  const workTimeTouched = WORK_TIME_FIELDS.some((field) => field in values);

  if (startMinutes != null && endMinutes != null) {
    const elapsedMinutes = (endMinutes - startMinutes + 1440) % 1440;
    values.oreLavoro = Number((elapsedMinutes / 60).toFixed(2));
  } else if (workTimeTouched && WORK_TIME_FIELDS.some((field) => values[field] === null)) {
    values.oreLavoro = null;
  }

  const meals = MEAL_FIELDS.map((field) => field in values ? values[field] : current[field]);
  const anyMealFilled = meals.some((value) => value != null);
  const mealFieldTouched = MEAL_FIELDS.some((field) => field in values);
  if (anyMealFilled) {
    values.kcal = meals.reduce((total, value) => total + Number(value ?? 0), 0);
  } else if (mealFieldTouched) {
    values.kcal = null;
  }

  return values;
}
