import { stripHtml } from "@/lib/strip-html";

export const TOKENS = {
  black: "#0A0A0A",
  red: "#B81D1D",
  bronze: "#8B6914",
  text: "#E8E4DE",
  hero: "#F0EBE3",
  line: "#1A1A1A",
  muted: "#7E7A75",
  grain: "#8E8A85",
  spine: "#4E4A46",
  grid: "#3A3A3A",
} as const;

const BLACK = TOKENS.black;
const RED = TOKENS.red;
const WHITE = TOKENS.text;
const GREY = "#6E6A65";
const DARK_GREY = "#4A4744";

type CanvasFont = "Bebas Neue" | "Inter" | "JetBrains Mono" | "Arial";

export interface CanvasStat {
  value: string;
  label: string;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, family: CanvasFont, weight = "400") {
  ctx.font = `${weight} ${size}px "${family}"`;
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
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
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

async function waitForCanvasFonts() {
  await document.fonts.load('400 660px "Bebas Neue"');
  await document.fonts.load('400 34px "Inter"');
  await document.fonts.load('400 16px "JetBrains Mono"');
  await document.fonts.load('700 34px "JetBrains Mono"');
  await document.fonts.ready;
}

function prepareCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D non disponibile");
  context.fillStyle = BLACK;
  context.fillRect(0, 0, width, height);
  return { canvas, context };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  scale = 1,
  filter = "none",
) {
  const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * coverScale;
  const drawHeight = image.naturalHeight * coverScale;
  ctx.save();
  ctx.filter = filter;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const grainCanvas = document.createElement("canvas");
  const grainWidth = Math.ceil(width / 4);
  const grainHeight = Math.ceil(height / 4);
  grainCanvas.width = grainWidth;
  grainCanvas.height = grainHeight;
  const grainContext = grainCanvas.getContext("2d");
  if (!grainContext) return;

  const noise = grainContext.createImageData(grainWidth, grainHeight);
  // The legacy reel renderer keeps a stable grain too: exports must be repeatable.
  let seed = (width * 73856093 + height * 19349663) >>> 0;
  for (let index = 0; index < noise.data.length; index += 4) {
    seed = (Math.imul(seed ^ (seed >>> 15), 2246822519) + 3266489917) >>> 0;
    const value = seed & 255;
    noise.data[index] = value;
    noise.data[index + 1] = value;
    noise.data[index + 2] = value;
    noise.data[index + 3] = 255;
  }
  grainContext.putImageData(noise, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "overlay";
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grainCanvas, 0, 0, width, height);
  ctx.restore();
}

function drawCardEkg(ctx: CanvasRenderingContext2D, centerY: number) {
  const points = [
    [0, 20], [180, 20], [220, 20], [240, 5], [260, 35], [280, 10],
    [300, 30], [320, 20], [500, 20], [540, 20], [560, 5], [580, 35],
    [600, 10], [620, 30], [640, 20], [900, 20],
  ];
  const scaleX = 936 / 900;

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const canvasX = 72 + x * scaleX;
    const canvasY = centerY + y - 20;
    if (index === 0) ctx.moveTo(canvasX, canvasY);
    else ctx.lineTo(canvasX, canvasY);
  });
  ctx.stroke();
  ctx.restore();
}

function drawCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
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

async function loadOptionalImage(url: string | null) {
  return url ? loadImage(url) : null;
}

export const DAILY_CANVAS_FORMATS = ["feed", "story"] as const;
export type DailyCanvasFormat = (typeof DAILY_CANVAS_FORMATS)[number];

export const DAILY_CANVAS_VARIANTS = ["fuori-squadra", "sovrastampa", "campo-dati"] as const;
export type DailyCanvasVariant = (typeof DAILY_CANVAS_VARIANTS)[number];

export interface DailyCanvasCardInput {
  dayNumber: number;
  dateLabel: string;
  attrito: string | null | undefined;
  summary: string | null | undefined;
  photoUrl: string | null;
  subtitle?: string | null;
  overlay?: number | null;
  showWords?: boolean | null;
  wordCount?: number | null;
}

export interface DailyCanvasCardData extends DailyCanvasCardInput {
  format: DailyCanvasFormat;
  variant?: DailyCanvasVariant | null;
}

const DAILY_CARD_WIDTH = 1080;
const DAILY_CARD_HEIGHTS: Record<DailyCanvasFormat, number> = { feed: 1350, story: 1920 };
const DAILY_CARD_DPR = 2;
let dailyGrainCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function cleanCanvasText(value: string | null | undefined) {
  return stripHtml(value ?? "").replace(/\s+/g, " ").trim();
}

export function dailyCanvasVariant(data: DailyCanvasCardInput, requested?: string | null): DailyCanvasVariant {
  if (requested === "fuori-squadra" || requested === "sovrastampa" || requested === "campo-dati") return requested;
  if (data.dayNumber % 10 === 0) return "campo-dati";
  return data.dayNumber % 2 === 0 ? "fuori-squadra" : "sovrastampa";
}

export function isDailyCanvasVariant(value: string | null | undefined): value is DailyCanvasVariant {
  return DAILY_CANVAS_VARIANTS.includes(value as DailyCanvasVariant);
}

export function dailyCanvasFilename(dayNumber: number, variant: DailyCanvasVariant, format: DailyCanvasFormat) {
  const formatLabel = format === "feed" ? "4x5" : "9x16";
  return `PJ-${String(dayNumber).padStart(3, "0")}-${variant}-${formatLabel}.png`;
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

function drawDailyGrain(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  const grainWidth = Math.ceil(width / 4);
  const grainHeight = Math.ceil(height / 4);
  const key = `${grainWidth}x${grainHeight}:${seed}`;
  if (!dailyGrainCache || dailyGrainCache.key !== key) {
    const canvas = document.createElement("canvas");
    canvas.width = grainWidth;
    canvas.height = grainHeight;
    const grainContext = canvas.getContext("2d");
    if (!grainContext) return;
    const noise = grainContext.createImageData(grainWidth, grainHeight);
    const random = mulberry32(seed);
    for (let index = 0; index < noise.data.length; index += 4) {
      const channel = Math.floor(random() * 256);
      noise.data[index] = channel;
      noise.data[index + 1] = channel;
      noise.data[index + 2] = channel;
      noise.data[index + 3] = 255;
    }
    grainContext.putImageData(noise, 0, 0);
    dailyGrainCache = { key, canvas };
  }
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "screen";
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(dailyGrainCache.canvas, 0, 0, width, height);
  ctx.restore();
}

function drawDataField(ctx: CanvasRenderingContext2D, width: number, height: number, dayNumber: number) {
  const columns = 12;
  const rows = 15;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const current = Math.min(180, Math.max(1, dayNumber));
  ctx.save();
  ctx.globalAlpha = 0.075;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column + 1;
      if (index < current) {
        ctx.fillStyle = TOKENS.grain;
        ctx.fillRect(column * cellWidth, row * cellHeight, cellWidth, cellHeight);
      } else if (index === current) {
        ctx.fillStyle = TOKENS.red;
        ctx.fillRect(column * cellWidth, row * cellHeight, cellWidth, cellHeight);
      }
      ctx.strokeStyle = TOKENS.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(column * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
  }
  ctx.restore();
}

function drawEdgeDensity(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const horizontal = ctx.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, "rgba(0,0,0,.50)");
  horizontal.addColorStop(0.09, "rgba(0,0,0,0)");
  horizontal.addColorStop(0.91, "rgba(0,0,0,0)");
  horizontal.addColorStop(1, "rgba(0,0,0,.38)");
  ctx.fillStyle = horizontal;
  ctx.fillRect(0, 0, width, height);

  const vertical = ctx.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, "rgba(0,0,0,.30)");
  vertical.addColorStop(0.07, "rgba(0,0,0,0)");
  vertical.addColorStop(0.93, "rgba(0,0,0,0)");
  vertical.addColorStop(1, "rgba(0,0,0,.50)");
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, width, height);
}

function drawFold(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const y = height * 0.41;
  ctx.strokeStyle = "rgba(255,255,255,.045)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y + 2);
  ctx.lineTo(width, y + 2);
  ctx.stroke();
  const gradient = ctx.createLinearGradient(0, y + 3, 0, y + 83);
  gradient.addColorStop(0, "rgba(0,0,0,.16)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y + 3, width, 80);
}

function drawRuler(ctx: CanvasRenderingContext2D, width: number, height: number, dayNumber: number) {
  const start = 56;
  const end = width - 56;
  const gap = 1;
  const tickWidth = (end - start - gap * 179) / 180;
  const current = Math.min(180, Math.max(1, dayNumber));
  ctx.save();
  for (let index = 1; index <= 180; index += 1) {
    const x = start + (index - 1) * (tickWidth + gap);
    const isTenth = index % 10 === 0;
    const tickHeight = index === current ? 22 : index < current ? 9 : 5;
    ctx.fillStyle = index === current ? TOKENS.red : index < current ? TOKENS.grain : "#242424";
    ctx.fillRect(x, height - 10 - tickHeight, tickWidth, tickHeight + (isTenth ? 4 : 0));
  }
  ctx.restore();
}

function drawSpine(ctx: CanvasRenderingContext2D, width: number, height: number, dayNumber: number) {
  ctx.save();
  ctx.translate(width - 20, height / 2);
  ctx.rotate(-Math.PI / 2);
  setFont(ctx, 14, "JetBrains Mono");
  ctx.fillStyle = TOKENS.spine;
  ctx.textAlign = "center";
  drawSpacedText(ctx, `PJ/${String(dayNumber).padStart(3, "0")}/180 · REGISTRO GIORNALIERO · REV.0`, 0, 0, 5.88, "center");
  ctx.restore();
}

function wrapDailyText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (ctx.measureText(word).width > maxWidth) {
      if (line) {
        lines.push(line);
        line = "";
      }
      let chunk = "";
      for (const character of word) {
        const candidate = `${chunk}${character}`;
        if (chunk && ctx.measureText(candidate).width > maxWidth) {
          lines.push(chunk);
          chunk = character;
        } else {
          chunk = candidate;
        }
      }
      line = chunk;
      continue;
    }
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitAttrito(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number, initialSize: number) {
  const minimum = initialSize * 0.6;
  let size = initialSize;
  while (size >= minimum) {
    setFont(ctx, size, "Bebas Neue");
    const lines = wrapDailyText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines, truncated: false };
    size *= 0.96;
  }

  setFont(ctx, minimum, "Bebas Neue");
  const lines = wrapDailyText(ctx, text, maxWidth);
  if (lines.length <= maxLines) return { size: minimum, lines, truncated: false };
  const kept = lines.slice(0, maxLines);
  let last = kept[kept.length - 1] ?? "";
  const omitted = lines.slice(maxLines).join(" ");
  while (last && ctx.measureText(`${last}.`).width > maxWidth) last = last.replace(/\s+\S*$/, "");
  kept[kept.length - 1] = `${last.replace(/[.…]+$/, "")}.`;
  return { size: minimum, lines: kept, truncated: Boolean(omitted) };
}

function drawAttritoLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  firstBaseline: number,
  lineHeight: number,
  size: number,
  splitColor = true,
  primaryColor: string = TOKENS.hero,
) {
  setFont(ctx, size, "Bebas Neue");
  let afterFirstPeriod = false;
  lines.forEach((line, index) => {
    const baseline = firstBaseline + index * lineHeight;
    ctx.textAlign = "left";
    if (afterFirstPeriod && splitColor) {
      ctx.fillStyle = TOKENS.red;
      ctx.fillText(line, x, baseline);
      return;
    }
    const split = splitColor ? line.indexOf(".") : -1;
    ctx.fillStyle = primaryColor;
    ctx.fillText(line, x, baseline);
    if (split >= 0 && split < line.length - 1) {
      const prefix = line.slice(0, split + 1);
      ctx.fillStyle = TOKENS.red;
      ctx.fillText(line.slice(split + 1), x + ctx.measureText(prefix).width, baseline);
      afterFirstPeriod = true;
    } else if (split >= 0) {
      afterFirstPeriod = true;
    }
  });
}

function drawDailyHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  variant: DailyCanvasVariant,
  dayNumber: number,
  dateLabel: string,
  subtitle: string,
  showWords: boolean,
  wordCount: number,
) {
  setFont(ctx, 78, "Bebas Neue");
  ctx.fillStyle = TOKENS.red;
  ctx.textAlign = "left";
  ctx.fillText("J", 56, 112);

  setFont(ctx, 12, "JetBrains Mono");
  ctx.fillStyle = TOKENS.muted;
  drawSpacedText(ctx, subtitle || "PROGETTO J", 56, 142, 2.16);
  if (showWords) {
    setFont(ctx, 11, "JetBrains Mono");
    ctx.fillStyle = TOKENS.bronze;
    drawSpacedText(ctx, `${wordCount} PAROLE`, 56, 168, 1.65);
  }

  setFont(ctx, 13, "JetBrains Mono");
  ctx.fillStyle = TOKENS.muted;
  ctx.textAlign = "right";
  drawSpacedText(ctx, variant.toUpperCase(), width - 56, 66, 2.08, "right");
  setFont(ctx, 34, "JetBrains Mono", "700");
  ctx.fillStyle = TOKENS.text;
  ctx.fillText(String(dayNumber).padStart(3, "0"), width - 56, 103);
  setFont(ctx, 13, "JetBrains Mono");
  ctx.fillStyle = TOKENS.muted;
  ctx.fillText(dateLabel, width - 56, 130);
}

function drawDailyFooter(ctx: CanvasRenderingContext2D, height: number) {
  setFont(ctx, 15, "JetBrains Mono");
  ctx.fillStyle = TOKENS.muted;
  ctx.textAlign = "left";
  drawSpacedText(ctx, "PROJECTJ180DAY.COM", 56, height - 88, 3.6);
}

function drawDailySummary(ctx: CanvasRenderingContext2D, summary: string, x: number, y: number, maxWidth: number, maxLines = 3) {
  if (!summary) return;
  let size = 30;
  let lines: string[] = [];
  while (size >= 18) {
    setFont(ctx, size, "Inter");
    lines = wrapDailyText(ctx, summary, maxWidth);
    if (lines.length <= maxLines) break;
    size -= 1;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[lines.length - 1] ?? "";
    while (last && ctx.measureText(`${last}.`).width > maxWidth) last = last.replace(/\s+\S*$/, "");
    lines[lines.length - 1] = `${last.replace(/[.…]+$/, "")}.`;
  }
  ctx.fillStyle = "#9A958F";
  ctx.textAlign = "left";
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * size * 1.5));
}

function drawOutsideTeam(ctx: CanvasRenderingContext2D, width: number, height: number, attrito: string) {
  const number = String(Math.round(Number(ctx.canvas.dataset.day ?? "0"))).padStart(3, "0");
  const baseline = height - 300;
  setFont(ctx, 660, "Bebas Neue");
  ctx.textAlign = "left";
  ctx.fillStyle = TOKENS.red;
  ctx.globalAlpha = 0.2;
  drawSpacedText(ctx, number, -31, baseline + 5, -36.3);
  ctx.globalAlpha = 1;
  ctx.fillStyle = TOKENS.hero;
  drawSpacedText(ctx, number, -38, baseline, -36.3);

  const fitted = fitAttrito(ctx, attrito, width - 112, 2, 62);
  drawAttritoLines(ctx, fitted.lines, 56, height - 170 - (fitted.lines.length - 1) * 63, 63, fitted.size);
}

function drawOverprint(ctx: CanvasRenderingContext2D, width: number, height: number, attrito: string, summary: string) {
  const fitted = fitAttrito(ctx, attrito, width - 112, 3, 196);
  const lineHeight = fitted.size * 0.86;
  const firstBaseline = 300;
  const bandLineY = firstBaseline + Math.min(1, Math.max(0, fitted.lines.length - 1)) * lineHeight;
  drawAttritoLines(ctx, fitted.lines, 56, firstBaseline, lineHeight, fitted.size);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = TOKENS.red;
  ctx.fillRect(0, bandLineY - 86, 760, 96);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0, bandLineY - 86, 760, 96);
  ctx.restore();
  drawDailySummary(ctx, summary, 56, Math.min(height - 270, firstBaseline + fitted.lines.length * lineHeight + 100), width * 0.8);
}

function drawDataFieldCard(ctx: CanvasRenderingContext2D, width: number, height: number, dayNumber: number, attrito: string) {
  const centerY = height * 0.46;
  setFont(ctx, 300, "Bebas Neue");
  ctx.fillStyle = TOKENS.hero;
  ctx.textAlign = "center";
  drawSpacedText(ctx, String(dayNumber).padStart(3, "0"), width / 2, centerY, -12, "center");
  setFont(ctx, 16, "JetBrains Mono");
  ctx.fillStyle = TOKENS.muted;
  drawSpacedText(ctx, "GIORNI PUBBLICI · NESSUNO CANCELLATO", width / 2, centerY + 54, 4.8, "center");
  ctx.fillStyle = TOKENS.red;
  ctx.fillRect(64, centerY + 96, width - 128, 2);
  const fitted = fitAttrito(ctx, attrito, width - 128, 3, 58);
  drawAttritoLines(ctx, fitted.lines, 64, centerY + 178, 61, fitted.size, false, TOKENS.text);
}

function dailyCanvasInput(data: DailyCanvasCardData) {
  const variant = dailyCanvasVariant(data, data.variant);
  return {
    ...data,
    variant,
    attrito: cleanCanvasText(data.attrito) || "NESSUN ATTRITO REGISTRATO.",
    summary: cleanCanvasText(data.summary),
    subtitle: cleanCanvasText(data.subtitle),
    overlay: Math.min(90, Math.max(30, data.overlay ?? 55)),
    showWords: data.showWords !== false,
    wordCount: Math.max(0, Math.round(data.wordCount ?? 0)),
  };
}

export async function renderDailyCardCanvas(data: DailyCanvasCardData): Promise<HTMLCanvasElement> {
  await waitForCanvasFonts();
  const input = dailyCanvasInput(data);
  const width = DAILY_CARD_WIDTH;
  const height = DAILY_CARD_HEIGHTS[input.format];
  const working = document.createElement("canvas");
  working.width = width * DAILY_CARD_DPR;
  working.height = height * DAILY_CARD_DPR;
  working.dataset.day = String(input.dayNumber);
  const ctx = working.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponibile");
  ctx.scale(DAILY_CARD_DPR, DAILY_CARD_DPR);
  ctx.fillStyle = TOKENS.black;
  ctx.fillRect(0, 0, width, height);
  const image = await loadOptionalImage(input.photoUrl).catch(() => null);
  if (image) drawCover(ctx, image, width, height, 1, "grayscale(18%) contrast(106%)");
  const overlay = input.overlay / 100;
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, image ? `rgba(0,0,0,${overlay * 0.65})` : TOKENS.black);
  backdrop.addColorStop(0.58, image ? `rgba(0,0,0,${overlay})` : "#11110F");
  backdrop.addColorStop(1, image ? `rgba(0,0,0,${Math.min(0.96, overlay + 0.24)})` : "rgba(0,0,0,.90)");
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  if (input.variant === "campo-dati") drawDataField(ctx, width, height, input.dayNumber);
  drawDailyHeader(ctx, width, input.variant, input.dayNumber, input.dateLabel, input.subtitle, input.showWords, input.wordCount);
  if (input.variant === "fuori-squadra") drawOutsideTeam(ctx, width, height, input.attrito);
  if (input.variant === "sovrastampa") drawOverprint(ctx, width, height, input.attrito, input.summary);
  if (input.variant === "campo-dati") drawDataFieldCard(ctx, width, height, input.dayNumber, input.attrito);
  drawDailyFooter(ctx, height);
  if (input.variant !== "campo-dati") drawRuler(ctx, width, height, input.dayNumber);
  drawSpine(ctx, width, height, input.dayNumber);
  if (input.variant !== "sovrastampa") drawFold(ctx, width, height);
  drawEdgeDensity(ctx, width, height);
  drawDailyGrain(ctx, width, height, input.dayNumber);

  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("Canvas 2D non disponibile");
  outputContext.drawImage(working, 0, 0, width, height);
  return output;
}

export async function dailyCardCanvasDataUrl(data: DailyCanvasCardData) {
  return (await renderDailyCardCanvas(data)).toDataURL("image/png");
}

export async function downloadDailyCardCanvas(data: DailyCanvasCardData, filename?: string) {
  const input = dailyCanvasInput(data);
  const canvas = await renderDailyCardCanvas(input);
  await drawCanvasImage(canvas, filename ?? dailyCanvasFilename(input.dayNumber, input.variant, input.format));
}

export async function downloadDailyCanvasCard({
  filename,
  photoUrl,
  overlay,
  dayNumber,
  dayLabel,
  dateLabel,
  summary,
  stats,
  showStats,
  remaining,
  routineLine,
}: {
  filename: string;
  photoUrl: string | null;
  overlay: number;
  dayNumber: number;
  dayLabel: string;
  dateLabel: string;
  summary: string;
  stats: CanvasStat[];
  showStats: boolean;
  remaining: number;
  routineLine?: { text: string; completed: boolean };
}) {
  await waitForCanvasFonts();
  const { canvas, context: ctx } = prepareCanvas(1080, 1350);
  const cleanSummary = stripHtml(summary ?? "");
  const image = await loadOptionalImage(photoUrl);

  if (image) {
    drawCover(ctx, image, 1080, 1350, 1, "grayscale(15%)");
    const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
    gradient.addColorStop(0, `rgba(0,0,0,${Math.max(0, overlay - 0.2).toFixed(2)})`);
    gradient.addColorStop(0.45, `rgba(0,0,0,${overlay.toFixed(2)})`);
    gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.95, overlay + 0.34).toFixed(2)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);
  }
  drawFilmGrain(ctx, 1080, 1350);

  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  ctx.strokeRect(72, 72, 88, 88);
  setFont(ctx, 60, "Bebas Neue");
  ctx.fillStyle = RED;
  ctx.textAlign = "center";
  ctx.fillText("J", 116, 132);

  setFont(ctx, 24, "Inter");
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  drawSpacedText(ctx, "PROGETTO J", 180, 128, 7.2);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  ctx.fillText(dateLabel, 1008, 108);

  const countdown = remaining > 0
    ? `−${remaining} GIORNI AL GIORNO 180`
    : "GIORNO 180 RAGGIUNTO";
  let bottom = 1278;
  setFont(ctx, 22, "Inter");
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "left";
  drawSpacedText(ctx, countdown, 72, bottom, 5.5);
  ctx.fillStyle = RED;
  ctx.textAlign = "right";
  drawSpacedText(ctx, "projectj180day.com", 820, bottom, 5.5, "right");
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  drawSpacedText(ctx, "IC XC NIKA", 1008, bottom, 4.4, "right");

  if (routineLine) {
    setFont(ctx, 22, "Inter");
    ctx.fillStyle = routineLine.completed ? "#00FF41" : RED;
    ctx.textAlign = "left";
    drawSpacedText(ctx, routineLine.text, 72, bottom - 48, 4.5);
  }
  drawCardEkg(ctx, 1176);

  if (showStats && stats.length > 0) {
    const statBaseline = bottom - 153;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(72, statBaseline - 50);
    ctx.lineTo(1008, statBaseline - 50);
    ctx.stroke();

    const gap = 80;
    const totalWidth = stats.reduce((sum, stat) => {
      setFont(ctx, 88, "Bebas Neue");
      return sum + ctx.measureText(stat.value).width;
    }, 0) + Math.max(0, stats.length - 1) * gap;
    let x = (1080 - totalWidth) / 2;
    for (const stat of stats) {
      setFont(ctx, 88, "Bebas Neue");
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(stat.value, x, statBaseline);
      x += ctx.measureText(stat.value).width;
      setFont(ctx, 22, "Inter");
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      drawSpacedText(ctx, stat.label, x + ctx.measureText(stat.label).width / 2, statBaseline + 30, 5.5, "center");
      x += gap;
    }
    bottom = statBaseline - 75;
  }

  if (cleanSummary) {
    setFont(ctx, 40, "Inter");
    const lines = wrapText(ctx, cleanSummary, 880);
    const lineHeight = 54;
    const firstBaseline = bottom - (lines.length - 1) * lineHeight;
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    ctx.fillStyle = RED;
    ctx.fillRect(72, firstBaseline - 42, 4, lines.length * lineHeight + 20);
    ctx.fillStyle = "#FFFFFF";
    lines.forEach((line, index) => ctx.fillText(line, 104, firstBaseline + index * lineHeight));
    bottom = firstBaseline - 65;
  }

  setFont(ctx, 26, "Inter");
  ctx.fillStyle = RED;
  ctx.textAlign = "left";
  drawSpacedText(ctx, dayLabel, 72, bottom, 9.1);
  setFont(ctx, 260, "Bebas Neue");
  ctx.fillStyle = RED;
  ctx.fillText(String(dayNumber).padStart(3, "0"), 72, bottom + 220);

  await drawCanvasImage(canvas, filename);
}

export async function downloadReelCanvasCard({
  filename,
  photoUrl,
  overlay,
  dayNumber,
  summary,
  stats,
}: {
  filename: string;
  photoUrl: string | null;
  overlay: number;
  dayNumber: number;
  summary: string;
  stats: CanvasStat[];
}) {
  await waitForCanvasFonts();
  const { canvas, context: ctx } = prepareCanvas(1080, 1920);
  const cleanSummary = stripHtml(summary ?? "");
  const image = await loadOptionalImage(photoUrl);
  if (image) {
    drawCover(ctx, image, 1080, 1920);
    const gradient = ctx.createRadialGradient(540, 960, 0, 540, 960, 760);
    gradient.addColorStop(0, `rgba(0,0,0,${Math.min(0.98, overlay + 0.16).toFixed(2)})`);
    gradient.addColorStop(0.58, `rgba(0,0,0,${overlay.toFixed(2)})`);
    gradient.addColorStop(1, `rgba(0,0,0,${Math.max(0.4, overlay - 0.08).toFixed(2)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
  }

  ctx.textAlign = "center";
  setFont(ctx, 60, "Bebas Neue");
  ctx.fillStyle = RED;
  ctx.fillText("J", 540, 0.33 * 1920 + 60);
  setFont(ctx, 180, "Bebas Neue");
  ctx.fillText(String(dayNumber).padStart(3, "0"), 540, 0.38 * 1920 + 153);
  setFont(ctx, 26, "Bebas Neue");
  ctx.fillStyle = GREY;
  drawSpacedText(ctx, "GIORNO / 180", 540, 0.45 * 1920 + 26, 7.8, "center");

  ctx.fillStyle = RED;
  ctx.fillRect(490, 0.48 * 1920, 100, 4);

  if (cleanSummary) {
    setFont(ctx, 34, "Inter");
    ctx.fillStyle = WHITE;
    const lines = wrapText(ctx, cleanSummary, 800).slice(0, 3);
    lines.forEach((line, index) => ctx.fillText(line, 540, 0.51 * 1920 + 42 + index * 51));
  }

  if (stats.length > 0) {
    setFont(ctx, 46, "Bebas Neue");
    const groups = stats.map((stat) => {
      const valueWidth = ctx.measureText(stat.value).width;
      setFont(ctx, 22, "Bebas Neue");
      return { stat, valueWidth, unitWidth: ctx.measureText(stat.label).width };
    });
    const groupWidth = groups.reduce((sum, group) => sum + group.valueWidth + 8 + group.unitWidth, 0)
      + Math.max(0, groups.length - 1) * 26;
    let x = 540 - groupWidth / 2;
    for (const [index, group] of groups.entries()) {
      if (index > 0) {
        setFont(ctx, 28, "Bebas Neue");
        ctx.fillStyle = GREY;
        ctx.textAlign = "left";
        ctx.fillText("·", x, 0.605 * 1920 + 46);
        x += 26;
      }
      setFont(ctx, 46, "Bebas Neue");
      ctx.fillStyle = WHITE;
      ctx.fillText(group.stat.value, x, 0.605 * 1920 + 46);
      x += group.valueWidth + 8;
      setFont(ctx, 22, "Bebas Neue");
      ctx.fillStyle = GREY;
      drawSpacedText(ctx, group.stat.label, x, 0.605 * 1920 + 46, 4.4);
      x += group.unitWidth;
    }
  }

  setFont(ctx, 24, "Bebas Neue");
  ctx.fillStyle = GREY;
  drawSpacedText(ctx, "projectj180day.com", 540, 0.655 * 1920 + 24, 6.2, "center");
  await drawCanvasImage(canvas, filename);
}

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
  await waitForCanvasFonts();
  const { canvas, context: ctx } = prepareCanvas(1080, 1920);
  const image = await loadOptionalImage(photoUrl);
  if (image) {
    drawCover(ctx, image, 1080, 1920, 1.15, `blur(${blur}px)`);
    ctx.fillStyle = `rgba(0,0,0,${(overlay / 100).toFixed(2)})`;
    ctx.fillRect(0, 0, 1080, 1920);
    const gradient = ctx.createRadialGradient(540, 960, 0, 540, 960, 760);
    gradient.addColorStop(0, "rgba(10,10,10,0.55)");
    gradient.addColorStop(0.45, "rgba(10,10,10,0.35)");
    gradient.addColorStop(1, "rgba(10,10,10,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
  }

  ctx.textAlign = "center";
  setFont(ctx, 520, "Bebas Neue");
  ctx.fillStyle = RED;
  ctx.fillText(String(dayNumber).padStart(3, "0"), 540, 1115);
  setFont(ctx, 64, "Bebas Neue");
  ctx.fillStyle = DARK_GREY;
  drawSpacedText(ctx, "/180", 540, 1190, 6.4, "center");
  await drawCanvasImage(canvas, filename);
}