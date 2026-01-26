
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

export enum PlanType {
  MONTHLY = 'MONTHLY',
  SIX_MONTHS = 'SIX_MONTHS',
  ANNUAL = 'ANNUAL'
}

export interface User {
  id: string;
  displayId: string; // Professional User ID for display (e.g., TM-12345)
  email: string;
  name: string;
  mobile?: string;
  password?: string; // Simple local password for demo
  isPaid: boolean;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  paymentScreenshot?: string;
  amountPaid?: number;
  expiryDate?: string;
  selectedPlan?: PlanType;
  referredBy?: string; // The referral code used during registration
  ownReferralCode: string; // Unique code for this user to share
  hasReferralDiscount?: boolean; // Flag to indicate 10% discount eligibility on renewal
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

export interface Attachment {
  id: string;
  name: string;
  type: string;
  data: string; // Base64
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
  attachments?: Attachment[];
  emotions: string[];
  mistakes: string[];
  strategies: string[];
}
