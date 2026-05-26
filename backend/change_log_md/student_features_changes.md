# Change Log: Hoàn thiện chức năng Học sinh (Student Features)

**Mục tiêu**: Bổ sung các logic nghiệp vụ cho đối tượng Học Sinh dựa trên yêu cầu từ `TTCS.md` và các thiếu sót đã xác định trong `backend_missing_features.md`.

Dưới đây là chi tiết tất cả các file đã được sửa đổi và những đoạn code đã được bổ sung vào hệ thống:

## 1. Môn học và Lớp học (Subject & Class)
*Cho phép học sinh xem danh sách các môn học và lớp học mà mình đang tham gia.*

- **`backend/schemas/class_student_schema.py`** / **`backend/schemas/class_subject_schema.py`**
  - (Không thay đổi, dùng lại schema cũ để xuất dữ liệu).

- **`backend/controllers/class_student_controller.py`**
  - Thêm endpoint `GET /my-classes` sử dụng `CurrentUser` dependency để lấy `student_id`.
  
- **`backend/services/class_student_service.py`**
  - Thêm hàm `get_my_classes(student_id)` để lọc các lớp ở trạng thái `active`.

- **`backend/repositories/class_student_repository.py`**
  - Thêm hàm `list_my_classes(student_id)` thực hiện truy vấn Supabase JOIN `classes`.

- **`backend/controllers/class_subject_controller.py`**
  - Thêm endpoint `GET /my-subjects`.

- **`backend/services/class_subject_service.py`**
  - Thêm hàm `get_my_subjects(student_id)` để lọc trùng lặp các môn học.

- **`backend/repositories/class_subject_repository.py`**
  - Thêm hàm `list_my_subjects(student_id)` thực hiện truy vấn lồng (tìm tất cả class của student, sau đó tìm các môn active trong các class đó).

## 2. Sinh Đề Ôn Tập (Practice Set)
*Học sinh có thể yêu cầu hệ thống sinh đề ngẫu nhiên từ ngân hàng câu hỏi (chỉ lấy câu hỏi đã được duyệt).*

- **`backend/schemas/practice_set_schema.py`**
  - Bổ sung schema `PracticeSetGenerateRequest` chứa các trường `subject_id`, `topic_id`, `difficulty`, `num_questions`.

- **`backend/controllers/practice_set_controller.py`**
  - Thêm endpoint `POST /generate` tiếp nhận yêu cầu sinh đề.

- **`backend/services/practice_set_service.py`**
  - Thêm hàm `generate_practice_set` để gọi hàm lấy ID ngẫu nhiên, khởi tạo `practice_set` trong DB, và gắn các ID câu hỏi vào thông qua `bulk_insert`.

- **`backend/repositories/question_repository.py`**
  - Thêm hàm `get_random_question_ids`: Truy vấn Supabase lọc theo điều kiện và dùng Python `random.shuffle()` để lấy số lượng ID ngẫu nhiên giới hạn bởi `limit`.

- **`backend/repositories/practice_set_question_repository.py`**
  - Thêm hàm `bulk_insert_practice_set_questions` giúp chèn nhiều records cùng một lúc (Bulk insert).

## 3. Làm Bài & Lưu Nháp Câu Trả Lời (Autosave)
*Hệ thống cung cấp API giúp giao diện frontend lưu nháp câu trả lời định kỳ, phòng ngừa rớt mạng.*

- **`backend/schemas/student_answer_schema.py`**
  - Bổ sung `AnswerItem` và `StudentAnswerSaveRequest` hỗ trợ nhận một mảng danh sách câu trả lời.

- **`backend/controllers/practice_attempt_controller.py`**
  - Thêm endpoint `POST /{attempt_id}/answers` phục vụ autosave.

- **`backend/services/practice_attempt_service.py`**
  - Thêm hàm `autosave_answers` để xử lý logic lưu nháp.

- **`backend/repositories/student_answer_repository.py`**
  - Thêm hàm `upsert_student_answers`: Sử dụng phương thức `upsert` của Supabase (với cờ `on_conflict="attempt_id,question_id"`) để chèn mới hoặc đè lên câu trả lời cũ.

## 4. Quản lý Lượt Làm Bài, Nộp Bài & Xem Kết Quả (Practice Attempt)
*Xử lý nghiệp vụ bắt đầu tính giờ, nộp bài, chấm điểm tự động và trả kết quả chi tiết.*

- **`backend/schemas/practice_attempt_schema.py`**
  - Bổ sung schema `PracticeAttemptStartRequest`.

- **`backend/controllers/practice_attempt_controller.py`**
  - Thêm endpoint `POST /start` để khởi tạo attempt.
  - Thêm endpoint `POST /{attempt_id}/submit` để ra lệnh nộp bài.
  - Thêm endpoint `GET /{attempt_id}/result` để xem chi tiết.

- **`backend/services/practice_attempt_service.py`**
  - Thêm `start_attempt`.
  - Thêm `submit_attempt`: Logic đối chiếu đáp án đã lưu nháp với `question_options` có `is_correct=True`. Tự động cập nhật số câu đúng, số câu sai, tính `score` (thang điểm 10) và cập nhật status sang `submitted`.
  - Thêm `get_attempt_result`.

- **`backend/repositories/practice_attempt_repository.py`**
  - Thêm hàm `get_attempt_result_details`: Lấy chi tiết lịch sử bài làm cùng câu hỏi, option đúng và lời giải thích bằng cú pháp nested relationships của Supabase (`questions(*, question_options(*))`).
