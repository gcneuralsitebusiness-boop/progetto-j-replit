import type { ReactNode } from "react";

type AdminStatusProps = {
  children: ReactNode;
  tone?: "loading" | "error" | "success";
  role?: "status" | "alert";
};

const toneClasses = {
  loading: "border-border bg-card text-muted-foreground animate-pulse",
  error: "border-primary/50 bg-primary/10 text-primary",
  success: "border-green-500/50 bg-green-500/10 text-green-400",
};

export function AdminStatus({ children, tone = "loading", role }: AdminStatusProps) {
  return (
    <p role={role ?? (tone === "error" ? "alert" : "status")} className={`border px-4 py-3 font-sans text-[13px] ${toneClasses[tone]}`}>
      {children}
    </p>
  );
}

export function AdminRetry({ onRetry }: { onRetry: () => void }) {
  return (
    <button type="button" onClick={onRetry} className="mt-3 border border-primary px-4 py-2 font-sans text-[11px] uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      Riprova
    </button>
  );
}