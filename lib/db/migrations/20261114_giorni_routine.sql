-- Development migration only. New optional Season 2 fields; no defaults or backfill.
BEGIN;
ALTER TABLE giorni
  ADD COLUMN IF NOT EXISTS shadow_minuti integer,
  ADD COLUMN IF NOT EXISTS allenamento_tecnica boolean,
  ADD COLUMN IF NOT EXISTS allenamento_pesi boolean,
  ADD COLUMN IF NOT EXISTS sparring_fatto boolean,
  ADD COLUMN IF NOT EXISTS denti_volte integer,
  ADD COLUMN IF NOT EXISTS doccia boolean,
  ADD COLUMN IF NOT EXISTS pagine_bibbia integer,
  ADD COLUMN IF NOT EXISTS pagine_libro integer,
  ADD COLUMN IF NOT EXISTS libro_attuale text,
  ADD COLUMN IF NOT EXISTS diario_fatto boolean,
  ADD COLUMN IF NOT EXISTS brainstorming_articoli boolean,
  ADD COLUMN IF NOT EXISTS lavoro_inizio time,
  ADD COLUMN IF NOT EXISTS lavoro_fine time,
  ADD COLUMN IF NOT EXISTS kcal_colazione integer,
  ADD COLUMN IF NOT EXISTS kcal_pranzo integer,
  ADD COLUMN IF NOT EXISTS kcal_cena integer,
  ADD COLUMN IF NOT EXISTS fondo_emergenza numeric,
  ADD COLUMN IF NOT EXISTS investimento numeric,
  ADD COLUMN IF NOT EXISTS caroselli_pubblicati integer,
  ADD COLUMN IF NOT EXISTS youtube_pubblicati integer;
COMMIT;
