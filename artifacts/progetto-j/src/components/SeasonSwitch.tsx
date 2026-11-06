import type { SeasonNumber } from "@/lib/use-selected-season";

export function SeasonSwitch({
  value,
  onChange,
}: {
  value: SeasonNumber;
  onChange: (season: SeasonNumber) => void;
}) {
  return (
    <div className="season-home__switch" role="group" aria-label="Seleziona stagione">
      {[1, 2].map((season) => (
        <button
          key={season}
          type="button"
          aria-pressed={value === season}
          data-season={season}
          data-testid={`button-season-${season}`}
          onClick={() => onChange(season as SeasonNumber)}
        >
          STAGIONE {season}
        </button>
      ))}
    </div>
  );
}
