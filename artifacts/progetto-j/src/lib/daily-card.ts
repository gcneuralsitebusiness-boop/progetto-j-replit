import { stripHtml } from "@/lib/strip-html";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHTS = { feed: 1350, story: 1920 } as const;
export const CARD_RED = "#B81D1D";

export type DailyCardFormat = keyof typeof CARD_HEIGHTS;
export const DAILY_CARD_VARIANTS = [
  "disciplina", "dati", "routine", "peso", "sonno",
  "movimento", "attrito", "fatto", "non_fatto", "diario",
  "foto", "ritratto", "contrasto", "progresso", "conto_alla_rovescia",
  "minimal", "linea", "bilancio", "energia", "sintesi",
] as const;
export type DailyCardVariant = (typeof DAILY_CARD_VARIANTS)[number];

export interface DailyCardInput {
  numero: number;
  fase?: number;
  data: string;
  testo?: string | null;
  sintesi?: string | null;
  foto?: string | null;
  cardImmagine?: string | null;
  cardTitolo?: string | null;
  cardSottotitolo?: string | null;
  cardOverlay?: number | null;
  cardMostraParole?: boolean | null;
  cardFeed?: string | null;
  cardStory?: string | null;
  attrito?: string | null;
  fatto?: string | null;
  nonFatto?: string | null;
  kcal?: number | null;
  peso?: number | null;
  sonno?: number | null;
  km?: number | null;
  battito?: number | null;
  routineCompletata?: boolean | null;
  tipoAllenamento?: string | null;
}

export interface DailyCardData {
  entry: DailyCardInput;
  format: DailyCardFormat;
  variant: DailyCardVariant;
  photoUrl?: string | null;
}

type CanvasStat = { label: string; value: string };

const WHITE = "#F4F1EC";
const MUTED = "#A5A19A";
const BLACK = "#0A0A0A";
const STORY_SAFE_TOP = 250;
const STORY_SAFE_BOTTOM = 1660;

function cleanText(value: string | null | undefined): string {
  return stripHtml(value ?? "").replace(/\s+/g, " ").trim();
}

function compact(value: string, max: number): string {
  if (value.length <= max) return value;
  const shortened = value.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${shortened.trimEnd()}…`;
}

function seededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(value: string): number {
  let output = 2166136261;
  for (const char of value) {
    output ^= char.charCodeAt(0);
    output = Math.imul(output, 16777619);
  }
  return output >>> 0;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, family: "Bebas Neue" | "Inter" | "JetBrains Mono", weight = "400") {
  ctx.font = `${weight} ${size}px "${family}", sans-serif`;
  ctx.textBaseline = "alphabetic";
}

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: CanvasTextAlign = "left") {
  const letters = Array.from(text);
  const width = letters.reduce((total, letter) => total + ctx.measureText(letter).width, 0) + Math.max(0, letters.length - 1) * spacing;
  let cursor = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
  for (const letter of letters) {
    ctx.fillText(letter, cursor, y);
    cursor += ctx.measureText(letter).width + spacing;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = compact(lines[lines.length - 1], Math.max(8, lines[lines.length - 1].length - 1));
    if (!lines[lines.length - 1].endsWith("…")) lines[lines.length - 1] += "…";
  }
  return lines;
}

async function loadImage(url?: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function ensureFonts() {
  if (!("fonts" in document)) return;
  await Promise.all([
    document.fonts.load('400 72px "Bebas Neue"'),
    document.fonts.load('400 36px "Inter"'),
    document.fonts.load('400 22px "JetBrains Mono"'),
  ]);
  await document.fonts.ready;
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, zoom = 1) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.save();
  ctx.filter = "grayscale(18%) contrast(108%)";
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  const scale = 4;
  const grain = document.createElement("canvas");
  grain.width = Math.ceil(width / scale);
  grain.height = Math.ceil(height / scale);
  const grainCtx = grain.getContext("2d");
  if (!grainCtx) return;
  const noise = grainCtx.createImageData(grain.width, grain.height);
  const random = seededRandom(seed);
  for (let index = 0; index < noise.data.length; index += 4) {
    const value = Math.floor(random() * 256);
    noise.data[index] = value;
    noise.data[index + 1] = value;
    noise.data[index + 2] = value;
    noise.data[index + 3] = 255;
  }
  grainCtx.putImageData(noise, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.075;
  ctx.globalCompositeOperation = "overlay";
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grain, 0, 0, width, height);
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, height: number) {
  const gradient = ctx.createRadialGradient(540, height * 0.45, height * 0.12, 540, height * 0.48, height * 0.82);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, height);
}

function statsFor(entry: DailyCardInput): CanvasStat[] {
  const values: CanvasStat[] = [];
  if (entry.peso != null) values.push({ label: "PESO", value: `${entry.peso.toLocaleString("it-IT", { maximumFractionDigits: 1 })} KG` });
  if (entry.sonno != null) values.push({ label: "SONNO", value: `${entry.sonno.toLocaleString("it-IT", { maximumFractionDigits: 1 })} H` });
  if (entry.km != null) values.push({ label: "KM", value: entry.km.toLocaleString("it-IT", { maximumFractionDigits: 1 }) });
  if (entry.kcal != null) values.push({ label: "KCAL", value: entry.kcal.toLocaleString("it-IT") });
  return values.slice(0, 3);
}

export function isDailyCardVariant(value: string | null | undefined): value is DailyCardVariant {
  return DAILY_CARD_VARIANTS.includes(value as DailyCardVariant);
}

export function pickVariant(entry: DailyCardInput, allEntries: DailyCardInput[] = []): DailyCardVariant {
  if (entry.fatto && entry.nonFatto) return "bilancio";
  if (entry.attrito) return "attrito";
  if (entry.fatto) return "fatto";
  if (entry.nonFatto) return "non_fatto";
  if (entry.foto && entry.numero % 5 === 0) return "foto";
  if (entry.routineCompletata || (entry.tipoAllenamento && entry.tipoAllenamento !== "NESSUNO")) return "routine";
  if (entry.peso != null) return "peso";
  if (entry.sonno != null) return "sonno";
  if (entry.km != null) return "movimento";
  const offset = allEntries.length % DAILY_CARD_VARIANTS.length;
  return DAILY_CARD_VARIANTS[(entry.numero + offset) % DAILY_CARD_VARIANTS.length];
}

export function makeDailyCardData(entry: DailyCardInput, format: DailyCardFormat, requestedVariant?: string | null, allEntries: DailyCardInput[] = [], photoUrl?: string | null): DailyCardData {
  return {
    entry,
    format,
    variant: isDailyCardVariant(requestedVariant) ? requestedVariant : pickVariant(entry, allEntries),
    photoUrl: photoUrl ?? entry.cardImmagine ?? entry.foto,
  };
}

function variantContent(input: DailyCardData): { eyebrow: string; headline: string; body: string; accent: string } {
  const { entry, variant } = input;
  const summary = cleanText(entry.cardTitolo || entry.sintesi || entry.testo);
  const fields: Record<DailyCardVariant, { eyebrow: string; headline: string; body: string }> = {
    disciplina: { eyebrow: "DISCIPLINA QUOTIDIANA", headline: `GIORNO ${String(entry.numero).padStart(3, "0")}`, body: summary || "Il lavoro continua." },
    dati: { eyebrow: "DATI DEL PERCORSO", headline: "MISURA. AGISCI. RIPETI.", body: summary },
    routine: { eyebrow: "ROUTINE COMPLETATA", headline: entry.tipoAllenamento || "PRESENTE", body: summary || "Una sessione alla volta." },
    peso: { eyebrow: "PESO", headline: entry.peso != null ? `${entry.peso.toLocaleString("it-IT", { maximumFractionDigits: 1 })} KG` : "DATO REALE", body: summary },
    sonno: { eyebrow: "RECUPERO", headline: entry.sonno != null ? `${entry.sonno.toLocaleString("it-IT", { maximumFractionDigits: 1 })} ORE` : "RIPARTIRE", body: summary },
    movimento: { eyebrow: "MOVIMENTO", headline: entry.km != null ? `${entry.km.toLocaleString("it-IT", { maximumFractionDigits: 1 })} KM` : "MUOVERSI", body: summary },
    attrito: { eyebrow: "ATTRITO", headline: "NON È STATO FACILE.", body: cleanText(entry.attrito) },
    fatto: { eyebrow: "FATTO", headline: "PORTATO A TERMINE.", body: cleanText(entry.fatto) },
    non_fatto: { eyebrow: "NON FATTO", headline: "UNA SCELTA CONSAPEVOLE.", body: cleanText(entry.nonFatto) },
    diario: { eyebrow: "DIARIO OPERATIVO", headline: "NESSUN FILTRO.", body: summary },
    foto: { eyebrow: "PROVA VISIVA", headline: "IL PERCORSO È REALE.", body: summary },
    ritratto: { eyebrow: "PROGETTO J", headline: `GIORNO ${String(entry.numero).padStart(3, "0")}`, body: summary },
    contrasto: { eyebrow: "CONTRASTO", headline: "DENTRO LA FATICA.", body: summary },
    progresso: { eyebrow: "PROGRESSO", headline: `${Math.min(100, Math.round((entry.numero / 180) * 100))}%`, body: `${entry.numero}/180 giorni documentati.` },
    conto_alla_rovescia: { eyebrow: "CONTO ALLA ROVESCIA", headline: `${Math.max(0, 180 - entry.numero)} GIORNI`, body: summary },
    minimal: { eyebrow: "PROGETTO J", headline: String(entry.numero).padStart(3, "0"), body: "" },
    linea: { eyebrow: "UNA LINEA ALLA VOLTA", headline: "CONTINUA.", body: summary },
    bilancio: { eyebrow: "BILANCIO REALE", headline: "FATTO / NON FATTO", body: `${cleanText(entry.fatto)}${entry.fatto && entry.nonFatto ? " — " : ""}${cleanText(entry.nonFatto)}` },
    energia: { eyebrow: "ENERGIA", headline: entry.kcal != null ? `${entry.kcal.toLocaleString("it-IT")} KCAL` : "COSTANZA", body: summary },
    sintesi: { eyebrow: entry.cardSottotitolo || "SINTESI DEL GIORNO", headline: "IL PUNTO È QUESTO.", body: summary },
  };
  return { ...fields[variant], accent: entry.cardSottotitolo || "PROGETTO J" };
}

export async function renderDailyCard(data: DailyCardData): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const height = CARD_HEIGHTS[data.format];
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponibile");

  const { entry, variant } = data;
  const accent = entry.fase === 2 ? "#3DDC84" : CARD_RED;
  const image = await loadImage(data.photoUrl);
  const hasImage = Boolean(image);
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, CARD_WIDTH, height);
  if (image) drawCover(ctx, image, CARD_WIDTH, height, variant === "ritratto" ? 1.12 : 1);

  const overlay = Math.min(0.92, Math.max(0.35, (entry.cardOverlay ?? 62) / 100));
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, hasImage ? `rgba(5,5,5,${Math.max(0.15, overlay - 0.32)})` : "#11110f");
  backdrop.addColorStop(0.52, hasImage ? `rgba(4,4,4,${overlay})` : "#0b0b0a");
  backdrop.addColorStop(1, "rgba(0,0,0,0.94)");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, CARD_WIDTH, height);
  drawGrain(ctx, CARD_WIDTH, height, hash(`${entry.numero}-${data.format}-${variant}`));
  drawVignette(ctx, height);

  const safeTop = data.format === "story" ? STORY_SAFE_TOP : 72;
  const safeBottom = data.format === "story" ? STORY_SAFE_BOTTOM : height - 74;
  const content = variantContent(data);
  const isMinimal = variant === "minimal";
  const centerVariant = ["minimal", "ritratto", "contrasto", "progresso", "conto_alla_rovescia"].includes(variant);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(72, safeTop, 76, 76);
  setFont(ctx, 54, "Bebas Neue");
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.fillText("J", 110, safeTop + 58);
  setFont(ctx, 18, "JetBrains Mono");
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  spacedText(ctx, entry.data, 1008, safeTop + 34, 2.8, "right");

  if (isMinimal) {
    setFont(ctx, data.format === "story" ? 520 : 410, "Bebas Neue");
    ctx.fillStyle = accent;
    ctx.textAlign = "center";
    ctx.fillText(String(entry.numero).padStart(3, "0"), 540, height * (data.format === "story" ? 0.56 : 0.58));
    setFont(ctx, 24, "JetBrains Mono");
    ctx.fillStyle = MUTED;
    spacedText(ctx, "/ 180", 540, height * (data.format === "story" ? 0.62 : 0.65), 4, "center");
  } else if (centerVariant) {
    const headlineSize = data.format === "story" ? 172 : 138;
    setFont(ctx, 22, "JetBrains Mono");
    ctx.fillStyle = accent;
    ctx.textAlign = "center";
    spacedText(ctx, content.eyebrow, 540, height * 0.43, 5.5, "center");
    setFont(ctx, headlineSize, "Bebas Neue");
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    const lines = wrap(ctx, content.headline.toUpperCase(), 880, 2);
    lines.forEach((line, index) => ctx.fillText(line, 540, height * 0.52 + index * headlineSize * 0.8));
    setFont(ctx, 30, "Inter");
    ctx.fillStyle = WHITE;
    const body = wrap(ctx, compact(content.body, 170), 720, data.format === "story" ? 4 : 3);
    body.forEach((line, index) => ctx.fillText(line, 540, height * 0.64 + index * 45));
  } else {
    const headlineSize = data.format === "story" ? 148 : 130;
    const bodySize = data.format === "story" ? 34 : 31;
    // The metric strip is a fixed safe zone, never a surface text may use.
    // This prevents long diary summaries from colliding with the stats in exports.
    const hasStats = entry.cardMostraParole !== false && statsFor(entry).length > 0;
    const contentBottom = safeBottom - (hasStats ? 185 : 78);
    setFont(ctx, 20, "JetBrains Mono");
    ctx.fillStyle = accent;
    ctx.textAlign = "left";
    spacedText(ctx, content.eyebrow, 72, contentBottom - 330, 4.2);
    setFont(ctx, headlineSize, "Bebas Neue");
    ctx.fillStyle = WHITE;
    const titleLines = wrap(ctx, content.headline.toUpperCase(), 910, 2);
    titleLines.forEach((line, index) => ctx.fillText(line, 72, contentBottom - 210 + index * headlineSize * 0.78));
    setFont(ctx, bodySize, "Inter");
    const bodyLines = wrap(ctx, compact(content.body, data.format === "story" ? 230 : 170), 820, data.format === "story" ? 4 : 3);
    ctx.fillStyle = WHITE;
    if (bodyLines.length) {
      ctx.fillRect(72, contentBottom - 74, 5, Math.max(46, bodyLines.length * 44));
      bodyLines.forEach((line, index) => ctx.fillText(line, 104, contentBottom - 38 + index * 44));
    }
  }

  if (entry.cardMostraParole !== false && !isMinimal) {
    const stats = statsFor(entry);
    if (stats.length) {
      const y = safeBottom - 8;
      ctx.strokeStyle = "rgba(244,241,236,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(72, y - 80);
      ctx.lineTo(1008, y - 80);
      ctx.stroke();
      const width = 936 / stats.length;
      stats.forEach((stat, index) => {
        const x = 72 + width * index;
        setFont(ctx, 43, "Bebas Neue");
        ctx.fillStyle = WHITE;
        ctx.textAlign = "left";
        ctx.fillText(stat.value, x, y - 28);
        setFont(ctx, 16, "JetBrains Mono");
        ctx.fillStyle = MUTED;
        spacedText(ctx, stat.label, x, y, 2.3);
      });
    }
  }

  setFont(ctx, 16, "JetBrains Mono");
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  spacedText(ctx, content.accent.toUpperCase(), 72, safeBottom + (data.format === "story" ? 54 : 0), 3.2);
  ctx.textAlign = "right";
  ctx.fillStyle = MUTED;
  spacedText(ctx, entry.fase === 2 ? `GIORNO ${entry.numero} · STAGIONE 2` : `GIORNO ${String(entry.numero).padStart(3, "0")} / 180`, 1008, safeBottom + (data.format === "story" ? 54 : 0), 2.4, "right");
  return canvas;
}

export async function dailyCardBlob(data: DailyCardData): Promise<Blob> {
  const canvas = await renderDailyCard(data);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Impossibile creare il PNG")), "image/png"));
}

export async function dailyCardDataUrl(data: DailyCardData): Promise<string> {
  return (await renderDailyCard(data)).toDataURL("image/png");
}

export async function downloadDailyCard(data: DailyCardData, filename?: string): Promise<void> {
  const blob = await dailyCardBlob(data);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `progetto-j-giorno-${String(data.entry.numero).padStart(3, "0")}-${data.format}.png`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}