import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showAlert) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-bold shadow-2xl transition-all duration-300 border backdrop-blur-md animate-bounce-short" style={{
      backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.95)' : 'rgba(217, 119, 6, 0.95)',
      color: '#ffffff',
      borderColor: isOnline ? '#34d399' : '#fbbf24'
    }}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-100 animate-pulse" />
          <span>تم استعادة الاتصال بالإنترنت - يتم المزامنة تلقائياً</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-100 animate-pulse" />
          <span>وضع العمل بدون إنترنت (Offline) - النظام يعمل محلياً بكامل الكفاءة</span>
        </>
      )}
    </div>
  );
};
