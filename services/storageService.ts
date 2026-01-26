
import { Trade, User, UserRole, UserStatus, PlanType } from "../types";

const TRADES_KEY = 'trademind_trades';
const USERS_KEY = 'trademind_users';
const SESSION_KEY = 'trademind_session';

// Helper to generate unique referral code
const generateReferralCode = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.floor(100 + Math.random() * 899);
  return `${prefix}${random}`;
};

// --- User Management ---
export const getRegisteredUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    const initialAdmin: User = {
      id: 'admin-1',
      displayId: 'TM-ADMIN',
      email: 'potalemangesh09@gmail.com',
      name: 'Mangesh Potale',
      mobile: '8600299477',
      password: 'Mangesh@123',
      isPaid: true,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      joinedAt: new Date().toISOString(),
      amountPaid: 0,
      expiryDate: 'Lifetime',
      selectedPlan: PlanType.ANNUAL,
      ownReferralCode: 'ADMIN100'
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
    displayId: `TM-${Math.floor(10000 + Math.random() * 89999)}`,
    email: user.email!,
    name: user.name!,
    password: user.password!,
    mobile: user.mobile,
    selectedPlan: user.selectedPlan || PlanType.MONTHLY,
    isPaid: false,
    role: UserRole.USER,
    status: UserStatus.PENDING,
    joinedAt: new Date().toISOString(),
    amountPaid: 0,
    expiryDate: 'Pending',
    referredBy: user.referredBy || undefined,
    ownReferralCode: generateReferralCode(user.name!),
    hasReferralDiscount: !!user.referredBy
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
  
  const sessionUser = getCurrentUser();
  if (sessionUser && sessionUser.id === userId) {
    setCurrentUser({ ...sessionUser, status: UserStatus.WAITING_APPROVAL, paymentScreenshot: screenshot });
  }
};

export const updateUserStatus = (userId: string, status: UserStatus) => {
  const users = getRegisteredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const isApproved = status === UserStatus.APPROVED;
      const expiry = new Date();
      let amount = 0;
      if (isApproved) {
        switch(u.selectedPlan) {
          case PlanType.MONTHLY: expiry.setMonth(expiry.getMonth() + 1); amount = 299; break;
          case PlanType.SIX_MONTHS: expiry.setMonth(expiry.getMonth() + 6); amount = 599; break;
          case PlanType.ANNUAL: expiry.setFullYear(expiry.getFullYear() + 1); amount = 999; break;
        }
      }
      return { 
        ...u, 
        status, 
        isPaid: isApproved,
        amountPaid: isApproved ? amount : u.amountPaid,
        expiryDate: isApproved ? expiry.toISOString().split('T')[0] : u.expiryDate
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
  } catch { return []; }
};

// --- Master Sync Tools ---
export const getMasterSyncString = (): string => {
  const data = {
    users: getRegisteredUsers(),
    trades: getStoredTrades(),
    timestamp: new Date().toISOString()
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
};

export const importFromSyncString = (syncString: string): boolean => {
  try {
    const json = decodeURIComponent(escape(atob(syncString)));
    const data = JSON.parse(json);
    if (data.users && data.trades) {
      saveUsers(data.users);
      saveTrades(data.trades);
      return true;
    }
    return false;
  } catch { return false; }
};

export const exportMasterDB = () => {
  const masterData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    users: getRegisteredUsers(),
    trades: getStoredTrades()
  };
  const blob = new Blob([JSON.stringify(masterData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trademind-master-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

export const importMasterDB = async (jsonString: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonString);
    if (data.users && data.trades) {
      saveUsers(data.users);
      saveTrades(data.trades);
      return true;
    }
    return false;
  } catch { return false; }
};

// --- Calculations ---
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
  const headers = ["ID", "Symbol", "Type", "Side", "Status", "Entry Date", "Exit Date", "Entry Price", "Exit Price", "Quantity", "Fees", "Gross P&L", "Net P&L", "Strategies", "Emotions", "Mistakes", "AI Score"];
  const rows = trades.map(t => [
    t.id, t.symbol, t.type, t.side, t.status, t.entryDate, t.exitDate || '', t.entryPrice, t.exitPrice || '', t.quantity, t.fees, calculateGrossPnL(t), calculatePnL(t), 
    `"${t.strategies.join('; ')}"`, 
    `"${t.emotions.join('; ')}"`, 
    `"${t.mistakes.join('; ')}"`, 
    t.aiReview?.score || 'N/A'
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `trademind_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
