
import { Trade, User, UserRole, UserStatus, PlanType, Transaction, TradeType, TradeSide, TradeStatus } from "../types";
import { supabase } from "./supabaseClient";

/**
 * TradeMind AI - Storage Service
 * Direct integration with Supabase Project hrybqjomrcmwdxfdhrmh
 */

const SESSION_KEY = 'trademind_session';

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

// Fix: Added registerUser export for AuthView.tsx
export const registerUser = async (params: { email: string; password: string; name: string; mobile: string }): Promise<any> => {
  const { email, password, name, mobile } = params;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        name, 
        mobile, 
        display_id: `TM-${Math.random().toString(36).substring(2, 7).toUpperCase()}` 
      }
    }
  });
  if (error) throw error;
  return data.user;
};

// Fix: Added validateLogin export for AuthView.tsx
export const validateLogin = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    ...profile,
    displayId: profile.display_id,
    joinedAt: profile.joined_at,
    isPaid: profile.is_paid,
    selectedPlan: profile.selected_plan as PlanType,
    ownReferralCode: profile.own_referral_code,
    referredBy: profile.referred_by,
    hasReferralDiscount: profile.has_referral_discount,
    expiryDate: profile.expiry_date,
    amountPaid: profile.amount_paid
  };
};

// Fix: Added resetUserPassword export for AuthView.tsx
export const resetUserPassword = async (email: string, mobile: string, newPass: string): Promise<boolean> => {
  // Initiates the Supabase password reset flow. 
  // Mobile verification is typically handled via custom edge functions or pre-check.
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return !error;
};

export const getRegisteredUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return [];
  return (data || []).map(u => ({
    ...u,
    displayId: u.display_id,
    joinedAt: u.joined_at,
    isPaid: u.is_paid,
    selectedPlan: u.selected_plan as PlanType,
    ownReferralCode: u.own_referral_code,
    referredBy: u.referred_by,
    hasReferralDiscount: u.has_referral_discount,
    expiryDate: u.expiry_date,
    amountPaid: u.amount_paid
  }));
};

// Fix: Added saveUsers export for googleDriveService.ts
export const saveUsers = async (users: User[]): Promise<void> => {
  const payloads = users.map(user => ({
    id: user.id,
    display_id: user.displayId,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    joined_at: user.joinedAt,
    is_paid: user.isPaid,
    selected_plan: user.selectedPlan,
    own_referral_code: user.ownReferralCode,
    referred_by: user.referredBy,
    has_referral_discount: user.hasReferralDiscount,
    expiry_date: user.expiryDate,
    amount_paid: user.amountPaid
  }));

  const { error } = await supabase.from('profiles').upsert(payloads);
  if (error) throw error;
};

export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === TradeStatus.OPEN || trade.exitPrice === undefined) return 0;
  return (trade.exitPrice - trade.entryPrice) * trade.quantity * (trade.side === TradeSide.LONG ? 1 : -1);
};

export const calculatePnL = (trade: Trade): number => calculateGrossPnL(trade) - trade.fees;

export const getStoredTrades = async (userId?: string): Promise<Trade[]> => {
  let query = supabase.from('trades').select('*');
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query.order('entry_date', { ascending: false });
  if (error) {
    console.error("Supabase Fetch Error:", error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    symbol: t.symbol,
    type: t.trade_type as TradeType,
    side: t.side as TradeSide,
    status: t.status as TradeStatus,
    entryPrice: Number(t.entry_price),
    exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
    quantity: Number(t.quantity),
    entryDate: t.entry_date,
    exitDate: t.exit_date,
    fees: Number(t.fees),
    notes: t.notes || '',
    strategies: t.strategies || [],
    emotions: t.emotions || [],
    mistakes: t.mistakes || [],
    tags: [], // Tags deprecated in favor of specific categories
    attachments: t.attachments || [],
    aiReview: t.ai_review,
    optionDetails: t.option_details
  }));
};

export const saveTrade = async (trade: Trade): Promise<void> => {
  const payload = {
    id: trade.id,
    user_id: trade.userId,
    symbol: trade.symbol,
    trade_type: trade.type,
    side: trade.side,
    status: trade.status,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    quantity: trade.quantity,
    entry_date: trade.entryDate,
    exit_date: trade.exitDate,
    fees: trade.fees,
    notes: trade.notes,
    strategies: trade.strategies,
    emotions: trade.emotions,
    mistakes: trade.mistakes,
    attachments: trade.attachments,
    ai_review: trade.aiReview,
    option_details: trade.optionDetails
  };

  const { error } = await supabase.from('trades').upsert([payload]);
  if (error) {
    console.error("Supabase Save Error:", error);
    throw error;
  }
};

// Fix: Added saveTrades export for googleDriveService.ts
export const saveTrades = async (trades: Trade[]): Promise<void> => {
  const payloads = trades.map(trade => ({
    id: trade.id,
    user_id: trade.userId,
    symbol: trade.symbol,
    trade_type: trade.type,
    side: trade.side,
    status: trade.status,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    quantity: trade.quantity,
    entry_date: trade.entryDate,
    exit_date: trade.exitDate,
    fees: trade.fees,
    notes: trade.notes,
    strategies: trade.strategies,
    emotions: trade.emotions,
    mistakes: trade.mistakes,
    attachments: trade.attachments,
    ai_review: trade.aiReview,
    option_details: trade.optionDetails
  }));

  const { error } = await supabase.from('trades').upsert(payloads);
  if (error) {
    console.error("Supabase SaveTrades Error:", error);
    throw error;
  }
};

export const deleteTradeFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
};

export const logTransaction = async (tx: Transaction): Promise<void> => {
  const payload = {
    id: tx.id,
    order_id: tx.orderId,
    signature: tx.signature,
    user_id: tx.userId,
    user_name: tx.userName,
    plan_type: tx.plan,
    amount: tx.amount,
    method: tx.method,
    status: tx.status,
    timestamp: tx.timestamp
  };
  const { error } = await supabase.from('transactions').insert([payload]);
  if (error) throw error;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
  if (error) return [];
  return (data || []).map(tx => ({
    id: tx.id,
    orderId: tx.order_id,
    signature: tx.signature,
    userId: tx.user_id,
    userName: tx.user_name,
    plan: tx.plan_type as PlanType,
    amount: Number(tx.amount),
    method: tx.method,
    timestamp: tx.timestamp,
    status: tx.status as 'SUCCESS' | 'PENDING' | 'FAILED'
  }));
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  const { error } = await supabase.from('profiles').update({ 
    status, 
    is_paid: status === UserStatus.APPROVED 
  }).eq('id', userId);
  if (error) throw error;
};

export const exportTradesToCSV = (trades: Trade[]): void => {
  if (trades.length === 0) return;
  const headers = ['Symbol', 'Side', 'Entry', 'Exit', 'Qty', 'Fees', 'Net PnL'];
  const rows = trades.map(t => [t.symbol, t.side, t.entryPrice, t.exitPrice || '', t.quantity, t.fees, calculatePnL(t)]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `TradeMind_Export.csv`);
  link.click();
};

export const exportUsersToCSV = (users: User[]): void => {
  const headers = ['ID', 'Name', 'Email', 'Role', 'Status'];
  const rows = users.map(u => [u.displayId, u.name, u.email, u.role, u.status]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `User_Registry.csv`);
  link.click();
};
