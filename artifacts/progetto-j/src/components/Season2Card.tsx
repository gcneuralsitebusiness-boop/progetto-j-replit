import { useEffect, useState } from "react";
import { useGetEntry } from "@workspace/api-client-react";
import { getPhotoUrl } from "@workspace/object-storage-web";
import { dailyCardBlob, makeDailyCardData, type DailyCardFormat } from "@/lib/daily-card";
import { usePageMeta } from "@/hooks/use-page-meta";

/** Season 2 uses the same saved-day renderer as the admin's persisted images. */
export function Season2Card({ numero }: { numero: number }) {
  const { data: entry, isLoading, isError } = useGetEntry(numero, { fase: 2 });
  const [format, setFormat] = useState<DailyCardFormat>("feed");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  usePageMeta({ title: `Giorno ${numero} · Stagione 2 — Progetto J`, description: "Card giornaliera della seconda stagione di Progetto J." });
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    setImage(null);
    setError(false);
    if (entry) {
      const photo = entry.cardImmagine || entry.foto;
      void dailyCardBlob(makeDailyCardData(entry, format, undefined, [], photo ? getPhotoUrl(photo) ?? photo : null))
        .then((blob) => {
          if (!active) return;
          url = URL.createObjectURL(blob);
          setImage(url);
        }).catch(() => { if (active) setError(true); });
    }
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [entry, format]);
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 pb-16 pt-28 text-[#E8E4DE]">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-[40px] text-[#3DDC84]">GIORNO {numero} · STAGIONE 2</h1>
        <div className="my-6 flex flex-wrap gap-4 text-[13px]">
          <label className="flex items-center gap-3">Formato
            <select aria-label="Formato card" value={format} onChange={(e) => setFormat(e.target.value as DailyCardFormat)} className="border border-[#E8E4DE] bg-[#0A0A0A] p-3 text-[13px]">
              <option value="feed">Feed 1080 × 1350</option><option value="story">Story 1080 × 1920</option>
            </select>
          </label>
          {image && <a href={image} download={`progetto-j-fase-2-giorno-${numero}-${format}.png`} className="border border-[#3DDC84] px-5 py-3 text-[13px]">SCARICA CARD</a>}
        </div>
        {(isError || error) && <p role="alert" className="text-[15px]">Impossibile generare la card. Riprova.</p>}
        {!isError && !error && (isLoading || !image) && <p role="status" className="text-[15px]">Generazione card…</p>}
        {image && <img src={image} alt={`GIORNO ${numero} · STAGIONE 2`} className="mx-auto block h-auto w-full max-w-[540px]" />}
      </div>
    </main>
  );
}
