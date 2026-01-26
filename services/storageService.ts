
import { Trade, User, UserRole, UserStatus } from "../types";

const TRADES_KEY = 'trademind_trades';
const USERS_KEY = 'trademind_users';
const SESSION_KEY = 'trademind_session';

// --- User Management ---
export const getRegisteredUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    // Initial Admin Account as requested
    const initialAdmin: User = {
      id: 'admin-1',
      email: 'potalemangesh09@gmail.com',
      name: 'Mangesh Potale',
      password: 'Mangesh@123',
      isPaid: true,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      joinedAt: new Date().toISOString()
    };
    saveUsers([initialAdmin]);
    return [initialAdmin];
  }
  return JSON.parse(data);
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const registerUser = (user: Partial<User>): User => {
  const users = getRegisteredUsers();
  const newUser: User = {
    id: crypto.randomUUID(),
    email: user.email!,
    name: user.name!,
    password: user.password!,
    isPaid: false,
    role: UserRole.USER,
    status: UserStatus.PENDING,
    joinedAt: new Date().toISOString()
  };
  saveUsers([...users, newUser]);
  return newUser;
};

export const submitPaymentProof = (userId: string, screenshot: string) => {
  const users = getRegisteredUsers();
  const updated = users.map(u => u.id === userId ? { 
    ...u, 
    status: UserStatus.WAITING_APPROVAL,
    paymentScreenshot: screenshot 
  } : u);
  saveUsers(updated);
  
  // Update session if it's the current user
  const sessionUser = getCurrentUser();
  if (sessionUser && sessionUser.id === userId) {
    setCurrentUser({ ...sessionUser, status: UserStatus.WAITING_APPROVAL, paymentScreenshot: screenshot });
  }
};

export const updateUserStatus = (userId: string, status: UserStatus) => {
  const users = getRegisteredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      return { 
        ...u, 
        status, 
        isPaid: status === UserStatus.APPROVED 
      };
    }
    return u;
  });
  saveUsers(updated);
};

// --- Trade Management ---
export const saveTrades = (trades: Trade[]) => {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
};

export const getStoredTrades = (userId?: string): Trade[] => {
  const data = localStorage.getItem(TRADES_KEY);
  if (!data) return [];
  try {
    const allTrades: Trade[] = JSON.parse(data);
    if (userId) return allTrades.filter(t => t.userId === userId);
    return allTrades;
  } catch {
    return [];
  }
};

// --- Calculations ---
export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === 'OPEN' || trade.exitPrice === undefined) return 0;
  const multiplier = trade.type === 'OPTION' ? 100 : 1;
  const entryTotal = trade.entryPrice * trade.quantity * multiplier;
  const exitTotal = trade.exitPrice * trade.quantity * multiplier;
  return trade.side === 'LONG' ? (exitTotal - entryTotal) : (entryTotal - exitTotal);
};

export const calculatePnL = (trade: Trade): number => {
  return calculateGrossPnL(trade) - trade.fees;
};

export const exportTradesToCSV = (trades: Trade[]) => {
  if (trades.length === 0) return;
  const headers = ["ID", "Symbol", "Type", "Side", "Status", "Entry Date", "Exit Date", "Entry Price", "Exit Price", "Quantity", "Fees", "Gross P&L", "Net P&L", "Strategies", "Emotions", "Mistakes", "AI Score"];
  const rows = trades.map(t => [
    t.id, t.symbol, t.type, t.side, t.status, t.entryDate, t.exitDate || "N/A", t.entryPrice, t.exitPrice || 0, t.quantity, t.fees, calculateGrossPnL(t).toFixed(2), calculatePnL(t).toFixed(2), `"${t.strategies.join(', ')}"`, `"${t.emotions.join(', ')}"`, `"${t.mistakes.join(', ')}"`, t.aiReview?.score || "N/A"
  ]);
  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `trade-export.csv`);
  link.click();
};
