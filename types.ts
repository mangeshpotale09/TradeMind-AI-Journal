
export enum TradeType {
  STOCK = 'STOCK',
  OPTION = 'OPTION'
}

export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT'
}

export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING = 'PENDING', // Registered but no payment proof
  WAITING_APPROVAL = 'WAITING_APPROVAL', // Payment proof submitted
  APPROVED = 'APPROVED', // Full access
  REJECTED = 'REJECTED' // Payment proof invalid
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Simple local password for demo
  isPaid: boolean;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  paymentScreenshot?: string;
}

export interface OptionDetails {
  strike: number;
  expiration: string;
  option_type: OptionType;
  delta?: number;
  iv?: number;
  dte?: number;
}

export interface AIReview {
  score: number;
  well: string;
  wrong: string;
  violations: boolean;
  improvement: string;
  timestamp: number;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: TradeType;
  side: TradeSide;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  fees: number;
  status: TradeStatus;
  tags: string[];
  notes: string;
  optionDetails?: OptionDetails;
  aiReview?: AIReview;
  screenshot?: string;
  emotions: string[];
  mistakes: string[];
  strategies: string[];
}
