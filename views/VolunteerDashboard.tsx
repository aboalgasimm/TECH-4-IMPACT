import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import MapComponent from '../components/MapComponent';
import NotificationToast from '../components/NotificationToast';
import { ReportStatus, Report, AlertTone } from '../types';

// Helper functions for distance calculation
const toRad = (value: number) => (value * Math.PI) / 180;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const StatsModal = ({ onClose, user }: { onClose: () => void, user: any }) => {
   // Gamification: Mock stats seeded by user ID length or simple random for demo
   const missions = user.id === 'v1' ? 42 : 12;
   const hours = user.id === 'v1' ? 128 : 34;
   const rank = user.id === 'v1' ? "قائد ميداني" : "متطوع نشط";

   return (
     <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[90%] max-w-sm text-center relative overflow-hidden shadow-2xl">
           {/* decorative glow */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
           
           <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>

           <h2 className="text-xl font-bold text-white mb-6 relative">ملفي الشخصي</h2>
           
           <div className="mb-6 relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-600 to-slate-800 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-xl ring-2 ring-emerald-500/50">
                 <span className="text-4xl">🎖️</span>
              </div>
              <div className="mt-4">
                 <h3 className="text-xl font-bold text-white">{user.name}</h3>
                 <p className="text-emerald-400 font-bold text-sm tracking-wider uppercase">{rank}</p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition">
                 <p className="text-3xl font-bold text-white">{missions}</p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">مهمة ناجحة</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition">
                 <p className="text-3xl font-bold text-white">{hours}</p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">ساعة تطوع</p>
              </div>
           </div>

           <div className="bg-slate-800 rounded-lg p-3 mb-6">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                 <span>التقدم للمستوى التالي</span>
                 <span>85%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 w-[85%]"></div>
              </div>
           </div>

           <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition font-bold text-sm">إغلاق</button>
        </div>
     </div>
   )
}

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { volunteerSettings, updateVolunteerSettings, previewTone } = useApp();

  const tones: {label: string, value: AlertTone}[] = [
    { label: 'نغمة هادئة', value: 'chime' },
    { label: 'صفارة إنذار', value: 'siren' },
    { label: 'افتراضي', value: 'default' },
    { label: 'صامت', value: 'silent' }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in text-right">
       <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-white">إعدادات التنبيهات</h2>
             <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">نغمة المهام الجديدة</label>
              <div className="flex gap-2">
                <select 
                  value={volunteerSettings.newTaskTone}
                  onChange={(e) => updateVolunteerSettings({...volunteerSettings, newTaskTone: e.target.value as AlertTone})}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                >
                  {tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button 
                  onClick={() => previewTone(volunteerSettings.newTaskTone)}
                  className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg hover:bg-slate-700"
                  title="تجربة الصوت"
                >
                  🔊
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">نغمة التنبيهات الخطيرة</label>
              <div className="flex gap-2">
                <select 
                  value={volunteerSettings.criticalAlertTone}
                  onChange={(e) => updateVolunteerSettings({...volunteerSettings, criticalAlertTone: e.target.value as AlertTone})}
                  className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:outline-none focus:border-red-500"
                >
                  {tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button 
                  onClick={() => previewTone(volunteerSettings.criticalAlertTone)}
                  className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg hover:bg-slate-700"
                  title="تجربة الصوت"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="w-full mt-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition font-bold text-sm">حفظ وإغلاق</button>
       </div>
    </div>
  )
}

const VolunteerDashboard: React.FC = () => {
  const { currentUser, reports, toggleVolunteerStatus, resolveReport, acceptTask, logout } = useApp();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const currentTask = reports.find(r => r.id === currentUser?.currentTaskId);
  
  // Find pending reports that are either assigned to me specifically OR unassigned (Available for self-dispatch)
  const availableReports = useMemo(() => {
      return reports.filter(r => 
        r.status === ReportStatus.PENDING && 
        (!r.assignedVolunteerId || r.assignedVolunteerId === currentUser?.id)
      );
  }, [reports, currentUser]);

  const activeReport = currentTask || reports.find(r => r.id === selectedReportId);

  const eta = useMemo(() => {
    if (!currentUser || !activeReport) return null;
    const distKm = calculateDistance(
      currentUser.location.lat,
      currentUser.location.lng,
      activeReport.location.lat,
      activeReport.location.lng
    );
    // Assuming average volunteer response speed of 15km/h
    const speedKmH = 15; 
    const timeMins = Math.ceil((distKm / speedKmH) * 60);
    return { dist: distKm.toFixed(2), time: timeMins };
  }, [currentUser, activeReport]);

  if (!currentUser) return <div>جاري التحميل...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-right overflow-hidden" dir="rtl">
      <NotificationToast />
      
      {showStats && <StatsModal user={currentUser} onClose={() => setShowStats(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Header */}
      <header className="p-3 lg:p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center z-10 shadow-md">
        <div className="cursor-pointer group flex items-center gap-2 lg:gap-3">
          <div onClick={() => setShowStats(true)}>
             <h1 className="text-lg lg:text-xl font-bold text-white">تطبيق المتطوع</h1>
             <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 group-hover:text-emerald-400 transition hidden lg:block">مرحباً، {currentUser.name}</p>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded border border-slate-700 group-hover:border-emerald-500 transition">ملفي 👤</span>
             </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition border border-slate-700"
            title="الإعدادات"
          >
            ⚙️
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleVolunteerStatus}
            className={`px-3 py-1 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-bold transition whitespace-nowrap ${
              currentUser.isOnline ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {currentUser.isOnline ? 'متاح' : 'غير متاح'}
          </button>
          <button onClick={logout} className="px-2 py-1 lg:px-3 lg:py-2 bg-slate-800 text-slate-400 rounded text-xs lg:text-sm hover:text-white whitespace-nowrap">
            خروج
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <MapComponent 
          reports={availableReports.length > 0 ? availableReports : (currentTask ? [currentTask] : [])} 
          volunteers={[currentUser]} 
          center={activeReport ? activeReport.location : currentUser.location}
          zoom={activeReport ? 16 : 14}
          onReportClick={(id) => setSelectedReportId(id)}
        />

        {/* Task Overlay - Responsive */}
        <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 pb-6 lg:pb-8 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent z-[1000] max-h-[60vh] overflow-y-auto">
          {activeReport ? (
            <div className={`border border-slate-700 rounded-xl p-4 shadow-2xl transition-all duration-500 ${activeReport.status === ReportStatus.PENDING ? 'bg-slate-800/90 backdrop-blur-md' : 'bg-slate-800'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-white text-[10px] lg:text-xs px-2 py-1 rounded font-bold uppercase ${activeReport.status === ReportStatus.PENDING ? 'bg-red-600 animate-pulse' : 'bg-orange-500'}`}>
                    {activeReport.status === ReportStatus.PENDING ? 'بانتظار الاستجابة' : activeReport.type}
                  </span>
                  <h2 className="text-base lg:text-lg font-bold text-white mt-1">
                     {currentTask ? 'المهمة الجارية' : 'تفاصيل البلاغ'}
                  </h2>
                </div>
                <div className="text-left">
                  <p className="text-[10px] lg:text-xs text-slate-400">الخطورة</p>
                  <p className="text-lg lg:text-xl font-bold text-red-400">{activeReport.aiSeverityScore}/10</p>
                </div>
              </div>
              
              {eta && (
                <div className="flex gap-4 mb-3 bg-slate-900/80 p-2 lg:p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2">
                     <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     <div>
                       <p className="text-[10px] lg:text-xs text-slate-400">الوقت المتوقع</p>
                       <p className="font-bold text-white text-sm">{eta.time} دقيقة</p>
                     </div>
                  </div>
                   <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
                     <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                     <div>
                       <p className="text-[10px] lg:text-xs text-slate-400">المسافة</p>
                       <p className="font-bold text-white text-sm">{eta.dist} كم</p>
                     </div>
                  </div>
                </div>
              )}

              <p className="text-slate-300 text-xs lg:text-sm mb-4 bg-slate-900/50 p-2 lg:p-3 rounded">{activeReport.description}</p>
              
              {/* Actions */}
              {activeReport.status === ReportStatus.PENDING ? (
                <div className="flex gap-2">
                   {selectedReportId && !currentTask && (
                      <button onClick={() => setSelectedReportId(null)} className="px-4 py-3 bg-slate-700 text-white rounded-lg text-sm">إلغاء</button>
                   )}
                   <button
                    onClick={() => {
                      acceptTask(activeReport.id);
                      setSelectedReportId(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-900/50 transition transform active:scale-95 animate-pulse text-sm lg:text-base"
                  >
                    استجابة وتوجه للموقع 🚑
                  </button>
                </div>
              ) : (
                activeReport.id === currentTask?.id && (
                  <button
                    onClick={() => resolveReport(activeReport.id)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-900/50 transition text-sm lg:text-base"
                  >
                    إتمام المهمة ✅
                  </button>
                )
              )}
            </div>
          ) : (
            // Idle State - Show List of Nearby Requests
            <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl p-3 lg:p-4 max-h-[50vh] overflow-y-auto">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm lg:text-base">
                <span>📡</span>
                <span>البلاغات القريبة المتاحة ({availableReports.length})</span>
              </h3>
              
              {availableReports.length === 0 ? (
                <div className="text-center py-4">
                   <p className="text-slate-400 text-xs lg:text-sm">جاري المسح... لا توجد بلاغات نشطة حالياً.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableReports.map(report => (
                    <div 
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-red-400 bg-red-900/20 px-1 rounded">{report.type}</span>
                           <span className="text-[10px] text-slate-500">{new Date(report.timestamp).toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-xs lg:text-sm text-slate-300 line-clamp-1 mt-1">{report.description}</p>
                      </div>
                      <div className="text-left">
                         <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">عرض</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;