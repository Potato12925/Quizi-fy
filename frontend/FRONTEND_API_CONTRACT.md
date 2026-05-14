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
- **Request Body**: `{ "document_id": 50, "num_questions": 10, "difficulty": "medium" }`
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

### 3.1. Quản lý Tài liệu (Resources)

#### GET `/teacher/resources`
- **Response**: `DbDocument[]` (Danh sách tài liệu của giáo viên đó).

#### POST `/teacher/resources/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `file`: File (PDF, DOCX, TXT) - **Max 20MB**.
  - `title`: string
  - `subject_id`: number
  - `topic_id`: number (optional)
  - `description`: string (optional)
- **Validation**: Backend phải kiểm tra dung lượng < 20MB và đuôi file hợp lệ.

#### PUT `/teacher/resources/:id`
- **Body**: `{ "title": "...", "description": "...", "subject_id": ... }`

#### DELETE `/teacher/resources/:id`
- **Quy định**: Thực hiện xóa mềm (soft delete) hoặc ẩn nếu tài liệu đã được dùng để tạo câu hỏi.

### 3.2. Ngân hàng câu hỏi (Question Bank)

#### GET `/teacher/question-bank`
- **Response**: `{ subjects: BankSubject[], questions: DbQuestion[] }`

#### POST `/teacher/question-bank/manual`
- **Body**: 
  ```json
  {
    "subjectId": "1",
    "topicId": "1",
    "content": "...",
    "difficulty": "easy/medium/hard",
    "options": ["A", "B", "C", "D"],
    "correctOptionLabel": "A",
    "explanation": "..."
  }
  ```

#### PUT/DELETE `/teacher/question-bank/:id`
- Thao tác tương tự CRUD thông thường.

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

**Lưu ý quan quan trọng cho Backend:**
1. **Naming Convention**: Database sử dụng `snake_case` (ví dụ: `document_id`, `file_size`). Frontend sẽ tự động map sang `camelCase` (ví dụ: `id`, `size`).
2. **File Handling**: Khi upload thành công, trả về đúng object `DbDocument` để frontend cập nhật UI.
3. **Status Codes**: 
   - 200/201 cho thành công.
   - 400 cho lỗi validate (file quá lớn, sai định dạng).
   - 401/403 cho lỗi quyền truy cập.

