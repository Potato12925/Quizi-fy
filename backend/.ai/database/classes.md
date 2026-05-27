# Table: `classes`

## Purpose

Documentation for `classes` table.

## Columns

| Column        | Definition                                |
| ------------- | ----------------------------------------- |
| `class_id`    | `bigint [pk, increment]`                  |
| `teacher_id`  | `bigint [not null, ref: > users.user_id]` |
| `class_code`  | `varchar(50) [unique, not null]`          |
| `class_name`  | `varchar(255) [not null]`                 |
| `description` | `text`                                    |
| `status`      | `active_status [default: 'active']`       |
| `created_at`  | `timestamp [default: CURRENT_TIMESTAMP]`  |
| `updated_at`  | `timestamp [default: CURRENT_TIMESTAMP]`  |
| `deleted_at`  | `timestamp`                               |

## Relationships

- classes.owner_id -> users.user_id
- class_subjects.class_id -> classes.class_id
- class_students.class_id -> classes.class_id
- class_teachers.class_id -> classes.class_id

## Recommended Supabase Queries

```sql
select * from classes limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
