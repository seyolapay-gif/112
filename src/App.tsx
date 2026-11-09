import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TypographyProvider } from './context/TypographyContext';
import { LoginView } from './components/LoginView';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardView } from './components/DashboardView';
import { CashLinesView } from './components/CashLinesView';
import { NewTransferView } from './components/NewTransferView';
import { TransfersLogView } from './components/TransfersLogView';
import { LimitsView } from './components/LimitsView';
import { ReportsView } from './components/ReportsView';
import { UsersView } from './components/UsersView';
import { SettingsView } from './components/SettingsView';
import { AuditLogView } from './components/AuditLogView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { VaultsManagementView } from './components/VaultsManagementView';
import { ShiftHandoverView } from './components/ShiftHandoverView';
import { AdminControlPanelView } from './components/AdminControlPanelView';
import { ReceiptModal } from './components/ReceiptModal';
import { TransferDetailsModal } from './components/TransferDetailsModal';
import { OperationSuccessModal } from './components/OperationSuccessModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MinimizedOperationsBar } from './components/MinimizedOperationsBar';
import { Transfer, OperationSession, SystemSettings } from './types';
import { api } from './services/api';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Captured view error in TabErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center my-8 max-w-lg mx-auto shadow-2xl" dir="rtl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white mb-1.5">تعذر عرض هذه الصفحة حالياً</h2>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            حدث خطأ غير متوقع أثناء معالجة البيانات، تم حفظ حالة التطبيق ويمكنك إعادة المحاولة بأمان.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة تحميل الشاشة</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [initialLineForTransfer, setInitialLineForTransfer] = useState<string | undefined>(undefined);
  const [filterLineIdForHistory, setFilterLineIdForHistory] = useState<string | undefined>(undefined);

  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'إدارة التحويلات المالية الذكية',
    currency: 'ج.م',
    warningThresholdPercent: 80,
    timezone: 'Africa/Cairo',
    enableCommissionTracking: true,
    defaultDailyLimit: 60000,
    defaultMonthlyLimit: 200000,
    integrationsMockMode: false,
    allowOverdraft: false,
  });

  React.useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  // Modals state
  const [selectedReceiptTransfer, setSelectedReceiptTransfer] = useState<Transfer | null>(null);
  const [selectedDetailsTransfer, setSelectedDetailsTransfer] = useState<Transfer | null>(null);
  const [transferMode, setTransferMode] = useState<'transfer' | 'receive'>('transfer');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  const handleGlobalRefresh = async () => {
    setIsGlobalRefreshing(true);
    try {
      await api.getSettings().then(setSettings).catch(() => {});
    } finally {
      setTimeout(() => {
        setIsGlobalRefreshing(false);
      }, 600);
    }
  };

  // Multi-Operation Sessions state (support > 2 concurrent operations)
  const [sessionsCounter, setSessionsCounter] = useState(1);
  const [activeSession, setActiveSession] = useState<OperationSession | null>(null);
  const [minimizedSessions, setMinimizedSessions] = useState<OperationSession[]>([]);

  const buildNewSession = (mode: 'transfer' | 'receive' = 'transfer', lineId?: string): OperationSession => {
    const num = sessionsCounter;
    setSessionsCounter(prev => prev + 1);
    return {
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionNumber: num,
      mode,
      sourceLineId: lineId,
      transferType: 'cash_wallet',
      recipientType: 'wallet',
      recipientNumber: '',
      recipientName: '',
      destinationBankOrWallet: 'فودافون كاش',
      amount: '',
      fee: '0',
      overrideLimit: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  const hasSessionContent = (s: OperationSession | null): boolean => {
    if (!s) return false;
    return Boolean(
      (s.recipientNumber && s.recipientNumber.trim().length > 0) ||
      (s.amount && Number(s.amount) > 0) ||
      (s.recipientName && s.recipientName.trim().length > 0)
    );
  };

  // Helper to get next daily operation sequence number following today's successful operations
  const getNextSequentialOpNumber = (currentList: OperationSession[], currentSessionId?: string): number => {
    const todayCompletedCount = api.getTodaySuccessfulTransfersCount();
    const unnamedCount = currentList.filter(s => {
      if (s.id === currentSessionId) return false;
      const name = (s.recipientName || '').trim();
      return !name || name === 'عميل نقدي' || name === 'عميل مودع';
    }).length;
    return todayCompletedCount + unnamedCount + 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3" dir="rtl">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm font-semibold">جاري تهيئة نظام إدارة التحويلات...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenNewTransfer = (lineId?: string) => {
    setFilterLineIdForHistory(undefined);
    setTransferMode('transfer');
    setCurrentTab('new_transfer');

    // If active session exists on transfer mode and without explicit new lineId requested, keep it
    if (activeSession && activeSession.mode === 'transfer' && !lineId) {
      return;
    }

    // If active session has entered data, minimize it automatically to prevent work loss
    if (hasSessionContent(activeSession)) {
      const dockedSession = { ...activeSession! };
      if (!dockedSession.sequentialOpNumber) {
        dockedSession.sequentialOpNumber = getNextSequentialOpNumber(minimizedSessions, dockedSession.id);
      }
      setMinimizedSessions(prev => [dockedSession, ...prev.filter(s => s.id !== dockedSession.id)]);
    }

    const newOp = buildNewSession('transfer', lineId || initialLineForTransfer);
    setActiveSession(newOp);
    setInitialLineForTransfer(lineId);
  };

  const handleOpenReceiveMoney = (lineId?: string) => {
    setFilterLineIdForHistory(undefined);
    setTransferMode('receive');
    setCurrentTab('receive_money');

    // If active session exists on receive mode and without explicit new lineId requested, keep it
    if (activeSession && activeSession.mode === 'receive' && !lineId) {
      return;
    }

    // If active session has entered data, minimize it automatically to prevent work loss
    if (hasSessionContent(activeSession)) {
      const dockedSession = { ...activeSession! };
      if (!dockedSession.sequentialOpNumber) {
        dockedSession.sequentialOpNumber = getNextSequentialOpNumber(minimizedSessions, dockedSession.id);
      }
      setMinimizedSessions(prev => [dockedSession, ...prev.filter(s => s.id !== dockedSession.id)]);
    }

    const newOp = buildNewSession('receive', lineId || initialLineForTransfer);
    setActiveSession(newOp);
    setInitialLineForTransfer(lineId);
  };

  // Called when user clicks "تصغير العملية" (Minimize button) at top of operation screen
  const handleMinimizeActiveSession = (currentData: Partial<OperationSession>) => {
    const currentMode = currentData.mode || activeSession?.mode || transferMode;
    const updatedCurrent: OperationSession = activeSession 
      ? { ...activeSession, ...currentData, updatedAt: Date.now() }
      : { ...buildNewSession(currentMode), ...currentData, updatedAt: Date.now() };

    // Assign sequentialOpNumber following today's successful operations count
    if (!updatedCurrent.sequentialOpNumber) {
      updatedCurrent.sequentialOpNumber = getNextSequentialOpNumber(minimizedSessions, updatedCurrent.id);
    }

    // Dock current operation into minimized list
    setMinimizedSessions(prev => [updatedCurrent, ...prev.filter(s => s.id !== updatedCurrent.id)]);

    // Open a fresh new operation immediately upon minimizing
    const freshSession = buildNewSession(currentMode);
    setActiveSession(freshSession);
    setTransferMode(currentMode);
    setCurrentTab(currentMode === 'receive' ? 'receive_money' : 'new_transfer');
  };

  // Restore and maximize an operation docked at the bottom
  const handleRestoreSession = (sessionId: string) => {
    const targetSession = minimizedSessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    // If current active session has data, dock it
    if (hasSessionContent(activeSession)) {
      const dockedCurrent = { ...activeSession! };
      if (!dockedCurrent.sequentialOpNumber) {
        dockedCurrent.sequentialOpNumber = getNextSequentialOpNumber(minimizedSessions, dockedCurrent.id);
      }
      setMinimizedSessions(prev => [
        dockedCurrent,
        ...prev.filter(s => s.id !== sessionId && s.id !== dockedCurrent.id)
      ]);
    } else {
      setMinimizedSessions(prev => prev.filter(s => s.id !== sessionId));
    }

    setActiveSession(targetSession);
    setTransferMode(targetSession.mode);
    setCurrentTab(targetSession.mode === 'receive' ? 'receive_money' : 'new_transfer');
  };

  // Discard a minimized session from bottom bar
  const handleDiscardSession = (sessionId: string) => {
    setMinimizedSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Start a new operation explicitly
  const handleNewOperation = (mode: 'transfer' | 'receive') => {
    if (hasSessionContent(activeSession)) {
      const dockedCurrent = { ...activeSession! };
      if (!dockedCurrent.sequentialOpNumber) {
        dockedCurrent.sequentialOpNumber = getNextSequentialOpNumber(minimizedSessions, dockedCurrent.id);
      }
      setMinimizedSessions(prev => [dockedCurrent, ...prev.filter(s => s.id !== dockedCurrent.id)]);
    }
    const freshSession = buildNewSession(mode);
    setActiveSession(freshSession);
    setTransferMode(mode);
    setCurrentTab(mode === 'receive' ? 'receive_money' : 'new_transfer');
  };

  const handleUpdateActiveSession = (data: Partial<OperationSession>) => {
    if (activeSession) {
      setActiveSession({ ...activeSession, ...data, updatedAt: Date.now() });
    }
  };

  const handleViewLineHistory = (lineId: string) => {
    setFilterLineIdForHistory(lineId);
    setCurrentTab('transfers');
  };

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        if (tab !== 'transfers') setFilterLineIdForHistory(undefined);
        if (tab === 'receive_money') {
          handleOpenReceiveMoney();
        } else if (tab === 'new_transfer') {
          handleOpenNewTransfer();
        } else {
          setCurrentTab(tab);
        }
      }}
      onOpenNewTransfer={() => handleOpenNewTransfer()}
      onOpenReceiveMoney={() => handleOpenReceiveMoney()}
      onRefresh={handleGlobalRefresh}
      isRefreshing={isGlobalRefreshing}
    >
      <TabErrorBoundary key={currentTab}>
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => {
              if (tab === 'receive_money') handleOpenReceiveMoney();
              else setCurrentTab(tab);
            }}
            onOpenTransferModal={(lineId) => handleOpenNewTransfer(lineId)}
            onOpenReceiveModal={(lineId) => handleOpenReceiveMoney(lineId)}
            onViewTransferDetails={(tx) => setSelectedDetailsTransfer(tx)}
            onPrintReceipt={(tx) => setSelectedReceiptTransfer(tx)}
          />
        )}

        {currentTab === 'lines' && (
          <CashLinesView
            onInitiateTransfer={(lineId) => handleOpenNewTransfer(lineId)}
            onInitiateReceive={(lineId) => handleOpenReceiveMoney(lineId)}
            onViewLineHistory={(lineId) => handleViewLineHistory(lineId)}
            onPrintReceipt={(tx) => setSelectedReceiptTransfer(tx)}
          />
        )}

        {(currentTab === 'new_transfer' || currentTab === 'receive_money') && (
          <NewTransferView
            key={activeSession?.id || `${currentTab}_${transferMode}`}
            initialLineId={initialLineForTransfer}
            initialMode={transferMode}
            activeSession={activeSession}
            onUpdateSession={handleUpdateActiveSession}
            onMinimize={handleMinimizeActiveSession}
            onNewOperation={handleNewOperation}
            minimizedCount={minimizedSessions.length}
            onSuccess={(tx) => {
              setActiveSession(null);
            }}
            onPrintReceipt={(tx) => setSelectedReceiptTransfer(tx)}
            onShowSuccess={() => setIsSuccessModalOpen(true)}
          />
        )}

        {currentTab === 'transfers' && (
          <TransfersLogView
            initialFilterLineId={filterLineIdForHistory}
            onViewDetails={(tx) => setSelectedDetailsTransfer(tx)}
            onPrintReceipt={(tx) => setSelectedReceiptTransfer(tx)}
          />
        )}

        {currentTab === 'reconciliation' && (
          <SettingsView initialTab="reconciliation" />
        )}

        {currentTab === 'vaults' && user && (
          <VaultsManagementView currentUser={user} settings={settings} />
        )}

        {currentTab === 'handovers' && user && (
          <ShiftHandoverView currentUser={user} settings={settings} />
        )}

        {currentTab === 'limits' && <LimitsView />}

        {currentTab === 'reports' && <ReportsView />}

        {currentTab === 'users' && <UsersView />}

        {currentTab === 'settings' && <SettingsView />}

        {currentTab === 'audit' && <AuditLogView />}

        {currentTab === 'backup' && <BackupRestoreView />}

        {currentTab === 'admin_control' && user?.role === 'admin' && (
          <AdminControlPanelView />
        )}
      </TabErrorBoundary>

      {/* Docked Minimized Operations Bar at Bottom */}
      <MinimizedOperationsBar
        sessions={minimizedSessions}
        onRestore={handleRestoreSession}
        onDiscard={handleDiscardSession}
      />

      {/* Global Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptTransfer}
        transfer={selectedReceiptTransfer}
        onClose={() => setSelectedReceiptTransfer(null)}
        onShowSuccess={() => setIsSuccessModalOpen(true)}
      />

      {/* Global Transfer Details Modal */}
      <TransferDetailsModal
        isOpen={!!selectedDetailsTransfer}
        transfer={selectedDetailsTransfer}
        onClose={() => setSelectedDetailsTransfer(null)}
        onPrint={(tx) => {
          setSelectedDetailsTransfer(null);
          setSelectedReceiptTransfer(tx);
        }}
        onStatusChanged={(updated) => {
          setSelectedDetailsTransfer(updated);
        }}
      />

      {/* Centered Success Notification with Full Blur Background - Exact Image 1 Design */}
      <OperationSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        durationSeconds={5}
      />

      <OfflineIndicator />
    </DashboardLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <TypographyProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </TypographyProvider>
    </ThemeProvider>
  );
}
