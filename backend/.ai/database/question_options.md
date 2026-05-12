# Table: `question_options`

## Purpose

Documentation for `question_options` table.

## Columns

| Column | Definition |
|---|---|
| `option_id` | `bigint [pk, increment]` |
| `question_id` | `bigint [not null]` |
| `option_label` | `varchar(5) [not null]` |
| `option_text` | `text [not null]` |
| `is_correct` | `boolean [default: false]` |
| `order_num` | `int [not null]` |

## Relationships

- question_options.question_id -> questions.question_id

## Recommended Supabase Queries

```sql
select * from question_options limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.