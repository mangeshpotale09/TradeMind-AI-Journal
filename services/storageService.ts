
import { Trade, User, UserRole, UserStatus, PlanType, Transaction, TradeType, TradeSide, TradeStatus } from "../types";
import { supabase } from "./supabaseClient";

/**
 * TradeMind AI - Storage Service
 * Professional-grade data synchronization for institutional-level journaling.
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

/**
 * Ensures a profile exists in the DB. If missing, it force-creates it.
 */
export const ensureProfileExists = async (userId: string, email: string, name?: string): Promise<void> => {
  if (!userId) throw new Error("User ID is required for profile verification.");

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error("Profile check error:", fetchError);
    throw new Error(`Profile access denied: ${fetchError.message}`);
  }

  if (!existing) {
    const displayId = `TM-${userId.substring(0, 8).toUpperCase()}`;
    const payload = {
      id: userId,
      email: email,
      name: name || 'Trader',
      display_id: displayId,
      status: 'APPROVED',
      is_paid: true,
      role: 'USER'
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert([payload]);
      
    if (insertError && !insertError.message.includes("duplicate key")) {
         console.error("Critical Profile Creation Failure:", insertError.message);
         throw new Error(`Profile initialization failed: ${insertError.message}`);
    }
  }
};

export const fetchAndSyncProfile = async (supabaseUser: any): Promise<User | null> => {
  if (!supabaseUser) return null;

  try {
    await ensureProfileExists(supabaseUser.id, supabaseUser.email!, supabaseUser.user_metadata?.name);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (error || !profile) {
      throw new Error(error?.message || "Profile record not found.");
    }

    return {
      ...profile,
      displayId: profile.display_id,
      joinedAt: profile.joined_at,
      isPaid: profile.is_paid,
      selectedPlan: profile.selected_plan as PlanType,
      status: profile.status as UserStatus,
      role: profile.role as UserRole,
      ownReferralCode: profile.own_referral_code || ''
    };
  } catch (err: any) {
    console.error("Sync Profile Error:", err);
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name: supabaseUser.user_metadata?.name || 'Trader',
      displayId: `TM-${supabaseUser.id.substring(0, 8).toUpperCase()}`,
      status: UserStatus.APPROVED, 
      isPaid: true,
      role: UserRole.USER,
      joinedAt: new Date().toISOString(),
      ownReferralCode: ''
    };
  }
};

export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === TradeStatus.OPEN || trade.exitPrice === undefined) return 0;
  return (Number(trade.exitPrice) - Number(trade.entryPrice)) * Number(trade.quantity) * (trade.side === TradeSide.LONG ? 1 : -1);
};

export const calculatePnL = (trade: Trade): number => calculateGrossPnL(trade) - Number(trade.fees);

export const getStoredTrades = async (userId?: string): Promise<Trade[]> => {
  let query = supabase.from('trades').select('*');
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query.order('entry_date', { ascending: false });
  if (error) {
    console.error("Fetch Trades Error:", error);
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
    attachments: t.attachments || [],
    aiReview: t.ai_review,
    optionDetails: t.option_details,
    tags: t.tags || []
  }));
};

export const saveTrade = async (trade: Trade): Promise<void> => {
  const user = getCurrentUser();
  if (!user) throw new Error("No active session detected.");

  await ensureProfileExists(user.id, user.email, user.name);

  // Payload specifically mapped to match schema.sql exactly
  const payload = {
    id: trade.id,
    user_id: trade.userId,
    symbol: trade.symbol,
    trade_type: trade.type,
    side: trade.side,
    status: trade.status,
    entry_price: Number(trade.entryPrice),
    exit_price: trade.exitPrice !== undefined ? Number(trade.exitPrice) : null,
    quantity: Number(trade.quantity),
    entry_date: trade.entryDate,
    exit_date: trade.exitDate || null,
    fees: Number(trade.fees || 0),
    notes: trade.notes || '',
    tags: trade.tags || [],
    strategies: trade.strategies || [],
    emotions: trade.emotions || [],
    mistakes: trade.mistakes || [],
    attachments: trade.attachments || [],
    ai_review: trade.aiReview || null,
    option_details: trade.optionDetails || null
  };

  const { error } = await supabase.from('trades').upsert([payload]);
  
  if (error) {
    console.error("Trade Save Failure:", error.message, error.details);
    throw new Error(`Cloud Sync Failed: ${error.message}`);
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

// Fix: Implementation of saveUsers for bulk profile synchronization with Supabase
export const saveUsers = async (users: User[]): Promise<void> => {
  const payloads = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    display_id: user.displayId,
    status: user.status,
    is_paid: user.isPaid,
    role: user.role,
    joined_at: user.joinedAt,
    own_referral_code: user.ownReferralCode,
    selected_plan: user.selectedPlan
  }));

  const { error } = await supabase.from('profiles').upsert(payloads);
  if (error) {
    console.error("User Sync Failure:", error.message);
    throw new Error(`Cloud User Sync Failed: ${error.message}`);
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
