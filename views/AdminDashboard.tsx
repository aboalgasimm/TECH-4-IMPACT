import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MapComponent from '../components/MapComponent';
import NotificationToast from '../components/NotificationToast';
import { ReportStatus, IssueType } from '../types';

const AdminDashboard: React.FC = () => {
  const { reports, volunteers, predictions, summary, runAiAnalysis, logout } = useApp();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [showAiMobile, setShowAiMobile] = useState(false);

  const activeReports = reports.filter(r => r.status !== ReportStatus.RESOLVED);
  const resolvedCount = reports.filter(r => r.status === ReportStatus.RESOLVED).length;
  
  // Stats
  const avgSeverity = activeReports.length > 0 
    ? (activeReports.reduce((acc, r) => acc + (r.aiSeverityScore || 0), 0) / activeReports.length).toFixed(1) 
    : '0';

  // Determine map focus
  const selectedReport = activeReports.find(r => r.id === selectedReportId);
  const mapCenter = selectedReport ? selectedReport.location : { lat: 24.4672, lng: 39.6102 };
  const mapZoom = selectedReport ? 16 : 14;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 text-right" dir="rtl">
      <NotificationToast />
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center px-4 justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h1 className="font-bold text-sm lg:text-lg tracking-wide uppercase">مركز القيادة</h1>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm">
          {/* Heatmap Toggle */}
          <button 
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`px-2 py-1 lg:px-3 rounded border transition flex items-center gap-1 lg:gap-2 ${heatmapMode ? 'bg-red-900/50 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
             <span>🔥</span>
             <span className="hidden lg:inline">خريطة حرارية</span>
          </button>

          {/* AI Toggle for Mobile */}
          <button 
             onClick={() => setShowAiMobile(!showAiMobile)}
             className={`lg:hidden px-2 py-1 rounded border transition flex items-center gap-1 ${showAiMobile ? 'bg-blue-900/50 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
             🤖
          </button>

          <div className="hidden lg:flex px-3 py-1 bg-slate-800 rounded border border-slate-700">
            <span className="text-slate-400 ml-2">المتطوعون:</span>
            <span className="font-mono font-bold text-emerald-400">{volunteers.filter(v => v.isOnline).length} / {volunteers.length}</span>
          </div>
          <div className="px-2 lg:px-3 py-1 bg-slate-800 rounded border border-slate-700">
            <span className="text-slate-400 ml-1 lg:ml-2">نشطة:</span>
            <span className="font-mono font-bold text-red-400">{activeReports.length}</span>
          </div>
          <button onClick={logout} className="text-red-400 hover:text-red-300 underline text-xs">خروج</button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Mobile: Map is on top. Desktop: Map is Center */}
        <main className="flex-1 relative order-1 lg:order-2 h-[50vh] lg:h-auto">
          <MapComponent 
            reports={reports} 
            volunteers={volunteers} 
            predictions={predictions} 
            center={mapCenter}
            zoom={mapZoom}
            heatmapMode={heatmapMode}
          />
          
          {/* Overlay Stats - Top Left on Map */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 lg:p-4 rounded-lg w-auto lg:w-64 z-[1000] text-right pointer-events-none">
            <h3 className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase mb-1 lg:mb-2">حالة النظام</h3>
            <div className="flex lg:grid lg:grid-cols-2 gap-4">
              <div>
                <p className="text-lg lg:text-2xl font-bold text-white">{resolvedCount}</p>
                <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase">تمت المعالجة</p>
              </div>
              <div>
                <p className="text-lg lg:text-2xl font-bold text-orange-400">{avgSeverity}</p>
                <p className="text-[9px] lg:text-[10px] text-slate-500 uppercase">متوسط الخطورة</p>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Feed (Reports) */}
        {/* Mobile: Bottom Half. Desktop: Right Sidebar */}
        <aside className="w-full lg:w-80 h-[50vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col z-10 order-2 lg:order-1">
          <div className="p-3 lg:p-4 border-b border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0 lg:mb-2">البلاغات الحية</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3">
            {activeReports.length === 0 && <p className="text-slate-600 text-center italic mt-10">لا توجد بلاغات نشطة</p>}
            {activeReports.map(report => (
              <div 
                key={report.id} 
                onClick={() => {
                  setSelectedReportId(report.id);
                  setHeatmapMode(false); // Disable heatmap to see pin
                }}
                className={`p-3 rounded border-r-4 cursor-pointer transition-all duration-200 ${
                  selectedReportId === report.id 
                    ? 'bg-slate-800 border-red-500 shadow-lg scale-[1.02]' 
                    : 'bg-slate-900/50 border-transparent hover:bg-slate-800 hover:border-red-900'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${selectedReportId === report.id ? 'text-white' : 'text-slate-300'}`}>{report.type}</span>
                  <span className="text-[10px] bg-red-900/50 text-red-300 px-1 rounded">{new Date(report.timestamp).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2">{report.description}</p>
                <div className="mt-2 flex justify-between items-center">
                   <span className="text-[10px] text-slate-500">
                     شدة: {report.aiSeverityScore} | {report.assignedVolunteerId ? 'تم التوجيه' : 'معلق'}
                   </span>
                   {selectedReportId === report.id && <span className="text-[10px] text-red-400 animate-pulse">● الخريطة</span>}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Left Sidebar - AI Analysis */}
        {/* Desktop: Visible Left. Mobile: Hidden Overlay */}
        <aside className={`
          absolute lg:relative inset-0 lg:inset-auto z-[2000] lg:z-10
          w-full lg:w-80 h-full lg:h-auto 
          bg-slate-900/95 lg:bg-slate-900 backdrop-blur lg:backdrop-none
          border-r border-slate-800 flex flex-col order-3
          transition-transform duration-300
          ${showAiMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
           <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-wider">تحليل الذكاء الاصطناعي</h2>
            <div className="flex gap-2">
                <button 
                  onClick={runAiAnalysis}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition"
                >
                  تحليل الآن
                </button>
                <button onClick={() => setShowAiMobile(false)} className="lg:hidden text-slate-400">✕</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Summary Module */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">ملخص الموقف</h3>
              <div className="p-3 bg-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed border border-slate-700/50">
                {summary}
              </div>
            </div>

            {/* Predictions Module */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">توقعات الحشود</h3>
              {predictions.length === 0 ? (
                <p className="text-xs text-slate-500">قم بتشغيل التحليل لتوليد توقعات بناءً على تجمعات البلاغات.</p>
              ) : (
                <div className="space-y-2">
                  {predictions.map(pred => (
                    <div key={pred.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] uppercase font-bold px-1 rounded ${
                          pred.severity === 'high' ? 'bg-red-900 text-red-300' : 'bg-orange-900 text-orange-300'
                        }`}>
                          خطر {pred.severity === 'high' ? 'عالي' : 'متوسط'}
                        </span>
                        <span className="text-[10px] text-slate-500">{Math.round(pred.radius)}م</span>
                      </div>
                      <p className="text-xs text-slate-300">{pred.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminDashboard;