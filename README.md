# 🎓 Quizi-fy - Hệ thống ôn luyện trắc nghiệm thông minh tích hợp AI

Quizi-fy là một nền tảng hỗ trợ học tập và thi trắc nghiệm thông minh dành cho Giáo viên (Teacher) và Học sinh (Student), tích hợp công nghệ trí tuệ nhân tạo (AI) giúp tối ưu hóa việc tạo đề, ôn tập và theo dõi lộ trình học tập.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 1. Frontend
*   **Core**: ReactJS (v19) + TypeScript + Vite.
*   **Styling**: TailwindCSS (v4) + PostCSS.
*   **UI Components**: Radix UI + Lucide React (Icons).
*   **Routing**: React Router DOM (v7).
*   **Database Client**: Supabase JS SDK.

### 2. Backend
*   **Core**: Python (3.10+) + FastAPI.
*   **Server**: Uvicorn.
*   **Task Queue**: Celery (xử lý các tác vụ AI bất đồng bộ).
*   **Database & ORM**: PostgreSQL (Supabase) + SQLAlchemy.
*   **AI Integration**: OpenAI API (GPT models) + LangChain/LlamaIndex (RAG & xử lý tài liệu).
*   **Document Parsers**: `pypdf`, `python-docx` để đọc và phân tích tài liệu học tập.

### 3. Cơ sở dữ liệu & Services
*   **Database & Auth**: Supabase (Postgres).
*   **Message Broker**: Redis (Sử dụng Upstash Redis hoặc local Redis làm Broker cho Celery).

---

## ✨ Các tính năng chính

### 👨‍🏫 Dành cho Giáo viên (Teacher)
1.  **Sinh sơ đồ tư duy môn học (Subject Mindmap Generation)**: Tự động phân tích các chủ đề (`topics`) và tài liệu học tập (`documents`) để tạo sơ đồ tư duy môn học lưu dưới dạng JSONB.
2.  **Tiền xử lý tài liệu sang Markdown (.md)**: Chuyển đổi định dạng các file tài liệu thô (PDF, DOCX) thành định dạng Markdown chuẩn trước khi huấn luyện AI sinh câu hỏi, giúp tăng độ chính xác lên tới 95%.
3.  **Tạo bộ câu hỏi tự động**: AI quét qua tài liệu học tập để tự động tạo ngân hàng câu hỏi trắc nghiệm chất lượng cao.

### 🎓 Dành cho Học sinh (Student)
1.  **Xem sơ đồ tư duy môn học**: Tương tác trực quan (phóng to, thu nhỏ, đóng/mở nhánh) với sơ đồ tư duy của môn học.
2.  **Sổ tay câu sai (Mistake Notebook)**: Tự động tổng hợp và lưu trữ các câu hỏi làm sai để học sinh có thể luyện tập lại.
3.  **Báo cáo lỗi câu hỏi**: Gửi phản hồi lỗi câu hỏi (nếu AI sinh sai đáp án/không rõ nghĩa) trực tiếp cho giáo viên phê duyệt.
4.  **Thẻ ghi nhớ (Flashcards)**: Luyện tập nhanh với các thẻ lật 3D (Quizlet-style) hiển thị câu hỏi, câu trả lời và giải thích chi tiết.
5.  **Chuỗi ngày học tập (Study Streak)**: Ghi nhận số ngày hoạt động liên tục (Duolingo-style) để tạo động lực.
6.  **Nhiệm vụ hàng ngày (Daily Quests)**: Hệ thống nhiệm vụ nhận XP giúp tăng tính tương tác.
7.  **Gia sư AI học tập (AI Study Buddy)**: Chatbot gia sư AI hỗ trợ giải đáp chi tiết lý do sai của từng câu hỏi trực tiếp.

---

## ⚙️ Hướng dẫn cấu hình môi trường (.env)

Dự án yêu cầu cấu hình các biến môi trường ở cả 2 thư mục `backend` và `frontend`.

### 1. Cấu hình Backend
Di chuyển vào thư mục `backend/`, copy file `.env.example` thành `.env` và điền đầy đủ các thông tin:

```bash
cd backend
cp .env.example .env
```

Các biến môi trường trong `backend/.env`:
*   `SUPABASE_URL`: Đường dẫn URL dự án Supabase của bạn.
*   `SUPABASE_KEY`: Khóa public anon key từ Supabase.
*   `SUPABASE_SERVICE_ROLE_KEY`: Khóa service role key (cần thiết cho quyền admin/bypass RLS).
*   `SUPABASE_PASS`: Mật khẩu cơ sở dữ liệu PostgreSQL của bạn trên Supabase.
*   `JWT_SECRET`: Khóa bí mật dùng để mã hóa mã JWT token.
*   `JWT_ALGORITHM`: Thuật toán mã hóa JWT (Mặc định: `HS256`).
*   `JWT_EXPIRES_IN_MINUTES`: Thời gian hết hạn của token (Mặc định: `60` phút).
*   `OPENAI_API_KEY`: API Key của OpenAI để chạy các tính năng AI.
*   `OPENAI_MODEL`: Model OpenAI được sử dụng (ví dụ: `gpt-4o-mini`).
*   `CELERY_BROKER_URL` & `CELERY_RESULT_BACKEND`: URL kết nối tới Redis instance (dạng `rediss://...` của Upstash hoặc `redis://localhost:6379/0` chạy local).

### 2. Cấu hình Frontend
Di chuyển vào thư mục `frontend/`, copy file `.env.example` thành `.env` và điền thông tin:

```bash
cd ../frontend
cp .env.example .env
```

Các biến môi trường trong `frontend/.env`:
*   `VITE_API_BASE_URL`: Đường dẫn đến API Backend FastAPI (ví dụ: `http://localhost:8000/api/v1`).
*   `VITE_SUPABASE_URL`: Đường dẫn URL dự án Supabase (giống backend).
*   `VITE_SUPABASE_ANON_KEY`: Khóa public anon key từ Supabase (giống backend).

---

## 💾 Khởi tạo Cơ sở dữ liệu (Database Setup)

1.  Đăng nhập vào trang quản trị **Supabase Console** và truy cập vào dự án của bạn.
2.  Mở tab **SQL Editor**.
3.  Mở file [backend/database-sql.sql](file:///c:/Users/TOAN%20PHUC/Desktop/Documents/TTCS/Quizi-fy/backend/database-sql.sql) trong dự án của bạn, copy toàn bộ nội dung SQL và paste vào ô nhập liệu của Supabase SQL Editor.
4.  Nhấn nút **Run** để khởi tạo toàn bộ bảng, kiểu dữ liệu tùy chỉnh (Enums), khóa ngoại và các thiết lập database cần thiết.

---

## 🚀 Hướng dẫn chạy dự án

### Cách 1: Chạy tự động bằng file Script (Chỉ áp dụng trên Windows)
Dự án đã chuẩn bị sẵn file script [start.bat](file:///c:/Users/TOAN%20PHUC/Desktop/Documents/TTCS/Quizi-fy/start.bat) ở thư mục gốc để khởi chạy đồng thời cả Backend, Celery Worker và Frontend:

1.  Nháy đúp chuột vào file `start.bat` (hoặc mở Terminal tại thư mục gốc và gõ `start.bat`).
2.  Script sẽ tự động mở 3 cửa sổ CMD riêng biệt:
    *   **FastAPI Backend**: Chạy ở cổng `8000`.
    *   **Celery Worker**: Lắng nghe hàng đợi `teacher_ai_generation` chạy các tác vụ AI.
    *   **React Frontend**: Chạy ứng dụng web ở cổng `5173`.

> 📌 **Lưu ý**: Hãy đảm bảo bạn đã tạo và kích hoạt virtual environment (`venv`) trong thư mục `backend`, cài đặt các thư viện Python, và cài đặt các package Node trong thư mục `frontend` trước khi chạy script.

---

### Cách 2: Khởi chạy thủ công từng phần

#### 1. Khởi chạy Backend (FastAPI)
1.  Mở terminal mới và điều hướng tới thư mục `backend`:
    ```bash
    cd backend
    ```
2.  Tạo môi trường ảo (nếu chưa tạo):
    ```bash
    python -m venv venv
    ```
3.  Kích hoạt môi trường ảo:
    *   **Windows**: `venv\Scripts\activate` (hoặc `Scripts\activate` tùy thuộc vào vị trí khởi tạo venv).
    *   **macOS/Linux**: `source venv/bin/activate`
4.  Cài đặt các thư viện phụ thuộc:
    ```bash
    pip install -r requirements.txt
    ```
5.  Khởi động FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```
    *API Backend sẽ sẵn sàng hoạt động tại: `http://localhost:8000`*

#### 2. Khởi chạy Celery Worker (xử lý tác vụ nền)
1.  Mở một terminal mới, điều hướng đến `backend` và kích hoạt môi trường ảo tương tự bước trên.
2.  Chạy lệnh khởi động Celery Worker:
    ```bash
    celery -A workers.celery_app.celery_app worker --pool=solo --loglevel=info -Q teacher_ai_generation
    ```

#### 3. Khởi chạy Frontend (React + Vite)
1.  Mở một terminal mới và điều hướng đến thư mục `frontend`:
    ```bash
    cd frontend
    ```
2.  Cài đặt các package Node.js:
    ```bash
    npm install
    ```
3.  Khởi chạy Frontend ở môi trường phát triển (Development):
    ```bash
    npm run dev
    ```
    *Giao diện người dùng sẽ chạy tại địa chỉ: `http://localhost:5173`*

---

## 📁 Cấu trúc thư mục dự án chính

```text
Quizi-fy/
├── backend/                  # Mã nguồn phía Backend (FastAPI)
│   ├── .env.example          # File mẫu cấu hình biến môi trường Backend
│   ├── controllers/          # Bộ điều hướng xử lý API logic
│   ├── services/             # Lớp nghiệp vụ chính (Business logic)
│   ├── routes/               # Định nghĩa các endpoints API
│   ├── utils/                # Các hàm tiện ích hỗ trợ (AI Chat, pdf parsers, v.v.)
│   ├── workers/              # Chứa cấu hình Celery worker & background tasks
│   ├── database-sql.sql      # Schema khởi tạo database
│   ├── main.py               # File entry point chạy ứng dụng FastAPI
│   └── requirements.txt      # Danh sách thư viện Python phụ thuộc
│
├── frontend/                 # Mã nguồn phía Frontend (React + Vite)
│   ├── .env.example          # File mẫu cấu hình biến môi trường Frontend
│   ├── src/
│   │   ├── components/       # Các components giao diện dùng chung & riêng
│   │   ├── hooks/            # Các Custom Hooks xử lý API state và logic
│   │   ├── pages/            # Các trang giao diện chính
│   │   └── App.tsx           # Component gốc của ứng dụng
│   ├── package.json          # File cấu hình dependencies frontend
│   └── vite.config.ts        # Cấu hình bundler Vite
│
├── start.bat                 # Script chạy nhanh dự án cho Windows
└── README.md                 # Tài liệu hướng dẫn sử dụng (File này)
```
