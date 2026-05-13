import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="bg-[#f9f9f9] text-slate-900 selection:bg-red-100 selection:text-[#b20112] min-h-screen">
      {/* Premium Navigation Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#b20112] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <span className="material-symbols-outlined text-white text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter">
            PTIT <span className="text-[#b20112]">Quizify AI</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-10">
          <Link to="#" className="text-sm font-bold text-[#b20112] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-[#b20112] after:rounded-full">Giới thiệu</Link>
          <Link to="#" className="text-sm font-bold text-slate-500 hover:text-[#b20112] transition-colors">Vai trò</Link>
          <Link to="#" className="text-sm font-bold text-slate-500 hover:text-[#b20112] transition-colors">Tính năng</Link>
          <Link to="#" className="text-sm font-bold text-slate-500 hover:text-[#b20112] transition-colors">Hướng dẫn</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="bg-[#b20112] hover:bg-[#d62828] active:scale-95 transition-all px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg shadow-red-900/20">
              Đăng nhập
            </button>
          </Link>
        </div>
      </header>

      <main className="pt-32">
        {/* Hero Section - Optimized */}
        <section className="relative px-6 py-12 md:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#b20112] text-[10px] font-black uppercase tracking-[0.2em] border border-red-100">
                <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                AI-Powered Learning
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                Ôn tập thông minh hơn với <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b20112] to-[#ff4d4d]">AI</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
                Nền tảng trắc nghiệm tự động hóa dành riêng cho sinh viên PTIT. Tạo đề, luyện tập và phân tích kết quả chỉ trong một nốt nhạc.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/login">
                  <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all">
                    Bắt đầu ngay
                  </button>
                </Link>
                <button className="px-10 py-4 rounded-2xl font-bold text-lg border-2 border-slate-200 text-slate-900 hover:bg-slate-50 transition-all">
                  Xem giới thiệu
                </button>
              </div>
            </div>
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-100 rounded-full blur-[120px] opacity-50"></div>
              <div className="relative z-10 w-full group">
                 <div className="absolute -inset-1 bg-gradient-to-r from-[#b20112] to-[#ff4d4d] rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                 <img 
                   alt="PTIT Students" 
                   className="rounded-[2.5rem] shadow-2xl relative w-full h-[550px] object-cover ring-1 ring-white/20" 
                   src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMe3AmJk3Sk5xdsGOem0h-p5j1T6_4HEACHJf94rUHMZ1zvkaSpKRaTOnncHVFTHrnq1B8eny4yKO3eerpvrl1jp0d6nqC9RTORgy6WjIEe1qZSaoD70B4x1kh-PpgubZxxeBKG9jfv1F52Y3K5RubrN1zCMgE8VJKAICySlgZP9zIXwIOjWKlOR7WT0H_kYM5fW39TcUyqRJaf-SVVPOUdJLHm9xSSBMt5jRW8TvKkdCJahj3dwB_v2zPAmX4-mMt-JIeiRvBdk4"
                 />
              </div>
            </div>
          </div>
        </section>

        {/* Roles Section - Bento Style Refined */}
        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Hệ sinh thái PTIT Quizify</h2>
              <p className="text-slate-500 font-medium">Giải pháp toàn diện cho quản lý, giảng dạy và học tập.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Admin Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-red-50 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-[#b20112] text-3xl transition-colors">admin_panel_settings</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-6">Admin</h3>
                <ul className="space-y-4">
                  {['Quản lý lớp, môn học', 'Quản lý người dùng', 'Cấu hình hệ thống'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                      <span className="material-symbols-outlined text-[#b20112] text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Teacher Card - Featured */}
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-[#b20112] shadow-2xl shadow-red-900/5 hover:translate-y-[-8px] transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <span className="material-symbols-outlined text-9xl">psychology</span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-[#b20112] flex items-center justify-center mb-8 shadow-lg shadow-red-900/20">
                  <span className="material-symbols-outlined text-white text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-6">Giảng viên</h3>
                <ul className="space-y-4">
                  {['Tải tài liệu bài giảng', 'Tạo câu hỏi AI tự động', 'Duyệt ngân hàng câu hỏi'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                      <span className="material-symbols-outlined text-[#b20112] text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Student Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-red-50 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-[#b20112] text-3xl transition-colors">school</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-6">Sinh viên</h3>
                <ul className="space-y-4">
                  {['Luyện tập theo chủ đề', 'Làm bài tập ngẫu nhiên', 'Xem điểm & lịch sử'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                      <span className="material-symbols-outlined text-[#b20112] text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Simplified Footer */}
      <footer className="py-12 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="material-symbols-outlined text-lg">school</span>
            <span>PTIT Quizify AI © 2024</span>
          </div>
          <div className="flex gap-8">
            <Link to="#" className="hover:text-[#b20112] transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-[#b20112] transition-colors">Terms</Link>
            <Link to="#" className="hover:text-[#b20112] transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
