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


# (user_key, username, full_name, is_active, must_change_password)
USERS = [
    ("USR001", "admin", "Nguyen Van Quan", True, False),
    ("USR002", "teacher01", "Nguyen Minh Duc", True, False),
    ("USR003", "teacher02", "Tran Thi Thu Ha", True, False),
    ("USR004", "teacher03", "Le Hoang Anh", True, False),
    ("USR005", "teacher04", "Pham Quoc Bao", True, False),
    ("USR006", "teacher05", "Do Thi Ngoc Lan", True, False),
    ("USR007", "teacher06", "Vo Minh Tuan", True, False),
    ("USR008", "teacher07", "Bui Thi Thanh Van", True, False),
    ("USR009", "teacher08", "Dang Gia Han", True, False),
    ("USR010", "teacher09", "Hoang Phuong Linh", True, False),
    ("USR011", "teacher10", "Nguyen Duc Huy", True, False),
    ("USR012", "student01", "Nguyen Minh Anh", True, False),
    ("USR013", "student02", "Tran Gia Han", True, False),
    ("USR014", "student03", "Le Quoc Bao", True, False),
    ("USR015", "student04", "Pham Thu Uyen", True, False),
    ("USR016", "student05", "Doan Thanh Dat", True, False),
    ("USR017", "student06", "Vo Ngoc Mai", True, False),
    ("USR018", "student07", "Bui Tuan Kiet", True, False),
    ("USR019", "student08", "Dang Khanh Linh", True, False),
    ("USR020", "student09", "Hoang Minh Khang", True, False),
    ("USR021", "student10", "Nguyen Thu Trang", True, False),
    ("USR022", "student11", "Tran Gia Bao", True, False),
    ("USR023", "student12", "Le Thanh Nhan", True, False),
    ("USR024", "student13", "Pham Bao Chau", True, False),
    ("USR025", "student14", "Do Minh Quan", True, False),
    ("USR026", "student15", "Vo Thu Hien", True, False),
    ("USR027", "student16", "Bui Gia Huy", True, False),
    ("USR028", "student17", "Dang Minh Tam", True, False),
    ("USR029", "student18", "Hoang Khai Nguyen", True, False),
    ("USR030", "student19", "Nguyen Yen Nhi", True, False),
    ("USR031", "student20", "Tran Duc Anh", True, False),
    ("USR032", "student21", "Le Minh Tri", True, False),
    ("USR033", "student22", "Pham Quynh Anh", True, False),
    ("USR034", "student23", "Do Gia Bao", True, False),
    ("USR035", "student24", "Vo Thao Nhi", True, False),
    ("USR036", "student25", "Bui Quoc An", True, False),
    ("USR037", "student26", "Dang Thu Phuong", True, False),
    ("USR038", "student27", "Hoang Nhat Minh", True, False),
    ("USR039", "student28", "Nguyen Thanh Truc", True, False),
    ("USR040", "student29", "Tran Minh Khoa", True, False),
    ("USR041", "student30", "Le Thu Ha", True, False),
    ("USR042", "student31", "Pham Tien Dat", True, False),
    ("USR043", "student32", "Do Khanh Vy", True, False),
    ("USR044", "student33", "Vo Minh Chau", True, False),
    ("USR045", "student34", "Bui Anh Thu", True, False),
    ("USR046", "student35", "Dang Quoc Viet", True, False),
    ("USR047", "student36", "Hoang Gia Linh", True, False),
]

# (role_key, role_code, role_name, description)
ROLES = [
    ("ROL001", "admin", "Administrator", "System administrator"),
    ("ROL002", "teacher", "Teacher", "Teacher role"),
    ("ROL003", "student", "Student", "Student role"),
]

# (user_role_key, user_key, role_key)
USER_ROLES = [
    ("UR001", "USR001", "ROL001"),
    *[(f"UR{index:03d}", f"USR{index:03d}", "ROL002") for index in range(2, 12)],
    *[(f"UR{index:03d}", f"USR{index:03d}", "ROL003") for index in range(12, 48)],
]

# (class_key, class_code, class_name, description, homeroom_teacher_key)
CLASSES = [
    ("CLS001", "10A1", "Lớp 10A1", "Lớp 10A1 khối Khoa học tự nhiên", "USR002"),
    ("CLS002", "10A2", "Lớp 10A2", "Lớp 10A2 khối Khoa học xã hội", "USR003"),
    ("CLS003", "11A1", "Lớp 11A1", "Lớp 11A1 định hướng tự nhiên", "USR004"),
    ("CLS004", "11A2", "Lớp 11A2", "Lớp 11A2 định hướng xã hội", "USR005"),
    ("CLS005", "12A1", "Lớp 12A1", "Lớp 12A1 ôn thi tốt nghiệp", "USR006"),
    ("CLS006", "12A2", "Lớp 12A2", "Lớp 12A2 ôn thi tốt nghiệp", "USR007"),
]

# (subject_key, subject_code, subject_name, description)
SUBJECTS = [
    ("SUB001", "TOAN", "Toán", "Môn Toán trung học phổ thông"),
    ("SUB002", "VAN", "Ngữ văn", "Môn Ngữ văn trung học phổ thông"),
    ("SUB003", "ANH", "Tiếng Anh", "Môn Tiếng Anh trung học phổ thông"),
    ("SUB004", "LY", "Vật lý", "Môn Vật lý trung học phổ thông"),
    ("SUB005", "HOA", "Hóa học", "Môn Hóa học trung học phổ thông"),
    ("SUB006", "SINH", "Sinh học", "Môn Sinh học trung học phổ thông"),
    ("SUB007", "SU", "Lịch sử", "Môn Lịch sử trung học phổ thông"),
    ("SUB008", "DIA", "Địa lý", "Môn Địa lý trung học phổ thông"),
    ("SUB009", "GDCD", "Giáo dục kinh tế và pháp luật", "Môn Giáo dục kinh tế và pháp luật"),
    ("SUB010", "TIN", "Tin học", "Môn Tin học trung học phổ thông"),
]

# (class_teacher_key, class_key, teacher_key)
CLASS_TEACHERS = [
    ("CT001", "CLS001", "USR002"),
    ("CT002", "CLS002", "USR003"),
    ("CT003", "CLS003", "USR004"),
    ("CT004", "CLS004", "USR005"),
    ("CT005", "CLS005", "USR006"),
    ("CT006", "CLS006", "USR007"),
]

# (class_subject_key, class_key, subject_key, assigned_teacher_key)
CLASS_SUBJECTS = [
    ("CSUB001", "CLS001", "SUB001", "USR002"),
    ("CSUB002", "CLS001", "SUB002", "USR003"),
    ("CSUB003", "CLS001", "SUB003", "USR004"),
    ("CSUB004", "CLS001", "SUB004", "USR005"),
    ("CSUB005", "CLS001", "SUB005", "USR006"),
    ("CSUB006", "CLS001", "SUB006", "USR007"),
    ("CSUB007", "CLS001", "SUB007", "USR008"),
    ("CSUB008", "CLS001", "SUB008", "USR009"),
    ("CSUB009", "CLS001", "SUB009", "USR010"),
    ("CSUB010", "CLS001", "SUB010", "USR011"),
    ("CSUB011", "CLS002", "SUB001", "USR002"),
    ("CSUB012", "CLS002", "SUB002", "USR003"),
    ("CSUB013", "CLS002", "SUB003", "USR004"),
    ("CSUB014", "CLS002", "SUB004", "USR005"),
    ("CSUB015", "CLS002", "SUB005", "USR006"),
    ("CSUB016", "CLS002", "SUB006", "USR007"),
    ("CSUB017", "CLS002", "SUB007", "USR008"),
    ("CSUB018", "CLS002", "SUB008", "USR009"),
    ("CSUB019", "CLS002", "SUB009", "USR010"),
    ("CSUB020", "CLS002", "SUB010", "USR011"),
    ("CSUB021", "CLS003", "SUB001", "USR002"),
    ("CSUB022", "CLS003", "SUB002", "USR003"),
    ("CSUB023", "CLS003", "SUB003", "USR004"),
    ("CSUB024", "CLS003", "SUB004", "USR005"),
    ("CSUB025", "CLS003", "SUB005", "USR006"),
    ("CSUB026", "CLS003", "SUB006", "USR007"),
    ("CSUB027", "CLS003", "SUB007", "USR008"),
    ("CSUB028", "CLS003", "SUB008", "USR009"),
    ("CSUB029", "CLS003", "SUB009", "USR010"),
    ("CSUB030", "CLS003", "SUB010", "USR011"),
    ("CSUB031", "CLS004", "SUB001", "USR002"),
    ("CSUB032", "CLS004", "SUB002", "USR003"),
    ("CSUB033", "CLS004", "SUB003", "USR004"),
    ("CSUB034", "CLS004", "SUB004", "USR005"),
    ("CSUB035", "CLS004", "SUB005", "USR006"),
    ("CSUB036", "CLS004", "SUB006", "USR007"),
    ("CSUB037", "CLS004", "SUB007", "USR008"),
    ("CSUB038", "CLS004", "SUB008", "USR009"),
    ("CSUB039", "CLS004", "SUB009", "USR010"),
    ("CSUB040", "CLS004", "SUB010", "USR011"),
    ("CSUB041", "CLS005", "SUB001", "USR002"),
    ("CSUB042", "CLS005", "SUB002", "USR003"),
    ("CSUB043", "CLS005", "SUB003", "USR004"),
    ("CSUB044", "CLS005", "SUB004", "USR005"),
    ("CSUB045", "CLS005", "SUB005", "USR006"),
    ("CSUB046", "CLS005", "SUB006", "USR007"),
    ("CSUB047", "CLS005", "SUB007", "USR008"),
    ("CSUB048", "CLS005", "SUB008", "USR009"),
    ("CSUB049", "CLS005", "SUB009", "USR010"),
    ("CSUB050", "CLS005", "SUB010", "USR011"),
    ("CSUB051", "CLS006", "SUB001", "USR002"),
    ("CSUB052", "CLS006", "SUB002", "USR003"),
    ("CSUB053", "CLS006", "SUB003", "USR004"),
    ("CSUB054", "CLS006", "SUB004", "USR005"),
    ("CSUB055", "CLS006", "SUB005", "USR006"),
    ("CSUB056", "CLS006", "SUB006", "USR007"),
    ("CSUB057", "CLS006", "SUB007", "USR008"),
    ("CSUB058", "CLS006", "SUB008", "USR009"),
    ("CSUB059", "CLS006", "SUB009", "USR010"),
    ("CSUB060", "CLS006", "SUB010", "USR011"),
]

# (topic_key, class_subject_key, topic_name, description)
TOPICS = [
    ("TOP001", "CSUB001", "Hàm số bậc hai", "Khảo sát đồ thị và xét dấu tam thức bậc hai"),
    ("TOP002", "CSUB001", "Phương trình và hệ phương trình bậc nhất", "Giải phương trình và hệ phương trình cơ bản"),
    ("TOP003", "CSUB002", "Truyện ngắn Việt Nam hiện đại", "Tìm hiểu tác phẩm truyện ngắn Việt Nam hiện đại"),
    ("TOP004", "CSUB003", "Tenses", "Ôn tập các thì cơ bản trong tiếng Anh"),
    ("TOP005", "CSUB004", "Động học chất điểm", "Vận tốc, quãng đường và chuyển động thẳng"),
    ("TOP006", "CSUB005", "Cấu tạo nguyên tử", "Thành phần cấu tạo nguyên tử và lớp electron"),
    ("TOP007", "CSUB021", "Đạo hàm", "Khái niệm đạo hàm và quy tắc tính đạo hàm"),
    ("TOP008", "CSUB022", "Thơ mới", "Đặc điểm nội dung và nghệ thuật phong trào Thơ mới"),
    ("TOP009", "CSUB023", "Passive Voice", "Câu bị động trong các thì tiếng Anh"),
    ("TOP010", "CSUB024", "Dao động điều hòa", "Li độ, biên độ, chu kì và tần số"),
    ("TOP011", "CSUB025", "Phản ứng oxi hóa khử", "Xác định số oxi hóa và cân bằng phản ứng"),
    ("TOP012", "CSUB026", "ADN và gen", "Cấu trúc ADN và chức năng của gen"),
    ("TOP013", "CSUB031", "Cấp số cộng và cấp số nhân", "Tính số hạng tổng quát và tổng n số hạng"),
    ("TOP014", "CSUB032", "Nghị luận xã hội", "Kĩ năng viết đoạn và bài văn nghị luận xã hội"),
    ("TOP015", "CSUB033", "Conditional Sentences", "Câu điều kiện loại 1, 2 và 3"),
    ("TOP016", "CSUB040", "Hàm trong bảng tính", "Sử dụng SUM, AVERAGE, IF trong bảng tính"),
    ("TOP017", "CSUB041", "Tích phân", "Khái niệm tích phân và các công thức cơ bản"),
    ("TOP018", "CSUB042", "Ôn tập truyện hiện đại Việt Nam", "Ôn tập Vợ nhặt, Rừng xà nu và Chiếc thuyền ngoài xa"),
    ("TOP019", "CSUB047", "Việt Nam giai đoạn 1945-1975", "Những mốc lịch sử quan trọng sau Cách mạng tháng Tám"),
    ("TOP020", "CSUB048", "Địa lý kinh tế Việt Nam", "Cơ cấu ngành kinh tế và các vùng kinh tế trọng điểm"),
    ("TOP021", "CSUB049", "Quyền và nghĩa vụ công dân", "Quyền chính trị, quyền tự do cơ bản và nghĩa vụ công dân"),
    ("TOP022", "CSUB051", "Ứng dụng tích phân", "Tính diện tích hình phẳng bằng tích phân"),
    ("TOP023", "CSUB053", "Reading Comprehension", "Kĩ năng đọc hiểu và xác định ý chính"),
    ("TOP024", "CSUB055", "Este - lipit", "Khái niệm, tính chất và ứng dụng của este, lipit"),
    ("TOP025", "CSUB056", "Di truyền quần thể", "Cấu trúc di truyền và cân bằng Hardy-Weinberg"),
]

# (class_student_key, class_key, student_key)
CLASS_STUDENTS = [
    ("CST001", "CLS001", "USR012"),
    ("CST002", "CLS001", "USR013"),
    ("CST003", "CLS001", "USR014"),
    ("CST004", "CLS001", "USR015"),
    ("CST005", "CLS001", "USR016"),
    ("CST006", "CLS001", "USR017"),
    ("CST007", "CLS002", "USR018"),
    ("CST008", "CLS002", "USR019"),
    ("CST009", "CLS002", "USR020"),
    ("CST010", "CLS002", "USR021"),
    ("CST011", "CLS002", "USR022"),
    ("CST012", "CLS002", "USR023"),
    ("CST013", "CLS003", "USR024"),
    ("CST014", "CLS003", "USR025"),
    ("CST015", "CLS003", "USR026"),
    ("CST016", "CLS003", "USR027"),
    ("CST017", "CLS003", "USR028"),
    ("CST018", "CLS003", "USR029"),
    ("CST019", "CLS004", "USR030"),
    ("CST020", "CLS004", "USR031"),
    ("CST021", "CLS004", "USR032"),
    ("CST022", "CLS004", "USR033"),
    ("CST023", "CLS004", "USR034"),
    ("CST024", "CLS004", "USR035"),
    ("CST025", "CLS005", "USR036"),
    ("CST026", "CLS005", "USR037"),
    ("CST027", "CLS005", "USR038"),
    ("CST028", "CLS005", "USR039"),
    ("CST029", "CLS005", "USR040"),
    ("CST030", "CLS005", "USR041"),
    ("CST031", "CLS006", "USR042"),
    ("CST032", "CLS006", "USR043"),
    ("CST033", "CLS006", "USR044"),
    ("CST034", "CLS006", "USR045"),
    ("CST035", "CLS006", "USR046"),
    ("CST036", "CLS006", "USR047"),
]

# (document_key, teacher_key, title, description, file_url, file_hash, file_type, file_size)
DOCUMENTS = [
    (
        "DOC001",
        "USR002",
        "Chuyên đề Hàm số bậc hai",
        "Tài liệu hệ thống lại kiến thức về đồ thị và trục đối xứng của hàm số bậc hai.",
        "https://example.com/docs/chuyen-de-ham-so-bac-hai.pdf",
        "hash_thpt_doc_001",
        "pdf",
        2048000,
    ),
    (
        "DOC002",
        "USR002",
        "Bài tập Đạo hàm lớp 11",
        "Tuyển chọn bài tập cơ bản và nâng cao về đạo hàm dành cho học sinh lớp 11.",
        "https://example.com/docs/bai-tap-dao-ham-lop-11.pdf",
        "hash_thpt_doc_002",
        "pdf",
        1982464,
    ),
    (
        "DOC003",
        "USR002",
        "Ôn tập Tích phân 12",
        "Tóm tắt công thức và bài tập vận dụng về tích phân cho học sinh lớp 12.",
        "https://awnooplevwmniwgxrjyn.supabase.co/storage/v1/object/public/documents/teacher-143/subject-221/056c7d38-c262-41a8-8517-041a2bff8a38-cac-dang-bai-tap-tich-phan-toan-12-knttvcs.pdf",
        "af9fc27906ab3cae539bbe68045fee0f6b6c3edbfb1b84577d913142cc86c980",
        "pdf",
        1857440,
    ),
    (
        "DOC004",
        "USR003",
        "Tổng ôn Truyện ngắn Việt Nam hiện đại",
        "Tài liệu ôn tập các tác phẩm truyện ngắn trọng tâm trong chương trình THPT.",
        "https://example.com/docs/tong-on-truyen-ngan-viet-nam-hien-dai.pdf",
        "hash_thpt_doc_004",
        "pdf",
        2523136,
    ),
    (
        "DOC005",
        "USR003",
        "Chuyên đề Thơ mới lớp 11",
        "Phân tích đặc điểm nghệ thuật và cảm hứng của phong trào Thơ mới.",
        "https://example.com/docs/chuyen-de-tho-moi-lop-11.pdf",
        "hash_thpt_doc_005",
        "pdf",
        1769472,
    ),
    (
        "DOC006",
        "USR004",
        "Ngữ pháp Tiếng Anh THPT",
        "Hệ thống kiến thức về các thì cơ bản trong chương trình tiếng Anh THPT.",
        "https://example.com/docs/ngu-phap-tieng-anh-thpt.pdf",
        "hash_thpt_doc_006",
        "pdf",
        1843200,
    ),
    (
        "DOC007",
        "USR004",
        "Câu bị động và câu điều kiện",
        "Tài liệu luyện tập câu bị động và câu điều kiện cho học sinh lớp 11.",
        "https://example.com/docs/cau-bi-dong-va-cau-dieu-kien.pdf",
        "hash_thpt_doc_007",
        "pdf",
        1933312,
    ),
    (
        "DOC008",
        "USR004",
        "Kỹ năng Reading Comprehension 12",
        "Hướng dẫn cách đọc hiểu đoạn văn tiếng Anh và làm bài trắc nghiệm hiệu quả.",
        "https://example.com/docs/ky-nang-reading-comprehension-12.pdf",
        "hash_thpt_doc_008",
        "pdf",
        2015232,
    ),
    (
        "DOC009",
        "USR005",
        "Chuyên đề Động học chất điểm",
        "Tài liệu Vật lý 10 về chuyển động thẳng đều và các đại lượng đặc trưng.",
        "https://example.com/docs/chuyen-de-dong-hoc-chat-diem.pdf",
        "hash_thpt_doc_009",
        "pdf",
        2097152,
    ),
    (
        "DOC010",
        "USR005",
        "Chuyên đề Dao động điều hòa",
        "Tài liệu Vật lý 11 về dao động điều hòa và phương trình dao động.",
        "https://example.com/docs/chuyen-de-dao-dong-dieu-hoa.pdf",
        "hash_thpt_doc_010",
        "pdf",
        2202009,
    ),
    (
        "DOC011",
        "USR006",
        "Cấu tạo nguyên tử và bảng tuần hoàn",
        "Tóm tắt lý thuyết Hóa học 10 về cấu tạo nguyên tử và bảng tuần hoàn.",
        "https://example.com/docs/cau-tao-nguyen-tu-va-bang-tuan-hoan.pdf",
        "hash_thpt_doc_011",
        "pdf",
        1887436,
    ),
    (
        "DOC012",
        "USR007",
        "ADN và gen cơ bản",
        "Tài liệu Sinh học 11 về cấu trúc ADN, gen và mã di truyền.",
        "https://example.com/docs/adn-va-gen-co-ban.pdf",
        "hash_thpt_doc_012",
        "pdf",
        1945600,
    ),
    (
        "DOC013",
        "USR008",
        "Lịch sử Việt Nam 1945-1975",
        "Tài liệu ôn tập các sự kiện tiêu biểu của lịch sử Việt Nam giai đoạn 1945-1975.",
        "https://example.com/docs/lich-su-viet-nam-1945-1975.pdf",
        "hash_thpt_doc_013",
        "pdf",
        2260992,
    ),
    (
        "DOC014",
        "USR009",
        "Địa lý kinh tế Việt Nam",
        "Chuyên đề Địa lý 12 về cơ cấu ngành và các vùng kinh tế trọng điểm.",
        "https://example.com/docs/dia-ly-kinh-te-viet-nam.pdf",
        "hash_thpt_doc_014",
        "pdf",
        2113536,
    ),
    (
        "DOC015",
        "USR010",
        "Quyền và nghĩa vụ công dân",
        "Tài liệu GDCD 12 về quyền chính trị, quyền tự do cơ bản và nghĩa vụ công dân.",
        "https://example.com/docs/quyen-va-nghia-vu-cong-dan.pdf",
        "hash_thpt_doc_015",
        "pdf",
        1703936,
    ),
    (
        "DOC016",
        "USR011",
        "Tin học bảng tính cơ bản",
        "Tài liệu Tin học 11 hướng dẫn sử dụng các hàm cơ bản trong bảng tính.",
        "https://example.com/docs/tin-hoc-bang-tinh-co-ban.pdf",
        "hash_thpt_doc_016",
        "pdf",
        1622016,
    ),
]

# (document_topic_key, document_key, topic_key)
DOCUMENT_TOPICS = [
    ("DT001", "DOC001", "TOP001"),
    ("DT002", "DOC002", "TOP007"),
    ("DT003", "DOC003", "TOP017"),
    ("DT004", "DOC004", "TOP003"),
    ("DT005", "DOC005", "TOP008"),
    ("DT006", "DOC006", "TOP004"),
    ("DT007", "DOC007", "TOP015"),
    ("DT008", "DOC008", "TOP023"),
    ("DT009", "DOC009", "TOP005"),
    ("DT010", "DOC010", "TOP010"),
    ("DT011", "DOC011", "TOP006"),
    ("DT012", "DOC012", "TOP012"),
    ("DT013", "DOC013", "TOP019"),
    ("DT014", "DOC014", "TOP020"),
    ("DT015", "DOC015", "TOP021"),
    ("DT016", "DOC016", "TOP016"),
]

# (
#   ai_request_key,
#   document_topic_key,
#   num_questions,
#   content_scope,
#   status,
#   generated_question_count,
#   retry_count,
#   error_message,
#   is_reviewed,
#   difficulty_distribution,
# )
AI_REQUESTS = [
    # (
    #     "AIR001",
    #     "DT001",
    #     10,
    #     "Phần khái niệm về đồ thị",
    #     "completed",
    #     10,
    #     0,
    #     None,
    #     True,
    #     [
    #         {"difficulty": "recognition", "percentage": 50, "question_count": 5},
    #         {"difficulty": "comprehension", "percentage": 30, "question_count": 3},
    #         {"difficulty": "application", "percentage": 20, "question_count": 2},
    #     ],
    # ),
    # (
    #     "AIR002",
    #     "DT002",
    #     8,
    #     "Các bài tập tính đạo hàm cơ bản",
    #     "completed",
    #     8,
    #     0,
    #     None,
    #     True,
    #     [
    #         {"difficulty": "comprehension", "percentage": 50, "question_count": 4},
    #         {"difficulty": "application", "percentage": 50, "question_count": 4},
    #     ],
    # ),
    # (
    #     "AIR003",
    #     "DT003",
    #     8,
    #     "Công thức cơ bản và bài tập đơn giản",
    #     "processing",
    #     4,
    #     1,
    #     None,
    #     False,
    #     [
    #         {"difficulty": "recognition", "percentage": 25, "question_count": 2},
    #         {"difficulty": "comprehension", "percentage": 25, "question_count": 2},
    #         {"difficulty": "application", "percentage": 25, "question_count": 2},
    #         {"difficulty": "advanced", "percentage": 25, "question_count": 2},
    #     ],
    # ),
    # (
    #     "AIR004",
    #     "DT004",
    #     12,
    #     "Các tác phẩm trọng tâm lớp 12",
    #     "completed",
    #     12,
    #     0,
    #     None,
    #     True,
    #     [
    #         {"difficulty": "recognition", "percentage": 30, "question_count": 4},
    #         {"difficulty": "comprehension", "percentage": 40, "question_count": 5},
    #         {"difficulty": "application", "percentage": 20, "question_count": 2},
    #         {"difficulty": "advanced", "percentage": 10, "question_count": 1},
    #     ],
    # ),
    # (
    #     "AIR005",
    #     "DT006",
    #     10,
    #     "Các thì tiếng Anh cơ bản",
    #     "completed",
    #     10,
    #     0,
    #     None,
    #     True,
    #     [
    #         {"difficulty": "recognition", "percentage": 60, "question_count": 6},
    #         {"difficulty": "comprehension", "percentage": 40, "question_count": 4},
    #     ],
    # ),
    # (
    #     "AIR006",
    #     "DT007",
    #     12,
    #     "Câu điều kiện và cấu trúc biến đổi",
    #     "completed",
    #     12,
    #     1,
    #     None,
    #     True,
    #     [
    #         {"difficulty": "comprehension", "percentage": 40, "question_count": 5},
    #         {"difficulty": "application", "percentage": 35, "question_count": 4},
    #         {"difficulty": "advanced", "percentage": 25, "question_count": 3},
    #     ],
    # ),
    # (
    #     "AIR007",
    #     "DT010",
    #     8,
    #     "Phương trình và đại lượng dao động",
    #     "failed",
    #     3,
    #     2,
    #     "LLM generated malformed options",
    #     False,
    #     [
    #         {"difficulty": "application", "percentage": 50, "question_count": 4},
    #         {"difficulty": "advanced", "percentage": 50, "question_count": 4},
    #     ],
    # ),
    # (
    #     "AIR008",
    #     "DT011",
    #     6,
    #     "Lý thuyết nền tảng hóa học 10",
    #     "completed",
    #     6,
    #     0,
    #     None,
    #     True,
    #     [
    #         {"difficulty": "recognition", "percentage": 50, "question_count": 3},
    #         {"difficulty": "comprehension", "percentage": 50, "question_count": 3},
    #     ],
    # ),
    # (
    #     "AIR009",
    #     "DT013",
    #     9,
    #     "Sự kiện nổi bật sau Cách mạng tháng Tám",
    #     "pending",
    #     0,
    #     0,
    #     None,
    #     False,
    #     [
    #         {"difficulty": "recognition", "percentage": 34, "question_count": 3},
    #         {"difficulty": "comprehension", "percentage": 33, "question_count": 3},
    #         {"difficulty": "application", "percentage": 33, "question_count": 3},
    #     ],
    # ),
    # (
    #     "AIR010",
    #     "DT014",
    #     7,
    #     "Các vùng kinh tế và cơ cấu ngành",
    #     "cancelled",
    #     0,
    #     0,
    #     "Cancelled by teacher",
    #     False,
    #     [
    #         {"difficulty": "recognition", "percentage": 29, "question_count": 2},
    #         {"difficulty": "comprehension", "percentage": 43, "question_count": 3},
    #         {"difficulty": "application", "percentage": 28, "question_count": 2},
    #     ],
    # ),
]

# (
#   question_key,
#   teacher_key,
#   document_topic_key,
#   ai_request_key,
#   content,
#   difficulty,
#   source,
#   status,
#   explanation,
# )
QUESTIONS = [
    (
        "Q001",
        "USR002",
        "DT001",
        None,
        "Đồ thị của hàm số y = ax^2 + bx + c (a ≠ 0) là đường gì?",
        "recognition",
        "manual",
        "approved",
        "Đồ thị của hàm số bậc hai luôn là một parabol.",
    ),
    (
        "Q002",
        "USR002",
        "DT001",
        None,
        "Với hàm số y = ax^2 + bx + c, trục đối xứng của parabol có dạng nào?",
        "comprehension",
        "manual",
        "approved",
        "Trục đối xứng của parabol có phương trình x = -b / (2a).",
    ),
    (
        "Q003",
        "USR002",
        "DT002",
        None,
        "Đạo hàm của hàm số y = x^3 là gì?",
        "recognition",
        "manual",
        "approved",
        "Áp dụng quy tắc đạo hàm của lũy thừa, ta được y' = 3x^2.",
    ),
    (
        "Q004",
        "USR002",
        "DT003",
        None,
        "Giá trị của tích phân từ 0 đến 1 của hàm số x dx bằng bao nhiêu?",
        "comprehension",
        "manual",
        "approved",
        "Tích phân ∫0^1 x dx bằng 1/2.",
    ),
    (
        "Q005",
        "USR003",
        "DT004",
        None,
        "Tác phẩm Vợ nhặt của Kim Lân viết về bối cảnh nào?",
        "comprehension",
        "manual",
        "approved",
        "Tác phẩm phản ánh nạn đói năm 1945 và khát vọng sống của con người.",
    ),
    (
        "Q006",
        "USR003",
        "DT005",
        None,
        "Phong trào Thơ mới ở Việt Nam phát triển mạnh trong giai đoạn nào?",
        "comprehension",
        "manual",
        "approved",
        "Phong trào Thơ mới phát triển mạnh trong giai đoạn 1932-1945.",
    ),
    (
        "Q007",
        "USR004",
        "DT006",
        None,
        "Cấu trúc khẳng định của thì hiện tại hoàn thành là gì?",
        "recognition",
        "manual",
        "approved",
        "Thì hiện tại hoàn thành có cấu trúc khẳng định là S + have/has + V3/ed.",
    ),
    (
        "Q008",
        "USR004",
        "DT007",
        None,
        "Trong câu điều kiện loại 2, mệnh đề if thường dùng thì nào?",
        "comprehension",
        "manual",
        "approved",
        "Câu điều kiện loại 2 dùng thì quá khứ đơn ở mệnh đề if.",
    ),
    (
        "Q009",
        "USR004",
        "DT007",
        None,
        "Trong câu bị động ở thì hiện tại đơn, cấu trúc đúng là gì?",
        "comprehension",
        "manual",
        "approved",
        "Cấu trúc bị động hiện tại đơn là am/is/are + V3/ed.",
    ),
    (
        "Q010",
        "USR004",
        "DT008",
        None,
        "Để xác định ý chính của một đoạn văn tiếng Anh, học sinh nên làm gì trước tiên?",
        "recognition",
        "manual",
        "approved",
        "Nên đọc câu chủ đề và các câu mở đầu, kết luận để xác định ý chính.",
    ),
    (
        "Q011",
        "USR005",
        "DT009",
        None,
        "Đơn vị của vận tốc trong hệ SI là gì?",
        "recognition",
        "manual",
        "approved",
        "Đơn vị chuẩn của vận tốc trong hệ SI là mét trên giây.",
    ),
    (
        "Q012",
        "USR005",
        "DT010",
        None,
        "Trong dao động điều hòa, li độ biến thiên theo hàm nào của thời gian?",
        "advanced",
        "manual",
        "draft",
        "Li độ của dao động điều hòa biến thiên theo hàm sin hoặc cos của thời gian.",
    ),
    (
        "Q013",
        "USR006",
        "DT011",
        None,
        "Hạt nhân nguyên tử được cấu tạo từ những hạt nào?",
        "recognition",
        "manual",
        "approved",
        "Hạt nhân nguyên tử gồm proton và neutron.",
    ),
    (
        "Q014",
        "USR007",
        "DT012",
        None,
        "Gen là một đoạn của phân tử nào?",
        "recognition",
        "manual",
        "approved",
        "Gen là một đoạn của phân tử ADN mang thông tin di truyền.",
    ),
    (
        "Q015",
        "USR008",
        "DT013",
        None,
        "Cách mạng tháng Tám năm 1945 đã dẫn tới sự ra đời của nhà nước nào?",
        "comprehension",
        "manual",
        "approved",
        "Thắng lợi của Cách mạng tháng Tám dẫn tới sự ra đời của nước Việt Nam Dân chủ Cộng hòa.",
    ),
    (
        "Q016",
        "USR009",
        "DT014",
        None,
        "Vùng nào sau đây có thế mạnh nổi bật về cây công nghiệp lâu năm?",
        "comprehension",
        "manual",
        "approved",
        "Tây Nguyên có thế mạnh nổi bật về cây công nghiệp lâu năm như cà phê, cao su, hồ tiêu.",
    ),
    (
        "Q017",
        "USR010",
        "DT015",
        None,
        "Công dân Việt Nam đủ bao nhiêu tuổi thì có quyền bầu cử?",
        "recognition",
        "manual",
        "approved",
        "Theo quy định, công dân đủ 18 tuổi có quyền bầu cử.",
    ),
    (
        "Q018",
        "USR011",
        "DT016",
        None,
        "Trong bảng tính, hàm SUM dùng để làm gì?",
        "recognition",
        "manual",
        "approved",
        "Hàm SUM dùng để tính tổng các giá trị trong một vùng ô.",
    ),
]

# (option_key, question_key, option_label, option_text, is_correct, order_num)
QUESTION_OPTIONS = [
    ("OPT001", "Q001", "A", "Đường thẳng", False, 1),
    ("OPT002", "Q001", "B", "Parabol", True, 2),
    ("OPT003", "Q001", "C", "Đường tròn", False, 3),
    ("OPT004", "Q001", "D", "Hyperbol", False, 4),
    ("OPT005", "Q002", "A", "x = b / (2a)", False, 1),
    ("OPT006", "Q002", "B", "x = -b / (2a)", True, 2),
    ("OPT007", "Q002", "C", "y = -b / (2a)", False, 3),
    ("OPT008", "Q002", "D", "y = ax + b", False, 4),
    ("OPT009", "Q003", "A", "x^2", False, 1),
    ("OPT010", "Q003", "B", "3x", False, 2),
    ("OPT011", "Q003", "C", "3x^2", True, 3),
    ("OPT012", "Q003", "D", "x^3 / 3", False, 4),
    ("OPT013", "Q004", "A", "1", False, 1),
    ("OPT014", "Q004", "B", "1/2", True, 2),
    ("OPT015", "Q004", "C", "2", False, 3),
    ("OPT016", "Q004", "D", "0", False, 4),
    ("OPT017", "Q005", "A", "Nạn đói năm 1945", True, 1),
    ("OPT018", "Q005", "B", "Kháng chiến chống Mỹ", False, 2),
    ("OPT019", "Q005", "C", "Cải cách ruộng đất", False, 3),
    ("OPT020", "Q005", "D", "Đô thị hóa sau 1986", False, 4),
    ("OPT021", "Q006", "A", "1900-1930", False, 1),
    ("OPT022", "Q006", "B", "1932-1945", True, 2),
    ("OPT023", "Q006", "C", "1945-1954", False, 3),
    ("OPT024", "Q006", "D", "1954-1975", False, 4),
    ("OPT025", "Q007", "A", "S + have/has + V3/ed", True, 1),
    ("OPT026", "Q007", "B", "S + had + V3/ed", False, 2),
    ("OPT027", "Q007", "C", "S + am/is/are + V-ing", False, 3),
    ("OPT028", "Q007", "D", "S + do/does + V1", False, 4),
    ("OPT029", "Q008", "A", "Hiện tại đơn", False, 1),
    ("OPT030", "Q008", "B", "Quá khứ đơn", True, 2),
    ("OPT031", "Q008", "C", "Tương lai đơn", False, 3),
    ("OPT032", "Q008", "D", "Hiện tại hoàn thành", False, 4),
    ("OPT033", "Q009", "A", "am/is/are + V3/ed", True, 1),
    ("OPT034", "Q009", "B", "was/were + V3/ed", False, 2),
    ("OPT035", "Q009", "C", "have/has + been + V3/ed", False, 3),
    ("OPT036", "Q009", "D", "will be + V3/ed", False, 4),
    ("OPT037", "Q010", "A", "Dịch toàn bộ bài sang tiếng Việt", False, 1),
    ("OPT038", "Q010", "B", "Đọc câu chủ đề và câu mở đầu, kết luận", True, 2),
    ("OPT039", "Q010", "C", "Chỉ nhìn vào từ mới cuối bài", False, 3),
    ("OPT040", "Q010", "D", "Bỏ qua tiêu đề của đoạn văn", False, 4),
    ("OPT041", "Q011", "A", "km/h", False, 1),
    ("OPT042", "Q011", "B", "m/s", True, 2),
    ("OPT043", "Q011", "C", "N", False, 3),
    ("OPT044", "Q011", "D", "kg", False, 4),
    ("OPT045", "Q012", "A", "Hàm bậc nhất", False, 1),
    ("OPT046", "Q012", "B", "Hàm sin hoặc cos", True, 2),
    ("OPT047", "Q012", "C", "Hàm logarit", False, 3),
    ("OPT048", "Q012", "D", "Hàm mũ", False, 4),
    ("OPT049", "Q013", "A", "Electron và proton", False, 1),
    ("OPT050", "Q013", "B", "Proton và neutron", True, 2),
    ("OPT051", "Q013", "C", "Electron và neutron", False, 3),
    ("OPT052", "Q013", "D", "Chỉ gồm electron", False, 4),
    ("OPT053", "Q014", "A", "Protein", False, 1),
    ("OPT054", "Q014", "B", "ARN", False, 2),
    ("OPT055", "Q014", "C", "ADN", True, 3),
    ("OPT056", "Q014", "D", "Lipit", False, 4),
    ("OPT057", "Q015", "A", "Cộng hòa xã hội chủ nghĩa Việt Nam", False, 1),
    ("OPT058", "Q015", "B", "Việt Nam Dân chủ Cộng hòa", True, 2),
    ("OPT059", "Q015", "C", "Liên bang Đông Dương", False, 3),
    ("OPT060", "Q015", "D", "Quốc gia Việt Nam", False, 4),
    ("OPT061", "Q016", "A", "Tây Nguyên", True, 1),
    ("OPT062", "Q016", "B", "Đồng bằng sông Hồng", False, 2),
    ("OPT063", "Q016", "C", "Duyên hải Nam Trung Bộ", False, 3),
    ("OPT064", "Q016", "D", "Đồng bằng sông Cửu Long", False, 4),
    ("OPT065", "Q017", "A", "16 tuổi", False, 1),
    ("OPT066", "Q017", "B", "17 tuổi", False, 2),
    ("OPT067", "Q017", "C", "18 tuổi", True, 3),
    ("OPT068", "Q017", "D", "21 tuổi", False, 4),
    ("OPT069", "Q018", "A", "Đếm số ô chứa chữ", False, 1),
    ("OPT070", "Q018", "B", "Tính tổng các giá trị", True, 2),
    ("OPT071", "Q018", "C", "Tìm giá trị lớn nhất", False, 3),
    ("OPT072", "Q018", "D", "Sắp xếp dữ liệu theo bảng chữ cái", False, 4),
]

# (question_history_key, question_key, changed_by_user_key, old_data, new_data, change_type)
QUESTION_HISTORY = [
    (
        "QH001",
        "Q001",
        "USR002",
        {"status": "draft"},
        {"status": "approved"},
        "status_update",
    ),
    (
        "QH002",
        "Q008",
        "USR004",
        {"source": "ai", "content": "If clause in conditional type 2 uses which tense?"},
        {"source": "manual", "content": "Trong câu điều kiện loại 2, mệnh đề if thường dùng thì nào?"},
        "content_revision",
    ),
    (
        "QH003",
        "Q015",
        "USR008",
        {"status": "draft"},
        {"status": "approved"},
        "review_approved",
    ),
]

# (
#   practice_set_key,
#   student_key,
#   subject_key,
#   document_topic_key,
#   difficulty,
#   num_questions_requested,
#   num_questions_actual,
#   time_limit_minutes,
#   prioritize_unanswered,
# )
PRACTICE_SETS = [
    ("PS001", "USR012", "SUB001", "DT001", "recognition", 2, 2, 15, True),
    ("PS002", "USR018", "SUB003", "DT007", "comprehension", 2, 2, 20, True),
    ("PS003", "USR024", "SUB001", "DT002", "recognition", 1, 1, 15, False),
    ("PS004", "USR030", "SUB002", "DT004", "comprehension", 1, 1, 20, True),
    ("PS005", "USR036", "SUB006", "DT012", "recognition", 1, 1, 10, False),
    ("PS006", "USR042", "SUB007", "DT013", "comprehension", 1, 1, 15, True),
    ("PS007", "USR045", "SUB008", "DT014", "comprehension", 1, 1, 15, True),
    ("PS008", "USR047", "SUB010", "DT016", "recognition", 1, 1, 10, False),
]

# (practice_set_question_key, practice_set_key, question_key, order_num)
PRACTICE_SET_QUESTIONS = [
    ("PSQ001", "PS001", "Q001", 1),
    ("PSQ002", "PS001", "Q002", 2),
    ("PSQ003", "PS002", "Q008", 1),
    ("PSQ004", "PS002", "Q009", 2),
    ("PSQ005", "PS003", "Q003", 1),
    ("PSQ006", "PS004", "Q005", 1),
    ("PSQ007", "PS005", "Q014", 1),
    ("PSQ008", "PS006", "Q015", 1),
    ("PSQ009", "PS007", "Q016", 1),
    ("PSQ010", "PS008", "Q018", 1),
]

# (
#   practice_attempt_key,
#   practice_set_key,
#   status,
#   score,
#   total_correct,
#   total_wrong,
#   days_ago,
#   duration_minutes,
# )
PRACTICE_ATTEMPTS = [
    ("PAT001", "PS001", "submitted", 10.0, 2, 0, 2, 12),
    ("PAT002", "PS002", "submitted", 5.0, 1, 1, 3, 18),
    ("PAT003", "PS003", "submitted", 10.0, 1, 0, 4, 9),
    ("PAT004", "PS004", "in_progress", None, 0, 0, 1, None),
    ("PAT005", "PS005", "submitted", 10.0, 1, 0, 5, 8),
    ("PAT006", "PS006", "timeout", 0.0, 0, 1, 2, 20),
    ("PAT007", "PS007", "submitted", 10.0, 1, 0, 6, 11),
    ("PAT008", "PS008", "submitted", 10.0, 1, 0, 3, 7),
]

# (student_answer_key, practice_attempt_key, question_key, option_key, is_correct)
STUDENT_ANSWERS = [
    ("ANS001", "PAT001", "Q001", "OPT002", True),
    ("ANS002", "PAT001", "Q002", "OPT006", True),
    ("ANS003", "PAT002", "Q008", "OPT030", True),
    ("ANS004", "PAT002", "Q009", "OPT034", False),
    ("ANS005", "PAT003", "Q003", "OPT011", True),
    ("ANS006", "PAT005", "Q014", "OPT055", True),
    ("ANS007", "PAT006", "Q015", "OPT057", False),
    ("ANS008", "PAT007", "Q016", "OPT061", True),
    ("ANS009", "PAT008", "Q018", "OPT070", True),
]

# (notification_key, user_key, title, content, is_read)
NOTIFICATIONS = [
    ("NOTI001", "USR012", "Đã được thêm vào lớp 10A1", "Bạn đã được giáo viên chủ nhiệm thêm vào lớp 10A1.", False),
    ("NOTI002", "USR018", "Đã được thêm vào lớp 10A2", "Bạn đã được xếp vào lớp 10A2 năm học mới.", True),
    ("NOTI003", "USR036", "Bộ câu hỏi ôn tập đã sẵn sàng", "Bộ câu hỏi ôn tập ADN và gen cơ bản đã sẵn sàng để làm bài.", False),
    ("NOTI004", "USR042", "Đã nộp bài ôn tập", "Lượt làm bài môn Lịch sử của bạn đã được ghi nhận.", False),
    ("NOTI005", "USR002", "Phân công phụ trách môn Toán", "Bạn được phân công dạy môn Toán cho các lớp 10A1 đến 12A2.", False),
    ("NOTI006", "USR003", "Tài liệu mới đã được tải lên", "Tài liệu Tổng ôn Truyện ngắn Việt Nam hiện đại đã được thêm vào hệ thống.", True),
    ("NOTI007", "USR004", "Bộ câu hỏi ôn tập đã sẵn sàng", "Bộ câu hỏi từ tài liệu Câu bị động và câu điều kiện đã sẵn sàng.", False),
    ("NOTI008", "USR005", "Yêu cầu AI đang xử lý", "Yêu cầu tạo câu hỏi cho chuyên đề Dao động điều hòa đang được xử lý.", False),
    ("NOTI009", "USR008", "Học sinh đã nộp bài ôn tập", "Một học sinh lớp 12A2 vừa hoàn thành bài ôn tập Lịch sử.", False),
    ("NOTI010", "USR011", "Kết quả làm bài mới", "Học sinh lớp 12A2 đã hoàn thành bài ôn tập Tin học bảng tính cơ bản.", False),
]


RESET_ORDER = [
    ("student_answers", "answer_id"),
    ("practice_attempts", "attempt_id"),
    ("practice_set_questions", "practice_set_question_id"),
    ("practice_sets", "practice_set_id"),
    ("question_options", "option_id"),
    ("question_history", "history_id"),
    ("questions", "question_id"),
    ("ai_request_difficulty_distribution", "distribution_id"),
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
        self.class_subject_ids: dict[str, int] = {}
        self.topic_ids: dict[str, int] = {}
        self.document_ids: dict[str, int] = {}
        self.document_topic_ids: dict[str, int] = {}
        self.ai_request_ids: dict[str, int] = {}
        self.question_ids: dict[str, int] = {}
        self.question_option_ids: dict[str, int] = {}
        self.practice_set_ids: dict[str, int] = {}
        self.practice_attempt_ids: dict[str, int] = {}

    def execute(self, operation):
        return asyncio.run(run_supabase_execute(operation))

    def insert_rows(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        response = self.execute(lambda: self.supabase.table(table).insert(rows).execute())
        return response.data or []

    def build_id_map(self, seed_keys: list[str], inserted: list[dict[str, Any]], pk_field: str) -> dict[str, int]:
        return {
            seed_key: row[pk_field]
            for seed_key, row in zip(seed_keys, inserted, strict=True)
        }

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
            for _, username, full_name, is_active, must_change_password in USERS
        ]
        inserted = self.insert_rows("users", rows)
        self.user_ids = self.build_id_map([user_key for user_key, *_ in USERS], inserted, "user_id")

    def seed_roles(self) -> None:
        rows = [
            {
                "role_code": role_code,
                "role_name": role_name,
                "description": description,
            }
            for _, role_code, role_name, description in ROLES
        ]
        inserted = self.insert_rows("roles", rows)
        self.role_ids = self.build_id_map([role_key for role_key, *_ in ROLES], inserted, "role_id")

    def seed_user_roles(self) -> None:
        rows = [
            {
                "user_id": self.user_ids[user_key],
                "role_id": self.role_ids[role_key],
            }
            for _, user_key, role_key in USER_ROLES
        ]
        self.insert_rows("user_roles", rows)

    def seed_classes(self) -> None:
        rows = [
            {
                "class_code": class_code,
                "class_name": class_name,
                "description": description,
                "teacher_id": self.user_ids[homeroom_teacher_key],
            }
            for _, class_code, class_name, description, homeroom_teacher_key in CLASSES
        ]
        inserted = self.insert_rows("classes", rows)
        self.class_ids = self.build_id_map([class_key for class_key, *_ in CLASSES], inserted, "class_id")

    def seed_subjects(self) -> None:
        rows = [
            {
                "subject_code": subject_code,
                "subject_name": subject_name,
                "description": description,
            }
            for _, subject_code, subject_name, description in SUBJECTS
        ]
        inserted = self.insert_rows("subjects", rows)
        self.subject_ids = self.build_id_map([subject_key for subject_key, *_ in SUBJECTS], inserted, "subject_id")

    def seed_class_teachers(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_key],
                "teacher_id": self.user_ids[teacher_key],
            }
            for _, class_key, teacher_key in CLASS_TEACHERS
        ]
        self.insert_rows("class_teachers", rows)

    def seed_class_subjects(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_key],
                "subject_id": self.subject_ids[subject_key],
                "assigned_teacher_id": self.user_ids[teacher_key],
                "status": "active",
            }
            for _, class_key, subject_key, teacher_key in CLASS_SUBJECTS
        ]
        inserted = self.insert_rows("class_subjects", rows)
        self.class_subject_ids = self.build_id_map(
            [class_subject_key for class_subject_key, *_ in CLASS_SUBJECTS],
            inserted,
            "class_subject_id",
        )

    def seed_topics(self) -> None:
        rows = [
            {
                "class_subject_id": self.class_subject_ids[class_subject_key],
                "topic_name": topic_name,
                "description": description,
            }
            for _, class_subject_key, topic_name, description in TOPICS
        ]
        inserted = self.insert_rows("topics", rows)
        self.topic_ids = self.build_id_map([topic_key for topic_key, *_ in TOPICS], inserted, "topic_id")

    def seed_class_students(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_key],
                "student_id": self.user_ids[student_key],
            }
            for _, class_key, student_key in CLASS_STUDENTS
        ]
        self.insert_rows("class_students", rows)

    def seed_documents(self) -> None:
        rows = [
            {
                "teacher_id": self.user_ids[teacher_key],
                "title": title,
                "description": description,
                "file_url": file_url,
                "file_hash": file_hash,
                "file_type": file_type,
                "file_size": file_size,
            }
            for _, teacher_key, title, description, file_url, file_hash, file_type, file_size in DOCUMENTS
        ]
        inserted = self.insert_rows("documents", rows)
        self.document_ids = self.build_id_map([document_key for document_key, *_ in DOCUMENTS], inserted, "document_id")

    def seed_document_topics(self) -> None:
        rows = [
            {
                "document_id": self.document_ids[document_key],
                "topic_id": self.topic_ids[topic_key],
            }
            for _, document_key, topic_key in DOCUMENT_TOPICS
        ]
        inserted = self.insert_rows("document_topics", rows)
        self.document_topic_ids = self.build_id_map(
            [document_topic_key for document_topic_key, *_ in DOCUMENT_TOPICS],
            inserted,
            "document_topic_id",
        )

    def seed_ai_requests(self) -> None:
        rows = [
            {
                "document_topic_id": self.document_topic_ids[document_topic_key],
                "num_questions": num_questions,
                "content_scope": content_scope,
                "status": status,
                "generated_question_count": generated_question_count,
                "retry_count": retry_count,
                "error_message": error_message,
                "is_reviewed": is_reviewed,
            }
            for (
                _,
                document_topic_key,
                num_questions,
                content_scope,
                status,
                generated_question_count,
                retry_count,
                error_message,
                is_reviewed,
                _,
            ) in AI_REQUESTS
        ]
        inserted = self.insert_rows("ai_requests", rows)
        self.ai_request_ids = self.build_id_map([ai_request_key for ai_request_key, *_ in AI_REQUESTS], inserted, "request_id")

        distribution_rows: list[dict[str, Any]] = []
        for ai_request_key, *_, difficulty_distribution in AI_REQUESTS:
            distribution_rows.extend(
                {
                    "request_id": self.ai_request_ids[ai_request_key],
                    "difficulty": item["difficulty"],
                    "percentage": item.get("percentage"),
                    "question_count": item["question_count"],
                }
                for item in difficulty_distribution
            )
        self.insert_rows("ai_request_difficulty_distribution", distribution_rows)

    def seed_questions(self) -> None:
        rows = [
            {
                "teacher_id": self.user_ids[teacher_key],
                "document_topic_id": self.document_topic_ids[document_topic_key],
                "ai_request_id": self.ai_request_ids[ai_request_key] if ai_request_key else None,
                "content": content,
                "difficulty": difficulty,
                "source": source,
                "status": status,
                "explanation": explanation,
            }
            for (
                _,
                teacher_key,
                document_topic_key,
                ai_request_key,
                content,
                difficulty,
                source,
                status,
                explanation,
            ) in QUESTIONS
        ]
        inserted = self.insert_rows("questions", rows)
        self.question_ids = self.build_id_map([question_key for question_key, *_ in QUESTIONS], inserted, "question_id")

    def seed_question_options(self) -> None:
        rows = [
            {
                "question_id": self.question_ids[question_key],
                "option_label": option_label,
                "option_text": option_text,
                "is_correct": is_correct,
                "order_num": order_num,
            }
            for _, question_key, option_label, option_text, is_correct, order_num in QUESTION_OPTIONS
        ]
        inserted = self.insert_rows("question_options", rows)
        self.question_option_ids = self.build_id_map([option_key for option_key, *_ in QUESTION_OPTIONS], inserted, "option_id")

    def seed_question_history(self) -> None:
        rows = [
            {
                "question_id": self.question_ids[question_key],
                "changed_by": self.user_ids[changed_by_user_key],
                "old_data": old_data,
                "new_data": new_data,
                "change_type": change_type,
            }
            for _, question_key, changed_by_user_key, old_data, new_data, change_type in QUESTION_HISTORY
        ]
        self.insert_rows("question_history", rows)

    def seed_practice_sets(self) -> None:
        rows = [
            {
                "student_id": self.user_ids[student_key],
                "subject_id": self.subject_ids[subject_key],
                "document_topic_id": self.document_topic_ids[document_topic_key],
                "difficulty": difficulty,
                "num_questions_requested": num_questions_requested,
                "num_questions_actual": num_questions_actual,
                "time_limit_minutes": time_limit_minutes,
                "prioritize_unanswered": prioritize_unanswered,
            }
            for (
                _,
                student_key,
                subject_key,
                document_topic_key,
                difficulty,
                num_questions_requested,
                num_questions_actual,
                time_limit_minutes,
                prioritize_unanswered,
            ) in PRACTICE_SETS
        ]
        inserted = self.insert_rows("practice_sets", rows)
        self.practice_set_ids = self.build_id_map(
            [practice_set_key for practice_set_key, *_ in PRACTICE_SETS],
            inserted,
            "practice_set_id",
        )

    def seed_practice_set_questions(self) -> None:
        rows = [
            {
                "practice_set_id": self.practice_set_ids[practice_set_key],
                "question_id": self.question_ids[question_key],
                "order_num": order_num,
            }
            for _, practice_set_key, question_key, order_num in PRACTICE_SET_QUESTIONS
        ]
        self.insert_rows("practice_set_questions", rows)

    def seed_practice_attempts(self) -> None:
        now = datetime.now(timezone.utc)
        rows = []
        attempt_keys: list[str] = []
        for (
            practice_attempt_key,
            practice_set_key,
            status,
            score,
            total_correct,
            total_wrong,
            days_ago,
            duration_minutes,
        ) in PRACTICE_ATTEMPTS:
            attempt_keys.append(practice_attempt_key)
            started_at = now - timedelta(days=days_ago)
            row = {
                "practice_set_id": self.practice_set_ids[practice_set_key],
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
        self.practice_attempt_ids = self.build_id_map(attempt_keys, inserted, "attempt_id")

    def seed_student_answers(self) -> None:
        rows = [
            {
                "attempt_id": self.practice_attempt_ids[practice_attempt_key],
                "question_id": self.question_ids[question_key],
                "selected_option_id": self.question_option_ids[option_key],
                "is_correct": is_correct,
            }
            for _, practice_attempt_key, question_key, option_key, is_correct in STUDENT_ANSWERS
        ]
        self.insert_rows("student_answers", rows)

    def seed_notifications(self) -> None:
        rows = [
            {
                "user_id": self.user_ids[user_key],
                "title": title,
                "content": content,
                "is_read": is_read,
            }
            for _, user_key, title, content, is_read in NOTIFICATIONS
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
