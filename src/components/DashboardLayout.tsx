import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { onConnectionStatusChange, api } from '../services/api';
import { formatLongDate, formatTime, formatAmount } from '../utils/formatters';
import { 
  LayoutDashboard, 
  Wallet, 
  History, 
  Gauge, 
  BarChart3, 
  Users, 
  Settings, 
  FileText, 
  HardDrive, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowDownLeft,
  User as UserIcon,
  ChevronDown,
  Building2,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { UserProfileModal } from './UserProfileModal';
import { UserAccountMenu } from './UserAccountMenu';
import { ThemeToggleButton } from './ThemeToggleButton';

interface DashboardLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewTransfer: () => void;
  onOpenReceiveMoney?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTransfer,
  onOpenReceiveMoney,
  onRefresh,
  isRefreshing,
  children,
}) => {
  const { user, logout, canManageUsers, canManageLines, canManageSettings } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const [totalProjectFunds, setTotalProjectFunds] = useState<number | null>(null);

  const loadTotalProjectFunds = async () => {
    try {
      const data = await api.getTotalProjectFunds();
      if (data && typeof data.totalProjectFunds === 'number') {
        setTotalProjectFunds(data.totalProjectFunds);
      }
    } catch {
      // Fallback: calculate from vaults + lines
      try {
        const [vRes, lRes] = await Promise.all([
          api.getVaults().catch(() => null),
          api.getLines().catch(() => null),
        ]);
        if (vRes?.vaults) {
          const mainBal = vRes.vaults.find((v: any) => v.type === 'main')?.balance || 0;
          const subBal = vRes.vaults.filter((v: any) => v.type === 'sub').reduce((s: number, v: any) => s + (v.balance || 0), 0);
          const custBal = vRes.vaults.find((v: any) => v.type === 'customer')?.balance || 0;
          const linesBal = lRes ? lRes.filter((l: any) => l.status === 'active').reduce((s: number, l: any) => s + (l.balance || 0), 0) : custBal;
          setTotalProjectFunds(mainBal + subBal + (linesBal || custBal));
        }
      } catch (err) {
        console.error('Failed to load project funds:', err);
      }
    }
  };

  useEffect(() => {
    loadTotalProjectFunds();
    const handleUpdate = () => {
      loadTotalProjectFunds();
    };
    window.addEventListener('app:global-refresh', handleUpdate);
    window.addEventListener('app:balance-updated', handleUpdate);
    const timer = setInterval(loadTotalProjectFunds, 8000);
    return () => {
      window.removeEventListener('app:global-refresh', handleUpdate);
      window.removeEventListener('app:balance-updated', handleUpdate);
      clearInterval(timer);
    };
  }, []);

  const isRefreshingActive = isRefreshing !== undefined ? isRefreshing : internalRefreshing;

  const handleRefresh = async () => {
    setInternalRefreshing(true);
    window.dispatchEvent(new CustomEvent('app:global-refresh'));
    loadTotalProjectFunds();
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        console.error('Refresh error:', err);
      }
    }
    setTimeout(() => {
      setInternalRefreshing(false);
    }, 600);
  };

  const notificationsRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Reliable scroll-to-top handler for navigating between tabs and actions
  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  // Whenever the active tab changes, always reset scroll position to the top
  useEffect(() => {
    scrollToTop();
    const raf = requestAnimationFrame(scrollToTop);
    const t = setTimeout(scrollToTop, 50);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [currentTab]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subscribe to connection errors
  useEffect(() => {
    const unsubscribe = onConnectionStatusChange((hasError, msg) => {
      setConnectionError(hasError ? (msg || 'تعذّر الاتصال بالخادم، تحقق من الاتصال وحاول مجددًا') : null);
    });
    return unsubscribe;
  }, []);

  // Update clock with Arabic language but English digits
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = formatLongDate(now);
      const timePart = formatTime(now);
      setCurrentTimeStr(`${datePart} · الساعة ${timePart}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const isHealthy = await api.checkHealth();
      if (isHealthy) {
        setConnectionError(null);
        window.location.reload();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'vaults', label: 'إدارة الخزن المالية', icon: Building2 },
    { id: 'handovers', label: 'التسليم والتسلّم (النوبات)', icon: Layers },
    { id: 'lines', label: 'خطوط الكاش والمحافظ', icon: Wallet },
    { id: 'transfers', label: 'سجل التحويلات والعمليات', icon: History },
    { id: 'limits', label: 'الحدود اليومية والشهرية', icon: Gauge },
    { id: 'reports', label: 'التقارير المالية', icon: BarChart3 },
    ...(canManageUsers ? [{ id: 'users', label: 'المستخدمون والصلاحيات', icon: Users }] : []),
    ...(canManageSettings ? [{ id: 'settings', label: 'الإعدادات', icon: Settings }] : []),
    { id: 'audit', label: 'سجل التدقيق', icon: FileText },
    ...(canManageSettings ? [{ id: 'backup', label: 'النسخ الاحتياطي والاستعادة', icon: HardDrive }] : []),
    ...(user?.role === 'admin' ? [{ id: 'admin_control', label: 'لوحة التحكم', icon: SlidersHorizontal }] : []),
  ];

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Sidebar (Desktop & Tablet) - 100% Fixed and Anchored, never moves up or down */}
      <aside className="hidden lg:flex flex-col w-72 h-full bg-slate-900 border-l border-slate-800 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center p-1 shadow-lg shadow-black/20 shrink-0">
            <img src="/logo.png" alt="Seolah" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base leading-tight">
              إدارة التحويلات المالية
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تحويلات بنكية · محافظ · خطوط كاش
            </p>
          </div>
        </div>

        {/* Navigation Links - Scrollable internally if screen is short, but sidebar frame is 100% fixed */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  scrollToTop();
                  if (item.id === 'new_transfer') {
                    onOpenNewTransfer();
                  } else if (item.id === 'receive_money') {
                    if (onOpenReceiveMoney) onOpenReceiveMoney();
                    else onSelectTab('receive_money');
                  } else {
                    onSelectTab(item.id);
                  }
                  requestAnimationFrame(scrollToTop);
                  setTimeout(scrollToTop, 20);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer leading-normal ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area - Full height with fixed header and scrollable body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Bar Header - 100% Fixed and Anchored at Top, perfectly aligned single straight line with no wrapping, no horizontal scrollbar, overflow visible for popups */}
        <header className="shrink-0 h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4 lg:px-5 flex items-center justify-between z-40 relative gap-1.5 sm:gap-2.5 flex-nowrap overflow-visible">
          
          {/* Right Section: Mobile toggle & Date / Live clock & Total Project Funds & Refresh Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer shrink-0 transition"
              title="القائمة الجانبية"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Date and Live Clock */}
            <div className="h-9 flex items-center gap-1.5 px-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 select-none">
              <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[125px] sm:max-w-none">{currentTimeStr || 'السبت 26 أبريل 2025'}</span>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* المبلغ المتاح للمشروع بالكامل (الخزن + خطوط الكاش) - رقم مدمج وأنيق بأفضل درجات اللون الأخضر الزمردي */}
            <div 
              className="project-funds-badge h-9 px-2 sm:px-2.5 rounded-xl shadow-xs flex items-center gap-1.5 select-none cursor-default shrink-0 transition-all group"
              title="المبلغ المتاح للمشروع بالكامل من جميع الأموال التي في الخزن وخطوط الكاش"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="project-funds-number font-mono font-black text-[11px] sm:text-xs tracking-tight">
                {totalProjectFunds !== null ? formatAmount(totalProjectFunds, 2) : '...'}
              </span>
              <span className="project-funds-currency text-[10px] font-bold font-sans mr-0.5">
                ج.م
              </span>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* Unified Global Refresh Button - Icon Only, perfectly sized w-9 h-9 */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshingActive}
              className="w-9 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700 cursor-pointer transition active:scale-95 shrink-0 group disabled:opacity-60"
              title="تحديث كافة بيانات البرنامج فوراً"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-500 ${isRefreshingActive ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          </div>

          {/* Left Section: Quick Actions, Notifications, Theme, and User Profile on the exact same straight line */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            {/* Dark / Light Mode Toggle: exact w-9 h-9 */}
            <ThemeToggleButton />

            {/* Notifications Bell Icon: exact w-9 h-9 */}
            <div className="relative shrink-0" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200 dark:border-slate-700 relative cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                title="الإشعارات والتنبيهات"
              >
                <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white mb-2">
                    <span>التنبيهات المالية</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">محدث الآن</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold block">اقتراب استهلاك الحد:</span>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">خط فودافون كاش 1 استهلك 85% من الحد اليومي المسموح.</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">تحديث السيولة:</span>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">تم تسجيل حوالة موازنة رصيد بقيمة 45,000 ج.م بنجاح.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0" />

            {/* Quick Receive Money Action Button: h-9 */}
            <button
              onClick={() => {
                if (onOpenReceiveMoney) onOpenReceiveMoney();
                else onOpenNewTransfer();
              }}
              className={`h-9 px-2.5 sm:px-3 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95 whitespace-nowrap shrink-0 ${
                currentTab === 'receive_money'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 ring-2 ring-blue-400 shadow-blue-600/40'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-600/20'
              }`}
              title="صفحة استلام أموال"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>استلام</span>
            </button>

            {/* Quick New Transfer Action Button: h-9 */}
            <button
              onClick={() => {
                onOpenNewTransfer();
              }}
              className={`h-9 px-2.5 sm:px-3 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95 whitespace-nowrap shrink-0 ${
                currentTab === 'new_transfer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 ring-2 ring-emerald-400 shadow-emerald-600/40'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
              }`}
              title="صفحة تحويل أموال"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>تحويل</span>
            </button>

            {/* Far Left: User Profile Avatar & Menu */}
            <div className="shrink-0">
              <UserAccountMenu
                onSelectTab={onSelectTab}
                onOpenNewTransfer={onOpenNewTransfer}
                onOpenReceiveMoney={onOpenReceiveMoney}
              />
            </div>
          </div>
        </header>

        {/* Compact Server Connection Error Banner */}
        {connectionError && (
          <div className="shrink-0 bg-rose-950/90 border-b border-rose-500/40 px-4 sm:px-8 py-2.5 text-xs flex items-center justify-between text-rose-200 shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{connectionError}</span>
            </div>
            <button
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition text-[11px] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm" dir="rtl">
            <div className="w-72 bg-slate-900 h-full p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-1 shrink-0">
                      <img src="/logo.png" alt="Seolah" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-white text-sm">إدارة التحويلات المالية</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          scrollToTop();
                          if (item.id === 'new_transfer') {
                            onOpenNewTransfer();
                          } else if (item.id === 'receive_money') {
                            if (onOpenReceiveMoney) onOpenReceiveMoney();
                            else onSelectTab('receive_money');
                          } else {
                            onSelectTab(item.id);
                          }
                          requestAnimationFrame(scrollToTop);
                          setTimeout(scrollToTop, 20);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold ${
                          isActive ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <button
                onClick={logout}
                className="w-full py-2.5 bg-rose-950/60 text-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-rose-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewport Content - Only this area scrolls vertically */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 lg:p-4 w-full min-w-0">
          {children}
        </main>

      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

    </div>
  );
};
