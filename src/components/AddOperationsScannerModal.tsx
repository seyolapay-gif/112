import React, { useState, useEffect, useRef } from 'react';
import { CashLine } from '../types';
import { api } from '../services/api';
import { formatAmount } from '../utils/formatters';
import {
  X,
  UploadCloud,
  FileImage,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

export interface ScannedOperationItem {
  id: string;
  referenceNumber: string;
  timestamp: string;
  transferType: string;
  recipientNumber: string;
  recipientName: string;
  amount: number | string;
  fee: number | string;
  balanceAfter?: number | string;
  status: string;
  notes: string;
  selected: boolean;
}

interface AddOperationsScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashLine: CashLine | null;
  onSuccess: (count: number) => void;
}

export const AddOperationsScannerModal: React.FC<AddOperationsScannerModalProps> = ({
  isOpen,
  onClose,
  cashLine,
  onSuccess,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [operations, setOperations] = useState<ScannedOperationItem[]>([]);
  const [updateBalance, setUpdateBalance] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for Paste (Ctrl + V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleSelectedFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, cashLine]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setImageFile(null);
      setImagePreview(null);
      setOperations([]);
      setScanError(null);
      setIsScanning(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen || !cashLine) return null;

  const handleSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setScanError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP) أو مستند PDF');
      return;
    }

    setImageFile(file);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      // Auto trigger scan
      triggerScan(base64);
    };
    reader.readAsDataURL(file);
  };

  const triggerScan = async (base64Data: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await api.extractOperationsFromImage(base64Data, {
        id: cashLine.id,
        name: cashLine.name,
        phoneNumber: cashLine.phoneNumber,
        provider: cashLine.provider,
      });

      if (res && Array.isArray(res.operations) && res.operations.length > 0) {
        setOperations(
          res.operations.map((op, idx) => ({
            id: op.id || `op_${Date.now()}_${idx}`,
            referenceNumber: op.referenceNumber || `TRX${Date.now()}${idx + 1}`,
            timestamp: op.timestamp ? op.timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16),
            transferType: op.transferType || (cashLine.provider === 'instapay' ? 'instapay' : 'cash_wallet'),
            recipientNumber: op.recipientNumber || '01000000000',
            recipientName: op.recipientName || 'عميل محفظة',
            amount: op.amount || 0,
            fee: op.fee || 0,
            balanceAfter: op.balanceAfter !== undefined && op.balanceAfter !== null ? op.balanceAfter : '',
            status: op.status || 'completed',
            notes: op.notes || 'مستخرجة عبر الماسح الذكي للعمليات',
            selected: true,
          }))
        );
      } else {
        setScanError('لم يتم العثور على عمليات واضحة في الصورة، يمكنك إضافة العمليات يدوياً أدناه');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError('تعذر معالجة الصورة بشكل آلي، يمكنك إضافة العمليات ومتابعتها يدوياً');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = operations.every((op) => op.selected);
    setOperations(operations.map((op) => ({ ...op, selected: !allSelected })));
  };

  const toggleSelectOperation = (id: string) => {
    setOperations(
      operations.map((op) => (op.id === id ? { ...op, selected: !op.selected } : op))
    );
  };

  const updateOperationField = (id: string, field: keyof ScannedOperationItem, value: any) => {
    setOperations(
      operations.map((op) => (op.id === id ? { ...op, [field]: value } : op))
    );
  };

  const removeOperation = (id: string) => {
    setOperations(operations.filter((op) => op.id !== id));
  };

  const addManualOperation = () => {
    const now = new Date();
    const newOp: ScannedOperationItem = {
      id: `manual_${Date.now()}`,
      referenceNumber: `TRX${Date.now().toString().slice(-8)}`,
      timestamp: now.toISOString().slice(0, 16),
      transferType: cashLine.provider === 'instapay' ? 'instapay' : 'cash_wallet',
      recipientNumber: '01000000000',
      recipientName: 'عميل كاش',
      amount: 1000,
      fee: 0,
      balanceAfter: '',
      status: 'completed',
      notes: 'إدخال يدوي',
      selected: true,
    };
    setOperations([...operations, newOp]);
  };

  const selectedCount = operations.filter((op) => op.selected).length;

  const handleSave = async () => {
    const selectedOps = operations.filter((op) => op.selected);
    if (selectedOps.length === 0) {
      alert('يرجى تحديد عملية واحدة على الأقل للحفظ في سجل الخط');
      return;
    }

    setIsSaving(true);
    try {
      const formattedOps = selectedOps.map((op) => ({
        referenceNumber: String(op.referenceNumber).trim(),
        timestamp: op.timestamp ? new Date(op.timestamp).toISOString() : new Date().toISOString(),
        transferType: op.transferType,
        recipientNumber: String(op.recipientNumber).trim(),
        recipientName: String(op.recipientName).trim() || 'عميل محفظة',
        amount: Number(op.amount) || 0,
        fee: Number(op.fee) || 0,
        balanceAfter: op.balanceAfter !== '' && !isNaN(Number(op.balanceAfter)) ? Number(op.balanceAfter) : undefined,
        status: op.status,
        notes: op.notes || 'تم استيرادها بواسطة الماسح الذكي للعمليات',
      }));

      await api.batchImportTransfers({
        sourceLineId: cashLine.id,
        operations: formattedOps,
        updateLineBalance: updateBalance,
      });

      onSuccess(selectedOps.length);
      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      alert('حدث خطأ أثناء حفظ العمليات: ' + (err?.message || 'تعذر الاتصال'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans" dir="rtl">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  إضافة وقراءة سجل العمليات بالماسح الذكي
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  OCR Scanner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                إضافة عمليات مستخرجة من صور وإيصالات وكشوفات إلى الخط:{' '}
                <span className="text-emerald-400 font-bold">{cashLine.name}</span>{' '}
                <span className="text-slate-300 font-mono">({cashLine.phoneNumber})</span> · الرصيد الحالي:{' '}
                <span className="text-emerald-300 font-bold font-mono">{formatAmount(cashLine.balance)} ج.م</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-6 transition-all duration-200 cursor-pointer text-center ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : imagePreview
                ? 'border-slate-700 bg-slate-950/40 hover:border-indigo-500/60'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleSelectedFile(e.target.files[0]);
                }
              }}
              accept="image/*,.pdf"
              className="hidden"
            />

            {imagePreview ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-black shrink-0">
                    <img
                      src={imagePreview}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    {isScanning && (
                      <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-[1px] flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        {imageFile?.name || 'صورة إيصال / كشف العمليات'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {imageFile ? `${(imageFile.size / 1024).toFixed(1)} ك.ب` : 'تم التحميل بنجاح'} · اضغط لتغيير الصورة
                    </p>
                    <p className="text-[11px] text-indigo-300 mt-1 flex items-center gap-1">
                      <span>💡 يمكنك أيضاً لصق لقطة الشاشة مباشرة بواسطة (Ctrl + V)</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (imagePreview) triggerScan(imagePreview);
                    }}
                    disabled={isScanning}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>إعادة الفحص بالماسح الذكي</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                      setOperations([]);
                    }}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition cursor-pointer"
                    title="حذف الصورة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    اسحب وأفلت صورة أو لقطة شاشة للعمليات هنا، أو اضغط للاختيار من جهازك
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                    يدعم صور إيصالات إنستاباي، رسائل فودافون كاش، أورنج كاش، اتصالات كاش، وي باي، وكشوف الحسابات البنكية المطبوعة (PNG, JPG, WEBP)
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-indigo-300 border border-slate-700">
                  <span>💡 اختصار سريع: اضغط</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px]">Ctrl + V</kbd>
                  <span>للصق لقطة الشاشة مباشرة</span>
                </div>
              </div>
            )}
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 animate-pulse">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-200">
                  جاري فحص الصورة واستخراج العمليات والبيانات بالذكاء الاصطناعي...
                </p>
                <p className="text-[11px] text-indigo-300/80 mt-0.5">
                  يتم قراءة أرقام الهواتف، المبالغ، الرسوم، الأرصدة، والأرقام المرجعية تلقائياً.
                </p>
              </div>
            </div>
          )}

          {/* Scan Error Notice */}
          {scanError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Operations List / Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  العمليات المقروءة والمستخرجة:
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700">
                    {operations.length} عملية
                  </span>
                </span>
                {operations.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {operations.every((op) => op.selected) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>{operations.every((op) => op.selected) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={addManualOperation}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إضافة سطر عملية يدوي</span>
                </button>
              </div>
            </div>

            {operations.length === 0 ? (
              <div className="py-12 text-center border border-slate-800/80 rounded-2xl bg-slate-950/20">
                <FileImage className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">لا توجد عمليات معروضة حالياً</p>
                <p className="text-xs text-slate-500 mt-1">
                  قم برفع صورة إيصال أو لقطة شاشة للعمليات، أو اضغط على "إضافة سطر عملية يدوي" للبدء
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {operations.map((op, index) => (
                  <div
                    key={op.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      op.selected
                        ? 'bg-slate-800/70 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                        : 'bg-slate-950/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      
                      {/* Operation Index & Selection Button (on far left as requested by user) */}
                      <div className="md:col-span-12 flex items-center justify-between pb-2 border-b border-slate-800/80 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            المرجع:
                          </span>
                          <input
                            type="text"
                            value={op.referenceNumber}
                            onChange={(e) => updateOperationField(op.id, 'referenceNumber', e.target.value)}
                            placeholder="الرقم المرجعي..."
                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Far Left Selection Button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectOperation(op.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              op.selected
                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            {op.selected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>محددة للحفظ</span>
                              </>
                            ) : (
                              <span>تحديد العملية</span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeOperation(op.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="حذف هذا السطر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Phone Number (رقم الهاتف) */}
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          رقم هاتف المستلم / الطرف الآخر:
                        </label>
                        <input
                          type="text"
                          value={op.recipientNumber}
                          onChange={(e) => updateOperationField(op.id, 'recipientNumber', e.target.value)}
                          placeholder="010xxxxxxxx"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Recipient Name (اسم المستلم) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          اسم المستلم:
                        </label>
                        <input
                          type="text"
                          value={op.recipientName}
                          onChange={(e) => updateOperationField(op.id, 'recipientName', e.target.value)}
                          placeholder="اسم العميل..."
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Amount (المبلغ) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          المبلغ (ج.م):
                        </label>
                        <input
                          type="number"
                          value={op.amount}
                          onChange={(e) => updateOperationField(op.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Available Balance (المتاح / الرصيد بعد التحويل) */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-emerald-400 mb-1">
                          المتاح بعد التحويل:
                        </label>
                        <input
                          type="number"
                          value={op.balanceAfter !== undefined ? op.balanceAfter : ''}
                          onChange={(e) => updateOperationField(op.id, 'balanceAfter', e.target.value)}
                          placeholder="الرصيد..."
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Fees (الرسوم) */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-semibold text-red-400 mb-1">
                          الرسوم:
                        </label>
                        <input
                          type="number"
                          value={op.fee}
                          onChange={(e) => updateOperationField(op.id, 'fee', e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-red-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
                        />
                      </div>

                      {/* Date & Time */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                          التاريخ والوقت:
                        </label>
                        <input
                          type="datetime-local"
                          value={op.timestamp}
                          onChange={(e) => updateOperationField(op.id, 'timestamp', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Options */}
          {operations.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateBalance}
                  onChange={(e) => setUpdateBalance(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900 border-slate-700"
                />
                <span>
                  تحديث رصيد الخط تلقائياً بناءً على آخر رصيد متاح مستخرج في العمليات (موصى به لضبط التطابق)
                </span>
              </label>

              <span className="text-xs text-slate-400 font-mono">
                المحدد: <strong className="text-emerald-400">{selectedCount}</strong> من {operations.length}
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 bg-slate-950/80 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || selectedCount === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ في سجل الخط...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ العمليات المحددة في سجل الخط ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
