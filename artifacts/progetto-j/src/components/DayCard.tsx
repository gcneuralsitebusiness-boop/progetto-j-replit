import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { DataLabel } from "./DataLabel";
import { MilestoneBadge } from "./MilestoneBadge";
import type { EntrySummary } from "@workspace/api-client-react";
import { stripHtml } from "@/lib/strip-html";

function padDay(n: number): string {
  return n.toString().padStart(3, "0");
}

function stripDayLabel(text: string): string {
  return text.replace(/^\s*GIORNO\s+\d+\s*[—–-]?\s*[\d-]*\s*\n?/i, "").trim();
}

function firstSentence(text: string): string {
  const clean = text.trim();
  const dot = clean.indexOf(".");
  const newline = clean.indexOf("\n");
  const cut = Math.min(
    dot > 0 ? dot + 1 : clean.length,
    newline > 0 ? newline : clean.length,
    120,
  );
  return clean.slice(0, cut).trim();
}

interface DayCardProps {
  entry: EntrySummary;
  featured?: boolean;
  hookOnly?: boolean;
}

export function DayCard({ entry, featured = false, hookOnly = false }: DayCardProps) {
  const hasPhoto = Boolean(entry.foto);
  const previewText = entry.testo ? stripHtml(stripDayLabel(entry.testo)) : "";
  const displayedText = hookOnly ? firstSentence(previewText) : previewText;

  const stats: { label: string; value: number; suffix?: string; prefix?: string; income?: boolean }[] = [];
  if (entry.kcal != null) stats.push({ label: "KCAL", value: entry.kcal });
  if (entry.sonno != null) stats.push({ label: "SONNO", value: entry.sonno, suffix: "H" });
  if (entry.flessioni != null) stats.push({ label: "FLESSIONI", value: entry.flessioni });
  if (entry.addominali != null) stats.push({ label: "ADDOMINALI", value: entry.addominali });
  if (entry.round != null) stats.push({ label: "ROUND", value: entry.round });
  if (entry.km != null) stats.push({ label: "KM", value: entry.km });
  if (entry.peso != null) stats.push({ label: "PESO", value: entry.peso, suffix: "KG" });
  if (entry.battito != null) stats.push({ label: "BATTITO", value: entry.battito, suffix: "BPM" });
  if (entry.entrate != null) stats.push({ label: "ENTRATE", value: entry.entrate, prefix: "€", income: true });
  if (entry.uscite != null) stats.push({ label: "USCITE", value: entry.uscite, prefix: "€" });

  return (
    <Link href={`/giorno/${entry.numero}`} className="block">
    <article
      className={`group relative border border-border bg-card bracket-hover overflow-hidden transition-all duration-300 hover:border-primary card-lift cursor-pointer ${
        featured ? "min-h-[420px]" : ""
      }`}
    >
      {/* Photo header */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        {hasPhoto ? (
          <img
            src={getPhotoUrl(entry.foto) ?? undefined}
            alt={`Giorno ${entry.numero}`}
            className="w-full h-full object-cover grayscale-[20%] contrast-110 transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="relative h-full w-full border border-iron bg-[#0A0A0A]">
            <div className="crosshatch absolute inset-0 opacity-30" />
            <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-sans uppercase tracking-[0.2em] text-[#3A3A3A]">
              NESSUNA IMMAGINE — SOLO IL LAVORO
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-4 right-4">
          <MilestoneBadge day={entry.numero} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 relative">
        <div className="flex items-end justify-between mb-4">
          <div className="font-serif text-[64px] sm:text-[80px] md:text-[96px] leading-[0.8] text-primary bebas tracking-wide">
            GIORNO
            <br />
            {padDay(entry.numero)}
          </div>
          <div className="text-[11px] sm:text-[12px] font-sans uppercase tracking-[0.2em] text-muted-foreground text-right">
            {format(new Date(entry.data), "d MMMM yyyy", { locale: it })}
          </div>
        </div>

        <div className="h-px bg-iron/70 mb-4" />

        {/* Stats row */}
        <div className="flex flex-wrap gap-y-4 gap-x-6 mb-5">
          {stats.map((stat) => (
            <DataLabel
              key={stat.label}
              label={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              variant={stat.income ? "income" : "default"}
            />
          ))}
        </div>

        {displayedText && (
          <p className={`font-sans text-foreground/90 leading-relaxed whitespace-pre-wrap mb-4 ${
            featured ? "text-[16px] line-clamp-4" : "text-[14px] sm:text-[15px] line-clamp-3"
          }`}>
            {displayedText}
          </p>
        )}

        <div className="flex items-center gap-1 text-[10px] font-sans uppercase tracking-[0.25em] text-primary group-hover:gap-2 transition-all">
          Leggi tutto <ArrowRight size={12} />
        </div>
      </div>
    </article>
    </Link>
  );
}
