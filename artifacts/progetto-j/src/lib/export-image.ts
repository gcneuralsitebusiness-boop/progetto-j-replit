import { toPng } from "html-to-image";
import type { Options } from "html-to-image/es/types";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Impossibile leggere l'immagine"));
    reader.readAsDataURL(blob);
  });
}

async function imageToDataUrl(url: string): Promise<string> {
  const response = await fetch(url, { mode: "cors", credentials: "same-origin" });
  if (!response.ok) throw new Error(`Immagine non disponibile (${response.status})`);
  return blobToDataUrl(await response.blob());
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (typeof image.decode === "function") {
        try {
          await image.decode();
          return;
        } catch {
          // onload below still gives us a reliable completion signal.
        }
      }
      if (image.complete) return;
      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
}

/**
 * html-to-image clones the DOM before embedding assets. Inlining the assets
 * first avoids tainting the canvas when object storage is served from another
 * origin, and the original live preview is restored immediately afterwards.
 */
export async function toPngWithEmbeddedAssets(
  root: HTMLElement,
  options: Options,
): Promise<string> {
  // Explicitly request the display font before waiting: fonts.ready only
  // covers loads already in flight, and a missing Bebas Neue would export
  // the numbers in a fallback font.
  try {
    await document.fonts.load('400 100px "Bebas Neue"');
  } catch {
    // Non-fatal: fonts.ready below is still the authoritative gate.
  }
  await document.fonts.ready;

  const restore: Array<() => void> = [];
  try {
    const imageNodes = Array.from(root.querySelectorAll("img"));
    for (const image of imageNodes) {
      const source = image.currentSrc || image.src;
      if (!source || source.startsWith("data:")) continue;
      const dataUrl = await imageToDataUrl(source);
      const previous = image.getAttribute("src");
      image.setAttribute("src", dataUrl);
      restore.push(() => {
        if (previous == null) image.removeAttribute("src");
        else image.setAttribute("src", previous);
      });
    }

    const styledNodes = Array.from(root.querySelectorAll<HTMLElement>("[style]"));
    for (const node of styledNodes) {
      const background = node.style.backgroundImage;
      const match = background.match(/^url\(["']?(.*?)["']?\)$/);
      if (!match || match[1].startsWith("data:")) continue;
      const dataUrl = await imageToDataUrl(match[1]);
      node.style.backgroundImage = `url("${dataUrl}")`;
      restore.push(() => {
        node.style.backgroundImage = background;
      });
    }

    await waitForImages(root);

    // Hard guarantee: every image inside the exported element must be a
    // data URL before toPng runs, otherwise the background is silently
    // dropped from the PNG (cross-origin taint / async load races).
    const notInlined = Array.from(root.querySelectorAll("img")).filter(
      (image) => image.src && !image.src.startsWith("data:"),
    );
    if (notInlined.length > 0) {
      throw new Error("Immagine di sfondo non incorporata: riprova il download");
    }

    return await toPng(root, options);
  } finally {
    for (const undo of restore.reverse()) undo();
  }
}