import {
  articoliTable,
  coachingTable,
  contattiTable,
  contenutiTable,
  db,
  giorniTable,
  iscrittiTable,
  pagineTable,
  socialTable,
  sponsorTable,
} from "@workspace/db";
import { type File } from "@google-cloud/storage";
import { logger } from "./logger";
import { objectStorageClient, ObjectStorageService } from "./objectStorage";

const BACKUP_PREFIX = "backups/";
const MAX_BACKUPS = 30;
const storageService = new ObjectStorageService();

export type BackupPayload = {
  exportedAt: string;
  schemaVersion: number;
  summary: Record<string, number>;
  giorni: unknown[];
  contenuti: unknown[];
  pagine: unknown[];
  social: unknown[];
  sponsor: unknown[];
  articoli: unknown[];
  coaching: unknown[];
  contatti: unknown[];
  iscritti: unknown[];
};

export type BackupStatus = {
  key: string;
  createdAt: string;
  sizeBytes: number;
} | null;

function getRomeDate(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getStorageLocation(): { bucketName: string; prefix: string } {
  const rawPath = storageService.getPrivateObjectDir().replace(/^\/+/, "").replace(/\/+$/, "");
  const separator = rawPath.indexOf("/");
  if (separator < 1) {
    throw new Error("PRIVATE_OBJECT_DIR must include a bucket and object prefix.");
  }
  return {
    bucketName: rawPath.slice(0, separator),
    prefix: `${rawPath.slice(separator + 1)}/`,
  };
}

function getBackupKey(date: string): string {
  return `${BACKUP_PREFIX}backup-${date}.json`;
}

function getBackupFileName(file: File, prefix: string): string {
  const fullPrefix = `${prefix}${BACKUP_PREFIX}`;
  return file.name.startsWith(fullPrefix) ? file.name.slice(fullPrefix.length) : file.name;
}

export async function generateBackupPayload(): Promise<BackupPayload> {
  const [
    giorni,
    contenuti,
    pagine,
    social,
    sponsor,
    articoli,
    coaching,
    contatti,
    iscritti,
  ] = await Promise.all([
    db.select().from(giorniTable),
    db.select().from(contenutiTable),
    db.select().from(pagineTable),
    db.select().from(socialTable),
    db.select().from(sponsorTable),
    db.select().from(articoliTable),
    db.select().from(coachingTable),
    db.select().from(contattiTable),
    db.select().from(iscrittiTable),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
    summary: {
      giorni: giorni.length,
      contenuti: contenuti.length,
      pagine: pagine.length,
      social: social.length,
      sponsor: sponsor.length,
      articoli: articoli.length,
      coaching: coaching.length,
      contatti: contatti.length,
      iscritti: iscritti.length,
    },
    giorni,
    contenuti,
    pagine,
    social,
    sponsor,
    articoli,
    coaching,
    contatti,
    iscritti,
  };
}

async function applyRetention(
  files: File[],
  prefix: string,
): Promise<void> {
  const sorted = files
    .filter((file) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(getBackupFileName(file, prefix)))
    .sort((a, b) => getBackupFileName(b, prefix).localeCompare(getBackupFileName(a, prefix)));

  await Promise.all(sorted.slice(MAX_BACKUPS).map((file) => file.delete()));
}

export async function saveBackup(): Promise<{
  key: string;
  sizeBytes: number;
  payload: BackupPayload;
}> {
  const payload = await generateBackupPayload();
  const { bucketName, prefix } = getStorageLocation();
  const key = getBackupKey(getRomeDate());
  const file = objectStorageClient.bucket(bucketName).file(`${prefix}${key}`);
  const body = JSON.stringify(payload, null, 2);

  await file.save(body, {
    contentType: "application/json",
    resumable: false,
    metadata: { cacheControl: "private, no-store" },
  });

  const [files] = await objectStorageClient.bucket(bucketName).getFiles({
    prefix: `${prefix}${BACKUP_PREFIX}`,
  });
  await applyRetention(files, prefix);

  return { key, sizeBytes: Buffer.byteLength(body), payload };
}

export async function getLatestBackupStatus(): Promise<BackupStatus> {
  const { bucketName, prefix } = getStorageLocation();
  const [files] = await objectStorageClient.bucket(bucketName).getFiles({
    prefix: `${prefix}${BACKUP_PREFIX}`,
  });
  const backupFiles = files
    .filter((file) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(getBackupFileName(file, prefix)))
    .sort((a, b) => getBackupFileName(b, prefix).localeCompare(getBackupFileName(a, prefix)));

  const file = backupFiles[0];
  if (!file) return null;

  const [metadata] = await file.getMetadata();
  return {
    key: `${BACKUP_PREFIX}${getBackupFileName(file, prefix)}`,
    createdAt: String(metadata.updated ?? metadata.timeCreated ?? ""),
    sizeBytes: Number(metadata.size ?? 0),
  };
}

export async function runAutomaticBackup(): Promise<{
  key: string;
  sizeBytes: number;
}> {
  const result = await saveBackup();
  logger.info({ key: result.key, sizeBytes: result.sizeBytes }, "Automatic backup complete");
  return { key: result.key, sizeBytes: result.sizeBytes };
}

export function scheduleAutomaticBackup(): void {
  import("node-cron").then(({ schedule }) => {
    schedule(
      "0 4 * * *",
      () => {
        runAutomaticBackup().catch((error) => {
          logger.error({ err: error }, "Automatic backup failed");
        });
      },
      { timezone: "Europe/Rome" },
    );
  }).catch((error) => {
    logger.error({ err: error }, "Automatic backup scheduler failed to start");
  });
}