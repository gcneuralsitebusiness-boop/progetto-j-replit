import {
  dailyCardBlob,
  makeDailyCardData,
  type DailyCardInput,
} from "@/lib/daily-card";
import { getPhotoUrl } from "@workspace/object-storage-web";

async function uploadPng(blob: Blob, filename: string): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/storage/uploads/request-url`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: filename, size: blob.size, contentType: "image/png" }),
  });
  if (!response.ok) throw new Error("Impossibile ottenere lo spazio per la card");
  const { uploadURL, objectPath } = await response.json() as { uploadURL: string; objectPath: string };
  const uploaded = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: blob,
  });
  if (!uploaded.ok) throw new Error("Impossibile caricare la card");
  return objectPath;
}

/** Generates the feed and story PNGs after an authenticated day save, then stores their object paths. */
export async function persistDailyCardImages(entry: DailyCardInput, allEntries: DailyCardInput[] = []): Promise<{ cardFeed: string; cardStory: string }> {
  if (!entry.testo?.trim()) return { cardFeed: entry.cardFeed ?? "", cardStory: entry.cardStory ?? "" };
  const photoPath = entry.cardImmagine || entry.foto;
  const photoUrl = photoPath ? (getPhotoUrl(photoPath) ?? photoPath) : null;
  const [feed, story] = await Promise.all([
    dailyCardBlob(makeDailyCardData(entry, "feed", undefined, allEntries, photoUrl)),
    dailyCardBlob(makeDailyCardData(entry, "story", undefined, allEntries, photoUrl)),
  ]);
  const [cardFeed, cardStory] = await Promise.all([
    uploadPng(feed, `progetto-j-giorno-${String(entry.numero).padStart(3, "0")}-feed.png`),
    uploadPng(story, `progetto-j-giorno-${String(entry.numero).padStart(3, "0")}-story.png`),
  ]);
  const patched = await fetch(`${import.meta.env.BASE_URL}api/entries/${entry.numero}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardFeed, cardStory }),
  });
  if (!patched.ok) throw new Error("Le card sono state caricate ma non associate al giorno");
  return { cardFeed, cardStory };
}