import { useRef, useState } from "react";
import { containsDiaryHtml, sanitizeDiaryHtml } from "@/lib/diary-html";

type DiaryHtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const TOOLBAR_ACTIONS = [
  { label: "H1", tag: "h1", fallback: "Titolo principale" },
  { label: "H2", tag: "h2", fallback: "Titolo della sezione" },
  { label: "H3", tag: "h3", fallback: "Sottotitolo" },
  { label: "P", tag: "p", fallback: "Scrivi il paragrafo…" },
  { label: "B", tag: "strong", fallback: "testo in evidenza" },
  { label: "I", tag: "em", fallback: "testo in corsivo" },
] as const;

export function DiaryHtmlEditor({ value, onChange }: DiaryHtmlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"code" | "preview">("code");

  const insertTag = (tag: (typeof TOOLBAR_ACTIONS)[number]["tag"]) => {
    const action = TOOLBAR_ACTIONS.find((item) => item.tag === tag);
    if (!action) return;

    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const selected = value.slice(start, end);
    const content = selected || action.fallback;
    const opening = `<${tag}>`;
    const closing = `</${tag}>`;
    const replacement = `${opening}${content}${closing}`;
    const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const contentStart = start + opening.length;
      textareaRef.current?.setSelectionRange(contentStart, contentStart + content.length);
    });
  };

  const insertBreak = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? start;
    const replacement = "<br>";
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const cursor = start + replacement.length;
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const previewHtml = containsDiaryHtml(value) ? sanitizeDiaryHtml(value) : "";

  return (
    <div className="border border-border bg-[#101010]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Strumenti HTML diario">
          {TOOLBAR_ACTIONS.map(({ label, tag }) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertTag(tag)}
              className="min-h-8 min-w-8 border border-[#333] px-2 font-mono text-[11px] text-[#E8E4DE] transition-colors hover:border-primary hover:text-primary"
              aria-label={`Inserisci ${label}`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={insertBreak}
            className="min-h-8 border border-[#333] px-2 font-mono text-[11px] text-[#E8E4DE] transition-colors hover:border-primary hover:text-primary"
          >
            BR
          </button>
        </div>
        <div className="flex border border-[#333]" role="tablist" aria-label="Modalità editor diario">
          {([
            ["code", "HTML"],
            ["preview", "ANTEPRIMA"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={`min-h-8 px-2 font-mono text-[10px] tracking-wider ${mode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "code" ? (
        <textarea
          ref={textareaRef}
          rows={18}
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={"<h2>Titolo della sezione</h2>\n<p>Testo del diario...</p>"}
          aria-label="Testo HTML del diario"
          className="min-h-[280px] w-full resize-y border-0 bg-[#141414] p-3 text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[13px] leading-relaxed"
        />
      ) : (
        <div className="diary-html min-h-[280px] border-l-2 border-iron bg-[#0B0B0B] p-5">
          {previewHtml ? (
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          ) : (
            <p className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-muted-foreground">
              {value || "L’anteprima apparirà qui. Seleziona HTML per usare titoli e formattazione."}
            </p>
          )}
        </div>
      )}

      <p className="border-t border-border px-3 py-2 font-sans text-[10px] leading-relaxed text-muted-foreground">
        Tag disponibili: H1, H2, H3, P, BR, STRONG, EM. L’anteprima filtra il markup; il salvataggio conserva il testo HTML originale.
      </p>
    </div>
  );
}