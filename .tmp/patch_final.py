
# -*- coding: utf-8 -*-
import io
fp = r"C:\Users\TOAN PHUC\Desktop\Documents\TTCS\Quizi-fy\Xác định yêu cầu nghiệp vụ (bản sửa).md"
with io.open(fp, "r", encoding="utf-8") as fh:
    s = fh.read()

pairs = [
["phân phối mức độ khó tổng số câu theo từng mức khó phải bằng tổng số câu yêu cầu; nếu dùng tỷ lệ phần trăm thì tổng phải bằng 100 và phạm vi nội dung (phạm vi nội dung, tối đa 4000 ký tự)", "phân phối mức độ khó (tổng số câu theo từng mức khó phải bằng tổng số câu yêu cầu; nếu dùng tỷ lệ phần trăm thì tổng phải bằng 100) và phạm vi nội dung (tối đa 4000 ký tự)"],
["Hệ thống xử lý bất đồng bộ qua hàng đợi xử lý bất đồng bộ.", "Hệ thống xử lý bất đồng bộ qua hàng đợi."],
["Khi gửi API, giao diện chỉ truyền subject_id, num_questions, difficulty.", "Khi gửi API, giao diện chỉ truyền mã môn học, số lượng câu và mức độ khó."],
["Tương ứng StudentPracticeSetup.tsx và studentApi.ts", "Tương ứng trang thiết lập đề ôn và API học sinh"],
["Cần sửa practice_set_service.generate_practice_set", "Cần sửa hàm sinh đề ôn của phía máy chủ"],
["Trạng thái: đã nộp hoặc quá giờ nếu quá time_limit + 60s gia hạn.", "Trạng thái: đã nộp (nộp đúng hạn) hoặc quá giờ (vượt thời gian quy định thêm 60 giây gia hạn)."],
["Chỉ xem được khi attempt đã submitted/timeout.", "Chỉ xem được khi lượt làm bài đã nộp hoặc đã quá giờ."],
["Nếu câu hỏi có phần giải thích (explanation) thì", "Nếu câu hỏi có phần giải thích thì"],
["Có thể xuất lịch sử ra PDF (exportStudentHistoryPdf).", "Có thể xuất lịch sử ra PDF."],
["Frontend kiểm tra mật khẩu mới tối thiểu 6 ký tự", "Giao diện kiểm tra mật khẩu mới tối thiểu 6 ký tự"],
["Frontend validate: bắt buộc nhập đủ 3 trường", "Giao diện kiểm tra: bắt buộc nhập đủ 3 trường"],
["Frontend validate: nhập đủ 3 trường", "Giao diện kiểm tra: nhập đủ 3 trường"],
["trạng thái draft/approved", "trạng thái nháp/đã duyệt"],
["Tương ứng schema num_questions ≤ 100", "Giới hạn số câu tối đa 100 mỗi lần"],
]
cnt = 0
miss = []
for old, new in pairs:
    if old in s:
        s = s.replace(old, new)
        cnt += 1
    else:
        miss.append(old[:50])

with io.open(fp, "w", encoding="utf-8", newline="") as fh:
    fh.write(s)
print("replaced:", cnt, "miss:", len(miss))
