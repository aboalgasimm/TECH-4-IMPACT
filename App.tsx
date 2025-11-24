import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Role } from './types';
import PublicReport from './views/PublicReport';
import VolunteerDashboard from './views/VolunteerDashboard';
import AdminDashboard from './views/AdminDashboard';

const LoginView = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role>(Role.PUBLIC);
  const [name, setName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === Role.PUBLIC) {
      login(Role.PUBLIC, name || 'زائر');
    } else {
      if (!name) return;
      login(selectedRole, name);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 w-[90%] max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚑</div>
          <h1 className="text-2xl font-bold text-white mb-2">منسق الطوارئ التطوعي</h1>
          <p className="text-slate-400 text-sm">نظام إدارة الحشود والاستجابة السريعة - المدينة المنورة</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="grid grid-cols-3 gap-2 bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedRole(Role.PUBLIC)}
              className={`py-2 text-sm font-bold rounded-md transition ${selectedRole === Role.PUBLIC ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              الجمهور
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole(Role.VOLUNTEER)}
              className={`py-2 text-sm font-bold rounded-md transition ${selectedRole === Role.VOLUNTEER ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              متطوع
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole(Role.ADMIN)}
              className={`py-2 text-sm font-bold rounded-md transition ${selectedRole === Role.ADMIN ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              إداري
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {selectedRole === Role.PUBLIC ? 'الاسم (اختياري)' : 'اسم المستخدم'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={selectedRole === Role.PUBLIC ? "فاعل خير" : "أدخل اسمك"}
              required={selectedRole !== Role.PUBLIC}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/50 transition transform active:scale-95"
          >
            {selectedRole === Role.PUBLIC ? 'طلب مساعدة' : 'دخول للنظام'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Floating Switcher for Quick Role Access
const DevRoleSwitcher = () => {
  const { login, role } = useApp();
  
  // Conditional positioning:
  // Volunteer: Top Center (to avoid blocking the bottom task sheet)
  // Others: Bottom Center (standard navigation feel)
  const positionClass = role === Role.VOLUNTEER 
    ? "top-20 left-1/2 -translate-x-1/2" 
    : "bottom-8 left-1/2 -translate-x-1/2";

  return (
    <div className={`fixed ${positionClass} z-[3000] bg-slate-900/95 backdrop-blur border border-slate-700 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4 opacity-60 hover:opacity-100 transition-all duration-300 hover:scale-105 group ring-1 ring-white/10`}>
      <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">تبديل سريع</div>
      <button onClick={() => login(Role.PUBLIC, 'زائر سريع')} className="flex flex-col items-center gap-1 group/btn" title="Public View">
        <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover/btn:bg-slate-700 flex items-center justify-center text-xl transition shadow-inner">👥</div>
      </button>
      <div className="w-px h-8 bg-slate-700"></div>
      <button onClick={() => login(Role.VOLUNTEER, 'متطوع سريع')} className="flex flex-col items-center gap-1 group/btn" title="Volunteer View">
        <div className="w-10 h-10 rounded-xl bg-emerald-900/50 group-hover/btn:bg-emerald-800/80 flex items-center justify-center text-xl transition shadow-inner border border-emerald-900">⛑️</div>
      </button>
      <div className="w-px h-8 bg-slate-700"></div>
      <button onClick={() => login(Role.ADMIN, 'Admin')} className="flex flex-col items-center gap-1 group/btn" title="Admin View">
        <div className="w-10 h-10 rounded-xl bg-blue-900/50 group-hover/btn:bg-blue-800/80 flex items-center justify-center text-xl transition shadow-inner border border-blue-900">🛡️</div>
      </button>
    </div>
  )
}

const MainRouter = () => {
  const { role } = useApp();
  
  if (!role) return <LoginView />;

  switch(role) {
    case Role.ADMIN:
      return <AdminDashboard />;
    case Role.VOLUNTEER:
      return <VolunteerDashboard />;
    case Role.PUBLIC:
    default:
      return <PublicReport />;
  }
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainRouter />
      <DevRoleSwitcher />
    </AppProvider>
  );
};

export default App;