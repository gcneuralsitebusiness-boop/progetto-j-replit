type TerminalBackdropProps = {
  intensity?: "low" | "medium";
  glow?: boolean;
};

function makeTrace(seed: number) {
  return Array.from({ length: 17 }, (_, index) => {
    const x = index * 75;
    const wave = Math.sin(index * 1.7 + seed) * 8;
    const spike = index % 7 === (seed % 7) ? -32 : 0;
    return `${x},${100 + wave + spike}`;
  }).join(" ");
}

export function TerminalBackdrop({ intensity = "low", glow = false }: TerminalBackdropProps) {
  const opacity = intensity === "medium" ? 0.07 : 0.05;
  return (
    <div className="terminal-backdrop" aria-hidden="true">
      <svg className="terminal-backdrop__grid" viewBox="0 0 240 240" preserveAspectRatio="none">
        <defs>
          <pattern id="terminal-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#F5F0E8" opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#terminal-dot-grid)" />
      </svg>
      <div className="terminal-backdrop__traces">
        {[55, 70, 90].map((duration, index) => (
          <svg key={duration} viewBox="0 0 1200 200" preserveAspectRatio="none" className={`terminal-trace terminal-trace--${index + 1}`}>
            <polyline points={makeTrace(index + 1)} stroke="#F5F0E8" strokeWidth="1" fill="none" opacity={opacity} vectorEffect="non-scaling-stroke" />
          </svg>
        ))}
      </div>
      {glow && <div className="terminal-backdrop__glow" />}
    </div>
  );
}