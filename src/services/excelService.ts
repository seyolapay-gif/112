import * as XLSX from 'xlsx';
import { ReconciliationRecord, ReconciliationRow } from '../types';

/**
 * Professional Excel Exporter for Financial Reconciliation
 * Creates a formatted .xlsx workbook with two distinct sheets:
 * 1. "ملخص المقارنة" (Executive Reconciliation Summary)
 * 2. "تفاصيل المقارنة" (Full Reconciliation Audit Table)
 */
export function exportReconciliationToExcel(record: ReconciliationRecord): void {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: ملخص المقارنة (Reconciliation Summary)
  // -------------------------------------------------------------
  const summaryRows = [
    ['منظومة سيولة لإدارة التحويلات المالية (Seyola System)'],
    ['تقرير تدقيق ومطابقة العمليات المالية – Transaction Reconciliation Report'],
    [],
    ['معلومات المقارنة الأساسية', ''],
    ['اسم المقارنة:', record.name],
    ['مصدر العمليات:', record.sourceName],
    ['رقم الحساب / الخط:', record.sourceNumber || 'غير محدد'],
    ['نوع المصدر المالي:', record.sourceType],
    ['فترة المقارنة:', `${record.startDate} إلى ${record.endDate}`],
    ['تاريخ ووقت إجراء المطابقة:', new Date(record.createdAt).toLocaleString('ar-EG')],
    ['المسؤول عن التدقيق:', record.createdByName || 'النظام المالي'],
    [],
    ['المؤشرات والإحصائيات المالية للمطابقة', 'القيمة الإحصائية'],
    ['إجمالي العمليات المستخرجة من الكشف الخارجي:', record.summary.totalExtracted],
    ['إجمالي العمليات المسجلة في قاعدة البيانات:', record.summary.totalDb],
    ['عدد العمليات المتطابقة تماماً (✓):', record.summary.matchedCount],
    ['عدد العمليات التي تحتوي على اختلافات (✗):', record.summary.mismatchedCount],
    ['عدد العمليات غير المسجلة في البرنامج (!):', record.summary.notInDbCount],
    ['عدد العمليات غير الموجودة في الكشف الخارجي:', record.summary.notInStatementCount],
    ['عدد العمليات التي تحتاج إلى مراجعة وتدقيق:', record.summary.needsReviewCount],
    ['نسبة المطابقة الإجمالية (%):', `${record.summary.matchRate}%`],
    [],
    ['ملاحظات التدقيق:', record.notes || 'لا توجد ملاحظات مسجلة']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

  // Set column widths for summary sheet
  wsSummary['!cols'] = [
    { wch: 42 },
    { wch: 32 }
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص المقارنة');

  // -------------------------------------------------------------
  // Sheet 2: تفاصيل المقارنة (Detailed Table)
  // -------------------------------------------------------------
  const detailsHeaders = [
    'م',
    'حالة المطابقة',
    // المجموعة الأولى: بيانات كشف العمليات (المصدر الخارجي)
    '[كشف خارجي] رقم الهاتف',
    '[كشف خارجي] التاريخ',
    '[كشف خارجي] الساعة',
    '[كشف خارجي] نوع العملية',
    '[كشف خارجي] الرصيد السابق',
    '[كشف خارجي] المبلغ',
    '[كشف خارجي] مبلغ الخصم',
    '[كشف خارجي] المبلغ المتاح',
    '[كشف خارجي] حالة العملية',
    // المجموعة الثانية: بيانات البرنامج (قاعدة البيانات الداخلية)
    '[قاعدة بيانات] رقم الهاتف',
    '[قاعدة بيانات] التاريخ',
    '[قاعدة بيانات] الساعة',
    '[قاعدة بيانات] الرصيد السابق',
    '[قاعدة بيانات] المبلغ',
    '[قاعدة بيانات] مبلغ الخصم',
    '[قاعدة بيانات] المبلغ المتاح',
    // الفروقات والملاحظات
    'تفاصيل الفروقات المالية المكتشفة',
    'ملاحظات التدقيق'
  ];

  const detailsRows: any[][] = [
    ['بيانات كشف العمليات – المصدر الخارجي (أزرق)', '', '', '', '', '', '', '', '', '', '', 'بيانات البرنامج – قاعدة البيانات الداخلية (أخضر)', '', '', '', '', '', '', 'نتائج الفحص والتدقيق'],
    detailsHeaders
  ];

  record.rows.forEach((row: ReconciliationRow, index: number) => {
    const s = row.statementItem;
    const d = row.dbItem;

    let statusLabel = 'مطابقة';
    if (row.status === 'matched') statusLabel = 'مطابقة تماماً ✓';
    else if (row.status === 'mismatched') statusLabel = 'غير متطابقة ✗';
    else if (row.status === 'not_in_db') statusLabel = 'غير مسجلة في البرنامج !';
    else if (row.status === 'not_in_statement') statusLabel = 'غير موجودة في الكشف الخارجي';

    // Format differences text
    let diffsText = '';
    if (row.differences && row.differences.length > 0) {
      diffsText = row.differences.map(df => 
        `${df.label}: كشف (${df.statementValue}) مقابل قاعدة البيانات (${df.dbValue})`
      ).join(' | ');
    } else if (row.status === 'not_in_db') {
      diffsText = 'حركة مسجلة في الكشف ولم يتم العثور عليها في قاعدة بيانات البرنامج';
    } else if (row.status === 'not_in_statement') {
      diffsText = 'حركة مقيدة بالنظام ولم تظهر في كشف الحساب الخارجي';
    }

    detailsRows.push([
      index + 1,
      statusLabel,
      // External statement fields
      s?.phone || '',
      s?.date || '',
      s?.time || '',
      s?.type || '',
      s ? s.prevBalance : '',
      s ? s.amount : '',
      s ? s.fee : '',
      s ? s.availableBalance : '',
      s ? (s.status === 'completed' ? 'ناجحة' : 'فاشلة') : '',
      // Internal DB fields
      d?.phone || '',
      d?.date || '',
      d?.time || '',
      d ? d.prevBalance : '',
      d ? d.amount : '',
      d ? d.fee : '',
      d ? d.availableBalance : '',
      // Audit notes
      diffsText,
      s?.notes || d?.rawTransfer?.notes || ''
    ]);
  });

  const wsDetails = XLSX.utils.aoa_to_sheet(detailsRows);

  // Column widths for detailed sheet
  wsDetails['!cols'] = [
    { wch: 6 },   // Seq
    { wch: 22 },  // Status
    // External statement columns
    { wch: 15 },  // Phone
    { wch: 13 },  // Date
    { wch: 10 },  // Time
    { wch: 14 },  // Type
    { wch: 15 },  // Prev Balance
    { wch: 13 },  // Amount
    { wch: 12 },  // Fee
    { wch: 15 },  // Avail Balance
    { wch: 12 },  // Status
    // DB columns
    { wch: 15 },  // Phone
    { wch: 13 },  // Date
    { wch: 10 },  // Time
    { wch: 15 },  // Prev Balance
    { wch: 13 },  // Amount
    { wch: 12 },  // Fee
    { wch: 15 },  // Avail Balance
    // Notes
    { wch: 45 },  // Diffs
    { wch: 30 }   // Notes
  ];

  XLSX.utils.book_append_sheet(wb, wsDetails, 'تفاصيل المقارنة');

  // Generate safe filename and trigger download
  const cleanName = record.name.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
  const dateStr = record.startDate ? `${record.startDate}_${record.endDate}` : new Date().toISOString().slice(0, 10);
  const fileName = `مقارنة_عمليات_${cleanName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
