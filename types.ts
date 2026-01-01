export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  is_subscription: boolean;
  batchId?: string; // To track which upload this came from
}

export interface FinancialAudit {
  transactions: Transaction[];
  tips: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STATEMENTS = 'STATEMENTS',
  TRANSACTIONS = 'TRANSACTIONS',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS'
}

export type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';
export type SortType = 'DATE' | 'AMOUNT_DESC' | 'AMOUNT_ASC';
export type Currency = 'EUR' | 'USD' | 'GBP';