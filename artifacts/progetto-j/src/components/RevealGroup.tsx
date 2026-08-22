import { Children, type ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

export function RevealGroup({
  children,
  stagger = 60,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  stagger?: number;
  direction?: "up" | "none";
  className?: string;
}) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={index} delay={Math.min(index, 8) * stagger} direction={direction}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}