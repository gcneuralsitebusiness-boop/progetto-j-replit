import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';
import { and, eq, or } from 'drizzle-orm';
import { db, articoliTable, contenutiTable, giorniTable, sponsorTable } from '@workspace/db';

import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function isAdmin(req: Request): boolean {
  return Boolean(req.session?.adminAuthenticated);
}

async function isPublicContentObject(objectPath: string): Promise<boolean> {
  const [day] = await db
    .select({ id: giorniTable.id })
    .from(giorniTable)
    .where(
      or(
        eq(giorniTable.foto, objectPath),
        eq(giorniTable.cardImmagine, objectPath),
        eq(giorniTable.cardFeed, objectPath),
        eq(giorniTable.cardStory, objectPath),
      ),
    )
    .limit(1);
  if (day) return true;

  const [content] = await db
    .select({ chiave: contenutiTable.chiave })
    .from(contenutiTable)
    .where(
      and(
        eq(contenutiTable.chiave, 'chi_sono_foto'),
        eq(contenutiTable.valore, objectPath),
      ),
    )
    .limit(1);
  if (content) return true;

  const [article] = await db
    .select({ id: articoliTable.id })
    .from(articoliTable)
    .where(
      and(
        eq(articoliTable.pubblicato, true),
        or(
          eq(articoliTable.immagine, objectPath),
          eq(articoliTable.cardImmagine, objectPath),
        ),
      ),
    )
    .limit(1);
  if (article) return true;

  const [sponsor] = await db
    .select({ id: sponsorTable.id })
    .from(sponsorTable)
    .where(
      and(
        eq(sponsorTable.logo, objectPath),
        eq(sponsorTable.visibile, true),
      ),
    )
    .limit(1);
  return Boolean(sponsor);
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * Requires admin session so public callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(parsed.data.contentType)) {
      res.status(400).json({
        error: 'Sono consentite solo immagini JPG, PNG o WebP.',
      });
      return;
    }

    if (parsed.data.size > MAX_UPLOAD_BYTES) {
      res.status(413).json({
        error: `Il file supera il limite di 8 MB. Riduci le dimensioni prima di caricarlo.`,
      });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const pathParts = wildcardPath.split('/');
    if (
      pathParts.some((part) => !part || part === '.' || part === '..' || part.includes('\0'))
    ) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    const admin = isAdmin(req);
    const aclAllowed = admin || await objectStorageService.canAccessObjectEntity({
      objectFile,
    });
    const publicContent = !admin && !aclAllowed
      ? await isPublicContentObject(objectPath)
      : false;
    if (!aclAllowed && !publicContent) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (publicContent || aclAllowed) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
