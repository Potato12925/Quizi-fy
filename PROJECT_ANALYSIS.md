# Đề xuất & Phân tích Tính năng Mới (Teacher & Student) - Dự án Quizi-fy

Tài liệu này phân tích chuyên sâu các tính năng mới đề xuất dành cho cả **Giáo viên (Teacher)** và **Học sinh (Student)**, tập trung vào công nghệ AI sinh Sơ đồ tư duy (Mindmap), Tiền xử lý dữ liệu và các cơ chế ôn tập thông minh.

---

## 👨‍🏫 1. Các Tính năng dành cho Giáo viên (Teacher)

### 1.1. Sinh Sơ đồ tư duy cho môn học (Subject Mindmap Generation)
*   **Mô tả**: AI sẽ phân tích toàn bộ các chủ đề (`topics`) và tài liệu học tập (`documents`) trong một môn học để tự động thiết kế và vẽ ra một Sơ đồ tư duy (Mindmap) tổng quan cho môn học đó.
*   **Ảnh hưởng Database**: **Thêm 1 cột nhẹ vào bảng `subjects`**.
    *   *Cách triển khai*: 
        *   Thêm cột `mindmap_data JSONB` vào bảng `subjects` để lưu cấu trúc cây của sơ đồ tư duy (dạng JSON).
        *   Backend sử dụng AI để phân tích và sinh ra cấu trúc cây JSON này (VD: tương thích với thư viện hiển thị như `Markmap` hoặc `React Flow`).
*   **Lợi ích**: Giúp giáo viên có cái nhìn toàn cảnh về cấu trúc môn học, dễ dàng phát hiện các phần kiến thức bị thiếu hoặc chồng chéo để tối ưu hóa bài giảng.

### 1.2. Tiền xử lý dữ liệu tài liệu thành Markdown (.md)
*   **Mô tả**: Khi giáo viên upload các file tài liệu định dạng thô như PDF, DOCX, hệ thống sẽ chạy một luồng tiền xử lý (Preprocessing) để chuyển đổi nội dung tài liệu thành định dạng cấu trúc **Markdown (.md)** sạch sẽ trước khi đưa vào dữ liệu huấn luyện của AI để sinh câu hỏi.
*   **Ảnh hưởng Database**: **Cập nhật cột trong bảng `documents`**.
    *   *Cách triển khai*: 
        *   Thêm cột `markdown_content TEXT` (hoặc lưu file `.md` đã chuyển đổi vào Supabase Storage và lưu link vào cột `markdown_file_url TEXT` trong bảng `documents`).
        *   Khi upload file, backend sử dụng thư viện như `PyPDF2`, `pdfplumber` hoặc các API chuyển đổi chuyên dụng để chuyển sang định dạng Markdown sạch (giữ nguyên cấu trúc tiêu đề `#`, `##`, bảng biểu và danh sách).
*   **Lợi ích**: Định dạng Markdown giúp cấu trúc dữ liệu cực kỳ rõ ràng, giúp AI hiểu sâu hơn về ngữ cảnh, nâng cao độ chính xác của câu hỏi MCQ được sinh ra lên tới **95%** và tránh hiện tượng AI sinh câu hỏi bị "ảo giác" (hallucination).

---

## 🎓 2. Các Tính năng dành cho Học sinh (Student)

### 2.1. Xem Sơ đồ tư duy môn học (View Subject Mindmap)
*   **Mô tả**: Học sinh có thể tương tác trực tiếp (phóng to, thu nhỏ, đóng/mở các nhánh) với Sơ đồ tư duy của môn học/chủ đề mà giáo viên đã tạo bằng AI.
*   **Ảnh hưởng Database**: **100% Tương thích (Không cần sửa DB)**.
    *   *Cách triển khai*: Frontend sử dụng các thư viện render Mindmap mạnh mẽ như `markmap-view` hoặc `reactflow` để hiển thị trực quan dữ liệu từ cột `subjects.mindmap_data` đã sinh sẵn từ trước.
*   **Lợi ích**: Giúp học sinh có cái nhìn khái quát, liên kết các chủ đề học tập một cách logic (Visual Learning) trước khi đi sâu vào ôn luyện trắc nghiệm.

### 2.2. Tổng hợp câu hỏi sai (Mistake Notebook / Sổ tay câu sai)
*   **Mô tả**: Tự động gom toàn bộ các câu hỏi học sinh làm sai ở các bài trắc nghiệm trước đó vào một không gian riêng để học sinh ôn luyện lại cho tới khi làm đúng.
*   **Ảnh hưởng Database**: **100% Tương thích (Không cần sửa DB)**.
    *   *Cách triển khai*: Gọi API lấy danh sách câu hỏi từ bảng `student_answers` có điều kiện `student_answers.is_correct = false` của học sinh đó.

### 2.3. Báo lỗi câu hỏi (Question Feedback / Report)
*   **Mô tả**: Học sinh có thể cắm cờ báo cáo 🚩 các câu hỏi AI sinh bị sai đáp án hoặc không rõ nghĩa trực tiếp khi đang làm bài.
*   **Ảnh hưởng Database**: **Thêm 1 bảng mới (`question_reports`)** để lưu thông tin báo lỗi câu hỏi từ học sinh, giúp giáo viên phê duyệt lại.

### 2.4. Thẻ ghi nhớ học nhanh (Flashcards - Quizlet-style)
*   **Mô tả**: Chuyển đổi các câu hỏi trắc nghiệm thành dạng thẻ lật mặt (mặt trước là câu hỏi, mặt sau hiển thị đáp án đúng và giải thích chi tiết) giúp ôn tập nhanh không tính giờ.
*   **Ảnh hưởng Database**: **100% Tương thích**. Xử lý hiệu ứng lật thẻ 3D hoàn toàn ở Frontend.

### 2.5. Chuỗi ngày học tập (Study Streak)
*   **Mô tả**: Thống kê số ngày liên tiếp học sinh vào ứng dụng ôn luyện để giữ lửa Streak giống Duolingo.
*   **Ảnh hưởng Database**: Thêm 2 cột nhẹ `study_streak` (INT) và `last_active_date` (DATE) vào bảng `users`.

### 2.6. Nhiệm vụ hàng ngày (Daily Quests)
*   **Mô tả**: Cung cấp nhiệm vụ hàng ngày ngẫu nhiên để học sinh hoàn thành nhận điểm XP.
*   **Ảnh hưởng Database & Hiệu năng (Cập nhật lũy tiến)**:
    *   Thêm cột `today_correct_answers` (INT), `today_completed_attempts` (INT) vào bảng `users` để cộng dồn trực tiếp khi học sinh nộp bài, **tránh triệt để việc truy vấn lịch sử DB**, tối ưu hiệu năng hệ thống lên mức tuyệt đối.

### 2.7. Gia sư học tập AI (AI Study Buddy)
*   **Mô tả**: Thêm nút "Hỏi Gia sư AI" giúp học sinh chat trực tiếp với AI để giải đáp sâu hơn về các câu hỏi vừa làm sai.
*   **Ảnh hưởng Database**: **100% Tương thích**. Gọi API tích hợp OpenAI/Gemini ở Backend.

---

## 🛠️ 3. Lộ trình phát triển đề xuất (Roadmap cập nhật)

| Giai đoạn | Tính năng cần làm | Vai trò | Độ khó kỹ thuật | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | **Tiền xử lý tài liệu thành Markdown (.md)** | Teacher | Trung bình | **CRITICAL (Bắt buộc)** |
| **Giai đoạn 2** | **Tổng hợp câu hỏi sai (Mistake Notebook)** | Student | Dễ | **HIGH** |
| **Giai đoạn 3** | **Sinh & Xem Sơ đồ tư duy (Mindmap)** | Teacher/Student | Trung bình | **HIGH** |
| **Giai đoạn 4** | **Báo lỗi câu hỏi (Question Report)** | Student -> Teacher | Trung bình | **HIGH** |
| **Giai đoạn 5** | **Thẻ ghi nhớ Flashcards & Chuỗi ngày học** | Student | Dễ | **MEDIUM** |
| **Giai đoạn 6** | **Nhiệm vụ hàng ngày (Daily Quests - Lũy tiến)** | Student | Trung bình | **MEDIUM** |