BEGIN;

-- 1) Ensure new FK column exists
ALTER TABLE public.topics
ADD COLUMN IF NOT EXISTS class_subject_id BIGINT;

-- 2) Backfill from old subject_id when possible (safe no-op if already filled)
UPDATE public.topics t
SET class_subject_id = cs.class_subject_id
FROM public.class_subjects cs
WHERE t.class_subject_id IS NULL
  AND t.subject_id IS NOT NULL
  AND cs.subject_id = t.subject_id
  AND cs.deleted_at IS NULL
  AND cs.status = 'active';

-- 3) Add FK if missing (required for PostgREST relationship cache)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_topics_class_subject'
      AND conrelid = 'public.topics'::regclass
  ) THEN
    ALTER TABLE public.topics
    ADD CONSTRAINT fk_topics_class_subject
    FOREIGN KEY (class_subject_id)
    REFERENCES public.class_subjects(class_subject_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Helpful indexes / uniqueness for new model
CREATE INDEX IF NOT EXISTS idx_topics_class_subject
ON public.topics(class_subject_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topic_class_subject_name
ON public.topics(class_subject_id, topic_name)
WHERE deleted_at IS NULL;

COMMIT;
