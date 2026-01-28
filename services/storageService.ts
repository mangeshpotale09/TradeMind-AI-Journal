
import { Trade, User, UserRole, UserStatus, PlanType, Transaction, TradeType, TradeSide, TradeStatus } from "../types";
import { supabase } from "./supabaseClient";

/**
 * TradeMind AI - Storage Service
 * High-performance data synchronization for professional traders.
 */

const SESSION_KEY = 'trademind_session';

export const generateUUID = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {}
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
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

export const registerUser = async (params: { email: string; password: string; name: string; mobile: string }): Promise<any> => {
  const { email, password, name, mobile } = params;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, mobile }
    }
  });
  if (error) throw error;
  return data.user;
};

export const validateLogin = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) return null;
  return await fetchAndSyncProfile(data.user);
};

export const resetUserPassword = async (email: string, mobile: string, newPassword: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
    
  if (error || !data) return false;
  return true;
};

export const fetchAndSyncProfile = async (supabaseUser: any): Promise<User | null> => {
  if (!supabaseUser) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  if (error || !profile) {
    // Automatically approve and mark as paid for open terminal access
    const fallbackUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name || 'Trader',
      displayId: `TM-${supabaseUser.id.substring(0, 5).toUpperCase()}`,
      status: UserStatus.APPROVED, 
      isPaid: true,
      role: UserRole.USER,
      joinedAt: new Date().toISOString(),
      ownReferralCode: ''
    };

    const dbPayload = {
      id: fallbackUser.id,
      email: fallbackUser.email,
      name: fallbackUser.name,
      display_id: fallbackUser.displayId,
      status: fallbackUser.status,
      is_paid: fallbackUser.isPaid
    };

    try {
      const { data: inserted } = await supabase.from('profiles').upsert([dbPayload]).select().single();
      if (inserted) {
        return {
          ...fallbackUser,
          id: inserted.id,
          displayId: inserted.display_id,
          joinedAt: inserted.joined_at,
          isPaid: true, // Force true to ignore DB delay
          status: UserStatus.APPROVED,
          role: inserted.role as UserRole
        };
      }
    } catch (err) {
      console.warn("Profile DB sync failed, using terminal fallback:", err);
    }
    
    return fallbackUser;
  }

  return {
    ...profile,
    displayId: profile.display_id,
    joinedAt: profile.joined_at,
    isPaid: true, // Always treat authenticated users as Pro
    selectedPlan: profile.selected_plan as PlanType,
    status: UserStatus.APPROVED,
    role: profile.role as UserRole,
    ownReferralCode: profile.own_referral_code || ''
  };
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
  if (error) return [];

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
    exit_price: trade.exitPrice ?? null,
    quantity: trade.quantity,
    entry_date: trade.entryDate,
    exit_date: trade.exitDate ?? null,
    fees: trade.fees,
    notes: trade.notes,
    strategies: trade.strategies,
    emotions: trade.emotions,
    mistakes: trade.mistakes,
    attachments: trade.attachments ?? [],
    ai_review: trade.aiReview ?? null,
    // Fix: Corrected property name from snake_case option_details to camelCase optionDetails to match the Trade interface
    option_details: trade.optionDetails ?? null
  };

  const { error } = await supabase.from('trades').upsert([payload]);
  if (error) {
    console.error("Supabase Save Error:", error.message, error.details);
    throw error;
  }
};

export const saveTrades = async (trades: Trade[]): Promise<void> => {
  for (const trade of trades) {
    await saveTrade(trade);
  }
};

export const deleteTradeFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
};

export const getRegisteredUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return [];
  return (data || []).map(u => ({
    ...u,
    displayId: u.display_id,
    joinedAt: u.joined_at,
    isPaid: u.is_paid,
    status: u.status as UserStatus,
    role: u.role as UserRole,
    ownReferralCode: u.own_referral_code || ''
  }));
};

export const saveUsers = async (users: User[]): Promise<void> => {
  for (const user of users) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      display_id: user.displayId,
      is_paid: user.isPaid,
      role: user.role,
      status: user.status,
      joined_at: user.joinedAt
    };
    await supabase.from('profiles').upsert([payload]);
  }
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
