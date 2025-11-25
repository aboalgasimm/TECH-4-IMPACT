import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ReportStatus } from '../types';
import MapComponent from '../components/MapComponent';

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

// Interface for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const PublicReport: React.FC = () => {
  const { addReport, reports, volunteers, userProfile, logout, notify, publicActiveReportId, setPublicActiveReportId } = useApp();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locError, setLocError] = useState('');
  const [safetyAdvice, setSafetyAdvice] = useState<string[]>([]);
  
  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition on Mount
  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const Recognition = SpeechRecognition || webkitSpeechRecognition;

    if (Recognition) {
      const recognition = new Recognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          notify('إذن الميكروفون', 'تم رفض الوصول للميكروفون. يرجى تفعيله من إعدادات المتصفح.', 'alert');
        } else if (event.error === 'network') {
          if (!navigator.onLine) {
             notify('خطأ اتصال', 'لا يوجد اتصال بالإنترنت.', 'alert');
          } else {
             notify('خدمة الصوت', 'خدمة التعرف الصوتي غير متاحة حالياً (محجوبة أو مشغولة). يرجى الكتابة يدوياً.', 'alert');
          }
        } else if (event.error === 'no-speech') {
          // Do nothing, just timeout
        } else {
          notify('خطأ', `حدث خطأ في الصوت: ${event.error}`, 'alert');
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [notify]);

  const activeReport = useMemo(() => 
    reports.find(r => r.id === publicActiveReportId || ''), 
  [reports, publicActiveReportId]);

  const assignedVolunteer = useMemo(() => 
    (activeReport?.assignedVolunteerId && activeReport.status === ReportStatus.ASSIGNED)
      ? volunteers.find(v => v.id === activeReport.assignedVolunteerId)
      : null,
  [activeReport, volunteers]);

  const eta = useMemo(() => {
    if (!activeReport || !assignedVolunteer) return null;
    const distKm = calculateDistance(
      assignedVolunteer.location.lat,
      assignedVolunteer.location.lng,
      activeReport.location.lat,
      activeReport.location.lng
    );
    const speedKmH = 15; 
    const timeMins = Math.ceil((distKm / speedKmH) * 60);
    return { dist: distKm.toFixed(2), time: timeMins };
  }, [activeReport, assignedVolunteer]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("خدمة الموقع غير مدعومة");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        // Fallback for Madinah demo
        setLocation({ lat: 24.4672, lng: 39.6102 });
        setLocError("تعذر الوصول للموقع. تم استخدام موقع تجريبي (المدينة المنورة).");
      }
    );
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      notify('غير مدعوم', 'عذراً، متصفحك لا يدعم خاصية تحويل الصوت إلى نص.', 'alert');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.warn("Speech start error:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !description) return;
    setIsSubmitting(true);
    const { report, advice } = await addReport(description, location);
    setIsSubmitting(false);
    setPublicActiveReportId(report.id);
    setSafetyAdvice(advice);
    setDescription('');
  };

  const handleReset = () => {
    setPublicActiveReportId(null);
    setLocation(null);
    setSafetyAdvice([]);
  };

  // Tracking View
  if (publicActiveReportId) {
    if (!activeReport) return <div className="text-white text-center p-10">جاري تحميل الحالة...</div>;
    
    const isResolved = activeReport.status === ReportStatus.RESOLVED;

    return (
      <div className="max-w-md mx-auto p-4 bg-slate-900 min-h-screen flex flex-col text-center">
        <div className="mb-4 flex justify-between items-center">
           <h1 className="text-xl font-bold text-white">حالة البلاغ مباشر</h1>
           <button onClick={logout} className="text-xs text-red-400">خروج</button>
        </div>

        {/* Live Map */}
        <div className="w-full h-48 bg-slate-800 rounded-xl overflow-hidden mb-6 border border-slate-700 shadow-lg">
           <MapComponent 
              reports={[activeReport]}
              volunteers={assignedVolunteer ? [assignedVolunteer] : []}
              center={activeReport.location}
              zoom={15}
              interactive={false}
           />
        </div>

        {isResolved ? (
          <div className="w-full bg-green-600/20 border border-green-500 p-8 rounded-xl animate-fade-in mb-6">
             <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <h2 className="text-xl font-bold text-green-400">تم حل المشكلة</h2>
             <p className="text-slate-300 mt-2">شكراً لتعاونكم.</p>
          </div>
        ) : assignedVolunteer ? (
          <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl mb-6">
            <div className="flex justify-center mb-6">
               <div className="relative">
                 <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center border-4 border-slate-900">
                   <span className="text-2xl">⛑️</span>
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-slate-900 animate-pulse"></div>
               </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{assignedVolunteer.name}</h2>
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-6">في الطريق إليك</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs uppercase">الوصول المتوقع</p>
                <p className="text-2xl font-bold text-white">{eta?.time} <span className="text-sm font-normal text-slate-400">دقيقة</span></p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs uppercase">المسافة</p>
                <p className="text-2xl font-bold text-white">{eta?.dist} <span className="text-sm font-normal text-slate-400">كم</span></p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-6 animate-pulse mb-6">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-lg font-bold text-white">جاري التوجيه...</h2>
            <p className="text-slate-400 mt-2">نبحث عن أقرب متطوع في المنطقة.</p>
          </div>
        )}

        {/* AI Safety Advice */}
        {safetyAdvice.length > 0 && !isResolved && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 text-right mb-6">
             <div className="flex items-center gap-2 mb-3">
               <span className="text-blue-400">ℹ️</span>
               <h3 className="text-blue-400 font-bold">إرشادات الذكاء الاصطناعي</h3>
             </div>
             <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
               {safetyAdvice.map((tip, idx) => (
                 <li key={idx}>{tip}</li>
               ))}
             </ul>
          </div>
        )}

        <button 
          onClick={handleReset}
          className="mt-4 text-slate-500 hover:text-white underline text-sm transition"
        >
          تقديم بلاغ آخر
        </button>
      </div>
    );
  }

  // Input Form
  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 min-h-screen flex flex-col justify-center text-right">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-2">طلب نجدة</h1>
        <p className="text-slate-400">صف الحالة بدقة. المساعدة قريبة.</p>
        {userProfile && <p className="text-sm text-slate-500 mt-2">أهلاً، {userProfile.name}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">الموقع</label>
            {!location ? (
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                مشاركة موقعي الحالي
              </button>
            ) : (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex justify-between items-center">
                <span className="text-green-400 text-sm">تم تحديد الموقع</span>
                <span className="text-xs text-slate-500" dir="ltr">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
            )}
            {locError && <p className="text-xs text-yellow-500">{locError}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">ماذا يحدث؟</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-red-500 focus:outline-none pl-12"
                placeholder="اضغط على الميكروفون للتحدث أو اكتب هنا..."
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute bottom-3 left-3 p-3 rounded-full transition-all duration-300 shadow-lg ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse scale-110 shadow-red-500/50' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="تحدث للإبلاغ"
              >
                {isListening ? (
                  <div className="flex gap-1 h-5 items-center">
                    <div className="w-1 h-3 bg-white animate-bounce"></div>
                    <div className="w-1 h-5 bg-white animate-bounce delay-75"></div>
                    <div className="w-1 h-3 bg-white animate-bounce delay-150"></div>
                  </div>
                ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                )}
              </button>
            </div>
            {isListening && <p className="text-xs text-red-400 animate-pulse">جاري الاستماع...</p>}
          </div>

          <button
            type="submit"
            disabled={!location || !description || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition
              ${(!location || !description) 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
              }
            `}
          >
            {isSubmitting ? 'جاري الإرسال...' : 'اطلب المساعدة الآن'}
          </button>
          
          <button type="button" onClick={logout} className="w-full text-center text-slate-600 text-sm mt-4 hover:text-slate-400">
            تسجيل خروج
          </button>
        </form>
    </div>
  );
};

export default PublicReport;