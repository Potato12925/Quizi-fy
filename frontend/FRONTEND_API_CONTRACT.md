# Quizi-fy Frontend API Contract

Tài liệu này mô tả các giao kèo API (endpoints, format) khớp với Database Schema PostgreSQL. Frontend sử dụng lớp Mapper để chuyển đổi từ DB model (snake_case) sang UI model (camelCase).

## Biến môi trường
- `VITE_API_BASE_URL`: API endpoint (VD: `http://localhost:8080/api/v1`).

---

## 1. Auth Endpoints

### POST `/auth/login`
- **Request Body**:
  ```json
  { "email": "user@ptit.edu.vn", "password": "..." }
  ```
- **Response (DB-style)**:
  ```json
  {
    "accessToken": "ey...",
    "user": {
      "user_id": 1,
      "full_name": "Nguyen Van A",
      "email": "a.nv@ptit.edu.vn",
      "role_code": "student",
      "is_active": true
    }
  }
  ```

### GET `/auth/me`
- **Response**: Trả về object `user` (DbUser) như trên.

---

## 2. Admin Endpoints

### GET `/admin/classes`
- **Response mẫu (DbClass[])**:
  ```json
  [
    {
      "class_id": 1,
      "class_code": "D21CQCN01-B",
      "class_name": "D21CQCN01-B",
      "status": "active"
    }
  ]
  ```

---

## 3. Teacher Endpoints

### POST `/teacher/ai-generator/generate`
- **Response mẫu (DbQuestion[])**:
  ```json
  [
    {
      "question_id": 101,
      "content": "Câu hỏi AI?",
      "difficulty": "medium",
      "options": [
        { "option_id": 1, "option_text": "Đáp án A", "is_correct": true, "order_num": 0 }
      ]
    }
  ]
  ```

### GET `/teacher/resources`
- **Response mẫu (DbDocument[])**:
  ```json
  [
    {
      "document_id": 50,
      "title": "Giao trình CSDL.pdf",
      "file_size": 2048000,
      "created_at": "2024-05-14T12:00:00Z"
    }
  ]
  ```

---

## 4. Student Endpoints

### GET `/student/history`
- **Response mẫu (DbPracticeAttempt[])**:
  ```json
  [
    {
      "attempt_id": 500,
      "started_at": "2024-05-14T08:00:00Z",
      "score": 9.5,
      "total_correct": 19,
      "total_wrong": 1,
      "status": "submitted"
    }
  ]
  ```

---

**Lưu ý về Mapping:**
Frontend thực hiện mapping tại `src/api/*Api.ts` để giữ cho UI components không bị ảnh hưởng bởi việc đổi tên field DB (ví dụ: `user_id` -> `id`). Các fallback mock data hiện tại cũng đã được cập nhật theo cấu trúc này.
