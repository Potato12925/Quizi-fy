# Table: `subjects`

## Purpose

Top-level subject catalog.

## Columns

| Column | Definition |
|---|---|
| `subject_id` | `bigint [pk, increment]` |
| `subject_code` | `varchar(50) [unique, not null]` |
| `subject_name` | `varchar(255) [not null]` |
| `description` | `text` |
| `status` | `active_status [default: 'active']` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Relationships

- topics.subject_id -> subjects.subject_id
- class_subjects.subject_id -> subjects.subject_id
- practice_sets.subject_id -> subjects.subject_id

## Recommended Supabase Queries

```sql
select subject_id, subject_code, subject_name from subjects limit 20;
```
