
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

export interface WeeklyInsight {
  summary: string;
  topMistake: string;
  disciplineScore: number;
  lessonOfTheWeek: string;
  timestamp: number;
}
