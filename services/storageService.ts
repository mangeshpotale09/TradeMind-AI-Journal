import { Trade, User, UserRole, UserStatus, PlanType, Transaction, TradeType, TradeSide, TradeStatus } from "../types";
import { supabase } from "./supabaseClient";

/**
 * TradeMind AI - Storage Service
 * Persistent backend storage using Supabase.
 */

const SESSION_KEY = 'trademind_session';

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const generateReferralCode = (name: string) => {
  const prefix = (name || 'USR').substring(0, 3).toUpperCase();
  const random = Math.floor(100 + Math.random() * 899);
  return `${prefix}${random}`;
};

/**
 * Fetches all users from Supabase 'profiles' table.
 */
export const getRegisteredUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  
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

/**
 * Log out from Supabase and clear local state
 */
export const logoutUser = async () => {
  await supabase.auth.signOut();
  setCurrentUser(null);
};

/**
 * Registers a new user using Supabase Auth and creates a profile record.
 */
export const registerUser = async (user: Partial<User>): Promise<User | null> => {
  if (!user.email || !user.password || !user.name) {
    throw new Error("Missing required registration fields.");
  }

  if (!validateEmail(user.email)) {
    throw new Error(`Email address "${user.email}" is invalid.`);
  }

  if (user.password.length < 6) {
    throw new Error("Password should be at least 6 characters.");
  }

  // 1. Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        full_name: user.name,
        mobile: user.mobile
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Authentication failed to return a user.");

  const referralCode = generateReferralCode(user.name);
  
  // 2. Create entry in 'profiles' table
  const newUserProfile = {
    id: authData.user.id,
    display_id: `TM-${Math.floor(10000 + Math.random() * 89999)}`,
    email: user.email,
    name: user.name,
    mobile: user.mobile || null,
    selected_plan: user.selectedPlan || PlanType.ANNUAL,
    is_paid: false,
    role: user.email === 'potalemangesh09@gmail.com' ? UserRole.ADMIN : UserRole.USER,
    status: user.email === 'potalemangesh09@gmail.com' ? UserStatus.APPROVED : UserStatus.PENDING,
    joined_at: new Date().toISOString(),
    amount_paid: 0,
    expiry_date: 'Pending',
    referred_by: user.referredBy || null,
    own_referral_code: referralCode,
    has_referral_discount: !!user.referredBy
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .insert([newUserProfile]);

  if (profileError) {
    console.error("Profile creation error:", profileError);
    throw new Error("Account created but profile initialization failed. Please try logging in or contact support.");
  }

  return {
    ...user,
    id: authData.user.id,
    displayId: newUserProfile.display_id,
    email: newUserProfile.email,
    name: newUserProfile.name,
    isPaid: newUserProfile.is_paid,
    role: newUserProfile.role as UserRole,
    status: newUserProfile.status as UserStatus,
    joinedAt: newUserProfile.joined_at,
    ownReferralCode: newUserProfile.own_referral_code,
    selectedPlan: newUserProfile.selected_plan as PlanType,
    expiryDate: newUserProfile.expiry_date,
    amountPaid: newUserProfile.amount_paid
  } as User;
};

/**
 * Validates login via Supabase Auth and retrieves profile.
 */
export const validateLogin = async (email: string, pass: string): Promise<User | null> => {
  if (!email || !pass) {
    throw new Error("Email and password are required.");
  }

  if (!validateEmail(email)) {
    throw new Error(`Email address "${email}" is invalid.`);
  }

  if (pass.length < 6) {
    throw new Error("Password should be at least 6 characters.");
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: pass
  });

  if (authError) {
    if (authError.message.includes('Invalid login credentials')) {
      throw new Error("Invalid login credentials. Please check your email and password.");
    }
    throw authError;
  }

  if (!authData.user) throw new Error("Login failed unexpectedly.");

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    console.error("Profile retrieval error:", profileError);
    throw new Error("User profile not found. Please contact support to sync your profile data.");
  }

  // Ensure the specific admin account has Admin role even if DB state is weird
  const finalRole = profile.email === 'potalemangesh09@gmail.com' ? UserRole.ADMIN : (profile.role as UserRole);

  return {
    ...profile,
    role: finalRole,
    displayId: profile.display_id,
    joinedAt: profile.joined_at,
    isPaid: profile.is_paid,
    selectedPlan: profile.selected_plan as PlanType,
    ownReferralCode: profile.own_referral_code,
    referredBy: profile.referred_by,
    hasReferralDiscount: profile.has_referral_discount,
    expiryDate: profile.expiry_date,
    amountPaid: profile.amount_paid
  } as User;
};

export const resetUserPassword = async (email: string, mobile: string, newPassword: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('mobile', mobile)
    .single();

  if (error || !data) return false;

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  return !updateError;
};

/**
 * Fetches all transactions from Supabase.
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) return [];
  return (data || []).map(tx => ({
    ...tx,
    userName: tx.user_name,
    plan: tx.plan_type as PlanType,
    orderId: tx.order_id
  }));
};

/**
 * Logs a new transaction to Supabase.
 */
export const logTransaction = async (tx: Transaction) => {
  const { error } = await supabase
    .from('transactions')
    .insert([{
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
    }]);

  if (error) console.error("Error logging transaction:", error);
};

/**
 * Updates user status and payment details in Supabase.
 */
export const updateUserStatus = async (userId: string, status: UserStatus) => {
  const { data: userProfile, error: getError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (getError) return;

  const isApproved = status === UserStatus.APPROVED;
  const expiry = new Date();
  let amount = 0;
  
  if (isApproved) {
    switch(userProfile.selected_plan) {
      case PlanType.MONTHLY: expiry.setMonth(expiry.getMonth() + 1); amount = 299; break;
      case PlanType.SIX_MONTHS: expiry.setMonth(expiry.getMonth() + 6); amount = 599; break;
      case PlanType.ANNUAL: expiry.setFullYear(expiry.getFullYear() + 1); amount = 999; break;
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      status,
      is_paid: isApproved,
      amount_paid: isApproved ? amount : userProfile.amount_paid,
      expiry_date: isApproved ? expiry.toISOString().split('T')[0] : userProfile.expiry_date
    })
    .eq('id', userId);

  if (updateError) console.error("Error updating user status:", updateError);
};

/**
 * Saves or updates a single trade in Supabase.
 */
export const saveTrade = async (trade: Trade) => {
  const tradePayload = {
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

  const { error } = await supabase
    .from('trades')
    .upsert([tradePayload]);

  if (error) console.error("Error saving trade:", error);
};

export const saveTrades = async (trades: Trade[]) => {
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
  if (error) console.error("Error saving trades batch:", error);
};

export const saveUsers = async (users: User[]) => {
  const payloads = users.map(u => ({
    id: u.id,
    display_id: u.displayId,
    email: u.email,
    name: u.name,
    mobile: u.mobile,
    selected_plan: u.selectedPlan,
    is_paid: u.isPaid,
    role: u.role,
    status: u.status,
    joined_at: u.joinedAt,
    amount_paid: u.amountPaid,
    expiry_date: u.expiryDate,
    referred_by: u.referredBy,
    own_referral_code: u.ownReferralCode,
    has_referral_discount: u.hasReferralDiscount
  }));

  const { error } = await supabase.from('profiles').upsert(payloads);
  if (error) console.error("Error saving users batch:", error);
};

/**
 * Fetches trades from Supabase, filtered by user if needed.
 */
export const getStoredTrades = async (userId?: string): Promise<Trade[]> => {
  let query = supabase.from('trades').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('entry_date', { ascending: false });

  if (error) {
    console.error("Error fetching trades:", error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    userId: t.user_id,
    symbol: t.symbol,
    type: t.trade_type as TradeType,
    side: t.side as TradeSide,
    status: t.status as TradeStatus,
    entryPrice: t.entry_price,
    exitPrice: t.exit_price,
    quantity: t.quantity,
    entryDate: t.entry_date,
    exitDate: t.exit_date,
    fees: t.fees,
    notes: t.notes,
    strategies: t.strategies || [],
    emotions: t.emotions || [],
    mistakes: t.mistakes || [],
    attachments: t.attachments || [],
    aiReview: t.ai_review,
    optionDetails: t.option_details
  }));
};

/**
 * Deletes a trade from Supabase.
 */
export const deleteTradeFromDB = async (id: string) => {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id);

  if (error) console.error("Error deleting trade:", error);
};

export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === 'OPEN' || trade.exitPrice === undefined) return 0;
  const entryTotal = trade.entryPrice * trade.quantity;
  const exitTotal = trade.exitPrice * trade.quantity;
  return trade.side === 'LONG' ? (exitTotal - entryTotal) : (entryTotal - exitTotal);
};

export const calculatePnL = (trade: Trade): number => {
  return calculateGrossPnL(trade) - trade.fees;
};

export const exportTradesToCSV = (trades: Trade[]) => {
  if (trades.length === 0) return;
  const headers = ["Trade ID", "Symbol", "Type", "Side", "Status", "Entry Date", "Exit Date", "Entry Price", "Exit Price", "Quantity", "Fees", "Gross P&L", "Net P&L", "Strategies", "Emotions", "Mistakes", "AI Score"];
  
  const rows = trades.map(t => [
    t.id, 
    t.symbol, 
    t.type, 
    t.side, 
    t.status, 
    t.entryDate, 
    t.exitDate || '', 
    t.entryPrice, 
    t.exitPrice || '', 
    t.quantity, 
    t.fees, 
    calculateGrossPnL(t), 
    calculatePnL(t), 
    `"${t.strategies.join('; ')}"`, 
    `"${t.emotions.join('; ')}"`, 
    `"${t.mistakes.join('; ')}"`, 
    t.aiReview?.score || 'N/A'
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `trademind_trades_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportUsersToCSV = (users: User[]) => {
  if (users.length === 0) return;
  const headers = ["ID", "Name", "Email", "Mobile", "Role", "Status", "Is Paid", "Plan", "Joined At"];
  const rows = users.map(u => [
    u.displayId,
    u.name,
    u.email,
    u.mobile || '',
    u.role,
    u.status,
    u.isPaid ? 'YES' : 'NO',
    u.selectedPlan || '',
    u.joinedAt
  ]);
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `trademind_users_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};