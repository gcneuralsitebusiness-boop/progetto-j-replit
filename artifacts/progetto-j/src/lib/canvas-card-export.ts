import { stripHtml } from "@/lib/strip-html";

const BLACK = "#0A0A0A";
const RED = "#B81D1D";
const WHITE = "#E8E4DE";
const GREY = "#6E6A65";
const DARK_GREY = "#4A4744";

type CanvasFont = "Bebas Neue" | "Inter" | "Arial";

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
  await document.fonts.load('bold 120px "Bebas Neue"');
  await document.fonts.load('400 34px "Inter"');
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
  for (let index = 0; index < noise.data.length; index += 4) {
    const value = Math.floor(Math.random() * 256);
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
  drawSpacedText(ctx, "PROGETTOJ.IT", 820, bottom, 5.5, "right");
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
  drawSpacedText(ctx, "PROGETTOJ.IT", 540, 0.655 * 1920 + 24, 6.2, "center");
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