import { useEffect, useState } from "react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import {
  dailyCardDataUrl,
  makeDailyCardData,
  type DailyCardFormat,
  type DailyCardInput,
  type DailyCardVariant,
} from "@/lib/daily-card";

export function DailyCardPreview({
  entry,
  format = "feed",
  variant,
  className,
}: {
  entry: DailyCardInput;
  format?: DailyCardFormat;
  variant?: DailyCardVariant | null;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const photoPath = entry.cardImmagine || entry.foto;
  const photoUrl = photoPath ? (getPhotoUrl(photoPath) ?? photoPath) : null;

  useEffect(() => {
    let active = true;
    setFailed(false);
    dailyCardDataUrl(makeDailyCardData(entry, format, variant, [], photoUrl))
      .then((next) => { if (active) setSrc(next); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [entry, format, variant, photoUrl]);

  if (failed) {
    return <div className={`bg-[#0A0A0A] border border-border text-[10px] font-mono text-muted-foreground flex items-center justify-center ${className ?? ""}`}>ANTEPRIMA NON DISPONIBILE</div>;
  }

  return (
    <div className={`overflow-hidden bg-[#0A0A0A] ${className ?? ""}`}>
      {src ? <img src={src} alt={`Card del giorno ${entry.numero}`} className="block w-full h-full object-cover" /> : <div className="h-full animate-pulse bg-[#141414]" />}
    </div>
  );
}