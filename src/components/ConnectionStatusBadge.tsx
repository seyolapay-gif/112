import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ShieldCheck,
  Server,
  Radio
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface ConnectionStatusBadgeProps {
  compact?: boolean;
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({ 
  compact = false,
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);
  const [latency, setLatency] = useState<number | null>(null);
  const [quality, setQuality] = useState<ConnectionQuality>('good');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ping test function
  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setQuality('offline');
      setLatency(null);
      setLastChecked(new Date());
      return;
    }

    setIsTesting(true);
    const startTime = performance.now();
    try {
      // Ping health check endpoint with cache busting
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`/api/health?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const endTime = performance.now();
      const pingMs = Math.round(endTime - startTime);

      if (response.ok) {
        setIsOnline(true);
        setLatency(pingMs);
        setLastChecked(new Date());

        if (pingMs < 120) {
          setQuality('excellent');
        } else if (pingMs < 300) {
          setQuality('good');
        } else if (pingMs < 700) {
          setQuality('fair');
        } else {
          setQuality('poor');
        }
      } else {
        setIsOnline(true);
        setLatency(pingMs);
        setQuality('fair');
        setLastChecked(new Date());
      }
    } catch {
      // Fallback: check if internet connection is alive
      if (!navigator.onLine) {
        setIsOnline(false);
        setQuality('offline');
        setLatency(null);
      } else {
        // Server might be busy or temporary slow response
        setIsOnline(true);
        setQuality('poor');
        setLatency(null);
      }
      setLastChecked(new Date());
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setQuality('offline');
      setLatency(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    checkConnection();

    // Periodic check every 35 seconds
    const interval = setInterval(() => {
      checkConnection();
    }, 35000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Config mapping
  const qualityConfig = {
    excellent: {
      label: 'اتصال ممتاز',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/60',
      borderColor: 'border-emerald-500/40',
      dotColor: 'bg-emerald-400',
      barCount: 4,
      desc: 'سرعة استجابة فائقة، مثالي لمعالجة التحويلات اللحظية',
    },
    good: {
      label: 'اتصال جيد',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/60',
      borderColor: 'border-cyan-500/40',
      dotColor: 'bg-cyan-400',
      barCount: 3,
      desc: 'استقرار ممتاز في إرسال واستلام البيانات المالية',
    },
    fair: {
      label: 'اتصال متوسط',
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/60',
      borderColor: 'border-amber-500/40',
      dotColor: 'bg-amber-400',
      barCount: 2,
      desc: 'استجابة مقبولة، قد تلاحظ تأخيراً طفيفاً في التحديث',
    },
    poor: {
      label: 'اتصال بطيء',
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/60',
      borderColor: 'border-orange-500/40',
      dotColor: 'bg-orange-400',
      barCount: 1,
      desc: 'شبكة الإنترنت بطيئة أو غير مستقرة حالياً',
    },
    offline: {
      label: 'غير متصل',
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/60',
      borderColor: 'border-rose-500/40',
      dotColor: 'bg-rose-400',
      barCount: 0,
      desc: 'انقطع الاتصال بالإنترنت، يرجى التحقق من الشبكة',
    },
  }[quality];

  return (
    <div className={`relative ${className}`} ref={dropdownRef} dir="rtl">
      {/* Main Visible Interactive Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border ${qualityConfig.borderColor} ${qualityConfig.bgColor} hover:bg-slate-800/80 transition-all cursor-pointer shadow-sm group`}
          title={`حالة الاتصال: ${qualityConfig.label} ${latency !== null ? `(${latency} ms)` : ''}`}
        >
          {/* Signal Strength Bars Icon */}
          <div className="flex items-end gap-0.5 h-3.5 w-4 pb-0.5" aria-hidden="true">
            <span 
              className={`w-1 rounded-sm transition-all duration-300 ${
                qualityConfig.barCount >= 1 ? qualityConfig.dotColor : 'bg-slate-700'
              } h-1.5`} 
            />
            <span 
              className={`w-1 rounded-sm transition-all duration-300 ${
                qualityConfig.barCount >= 2 ? qualityConfig.dotColor : 'bg-slate-700'
              } h-2.5`} 
            />
            <span 
              className={`w-1 rounded-sm transition-all duration-300 ${
                qualityConfig.barCount >= 3 ? qualityConfig.dotColor : 'bg-slate-700'
              } h-3`} 
            />
            <span 
              className={`w-1 rounded-sm transition-all duration-300 ${
                qualityConfig.barCount >= 4 ? qualityConfig.dotColor : 'bg-slate-700'
              } h-3.5`} 
            />
          </div>

          {/* Text and Latency */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold ${qualityConfig.color} hidden sm:inline whitespace-nowrap`}>
              {qualityConfig.label}
            </span>
            
            {latency !== null && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                {latency}ms
              </span>
            )}
          </div>

          {/* Pulse Live Dot */}
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${qualityConfig.dotColor} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${qualityConfig.dotColor}`} />
          </span>
        </button>
      </div>

      {/* Expanded Details Popover */}
      {showDetails && (
        <div 
          className="absolute left-0 mt-2 w-80 sm:w-88 bg-slate-950/95 border border-slate-700 rounded-3xl shadow-2xl p-4 sm:p-5 z-50 backdrop-blur-xl text-right animate-in fade-in zoom-in-95 duration-150"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-xl ${qualityConfig.bgColor} border ${qualityConfig.borderColor} flex items-center justify-center`}>
                <Radio className={`w-4 h-4 ${qualityConfig.color}`} />
              </div>
              <div>
                <span className="font-bold text-white text-xs block">مراقب جودة الاتصال</span>
                <span className="text-[10px] text-slate-400">فحص زمن الاستجابة الحقيقي (Ping)</span>
              </div>
            </div>

            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${qualityConfig.borderColor} ${qualityConfig.bgColor} ${qualityConfig.color}`}>
              {qualityConfig.label}
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1">سرعة الاستجابة</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-white">
                  {latency !== null ? latency : '--'}
                </span>
                <span className="text-[10px] text-slate-400">مللي ثانية (ms)</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1">حالة الشبكة</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">متصل بالإنترنت</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-400">غير متصل</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description & Status */}
          <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-[11px] text-slate-300 mb-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>تقييم الأداء:</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {qualityConfig.desc}
            </p>
          </div>

          {/* Bottom Actions and Info */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
            <span className="font-mono">
              آخر فحص: {formatTime(lastChecked)}
            </span>

            <button
              onClick={checkConnection}
              disabled={isTesting}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer text-xs shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'جاري الفحص...' : 'إعادة الفحص الآن'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
