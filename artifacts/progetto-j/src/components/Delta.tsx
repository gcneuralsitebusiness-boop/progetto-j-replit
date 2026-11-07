type DeltaProps = {
  previous: number;
  current: number;
};

export function Delta({ previous, current }: DeltaProps) {
  const change = current - previous;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const percentage = previous === 0
    ? change === 0 ? 0 : null
    : (change / Math.abs(previous)) * 100;
  const formatted = percentage == null
    ? change > 0 ? "+∞%" : "−∞%"
    : `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(percentage).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`;
  const spokenDirection = direction === "up" ? "aumento" : direction === "down" ? "diminuzione" : "nessuna variazione";

  return (
    <span
      className={`delta delta--${direction}`}
      aria-label={`${spokenDirection}: ${formatted}`}
      title={`${spokenDirection}: ${formatted}`}
    >
      <span className="delta__triangle" aria-hidden="true" />
      <span className="delta__value">{formatted}</span>
    </span>
  );
}
