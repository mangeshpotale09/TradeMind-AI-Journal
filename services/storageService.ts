
import { Trade, User, UserRole, UserStatus, PlanType, Transaction, TradeType, TradeSide, TradeStatus } from "../types";

/**
 * TradeMind AI - Local Storage Service
 * High-performance browser-based persistence layer with auto-provisioning.
 */

const KEYS = {
  TRADES: 'trademind_trades',
  USERS: 'trademind_users',
  SESSION: 'trademind_session',
  TRANSACTIONS: 'trademind_transactions'
};

export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- Helper Methods ---
const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocal = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- User & Identity ---

// Added setCurrentUser to resolve import errors in AuthView
export const setCurrentUser = (user: User): void => {
  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
};

/**
 * Automatically retrieves or creates the local terminal user.
 * This removes the requirement for a login page.
 */
export const getOrCreateCurrentUser = (): User => {
  const data = localStorage.getItem(KEYS.SESSION);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      localStorage.removeItem(KEYS.SESSION);
    }
  }
  
  const newUser: User = {
    id: generateUUID(),
    displayId: `TM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    email: 'local@terminal.ai',
    name: 'Default Trader',
    isPaid: true, // Full features unlocked in local mode
    role: UserRole.USER,
    status: UserStatus.APPROVED,
    joinedAt: new Date().toISOString(),
    ownReferralCode: Math.random().toString(36).substring(7).toUpperCase()
  };
  
  localStorage.setItem(KEYS.SESSION, JSON.stringify(newUser));
  
  // Also save to global user list for consistency
  const users = getLocal<User>(KEYS.USERS);
  if (!users.find(u => u.id === newUser.id)) {
    users.push(newUser);
    saveLocal(KEYS.USERS, users);
  }
  
  return newUser;
};

// Kept for backward compatibility with components but simplified
export const getCurrentUser = (): User | null => getOrCreateCurrentUser();

// Added registerUser to resolve import errors in AuthView
export const registerUser = async (data: { email: string; name: string; password?: string; mobile?: string }): Promise<User> => {
  const users = getLocal<User>(KEYS.USERS);
  const existing = users.find(u => u.email === data.email);
  if (existing) {
    throw new Error("Identity already registered in this terminal.");
  }
  
  const newUser: User = {
    id: generateUUID(),
    displayId: `TM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    email: data.email,
    name: data.name,
    password: data.password,
    mobile: data.mobile,
    isPaid: false,
    role: UserRole.USER,
    status: UserStatus.PENDING,
    joinedAt: new Date().toISOString(),
    ownReferralCode: Math.random().toString(36).substring(7).toUpperCase()
  };
  
  users.push(newUser);
  saveLocal(KEYS.USERS, users);
  return newUser;
};

// Added validateLogin to resolve import errors in AuthView
export const validateLogin = async (email: string, password?: string): Promise<User | null> => {
  const users = getLocal<User>(KEYS.USERS);
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

// Added resetUserPassword to resolve import errors in AuthView
export const resetUserPassword = async (email: string, mobile: string, newPassword?: string): Promise<boolean> => {
  const users = getLocal<User>(KEYS.USERS);
  const index = users.findIndex(u => u.email === email && u.mobile === mobile);
  if (index !== -1) {
    users[index].password = newPassword;
    saveLocal(KEYS.USERS, users);
    return true;
  }
  return false;
};

// --- Trades ---
export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === TradeStatus.OPEN || trade.exitPrice === undefined) return 0;
  return (trade.exitPrice - trade.entryPrice) * trade.quantity * (trade.side === TradeSide.LONG ? 1 : -1);
};

export const calculatePnL = (trade: Trade): number => calculateGrossPnL(trade) - trade.fees;

export const getStoredTrades = async (userId?: string): Promise<Trade[]> => {
  const trades = getLocal<Trade>(KEYS.TRADES);
  if (userId) return trades.filter(t => t.userId === userId);
  return trades;
};

export const saveTrade = async (trade: Trade): Promise<void> => {
  const trades = getLocal<Trade>(KEYS.TRADES);
  const index = trades.findIndex(t => t.id === trade.id);
  
  if (index !== -1) {
    trades[index] = trade;
  } else {
    trades.push(trade);
  }
  
  saveLocal(KEYS.TRADES, trades);
};

export const saveTrades = async (tradesToSave: Trade[]): Promise<void> => {
  const existing = getLocal<Trade>(KEYS.TRADES);
  const merged = [...existing];
  
  tradesToSave.forEach(trade => {
    const idx = merged.findIndex(t => t.id === trade.id);
    if (idx !== -1) merged[idx] = trade;
    else merged.push(trade);
  });
  
  saveLocal(KEYS.TRADES, merged);
};

export const deleteTradeFromDB = async (id: string): Promise<void> => {
  const trades = getLocal<Trade>(KEYS.TRADES);
  saveLocal(KEYS.TRADES, trades.filter(t => t.id !== id));
};

// --- Admin & Transactions ---
export const getRegisteredUsers = async (): Promise<User[]> => {
  return getLocal<User>(KEYS.USERS);
};

export const saveUsers = async (usersToSave: User[]): Promise<void> => {
  saveLocal(KEYS.USERS, usersToSave);
};

export const logTransaction = async (tx: Transaction): Promise<void> => {
  const txs = getLocal<Transaction>(KEYS.TRANSACTIONS);
  txs.push(tx);
  saveLocal(KEYS.TRANSACTIONS, txs);
};

export const getTransactions = async (): Promise<Transaction[]> => {
  return getLocal<Transaction>(KEYS.TRANSACTIONS);
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  const users = getLocal<User>(KEYS.USERS);
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].status = status;
    users[index].isPaid = status === UserStatus.APPROVED;
    saveLocal(KEYS.USERS, users);
    
    // Update session if it's the current user
    const current = getOrCreateCurrentUser();
    if (current.id === userId) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(users[index]));
    }
  }
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
