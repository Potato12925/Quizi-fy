# Quizi-fy Frontend API Contract

Tài liệu này mô tả cách chạy frontend và các giao kèo API (endpoints, format) mà Backend cần cung cấp để Frontend (hiện đang dùng mock data/fallback) có thể hoạt động hoàn chỉnh với dữ liệu thật.

## Cách chạy Frontend

1. Đảm bảo đã cài đặt Node.js (khuyến nghị bản LTS).
2. Chạy lệnh cài đặt dependencies:
   ```bash
   npm install
   ```
3. Copy file `.env.example` thành `.env` và cấu hình biến môi trường:
   ```bash
   cp .env.example .env
   ```
4. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```

## Biến môi trường cần có
- `VITE_API_BASE_URL`: Địa chỉ của backend API (VD: `http://localhost:8080/api/v1`). Frontend sẽ tự động thêm token vào Authorization header khi gọi API.

---

## 1. Auth Endpoints cần cung cấp

### POST `/auth/login`
- **Mô tả**: Đăng nhập hệ thống.
- **Request Body**:
  ```json
  {
    "email": "user@quizify.local",
    "password": "password123"
  }
  ```
- **Response mẫu**:
  ```json
  {
    "accessToken": "ey...",
    "user": {
      "id": "1",
      "name": "Nguyen Van A",
      "email": "user@quizify.local",
      "role": "student" // "admin" | "teacher" | "student"
    }
  }
  ```

### GET `/auth/me`
- **Mô tả**: Lấy thông tin user hiện tại qua JWT token.
- **Response**: Trả về object `user` như trên.

---

## 2. Admin Endpoints cần cung cấp

### GET `/admin/dashboard/stats`
- **Response mẫu**:
  ```json
  {
    "totalUsers": 1250,
    "totalClasses": 45,
    "totalSubjects": 12,
    "activePractices": 320
  }
  ```

### GET `/admin/users`
- **Response mẫu**:
  ```json
  {
    "students": [...],
    "teachers": [...]
  }
  ```

### GET `/admin/classes`
- **Response mẫu**: Danh sách lớp học.

### GET `/admin/subjects`
- **Response mẫu**: Danh sách môn học.

---

## 3. Teacher Endpoints cần cung cấp

### GET `/teacher/dashboard/stats`
- **Response mẫu**:
  ```json
  {
    "totalQuestionsGenerated": 1200,
    "totalClasses": 3,
    "totalStudents": 150,
    "averageScore": 8.5
  }
  ```

### POST `/teacher/ai-generator/generate`
- **Request Body**:
  ```json
  {
    "subject": "CS101",
    "topic": "Data Structures",
    "quantity": 10,
    "level": "Trung bình"
  }
  ```

### GET `/teacher/question-bank`
- **Response mẫu**: Danh sách bộ câu hỏi đã lưu.

---

## 4. Student Endpoints cần cung cấp

### GET `/student/dashboard`
- **Response mẫu**:
  ```json
  {
    "totalPractices": 15,
    "averageScore": 8.5,
    "completedQuestions": 300,
    "recentSubjects": [...]
  }
  ```

### POST `/student/practice/setup`
- **Request Body**:
  ```json
  {
    "subject": "CS101",
    "quantity": 20,
    "level": "Trung bình",
    "mode": "random-all"
  }
  ```
- **Response mẫu**:
  ```json
  {
    "practiceId": "12345"
  }
  ```

### GET `/student/practice/:id`
- **Mô tả**: Lấy chi tiết bộ câu hỏi thi.
- **Response mẫu**:
  ```json
  {
    "id": "12345",
    "duration": 3600, // seconds
    "questions": [
      {
        "id": "q1",
        "content": "What is ...?",
        "options": ["A", "B", "C", "D"]
      }
    ]
  }
  ```

### POST `/student/practice/:id/submit`
- **Request Body**:
  ```json
  {
    "answers": {
      "q1": 1, // index của đáp án
      "q2": 0
    }
  }
  ```
- **Response mẫu**:
  ```json
  {
    "success": true,
    "resultId": "res_123"
  }
  ```

### GET `/student/results/:id`
- **Mô tả**: Lấy kết quả bài thi.

---

**Lưu ý:** Hiện tại FE đang sử dụng fallback mock data trong `src/api/` vì backend chưa có thực tế. Các logic này đã được cấu trúc để dễ dàng tháo gỡ `TODO: Replace fallback mock when backend endpoint is ready` và gọi thẳng đến API thật khi sẵn sàng.
