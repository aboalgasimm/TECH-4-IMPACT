import React from 'react';
import { useApp } from '../context/AppContext';
import { NotificationType } from '../types';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  const getBgColor = (type: NotificationType) => {
    switch (type) {
      case 'alert': return 'bg-red-600 border-red-500';
      case 'success': return 'bg-green-600 border-green-500';
      case 'info': default: return 'bg-blue-600 border-blue-500';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert': return '⚠️';
      case 'success': return '✅';
      case 'info': default: return 'ℹ️';
    }
  };

  return (
    <div className="fixed top-16 left-4 right-4 md:right-auto md:w-80 z-[2000] flex flex-col gap-2 pointer-events-none">
      {notifications.map((note) => (
        <div 
          key={note.id}
          className={`${getBgColor(note.type)} text-white p-3 md:p-4 rounded-lg shadow-2xl border-l-4 pointer-events-auto flex items-start gap-3 animate-slide-in transition-all duration-300 w-full`}
          dir="rtl"
        >
          <span className="text-xl">{getIcon(note.type)}</span>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{note.title}</h4>
            <p className="text-xs text-slate-100 mt-1 leading-snug">{note.message}</p>
          </div>
          <button 
            onClick={() => removeNotification(note.id)}
            className="text-white/50 hover:text-white px-2"
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;