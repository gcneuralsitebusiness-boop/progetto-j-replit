import { useReveal } from "@/lib/use-reveal";

export function Grid180({ completedDays, totalDays = 180 }: { completedDays: number; totalDays?: number }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const completed = Math.max(0, Math.min(completedDays, totalDays));
  const currentIndex = completed > 0 ? completed - 1 : 0;

  return (
    <div ref={ref} className={`grid-180${isVisible ? " grid-180--visible" : ""}`} aria-label={`${completed} giorni completati su ${totalDays}`}>
      {Array.from({ length: totalDays }, (_, index) => {
        const isCompleted = index < completed;
        const isCurrent = index === currentIndex;
        return (
          <span
            key={index}
            className={`grid-180__cell ${isCompleted ? "grid-180__cell--completed" : "grid-180__cell--future"}${isCurrent ? " grid-180__cell--current" : ""}`}
            style={{ transitionDelay: `${index * 8}ms` }}
            title={`Giorno ${index + 1}`}
          />
        );
      })}
    </div>
  );
}