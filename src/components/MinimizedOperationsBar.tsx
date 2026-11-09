import React from 'react';
import { OperationSession } from '../types';
import { formatAmount } from '../utils/formatters';
import { 
  Maximize2, 
  X, 
  Send, 
  ArrowDownLeft, 
  Layers
} from 'lucide-react';

interface MinimizedOperationsBarProps {
  sessions: OperationSession[];
  onRestore: (sessionId: string) => void;
  onDiscard: (sessionId: string) => void;
}

export const MinimizedOperationsBar: React.FC<MinimizedOperationsBarProps> = ({
  sessions,
  onRestore,
  onDiscard,
}) => {
  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-3 right-3 left-3 sm:right-6 sm:left-auto z-50 max-w-full font-sans select-none"
      dir="rtl"
    >
      <div className="flex items-center gap-2.5 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/60 max-w-[95vw] overflow-x-auto scrollbar-none">
        
        {/* Counter Badge */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 select-none">
          <div className="relative">
            <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
          </div>
          <span className="hidden sm:inline">العمليات المصغرة:</span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold border border-amber-500/20">
            {sessions.length}
          </span>
        </div>

        {/* List of Minimized Operation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 px-1">
          {sessions.map((session) => {
            const isReceive = session.mode === 'receive';
            const cleanName = (session.recipientName || '').trim();
            const hasRealName = Boolean(cleanName && cleanName !== 'عميل نقدي' && cleanName !== 'عميل مودع');
            const hasPhone = Boolean(session.recipientNumber && session.recipientNumber.trim().length > 0);
            const hasAmount = Boolean(session.amount && Number(session.amount) > 0);

            // Sequential number following today's completed operations (e.g., 57, 58)
            const opNumber = session.sequentialOpNumber || session.sessionNumber;

            // Title: If name was typed -> show the person's name!
            // If only number/no name -> show "استلام X" or "تحويل X"
            const title = hasRealName 
              ? cleanName 
              : (isReceive ? `استلام ${opNumber}` : `تحويل ${opNumber}`);

            return (
              <div
                key={session.id}
                onClick={() => onRestore(session.id)}
                className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md select-none shrink-0 ${
                  isReceive
                    ? 'bg-white hover:bg-blue-50/40 border-blue-200 hover:border-blue-400 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:border-blue-500/40 dark:hover:border-blue-400'
                    : 'bg-white hover:bg-emerald-50/40 border-emerald-200 hover:border-emerald-400 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:border-emerald-500/40 dark:hover:border-emerald-400'
                }`}
                title="انقر لتكبير واستكمال هذه العملية"
              >
                {/* Type Icon (Emerald for Transfer, Blue for Receive) */}
                <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isReceive 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/40' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40'
                }`}>
                  {isReceive ? <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>

                {/* Operation Details */}
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    {/* Main Title: Person's Name or 'استلام X' / 'تحويل X' */}
                    <span className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white leading-tight">
                      {title}
                    </span>

                    {/* Amount or Draft Badge */}
                    {hasAmount ? (
                      <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 border border-amber-300 dark:text-amber-300 dark:bg-amber-400/10 dark:border-amber-400/20 px-1.5 py-0.2 rounded">
                        {formatAmount(Number(session.amount))} ج.م
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700 px-1.5 py-0.2 rounded">
                        مسودة
                      </span>
                    )}
                  </div>

                  {/* Subtitle: Phone Number + Destination Wallet/Bank */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {hasPhone ? (
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300" dir="ltr">
                        {session.recipientNumber}
                      </span>
                    ) : (
                      <span>بدون رقم</span>
                    )}

                    {session.destinationBankOrWallet && (
                      <span className="truncate max-w-[90px] text-slate-500 dark:text-slate-400">
                        · {session.destinationBankOrWallet}
                      </span>
                    )}
                  </div>
                </div>

                {/* Restore / Maximize Icon Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(session.id);
                  }}
                  className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-xs ${
                    isReceive
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                  title="تكبير واستكمال العملية الآن"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Discard / Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDiscard(session.id);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition shrink-0 cursor-pointer"
                  title="إلغاء وحذف هذه المسودة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
