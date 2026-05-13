import React from 'react';
import { Link } from 'react-router-dom';

export default function ResultsPage() {
  const result = {
    score: 8.5,
    correct: 12,
    total: 15,
    time: '18:42',
    questions: [
      {
        id: 1,
        text: 'Trong mô hình OSI, tầng nào chịu trách nhiệm nén dữ liệu và mã hóa?',
        userAnswer: 1, // Presentation
        correctAnswer: 1,
        isCorrect: true,
        explanation: 'Tầng trình diễn (Presentation) thực hiện việc chuyển đổi định dạng dữ liệu, nén và mã hóa để đảm bảo các hệ thống khác nhau có thể hiểu được thông tin truyền tải.'
      },
      {
        id: 2,
        text: 'Địa chỉ IPv4 có độ dài bao nhiêu bit?',
        userAnswer: 2, // 64 bit
        correctAnswer: 1, // 32 bit
        isCorrect: false,
        explanation: 'Địa chỉ IPv4 luôn có độ dài cố định là 32 bit, được chia thành 4 octet (mỗi octet 8 bit). 128 bit là độ dài của địa chỉ IPv6.'
      }
    ]
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Score Overview Card */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-16 opacity-[0.05]">
            <span className="material-symbols-outlined text-[250px]">military_tech</span>
         </div>
         
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
               <div className="space-y-4">
                  <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">Kết quả <br/><span className="text-[#b20112]">Ôn tập</span></h1>
                  <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Hoàn thành lúc 10:24 AM • 25/04/2026</p>
               </div>
               <div className="flex gap-10">
                  <div>
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Số câu đúng</p>
                     <p className="text-3xl font-black">{result.correct}/{result.total}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Thời gian làm</p>
                     <p className="text-3xl font-black">{result.time}</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <Link to="/student/practice/setup" className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 hover:bg-[#d62828] active:scale-95 transition-all">
                     Làm lại đề mới
                  </Link>
                  <Link to="/student/dashboard" className="bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all">
                     Về trang chủ
                  </Link>
               </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
               <div className="w-48 h-48 rounded-full border-[12px] border-white/5 flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 border-[12px] border-[#b20112] rounded-full border-t-transparent -rotate-45"></div>
                  <p className="text-6xl font-black leading-none">{result.score}</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Điểm số</p>
               </div>
               <p className="mt-8 text-sm font-black text-emerald-400 uppercase tracking-widest italic animate-pulse">Bạn đã tiến bộ 15% so với lần trước!</p>
            </div>
         </div>
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-8">
        <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-4">
           <span className="material-symbols-outlined text-[#b20112]">analytics</span> Phân tích chi tiết câu hỏi
        </h3>

        <div className="space-y-6">
          {result.questions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-red-900/5">
              <div className="p-10 space-y-8">
                {/* Status Bar */}
                <div className="flex justify-between items-center pb-6 border-b border-slate-50">
                   <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${q.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'}`}>
                         {q.isCorrect ? '✓' : '✕'}
                      </span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Câu hỏi số {idx + 1}</p>
                   </div>
                   <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${q.isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'}`}>
                      {q.isCorrect ? 'Chính xác' : 'Sai đáp án'}
                   </span>
                </div>

                {/* Content */}
                <div className="space-y-6">
                   <h4 className="text-xl font-black text-slate-800 tracking-tight leading-snug">{q.text}</h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-5 rounded-2xl border-2 flex items-center gap-4 ${q.isCorrect ? 'border-emerald-100 bg-emerald-50/20' : 'border-[#b20112] bg-red-50/20'}`}>
                         <span className="text-[10px] font-black text-slate-400 uppercase">Lựa chọn của bạn:</span>
                         <span className={`text-sm font-black ${q.isCorrect ? 'text-emerald-700' : 'text-[#b20112]'}`}>
                            {String.fromCharCode(65 + q.userAnswer)}
                         </span>
                      </div>
                      {!q.isCorrect && (
                        <div className="p-5 rounded-2xl border-2 border-emerald-100 bg-emerald-50/20 flex items-center gap-4">
                           <span className="text-[10px] font-black text-slate-400 uppercase">Đáp án đúng:</span>
                           <span className="text-sm font-black text-emerald-700">
                              {String.fromCharCode(65 + q.correctAnswer)}
                           </span>
                        </div>
                      )}
                   </div>
                </div>

                {/* AI Explanation */}
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                      <span className="material-symbols-outlined text-[80px]">auto_awesome</span>
                   </div>
                   <div className="flex items-center gap-3 mb-4">
                      <span className="material-symbols-outlined text-[#b20112] text-xl" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                      <p className="text-[10px] font-black text-[#b20112] uppercase tracking-[0.2em]">Giải thích chi tiết từ AI</p>
                   </div>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{q.explanation}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
