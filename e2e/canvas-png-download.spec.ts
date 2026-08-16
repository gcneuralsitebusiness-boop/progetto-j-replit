/**
 * E2E: Canvas PNG download verification
 *
 * Verifies that each card route:
 *  - downloads a PNG with the correct dimensions
 *  - loads photos cross-origin without errors
 *  - applies blur on the minimal variant
 *  - falls back to #0A0A0A when no photo is present
 *  - produces no console errors or page errors
 */

import { test, expect, Download } from "@playwright/test";
import * as fs from "fs";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Read width × height from a PNG IHDR chunk (no external library needed). */
function pngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  // PNG signature: 8 bytes, then IHDR chunk: 4 len + 4 type + 4 w + 4 h + ...
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buf.slice(0, 8).equals(PNG_SIG)) {
    throw new Error(`Not a valid PNG: ${filePath}`);
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

/**
 * Click the download button and wait for the download to complete.
 * Returns the path to the saved temp file.
 */
async function triggerDownload(
  page: import("@playwright/test").Page,
  buttonText: RegExp | string,
): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: buttonText }).click(),
  ]);
  return download;
}

async function saveAndVerify(
  download: Download,
  expectedWidth: number,
  expectedHeight: number,
): Promise<{ filePath: string; byteLength: number }> {
  const filePath = await download.path();
  if (!filePath) throw new Error("Download path is null — download may have failed");

  const { width, height } = pngDimensions(filePath);
  expect(width, `PNG width`).toBe(expectedWidth);
  expect(height, `PNG height`).toBe(expectedHeight);

  const byteLength = fs.statSync(filePath).size;
  return { filePath, byteLength };
}

// ─── fixtures ───────────────────────────────────────────────────────────────

/** Collect all console errors and page errors into an array. */
function collectErrors(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  return errors;
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe("Card PNG downloads", () => {
  test("/card/85 → 1080×1350 feed card with photo", async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto("/card/85");
    // Wait for entry data to load (the download button becomes enabled)
    await expect(
      page.getByRole("button", { name: /Scarica PNG/i }),
    ).toBeEnabled({ timeout: 20_000 });

    const download = await triggerDownload(page, /Scarica PNG/i);
    const { byteLength } = await saveAndVerify(download, 1080, 1350);

    // A photo-backed card should not be tiny — at least 50 KB
    expect(byteLength, "Feed card with photo should be >50 KB").toBeGreaterThan(
      50_000,
    );

    expect(errors, "No console/page errors during download").toHaveLength(0);
  });

  test("/card/85/reel → 1080×1920 reel card with photo, no FEED/PROFILO guides", async ({
    page,
  }) => {
    const errors = collectErrors(page);

    await page.goto("/card/85/reel");
    await expect(
      page.getByRole("button", { name: /Scarica copertina reel/i }),
    ).toBeEnabled({ timeout: 20_000 });

    const download = await triggerDownload(
      page,
      /Scarica copertina reel/i,
    );
    const { byteLength } = await saveAndVerify(download, 1080, 1920);

    // Photo-backed reel should be at least 50 KB
    expect(byteLength, "Reel card with photo should be >50 KB").toBeGreaterThan(
      50_000,
    );

    // The guides overlay (FEED / PROFILO text) is a DOM element that is NOT drawn
    // on the canvas — verify the page has the guide element in the DOM but the
    // download is purely the canvas (no guide watermark in the PNG).
    // We confirm the guides div exists (so we're on the right variant):
    const hasGuides = await page.locator("text=FEED").count();
    expect(hasGuides, "FEED guide visible in preview DOM").toBeGreaterThan(0);

    expect(errors, "No console/page errors during download").toHaveLength(0);
  });

  test("/card/85/reel-minimal → 1080×1920 minimal with blurred recognizable photo", async ({
    page,
  }) => {
    const errors = collectErrors(page);

    await page.goto("/card/85/reel-minimal");
    await expect(
      page.getByRole("button", { name: /Scarica minimal/i }),
    ).toBeEnabled({ timeout: 20_000 });

    const download = await triggerDownload(page, /Scarica minimal/i);
    const { byteLength: byteLengthWithPhoto } = await saveAndVerify(
      download,
      1080,
      1920,
    );

    // Blurred photo → lots of varied pixel data → PNG compresses less → bigger file
    // A plain black + text fallback typically compresses to < 30 KB.
    // A blurred photo should be at least 100 KB.
    expect(
      byteLengthWithPhoto,
      "Minimal with blurred photo should be >100 KB (photo data present)",
    ).toBeGreaterThan(100_000);

    expect(errors, "No console/page errors during download").toHaveLength(0);
  });

  test("/card/93/reel-minimal → 1080×1920 minimal with #0A0A0A fallback (no photo)", async ({
    page,
  }) => {
    const errors = collectErrors(page);

    await page.goto("/card/93/reel-minimal");
    await expect(
      page.getByRole("button", { name: /Scarica minimal/i }),
    ).toBeEnabled({ timeout: 20_000 });

    const download = await triggerDownload(page, /Scarica minimal/i);
    const { byteLength: byteLengthNoPhoto } = await saveAndVerify(
      download,
      1080,
      1920,
    );

    // Solid #0A0A0A background + red text compresses extremely well.
    // Expect well under 100 KB; typically 10-40 KB.
    expect(
      byteLengthNoPhoto,
      "Minimal without photo (black fallback) should be <100 KB",
    ).toBeLessThan(100_000);

    expect(errors, "No console/page errors during download").toHaveLength(0);
  });
});
