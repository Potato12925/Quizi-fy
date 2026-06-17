from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from core.supabase import SupabaseManager, run_supabase_execute


PASSWORD_HASH = "$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO"


# (username, full_name, is_active, must_change_password)
USERS = [
    ("admin", "Nguyen Van Quan", True, False),
    ("teacher01", "Nguyen Minh Duc", True, False),
    ("teacher02", "Tran Thi Thu Ha", True, False),
    ("teacher03", "Le Hoang Anh", True, False),
    ("teacher04", "Pham Quoc Bao", True, False),
    ("teacher05", "Do Thi Ngoc Lan", True, False),
    ("teacher06", "Vo Minh Tuan", True, False),
    ("teacher07", "Bui Thi Thanh Van", True, False),
    ("teacher08", "Dang Gia Han", True, False),
    ("teacher09", "Hoang Phuong Linh", True, False),
    ("teacher10", "Nguyen Duc Huy", True, False),
    ("student01", "Nguyen Minh Anh", True, False),
    ("student02", "Tran Gia Han", True, False),
    ("student03", "Le Quoc Bao", True, False),
    ("student04", "Pham Thu Uyen", True, False),
    ("student05", "Doan Thanh Dat", True, False),
    ("student06", "Vo Ngoc Mai", True, False),
    ("student07", "Bui Tuan Kiet", True, False),
    ("student08", "Dang Khanh Linh", True, False),
    ("student09", "Hoang Minh Khang", True, False),
    ("student10", "Nguyen Thu Trang", True, False),
    ("student11", "Tran Gia Bao", True, False),
    ("student12", "Le Thanh Nhan", True, False),
    ("student13", "Pham Bao Chau", True, False),
    ("student14", "Do Minh Quan", True, False),
    ("student15", "Vo Thu Hien", True, False),
    ("student16", "Bui Gia Huy", True, False),
    ("student17", "Dang Minh Tam", True, False),
    ("student18", "Hoang Khai Nguyen", True, False),
    ("student19", "Nguyen Yen Nhi", True, False),
    ("student20", "Tran Duc Anh", True, False),
    ("student21", "Le Minh Tri", True, False),
    ("student22", "Pham Quynh Anh", True, False),
    ("student23", "Do Gia Bao", True, False),
    ("student24", "Vo Thao Nhi", True, False),
    ("student25", "Bui Quoc An", True, False),
    ("student26", "Dang Thu Phuong", True, False),
    ("student27", "Hoang Nhat Minh", True, False),
    ("student28", "Nguyen Thanh Truc", True, False),
    ("student29", "Tran Minh Khoa", True, False),
    ("student30", "Le Thu Ha", True, False),
    ("student31", "Pham Tien Dat", True, False),
    ("student32", "Do Khanh Vy", True, False),
    ("student33", "Vo Minh Chau", True, False),
    ("student34", "Bui Anh Thu", True, False),
    ("student35", "Dang Quoc Viet", True, False),
    ("student36", "Hoang Gia Linh", True, False),
]

# (role_code, role_name, description)
ROLES = [
    ("admin", "Administrator", "System administrator"),
    ("teacher", "Teacher", "Teacher role"),
    ("student", "Student", "Student role"),
]

# (class_code, class_name, description, homeroom_teacher_username)
CLASSES = [
    ("10A1", "Lớp 10A1", "Lớp 10A1 khối Khoa học tự nhiên", "teacher01"),
    ("10A2", "Lớp 10A2", "Lớp 10A2 khối Khoa học xã hội", "teacher02"),
    ("11A1", "Lớp 11A1", "Lớp 11A1 định hướng tự nhiên", "teacher03"),
    ("11A2", "Lớp 11A2", "Lớp 11A2 định hướng xã hội", "teacher04"),
    ("12A1", "Lớp 12A1", "Lớp 12A1 ôn thi tốt nghiệp", "teacher05"),
    ("12A2", "Lớp 12A2", "Lớp 12A2 ôn thi tốt nghiệp", "teacher06"),
]

# (subject_code, subject_name, description)
SUBJECTS = [
    ("TOAN", "Toán", "Môn Toán trung học phổ thông"),
    ("VAN", "Ngữ văn", "Môn Ngữ văn trung học phổ thông"),
    ("ANH", "Tiếng Anh", "Môn Tiếng Anh trung học phổ thông"),
    ("LY", "Vật lý", "Môn Vật lý trung học phổ thông"),
    ("HOA", "Hóa học", "Môn Hóa học trung học phổ thông"),
    ("SINH", "Sinh học", "Môn Sinh học trung học phổ thông"),
    ("SU", "Lịch sử", "Môn Lịch sử trung học phổ thông"),
    ("DIA", "Địa lý", "Môn Địa lý trung học phổ thông"),
    ("GDCD", "Giáo dục kinh tế và pháp luật", "Môn Giáo dục kinh tế và pháp luật"),
    ("TIN", "Tin học", "Môn Tin học trung học phổ thông"),
]

# (class_code, teacher_username)
CLASS_TEACHERS = [
    ("10A1", "teacher01"),
    ("10A2", "teacher02"),
    ("11A1", "teacher03"),
    ("11A2", "teacher04"),
    ("12A1", "teacher05"),
    ("12A2", "teacher06"),
]

# (class_code, subject_code, assigned_teacher_username)
CLASS_SUBJECTS = [
    ("10A1", "TOAN", "teacher01"),
    ("10A1", "VAN", "teacher02"),
    ("10A1", "ANH", "teacher03"),
    ("10A1", "LY", "teacher04"),
    ("10A1", "HOA", "teacher05"),
    ("10A1", "SINH", "teacher06"),
    ("10A1", "SU", "teacher07"),
    ("10A1", "DIA", "teacher08"),
    ("10A1", "GDCD", "teacher09"),
    ("10A1", "TIN", "teacher10"),
    ("10A2", "TOAN", "teacher01"),
    ("10A2", "VAN", "teacher02"),
    ("10A2", "ANH", "teacher03"),
    ("10A2", "LY", "teacher04"),
    ("10A2", "HOA", "teacher05"),
    ("10A2", "SINH", "teacher06"),
    ("10A2", "SU", "teacher07"),
    ("10A2", "DIA", "teacher08"),
    ("10A2", "GDCD", "teacher09"),
    ("10A2", "TIN", "teacher10"),
    ("11A1", "TOAN", "teacher01"),
    ("11A1", "VAN", "teacher02"),
    ("11A1", "ANH", "teacher03"),
    ("11A1", "LY", "teacher04"),
    ("11A1", "HOA", "teacher05"),
    ("11A1", "SINH", "teacher06"),
    ("11A1", "SU", "teacher07"),
    ("11A1", "DIA", "teacher08"),
    ("11A1", "GDCD", "teacher09"),
    ("11A1", "TIN", "teacher10"),
    ("11A2", "TOAN", "teacher01"),
    ("11A2", "VAN", "teacher02"),
    ("11A2", "ANH", "teacher03"),
    ("11A2", "LY", "teacher04"),
    ("11A2", "HOA", "teacher05"),
    ("11A2", "SINH", "teacher06"),
    ("11A2", "SU", "teacher07"),
    ("11A2", "DIA", "teacher08"),
    ("11A2", "GDCD", "teacher09"),
    ("11A2", "TIN", "teacher10"),
    ("12A1", "TOAN", "teacher01"),
    ("12A1", "VAN", "teacher02"),
    ("12A1", "ANH", "teacher03"),
    ("12A1", "LY", "teacher04"),
    ("12A1", "HOA", "teacher05"),
    ("12A1", "SINH", "teacher06"),
    ("12A1", "SU", "teacher07"),
    ("12A1", "DIA", "teacher08"),
    ("12A1", "GDCD", "teacher09"),
    ("12A1", "TIN", "teacher10"),
    ("12A2", "TOAN", "teacher01"),
    ("12A2", "VAN", "teacher02"),
    ("12A2", "ANH", "teacher03"),
    ("12A2", "LY", "teacher04"),
    ("12A2", "HOA", "teacher05"),
    ("12A2", "SINH", "teacher06"),
    ("12A2", "SU", "teacher07"),
    ("12A2", "DIA", "teacher08"),
    ("12A2", "GDCD", "teacher09"),
    ("12A2", "TIN", "teacher10"),
]

# (topic_key, class_code, subject_code, topic_name, description)
TOPICS = [
    ("TOPIC_10A1_TOAN_HAM_SO_BAC_HAI", "10A1", "TOAN", "Hàm số bậc hai", "Khảo sát đồ thị và xét dấu tam thức bậc hai"),
    ("TOPIC_10A1_TOAN_PT_HE_PT_BAC_NHAT", "10A1", "TOAN", "Phương trình và hệ phương trình bậc nhất", "Giải phương trình và hệ phương trình cơ bản"),
    ("TOPIC_10A1_VAN_TRUYEN_NGAN_HIEN_DAI", "10A1", "VAN", "Truyện ngắn Việt Nam hiện đại", "Tìm hiểu tác phẩm truyện ngắn Việt Nam hiện đại"),
    ("TOPIC_10A1_ANH_TENSES", "10A1", "ANH", "Tenses", "Ôn tập các thì cơ bản trong tiếng Anh"),
    ("TOPIC_10A1_LY_DONG_HOC_CHAT_DIEM", "10A1", "LY", "Động học chất điểm", "Vận tốc, quãng đường và chuyển động thẳng"),
    ("TOPIC_10A1_HOA_CAU_TAO_NGUYEN_TU", "10A1", "HOA", "Cấu tạo nguyên tử", "Thành phần cấu tạo nguyên tử và lớp electron"),
    ("TOPIC_11A1_TOAN_DAO_HAM", "11A1", "TOAN", "Đạo hàm", "Khái niệm đạo hàm và quy tắc tính đạo hàm"),
    ("TOPIC_11A1_VAN_THO_MOI", "11A1", "VAN", "Thơ mới", "Đặc điểm nội dung và nghệ thuật phong trào Thơ mới"),
    ("TOPIC_11A1_ANH_PASSIVE_VOICE", "11A1", "ANH", "Passive Voice", "Câu bị động trong các thì tiếng Anh"),
    ("TOPIC_11A1_LY_DAO_DONG_DIEU_HOA", "11A1", "LY", "Dao động điều hòa", "Li độ, biên độ, chu kì và tần số"),
    ("TOPIC_11A1_HOA_OXI_HOA_KHU", "11A1", "HOA", "Phản ứng oxi hóa khử", "Xác định số oxi hóa và cân bằng phản ứng"),
    ("TOPIC_11A1_SINH_ADN_GEN", "11A1", "SINH", "ADN và gen", "Cấu trúc ADN và chức năng của gen"),
    ("TOPIC_11A2_TOAN_CAP_SO", "11A2", "TOAN", "Cấp số cộng và cấp số nhân", "Tính số hạng tổng quát và tổng n số hạng"),
    ("TOPIC_11A2_VAN_NGHI_LUAN_XA_HOI", "11A2", "VAN", "Nghị luận xã hội", "Kĩ năng viết đoạn và bài văn nghị luận xã hội"),
    ("TOPIC_11A2_ANH_CONDITIONAL", "11A2", "ANH", "Conditional Sentences", "Câu điều kiện loại 1, 2 và 3"),
    ("TOPIC_11A2_TIN_HAM_BANG_TINH", "11A2", "TIN", "Hàm trong bảng tính", "Sử dụng SUM, AVERAGE, IF trong bảng tính"),
    ("TOPIC_12A1_TOAN_TICH_PHAN", "12A1", "TOAN", "Tích phân", "Khái niệm tích phân và các công thức cơ bản"),
    ("TOPIC_12A1_VAN_TRUYEN_HIEN_DAI", "12A1", "VAN", "Ôn tập truyện hiện đại Việt Nam", "Ôn tập Vợ nhặt, Rừng xà nu và Chiếc thuyền ngoài xa"),
    ("TOPIC_12A1_SU_1945_1975", "12A1", "SU", "Việt Nam giai đoạn 1945-1975", "Những mốc lịch sử quan trọng sau Cách mạng tháng Tám"),
    ("TOPIC_12A1_DIA_KINH_TE_VIET_NAM", "12A1", "DIA", "Địa lý kinh tế Việt Nam", "Cơ cấu ngành kinh tế và các vùng kinh tế trọng điểm"),
    ("TOPIC_12A1_GDCD_QUYEN_NGHIA_VU", "12A1", "GDCD", "Quyền và nghĩa vụ công dân", "Quyền chính trị, quyền tự do cơ bản và nghĩa vụ công dân"),
    ("TOPIC_12A2_TOAN_UNG_DUNG_TICH_PHAN", "12A2", "TOAN", "Ứng dụng tích phân", "Tính diện tích hình phẳng bằng tích phân"),
    ("TOPIC_12A2_ANH_READING", "12A2", "ANH", "Reading Comprehension", "Kĩ năng đọc hiểu và xác định ý chính"),
    ("TOPIC_12A2_HOA_ESTE_LIPIT", "12A2", "HOA", "Este - lipit", "Khái niệm, tính chất và ứng dụng của este, lipit"),
    ("TOPIC_12A2_SINH_DI_TRUYEN_QUAN_THE", "12A2", "SINH", "Di truyền quần thể", "Cấu trúc di truyền và cân bằng Hardy-Weinberg"),
]

# (class_code, student_username)
CLASS_STUDENTS = [
    ("10A1", "student01"),
    ("10A1", "student02"),
    ("10A1", "student03"),
    ("10A1", "student04"),
    ("10A1", "student05"),
    ("10A1", "student06"),
    ("10A2", "student07"),
    ("10A2", "student08"),
    ("10A2", "student09"),
    ("10A2", "student10"),
    ("10A2", "student11"),
    ("10A2", "student12"),
    ("11A1", "student13"),
    ("11A1", "student14"),
    ("11A1", "student15"),
    ("11A1", "student16"),
    ("11A1", "student17"),
    ("11A1", "student18"),
    ("11A2", "student19"),
    ("11A2", "student20"),
    ("11A2", "student21"),
    ("11A2", "student22"),
    ("11A2", "student23"),
    ("11A2", "student24"),
    ("12A1", "student25"),
    ("12A1", "student26"),
    ("12A1", "student27"),
    ("12A1", "student28"),
    ("12A1", "student29"),
    ("12A1", "student30"),
    ("12A2", "student31"),
    ("12A2", "student32"),
    ("12A2", "student33"),
    ("12A2", "student34"),
    ("12A2", "student35"),
    ("12A2", "student36"),
]

# (teacher_username, title, description, file_url, file_hash, file_type, file_size)
DOCUMENTS = [
    (
        "teacher01",
        "Chuyên đề Hàm số bậc hai",
        "Tài liệu hệ thống lại kiến thức về đồ thị và trục đối xứng của hàm số bậc hai.",
        "https://example.com/docs/chuyen-de-ham-so-bac-hai.pdf",
        "hash_thpt_doc_001",
        "pdf",
        2048000,
    ),
    (
        "teacher01",
        "Bài tập Đạo hàm lớp 11",
        "Tuyển chọn bài tập cơ bản và nâng cao về đạo hàm dành cho học sinh lớp 11.",
        "https://example.com/docs/bai-tap-dao-ham-lop-11.pdf",
        "hash_thpt_doc_002",
        "pdf",
        1982464,
    ),
    (
        "teacher01",
        "Ôn tập Tích phân 12",
        "Tóm tắt công thức và bài tập vận dụng về tích phân cho học sinh lớp 12.",
        "https://example.com/docs/on-tap-tich-phan-12.pdf",
        "hash_thpt_doc_003",
        "pdf",
        2150400,
    ),
    (
        "teacher02",
        "Tổng ôn Truyện ngắn Việt Nam hiện đại",
        "Tài liệu ôn tập các tác phẩm truyện ngắn trọng tâm trong chương trình THPT.",
        "https://example.com/docs/tong-on-truyen-ngan-viet-nam-hien-dai.pdf",
        "hash_thpt_doc_004",
        "pdf",
        2523136,
    ),
    (
        "teacher02",
        "Chuyên đề Thơ mới lớp 11",
        "Phân tích đặc điểm nghệ thuật và cảm hứng của phong trào Thơ mới.",
        "https://example.com/docs/chuyen-de-tho-moi-lop-11.pdf",
        "hash_thpt_doc_005",
        "pdf",
        1769472,
    ),
    (
        "teacher03",
        "Ngữ pháp Tiếng Anh THPT",
        "Hệ thống kiến thức về các thì cơ bản trong chương trình tiếng Anh THPT.",
        "https://example.com/docs/ngu-phap-tieng-anh-thpt.pdf",
        "hash_thpt_doc_006",
        "pdf",
        1843200,
    ),
    (
        "teacher03",
        "Câu bị động và câu điều kiện",
        "Tài liệu luyện tập câu bị động và câu điều kiện cho học sinh lớp 11.",
        "https://example.com/docs/cau-bi-dong-va-cau-dieu-kien.pdf",
        "hash_thpt_doc_007",
        "pdf",
        1933312,
    ),
    (
        "teacher03",
        "Kỹ năng Reading Comprehension 12",
        "Hướng dẫn cách đọc hiểu đoạn văn tiếng Anh và làm bài trắc nghiệm hiệu quả.",
        "https://example.com/docs/ky-nang-reading-comprehension-12.pdf",
        "hash_thpt_doc_008",
        "pdf",
        2015232,
    ),
    (
        "teacher04",
        "Chuyên đề Động học chất điểm",
        "Tài liệu Vật lý 10 về chuyển động thẳng đều và các đại lượng đặc trưng.",
        "https://example.com/docs/chuyen-de-dong-hoc-chat-diem.pdf",
        "hash_thpt_doc_009",
        "pdf",
        2097152,
    ),
    (
        "teacher04",
        "Chuyên đề Dao động điều hòa",
        "Tài liệu Vật lý 11 về dao động điều hòa và phương trình dao động.",
        "https://example.com/docs/chuyen-de-dao-dong-dieu-hoa.pdf",
        "hash_thpt_doc_010",
        "pdf",
        2202009,
    ),
    (
        "teacher05",
        "Cấu tạo nguyên tử và bảng tuần hoàn",
        "Tóm tắt lý thuyết Hóa học 10 về cấu tạo nguyên tử và bảng tuần hoàn.",
        "https://example.com/docs/cau-tao-nguyen-tu-va-bang-tuan-hoan.pdf",
        "hash_thpt_doc_011",
        "pdf",
        1887436,
    ),
    (
        "teacher06",
        "ADN và gen cơ bản",
        "Tài liệu Sinh học 11 về cấu trúc ADN, gen và mã di truyền.",
        "https://example.com/docs/adn-va-gen-co-ban.pdf",
        "hash_thpt_doc_012",
        "pdf",
        1945600,
    ),
    (
        "teacher07",
        "Lịch sử Việt Nam 1945-1975",
        "Tài liệu ôn tập các sự kiện tiêu biểu của lịch sử Việt Nam giai đoạn 1945-1975.",
        "https://example.com/docs/lich-su-viet-nam-1945-1975.pdf",
        "hash_thpt_doc_013",
        "pdf",
        2260992,
    ),
    (
        "teacher08",
        "Địa lý kinh tế Việt Nam",
        "Chuyên đề Địa lý 12 về cơ cấu ngành và các vùng kinh tế trọng điểm.",
        "https://example.com/docs/dia-ly-kinh-te-viet-nam.pdf",
        "hash_thpt_doc_014",
        "pdf",
        2113536,
    ),
    (
        "teacher09",
        "Quyền và nghĩa vụ công dân",
        "Tài liệu GDCD 12 về quyền chính trị, quyền tự do cơ bản và nghĩa vụ công dân.",
        "https://example.com/docs/quyen-va-nghia-vu-cong-dan.pdf",
        "hash_thpt_doc_015",
        "pdf",
        1703936,
    ),
    (
        "teacher10",
        "Tin học bảng tính cơ bản",
        "Tài liệu Tin học 11 hướng dẫn sử dụng các hàm cơ bản trong bảng tính.",
        "https://example.com/docs/tin-hoc-bang-tinh-co-ban.pdf",
        "hash_thpt_doc_016",
        "pdf",
        1622016,
    ),
]

# (document_title, topic_key)
DOCUMENT_TOPICS = [
    ("Chuyên đề Hàm số bậc hai", "TOPIC_10A1_TOAN_HAM_SO_BAC_HAI"),
    ("Bài tập Đạo hàm lớp 11", "TOPIC_11A1_TOAN_DAO_HAM"),
    ("Ôn tập Tích phân 12", "TOPIC_12A1_TOAN_TICH_PHAN"),
    ("Tổng ôn Truyện ngắn Việt Nam hiện đại", "TOPIC_10A1_VAN_TRUYEN_NGAN_HIEN_DAI"),
    ("Chuyên đề Thơ mới lớp 11", "TOPIC_11A1_VAN_THO_MOI"),
    ("Ngữ pháp Tiếng Anh THPT", "TOPIC_10A1_ANH_TENSES"),
    ("Câu bị động và câu điều kiện", "TOPIC_11A2_ANH_CONDITIONAL"),
    ("Kỹ năng Reading Comprehension 12", "TOPIC_12A2_ANH_READING"),
    ("Chuyên đề Động học chất điểm", "TOPIC_10A1_LY_DONG_HOC_CHAT_DIEM"),
    ("Chuyên đề Dao động điều hòa", "TOPIC_11A1_LY_DAO_DONG_DIEU_HOA"),
    ("Cấu tạo nguyên tử và bảng tuần hoàn", "TOPIC_10A1_HOA_CAU_TAO_NGUYEN_TU"),
    ("ADN và gen cơ bản", "TOPIC_11A1_SINH_ADN_GEN"),
    ("Lịch sử Việt Nam 1945-1975", "TOPIC_12A1_SU_1945_1975"),
    ("Địa lý kinh tế Việt Nam", "TOPIC_12A1_DIA_KINH_TE_VIET_NAM"),
    ("Quyền và nghĩa vụ công dân", "TOPIC_12A1_GDCD_QUYEN_NGHIA_VU"),
    ("Tin học bảng tính cơ bản", "TOPIC_11A2_TIN_HAM_BANG_TINH"),
]

# (
#   document_title,
#   num_questions,
#   difficulty,
#   content_scope,
#   status,
#   generated_question_count,
#   retry_count,
#   error_message,
#   is_reviewed,
# )
AI_REQUESTS = [
    ("Chuyên đề Hàm số bậc hai", 10, "easy", "Phần khái niệm và đồ thị", "completed", 10, 0, None, True),
    ("Bài tập Đạo hàm lớp 11", 8, "medium", "Các bài tập tính đạo hàm cơ bản", "completed", 8, 0, None, True),
    ("Ôn tập Tích phân 12", 8, "medium", "Công thức cơ bản và bài tập đơn giản", "processing", 4, 1, None, False),
    ("Tổng ôn Truyện ngắn Việt Nam hiện đại", 12, "medium", "Các tác phẩm trọng tâm lớp 12", "completed", 12, 0, None, True),
    ("Ngữ pháp Tiếng Anh THPT", 10, "easy", "Các thì tiếng Anh cơ bản", "completed", 10, 0, None, True),
    ("Câu bị động và câu điều kiện", 12, "medium", "Câu điều kiện và cấu trúc biến đổi", "completed", 12, 1, None, True),
    ("Chuyên đề Dao động điều hòa", 8, "hard", "Phương trình và đại lượng dao động", "failed", 3, 2, "LLM generated malformed options", False),
    ("Cấu tạo nguyên tử và bảng tuần hoàn", 6, "easy", "Lý thuyết nền tảng hóa học 10", "completed", 6, 0, None, True),
    ("Lịch sử Việt Nam 1945-1975", 9, "medium", "Sự kiện nổi bật sau Cách mạng tháng Tám", "pending", 0, 0, None, False),
    ("Địa lý kinh tế Việt Nam", 7, "medium", "Các vùng kinh tế và cơ cấu ngành", "cancelled", 0, 0, "Cancelled by teacher", False),
]

# (
#   question_key,
#   teacher_username,
#   document_title,
#   content,
#   difficulty,
#   source,
#   status,
#   explanation,
# )
QUESTIONS = [
    (
        "Q_TOAN_HAM_SO_01",
        "teacher01",
        "Chuyên đề Hàm số bậc hai",
        "Đồ thị của hàm số y = ax^2 + bx + c (a ≠ 0) là đường gì?",
        "easy",
        "ai",
        "approved",
        "Đồ thị của hàm số bậc hai luôn là một parabol.",
    ),
    (
        "Q_TOAN_HAM_SO_02",
        "teacher01",
        "Chuyên đề Hàm số bậc hai",
        "Với hàm số y = ax^2 + bx + c, trục đối xứng của parabol có dạng nào?",
        "medium",
        "manual",
        "approved",
        "Trục đối xứng của parabol có phương trình x = -b / (2a).",
    ),
    (
        "Q_TOAN_DAO_HAM_01",
        "teacher01",
        "Bài tập Đạo hàm lớp 11",
        "Đạo hàm của hàm số y = x^3 là gì?",
        "easy",
        "ai",
        "approved",
        "Áp dụng quy tắc đạo hàm của lũy thừa, ta được y' = 3x^2.",
    ),
    (
        "Q_TOAN_TICH_PHAN_01",
        "teacher01",
        "Ôn tập Tích phân 12",
        "Giá trị của tích phân từ 0 đến 1 của hàm số x dx bằng bao nhiêu?",
        "medium",
        "manual",
        "approved",
        "Tích phân ∫0^1 x dx bằng 1/2.",
    ),
    (
        "Q_VAN_VO_NHAT_01",
        "teacher02",
        "Tổng ôn Truyện ngắn Việt Nam hiện đại",
        "Tác phẩm Vợ nhặt của Kim Lân viết về bối cảnh nào?",
        "medium",
        "manual",
        "approved",
        "Tác phẩm phản ánh nạn đói năm 1945 và khát vọng sống của con người.",
    ),
    (
        "Q_VAN_THO_MOI_01",
        "teacher02",
        "Chuyên đề Thơ mới lớp 11",
        "Phong trào Thơ mới ở Việt Nam phát triển mạnh trong giai đoạn nào?",
        "medium",
        "ai",
        "approved",
        "Phong trào Thơ mới phát triển mạnh trong giai đoạn 1932-1945.",
    ),
    (
        "Q_ANH_PRESENT_PERFECT_01",
        "teacher03",
        "Ngữ pháp Tiếng Anh THPT",
        "Cấu trúc khẳng định của thì hiện tại hoàn thành là gì?",
        "easy",
        "ai",
        "approved",
        "Thì hiện tại hoàn thành có cấu trúc khẳng định là S + have/has + V3/ed.",
    ),
    (
        "Q_ANH_CONDITIONAL_01",
        "teacher03",
        "Câu bị động và câu điều kiện",
        "Trong câu điều kiện loại 2, mệnh đề if thường dùng thì nào?",
        "medium",
        "manual",
        "approved",
        "Câu điều kiện loại 2 dùng thì quá khứ đơn ở mệnh đề if.",
    ),
    (
        "Q_ANH_PASSIVE_01",
        "teacher03",
        "Câu bị động và câu điều kiện",
        "Trong câu bị động ở thì hiện tại đơn, cấu trúc đúng là gì?",
        "medium",
        "ai",
        "approved",
        "Cấu trúc bị động hiện tại đơn là am/is/are + V3/ed.",
    ),
    (
        "Q_ANH_READING_01",
        "teacher03",
        "Kỹ năng Reading Comprehension 12",
        "Để xác định ý chính của một đoạn văn tiếng Anh, học sinh nên làm gì trước tiên?",
        "easy",
        "manual",
        "approved",
        "Nên đọc câu chủ đề và các câu mở đầu, kết luận để xác định ý chính.",
    ),
    (
        "Q_LY_DONG_HOC_01",
        "teacher04",
        "Chuyên đề Động học chất điểm",
        "Đơn vị của vận tốc trong hệ SI là gì?",
        "easy",
        "ai",
        "approved",
        "Đơn vị chuẩn của vận tốc trong hệ SI là mét trên giây.",
    ),
    (
        "Q_LY_DAO_DONG_01",
        "teacher04",
        "Chuyên đề Dao động điều hòa",
        "Trong dao động điều hòa, li độ biến thiên theo hàm nào của thời gian?",
        "hard",
        "ai",
        "draft",
        "Li độ của dao động điều hòa biến thiên theo hàm sin hoặc cos của thời gian.",
    ),
    (
        "Q_HOA_NGUYEN_TU_01",
        "teacher05",
        "Cấu tạo nguyên tử và bảng tuần hoàn",
        "Hạt nhân nguyên tử được cấu tạo từ những hạt nào?",
        "easy",
        "manual",
        "approved",
        "Hạt nhân nguyên tử gồm proton và neutron.",
    ),
    (
        "Q_SINH_ADN_01",
        "teacher06",
        "ADN và gen cơ bản",
        "Gen là một đoạn của phân tử nào?",
        "easy",
        "ai",
        "approved",
        "Gen là một đoạn của phân tử ADN mang thông tin di truyền.",
    ),
    (
        "Q_SU_1945_01",
        "teacher07",
        "Lịch sử Việt Nam 1945-1975",
        "Cách mạng tháng Tám năm 1945 đã dẫn tới sự ra đời của nhà nước nào?",
        "medium",
        "manual",
        "approved",
        "Thắng lợi của Cách mạng tháng Tám dẫn tới sự ra đời của nước Việt Nam Dân chủ Cộng hòa.",
    ),
    (
        "Q_DIA_KINH_TE_01",
        "teacher08",
        "Địa lý kinh tế Việt Nam",
        "Vùng nào sau đây có thế mạnh nổi bật về cây công nghiệp lâu năm?",
        "medium",
        "ai",
        "approved",
        "Tây Nguyên có thế mạnh nổi bật về cây công nghiệp lâu năm như cà phê, cao su, hồ tiêu.",
    ),
    (
        "Q_GDCD_BAU_CU_01",
        "teacher09",
        "Quyền và nghĩa vụ công dân",
        "Công dân Việt Nam đủ bao nhiêu tuổi thì có quyền bầu cử?",
        "easy",
        "manual",
        "approved",
        "Theo quy định, công dân đủ 18 tuổi có quyền bầu cử.",
    ),
    (
        "Q_TIN_SUM_01",
        "teacher10",
        "Tin học bảng tính cơ bản",
        "Trong bảng tính, hàm SUM dùng để làm gì?",
        "easy",
        "ai",
        "approved",
        "Hàm SUM dùng để tính tổng các giá trị trong một vùng ô.",
    ),
]

# (question_key, option_label, option_text, is_correct, order_num)
QUESTION_OPTIONS = [
    ("Q_TOAN_HAM_SO_01", "A", "Đường thẳng", False, 1),
    ("Q_TOAN_HAM_SO_01", "B", "Parabol", True, 2),
    ("Q_TOAN_HAM_SO_01", "C", "Đường tròn", False, 3),
    ("Q_TOAN_HAM_SO_01", "D", "Hyperbol", False, 4),
    ("Q_TOAN_HAM_SO_02", "A", "x = b / (2a)", False, 1),
    ("Q_TOAN_HAM_SO_02", "B", "x = -b / (2a)", True, 2),
    ("Q_TOAN_HAM_SO_02", "C", "y = -b / (2a)", False, 3),
    ("Q_TOAN_HAM_SO_02", "D", "y = ax + b", False, 4),
    ("Q_TOAN_DAO_HAM_01", "A", "x^2", False, 1),
    ("Q_TOAN_DAO_HAM_01", "B", "3x", False, 2),
    ("Q_TOAN_DAO_HAM_01", "C", "3x^2", True, 3),
    ("Q_TOAN_DAO_HAM_01", "D", "x^3 / 3", False, 4),
    ("Q_TOAN_TICH_PHAN_01", "A", "1", False, 1),
    ("Q_TOAN_TICH_PHAN_01", "B", "1/2", True, 2),
    ("Q_TOAN_TICH_PHAN_01", "C", "2", False, 3),
    ("Q_TOAN_TICH_PHAN_01", "D", "0", False, 4),
    ("Q_VAN_VO_NHAT_01", "A", "Nạn đói năm 1945", True, 1),
    ("Q_VAN_VO_NHAT_01", "B", "Kháng chiến chống Mỹ", False, 2),
    ("Q_VAN_VO_NHAT_01", "C", "Cải cách ruộng đất", False, 3),
    ("Q_VAN_VO_NHAT_01", "D", "Đô thị hóa sau 1986", False, 4),
    ("Q_VAN_THO_MOI_01", "A", "1900-1930", False, 1),
    ("Q_VAN_THO_MOI_01", "B", "1932-1945", True, 2),
    ("Q_VAN_THO_MOI_01", "C", "1945-1954", False, 3),
    ("Q_VAN_THO_MOI_01", "D", "1954-1975", False, 4),
    ("Q_ANH_PRESENT_PERFECT_01", "A", "S + have/has + V3/ed", True, 1),
    ("Q_ANH_PRESENT_PERFECT_01", "B", "S + had + V3/ed", False, 2),
    ("Q_ANH_PRESENT_PERFECT_01", "C", "S + am/is/are + V-ing", False, 3),
    ("Q_ANH_PRESENT_PERFECT_01", "D", "S + do/does + V1", False, 4),
    ("Q_ANH_CONDITIONAL_01", "A", "Hiện tại đơn", False, 1),
    ("Q_ANH_CONDITIONAL_01", "B", "Quá khứ đơn", True, 2),
    ("Q_ANH_CONDITIONAL_01", "C", "Tương lai đơn", False, 3),
    ("Q_ANH_CONDITIONAL_01", "D", "Hiện tại hoàn thành", False, 4),
    ("Q_ANH_PASSIVE_01", "A", "am/is/are + V3/ed", True, 1),
    ("Q_ANH_PASSIVE_01", "B", "was/were + V3/ed", False, 2),
    ("Q_ANH_PASSIVE_01", "C", "have/has + been + V3/ed", False, 3),
    ("Q_ANH_PASSIVE_01", "D", "will be + V3/ed", False, 4),
    ("Q_ANH_READING_01", "A", "Dịch toàn bộ bài sang tiếng Việt", False, 1),
    ("Q_ANH_READING_01", "B", "Đọc câu chủ đề và câu mở đầu, kết luận", True, 2),
    ("Q_ANH_READING_01", "C", "Chỉ nhìn vào từ mới cuối bài", False, 3),
    ("Q_ANH_READING_01", "D", "Bỏ qua tiêu đề của đoạn văn", False, 4),
    ("Q_LY_DONG_HOC_01", "A", "km/h", False, 1),
    ("Q_LY_DONG_HOC_01", "B", "m/s", True, 2),
    ("Q_LY_DONG_HOC_01", "C", "N", False, 3),
    ("Q_LY_DONG_HOC_01", "D", "kg", False, 4),
    ("Q_LY_DAO_DONG_01", "A", "Hàm bậc nhất", False, 1),
    ("Q_LY_DAO_DONG_01", "B", "Hàm sin hoặc cos", True, 2),
    ("Q_LY_DAO_DONG_01", "C", "Hàm logarit", False, 3),
    ("Q_LY_DAO_DONG_01", "D", "Hàm mũ", False, 4),
    ("Q_HOA_NGUYEN_TU_01", "A", "Electron và proton", False, 1),
    ("Q_HOA_NGUYEN_TU_01", "B", "Proton và neutron", True, 2),
    ("Q_HOA_NGUYEN_TU_01", "C", "Electron và neutron", False, 3),
    ("Q_HOA_NGUYEN_TU_01", "D", "Chỉ gồm electron", False, 4),
    ("Q_SINH_ADN_01", "A", "Protein", False, 1),
    ("Q_SINH_ADN_01", "B", "ARN", False, 2),
    ("Q_SINH_ADN_01", "C", "ADN", True, 3),
    ("Q_SINH_ADN_01", "D", "Lipit", False, 4),
    ("Q_SU_1945_01", "A", "Cộng hòa xã hội chủ nghĩa Việt Nam", False, 1),
    ("Q_SU_1945_01", "B", "Việt Nam Dân chủ Cộng hòa", True, 2),
    ("Q_SU_1945_01", "C", "Liên bang Đông Dương", False, 3),
    ("Q_SU_1945_01", "D", "Quốc gia Việt Nam", False, 4),
    ("Q_DIA_KINH_TE_01", "A", "Tây Nguyên", True, 1),
    ("Q_DIA_KINH_TE_01", "B", "Đồng bằng sông Hồng", False, 2),
    ("Q_DIA_KINH_TE_01", "C", "Duyên hải Nam Trung Bộ", False, 3),
    ("Q_DIA_KINH_TE_01", "D", "Đồng bằng sông Cửu Long", False, 4),
    ("Q_GDCD_BAU_CU_01", "A", "16 tuổi", False, 1),
    ("Q_GDCD_BAU_CU_01", "B", "17 tuổi", False, 2),
    ("Q_GDCD_BAU_CU_01", "C", "18 tuổi", True, 3),
    ("Q_GDCD_BAU_CU_01", "D", "21 tuổi", False, 4),
    ("Q_TIN_SUM_01", "A", "Đếm số ô chứa chữ", False, 1),
    ("Q_TIN_SUM_01", "B", "Tính tổng các giá trị", True, 2),
    ("Q_TIN_SUM_01", "C", "Tìm giá trị lớn nhất", False, 3),
    ("Q_TIN_SUM_01", "D", "Sắp xếp dữ liệu theo bảng chữ cái", False, 4),
]

# (question_key, changed_by_username, old_data, new_data, change_type)
QUESTION_HISTORY = [
    (
        "Q_TOAN_HAM_SO_01",
        "teacher01",
        {"status": "draft"},
        {"status": "approved"},
        "status_update",
    ),
    (
        "Q_ANH_CONDITIONAL_01",
        "teacher03",
        {"source": "ai", "content": "If clause in conditional type 2 uses which tense?"},
        {"source": "manual", "content": "Trong câu điều kiện loại 2, mệnh đề if thường dùng thì nào?"},
        "content_revision",
    ),
    (
        "Q_SU_1945_01",
        "teacher07",
        {"status": "draft"},
        {"status": "approved"},
        "review_approved",
    ),
]

# (
#   student_username,
#   subject_code,
#   document_title,
#   difficulty,
#   num_questions_requested,
#   num_questions_actual,
#   time_limit_minutes,
#   prioritize_unanswered,
# )
PRACTICE_SETS = [
    ("student01", "TOAN", "Chuyên đề Hàm số bậc hai", "easy", 2, 2, 15, True),
    ("student07", "ANH", "Câu bị động và câu điều kiện", "medium", 2, 2, 20, True),
    ("student13", "TOAN", "Bài tập Đạo hàm lớp 11", "easy", 1, 1, 15, False),
    ("student19", "VAN", "Tổng ôn Truyện ngắn Việt Nam hiện đại", "medium", 1, 1, 20, True),
    ("student25", "SINH", "ADN và gen cơ bản", "easy", 1, 1, 10, False),
    ("student31", "SU", "Lịch sử Việt Nam 1945-1975", "medium", 1, 1, 15, True),
    ("student34", "DIA", "Địa lý kinh tế Việt Nam", "medium", 1, 1, 15, True),
    ("student36", "TIN", "Tin học bảng tính cơ bản", "easy", 1, 1, 10, False),
]

# (student_username, question_key, order_num)
PRACTICE_SET_QUESTIONS = [
    ("student01", "Q_TOAN_HAM_SO_01", 1),
    ("student01", "Q_TOAN_HAM_SO_02", 2),
    ("student07", "Q_ANH_CONDITIONAL_01", 1),
    ("student07", "Q_ANH_PASSIVE_01", 2),
    ("student13", "Q_TOAN_DAO_HAM_01", 1),
    ("student19", "Q_VAN_VO_NHAT_01", 1),
    ("student25", "Q_SINH_ADN_01", 1),
    ("student31", "Q_SU_1945_01", 1),
    ("student34", "Q_DIA_KINH_TE_01", 1),
    ("student36", "Q_TIN_SUM_01", 1),
]

# (
#   student_username,
#   status,
#   score,
#   total_correct,
#   total_wrong,
#   days_ago,
#   duration_minutes,
# )
PRACTICE_ATTEMPTS = [
    ("student01", "submitted", 10.0, 2, 0, 2, 12),
    ("student07", "submitted", 5.0, 1, 1, 3, 18),
    ("student13", "submitted", 10.0, 1, 0, 4, 9),
    ("student19", "in_progress", None, 0, 0, 1, None),
    ("student25", "submitted", 10.0, 1, 0, 5, 8),
    ("student31", "timeout", 0.0, 0, 1, 2, 20),
    ("student34", "submitted", 10.0, 1, 0, 6, 11),
    ("student36", "submitted", 10.0, 1, 0, 3, 7),
]

# (attempt_index, question_key, option_label, is_correct)
STUDENT_ANSWERS = [
    (1, "Q_TOAN_HAM_SO_01", "B", True),
    (1, "Q_TOAN_HAM_SO_02", "B", True),
    (2, "Q_ANH_CONDITIONAL_01", "B", True),
    (2, "Q_ANH_PASSIVE_01", "B", False),
    (3, "Q_TOAN_DAO_HAM_01", "C", True),
    (5, "Q_SINH_ADN_01", "C", True),
    (6, "Q_SU_1945_01", "A", False),
    (7, "Q_DIA_KINH_TE_01", "A", True),
    (8, "Q_TIN_SUM_01", "B", True),
]

# (username, title, content, is_read)
NOTIFICATIONS = [
    ("student01", "Đã được thêm vào lớp 10A1", "Bạn đã được giáo viên chủ nhiệm thêm vào lớp 10A1.", False),
    ("student07", "Đã được thêm vào lớp 10A2", "Bạn đã được xếp vào lớp 10A2 năm học mới.", True),
    ("student25", "Bộ câu hỏi ôn tập đã sẵn sàng", "Bộ câu hỏi ôn tập ADN và gen cơ bản đã sẵn sàng để làm bài.", False),
    ("student31", "Đã nộp bài ôn tập", "Lượt làm bài môn Lịch sử của bạn đã được ghi nhận.", False),
    ("teacher01", "Phân công phụ trách môn Toán", "Bạn được phân công dạy môn Toán cho các lớp 10A1 đến 12A2.", False),
    ("teacher02", "Tài liệu mới đã được tải lên", "Tài liệu Tổng ôn Truyện ngắn Việt Nam hiện đại đã được thêm vào hệ thống.", True),
    ("teacher03", "Bộ câu hỏi ôn tập đã sẵn sàng", "Bộ câu hỏi từ tài liệu Câu bị động và câu điều kiện đã sẵn sàng.", False),
    ("teacher04", "Yêu cầu AI đang xử lý", "Yêu cầu tạo câu hỏi cho chuyên đề Dao động điều hòa đang được xử lý.", False),
    ("teacher07", "Học sinh đã nộp bài ôn tập", "Một học sinh lớp 12A2 vừa hoàn thành bài ôn tập Lịch sử.", False),
    ("teacher10", "Kết quả làm bài mới", "Học sinh lớp 12A2 đã hoàn thành bài ôn tập Tin học bảng tính cơ bản.", False),
]


RESET_ORDER = [
    ("student_answers", "answer_id"),
    ("practice_attempts", "attempt_id"),
    ("practice_set_questions", "practice_set_question_id"),
    ("practice_sets", "practice_set_id"),
    ("question_options", "option_id"),
    ("question_history", "history_id"),
    ("questions", "question_id"),
    ("ai_requests", "request_id"),
    ("document_topics", "document_topic_id"),
    ("documents", "document_id"),
    ("topics", "topic_id"),
    ("class_students", "class_student_id"),
    ("class_subjects", "class_subject_id"),
    ("class_teachers", "class_teacher_id"),
    ("subjects", "subject_id"),
    ("classes", "class_id"),
    ("user_roles", "user_role_id"),
    ("roles", "role_id"),
    ("notifications", "notification_id"),
    ("users", "user_id"),
]


class Seeder:
    def __init__(self) -> None:
        self.supabase = SupabaseManager.get_client()
        self.user_ids: dict[str, int] = {}
        self.role_ids: dict[str, int] = {}
        self.class_ids: dict[str, int] = {}
        self.subject_ids: dict[str, int] = {}
        self.class_subject_ids: dict[tuple[str, str], int] = {}
        self.topic_ids: dict[str, int] = {}
        self.document_ids: dict[str, int] = {}
        self.document_topic_ids: dict[str, int] = {}
        self.ai_request_ids: dict[str, int] = {}
        self.question_ids: dict[str, int] = {}
        self.practice_set_ids: dict[str, int] = {}
        self.practice_attempt_ids: dict[int, int] = {}

    def execute(self, operation):
        return asyncio.run(run_supabase_execute(operation))

    def insert_rows(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        response = self.execute(lambda: self.supabase.table(table).insert(rows).execute())
        return response.data or []

    def delete_all(self) -> None:
        for table, pk in RESET_ORDER:
            self.execute(lambda table=table, pk=pk: self.supabase.table(table).delete().gt(pk, 0).execute())

    def seed_users(self) -> None:
        rows = [
            {
                "username": username,
                "password_hash": PASSWORD_HASH,
                "full_name": full_name,
                "is_active": is_active,
                "must_change_password": must_change_password,
            }
            for username, full_name, is_active, must_change_password in USERS
        ]
        inserted = self.insert_rows("users", rows)
        self.user_ids = {row["username"]: row["user_id"] for row in inserted}

    def seed_roles(self) -> None:
        inserted = self.insert_rows(
            "roles",
            [{"role_code": code, "role_name": name, "description": desc} for code, name, desc in ROLES],
        )
        self.role_ids = {row["role_code"]: row["role_id"] for row in inserted}

    def seed_user_roles(self) -> None:
        rows = []
        for username in self.user_ids:
            if username == "admin":
                role_code = "admin"
            elif username.startswith("teacher"):
                role_code = "teacher"
            elif username.startswith("student"):
                role_code = "student"
            else:
                continue
            rows.append({"user_id": self.user_ids[username], "role_id": self.role_ids[role_code]})
        self.insert_rows("user_roles", rows)

    def seed_classes(self) -> None:
        rows = [
            {
                "class_code": class_code,
                "class_name": class_name,
                "description": description,
                "teacher_id": self.user_ids[teacher_username],
            }
            for class_code, class_name, description, teacher_username in CLASSES
        ]
        inserted = self.insert_rows("classes", rows)
        self.class_ids = {row["class_code"]: row["class_id"] for row in inserted}

    def seed_subjects(self) -> None:
        inserted = self.insert_rows(
            "subjects",
            [
                {"subject_code": code, "subject_name": name, "description": description}
                for code, name, description in SUBJECTS
            ],
        )
        self.subject_ids = {row["subject_code"]: row["subject_id"] for row in inserted}

    def seed_class_teachers(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_code],
                "teacher_id": self.user_ids[teacher_username],
            }
            for class_code, teacher_username in CLASS_TEACHERS
        ]
        self.insert_rows("class_teachers", rows)

    def seed_class_subjects(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_code],
                "subject_id": self.subject_ids[subject_code],
                "assigned_teacher_id": self.user_ids[teacher_username],
                "status": "active",
            }
            for class_code, subject_code, teacher_username in CLASS_SUBJECTS
        ]
        inserted = self.insert_rows("class_subjects", rows)
        for row in inserted:
            class_code = next(code for code, class_id in self.class_ids.items() if class_id == row["class_id"])
            subject_code = next(code for code, subject_id in self.subject_ids.items() if subject_id == row["subject_id"])
            self.class_subject_ids[(class_code, subject_code)] = row["class_subject_id"]

    def seed_topics(self) -> None:
        topic_keys: list[str] = []
        rows = []
        for topic_key, class_code, subject_code, topic_name, description in TOPICS:
            topic_keys.append(topic_key)
            rows.append(
                {
                    "class_subject_id": self.class_subject_ids[(class_code, subject_code)],
                    "topic_name": topic_name,
                    "description": description,
                }
            )
        inserted = self.insert_rows("topics", rows)
        self.topic_ids = {
            topic_key: row["topic_id"]
            for topic_key, row in zip(topic_keys, inserted, strict=False)
        }

    def seed_class_students(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_code],
                "student_id": self.user_ids[student_username],
            }
            for class_code, student_username in CLASS_STUDENTS
        ]
        self.insert_rows("class_students", rows)

    def seed_documents(self) -> None:
        rows = [
            {
                "teacher_id": self.user_ids[teacher_username],
                "title": title,
                "description": description,
                "file_url": file_url,
                "file_hash": file_hash,
                "file_type": file_type,
                "file_size": file_size,
            }
            for teacher_username, title, description, file_url, file_hash, file_type, file_size in DOCUMENTS
        ]
        inserted = self.insert_rows("documents", rows)
        self.document_ids = {row["title"]: row["document_id"] for row in inserted}

    def seed_document_topics(self) -> None:
        rows = [
            {
                "document_id": self.document_ids[document_title],
                "topic_id": self.topic_ids[topic_key],
            }
            for document_title, topic_key in DOCUMENT_TOPICS
        ]
        inserted = self.insert_rows("document_topics", rows)
        for row in inserted:
            document_title = next(title for title, document_id in self.document_ids.items() if document_id == row["document_id"])
            self.document_topic_ids[document_title] = row["document_topic_id"]

    def seed_ai_requests(self) -> None:
        rows = [
            {
                "document_topic_id": self.document_topic_ids[document_title],
                "num_questions": num_questions,
                "difficulty": difficulty,
                "content_scope": content_scope,
                "status": status,
                "generated_question_count": generated_question_count,
                "retry_count": retry_count,
                "error_message": error_message,
                "is_reviewed": is_reviewed,
            }
            for document_title, num_questions, difficulty, content_scope, status, generated_question_count, retry_count, error_message, is_reviewed in AI_REQUESTS
        ]
        inserted = self.insert_rows("ai_requests", rows)
        for row in inserted:
            document_title = next(title for title, document_topic_id in self.document_topic_ids.items() if document_topic_id == row["document_topic_id"])
            if row["status"] in {"completed", "processing", "failed"}:
                self.ai_request_ids.setdefault(document_title, row["request_id"])

    def seed_questions(self) -> None:
        rows = []
        question_keys: list[str] = []
        for question_key, teacher_username, document_title, content, difficulty, source, status, explanation in QUESTIONS:
            question_keys.append(question_key)
            rows.append(
                {
                    "teacher_id": self.user_ids[teacher_username],
                    "document_topic_id": self.document_topic_ids[document_title],
                    "ai_request_id": self.ai_request_ids.get(document_title) if source == "ai" else None,
                    "content": content,
                    "difficulty": difficulty,
                    "source": source,
                    "status": status,
                    "explanation": explanation,
                }
            )
        inserted = self.insert_rows("questions", rows)
        self.question_ids = {
            question_key: row["question_id"]
            for question_key, row in zip(question_keys, inserted, strict=False)
        }

    def seed_question_options(self) -> None:
        rows = [
            {
                "question_id": self.question_ids[question_key],
                "option_label": option_label,
                "option_text": option_text,
                "is_correct": is_correct,
                "order_num": order_num,
            }
            for question_key, option_label, option_text, is_correct, order_num in QUESTION_OPTIONS
        ]
        self.insert_rows("question_options", rows)

    def seed_question_history(self) -> None:
        rows = [
            {
                "question_id": self.question_ids[question_key],
                "changed_by": self.user_ids[changed_by_username],
                "old_data": old_data,
                "new_data": new_data,
                "change_type": change_type,
            }
            for question_key, changed_by_username, old_data, new_data, change_type in QUESTION_HISTORY
        ]
        self.insert_rows("question_history", rows)

    def seed_practice_sets(self) -> None:
        rows = [
            {
                "student_id": self.user_ids[student_username],
                "subject_id": self.subject_ids[subject_code],
                "document_topic_id": self.document_topic_ids[document_title],
                "difficulty": difficulty,
                "num_questions_requested": num_questions_requested,
                "num_questions_actual": num_questions_actual,
                "time_limit_minutes": time_limit_minutes,
                "prioritize_unanswered": prioritize_unanswered,
            }
            for student_username, subject_code, document_title, difficulty, num_questions_requested, num_questions_actual, time_limit_minutes, prioritize_unanswered in PRACTICE_SETS
        ]
        inserted = self.insert_rows("practice_sets", rows)
        for row in inserted:
            student_username = next(name for name, user_id in self.user_ids.items() if user_id == row["student_id"])
            self.practice_set_ids[student_username] = row["practice_set_id"]

    def seed_practice_set_questions(self) -> None:
        rows = [
            {
                "practice_set_id": self.practice_set_ids[student_username],
                "question_id": self.question_ids[question_key],
                "order_num": order_num,
            }
            for student_username, question_key, order_num in PRACTICE_SET_QUESTIONS
        ]
        self.insert_rows("practice_set_questions", rows)

    def seed_practice_attempts(self) -> None:
        rows = []
        now = datetime.now(timezone.utc)
        for student_username, status, score, total_correct, total_wrong, days_ago, duration_minutes in PRACTICE_ATTEMPTS:
            started_at = now - timedelta(days=days_ago)
            row = {
                "practice_set_id": self.practice_set_ids[student_username],
                "started_at": started_at.isoformat(),
                "score": score,
                "total_correct": total_correct,
                "total_wrong": total_wrong,
                "status": status,
            }
            if duration_minutes is not None:
                row["submitted_at"] = (started_at + timedelta(minutes=duration_minutes)).isoformat()
            rows.append(row)
        inserted = self.insert_rows("practice_attempts", rows)
        self.practice_attempt_ids = {index: row["attempt_id"] for index, row in enumerate(inserted, start=1)}

    def seed_student_answers(self) -> None:
        question_option_rows = self.execute(
            lambda: self.supabase.table("question_options").select("option_id,question_id,option_label").execute()
        ).data or []
        option_ids = {
            (row["question_id"], row["option_label"]): row["option_id"]
            for row in question_option_rows
        }

        rows = [
            {
                "attempt_id": self.practice_attempt_ids[attempt_index],
                "question_id": self.question_ids[question_key],
                "selected_option_id": option_ids[(self.question_ids[question_key], option_label)],
                "is_correct": is_correct,
            }
            for attempt_index, question_key, option_label, is_correct in STUDENT_ANSWERS
        ]
        self.insert_rows("student_answers", rows)

    def seed_notifications(self) -> None:
        rows = [
            {
                "user_id": self.user_ids[username],
                "title": title,
                "content": content,
                "is_read": is_read,
            }
            for username, title, content, is_read in NOTIFICATIONS
        ]
        self.insert_rows("notifications", rows)

    def run(self, clear_existing: bool) -> None:
        if clear_existing:
            self.delete_all()

        self.seed_users()
        self.seed_roles()
        self.seed_user_roles()
        self.seed_classes()
        self.seed_subjects()
        self.seed_class_teachers()
        self.seed_class_subjects()
        self.seed_topics()
        self.seed_class_students()
        self.seed_documents()
        self.seed_document_topics()
        self.seed_ai_requests()
        self.seed_questions()
        self.seed_question_options()
        self.seed_question_history()
        self.seed_practice_sets()
        self.seed_practice_set_questions()
        self.seed_practice_attempts()
        self.seed_student_answers()
        self.seed_notifications()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Supabase tables directly using the shared Supabase client.")
    parser.add_argument(
        "--skip-clear",
        action="store_true",
        help="Do not delete existing data before seeding.",
    )
    args = parser.parse_args()

    seeder = Seeder()
    seeder.run(clear_existing=not args.skip_clear)
    print("Seeded data directly into Supabase tables.")


if __name__ == "__main__":
    main()
