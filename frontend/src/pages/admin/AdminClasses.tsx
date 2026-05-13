import React, { useState } from 'react';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([
    { id: '1', name: 'D21CQCN01-B', major: 'Công nghệ thông tin', students: 45, status: 'Đang hoạt động' },
    { id: '2', name: 'D21CQCN02-B', major: 'Công nghệ thông tin', students: 42, status: 'Đang hoạt động' },
    { id: '3', name: 'D21CQCN03-B', major: 'An toàn thông tin', students: 38, status: 'Đã khóa' },
  ]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Quản lý <br/><span className="text-[#b20112]">Lớp học</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">Thiết lập cấu trúc lớp học và phân quyền truy cập.</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">add_box</span> Tạo lớp mới
           </button>
        </div>
      </div>

      {/* Class Inventory Table */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách lớp học ({classes.length})</h3>
            <div className="flex gap-4">
               <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input type="text" placeholder="Tìm tên lớp..." className="pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-100 text-[10px] font-bold focus:ring-2 focus:ring-red-500/20 transition-all outline-none" />
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Tên lớp</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Chuyên ngành</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sĩ số</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                     <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                       <td className="px-10 py-8">
                          <p className="text-sm font-black text-slate-800 tracking-tight">{cls.name}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: {cls.id}</p>
                       </td>
                       <td className="px-6 py-8">
                          <span className="text-xs font-bold text-slate-600">{cls.major}</span>
                       </td>
                       <td className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center">
                             <span className="text-sm font-black text-slate-800">{cls.students}</span>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sinh viên</span>
                          </div>
                       </td>
                       <td className="px-6 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             cls.status === 'Đang hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'
                          }`}>
                             {cls.status}
                          </span>
                       </td>
                       <td className="px-10 py-8 text-right space-x-2">
                          <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                             <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                             <span className="material-symbols-outlined text-xl">block</span>
                          </button>
                          <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all">
                             <span className="material-symbols-outlined text-xl">menu_book</span>
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Assignment Helper Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
               <span className="material-symbols-outlined text-[100px]">link</span>
            </div>
            <div className="relative z-10 space-y-6">
               <h3 className="text-xl font-black uppercase italic tracking-tight">Gán môn học vào lớp</h3>
               <p className="text-white/40 text-xs font-medium leading-relaxed">Chọn các môn học sẽ được giảng dạy cho lớp này. Điều này ảnh hưởng trực tiếp đến dữ liệu ôn tập của sinh viên.</p>
               <button className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Bắt đầu phân quyền</button>
            </div>
         </div>
         <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 text-xs font-medium leading-relaxed italic">"Gợi ý: Bạn có thể nhập danh sách sinh viên hàng loạt từ file Excel sau khi đã tạo xong khung lớp học."</p>
         </div>
      </div>
    </div>
  );
}
