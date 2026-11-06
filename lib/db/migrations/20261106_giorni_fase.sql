-- Development migration. Production schema is applied by Replit Publish.
-- alcol already exists: preserve its definition and every saved value.
BEGIN;
ALTER TABLE giorni
  ADD COLUMN fase integer NOT NULL DEFAULT 1,
  ADD COLUMN round_sparring integer,
  ADD COLUMN round_pao integer,
  ADD COLUMN round_tecnica integer,
  ADD COLUMN ora_sveglia time,
  ADD COLUMN ore_lavoro numeric,
  ADD COLUMN risparmio numeric,
  ADD COLUMN entrate_online numeric,
  ADD COLUMN video_pubblicati integer,
  ADD COLUMN articoli_pubblicati integer,
  ADD COLUMN follower integer,
  ADD COLUMN pagine_lette integer,
  ADD COLUMN minuti_scrittura integer;
ALTER TABLE giorni ADD CONSTRAINT giorni_fase_numero_unique UNIQUE (fase, numero);
ALTER TABLE giorni DROP CONSTRAINT giorni_numero_unique;
COMMIT;
