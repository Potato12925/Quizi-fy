BEGIN;

ALTER TABLE topics
ADD COLUMN IF NOT EXISTS class_subject_id BIGINT;

CREATE TABLE IF NOT EXISTS topic_migration_map (
    old_topic_id BIGINT NOT NULL,
    class_subject_id BIGINT NOT NULL,
    new_topic_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (old_topic_id, class_subject_id)
);

WITH source_topics AS (
    SELECT topic_id, subject_id, topic_name, description, created_at, updated_at, deleted_at
    FROM topics
),
target_class_subjects AS (
    SELECT class_subject_id, subject_id
    FROM class_subjects
    WHERE deleted_at IS NULL AND status = 'active'
),
to_clone AS (
    SELECT
        st.topic_id AS old_topic_id,
        cs.class_subject_id,
        st.topic_name,
        st.description,
        st.created_at,
        st.updated_at,
        st.deleted_at
    FROM source_topics st
    JOIN target_class_subjects cs ON cs.subject_id = st.subject_id
)
INSERT INTO topics (class_subject_id, topic_name, description, created_at, updated_at, deleted_at)
SELECT class_subject_id, topic_name, description, created_at, updated_at, deleted_at
FROM to_clone
RETURNING topic_id, class_subject_id, topic_name;

INSERT INTO topic_migration_map (old_topic_id, class_subject_id, new_topic_id)
SELECT
    t_old.topic_id AS old_topic_id,
    t_new.class_subject_id,
    t_new.topic_id AS new_topic_id
FROM topics t_new
JOIN topics t_old
  ON t_new.topic_name = t_old.topic_name
 AND COALESCE(t_new.description, '') = COALESCE(t_old.description, '')
 AND t_old.class_subject_id IS NULL
JOIN class_subjects cs
  ON cs.class_subject_id = t_new.class_subject_id
 AND cs.subject_id = t_old.subject_id
WHERE t_new.class_subject_id IS NOT NULL
ON CONFLICT (old_topic_id, class_subject_id) DO NOTHING;

UPDATE document_topics dt
SET topic_id = tmm.new_topic_id
FROM topics t_old
JOIN class_subjects cs ON cs.subject_id = t_old.subject_id
JOIN documents d ON d.document_id = dt.document_id
JOIN topic_migration_map tmm ON tmm.old_topic_id = t_old.topic_id AND tmm.class_subject_id = cs.class_subject_id
WHERE dt.topic_id = t_old.topic_id
  AND t_old.class_subject_id IS NULL
  AND cs.assigned_teacher_id = d.teacher_id
  AND cs.deleted_at IS NULL;

UPDATE document_topics dt
SET topic_id = tmm.new_topic_id
FROM topics t_old
JOIN topic_migration_map tmm ON tmm.old_topic_id = t_old.topic_id
WHERE dt.topic_id = t_old.topic_id
  AND t_old.class_subject_id IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM documents d
      JOIN class_subjects cs ON cs.assigned_teacher_id = d.teacher_id AND cs.class_subject_id = tmm.class_subject_id
      WHERE d.document_id = dt.document_id
  );

ALTER TABLE topics
ALTER COLUMN class_subject_id SET NOT NULL;

ALTER TABLE topics
ADD CONSTRAINT fk_topics_class_subject
FOREIGN KEY (class_subject_id) REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_topics_subject;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS uq_topic_subject;

CREATE INDEX IF NOT EXISTS idx_topics_class_subject ON topics(class_subject_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_topic_class_subject_name ON topics(class_subject_id, topic_name) WHERE deleted_at IS NULL;

ALTER TABLE topics DROP COLUMN IF EXISTS subject_id;

COMMIT;
