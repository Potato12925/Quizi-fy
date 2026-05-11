# users

## Purpose

Lưu toàn bộ tài khoản người dùng trong hệ thống.

Hệ thống dùng Google OAuth login nên mỗi user có:

- google_id
- email
- profile cơ bản

Hỗ trợ multi-role thông qua bảng `user_roles`.

---

## Columns

| Column     | Type         | Description          |
| ---------- | ------------ | -------------------- |
| user_id    | bigint PK    | ID user              |
| google_id  | varchar(100) | Google OAuth ID      |
| email      | varchar(255) | Email đăng nhập      |
| full_name  | varchar(255) | Tên hiển thị         |
| avatar_url | text         | Ảnh đại diện         |
| is_active  | boolean      | Trạng thái hoạt động |
| created_at | datetime     | Ngày tạo             |
| updated_at | datetime     | Ngày cập nhật        |
| deleted_at | datetime     | Soft delete          |

---

## Relationships

- users -> user_roles
- users -> documents
- users -> questions
- users -> class_students
- users -> class_teachers
- users -> notifications

---

## Business Rules

- Email unique.
- Login bằng Google OAuth.
- Không xóa cứng user.
- User có thể có nhiều role.

---

## Common Queries

### Get user by email

```sql
SELECT * FROM users WHERE email = ?;
```

### Get active users

```sql
SELECT * FROM users WHERE is_active = true;
```
