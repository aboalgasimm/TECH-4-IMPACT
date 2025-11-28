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
  const googleButtonRef = React.useRef<HTMLDivElement | null>(null);

  // Use Vite env var for Google Client ID, fallback to empty string
  const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  React.useEffect(() => {
    // Initialize Google Identity Services only when volunteer role is selected and client id exists
    if (selectedRole !== Role.VOLUNTEER) return;
    if (!GOOGLE_CLIENT_ID) return;
    const win: any = window as any;
    if (!win.google || !win.google.accounts || !win.google.accounts.id) return;

    win.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        try {
          const jwt = response.credential;
          const base64Url = jwt.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c){
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          const userName = payload.name || payload.email || 'متطوع';
          // Call existing login flow with the Google name
          login(Role.VOLUNTEER, userName);
        } catch (err) {
          console.error('Google sign-in parse error', err);
        }
      }
    });

    // Render the button
    if (googleButtonRef.current) {
      win.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with'
      });
    }

    return () => {
      // No standard cleanup API for the button; cancel any pending prompt
      if (win.google && win.google.accounts && win.google.accounts.id && win.google.accounts.id.cancel) {
        try { win.google.accounts.id.cancel(); } catch {}
      }
    };
  }, [selectedRole, GOOGLE_CLIENT_ID, login]);

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

          {/* OAuth buttons (Google implemented, Apple placeholder) */}
          {selectedRole === Role.VOLUNTEER && (
            <div className="space-y-2">
              {/* Google Sign-In: render real button only when client id is provided, otherwise show a fake button */}
              {(import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ? (
                <div ref={googleButtonRef} />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const n = prompt('محاكاة تسجيل الدخول عبر Google\nأدخل اسم العرض لاستخدامه كمستخدم متطوع:');
                    if (n) login(Role.VOLUNTEER, n);
                  }}
                  className="w-full py-3 px-4 bg-white text-slate-900 rounded-lg flex items-center justify-center gap-3 border border-slate-200 hover:shadow-md transition"
                >
                  <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path fill="#4285f4" d="M533.5 278.4c0-18.7-1.6-37.4-4.9-55.5H272v105.3h147c-6.3 33.9-25.7 62.6-54.8 81.7v67h88.4c51.7-47.6 81.9-117.9 81.9-198.5z"/>
                    <path fill="#34a853" d="M272 544.3c73.5 0 135.2-24.3 180.2-66.1l-88.4-67c-24.6 16.5-56.3 26.2-91.8 26.2-70.6 0-130.4-47.7-151.8-111.6H30.2v69.5C75.1 487.6 168.6 544.3 272 544.3z"/>
                    <path fill="#fbbc04" d="M120.2 325.3c-9.8-29.5-9.8-61.3 0-90.8V165H30.2c-39.6 78.5-39.6 171.9 0 250.4l90-69.1z"/>
                    <path fill="#ea4335" d="M272 107.7c38.2-.6 74.9 13.6 102.8 39.2l77-77C407.2 24.3 345.5 0 272 0 168.6 0 75.1 56.7 30.2 141.8l90 69.5C141.6 155.4 201.4 107.7 272 107.7z"/>
                  </svg>
                  <span className="font-semibold">Sign in with Google</span>
                </button>
              )}

              {/* Apple Sign-In: placeholder fake button that prompts for a name */}
              <button
                type="button"
                onClick={() => {
                  const n = prompt('محاكاة تسجيل الدخول عبر Apple\nأدخل اسم العرض لاستخدامه كمستخدم متطوع:');
                  if (n) login(Role.VOLUNTEER, n);
                }}
                className="w-full py-3 px-4 bg-black text-white rounded-lg flex items-center justify-center gap-3 border border-slate-800 hover:opacity-90 transition"
              >
                <svg width="18" height="18" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path fill="currentColor" d="M787 600c-1-84 61-125 64-127-35-51-90-58-110-59-47-5-92 28-116 28-23 0-59-27-97-26-50 1-96 29-122 74-52 91-13 226 37 300 25 36 55 76 94 74 38-2 52-25 98-25 46 0 59 25 99 24 40-1 65-36 90-72 29-41 41-81 42-83-1-1-82-31-83-123zM693 183c25-30 42-72 38-114-36 2-80 25-106 55-23 26-43 66-38 105 40 3 80-21 106-46z"/>
                </svg>
                <span className="font-semibold">Sign in with Apple</span>
              </button>
            </div>
          )}

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