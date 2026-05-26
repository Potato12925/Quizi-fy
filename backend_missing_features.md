# Báo cáo các chức năng nghiệp vụ còn thiếu trong Backend

Sau khi đối chiếu các nghiệp vụ trong file `TTCS.md` với các API hiện có trong thư mục `backend` (chủ yếu là các API CRUD cơ bản sinh tự động), dưới đây là danh sách **cụ thể các chức năng nghiệp vụ nâng cao (business logic)** còn đang thiếu cho từng đối tượng:

## 1. Nghiệp vụ của Giáo Viên (GV)

| Nghiệp vụ | Chi tiết chức năng (Logic) đang thiếu |
| :--- | :--- |
| **Thêm tài liệu (Upload)** | Chưa có API xử lý upload file vật lý. Cần xử lý các ràng buộc: Chỉ nhận PDF, DOCX, TXT, kiểm tra file rỗng, dung lượng < 20MB, kiểm tra trùng lặp nội dung/tên. |
| **Xóa/Ẩn tài liệu** | API xóa hiện tại chỉ là xóa cứng (delete cơ bản). Cần xử lý logic: Nếu tài liệu đã được tạo câu hỏi thì không xóa vĩnh viễn mà chỉ **chuyển sang trạng thái ẩn/khóa**. |
| **Gửi yêu cầu AI tạo câu hỏi** | `ai_request_controller` chỉ mới có Create record. Thiếu API để thực sự **gửi file và tham số** (số lượng, độ khó, phạm vi nội dung) cho mô hình AI xử lý, và API webhook để nhận kết quả từ AI. |
| **Duyệt câu hỏi** | Thiếu API riêng (VD: `/approve`) để giáo viên kiểm duyệt câu hỏi nháp (AI sinh hoặc tạo thủ công). Khi duyệt thành công phải tự động đánh dấu để lưu vào **Ngân hàng câu hỏi**. |
| **Đổi mật khẩu / Quên mật khẩu** | `auth_controller` và `user_controller` hiện chưa có API đổi mật khẩu cho người dùng đã đăng nhập (buộc đổi khi đăng nhập lần đầu) hoặc xử lý yêu cầu cấp lại mật khẩu. |
| **Tra cứu tài liệu/câu hỏi** | Các hàm Get List hiện chưa hỗ trợ lọc phức tạp (theo môn học, độ khó, trạng thái duyệt, từ khóa) theo yêu cầu phân quyền của giáo viên (chỉ thấy môn mình phụ trách). |

## 2. Nghiệp vụ của Học Sinh (HS)

| Nghiệp vụ | Chi tiết chức năng (Logic) đang thiếu |
| :--- | :--- |
| **Yêu cầu sinh đề ôn tập** | `practice_set_controller` chưa có hàm **sinh đề thi ngẫu nhiên**. Thiếu logic tự động bốc đủ số lượng câu hỏi từ ngân hàng câu hỏi (đã duyệt) theo tiêu chí môn học, độ khó, chủ đề mà học sinh chọn. |
| **Nộp bài & Chấm điểm tự động** | API submit hiện tại chỉ lưu record. Thiếu logic **chấm bài tự động**: ghi nhận thời gian nộp, đối chiếu đáp án, tính số câu đúng/sai, tính điểm tổng kết và lưu thành lịch sử ôn tập riêng biệt. |
| **Xem kết quả & Giải thích** | Thiếu API trả về chi tiết kết quả sau khi nộp (bao gồm câu hỏi, đáp án học sinh chọn, đáp án đúng và lời giải thích chi tiết). |
| **Tra cứu lớp / Môn học** | Thiếu API trả về **chỉ các môn/lớp** mà học sinh đó đã được Admin phân công và đang trong trạng thái Active. |
| **Lưu nháp câu trả lời** | Cần API cho phép lưu nháp từng câu trả lời trong quá trình làm bài để tránh mất dữ liệu khi rớt mạng (Autosave). |

## 3. Nghiệp vụ của Admin (AD)

| Nghiệp vụ | Chi tiết chức năng (Logic) đang thiếu |
| :--- | :--- |
| **Tạo tài khoản hàng loạt (HS/GV)**| Hiện tại chỉ có API tạo từng user. Thiếu API tạo tài khoản hàng loạt tương ứng với sĩ số và tự động set mật khẩu mặc định `123456`. |
| **Sao lưu (Backup) & Phục hồi (Restore)** | `database_controller` hiện chỉ có test connection. Thiếu API thực thi backup database (thành file/log) và API phục hồi database dựa trên một bản backup cũ. |
| **Xóa an toàn (Soft delete phức tạp)**| Khi Admin xóa lớp, xóa môn học, hoặc xóa học sinh: Cần logic kiểm tra xem lớp/môn/học sinh đã phát sinh dữ liệu (lịch sử ôn tập, câu hỏi) chưa. Nếu có thì chỉ được **chuyển trạng thái sang inactive/khóa**, thay vì xóa hoàn toàn. |
| **Gỡ / Phân công giáo viên** | Thiếu kiểm tra ràng buộc: Khi gỡ một giáo viên khỏi lớp, phải kiểm tra xem giáo viên đó có đang phụ trách môn nào không. Nếu có thì bắt buộc phải chuyển phân công trước khi gỡ. |
| **Xuất báo cáo tổng quan** | Thiếu API thống kê (Analytics) tính tổng số lượng học sinh, môn học, điểm trung bình của toàn hệ thống/lớp học và API hỗ trợ **kết xuất (export) ra định dạng file** báo cáo. |

> [!WARNING]
> Hầu hết các controllers hiện tại trong Backend đều chỉ là **Boilerplate CRUD sinh tự động**. Để hệ thống hoạt động thực tế đúng như bảng quy định trong `TTCS.md`, bạn cần triển khai thêm phần logic nghiệp vụ vào các files trong thư mục `services` và khai báo các Endpoints đặc thù trong các `controllers`.
