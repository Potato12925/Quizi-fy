import { Link } from 'react-router-dom';

export default function TeacherSettingsPage() {
  return (
    <div className="pb-20 space-y-6 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div>
        <h1 className="text-4xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
          Cai dat <span className="text-[#b20112]">tai khoan</span>
        </h1>
        <p className="mt-3 text-sm font-medium text-slate-500">
          Quan ly bao mat tai khoan giao vien.
        </p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <Link
          to="/teacher/change-password"
          className="inline-flex items-center gap-3 bg-[#b20112] text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-black transition-all"
        >
          <span className="material-symbols-outlined text-lg">key</span>
          Doi mat khau
        </Link>
      </div>
    </div>
  );
}