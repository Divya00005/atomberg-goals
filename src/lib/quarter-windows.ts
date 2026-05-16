import type { Quarter } from '@/types/supabase';

/**
 * Quarterly Check-in Schedule (from BRD Section 2.3):
 * - Goal Setting:  May (Phase 1)
 * - Q1 Check-in:   July
 * - Q2 Check-in:   October
 * - Q3 Check-in:   January
 * - Q4 / Annual:   March-April
 */

const QUARTER_WINDOWS: Record<Quarter, number[]> = {
  Q1: [7],         // July
  Q2: [10],        // October
  Q3: [1],         // January
  Q4: [3, 4],      // March, April
};

const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: 'July',
  Q2: 'October',
  Q3: 'January',
  Q4: 'March / April',
};

/**
 * Returns which quarter is currently open for check-ins based on
 * the real current month (or overridden month for demo purposes).
 * Returns null if no window is currently open.
 */
export function getOpenQuarter(overrideMonth?: number): Quarter | null {
  const month = overrideMonth ?? (new Date().getMonth() + 1); // 1-indexed

  for (const [quarter, months] of Object.entries(QUARTER_WINDOWS)) {
    if (months.includes(month)) {
      return quarter as Quarter;
    }
  }
  return null;
}

/**
 * Check if a specific quarter's check-in window is open.
 */
export function isQuarterOpen(quarter: Quarter, overrideMonth?: number): boolean {
  const month = overrideMonth ?? (new Date().getMonth() + 1);
  return QUARTER_WINDOWS[quarter].includes(month);
}

/**
 * Get the month label when a quarter window opens.
 */
export function getQuarterWindowLabel(quarter: Quarter): string {
  return QUARTER_LABELS[quarter];
}

/**
 * Get all quarters with their open/closed status.
 */
export function getAllQuarterStatuses(overrideMonth?: number) {
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  return quarters.map(q => ({
    quarter: q,
    isOpen: isQuarterOpen(q, overrideMonth),
    windowLabel: getQuarterWindowLabel(q),
  }));
}
