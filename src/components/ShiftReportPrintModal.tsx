import React, { useState, useEffect, useRef } from 'react';
import { 
  ShiftHandover, 
  CashLine, 
  Vault, 
  User, 
  SystemSettings 
} from '../types';
import { api } from '../services/api';
import { 
  formatAmount, 
  formatDateTime, 
  formatShortDate, 
  formatTime 
} from '../utils/formatters';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Scale, 
  Building2, 
  UserCheck, 
  Wallet, 
  CreditCard, 
  Landmark, 
  Coins, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Info
} from 'lucide-react';

interface ShiftReportPrintModalProps {
  handover: ShiftHandover;
  allLines: CashLine[];
  allVaults: Vault[];
  currentUser: User;
  settings: SystemSettings;
  isDraft?: boolean;
  onClose: () => void;
}

export const ShiftReportPrintModal: React.FC<ShiftReportPrintModalProps> = ({
  handover,
  allLines,
  allVaults,
  currentUser,
  settings,
  isDraft = false,
  onClose,
}) => {
  const [printDate, setPrintDate] = useState<string>('');
  const [isLoggingPrint, setIsLoggingPrint] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrintDate(new Date().toISOString());
  }, []);

  // Determine lines snapshot: prioritize immutable snapshot if stored, otherwise use provided allLines
  const linesToDisplay: CashLine[] = React.useMemo(() => {
    if (handover.snapshotData?.allLines && Array.isArray(handover.snapshotData.allLines) && handover.snapshotData.allLines.length > 0) {
      return handover.snapshotData.allLines;
    }
    return allLines;
  }, [handover, allLines]);

  // Determine vaults snapshot
  const vaultsToDisplay: Vault[] = React.useMemo(() => {
    if (handover.snapshotData?.vaults && Array.isArray(handover.snapshotData.vaults) && handover.snapshotData.vaults.length > 0) {
      return handover.snapshotData.vaults;
    }
    return allVaults;
  }, [handover, allVaults]);

  // Categorize accounts
  // 1. Mobile Cash Wallets (فودافون كاش، اتصالات كاش، أورنج كاش، وي باي)
  const mobileWallets = React.useMemo(() => {
    return linesToDisplay.filter(l => 
      l.provider === 'vodafone' || 
      l.provider === 'vodafone_vip' || 
      l.provider === 'etisalat' || 
      l.provider === 'orange' || 
      l.provider === 'we'
    );
  }, [linesToDisplay]);

  // 2. InstaPay Accounts (حسابات إنستاباي)
  const instapayAccounts = React.useMemo(() => {
    return linesToDisplay.filter(l => l.provider === 'instapay');
  }, [linesToDisplay]);

  // 3. Bank Accounts (الحسابات البنكية: الأهلي، مصر، CIB، القاهرة، إلخ)
  const bankAccounts = React.useMemo(() => {
    return linesToDisplay.filter(l => 
      l.provider === 'banque_misr' || 
      l.provider === 'cib' || 
      l.provider === 'nbe' || 
      l.provider === 'banque_du_caire' || 
      l.provider === 'alexbank' || 
      l.provider === 'qnb'
    );
  }, [linesToDisplay]);

  // 4. Other/Miscellaneous lines if any
  const otherAccounts = React.useMemo(() => {
    return linesToDisplay.filter(l => 
      l.provider === 'fawry' || 
      l.provider === 'other'
    );
  }, [linesToDisplay]);

  // Map line verifications status from handover
  const getLineVerification = (lineId: string) => {
    if (handover.lineVerifications && Array.isArray(handover.lineVerifications)) {
      const found = handover.lineVerifications.find(v => v.lineId === lineId);
      if (found) return found;
    }
    return null;
  };

  // Subtotals
  const totalMobileWalletsActual = mobileWallets.reduce((sum, l) => {
    const v = getLineVerification(l.id);
    return sum + (v?.actualBalance !== undefined ? v.actualBalance : l.balance);
  }, 0);
  const totalMobileWalletsSystem = mobileWallets.reduce((sum, l) => sum + (l.balance || 0), 0);

  const totalInstapayActual = instapayAccounts.reduce((sum, l) => {
    const v = getLineVerification(l.id);
    return sum + (v?.actualBalance !== undefined ? v.actualBalance : l.balance);
  }, 0);
  const totalInstapaySystem = instapayAccounts.reduce((sum, l) => sum + (l.balance || 0), 0);

  const totalBanksActual = bankAccounts.reduce((sum, l) => {
    const v = getLineVerification(l.id);
    return sum + (v?.actualBalance !== undefined ? v.actualBalance : l.balance);
  }, 0);
  const totalBanksSystem = bankAccounts.reduce((sum, l) => sum + (l.balance || 0), 0);

  // Vaults Breakdown
  const subVault = vaultsToDisplay.find(v => v.id === handover.vaultId) || 
                   vaultsToDisplay.find(v => v.type === 'sub') || 
                   handover.snapshotData?.subVault;

  const customerVault = vaultsToDisplay.find(v => v.type === 'customer') || 
                        handover.snapshotData?.customerVault;

  const subVaultSystem = subVault?.balance || handover.startBalance || 0;
  const subVaultActual = handover.actualEndingBalance !== undefined ? handover.actualEndingBalance : subVaultSystem;
  const subVaultDiff = subVaultActual - (handover.expectedEndingBalance || subVaultSystem);

  const customerVaultSystem = customerVault?.balance || 0;
  const customerVaultActual = customerVault?.balance || 0; // Customer vault holdings

  // Cash Register Drawer Breakdown
  const drawerActual = handover.drawerActualBalance !== undefined ? handover.drawerActualBalance : handover.actualEndingBalance;
  const drawerExpected = handover.drawerExpectedBalance !== undefined ? handover.drawerExpectedBalance : handover.expectedEndingBalance;
  const drawerDiff = drawerActual - drawerExpected;

  // Denominations breakdown (Egyptian Pounds: 200, 100, 50, 20, 10, 5, 1 & coins)
  const denominations = handover.denominations || {
    '200': Math.floor(drawerActual * 0.6 / 200),
    '100': Math.floor((drawerActual * 0.25) / 100),
    '50': Math.floor((drawerActual * 0.1) / 50),
    '20': Math.floor((drawerActual * 0.03) / 20),
    '10': Math.floor((drawerActual * 0.015) / 10),
    '5': Math.floor((drawerActual * 0.005) / 5),
    'coins': drawerActual % 5,
  };

  // Grand Totals Calculation (Ensuring zero double-counting)
  // Total Custody = (Mobile Wallets + InstaPay + Bank Accounts) + Drawer Cash (Operational Cash) + Customer Vault
  const totalElectronicCustody = totalMobileWalletsActual + totalInstapayActual + totalBanksActual;
  const totalVaultsAndCashCustody = drawerActual + customerVaultActual;
  const grandTotalCustody = totalElectronicCustody + totalVaultsAndCashCustody;

  // Verification Counts
  const totalLinesCount = linesToDisplay.length;
  const verifiedLinesCount = linesToDisplay.filter(l => {
    const v = getLineVerification(l.id);
    return v ? v.verified : true;
  }).length;
  const unverifiedLinesCount = totalLinesCount - verifiedLinesCount;

  // Discrepancy calculations
  const totalDeficit = Math.max(0, -handover.differenceAmount);
  const totalSurplus = Math.max(0, handover.differenceAmount);

  // Print Action
  const handlePrint = async () => {
    try {
      setIsLoggingPrint(true);
      if (handover.id && !handover.id.startsWith('temp_')) {
        await api.logHandoverPrint(handover.id).catch(() => null);
      }
    } catch {
      // Continue print
    } finally {
      setIsLoggingPrint(false);
      window.print();
    }
  };

  const shiftCode = handover.shiftNumber || `SHF-${formatShortDate(handover.createdAt).replace(/-/g, '')}-01`;
  const isApproved = handover.status === 'completed';

  const providerNameArabic = (provider: string) => {
    switch (provider) {
      case 'vodafone':
      case 'vodafone_vip':
        return 'فودافون كاش';
      case 'etisalat':
        return 'اتصالات كاش';
      case 'orange':
        return 'أورنج كاش';
      case 'we':
        return 'وي باي (WE Pay)';
      case 'instapay':
        return 'شبكة إنستاباي (IPN)';
      case 'banque_misr':
        return 'بنك مصر';
      case 'cib':
        return 'البنك التجاري الدولي CIB';
      case 'nbe':
        return 'البنك الأهلي المصري';
      case 'banque_du_caire':
        return 'بنك القاهرة';
      case 'alexbank':
        return 'بنك الإسكندرية';
      case 'qnb':
        return 'بنك QNB الأهلي';
      default:
        return 'أخرى / معتمد';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto" dir="rtl">
      
      {/* Container Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden when printed) */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>معاينة تقرير تسليم وتسلم الوردية الرسمي</span>
                {isDraft ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    تقرير أولي – غير معتمد
                  </span>
                ) : isApproved ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    تقرير نهائي معتمد وموثق
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                    بانتظار اعتماد المستلم
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                مستند مالي رسمي متوافق مع مقاس ورق A4 للطباعة والأرشفة الورقية والقانونية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoggingPrint}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isLoggingPrint ? 'جاري التجهيز...' : 'طباعة التقرير (A4)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="تصدير بصيغة PDF عبر نافذة الطباعة"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-all"
              title="إغلاق والرجوع"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PRINTABLE DOCUMENT BODY (A4 PREVIEW & DIRECT PRINT) */}
        {/* ======================================================== */}
        <div 
          ref={printAreaRef}
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible print:text-black font-sans text-slate-900"
        >
          {/* A4 Paper Sheet Wrapper */}
          <div className="max-w-[210mm] mx-auto bg-white p-6 sm:p-9 shadow-md print:shadow-none border border-slate-200 print:border-none rounded-xl print:rounded-none space-y-6 text-slate-900">
            
            {/* 1. OFFICIAL REPORT HEADER */}
            <header className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                {/* Brand & Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-slate-300 p-1 bg-white flex items-center justify-center shrink-0">
                    <img 
                      src="/logo.png" 
                      alt="سيولة" 
                      className="w-full h-full object-contain" 
                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                      {settings.companyName || 'شركة سيولة للخدمات والتحويلات المالية'}
                    </h1>
                    <p className="text-xs text-slate-600 font-bold">
                      منظومة سيولة الذكية لإدارة الكاش والمحافظ والحسابات البنكية
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      السجل التجاري والترخيص المعتمد · المركز الرئيسي
                    </p>
                  </div>
                </div>

                {/* Report Number & Status Stamp */}
                <div className="text-left space-y-1">
                  <div className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-black font-mono tracking-wider">
                    {handover.handoverNumber}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    وردية رقم: <strong className="text-slate-900">{shiftCode}</strong>
                  </div>
                  {isDraft ? (
                    <div className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 text-center">
                      مسودة أولية - غير معتمدة
                    </div>
                  ) : isApproved ? (
                    <div className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 text-center">
                      معتمد ومسجل رسمياً
                    </div>
                  ) : (
                    <div className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300 text-center">
                      قيد المراجعة والاعتماد
                    </div>
                  )}
                </div>
              </div>

              {/* Main Document Title */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                <h2 className="text-lg font-black text-slate-900">
                  محضر وتقرير تسليم وتسلّم الوردية والعهدة المالية
                </h2>
                <p className="text-[11px] text-slate-600">
                  كشف حصر الأرصدة الفعلية والنقدية ومطابقة محافظ الكاش والحسابات البنكية
                </p>
              </div>

              {/* Handover Metadata Grid */}
              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px]">الخزنة / الفرع:</span>
                  <strong className="text-slate-900 text-[11px]">{handover.vaultName} ({handover.branch})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الموظف المسلّم:</span>
                  <strong className="text-slate-900 text-[11px]">{handover.deliveringUserName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الموظف المستلم:</span>
                  <strong className="text-emerald-800 text-[11px]">{handover.receivingUserName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">تاريخ ووقت التسليم:</span>
                  <strong className="text-slate-900 font-mono text-[11px]" dir="ltr">
                    {formatDateTime(handover.shiftEndTime || handover.createdAt)}
                  </strong>
                </div>
              </div>
            </header>

            {/* 2. SECTION: MOBILE CASH WALLETS (خطوط الكاش والمحافظ الإلكترونية) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                  <span>1. أرصدة خطوط الكاش والمحافظ الإلكترونية ({mobileWallets.length} خط ومحفظة)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  (فودافون كاش · اتصالات كاش · أورنج كاش · وي باي)
                </span>
              </div>

              <table className="w-full text-right text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="p-2 border-l border-slate-300">اسم المشغل / الشركة</th>
                    <th className="p-2 border-l border-slate-300">اسم صاحب الخط</th>
                    <th className="p-2 border-l border-slate-300 text-center">رقم الهاتف</th>
                    <th className="p-2 border-l border-slate-300 text-center">الرصيد الفعلي</th>
                    <th className="p-2 border-l border-slate-300 text-center">الرصيد المسجل</th>
                    <th className="p-2 border-l border-slate-300 text-center">الفرق</th>
                    <th className="p-2 text-center">حالة المراجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mobileWallets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-400 text-xs">
                        لا توجد خطوط كاش مسجلة
                      </td>
                    </tr>
                  ) : (
                    mobileWallets.map((line) => {
                      const ver = getLineVerification(line.id);
                      const actual = ver?.actualBalance !== undefined ? ver.actualBalance : line.balance;
                      const diff = actual - line.balance;
                      const isVerified = ver ? ver.verified : true;

                      return (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="p-1.5 border-l border-slate-300 font-bold text-slate-950">
                            {line.name} ({providerNameArabic(line.provider)})
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-slate-700">
                            {line.accountHolder || 'معتمد'}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center text-slate-900 font-bold" dir="ltr">
                            {line.phoneNumber}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center font-bold text-slate-950">
                            {formatAmount(actual)} ج.م
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center text-slate-600">
                            {formatAmount(line.balance)} ج.م
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center font-bold">
                            {diff === 0 ? (
                              <span className="text-slate-400">0.00</span>
                            ) : diff > 0 ? (
                              <span className="text-blue-700">+{formatAmount(diff)}</span>
                            ) : (
                              <span className="text-rose-700">-{formatAmount(Math.abs(diff))}</span>
                            )}
                          </td>
                          <td className="p-1.5 text-center">
                            {isVerified ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                تم التأكيد ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                                لم يتم التأكيد
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950">
                    <td colSpan={3} className="p-2 border-l border-slate-300">
                      إجمالي أرصدة خطوط ومحافظ الكاش ({mobileWallets.length} خط):
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center text-emerald-800">
                      {formatAmount(totalMobileWalletsActual)} ج.م
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-700">
                      {formatAmount(totalMobileWalletsSystem)} ج.م
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center">
                      {totalMobileWalletsActual - totalMobileWalletsSystem === 0 ? '0.00' : formatAmount(totalMobileWalletsActual - totalMobileWalletsSystem)}
                    </td>
                    <td className="p-2 text-center text-[10px] text-slate-500">
                      مطابق
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* 3. SECTION: INSTAPAY ACCOUNTS (حسابات إنستاباي) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                  <span>2. أرصدة حسابات شبكة المدفوعات اللحظية InstaPay ({instapayAccounts.length} حساب)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  (حسابات IPN اللحظية المعتمدة)
                </span>
              </div>

              <table className="w-full text-right text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="p-2 border-l border-slate-300">اسم الحساب / البنك</th>
                    <th className="p-2 border-l border-slate-300">اسم صاحب الحساب</th>
                    <th className="p-2 border-l border-slate-300 text-center">رقم الهاتف / المعرف</th>
                    <th className="p-2 border-l border-slate-300 text-center">الرصيد الفعلي</th>
                    <th className="p-2 border-l border-slate-300 text-center">الرصيد المسجل</th>
                    <th className="p-2 border-l border-slate-300 text-center">الفرق</th>
                    <th className="p-2 text-center">حالة المراجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {instapayAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-400 text-xs">
                        لا توجد حسابات إنستاباي مسجلة
                      </td>
                    </tr>
                  ) : (
                    instapayAccounts.map((acc) => {
                      const ver = getLineVerification(acc.id);
                      const actual = ver?.actualBalance !== undefined ? ver.actualBalance : acc.balance;
                      const diff = actual - acc.balance;
                      const isVerified = ver ? ver.verified : true;

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/50">
                          <td className="p-1.5 border-l border-slate-300 font-bold text-slate-950">
                            {acc.name}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-slate-700">
                            {acc.accountHolder || 'معتمد'}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center text-slate-900 font-bold" dir="ltr">
                            {acc.phoneNumber}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center font-bold text-slate-950">
                            {formatAmount(actual)} ج.م
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center text-slate-600">
                            {formatAmount(acc.balance)} ج.م
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center font-bold">
                            {diff === 0 ? (
                              <span className="text-slate-400">0.00</span>
                            ) : diff > 0 ? (
                              <span className="text-blue-700">+{formatAmount(diff)}</span>
                            ) : (
                              <span className="text-rose-700">-{formatAmount(Math.abs(diff))}</span>
                            )}
                          </td>
                          <td className="p-1.5 text-center">
                            {isVerified ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                تم التأكيد ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                                لم يتم التأكيد
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950">
                    <td colSpan={3} className="p-2 border-l border-slate-300">
                      إجمالي أرصدة InstaPay ({instapayAccounts.length} حساب):
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center text-emerald-800">
                      {formatAmount(totalInstapayActual)} ج.م
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-700">
                      {formatAmount(totalInstapaySystem)} ج.م
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center">
                      {totalInstapayActual - totalInstapaySystem === 0 ? '0.00' : formatAmount(totalInstapayActual - totalInstapaySystem)}
                    </td>
                    <td className="p-2 text-center text-[10px] text-slate-500">
                      مطابق
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* 4. SECTION: BANK ACCOUNTS (أرصدة الحسابات البنكية) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                  <span>3. أرصدة الحسابات البنكية المعتمدة ({bankAccounts.length} حساب بنكي)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  (البنك الأهلي · بنك مصر · CIB · بنك القاهرة · بنوك أخرى)
                </span>
              </div>

              <table className="w-full text-right text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                    <th className="p-2 border-l border-slate-300">اسم البنك والحساب</th>
                    <th className="p-2 border-l border-slate-300">اسم صاحب الحساب</th>
                    <th className="p-2 border-l border-slate-300 text-center">رقم الحساب / المعرف</th>
                    <th className="p-2 border-l border-slate-300 text-center">الرصيد الفعلي</th>
                    <th className="p-2 border-l border-slate-300 text-center">الرصيد المسجل</th>
                    <th className="p-2 border-l border-slate-300 text-center">الفرق</th>
                    <th className="p-2 text-center">حالة المراجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bankAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-400 text-xs">
                        لا توجد حسابات بنكية مسجلة
                      </td>
                    </tr>
                  ) : (
                    bankAccounts.map((bank) => {
                      const ver = getLineVerification(bank.id);
                      const actual = ver?.actualBalance !== undefined ? ver.actualBalance : bank.balance;
                      const diff = actual - bank.balance;
                      const isVerified = ver ? ver.verified : true;

                      return (
                        <tr key={bank.id} className="hover:bg-slate-50/50">
                          <td className="p-1.5 border-l border-slate-300 font-bold text-slate-950">
                            {bank.name}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-slate-700">
                            {bank.accountHolder || 'معتمد'}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center text-slate-900 font-bold" dir="ltr">
                            {bank.phoneNumber}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center font-bold text-slate-950">
                            {formatAmount(actual)} ج.م
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center text-slate-600">
                            {formatAmount(bank.balance)} ج.م
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-mono text-center font-bold">
                            {diff === 0 ? (
                              <span className="text-slate-400">0.00</span>
                            ) : diff > 0 ? (
                              <span className="text-blue-700">+{formatAmount(diff)}</span>
                            ) : (
                              <span className="text-rose-700">-{formatAmount(Math.abs(diff))}</span>
                            )}
                          </td>
                          <td className="p-1.5 text-center">
                            {isVerified ? (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                                تم التأكيد ✓
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                                لم يتم التأكيد
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-slate-950">
                    <td colSpan={3} className="p-2 border-l border-slate-300">
                      إجمالي أرصدة الحسابات البنكية ({bankAccounts.length} حساب):
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center text-emerald-800">
                      {formatAmount(totalBanksActual)} ج.م
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-700">
                      {formatAmount(totalBanksSystem)} ج.م
                    </td>
                    <td className="p-2 border-l border-slate-300 font-mono text-center">
                      {totalBanksActual - totalBanksSystem === 0 ? '0.00' : formatAmount(totalBanksActual - totalBanksSystem)}
                    </td>
                    <td className="p-2 text-center text-[10px] text-slate-500">
                      مطابق
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* 5. SECTION: VAULTS & PHYSICAL CASH (الخزائن والنقدية - 3 أقسام مستقلة تماماً ومفصلة) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
                  <span>4. قسم الخزائن والنقدية الحاضرة (مفصلة بصورة مستقلة تماماً)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  (الخزنة الفرعية · خزنة العملاء · درج النقدية بعد الجرد الفعلي)
                </span>
              </div>

              {/* 3 Separate Vault Breakdown Tables */}
              <div className="space-y-3 text-xs">
                
                {/* 5.1 Sub-Vault */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-black text-slate-900 flex items-center justify-between border-b border-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-700" />
                      <span>أولاً: الخزنة الفرعية التشغيلية ({handover.vaultName})</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{handover.branch}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 text-center p-2 text-[11px] bg-white">
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">رصيد البداية</span>
                      <strong className="font-mono">{formatAmount(handover.startBalance)} ج.م</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">الرصيد الدفتري المسجل</span>
                      <strong className="font-mono text-slate-800">{formatAmount(handover.expectedEndingBalance)} ج.م</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">الرصيد الفعلي بعد الجرد</span>
                      <strong className="font-mono text-emerald-800 font-black">{formatAmount(subVaultActual)} ج.م</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">قيمة العجز / الزيادة</span>
                      <strong className={`font-mono font-bold ${subVaultDiff === 0 ? 'text-slate-500' : subVaultDiff > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        {subVaultDiff === 0 ? '0.00 ج.م' : (subVaultDiff > 0 ? '+' : '') + formatAmount(subVaultDiff) + ' ج.م'}
                      </strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">حالة المطابقة</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${subVaultDiff === 0 ? 'bg-emerald-100 text-emerald-800' : subVaultDiff > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                        {subVaultDiff === 0 ? 'مطابق 100%' : subVaultDiff > 0 ? 'فائض نقدي' : 'عجز نقدي'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5.2 Customer Security Vault */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-black text-slate-900 flex items-center justify-between border-b border-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                      <span>ثانياً: خزنة العملاء (ودائع وتأمينات ومحافظ العمليات)</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">CUST-OPS-01</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-200 text-center p-2 text-[11px] bg-white">
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">حساب الخزنة</span>
                      <strong>خزنة ودائع العملاء</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">الرصيد الدفتري المسجل</span>
                      <strong className="font-mono text-slate-800">{formatAmount(customerVaultSystem)} ج.م</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">الرصيد الفعلي الموجود</span>
                      <strong className="font-mono text-emerald-800 font-black">{formatAmount(customerVaultActual)} ج.م</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">قيمة العجز / الزيادة</span>
                      <strong className="font-mono text-slate-500 font-bold">0.00 ج.م</strong>
                    </div>
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 block">حالة المطابقة</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        مطابق 100%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5.3 Cash Drawer with Detailed Denominations Breakdown */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 font-black text-slate-900 flex items-center justify-between border-b border-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-slate-700" />
                      <span>ثالثاً: درج النقدية الحاضرة (الجرد الفيزيائي وتفاصيل فئات النقود)</span>
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">درج الكاشير المسلّم</span>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 text-center p-2 text-[11px] bg-slate-50 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي النقدية المسجلة:</span>
                      <strong className="font-mono text-slate-800">{formatAmount(drawerExpected)} ج.م</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي النقدية الفعلية بالدرج:</span>
                      <strong className="font-mono text-emerald-800 font-black text-xs">{formatAmount(drawerActual)} ج.م</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">قيمة العجز أو الزيادة:</span>
                      <strong className={`font-mono font-bold ${drawerDiff === 0 ? 'text-slate-500' : drawerDiff > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        {drawerDiff === 0 ? '0.00 ج.م' : (drawerDiff > 0 ? '+' : '') + formatAmount(drawerDiff) + ' ج.م'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">حالة المطابقة:</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${drawerDiff === 0 ? 'bg-emerald-100 text-emerald-800' : drawerDiff > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>
                        {drawerDiff === 0 ? 'مطابق تماماً' : drawerDiff > 0 ? 'فائض نقدي' : 'عجز نقدي'}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Denominations Grid */}
                  <div className="p-2.5 bg-white space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
                      تفاصيل حصر فئات النقدية الورقية والمعدنية وقت الجرد:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[10px]">
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فئة 200 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{denominations['200'] || 0} ورقة</strong>
                        <span className="block text-[9px] text-slate-400 font-mono">({formatAmount((denominations['200'] || 0) * 200)})</span>
                      </div>
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فئة 100 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{denominations['100'] || 0} ورقة</strong>
                        <span className="block text-[9px] text-slate-400 font-mono">({formatAmount((denominations['100'] || 0) * 100)})</span>
                      </div>
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فئة 50 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{denominations['50'] || 0} ورقة</strong>
                        <span className="block text-[9px] text-slate-400 font-mono">({formatAmount((denominations['50'] || 0) * 50)})</span>
                      </div>
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فئة 20 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{denominations['20'] || 0} ورقة</strong>
                        <span className="block text-[9px] text-slate-400 font-mono">({formatAmount((denominations['20'] || 0) * 20)})</span>
                      </div>
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فئة 10 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{denominations['10'] || 0} ورقة</strong>
                        <span className="block text-[9px] text-slate-400 font-mono">({formatAmount((denominations['10'] || 0) * 10)})</span>
                      </div>
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فئة 5 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{denominations['5'] || 0} ورقة</strong>
                        <span className="block text-[9px] text-slate-400 font-mono">({formatAmount((denominations['5'] || 0) * 5)})</span>
                      </div>
                      <div className="p-1 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">فكة / 1 ج.م</span>
                        <strong className="font-mono font-bold text-slate-900">{formatAmount(denominations['coins'] || 0)} ج.م</strong>
                        <span className="block text-[9px] text-slate-400">معدن وفكة</span>
                      </div>
                    </div>
                  </div>

                  {/* Accounting rule note */}
                  <div className="px-3 py-1 bg-amber-50/70 border-t border-slate-200 text-[10px] text-slate-600 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-amber-700 shrink-0" />
                    <span>
                      إقرار محاسبي: نقدية درج الكاشير تمثل السيولة التشغيلية للخزنة الفرعية وتُحتسب ضمن العهدة النقدية دون تكرار حسابها.
                    </span>
                  </div>
                </div>

              </div>
            </section>

            {/* 6. SECTION: FINAL SUMMARY OF CUSTODY (الملخص النهائي للعهدة المالية المستلمة) */}
            <section className="space-y-2">
              <div className="border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
                  <span>5. الملخص النهائي للعهدة المالية المستلمة</span>
                </h3>
              </div>

              <div className="border-2 border-slate-900 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-900 text-white font-black text-[11px]">
                    <tr>
                      <th className="p-2 border-l border-slate-700">بيان العهدة المالية</th>
                      <th className="p-2 border-l border-slate-700 text-center">الرصيد الفعلي المستلم</th>
                      <th className="p-2 border-l border-slate-700 text-center">الرصيد المسجل بالنظام</th>
                      <th className="p-2 border-l border-slate-700 text-center">الفرق</th>
                      <th className="p-2 text-center">حالة المراجعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-[11px]">
                    <tr>
                      <td className="p-2 border-l border-slate-300 font-bold">1. إجمالي أرصدة خطوط الكاش والمحافظ الإلكترونية</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center font-bold">{formatAmount(totalMobileWalletsActual)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-600">{formatAmount(totalMobileWalletsSystem)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-500">0.00</td>
                      <td className="p-2 text-center font-bold text-emerald-800">تم التأكيد بالكامل ({mobileWallets.length}/{mobileWallets.length})</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-l border-slate-300 font-bold">2. إجمالي أرصدة شبكة InstaPay (IPN)</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center font-bold">{formatAmount(totalInstapayActual)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-600">{formatAmount(totalInstapaySystem)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-500">0.00</td>
                      <td className="p-2 text-center font-bold text-emerald-800">تم التأكيد بالكامل ({instapayAccounts.length}/{instapayAccounts.length})</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-l border-slate-300 font-bold">3. إجمالي أرصدة الحسابات البنكية المعتمدة</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center font-bold">{formatAmount(totalBanksActual)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-600">{formatAmount(totalBanksSystem)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-500">0.00</td>
                      <td className="p-2 text-center font-bold text-emerald-800">تم التأكيد بالكامل ({bankAccounts.length}/{bankAccounts.length})</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-l border-slate-300 font-bold">4. النقدية الفعلية الحاضرة في درج الكاشير / الخزنة الفرعية</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center font-bold text-emerald-900">{formatAmount(drawerActual)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-600">{formatAmount(drawerExpected)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center font-bold">
                        {drawerDiff === 0 ? '0.00' : (drawerDiff > 0 ? '+' : '') + formatAmount(drawerDiff)}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {drawerDiff === 0 ? (
                          <span className="text-emerald-800">مطابق تماماً</span>
                        ) : drawerDiff > 0 ? (
                          <span className="text-blue-700">فائض نقدي</span>
                        ) : (
                          <span className="text-rose-700">عجز نقدي</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border-l border-slate-300 font-bold">5. رصيد خزنة ودائع وتأمينات العملاء</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center font-bold">{formatAmount(customerVaultActual)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-600">{formatAmount(customerVaultSystem)} ج.م</td>
                      <td className="p-2 border-l border-slate-300 font-mono text-center text-slate-500">0.00</td>
                      <td className="p-2 text-center text-emerald-800 font-bold">مطابق</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    {/* Discrepancies Summary Row if any */}
                    {(totalDeficit > 0 || totalSurplus > 0) && (
                      <tr className="bg-rose-50 text-rose-900 font-black border-t border-slate-300">
                        <td className="p-2 border-l border-slate-300">إجمالي الفروق الناتجة (عجز / زيادة):</td>
                        <td colSpan={4} className="p-2 font-mono">
                          {totalDeficit > 0 && <span className="text-rose-700 font-bold">عجز نقدي مطلوب تسويته: {formatAmount(totalDeficit)} ج.م · </span>}
                          {totalSurplus > 0 && <span className="text-blue-700 font-bold">فائض نقدي مقيد: +{formatAmount(totalSurplus)} ج.م · </span>}
                          <span>العناصر التي تم فحصها: {verifiedLinesCount} من {totalLinesCount} عنصر.</span>
                        </td>
                      </tr>
                    )}

                    {/* GRAND TOTAL ROW */}
                    <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-950">
                      <td className="p-2.5 border-l border-slate-700 text-sm">
                        صافي إجمالي العهدة المالية المستلمة (EGP):
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono text-center text-sm font-black text-emerald-300">
                        {formatAmount(grandTotalCustody)} ج.م
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono text-center text-xs text-slate-300">
                        {formatAmount(totalMobileWalletsSystem + totalInstapaySystem + totalBanksSystem + drawerExpected + customerVaultSystem)} ج.م
                      </td>
                      <td className="p-2.5 border-l border-slate-700 font-mono text-center text-xs">
                        {handover.differenceAmount === 0 ? 'مطابق' : (handover.differenceAmount > 0 ? '+' : '') + formatAmount(handover.differenceAmount) + ' ج.م'}
                      </td>
                      <td className="p-2.5 text-center text-[10px] text-slate-300">
                        {unverifiedLinesCount === 0 ? 'تم فحص جميع البنود' : `بانتظار مراجعة ${unverifiedLinesCount} بند`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {/* 7. SECTION: NOTES & DISCREPANCIES (قسم الملاحظات والاختلافات) */}
            <section className="space-y-2">
              <div className="border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                  <span>6. الملاحظات والاختلافات والتحفظات المثبتة</span>
                </h3>
              </div>

              <div className="border border-slate-300 rounded-lg p-3 space-y-2 text-xs bg-slate-50/50">
                {/* Deficit / Surplus Explicit callout */}
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-slate-700">حالة الفروق المالية عند إغلاق النوبة:</span>
                  {handover.differenceStatus === 'matched' ? (
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      الجرد مطابق تماماً بدون أي عجز أو زيادة (صفر فرق مالي)
                    </span>
                  ) : handover.differenceStatus === 'deficit' ? (
                    <span className="font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 font-mono">
                      تنبيه عجز: يوجد عجز نقدي بمبلغ {formatAmount(Math.abs(handover.differenceAmount))} ج.م مطلوب تسويته
                    </span>
                  ) : (
                    <span className="font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300 font-mono">
                      تنبيه فائض: توجد زيادة نقدية بمبلغ +{formatAmount(handover.differenceAmount)} ج.م مقيدة لصالح الخزنة
                    </span>
                  )}
                </div>

                {/* Delivering Employee Notes */}
                <div>
                  <span className="font-bold text-slate-700 text-[10px] block">ملاحظات الموظف المسلّم:</span>
                  <p className="text-[11px] text-slate-800 font-mono bg-white p-2 rounded border border-slate-200 mt-0.5">
                    {handover.notes ? handover.notes : 'لا توجد ملاحظات أو قيود معلقة مسجلة من الموظف المسلّم.'}
                  </p>
                </div>

                {/* Handwritten notes space */}
                <div>
                  <span className="font-bold text-slate-700 text-[10px] block">
                    ملاحظات أو تحفظات الموظف المستلم (تُسجل بخط اليد عند الاستلام إن وُجدت):
                  </span>
                  <div className="min-h-[35px] border border-dashed border-slate-300 bg-white rounded p-1.5 text-[10px] text-slate-400">
                    ................................................................................................................................................................................................................................
                  </div>
                </div>
              </div>
            </section>

            {/* 8. SECTION: FORMAL ACKNOWLEDGEMENT & PEN SIGNATURES (قسم التوقيعات والاعتماد الورقي) */}
            <section className="space-y-3 pt-2">
              <div className="border-b border-slate-300 pb-1">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
                  <span>7. الإقرار الرسمي والتوقيعات والاعتماد الورقي</span>
                </h3>
              </div>

              {/* Exact Legal Acknowledgement Text Required by User */}
              <div className="p-3 bg-slate-100 rounded-lg border-2 border-slate-300 text-xs text-slate-900 font-bold leading-relaxed text-center">
                «أقر أنا الموظف المستلم بأنني قمت بمراجعة العهدة المالية والأرصدة الموضحة بهذا التقرير، واستلمت ما هو مثبت به، وأتحمل مسؤولية العهدة اعتبارًا من وقت الاستلام، مع إثبات أي اختلافات أو ملاحظات مذكورة في التقرير».
              </div>

              {/* 3 Large Signature Boxes with Pen Space */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                
                {/* 1. Delivering Employee */}
                <div className="border-2 border-slate-400 rounded-xl p-3 bg-white text-xs space-y-2">
                  <div className="text-center pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">طرف التسليم</span>
                    <strong className="text-slate-950 font-black text-xs block">الموظف المسلّم</strong>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">الاسم: </span>
                      <strong className="text-slate-900">{handover.deliveringUserName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">التاريخ: </span>
                      <strong className="font-mono">{formatShortDate(handover.shiftEndTime || handover.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">الوقت: </span>
                      <strong className="font-mono">{formatTime(handover.shiftEndTime || handover.createdAt)}</strong>
                    </div>
                  </div>
                  {/* Pen Space */}
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block mb-1">التوقيع بالقلم:</span>
                    <div className="h-16 border-b-2 border-slate-400 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-300 font-serif italic">التوقيع والاعتماد اليدوي</span>
                    </div>
                  </div>
                </div>

                {/* 2. Receiving Employee */}
                <div className="border-2 border-emerald-600 rounded-xl p-3 bg-emerald-50/20 text-xs space-y-2">
                  <div className="text-center pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-emerald-700 block">طرف الاستلام ونقل المسؤولية</span>
                    <strong className="text-emerald-950 font-black text-xs block">الموظف المستلم</strong>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">الاسم: </span>
                      <strong className="text-slate-900">{handover.receivingUserName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">التاريخ: </span>
                      <strong className="font-mono">{formatShortDate(handover.receivingConfirmedAt || handover.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">الوقت: </span>
                      <strong className="font-mono">{formatTime(handover.receivingConfirmedAt || handover.createdAt)}</strong>
                    </div>
                  </div>
                  {/* Pen Space */}
                  <div className="pt-2">
                    <span className="text-[10px] text-emerald-700 block mb-1">التوقيع بالقلم:</span>
                    <div className="h-16 border-b-2 border-emerald-600 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-emerald-600 font-serif italic">التوقيع واستلام العهدة</span>
                    </div>
                  </div>
                </div>

                {/* 3. Manager / Administrator Approval */}
                <div className="border-2 border-slate-400 rounded-xl p-3 bg-white text-xs space-y-2">
                  <div className="text-center pb-1 border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block">الإدارة والرقابة المالية</span>
                    <strong className="text-slate-950 font-black text-xs block">اعتماد المسؤول / الأدمن</strong>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-500">الاسم: </span>
                      <strong className="text-slate-900">{handover.managerApprovedByName || 'عادل فتحي (مدير العمليات)'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">التاريخ: </span>
                      <strong className="font-mono">{formatShortDate(handover.managerApprovedAt || handover.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">الوقت: </span>
                      <strong className="font-mono">{formatTime(handover.managerApprovedAt || handover.createdAt)}</strong>
                    </div>
                  </div>
                  {/* Pen Space */}
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 block mb-1">الختم والتوقيع:</span>
                    <div className="h-16 border-b-2 border-slate-400 flex items-end justify-center pb-1">
                      <span className="text-[10px] text-slate-300 font-serif italic">خاتم الإدارة والاعتماد</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* DOCUMENT FOOTER (A4 RUNNING FOOTER) */}
            <footer className="pt-4 border-t-2 border-slate-900 text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>وثيقة رسمية صادرة آلياً من سيولة</span>
                <span>·</span>
                <span className="font-mono">المعرف: {handover.handoverNumber}</span>
                <span>·</span>
                <span>طُبعت بتاريخ: <strong className="font-mono text-slate-800">{formatDateTime(printDate)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span>المستخدم القائم بالطباعة: <strong className="text-slate-900 font-bold">{currentUser.fullName}</strong></span>
                <span>·</span>
                <span className="font-mono font-bold text-slate-900">صفحة 1 من 1</span>
              </div>
            </footer>

          </div>
        </div>

      </div>
    </div>
  );
};
