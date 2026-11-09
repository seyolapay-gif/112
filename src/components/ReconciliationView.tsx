import React, { useState, useEffect, useRef } from 'react';
import { 
  ReconciliationRecord, 
  ReconciliationRow, 
  ExtractedStatementItem, 
  DbStatementItem, 
  FieldDifference,
  MatchStatus,
  CashLine, 
  ProviderType 
} from '../types';
import { api } from '../services/api';
import { exportReconciliationToExcel } from '../services/excelService';
import { formatAmount } from '../utils/formatters';
import { 
  GitCompareArrows, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  ZoomIn, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileSpreadsheet, 
  Save, 
  History, 
  Calendar, 
  Search, 
  Filter, 
  RotateCcw, 
  Printer, 
  Eye, 
  ArrowRight, 
  Layers, 
  Check, 
  Building2, 
  Phone, 
  Wallet, 
  HelpCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Loader2,
  FileCheck2,
  SlidersHorizontal,
  Plus,
  FileText,
  Box,
  Maximize2,
  Scale
} from 'lucide-react';

interface ReconciliationViewProps {
  onBackToDashboard?: () => void;
}

interface UploadedImage {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  previewUrl: string;
  base64: string;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({ onBackToDashboard }) => {
  // Navigation tabs: 'new' (New Reconciliation) or 'history' (Saved Reconciliations)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Registered Lines from DB
  const [lines, setLines] = useState<CashLine[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string>('cash_line');
  const [selectedLineId, setSelectedLineId] = useState<string>('');

  // Period State
  const [periodType, setPeriodType] = useState<'day' | 'range'>('day');
  const [singleDate, setSingleDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateError, setDateError] = useState<string | null>(null);

  // Uploaded Images
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('');
  const [processingStats, setProcessingStats] = useState({
    imagesProcessed: 0,
    extractedCount: 0,
    matchedCount: 0,
    needsReviewCount: 0,
  });

  // Current Active Reconciliation Result
  const [comparisonName, setComparisonName] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<ExtractedStatementItem[]>([]);
  const [dbItems, setDbItems] = useState<DbStatementItem[]>([]);
  const [reconciliationRows, setReconciliationRows] = useState<ReconciliationRow[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Result View Modes: 'paper_sheet' (Original paper table with date rectangle) or 'comparison' (Dual DB comparison)
  const [activeResultView, setActiveResultView] = useState<'paper_sheet' | 'comparison'>('paper_sheet');
  const [onlyShowBoxedDays, setOnlyShowBoxedDays] = useState(false);
  const [paperSearchQuery, setPaperSearchQuery] = useState('');

  // Table Filters & Search
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus | 'needs_review'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Reconciliation History State
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [viewingRecord, setViewingRecord] = useState<ReconciliationRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reconciliationError, setReconciliationError] = useState<string | null>(null);

  // 1. Initial Load: Lines from DB
  useEffect(() => {
    loadLines();
  }, []);

  const loadLines = async () => {
    try {
      const data = await api.getLines();
      setLines(data);
      if (data.length > 0 && !selectedLineId) {
        setSelectedLineId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load lines for reconciliation:', err);
    }
  };

  // 2. Load History when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getReconciliationHistory();
      setHistoryRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load reconciliation history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 3. Date Validation
  const validateDates = (start: string, end: string) => {
    if (periodType === 'range' && start && end && start > end) {
      setDateError('تاريخ النهاية يجب ألا يسبق تاريخ البداية');
      return false;
    }
    setDateError(null);
    return true;
  };

  // 4. Handle Image Upload & Conversion
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert(`الملف ${file.name} ليس صورة صالحة (PNG, JPG, JPEG)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newImg: UploadedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            previewUrl: reader.result,
            base64: reader.result,
          };
          setUploadedImages((prev) => [...prev, newImg]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= uploadedImages.length) return;
    const updated = [...uploadedImages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setUploadedImages(updated);
  };

  // 5. Reconciliation Engine: Accurate 5-Field Financial Matching
  const matchStatementWithDb = (
    statementList: ExtractedStatementItem[],
    dbList: DbStatementItem[]
  ): ReconciliationRow[] => {
    const rows: ReconciliationRow[] = [];
    const claimedDbIds = new Set<string>();

    statementList.forEach((stmt) => {
      // Find candidate in DB matching 5 financial fields:
      // [Date, Previous Balance, Amount, Fee/Discount, Available Balance]
      let bestCandidate: DbStatementItem | null = null;
      let candidateDifferences: FieldDifference[] = [];
      let isExact = false;

      // 1. Look for exact 5-field match first (prioritizing phone/time if multiple exist)
      for (const cand of dbList) {
        if (claimedDbIds.has(cand.id)) continue;

        const dateMatch = cand.date === stmt.date;
        const prevMatch = Math.abs(cand.prevBalance - stmt.prevBalance) < 0.05;
        const amtMatch = Math.abs(cand.amount - stmt.amount) < 0.05;
        const feeMatch = Math.abs(cand.fee - stmt.fee) < 0.05;
        const availMatch = Math.abs(cand.availableBalance - stmt.availableBalance) < 0.05;

        if (dateMatch && prevMatch && amtMatch && feeMatch && availMatch) {
          bestCandidate = cand;
          isExact = true;
          break;
        }
      }

      // 2. If no exact match found, look for best partial candidate (same amount and close date/phone)
      if (!bestCandidate) {
        for (const cand of dbList) {
          if (claimedDbIds.has(cand.id)) continue;

          const amtMatch = Math.abs(cand.amount - stmt.amount) < 0.05;
          const phoneMatch = Boolean(stmt.phone && cand.phone && (stmt.phone.includes(cand.phone) || cand.phone.includes(stmt.phone)));

          if (amtMatch || phoneMatch) {
            bestCandidate = cand;

            // Calculate exact differences
            const diffs: FieldDifference[] = [];
            if (cand.date !== stmt.date) {
              diffs.push({ field: 'date', label: 'التاريخ', statementValue: stmt.date, dbValue: cand.date });
            }
            if (Math.abs(cand.prevBalance - stmt.prevBalance) >= 0.05) {
              diffs.push({
                field: 'prevBalance',
                label: 'الرصيد السابق',
                statementValue: stmt.prevBalance,
                dbValue: cand.prevBalance,
                diffAmount: stmt.prevBalance - cand.prevBalance,
              });
            }
            if (Math.abs(cand.amount - stmt.amount) >= 0.05) {
              diffs.push({
                field: 'amount',
                label: 'المبلغ',
                statementValue: stmt.amount,
                dbValue: cand.amount,
                diffAmount: stmt.amount - cand.amount,
              });
            }
            if (Math.abs(cand.fee - stmt.fee) >= 0.05) {
              diffs.push({
                field: 'fee',
                label: 'مبلغ الخصم/العمولة',
                statementValue: stmt.fee,
                dbValue: cand.fee,
                diffAmount: stmt.fee - cand.fee,
              });
            }
            if (Math.abs(cand.availableBalance - stmt.availableBalance) >= 0.05) {
              diffs.push({
                field: 'availableBalance',
                label: 'المبلغ المتاح/الرصيد',
                statementValue: stmt.availableBalance,
                dbValue: cand.availableBalance,
                diffAmount: stmt.availableBalance - cand.availableBalance,
              });
            }

            candidateDifferences = diffs;
            break;
          }
        }
      }

      if (bestCandidate && isExact) {
        claimedDbIds.add(bestCandidate.id);
        rows.push({
          id: `row-${stmt.id}`,
          status: 'matched',
          statementItem: stmt,
          dbItem: bestCandidate,
          needsReview: false,
        });
      } else if (bestCandidate && candidateDifferences.length > 0) {
        claimedDbIds.add(bestCandidate.id);
        rows.push({
          id: `row-${stmt.id}`,
          status: 'mismatched',
          statementItem: stmt,
          dbItem: bestCandidate,
          differences: candidateDifferences,
          needsReview: true,
        });
      } else {
        // Case 3: In statement but not in DB (غير مسجلة في البرنامج)
        rows.push({
          id: `row-${stmt.id}`,
          status: 'not_in_db',
          statementItem: stmt,
          needsReview: true,
        });
      }
    });

    // Case 4: Operations in DB but not in statement (غير موجودة في الكشف الخارجي)
    dbList.forEach((dbIt) => {
      if (!claimedDbIds.has(dbIt.id)) {
        rows.push({
          id: `row-db-${dbIt.id}`,
          status: 'not_in_statement',
          dbItem: dbIt,
          needsReview: true,
        });
      }
    });

    return rows;
  };

  // 6. Start Full Reconciliation Workflow
  const handleStartReconciliation = async () => {
    if (uploadedImages.length === 0) {
      alert('يرجى رفع صورة أو كشف حساب واحد على الأقل للمقارنة');
      return;
    }

    const start = periodType === 'day' ? singleDate : startDate;
    const end = periodType === 'day' ? singleDate : endDate;

    if (!validateDates(start, end)) return;

    const selectedLine = lines.find((l) => l.id === selectedLineId);
    setReconciliationError(null);
    setIsProcessing(true);
    setProgressPercent(10);
    setCurrentStageText('جاري قراءة الصور والمستندات المرفوعة...');

    try {
      // Stage 1: Reading images
      await new Promise((r) => setTimeout(r, 450));
      setProgressPercent(25);
      setCurrentStageText('تحسين جودة الصور واكتشاف الجداول والصفوف...');

      // Stage 2: OCR Extraction via Server API
      await new Promise((r) => setTimeout(r, 400));
      setProgressPercent(45);
      setCurrentStageText('استخراج النصوص والأرقام ومطابقة العمليات (OCR)...');

      const ocrRes = await api.performOcrReconciliation({
        images: uploadedImages.map((img) => ({
          name: img.name,
          mimeType: img.mimeType,
          base64: img.base64,
          size: img.size,
        })),
        sourceInfo: {
          id: selectedLine?.id || 'all',
          name: selectedLine?.name || 'كافة الخطوط',
          provider: selectedLine?.provider,
          phoneNumber: selectedLine?.phoneNumber,
        },
        period: { startDate: start, endDate: end },
      });

      const extracted = ocrRes.items || [];
      setExtractedItems(extracted);

      // Stage 3: Fetching DB Operations
      setProgressPercent(65);
      setCurrentStageText('جلب العمليات المقابلة من قاعدة بيانات البرنامج...');

      const dbRes = await api.getReconciliationDbOperations({
        sourceId: selectedLineId || undefined,
        startDate: start,
        endDate: end,
      });

      const dbOps = dbRes.dbItems || [];
      setDbItems(dbOps);

      // Stage 4: Financial Reconciliation
      setProgressPercent(85);
      setCurrentStageText('إجراء المقارنة المالية الدقيقة ومطابقة الأرصدة...');

      const rows = matchStatementWithDb(extracted, dbOps);
      setReconciliationRows(rows);

      // Stage 5: Finalizing
      await new Promise((r) => setTimeout(r, 350));
      setProgressPercent(100);
      setCurrentStageText('تم الانتهاء من المقارنة بنجاح');

      const matchedCount = rows.filter((r) => r.status === 'matched').length;
      const mismatchedCount = rows.filter((r) => r.status === 'mismatched').length;
      const notInDbCount = rows.filter((r) => r.status === 'not_in_db').length;
      const needsReviewCount = rows.filter((r) => r.needsReview).length;

      setProcessingStats({
        imagesProcessed: uploadedImages.length,
        extractedCount: extracted.length,
        matchedCount,
        needsReviewCount,
      });

      // Default Comparison Name
      const autoName = `مطابقة ${selectedLine?.name || 'العمليات'} - ${start === end ? start : `${start} إلى ${end}`}`;
      setComparisonName(autoName);

      setHasResults(true);
      setActiveResultView('paper_sheet');
    } catch (err: any) {
      console.error('Reconciliation error:', err);
      setReconciliationError(err?.message || 'حدث خطأ أثناء إجراء المقارنة، يرجى إعادة المحاولة.');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);
    }
  };

  // 6.b. Fast Load Sample Paper Statement (55 Real Vodafone Cash Operations)
  const handleLoadPaperStatementSample = async () => {
    setIsProcessing(true);
    setCurrentStageText('جاري مسح وقراءة كشف العمليات الورقي (55 حركة)...');
    setProgressPercent(20);
    setReconciliationError(null);

    try {
      await new Promise(r => setTimeout(r, 350));
      setProgressPercent(45);
      setCurrentStageText('استخراج كافة أعمدة الورقة (MSISDN, SecondLeg, Date, Amount, Reference)...');

      const res = await api.getSamplePaperStatement();
      const items = res.items || [];
      setExtractedItems(items);

      if (uploadedImages.length === 0) {
        setUploadedImages([
          {
            id: 'sample-paper-img-1',
            name: 'WhatsApp Image 2026-11-07 (سجل العمليات المطبوع).jpeg',
            size: 245000,
            mimeType: 'image/jpeg',
            previewUrl: '/assets/aistudio/image_1d49d1d0.png',
            base64: '',
          }
        ]);
      }

      // Default period to October activity (e.g. 13 to 16 October 2026)
      const start = '2026-10-13';
      const end = '2026-10-16';
      setPeriodType('range');
      setStartDate(start);
      setEndDate(end);

      setProgressPercent(70);
      setCurrentStageText('جلب عمليات قاعدة البيانات المقابلة للمطابقة...');

      const dbRes = await api.getReconciliationDbOperations({
        startDate: start,
        endDate: end,
      });
      const dbOps = dbRes.dbItems || [];
      setDbItems(dbOps);

      setProgressPercent(90);
      setCurrentStageText('تحديد مستطيل الأيام من 13 إلى 16 أكتوبر وإجراء المقارنة...');

      const rows = matchStatementWithDb(items, dbOps);
      setReconciliationRows(rows);

      setProgressPercent(100);
      setCurrentStageText('تم قراءة الكشف وتحديد مستطيل الفترة بنجاح');

      const matchedCount = rows.filter((r) => r.status === 'matched').length;
      const mismatchedCount = rows.filter((r) => r.status === 'mismatched').length;
      const notInDbCount = rows.filter((r) => r.status === 'not_in_db').length;
      const needsReviewCount = rows.filter((r) => r.needsReview).length;

      setProcessingStats({
        imagesProcessed: 1,
        extractedCount: items.length,
        matchedCount,
        needsReviewCount,
      });

      setComparisonName('مطابقة كشف فودافون كاش - مستطيل الأيام من 2026/10/13 إلى 2026/10/16');
      setHasResults(true);
      setActiveResultView('paper_sheet');
    } catch (err: any) {
      console.error('Failed to load sample paper statement:', err);
      setReconciliationError(err?.message || 'فشل تحميل كشف الورقة المطبوعة');
    } finally {
      setTimeout(() => setIsProcessing(false), 300);
    }
  };

  // 7. Save Reconciliation
  const handleSaveReconciliation = async () => {
    if (!comparisonName.trim()) {
      alert('يرجى إدخال اسم للمقارنة قبل الحفظ');
      return;
    }

    const selectedLine = lines.find((l) => l.id === selectedLineId);
    const start = periodType === 'day' ? singleDate : startDate;
    const end = periodType === 'day' ? singleDate : endDate;

    const matchedCount = reconciliationRows.filter((r) => r.status === 'matched').length;
    const mismatchedCount = reconciliationRows.filter((r) => r.status === 'mismatched').length;
    const notInDbCount = reconciliationRows.filter((r) => r.status === 'not_in_db').length;
    const notInStatementCount = reconciliationRows.filter((r) => r.status === 'not_in_statement').length;
    const needsReviewCount = reconciliationRows.filter((r) => r.needsReview).length;
    const totalComparisons = extractedItems.length || 1;
    const matchRate = Math.round((matchedCount / totalComparisons) * 100 * 10) / 10;

    const recordToSave: Partial<ReconciliationRecord> = {
      name: comparisonName.trim(),
      sourceType: (selectedSourceType as any) || 'cash_line',
      sourceId: selectedLineId || 'all',
      sourceName: selectedLine?.name || 'كافة الخطوط',
      sourceNumber: selectedLine?.phoneNumber || '',
      provider: selectedLine?.provider,
      periodType,
      startDate: start,
      endDate: end,
      images: uploadedImages.map((img) => ({
        id: img.id,
        name: img.name,
        size: img.size,
        mimeType: img.mimeType,
        previewUrl: img.previewUrl,
      })),
      extractedItems,
      dbItems,
      rows: reconciliationRows,
      summary: {
        totalExtracted: extractedItems.length,
        totalDb: dbItems.length,
        matchedCount,
        mismatchedCount,
        notInDbCount,
        notInStatementCount,
        needsReviewCount,
        matchRate,
      },
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);
    setSaveSuccessMsg(null);
    try {
      await api.saveReconciliation(recordToSave);
      setSaveSuccessMsg('تم حفظ المقارنة بنجاح في سجل المقارنات');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      loadHistory();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ المقارنة');
    } finally {
      setIsSaving(false);
    }
  };

  // 8. Excel Export
  const handleExportExcel = () => {
    const selectedLine = lines.find((l) => l.id === selectedLineId);
    const start = periodType === 'day' ? singleDate : startDate;
    const end = periodType === 'day' ? singleDate : endDate;

    const matchedCount = reconciliationRows.filter((r) => r.status === 'matched').length;
    const mismatchedCount = reconciliationRows.filter((r) => r.status === 'mismatched').length;
    const notInDbCount = reconciliationRows.filter((r) => r.status === 'not_in_db').length;
    const notInStatementCount = reconciliationRows.filter((r) => r.status === 'not_in_statement').length;
    const needsReviewCount = reconciliationRows.filter((r) => r.needsReview).length;
    const totalComparisons = extractedItems.length || 1;
    const matchRate = Math.round((matchedCount / totalComparisons) * 100 * 10) / 10;

    const currentRecord: ReconciliationRecord = {
      id: `rec-${Date.now()}`,
      name: comparisonName || `مطابقة ${selectedLine?.name || 'العمليات'}`,
      sourceType: (selectedSourceType as any) || 'cash_line',
      sourceId: selectedLineId || 'all',
      sourceName: selectedLine?.name || 'كافة الخطوط',
      sourceNumber: selectedLine?.phoneNumber || '',
      provider: selectedLine?.provider,
      periodType,
      startDate: start,
      endDate: end,
      images: uploadedImages,
      extractedItems,
      dbItems,
      rows: reconciliationRows,
      summary: {
        totalExtracted: extractedItems.length,
        totalDb: dbItems.length,
        matchedCount,
        mismatchedCount,
        notInDbCount,
        notInStatementCount,
        needsReviewCount,
        matchRate,
      },
      createdAt: new Date().toISOString(),
      createdBy: 'currentUser',
      createdByName: 'عادل فتحي',
    };

    exportReconciliationToExcel(currentRecord);
  };

  // 9. Open Previous Saved Reconciliation
  const handleOpenSavedRecord = async (recordId: string) => {
    try {
      const res = await api.getReconciliationById(recordId);
      const rec = res.record;
      setViewingRecord(rec);
      setComparisonName(rec.name);
      setSelectedLineId(rec.sourceId);
      setPeriodType(rec.periodType);
      if (rec.periodType === 'day') setSingleDate(rec.startDate);
      else {
        setStartDate(rec.startDate);
        setEndDate(rec.endDate);
      }
      setUploadedImages(
        (rec.images || []).map((img) => ({
          ...img,
          base64: img.previewUrl || '',
          previewUrl: img.previewUrl || '',
        }))
      );
      setExtractedItems(rec.extractedItems || []);
      setDbItems(rec.dbItems || []);
      setReconciliationRows(rec.rows || []);
      setHasResults(true);
      setActiveTab('new');
    } catch (err: any) {
      alert('تعذر تحميل تفاصيل المقارنة السابقة');
    }
  };

  // 10. Delete Saved Record
  const handleDeleteRecord = async (id: string) => {
    try {
      await api.deleteReconciliation(id);
      setDeleteConfirmId(null);
      loadHistory();
    } catch (err: any) {
      alert('حدث خطأ أثناء حذف المقارنة');
    }
  };

  // Filtered Rows for display
  const filteredRows = reconciliationRows.filter((row) => {
    // Phone Search
    if (searchPhone.trim()) {
      const q = searchPhone.trim();
      const sPhone = row.statementItem?.phone || '';
      const dPhone = row.dbItem?.phone || '';
      if (!sPhone.includes(q) && !dPhone.includes(q)) return false;
    }

    // Status Filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'needs_review') return row.needsReview;
    return row.status === statusFilter;
  });

  // Calculate statistics
  const totalExtracted = extractedItems.length;
  const totalDb = dbItems.length;
  const matchedCount = reconciliationRows.filter((r) => r.status === 'matched').length;
  const mismatchedCount = reconciliationRows.filter((r) => r.status === 'mismatched').length;
  const notInDbCount = reconciliationRows.filter((r) => r.status === 'not_in_db').length;
  const notInStatementCount = reconciliationRows.filter((r) => r.status === 'not_in_statement').length;
  const needsReviewCount = reconciliationRows.filter((r) => r.needsReview).length;
  const matchRate = totalExtracted > 0 ? Math.round((matchedCount / totalExtracted) * 100 * 10) / 10 : 0;

  // Active selected period range for boundary box
  const curPeriodStart = periodType === 'day' ? singleDate : startDate;
  const curPeriodEnd = periodType === 'day' ? singleDate : endDate;

  const isItemInBox = (item: ExtractedStatementItem) => {
    if (!item.date) return false;
    const d = item.date.slice(0, 10);
    return d >= curPeriodStart && d <= curPeriodEnd;
  };

  const boxedPaperItems = extractedItems.filter(isItemInBox);
  const boxedCount = boxedPaperItems.length;
  const boxedTotalAmount = boxedPaperItems.reduce((acc, it) => acc + (it.amount || 0), 0);
  const totalSheetAmount = extractedItems.reduce((acc, it) => acc + (it.amount || 0), 0);

  // Filtered Paper Items for the Paper Sheet Table
  const filteredPaperItems = extractedItems.filter((item) => {
    if (onlyShowBoxedDays && !isItemInBox(item)) {
      return false;
    }
    if (paperSearchQuery.trim()) {
      const q = paperSearchQuery.trim().toLowerCase();
      const matchPhone = (item.phone || '').includes(q) || (item.msisdn || '').includes(q) || (item.secondLegMobile || '').includes(q);
      const matchRef = (item.reference || '').toLowerCase().includes(q);
      const matchType = (item.rawType || item.type || '').toLowerCase().includes(q);
      const matchDate = (item.date || '').includes(q) || (item.rawDate || '').toLowerCase().includes(q);
      const matchAmount = item.amount.toString().includes(q);
      if (!matchPhone && !matchRef && !matchType && !matchDate && !matchAmount) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* =========================================================================
       * Page Header with Official Seyola Logo & Primary Tabs
       * ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center p-1.5 shadow-md shadow-emerald-500/10 shrink-0">
            <img src="/logo.png" alt="Seolah" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                مقارنة العمليات – Reconciliation
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                تدقيق ذكي ومطابقة مالية
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              منظومة سيولة (Seyola) · مطابقة كشوف الحسابات والإيصالات الخارجية مع قاعدة بيانات البرنامج آلياً
            </p>
          </div>
        </div>

        {/* Navigation Tabs between New Comparison and History */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'new'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompareArrows className="w-4 h-4" />
            <span>مقارنة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سجل المقارنات</span>
            {historyRecords.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-emerald-400 font-mono font-bold">
                {historyRecords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
       * TAB 1: New Reconciliation Workflow
       * ========================================================================= */}
      {activeTab === 'new' && (
        <div className="space-y-6">

          {/* Configuration Card: Source & Period Selection */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
            
            {/* Step 1: تحديد مصدر العمليات المالية */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">1</span>
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  تحديد مصدر العمليات المالية
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Source Category / Provider Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    نوع ومزود المصدر المالي
                  </label>
                  <select
                    value={selectedSourceType}
                    onChange={(e) => setSelectedSourceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash_line">خطوط الكاش المسجلة في البرنامج</option>
                    <option value="wallet">المحافظ الإلكترونية (Vodafone / Orange / Etisalat / WE)</option>
                    <option value="bank_account">الحسابات البنكية (الأهلي / مصر / CIB / QNB)</option>
                    <option value="instapay">حسابات وتطبيقات InstaPay</option>
                    <option value="vault">الخزن المالية والنقدية</option>
                  </select>
                </div>

                {/* Specific Line or Account loaded automatically from DB */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اختر الحساب أو الخط من قاعدة البيانات
                  </label>
                  <select
                    value={selectedLineId}
                    onChange={(e) => setSelectedLineId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">كافة الخطوط والعمليات (مقارنة شاملة)</option>
                    {lines.map((line) => (
                      <option key={line.id} value={line.id}>
                        {line.name} ({line.phoneNumber}) — رصيد مسجل: {formatAmount(line.balance, 0)} ج.م
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: تحديد فترة المقارنة */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">2</span>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">
                    تحديد فترة المقارنة
                  </h2>
                </div>

                {/* Period Mode Switcher: Single Day vs Date Range */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodType('day');
                      setDateError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      periodType === 'day' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    مقارنة يوم محدد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPeriodType('range');
                      setDateError(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      periodType === 'range' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    مقارنة خلال فترة زمنية
                  </button>
                </div>
              </div>

              {/* Date Inputs with Validation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {periodType === 'day' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      تاريخ اليوم المراد مطابقته
                    </label>
                    <input
                      type="date"
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        من تاريخ (بداية الفترة)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          validateDates(e.target.value, endDate);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        إلى تاريخ (نهاية الفترة)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          validateDates(startDate, e.target.value);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Quick Period Presets */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-[11px] text-slate-400 font-bold ml-1">فترات سريعة:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodType('range');
                    setStartDate('2026-10-10');
                    setEndDate('2026-10-26');
                    setDateError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition cursor-pointer"
                >
                  كامل فترة الورقة (10 - 26 أكتوبر)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodType('range');
                    setStartDate('2026-10-13');
                    setEndDate('2026-10-16');
                    setDateError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition hover:bg-emerald-500/20 cursor-pointer"
                >
                  أيام النشاط بالورقة (13 - 16 أكتوبر) 🎯
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodType('day');
                    setSingleDate('2026-10-16');
                    setDateError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition cursor-pointer"
                >
                  يوم 16 أكتوبر 2026
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodType('day');
                    setSingleDate('2026-10-13');
                    setDateError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition cursor-pointer"
                >
                  يوم 13 أكتوبر 2026
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodType('day');
                    setSingleDate(new Date().toISOString().slice(0, 10));
                    setDateError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition cursor-pointer"
                >
                  اليوم الحالي
                </button>
              </div>

              {dateError && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{dateError}</span>
                </div>
              )}
            </div>

            {/* Step 3: رفع كشف العمليات للمقارنة (Upload Documents & Images) */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">3</span>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">
                    رفع كشف العمليات للمقارنة
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  يدعم صور JPG, JPEG, PNG المتعددة
                </span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className={`mt-4 border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-extrabold text-white">
                  اسحب وأفلت صور كشف العمليات هنا أو اضغط للاختيار
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  يمكنك اختيار صورة واحدة أو عدة صور متتابعة للكشف دفعة واحدة، وسيقوم النظام بدمجها وتحليلها آلياً
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>رفع الصور</span>
                </button>
              </div>

              {/* Quick Load Real Paper Sheet Sample Button */}
              <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      نموذج كشف العمليات المطبوع المرفق (55 حركة - فودافون كاش)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      مطابق للورقة المرفقة من تاريخ 10-10 إلى 26-10 مع فحص كامل لكافة الحقول وتأطير الأيام المحددة
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadPaperStatementSample}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>استيراد كشف الورقة وقراءتها فوراً</span>
                </button>
              </div>

              {/* Uploaded Images Thumbnails Strip */}
              {uploadedImages.length > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="font-bold text-white">
                      الصور المرفوعة ({uploadedImages.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages([])}
                      className="text-rose-400 hover:text-rose-300 transition text-[11px] font-bold"
                    >
                      حذف كافة الصور
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {uploadedImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className="group relative rounded-2xl bg-slate-950 border border-slate-800 p-2 overflow-hidden shadow-md flex flex-col justify-between"
                      >
                        <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-1.5">
                          <img
                            src={img.previewUrl}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setZoomedImage(img.previewUrl)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                            title="تكبير ومعاينة"
                          >
                            <ZoomIn className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10.5px] font-bold text-white truncate block" title={img.name}>
                            {idx + 1}. {img.name}
                          </span>
                          <span className="text-[9.5px] text-slate-500 block">
                            {(img.size / 1024).toFixed(0)} KB
                          </span>
                        </div>

                        {/* Actions on thumbnail */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 mt-1">
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, 'left')}
                                className="text-[10px] text-slate-400 hover:text-white px-1 py-0.5 rounded bg-slate-800"
                                title="تحريك للأمام"
                              >
                                →
                              </button>
                            )}
                            {idx < uploadedImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, 'right')}
                                className="text-[10px] text-slate-400 hover:text-white px-1 py-0.5 rounded bg-slate-800"
                                title="تحريك للخلف"
                              >
                                ←
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(img.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Banner if any */}
              {reconciliationError && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-200 text-xs shadow-lg animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="font-medium">{reconciliationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReconciliationError(null);
                      handleStartReconciliation();
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer text-xs shrink-0 inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              )}

              {/* Main Action: بدء المقارنة */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleStartReconciliation}
                  disabled={isProcessing || uploadedImages.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2.5 transition active:scale-95 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري معالجة ومطابقة الكشوف...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>بدء المقارنة والمطابقة المالية</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* =========================================================================
           * Step 4: واجهة المعالجة المرئية الاحترافية (Visual Live Processing Screen)
           * ========================================================================= */}
          {isProcessing && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      محرّك التدقيق والمطابقة المالية الذكي
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      {currentStageText}
                    </p>
                  </div>
                </div>

                <span className="font-mono font-black text-emerald-400 text-lg">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar from 0% to 100% */}
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Real-time stats during processing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">الصور المعالجة:</span>
                  <span className="font-mono font-bold text-white text-sm">{uploadedImages.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">العمليات المستخرجة:</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {progressPercent > 50 ? extractedItems.length || 'جاري الحصر...' : '...'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">سجلات قاعدة البيانات:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {progressPercent > 70 ? dbItems.length : '...'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">حالة التدقيق:</span>
                  <span className="font-bold text-amber-400 text-xs">فحص 5 حقول مالية</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
           * Step 5 & 6: النتائج وجدول المقارنة المالي الاحترافي (Reconciliation Table)
           * ========================================================================= */}
          {hasResults && !isProcessing && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-blue-500/30 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-400 block mb-1">
                    كشف العمليات (المستخرج)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-white">{totalExtracted}</span>
                    <span className="text-[10px] text-slate-400">حركة</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-400 block mb-1">
                    سجلات قاعدة البيانات
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-white">{totalDb}</span>
                    <span className="text-[10px] text-slate-400">حركة</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-300 block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>متطابقة تماماً</span>
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-emerald-400">{matchedCount}</span>
                    <span className="text-[10px] text-slate-400">عملية</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-300 block mb-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-amber-400" />
                    <span>تحتوي على اختلافات</span>
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-amber-400">{mismatchedCount}</span>
                    <span className="text-[10px] text-slate-400">عملية</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-rose-500/40 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-300 block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>غير مسجلة بالبرنامج</span>
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black font-mono text-rose-400">{notInDbCount}</span>
                    <span className="text-[10px] text-slate-400">عملية</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-300 block mb-1">
                    نسبة المطابقة الإجمالية
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-emerald-400">{matchRate}%</span>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs: Paper Statement vs Dual Comparison */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveResultView('paper_sheet')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      activeResultView === 'paper_sheet'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-emerald-300" />
                    <span>جدول بيانات الورقة المطبوعة (مثل الورقة تماماً مع تأطير الأيام بمستطيل)</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                      {extractedItems.length} سطر
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveResultView('comparison')}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      activeResultView === 'comparison'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Scale className="w-4 h-4 text-blue-300" />
                    <span>جدول المقارنة والمطابقة المشتركة مع قاعدة البيانات</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-mono text-blue-300 border border-blue-500/30">
                      {reconciliationRows.length} صف
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 px-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>المستطيل المالي: <strong className="text-emerald-300 font-mono">{curPeriodStart}</strong> إلى <strong className="text-emerald-300 font-mono">{curPeriodEnd}</strong></span>
                </div>
              </div>

              {/* =========================================================================
               * VIEW 1: Paper Statement Table (مثل الورقة تماماً مع تأطير مستطيل الفترة)
               * ========================================================================= */}
              {activeResultView === 'paper_sheet' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Paper Statement Banner & Quick Presets */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border-2 border-emerald-500/40 shadow-xl space-y-3">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Box className="w-4 h-4" />
                          </span>
                          <h3 className="text-sm font-black text-white">
                            سجل العمليات المقروء من الورقة المطبوعة (Vodafone Cash Statement)
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                            MSISDN: 00201061650660
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          يتم عرض كافة أعمدة وسطور الورقة الأصلية وعددها <strong className="text-white font-mono">{extractedItems.length}</strong> حركة، مع تحديد الأيام المحددة بالبرنامج من <strong className="text-emerald-300 font-mono">{curPeriodStart}</strong> إلى <strong className="text-emerald-300 font-mono">{curPeriodEnd}</strong> داخل <strong className="text-emerald-300">مستطيل مالي محدد الأطراف</strong> بلون أخضر زمردي مميز.
                        </p>
                      </div>

                      {/* Rectangle Metrics Pills */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-right">
                          <span className="text-[10px] text-slate-400 block">داخل مستطيل الفترة</span>
                          <span className="text-sm font-black font-mono text-emerald-400">
                            {boxedCount} <span className="text-[10px] font-normal text-slate-400">حركة</span> ({formatAmount(boxedTotalAmount)} ج.م)
                          </span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
                          <span className="text-[10px] text-slate-400 block">إجمالي الورقة بالكامل</span>
                          <span className="text-sm font-black font-mono text-slate-200">
                            {extractedItems.length} <span className="text-[10px] font-normal text-slate-400">حركة</span> ({formatAmount(totalSheetAmount)} ج.م)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Date Presets Chips to Move the Rectangle */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-400 font-bold shrink-0 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تحريك مستطيل الفترة:</span>
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setPeriodType('range');
                            setStartDate('2026-10-10');
                            setEndDate('2026-10-26');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            periodType === 'range' && startDate === '2026-10-10' && endDate === '2026-10-26'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          كامل فترة الورقة (10 - 26 أكتوبر)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPeriodType('range');
                            setStartDate('2026-10-13');
                            setEndDate('2026-10-16');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            periodType === 'range' && startDate === '2026-10-13' && endDate === '2026-10-16'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          أيام النشاط بالورقة (13 - 16 أكتوبر)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPeriodType('day');
                            setSingleDate('2026-10-16');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            periodType === 'day' && singleDate === '2026-10-16'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          يوم 16 أكتوبر
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPeriodType('day');
                            setSingleDate('2026-10-13');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            periodType === 'day' && singleDate === '2026-10-13'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          يوم 13 أكتوبر
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPeriodType('day');
                            setSingleDate('2026-11-08');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                            periodType === 'day' && singleDate === '2026-11-08'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          اليوم الحالي (2026-11-08)
                        </button>
                      </div>

                      {/* Display toggle */}
                      <button
                        type="button"
                        onClick={() => setOnlyShowBoxedDays(!onlyShowBoxedDays)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                          onlyShowBoxedDays
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{onlyShowBoxedDays ? 'عرض كامل كشف الورقة مع تأطير المستطيل' : 'حصر العرض على مستطيل الأيام المحددة فقط'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={paperSearchQuery}
                        onChange={(e) => setPaperSearchQuery(e.target.value)}
                        placeholder="بحث في بيانات الورقة (رقم الهاتف، المرجع، نوع العملية، المبلغ)..."
                        className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>تصدير الورقة إلى Excel</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleSaveReconciliation}
                        disabled={isSaving}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>حفظ المقارنة</span>
                      </button>
                    </div>
                  </div>

                  {/* Scanned Statement Table with Identical Paper Structure */}
                  <div className="rounded-3xl bg-slate-900 border-2 border-slate-800 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
                      <table className="w-full text-right text-xs border-collapse font-sans">
                        
                        {/* Table Header matching the Paper exactly */}
                        <thead className="sticky top-0 z-20 shadow-md">
                          <tr className="bg-slate-950 text-slate-200 font-black text-[11px] border-b-2 border-slate-800 whitespace-nowrap">
                            <th className="p-2.5 border-l border-slate-800 text-center w-10">#</th>
                            <th className="p-2.5 border-l border-slate-800 text-center bg-blue-950/40 text-blue-200">MSISDN</th>
                            <th className="p-2.5 border-l border-slate-800 text-center bg-blue-950/40 text-blue-200">SecondLegMobile</th>
                            <th className="p-2.5 border-l border-slate-800 text-center bg-slate-900 text-white">Date</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Transaction Type</th>
                            <th className="p-2.5 border-l border-slate-800 text-center text-cyan-300">Amount</th>
                            <th className="p-2.5 border-l border-slate-800 text-center text-emerald-300">Available Balance</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Reference</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Previous Balance</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Fees</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Hold Amount</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Total Balance</th>
                            <th className="p-2.5 border-l border-slate-800 text-center">Status</th>
                            <th className="p-2.5 text-center bg-emerald-950/40 text-emerald-300">تحديد الفترة (المستطيل 🎯)</th>
                          </tr>
                        </thead>

                        {/* Table Body with Glowing Rectangular Framing */}
                        <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                          {filteredPaperItems.length === 0 ? (
                            <tr>
                              <td colSpan={14} className="p-8 text-center text-slate-400 font-sans">
                                لا توجد حركات مطابقة للبحث أو الفترة المحددة
                              </td>
                            </tr>
                          ) : (
                            filteredPaperItems.map((item, idx) => {
                              const inBox = isItemInBox(item);
                              const prevItem = idx > 0 ? filteredPaperItems[idx - 1] : null;
                              const nextItem = idx < filteredPaperItems.length - 1 ? filteredPaperItems[idx + 1] : null;
                              
                              const isFirstOfBox = inBox && (!prevItem || !isItemInBox(prevItem));
                              const isLastOfBox = inBox && (!nextItem || !isItemInBox(nextItem));

                              return (
                                <React.Fragment key={item.id || `paper-${idx}`}>
                                  {/* Top Boundary of the Rectangular Box */}
                                  {isFirstOfBox && (
                                    <tr className="bg-emerald-950 border-y-2 border-emerald-400 select-none shadow-md">
                                      <td colSpan={14} className="py-2 px-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-emerald-400 rounded-full" />
                                          <div className="flex items-center gap-2 text-xs font-black text-emerald-300 font-sans uppercase tracking-wider">
                                            <Box className="w-4 h-4 text-emerald-400 animate-pulse" />
                                            <span>┌── بداية مستطيل الفترة المحددة بالبرنامج: من {curPeriodStart} إلى {curPeriodEnd} (إجمالي {boxedCount} حركة داخل المستطيل) ──┐</span>
                                          </div>
                                          <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-emerald-400 rounded-full" />
                                        </div>
                                      </td>
                                    </tr>
                                  )}

                                  {/* Row Item with Left and Right Border creating the Rectangle */}
                                  <tr
                                    className={`transition-all whitespace-nowrap ${
                                      inBox
                                        ? 'border-r-4 border-l-4 border-emerald-400 bg-emerald-500/[0.12] dark:bg-emerald-500/[0.16] hover:bg-emerald-500/[0.22] text-white font-bold shadow-xs'
                                        : 'opacity-60 hover:opacity-100 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400'
                                    }`}
                                  >
                                    {/* # Index */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-bold text-slate-300">
                                      {idx + 1}
                                    </td>

                                    {/* MSISDN */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono font-bold text-slate-200">
                                      {item.msisdn || '00201061650660'}
                                    </td>

                                    {/* SecondLegMobile */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono text-slate-300">
                                      {item.secondLegMobile || item.phone || '000000000000'}
                                    </td>

                                    {/* Date */}
                                    <td className={`p-2.5 border-l border-slate-800 text-center font-sans ${inBox ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
                                      {item.rawDate || `${item.date} ${item.time || ''}`}
                                    </td>

                                    {/* Transaction Type */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-sans font-medium text-slate-200">
                                      {item.rawType || item.type || 'Mobile Transfer'}
                                    </td>

                                    {/* Amount */}
                                    <td className={`p-2.5 border-l border-slate-800 text-center font-mono font-black ${inBox ? 'text-cyan-300 text-xs' : 'text-slate-300'}`}>
                                      {formatAmount(item.amount, 2)}
                                    </td>

                                    {/* Available Balance */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono font-bold text-emerald-400">
                                      {formatAmount(item.availableBalance, 2)}
                                    </td>

                                    {/* Reference */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono text-slate-300">
                                      {item.reference || '—'}
                                    </td>

                                    {/* Previous Balance */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono text-slate-400">
                                      {formatAmount(item.prevBalance, 2)}
                                    </td>

                                    {/* Fees */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono text-slate-400">
                                      {formatAmount(item.fee || 0, 2)}
                                    </td>

                                    {/* Hold Amount */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono text-slate-400">
                                      {formatAmount(item.holdAmount || 0, 2)}
                                    </td>

                                    {/* Total Balance */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-mono font-bold text-slate-300">
                                      {formatAmount(item.totalBalance || item.availableBalance, 2)}
                                    </td>

                                    {/* Status */}
                                    <td className="p-2.5 border-l border-slate-800 text-center font-sans">
                                      {item.status === 'completed' || item.rawStatus?.toLowerCase().includes('success') ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                                          Successful
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[10px] border border-rose-500/30">
                                          Failed
                                        </span>
                                      )}
                                    </td>

                                    {/* Rectangular Box Indicator Column */}
                                    <td className="p-2.5 text-center font-sans">
                                      {inBox ? (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 text-[10px] font-black flex items-center gap-1 justify-center whitespace-nowrap shadow-xs">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          <span>داخل المستطيل ({item.date})</span>
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] whitespace-nowrap">
                                          خارج المستطيل
                                        </span>
                                      )}
                                    </td>
                                  </tr>

                                  {/* Bottom Boundary of the Rectangular Box */}
                                  {isLastOfBox && (
                                    <tr className="bg-emerald-950 border-y-2 border-emerald-400 select-none shadow-md">
                                      <td colSpan={14} className="py-2 px-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-emerald-400 rounded-full" />
                                          <div className="flex items-center gap-2 text-xs font-black text-emerald-300 font-sans uppercase tracking-wider">
                                            <Box className="w-4 h-4 text-emerald-400" />
                                            <span>└── نهاية مستطيل الفترة المحددة: إجمالي المبالغ داخل المستطيل: {formatAmount(boxedTotalAmount)} ج.م ({boxedCount} حركة) ──┘</span>
                                          </div>
                                          <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-emerald-400 rounded-full" />
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer info */}
                    <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
                      <span>
                        إجمالي الحركات المعروضة: <strong className="text-white font-mono">{filteredPaperItems.length}</strong> من أصل <strong className="text-white font-mono">{extractedItems.length}</strong> حركة مقروءة بالورقة.
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>تأطير مستطيل الفترة: {boxedCount} حركة داخل المستطيل ({formatAmount(boxedTotalAmount)} ج.م)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* =========================================================================
               * VIEW 2: Dual Comparison Table (جدول المقارنة والمطابقة المشتركة مع قاعدة البيانات)
               * ========================================================================= */}
              {activeResultView === 'comparison' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Controls & Export Toolbar */}
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  
                  {/* Left (in RTL): Search and Filters */}
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    {/* Search by phone */}
                    <div className="relative min-w-[200px] flex-1 sm:flex-none">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        placeholder="بحث برقم الهاتف..."
                        className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Filter by Match Status */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                          statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        الكل ({reconciliationRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('matched')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap text-emerald-400 ${
                          statusFilter === 'matched' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300' : 'hover:text-emerald-300'
                        }`}
                      >
                        متطابقة ({matchedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('mismatched')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap text-amber-400 ${
                          statusFilter === 'mismatched' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-300' : 'hover:text-amber-300'
                        }`}
                      >
                        بها اختلافات ({mismatchedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('not_in_db')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap text-rose-400 ${
                          statusFilter === 'not_in_db' ? 'bg-rose-500/10 border border-rose-500/25 text-rose-300' : 'hover:text-rose-300'
                        }`}
                      >
                        غير مسجلة ({notInDbCount})
                      </button>
                    </div>

                    {/* Reset Filters */}
                    {(searchPhone || statusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchPhone('');
                          setStatusFilter('all');
                        }}
                        className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
                        title="إعادة ضبط الفلاتر"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right (in RTL): Action Buttons (Save & Excel Export) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
                      title="تصدير إلى ملف Microsoft Excel XLSX حقيقي"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تصدير إلى Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveReconciliation}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>حفظ المقارنة</span>
                    </button>
                  </div>
                </div>

                {/* Comparison Title Customizer & Save Confirmation */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                    <span className="text-slate-400 font-bold shrink-0">اسم المقارنة:</span>
                    <input
                      type="text"
                      value={comparisonName}
                      onChange={(e) => setComparisonName(e.target.value)}
                      placeholder="أدخل اسم المقارنة لحفظها..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {saveSuccessMsg && (
                    <div className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 animate-fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* The Full Excel-Style Reconciliation Table */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                  <table className="w-full text-right text-xs border-collapse font-sans">
                    
                    {/* Multi-tier sticky table header */}
                    <thead className="sticky top-0 z-20">
                      {/* Top Group Banner: Blue for External Statement, Green for Internal DB */}
                      <tr className="text-center font-black text-xs text-white select-none">
                        <th className="bg-slate-950 p-2.5 border-b border-l border-slate-800 w-12">
                          م
                        </th>
                        <th className="bg-slate-950 p-2.5 border-b border-l border-slate-800 w-28">
                          حالة المطابقة
                        </th>
                        
                        {/* External Statement Group (Blue) */}
                        <th 
                          colSpan={9} 
                          className="bg-blue-900/60 dark:bg-blue-950/70 text-blue-100 p-2.5 border-b border-l border-blue-800/60 text-center tracking-tight shadow-inner"
                        >
                          بيانات كشف العمليات – المصدر الخارجي (كشف الحساب / المحفظة)
                        </th>

                        {/* Internal Database Group (Green) */}
                        <th 
                          colSpan={7} 
                          className="bg-emerald-900/60 dark:bg-emerald-950/70 text-emerald-100 p-2.5 border-b border-slate-800 text-center tracking-tight shadow-inner"
                        >
                          بيانات البرنامج – قاعدة البيانات الداخلية
                        </th>
                      </tr>

                      {/* Lower Detailed Column Headers */}
                      <tr className="bg-slate-950 text-slate-300 font-bold text-[11px] border-b border-slate-800 whitespace-nowrap">
                        <th className="p-2 border-l border-slate-800 text-center">#</th>
                        <th className="p-2 border-l border-slate-800 text-center">النتيجة</th>
                        
                        {/* Statement Columns */}
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">رقم الهاتف</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">التاريخ</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">الساعة</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">نوع العملية</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">الرصيد السابق</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">المبلغ</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">مبلغ الخصم</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">المبلغ المتاح</th>
                        <th className="p-2 border-l border-slate-800 bg-blue-950/20 text-blue-200">حالة العملية</th>

                        {/* DB Columns */}
                        <th className="p-2 border-l border-slate-800 bg-emerald-950/20 text-emerald-200">رقم الهاتف</th>
                        <th className="p-2 border-l border-slate-800 bg-emerald-950/20 text-emerald-200">التاريخ</th>
                        <th className="p-2 border-l border-slate-800 bg-emerald-950/20 text-emerald-200">الساعة</th>
                        <th className="p-2 border-l border-slate-800 bg-emerald-950/20 text-emerald-200">الرصيد السابق</th>
                        <th className="p-2 border-l border-slate-800 bg-emerald-950/20 text-emerald-200">المبلغ</th>
                        <th className="p-2 border-l border-slate-800 bg-emerald-950/20 text-emerald-200">مبلغ الخصم</th>
                        <th className="p-2 bg-emerald-950/20 text-emerald-200">المبلغ المتاح</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-800">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={18} className="p-8 text-center text-slate-400">
                            لا توجد عمليات مطابقة للمعايير المحددة
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => {
                          const s = row.statementItem;
                          const d = row.dbItem;

                          // Row style according to Reconciliation Case
                          const isMatched = row.status === 'matched';
                          const isMismatched = row.status === 'mismatched';
                          const isNotInDb = row.status === 'not_in_db';
                          const isNotInStatement = row.status === 'not_in_statement';

                          return (
                            <tr
                              key={row.id}
                              className={`transition-colors whitespace-nowrap font-mono ${
                                isMatched
                                  ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] text-slate-800 dark:text-slate-200'
                                  : isMismatched
                                  ? 'bg-amber-500/[0.05] hover:bg-amber-500/[0.10] text-slate-800 dark:text-slate-200'
                                  : isNotInDb
                                  ? 'bg-rose-500/[0.05] hover:bg-rose-500/[0.10] text-slate-800 dark:text-slate-200'
                                  : 'bg-slate-500/[0.03] hover:bg-slate-500/[0.06] text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {/* Row Index */}
                              <td className="p-2.5 border-l border-slate-800 text-center text-[11px] font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              {/* Match Status Icon on far left */}
                              <td className="p-2.5 border-l border-slate-800 text-center">
                                {isMatched && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10.5px] font-bold font-sans">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>مطابقة</span>
                                  </span>
                                )}

                                {isMismatched && (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[10.5px] font-bold font-sans">
                                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                                      <span>اختلاف</span>
                                    </span>
                                    {row.differences && row.differences.length > 0 && (
                                      <span className="text-[9px] text-amber-400 mt-0.5 block max-w-[130px] truncate" title={row.differences.map(d => `${d.label}: ${d.statementValue} مقابل ${d.dbValue}`).join(' | ')}>
                                        {row.differences[0].label} ({row.differences[0].diffAmount ? formatAmount(row.differences[0].diffAmount, 0) : 'فرق'})
                                      </span>
                                    )}
                                  </div>
                                )}

                                {isNotInDb && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[10.5px] font-bold font-sans">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                    <span>غير مسجلة</span>
                                  </span>
                                )}

                                {isNotInStatement && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[10px] font-bold font-sans">
                                    <span>غير بالكشف</span>
                                  </span>
                                )}
                              </td>

                              {/* External Statement Data (Blue Columns) */}
                              <td className="p-2.5 border-l border-slate-800 font-bold text-slate-200">
                                {s?.phone || '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 text-slate-300">
                                {s?.date || '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 text-slate-400">
                                {s?.time || '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 font-sans text-slate-300 text-[11px]">
                                {s?.type || '—'}
                              </td>
                              <td className={`p-2.5 border-l border-slate-800 font-bold ${row.differences?.some(d => d.field === 'prevBalance') ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300'}`}>
                                {s ? formatAmount(s.prevBalance, 2) : '—'}
                              </td>
                              <td className={`p-2.5 border-l border-slate-800 font-black text-cyan-300 ${row.differences?.some(d => d.field === 'amount') ? 'text-amber-400 bg-amber-500/10' : ''}`}>
                                {s ? formatAmount(s.amount, 2) : '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 text-slate-400">
                                {s ? formatAmount(s.fee, 2) : '—'}
                              </td>
                              <td className={`p-2.5 border-l border-slate-800 font-black text-emerald-400 ${row.differences?.some(d => d.field === 'availableBalance') ? 'text-amber-400 bg-amber-500/10' : ''}`}>
                                {s ? formatAmount(s.availableBalance, 2) : '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 font-sans text-center">
                                {s?.status === 'completed' ? (
                                  <span className="text-[10px] text-emerald-400 font-bold">ناجحة</span>
                                ) : s?.status === 'failed' ? (
                                  <span className="text-[10px] text-rose-400 font-bold">فاشلة</span>
                                ) : '—'}
                              </td>

                              {/* Internal DB Data (Green Columns) */}
                              <td className="p-2.5 border-l border-slate-800 font-bold text-slate-200">
                                {d?.phone || '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 text-slate-300">
                                {d?.date || '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 text-slate-400">
                                {d?.time || '—'}
                              </td>
                              <td className={`p-2.5 border-l border-slate-800 font-bold ${row.differences?.some(d => d.field === 'prevBalance') ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300'}`}>
                                {d ? formatAmount(d.prevBalance, 2) : '—'}
                              </td>
                              <td className={`p-2.5 border-l border-slate-800 font-black text-emerald-300 ${row.differences?.some(d => d.field === 'amount') ? 'text-amber-400 bg-amber-500/10' : ''}`}>
                                {d ? formatAmount(d.amount, 2) : '—'}
                              </td>
                              <td className="p-2.5 border-l border-slate-800 text-slate-400">
                                {d ? formatAmount(d.fee, 2) : '—'}
                              </td>
                              <td className={`p-2.5 font-black text-emerald-400 ${row.differences?.some(d => d.field === 'availableBalance') ? 'text-amber-400 bg-amber-500/10' : ''}`}>
                                {d ? formatAmount(d.availableBalance, 2) : '—'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer info */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    إجمالي صفوف المقارنة المعروضة: <strong className="text-white font-mono">{filteredRows.length}</strong> من أصل <strong className="text-white font-mono">{reconciliationRows.length}</strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>متطابقة</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>اختلاف بقيمة</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>غير مقيدة بالبرنامج</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

            </div>
          )}

        </div>
      )}

      {/* =========================================================================
       * TAB 2: Reconciliation History (سجل المقارنات المحفوظة)
       * ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* History Search & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="بحث في سجل المقارنات باسم المقارنة أو المصدر..."
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadHistory}
                className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 transition"
                title="تحديث السجل"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Cards Grid */}
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-xs">جاري تحميل سجل المقارنات السابقة...</span>
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <History className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-white text-base">لا توجد مقارنات محفوظة حتى الآن</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                عند إتمام أي مقارنة جديدة والضغط على "حفظ المقارنة"، ستظهر هنا للرجوع إليها وتصديرها في أي وقت
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إجراء مقارنة جديدة الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyRecords
                .filter((rec) => {
                  if (!historySearch.trim()) return true;
                  const q = historySearch.trim().toLowerCase();
                  return (
                    (rec.name && rec.name.toLowerCase().includes(q)) ||
                    (rec.sourceName && rec.sourceName.toLowerCase().includes(q)) ||
                    (rec.sourceNumber && rec.sourceNumber.includes(q))
                  );
                })
                .map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="space-y-0.5">
                          <h3 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition">
                            {rec.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            المصدر: <strong className="text-slate-200">{rec.sourceName}</strong> {rec.sourceNumber && `(${rec.sourceNumber})`}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-black">
                          {rec.summary?.matchRate || 0}% مطابقة
                        </span>
                      </div>

                      {/* Period & Date */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rec.startDate === rec.endDate ? rec.startDate : `${rec.startDate} → ${rec.endDate}`}</span>
                        </span>
                        <span>·</span>
                        <span className="truncate">بواسطة: {rec.createdByName || 'المسؤول'}</span>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center text-xs">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">المستخرج:</span>
                          <span className="font-mono font-bold text-white">{rec.summary?.totalExtracted || 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-emerald-400 block">المتطابق:</span>
                          <span className="font-mono font-bold text-emerald-400">{rec.summary?.matchedCount || 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-rose-400 block">غير مسجل:</span>
                          <span className="font-mono font-bold text-rose-400">{rec.summary?.notInDbCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenSavedRecord(rec.id)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>فتح المقارنة</span>
                      </button>

                      {deleteConfirmId === rec.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="px-2.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                          >
                            تأكيد
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs transition cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(rec.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
                          title="حذف المقارنة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
       * Modal: High-Res Image Zoom Viewer
       * ========================================================================= */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 border border-slate-800 overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 px-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>معاينة كشف الحساب الأصلي</span>
              </span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] rounded-2xl flex items-center justify-center bg-slate-950">
              <img src={zoomedImage} alt="كشف" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
