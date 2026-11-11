/**
 * Financial Calculation Utilities for Cash Management System
 * Enforces tier rules for transfer fees and profit calculations.
 */

/**
 * Calculates transfer fee based on user-defined tier:
 * - If amount <= 500 EGP: fee = 5 EGP
 * - If amount > 500 and <= 1000 EGP: fee = 10 EGP
 * - If amount > 1000 EGP: 10 EGP per 1,000 EGP (rounded up, e.g. 3,610 -> 40, 6,000 -> 60, 9,000 -> 90, 10,000 -> 100)
 */
export function calculateAutoFee(amount: number | string | null | undefined): number {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num) || num <= 0) return 0;
  if (num <= 500) {
    return 5;
  }
  if (num <= 1000) {
    return 10;
  }
  return Math.ceil(num / 1000) * 10;
}

export interface ProfitCalculationInput {
  transferType: string;
  amount: number | string;
  fee?: number | string;
  commission?: number | string;
  profitOverride?: number | null;
}

/**
 * Calculates net profit for a given operation:
 * - If profitOverride is set by Admin: returns profitOverride directly.
 * - Outgoing transfer: profit = fee - commission (e.g. 100 - 15 = 85 EGP).
 * - Incoming transfer (receive_money): profit = fee (e.g. 60 EGP received commission).
 */
export function calculateOperationProfit(op: ProfitCalculationInput): number {
  if (op.profitOverride !== undefined && op.profitOverride !== null && !isNaN(Number(op.profitOverride))) {
    return Number(op.profitOverride);
  }

  const fee = Math.max(0, Number(op.fee) || 0);
  const commission = Math.max(0, Number(op.commission) || 0);

  if (op.transferType === 'receive_money') {
    return fee;
  }

  return fee - commission;
}
