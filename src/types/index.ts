export type UserRole = 'admin' | 'operations' | 'accountant' | 'agent' | 'viewer';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
}

export type ProviderType = 
  | 'vodafone' 
  | 'vodafone_vip'
  | 'orange' 
  | 'etisalat' 
  | 'we' 
  | 'banque_misr' 
  | 'instapay' 
  | 'cib' 
  | 'nbe' 
  | 'fawry'
  | 'banque_du_caire'
  | 'alexbank'
  | 'qnb'
  | 'other';

export interface CashLine {
  id: string;
  name: string;
  provider: ProviderType;
  phoneNumber: string;
  accountHolder: string;
  balance: number;
  dailyLimit: number;
  monthlyLimit: number;
  warningThresholdPercent: number;
  status: 'active' | 'paused' | 'suspended';
  iconColor: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Vodafone VIP Specific Fields
  isVip?: boolean;
  syncStatus?: 'unlinked' | 'awaiting_login' | 'connecting' | 'synced' | 'failed' | 'expired';
  lastSyncAt?: string;
  syncError?: string;
  portalUrl?: string;
  externalAccountId?: string;
  syncedLiquidity?: number | null;
  syncedDailyLimit?: number | null;
  syncedDailyUsed?: number | null;
  syncedMonthlyLimit?: number | null;
  syncedMonthlyUsed?: number | null;
  isSynced?: boolean;
  // Computed usage properties (Independent 60k/200k quotas for Send and Receive)
  todayUsed?: number;
  todayCount?: number;
  remainingDaily?: number;
  dailyUtilizationPercent?: number;
  monthUsed?: number;
  monthCount?: number;
  remainingMonthly?: number;
  monthlyUtilizationPercent?: number;

  // Separate Outgoing (Transfer) quota: 60k daily, 200k monthly
  todayTransferUsed?: number;
  remainingDailyTransfer?: number;
  dailyTransferPercent?: number;
  monthTransferUsed?: number;
  remainingMonthlyTransfer?: number;
  monthlyTransferPercent?: number;

  // Separate Incoming (Receive) quota: 60k daily, 200k monthly
  todayReceiveUsed?: number;
  remainingDailyReceive?: number;
  dailyReceivePercent?: number;
  monthReceiveUsed?: number;
  remainingMonthlyReceive?: number;
  monthlyReceivePercent?: number;
}

export type TransferType = 'cash_wallet' | 'bank_transfer' | 'inter_line' | 'receive_money';
export type TransferStatus = 'completed' | 'pending_verification' | 'failed' | 'cancelled' | 'refunded';

export interface Transfer {
  id: string;
  referenceNumber: string;
  timestamp: string;
  transferType: TransferType;
  sourceLineId: string;
  sourceLineName: string;
  sourceNumber: string;
  recipientType: 'wallet' | 'bank_account';
  recipientNumber: string;
  recipientName: string;
  destinationBankOrWallet: string;
  amount: number;
  commission?: number;
  fee: number;
  totalAmount: number;
  balanceAfter?: number; // المبلغ المتاح بعد التحويل
  profit?: number; // صافي الربح المحسوب للعملية
  profitOverride?: number; // تعديل الربح المباشر من الأدمن
  customProfitNotes?: string; // ملاحظات تعديل الربح
  notes: string;
  operatorId: string;
  operatorName: string;
  status: TransferStatus;
  idempotencyKey?: string;
  serviceProviderRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface TelecomProviderRule {
  sameNetworkFee: number;
  crossNetworkPercent: number;
  crossNetworkMinFee: number;
  crossNetworkMaxFee: number;
  freeFirstTransferLimit: number;
  enableFreeFirstTransfer: boolean;
  minTransferAmount?: number;
  maxTransferAmount?: number;
}

export interface TelecomRulesSettings {
  vodafone: TelecomProviderRule;
  etisalat: TelecomProviderRule;
  orange: TelecomProviderRule;
  we: TelecomProviderRule;
  instapayFee: number;
  defaultReceiveFee: number;
  defaultTransferFee: number;
  autoCalculateCommission: boolean;
  receiveCommissionType?: 'percentage' | 'fixed';
  receiveCommissionRate?: number;
}

export interface ReceiptBrandingSettings {
  headerTitle: string;
  subTitle: string;
  receiptNotice: string;
  phoneContact: string;
  popupDurationSeconds: number;
  defaultReceiptFormat: 'thermal' | 'a4';
  showQrCode: boolean;
  showOperatorName: boolean;
}

export interface SystemSettings {
  companyName: string;
  currency: string;
  warningThresholdPercent: number;
  timezone: string;
  enableCommissionTracking: boolean;
  defaultDailyLimit: number;
  defaultMonthlyLimit: number;
  integrationsMockMode: boolean;
  allowOverdraft: boolean;
  telecomRules?: TelecomRulesSettings;
  receiptSettings?: ReceiptBrandingSettings;
  requireAdminPinForOverride?: boolean;
  enforceLineInventoryOnHandover?: boolean;
  minVaultLiquidityAlertPercent?: number;
}

export interface DashboardStats {
  period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom' | string;
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  periodTransfersCount?: number;
  periodTransfersValue?: number;
  periodIncomingValue?: number;
  periodIncomingCount?: number;
  periodOutgoingValue?: number;
  periodOutgoingCount?: number;
  periodTransfersList?: Transfer[];
  todayTransfersCount: number;
  todayTransfersValue: number;
  monthTransfersCount: number;
  monthTransfersValue: number;
  successfulOperationsCount: number;
  failedOrCancelledCount: number;
  successRatePercent: string;
  totalCommissionsAndProfits: number;
  totalLiquidity: number;
  dailyLimitPercent: number;
  remainingDailyPercent: number;
  monthlyLimitPercent: number;
  remainingMonthlyPercent: number;
  linesClosestToLimits: {
    id: string;
    name: string;
    provider: ProviderType;
    phoneNumber: string;
    dailyUtilizationPercent: number;
    monthlyUtilizationPercent: number;
    maxUtilization: number;
    remainingDaily: number;
    remainingMonthly: number;
  }[];
  last7Days: {
    date: string;
    label: string;
    dayName?: string;
    count: number;
    value: number;
    incomingValue: number;
    incomingCount: number;
    outgoingValue: number;
    outgoingCount: number;
    totalValue: number;
    netFlow: number;
  }[];
  recentTransfers: Transfer[];
}

export interface OperationSession {
  id: string;
  sessionNumber: number;
  sequentialOpNumber?: number;
  mode: 'transfer' | 'receive';
  sourceLineId?: string;
  sourceLineName?: string;
  transferType?: TransferType;
  recipientType?: 'wallet' | 'bank_account';
  recipientNumber: string;
  recipientName: string;
  destinationBankOrWallet: string;
  amount: string;
  commission?: string;
  fee: string;
  overrideLimit: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// Financial Vaults & Multi-Tier Architecture
// ==========================================

export type VaultType = 'main' | 'sub' | 'customer';

export interface Vault {
  id: string;
  name: string;
  code: string;
  type: VaultType;
  balance: number;
  allocatedBalance?: number; // For main vault: total funds distributed to sub-vaults
  branch?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  status: 'active' | 'suspended';
  minBalance?: number;
  maxBalance?: number;
  totalIn: number;
  totalOut: number;
  lastTransactionAt?: string;
  lastTransactionType?: string;
  lastTransactionAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VaultTransactionType = 
  | 'deposit_main' 
  | 'transfer_main_to_sub' 
  | 'transfer_sub_to_main' 
  | 'allocate_customer_vault' 
  | 'line_deduction' 
  | 'line_refund' 
  | 'handover_settlement' 
  | 'adjustment';

export interface VaultTransaction {
  id: string;
  referenceNumber: string;
  timestamp: string;
  type: VaultTransactionType;
  sourceVaultId?: string;
  sourceVaultName?: string;
  targetVaultId?: string;
  targetVaultName?: string;
  amount: number;
  sourceBalanceBefore?: number;
  sourceBalanceAfter?: number;
  targetBalanceBefore?: number;
  targetBalanceAfter?: number;
  relatedLineId?: string;
  relatedLineName?: string;
  operatorId: string;
  operatorName: string;
  status: 'completed' | 'pending' | 'rejected';
  notes?: string;
  idempotencyKey?: string;
  createdAt: string;
}

// ==========================================
// Shift Handover & Custody (التسليم والتسلّم)
// ==========================================

export type HandoverStatus = 
  | 'draft' 
  | 'pending_receiver_approval' 
  | 'pending_manager_approval' 
  | 'completed' 
  | 'rejected' 
  | 'needs_reconciliation';

export interface LineVerificationCheck {
  lineId: string;
  lineName: string;
  provider: ProviderType;
  phoneNumber: string;
  systemBalance: number;
  verified: boolean;
  actualBalance?: number;
  notes?: string;
}

export interface ShiftHandover {
  id: string;
  handoverNumber: string;
  vaultId: string;
  vaultName: string;
  branch: string;
  deliveringUserId: string;
  deliveringUserName: string;
  receivingUserId: string;
  receivingUserName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  startBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  successfulOperationsCount: number;
  failedOperationsCount: number;
  pendingOperationsCount: number;
  expectedEndingBalance: number;
  actualEndingBalance: number;
  differenceAmount: number; // actual - expected
  differenceStatus: 'matched' | 'deficit' | 'surplus'; // مطابق | عجز | فائض
  differenceReason?: string;
  lineVerifications: LineVerificationCheck[];
  notes?: string;
  deliveringConfirmedAt?: string;
  receivingConfirmedAt?: string;
  rejectionReason?: string;
  managerApprovedAt?: string;
  managerApprovedById?: string;
  managerApprovedByName?: string;
  status: HandoverStatus;
  shiftNumber?: string;
  drawerActualBalance?: number;
  drawerExpectedBalance?: number;
  customerVaultBalance?: number;
  subVaultBalance?: number;
  denominations?: { [key: string]: number };
  printedAt?: string;
  printedBy?: string;
  printCount?: number;
  snapshotData?: {
    allLines: CashLine[];
    vaults: Vault[];
    subVault?: Vault;
    customerVault?: Vault;
    deliveringUserName?: string;
    receivingUserName?: string;
    notes?: string;
    timestamp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Transaction Reconciliation System (نظام مقارنة ومطابقة العمليات)
// ==========================================

export type ReconciliationSourceType = 
  | 'cash_line' 
  | 'bank_account' 
  | 'wallet' 
  | 'instapay'
  | 'vault';

export interface ExtractedStatementItem {
  id: string;
  sourceImageIndex?: number;
  msisdn?: string;              // رقم الخط الأساسي كما في الورقة (MSISDN e.g. 00201061650660)
  secondLegMobile?: string;      // الطرف الثاني (SecondLegMobile e.g. 00201000991894)
  phone?: string;                // رقم الهاتف المنسق محلياً (010...)
  date: string;                  // YYYY-MM-DD
  time?: string;                 // HH:mm
  rawDate?: string;              // التاريخ والوقت كما في الورقة تماماً (e.g. 10/26/2026 12:58:1300)
  type: string;                  // نوع العملية (تحويل صادر | استلام وارد | مشتريات | استعلام رصيد | رسوم)
  rawType?: string;              // نوع العملية الأصلي بالإنجليزية (Mobile Send, Mobile Receive, Mobile Purchase, etc.)
  prevBalance: number;           // الرصيد السابق (Previous Balance)
  amount: number;                // المبلغ (Amount)
  fee: number;                   // مبلغ الخصم / الرسوم (Fees)
  availableBalance: number;      // المبلغ المتاح / الرصيد بعد العملية (Available Balance)
  reference?: string;            // الرقم المرجعي (Reference e.g. 025107671380)
  holdAmount?: number;           // مبلغ الحجز (Hold Amount)
  totalBalance?: number;         // إجمالي الرصيد (Total Balance)
  status: 'completed' | 'failed'; // حالة العملية
  rawStatus?: string;            // الحالة الأصلية (Successful / Failed)
  confidenceScore?: number;      // 0-100%
  needsReview?: boolean;
  notes?: string;
  rawText?: string;
}

export interface DbStatementItem {
  id: string;
  referenceNumber: string;
  phone?: string;
  date: string;
  time?: string;
  type: string;
  prevBalance: number;
  amount: number;
  fee: number;
  availableBalance: number;
  status: string;
  operatorName?: string;
  rawTransfer?: any;
}

export type MatchStatus = 
  | 'matched'               // تطابق كامل
  | 'mismatched'            // وجود اختلاف في أحد الحقول المالية
  | 'not_in_db'             // غير مسجلة في البرنامج
  | 'not_in_statement';     // غير موجودة في الكشف الخارجي

export interface FieldDifference {
  field: 'date' | 'prevBalance' | 'amount' | 'fee' | 'availableBalance';
  label: string;
  statementValue: any;
  dbValue: any;
  diffAmount?: number;
}

export interface ReconciliationRow {
  id: string;
  status: MatchStatus;
  statementItem?: ExtractedStatementItem;
  dbItem?: DbStatementItem;
  differences?: FieldDifference[];
  needsReview?: boolean;
}

export interface ReconciliationSummary {
  totalExtracted: number;
  totalDb: number;
  matchedCount: number;
  mismatchedCount: number;
  notInDbCount: number;
  notInStatementCount: number;
  needsReviewCount: number;
  matchRate: number; // e.g. 95.5%
}

export interface ReconciliationRecord {
  id: string;
  name: string; // اسم المقارنة
  sourceType: ReconciliationSourceType;
  sourceId: string;
  sourceName: string;
  sourceNumber?: string;
  provider?: ProviderType;
  periodType: 'day' | 'range';
  startDate: string;
  endDate: string;
  images: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    previewUrl?: string;
  }[];
  extractedItems: ExtractedStatementItem[];
  dbItems: DbStatementItem[];
  rows: ReconciliationRow[];
  summary: ReconciliationSummary;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  notes?: string;
}
