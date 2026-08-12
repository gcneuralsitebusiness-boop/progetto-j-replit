import { useRef } from "react";
import { useUpload, getPhotoUrl } from "@workspace/object-storage-web";

export const CARD_TITOLO_MAX = 60;
export const CARD_SOTTOTITOLO_MAX = 24;
export const CARD_OVERLAY_MIN = 30;
export const CARD_OVERLAY_MAX = 90;
export const CARD_OVERLAY_DEFAULT = 55;

/** Nullable card customization fields. Null = use the original published value. */
export interface CardCustomization {
  cardTitolo: string | null;
  cardSottotitolo: string | null;
  cardImmagine: string | null;
  cardOverlay: number | null;
  cardMostraParole: boolean | null;
}

export const EMPTY_CUSTOMIZATION: CardCustomization = {
  cardTitolo: null,
  cardSottotitolo: null,
  cardImmagine: null,
  cardOverlay: null,
  cardMostraParole: null,
};

export function customizationFromRecord(rec: Partial<CardCustomization> | undefined | null): CardCustomization {
  return {
    cardTitolo: rec?.cardTitolo ?? null,
    cardSottotitolo: rec?.cardSottotitolo ?? null,
    cardImmagine: rec?.cardImmagine ?? null,
    cardOverlay: rec?.cardOverlay ?? null,
    cardMostraParole: rec?.cardMostraParole ?? null,
  };
}

interface CardCustomizerProps {
  value: CardCustomization;
  onChange: (patch: Partial<CardCustomization>) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
  /** Placeholder shown when the title field is empty (the original value). */
  titlePlaceholder: string;
  subtitlePlaceholder: string;
  wordToggleLabel: string;
  overlayMin?: number;
  overlayMax?: number;
  overlayDefault?: number;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-muted-foreground">{children}</span>
  );
}

function RipristinaButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] font-sans uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
    >
      Ripristina
    </button>
  );
}

export default function CardCustomizer({
  value,
  onChange,
  onSave,
  saving,
  saved,
  error,
  titlePlaceholder,
  subtitlePlaceholder,
  wordToggleLabel,
  overlayMin = CARD_OVERLAY_MIN,
  overlayMax = CARD_OVERLAY_MAX,
  overlayDefault = CARD_OVERLAY_DEFAULT,
}: CardCustomizerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, error: uploadError } = useUpload({
    onSuccess: (res) => onChange({ cardImmagine: res.objectPath }),
  });

  const overlay = value.cardOverlay ?? overlayDefault;
  const mostraParole = value.cardMostraParole ?? true;
  const imageUrl = value.cardImmagine ? getPhotoUrl(value.cardImmagine) : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  return (
    <section
      data-testid="card-customizer"
      className="w-full max-w-xl border border-border bg-card p-6 flex flex-col gap-5"
    >
      <h2 className="font-serif bebas text-[20px] tracking-[0.15em] text-foreground">PERSONALIZZA</h2>

      {/* Titolo */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel>Titolo · {(value.cardTitolo ?? "").length}/{CARD_TITOLO_MAX}</FieldLabel>
          <RipristinaButton visible={value.cardTitolo !== null} onClick={() => onChange({ cardTitolo: null })} />
        </div>
        <input
          type="text"
          maxLength={CARD_TITOLO_MAX}
          value={value.cardTitolo ?? ""}
          placeholder={titlePlaceholder}
          onChange={(e) => onChange({ cardTitolo: e.target.value === "" ? null : e.target.value })}
          className="bg-background border border-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary"
          data-testid="input-card-titolo"
        />
      </div>

      {/* Sottotitolo */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel>Sottotitolo · {(value.cardSottotitolo ?? "").length}/{CARD_SOTTOTITOLO_MAX}</FieldLabel>
          <RipristinaButton visible={value.cardSottotitolo !== null} onClick={() => onChange({ cardSottotitolo: null })} />
        </div>
        <input
          type="text"
          maxLength={CARD_SOTTOTITOLO_MAX}
          value={value.cardSottotitolo ?? ""}
          placeholder={subtitlePlaceholder}
          onChange={(e) => onChange({ cardSottotitolo: e.target.value === "" ? null : e.target.value })}
          className="bg-background border border-border px-3 py-2 text-sm font-sans text-foreground focus:outline-none focus:border-primary"
          data-testid="input-card-sottotitolo"
        />
      </div>

      {/* Immagine */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Immagine di sfondo</FieldLabel>
        <div className="flex items-center gap-4">
          {imageUrl && (
            <img src={imageUrl} alt="Anteprima immagine card" className="w-16 h-16 object-cover border border-border" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border border-border px-4 py-2 text-[11px] font-sans uppercase tracking-[0.2em] text-foreground hover:border-primary transition-colors disabled:opacity-50"
            data-testid="button-upload-card-image"
          >
            {isUploading ? "Caricamento..." : value.cardImmagine ? "Sostituisci" : "Carica immagine"}
          </button>
          {value.cardImmagine && (
            <button
              type="button"
              onClick={() => onChange({ cardImmagine: null })}
              className="text-[11px] font-sans uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors"
              data-testid="button-remove-card-image"
            >
              Rimuovi
            </button>
          )}
        </div>
        {uploadError && <p className="text-[11px] font-sans text-primary">{uploadError instanceof Error ? uploadError.message : String(uploadError)}</p>}
      </div>

      {/* Overlay */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <FieldLabel>Intensità overlay · {overlay}</FieldLabel>
          <RipristinaButton visible={value.cardOverlay !== null} onClick={() => onChange({ cardOverlay: null })} />
        </div>
        <input
          type="range"
          min={overlayMin}
          max={overlayMax}
          step={1}
          value={overlay}
          onChange={(e) => onChange({ cardOverlay: Number(e.target.value) })}
          className="accent-primary"
          data-testid="slider-card-overlay"
        />
      </div>

      {/* Mostra conteggio parole */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={mostraParole}
          onChange={(e) => onChange({ cardMostraParole: e.target.checked })}
          className="accent-primary w-4 h-4"
          data-testid="toggle-card-parole"
        />
        <FieldLabel>{wordToggleLabel}</FieldLabel>
      </label>

      {/* Save */}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-primary text-primary-foreground font-serif text-[15px] px-6 py-2.5 tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
          data-testid="button-save-card"
        >
          {saving ? "Salvataggio..." : "Salva"}
        </button>
        {saved && <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">Salvato</span>}
        {error && <span className="text-[11px] font-sans text-primary">{error}</span>}
      </div>
    </section>
  );
}
