-- Keep autosaved drafts isolated across seasons; no existing draft is removed.
BEGIN;
ALTER TABLE bozze ADD COLUMN fase integer NOT NULL DEFAULT 1;
ALTER TABLE bozze DROP CONSTRAINT bozze_pkey;
ALTER TABLE bozze ADD CONSTRAINT bozze_pkey PRIMARY KEY (fase, numero);
COMMIT;
