import { stripHtml } from "@/lib/strip-html";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHTS = { feed: 1350, story: 1920 } as const;
export const DAILY_CANVAS_FORMATS = ["feed", "story"] as const;
export type DailyCanvasFormat = (typeof DAILY_CANVAS_FORMATS)[number];

export const DAILY_CANVAS_VARIANTS = ["foto", "negativo", "testo"] as const;
export type DailyCanvasVariant = (typeof DAILY_CANVAS_VARIANTS)[number];

export interface DailyCanvasCardData {
  dayNumber: number;
  remaining: number;
  date: string;
  sleepHours: number | null;
  income: number | null;
  expenses: number | null;
  friction: string | null;
  photoUrl: string | null;
  format: DailyCanvasFormat;
  variant?: DailyCanvasVariant | null;
}

export const CARD_TOKENS = {
  black: "#0A0A0A",
  red: "#B81D1D",
  ivory: "#E8E4DE",
  hero: "#F0EBE3",
  text: "#C9C4BD",
  label: "#9A958F",
  line: "#1A1A1A",
  future: "#2A2725",
} as const;

const DPR = 2;
type CanvasFont = "Bebas Neue" | "Inter" | "JetBrains Mono";

function setFont(ctx: CanvasRenderingContext2D, size: number, family: CanvasFont, weight = "400") {
  ctx.font = `${weight} ${size}px "${family}", sans-serif`;
  ctx.textBaseline = "alphabetic";
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: CanvasTextAlign = "left",
) {
  const characters = Array.from(text);
  const width = characters.reduce((total, character) => total + ctx.measureText(character).width, 0)
    + Math.max(0, characters.length - 1) * spacing;
  let cursor = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  for (const character of characters) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + spacing;
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  initialSize: number,
  family: CanvasFont,
) {
  let size = initialSize;
  while (size >= 28) {
    setFont(ctx, size, family);
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
    size *= 0.96;
  }
  setFont(ctx, 28, family);
  const lines = wrapText(ctx, text, maxWidth);
  if (lines.length <= maxLines) return { size: 28, lines };
  const kept = lines.slice(0, maxLines);
  let last = kept[kept.length - 1] ?? "";
  while (last && ctx.measureText(`${last}.`).width > maxWidth) {
    last = last.replace(/\s+\S*$/, "");
  }
  kept[kept.length - 1] = `${last.replace(/[.…]+$/, "")}.`;
  return { size: 28, lines: kept };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Immagine non disponibile: ${url}`));
    image.src = url;
  });
}

async function waitForFonts() {
  await Promise.all([
    document.fonts.load('400 780px "Bebas Neue"'),
    document.fonts.load('400 110px "Bebas Neue"'),
    document.fonts.load('400 36px "Inter"'),
    document.fonts.load('400 22px "JetBrains Mono"'),
    document.fonts.load('400 26px "JetBrains Mono"'),
  ]);
  await document.fonts.ready;
}

function clean(value: string | null | undefined) {
  return stripHtml(value ?? "").replace(/\s+/g, " ").trim();
}

function mulberry32(seed: number) {
  let value = (seed >>> 0) || 1;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
  variant: DailyCanvasVariant,
) {
  const grain = document.createElement("canvas");
  grain.width = Math.ceil(width / 4);
  grain.height = Math.ceil(height / 4);
  const grainContext = grain.getContext("2d");
  if (!grainContext) return;
  const pixels = grainContext.createImageData(grain.width, grain.height);
  const random = mulberry32(seed);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const value = Math.floor(random() * 256);
    pixels.data[index] = value;
    pixels.data[index + 1] = value;
    pixels.data[index + 2] = value;
    pixels.data[index + 3] = 255;
  }
  grainContext.putImageData(pixels, 0, 0);
  ctx.save();
  ctx.globalAlpha = variant === "negativo" ? 0.09 : 0.07;
  ctx.globalCompositeOperation = variant === "negativo" ? "multiply" : "screen";
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grain, 0, 0, width, height);
  ctx.restore();
}

function drawProcessedPhoto(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sourceContext = source.getContext("2d");
  if (!sourceContext) return;
  sourceContext.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) * 0.3,
    drawWidth,
    drawHeight,
  );
  const pixels = sourceContext.getImageData(0, 0, width, height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const luminance = pixels.data[index] * 0.299
      + pixels.data[index + 1] * 0.587
      + pixels.data[index + 2] * 0.114;
    const contrasted = (luminance - 128) * 1.1 + 128;
    const channel = Math.max(0, Math.min(255, contrasted * 0.8));
    pixels.data[index] = channel;
    pixels.data[index + 1] = channel;
    pixels.data[index + 2] = channel;
  }
  sourceContext.putImageData(pixels, 0, 0);
  ctx.drawImage(source, x, y);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  remaining: number,
  tone: "dark" | "light" = "dark",
) {
  const headerHeight = height === 1350 ? 132 : 160;
  const background = tone === "light" ? CARD_TOKENS.ivory : CARD_TOKENS.black;
  const primary = tone === "light" ? CARD_TOKENS.black : CARD_TOKENS.hero;
  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, headerHeight);
  setFont(ctx, 92, "Bebas Neue");
  ctx.fillStyle = CARD_TOKENS.red;
  ctx.textAlign = "left";
  ctx.fillText("J", 56, headerHeight / 2 + 31);
  setFont(ctx, 24, "JetBrains Mono");
  ctx.fillStyle = primary;
  drawSpacedText(ctx, "PROGETTO J", 56 + 92 + 26, headerHeight / 2 + 8, 6.72);
  setFont(ctx, 24, "JetBrains Mono");
  ctx.fillStyle = tone === "light" ? CARD_TOKENS.black : CARD_TOKENS.label;
  ctx.textAlign = "right";
  drawSpacedText(ctx, `${remaining} RIMASTI`, width - 56, headerHeight / 2 + 8, 4.8, "right");
  ctx.restore();
}

function drawPhotoVariant(
  ctx: CanvasRenderingContext2D,
  data: DailyCanvasCardData,
  width: number,
  height: number,
  image: HTMLImageElement | null,
) {
  const photoTop = height === 1350 ? 132 : 160;
  const photoHeight = height === 1350 ? 690 : 1050;
  ctx.save();
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, photoTop, width, photoHeight);
  if (image) drawProcessedPhoto(ctx, image, 0, photoTop, width, photoHeight);
  if (image) {
    const veil = ctx.createLinearGradient(0, photoTop, 0, photoTop + photoHeight);
    veil.addColorStop(0, "rgba(10,10,10,.45)");
    veil.addColorStop(0.3, "rgba(10,10,10,.15)");
    veil.addColorStop(0.6, "rgba(10,10,10,.35)");
    veil.addColorStop(1, "rgba(10,10,10,.92)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, photoTop, width, photoHeight);
  }
  setFont(ctx, height === 1350 ? 620 : 760, "Bebas Neue");
  ctx.fillStyle = CARD_TOKENS.hero;
  ctx.globalCompositeOperation = "difference";
  ctx.textAlign = "left";
  ctx.fillText(String(data.dayNumber), -14, photoTop + photoHeight + (height === 1350 ? 56 : 68));
  ctx.restore();
}

function formatSleep(value: number | null) {
  return value == null ? "—" : `${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} H`;
}

function formatEuro(value: number | null) {
  if (value == null) return "—";
  return `€\u00a0${new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function drawDataBand(ctx: CanvasRenderingContext2D, data: DailyCanvasCardData, width: number, height: number) {
  const top = height === 1350 ? 822 : 1210;
  const bandHeight = height === 1350 ? 196 : 220;
  ctx.save();
  ctx.fillStyle = CARD_TOKENS.ivory;
  ctx.fillRect(0, top, width, bandHeight);
  ctx.fillStyle = CARD_TOKENS.red;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillRect(0, top, width * 0.34, bandHeight);
  ctx.globalCompositeOperation = "source-over";
  const stats = [
    ["SONNO", formatSleep(data.sleepHours)],
    ["ENTRATE", formatEuro(data.income)],
    ["USCITE", formatEuro(data.expenses)],
  ];
  const columnWidth = (width - 112) / 3;
  stats.forEach(([label, value], index) => {
    const center = 56 + columnWidth * index + columnWidth / 2;
    if (index > 0) {
      ctx.fillStyle = "rgba(10,10,10,.16)";
      ctx.fillRect(56 + columnWidth * index, top, 1, bandHeight);
    }
    setFont(ctx, 22, "JetBrains Mono");
    ctx.fillStyle = "rgba(10,10,10,.5)";
    ctx.textAlign = "center";
    drawSpacedText(ctx, label, center, top + bandHeight / 2 - 21, 5.28, "center");
    setFont(ctx, height === 1350 ? 82 : 96, "Bebas Neue");
    ctx.fillStyle = CARD_TOKENS.black;
    ctx.fillText(value, center, top + bandHeight / 2 + 44);
  });
  ctx.restore();
}

function drawFriction(ctx: CanvasRenderingContext2D, data: DailyCanvasCardData, height: number) {
  const top = height === 1350 ? 1046 : 1470;
  const friction = clean(data.friction);
  if (!friction) return;
  const fitted = fitText(ctx, friction, 26 * 18, 3, 36, "Inter");
  setFont(ctx, fitted.size, "Inter");
  ctx.fillStyle = CARD_TOKENS.text;
  ctx.textAlign = "left";
  fitted.lines.forEach((line, index) => ctx.fillText(line, 56, top + 48 + index * fitted.size * 1.3));
}

function drawRuler(ctx: CanvasRenderingContext2D, data: DailyCanvasCardData, height: number, variant: DailyCanvasVariant) {
  const top = height === 1350 ? 1194 : 1700;
  const rulerHeight = height === 1350 ? 44 : 50;
  const start = 56;
  const end = 1024;
  const step = (end - start) / 179;
  const current = Math.max(1, Math.min(180, data.dayNumber));
  for (let index = 1; index <= 180; index += 1) {
    const isCurrent = index === current;
    const isPast = index < current;
    const tickHeight = isCurrent ? 44 : index % 10 === 0 ? 26 : 14;
    ctx.fillStyle = variant === "negativo"
      ? isCurrent ? CARD_TOKENS.black : "rgba(10,10,10,.18)"
      : isCurrent ? CARD_TOKENS.hero : isPast ? CARD_TOKENS.red : CARD_TOKENS.future;
    ctx.fillRect(start + (index - 1) * step - (isCurrent ? 2 : 1), top + rulerHeight - tickHeight, isCurrent ? 4 : 2, tickHeight);
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, width: number, height: number, variant: DailyCanvasVariant) {
  const top = height === 1350 ? 1246 : 1790;
  const footerHeight = height === 1350 ? 52 : 60;
  ctx.fillStyle = variant === "negativo" ? CARD_TOKENS.ivory : CARD_TOKENS.black;
  ctx.fillRect(0, top, width, footerHeight);
  ctx.fillStyle = variant === "negativo" ? CARD_TOKENS.black : CARD_TOKENS.red;
  ctx.fillRect(56, top + footerHeight / 2 - 2.5, 72, 5);
  setFont(ctx, 26, "JetBrains Mono");
  ctx.fillStyle = variant === "negativo" ? CARD_TOKENS.black : CARD_TOKENS.hero;
  ctx.textAlign = "right";
  drawSpacedText(ctx, "PROJECTJ180DAY.COM", width - 56, top + footerHeight / 2 + 9, 7.8, "right");
}

function numberInItalian(value: number): string {
  const units = ["", "UNO", "DUE", "TRE", "QUATTRO", "CINQUE", "SEI", "SETTE", "OTTO", "NOVE"];
  const teens = ["DIECI", "UNDICI", "DODICI", "TREDICI", "QUATTORDICI", "QUINDICI", "SEDICI", "DICIASSETTE", "DICIOTTO", "DICIANNOVE"];
  const tens = ["", "", "VENTI", "TRENTA", "QUARANTA", "CINQUANTA", "SESSANTA", "SETTANTA", "OTTANTA", "NOVANTA"];
  if (value < 10) return units[value] ?? "";
  if (value < 20) return teens[value - 10] ?? "";
  if (value < 100) {
    const ten = Math.floor(value / 10);
    const unit = value % 10;
    return `${tens[ten]}${unit === 1 || unit === 8 ? units[unit].slice(1) : units[unit]}`;
  }
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const prefix = hundreds === 1 ? "CENTO" : `${units[hundreds]}CENTO`;
  return remainder ? `${prefix}${numberInItalian(remainder)}` : prefix;
}

function drawNegativeVariant(ctx: CanvasRenderingContext2D, data: DailyCanvasCardData, width: number, height: number) {
  ctx.fillStyle = CARD_TOKENS.ivory;
  ctx.fillRect(0, 0, width, height);
  drawHeader(ctx, width, height, data.remaining, "light");
  setFont(ctx, 780, "Bebas Neue");
  ctx.fillStyle = CARD_TOKENS.black;
  ctx.textAlign = "left";
  ctx.fillText(String(data.dayNumber), -18, height === 1350 ? 774 : 1080);
  const bandTop = height === 1350 ? 596 : 790;
  const bandHeight = height === 1350 ? 176 : 190;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = CARD_TOKENS.red;
  ctx.fillRect(0, bandTop, width, bandHeight);
  ctx.restore();
  setFont(ctx, 110, "Bebas Neue");
  ctx.fillStyle = CARD_TOKENS.black;
  const phraseTop = height === 1350 ? 850 : 1080;
  ctx.fillText(`${numberInItalian(data.dayNumber)} GIORNI.`, 56, phraseTop);
  ctx.fillText("NESSUNO CANCELLATO.", 56, phraseTop + 104);
  drawRuler(ctx, data, height, "negativo");
  drawFooter(ctx, width, height, "negativo");
}

function drawTextVariant(ctx: CanvasRenderingContext2D, data: DailyCanvasCardData, width: number, height: number) {
  ctx.fillStyle = CARD_TOKENS.black;
  ctx.fillRect(0, 0, width, height);
  drawHeader(ctx, width, height, data.remaining);
  const top = height === 1350 ? 120 : 150;
  const bandTop = height === 1350 ? 700 : 930;
  const frictionTop = height === 1350 ? 760 : 990;
  setFont(ctx, 760, "Bebas Neue");
  ctx.fillStyle = "rgba(184,29,29,.22)";
  ctx.fillText(String(data.dayNumber), -21, top + 610);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = CARD_TOKENS.red;
  ctx.fillRect(0, bandTop, width * 0.44, 130);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = CARD_TOKENS.hero;
  ctx.fillText(String(data.dayNumber), -30, top + 610);
  const friction = clean(data.friction);
  if (friction) {
    const fitted = fitText(ctx, friction, 760, 3, 104, "Bebas Neue");
    setFont(ctx, fitted.size, "Bebas Neue");
    ctx.fillStyle = CARD_TOKENS.hero;
    fitted.lines.forEach((line, index) => ctx.fillText(line, 56, frictionTop + 100 + index * fitted.size * 0.96));
  }
  drawRuler(ctx, data, height, "testo");
  drawFooter(ctx, width, height, "testo");
}

function variantFor(data: DailyCanvasCardData): DailyCanvasVariant {
  if (data.variant) return data.variant;
  if (data.dayNumber % 10 === 0) return "negativo";
  if (data.photoUrl) return "foto";
  return "testo";
}

export function dailyCanvasVariant(data: DailyCanvasCardData, requested?: string | null): DailyCanvasVariant {
  if (requested === "foto" || requested === "negativo" || requested === "testo") return requested;
  return variantFor(data);
}

export function isDailyCanvasVariant(value: string | null | undefined): value is DailyCanvasVariant {
  return DAILY_CANVAS_VARIANTS.includes(value as DailyCanvasVariant);
}

export function dailyCanvasFilename(dayNumber: number, variant: DailyCanvasVariant, format: DailyCanvasFormat) {
  return `PJ-${dayNumber}-${variant}-${format === "feed" ? "4x5" : "9x16"}.png`;
}

export async function renderDailyCardCanvas(data: DailyCanvasCardData): Promise<HTMLCanvasElement> {
  await waitForFonts();
  const variant = variantFor(data);
  const width = CARD_WIDTH;
  const height = CARD_HEIGHTS[data.format];
  const canvas = document.createElement("canvas");
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponibile");
  ctx.scale(DPR, DPR);
  ctx.fillStyle = CARD_TOKENS.black;
  ctx.fillRect(0, 0, width, height);
  const image = variant === "foto" && data.photoUrl
    ? await loadImage(data.photoUrl).catch(() => null)
    : null;

  if (variant === "foto") {
    drawHeader(ctx, width, height, data.remaining);
    drawPhotoVariant(ctx, data, width, height, image);
    drawDataBand(ctx, data, width, height);
    drawFriction(ctx, data, height);
    drawRuler(ctx, data, height, variant);
    drawFooter(ctx, width, height, variant);
  } else if (variant === "negativo") {
    drawNegativeVariant(ctx, data, width, height);
  } else {
    drawTextVariant(ctx, data, width, height);
  }
  drawGrain(ctx, width, height, data.dayNumber, variant);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

export async function dailyCardCanvasDataUrl(data: DailyCanvasCardData) {
  return (await renderDailyCardCanvas(data)).toDataURL("image/png");
}

export async function downloadDailyCardCanvas(data: DailyCanvasCardData, filename?: string) {
  const variant = variantFor(data);
  const canvas = await renderDailyCardCanvas({ ...data, variant });
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Impossibile creare il PNG"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename ?? dailyCanvasFilename(data.dayNumber, variant, data.format);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}

async function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Impossibile creare il PNG"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}

/** Compatibility export for the separate legacy reel route. */
export async function downloadReelCanvasCard({
  filename,
  photoUrl,
  overlay,
  dayNumber,
  summary,
}: {
  filename: string;
  photoUrl: string | null;
  overlay: number;
  dayNumber: number;
  summary: string;
  stats: Array<{ value: string; label: string }>;
}) {
  const canvas = await renderDailyCardCanvas({
    dayNumber,
    remaining: Math.max(0, 180 - dayNumber),
    date: "",
    sleepHours: null,
    income: null,
    expenses: null,
    friction: clean(summary),
    photoUrl,
    format: "story",
    variant: photoUrl ? "foto" : "testo",
  });
  await downloadCanvas(canvas, filename);
  void overlay;
}

/** Compatibility export for the separate legacy minimal route. */
export async function downloadMinimalCanvasCard({
  filename,
  photoUrl,
  blur,
  overlay,
  dayNumber,
}: {
  filename: string;
  photoUrl: string | null;
  blur: number;
  overlay: number;
  dayNumber: number;
}) {
  await waitForFonts();
  const canvas = document.createElement("canvas");
  canvas.width = 2160;
  canvas.height = 3840;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponibile");
  ctx.scale(DPR, DPR);
  ctx.fillStyle = CARD_TOKENS.black;
  ctx.fillRect(0, 0, CARD_WIDTH, 1920);
  if (photoUrl) {
    const image = await loadImage(photoUrl).catch(() => null);
    if (image) {
      ctx.save();
      ctx.filter = `grayscale(1) blur(${Math.max(0, blur)}px)`;
      drawProcessedPhoto(ctx, image, 0, 0, CARD_WIDTH, 1920);
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, Math.max(0, overlay / 100))})`;
      ctx.fillRect(0, 0, CARD_WIDTH, 1920);
    }
  }
  setFont(ctx, 520, "Bebas Neue");
  ctx.fillStyle = CARD_TOKENS.red;
  ctx.textAlign = "center";
  ctx.fillText(String(dayNumber).padStart(3, "0"), CARD_WIDTH / 2, 1115);
  setFont(ctx, 64, "JetBrains Mono");
  ctx.fillStyle = CARD_TOKENS.label;
  drawSpacedText(ctx, "/180", CARD_WIDTH / 2, 1190, 6.4, "center");
  await downloadCanvas(canvas, filename);
}