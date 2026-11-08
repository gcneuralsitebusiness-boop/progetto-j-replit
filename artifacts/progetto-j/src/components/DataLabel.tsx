interface DataLabelProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  variant?: "default" | "income" | "bronze" | "primary";
}

export function DataLabel({ label, value, suffix = "", prefix = "", variant = "default" }: DataLabelProps) {
  const valueClasses = {
    default: "text-foreground",
    income: "text-money",
    bronze: "text-[hsl(var(--bronze))]",
    primary: "text-primary",
  };

  return (
    <div className="flex flex-col min-w-[70px]">
      <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-muted-foreground mb-1">{label}</span>
      <span className={`measured text-[15px] sm:text-[16px] font-semibold tabular ${valueClasses[variant]}`}>
        {prefix}
        {value}
        {suffix}
      </span>
    </div>
  );
}
