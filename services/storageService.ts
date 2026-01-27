
import { Trade, User, UserRole, UserStatus, PlanType, Transaction } from "../types";

const TRADES_KEY = 'trademind_trades';
const USERS_KEY = 'trademind_users';
const SESSION_KEY = 'trademind_session';
const TRANSACTIONS_KEY = 'trademind_transactions';

const generateReferralCode = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.floor(100 + Math.random() * 899);
  return `${prefix}${random}`;
};

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

// Fix: Add resetUserPassword to allow users to reset their password
export const resetUserPassword = (email: string, mobile: string, newPassword: string): boolean => {
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.mobile === mobile);
  if (!user) return false;
  user.password = newPassword;
  saveUsers(users);
  return true;
};

export const saveTransactions = (txs: Transaction[]) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const logTransaction = (tx: Transaction) => {
  const txs = getTransactions();
  saveTransactions([...txs, tx]);
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

export const getMasterSyncString = (): string => {
  const data = {
    users: getRegisteredUsers(),
    trades: getStoredTrades(),
    transactions: getTransactions(),
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
      if (data.transactions) saveTransactions(data.transactions);
      return true;
    }
    return false;
  } catch { return false; }
};

export const exportMasterDB = () => {
  const masterData = {
    version: '1.1',
    exportedAt: new Date().toISOString(),
    users: getRegisteredUsers(),
    trades: getStoredTrades(),
    transactions: getTransactions()
  };
  const blob = new Blob([JSON.stringify(masterData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trademind-master-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
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
  const users = getRegisteredUsers();
  const headers = ["Trade ID", "Owner Name", "Symbol", "Type", "Side", "Status", "Entry Date", "Exit Date", "Entry Price", "Exit Price", "Quantity", "Fees", "Gross P&L", "Net P&L", "Strategies", "Emotions", "Mistakes", "AI Score"];
  
  const rows = trades.map(t => {
    const owner = users.find(u => u.id === t.userId);
    const ownerName = owner ? owner.name : 'Unknown';
    
    return [
      t.id, 
      ownerName,
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
    ];
  });
  
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
  const headers = ["Identity ID", "Name", "Email", "Mobile", "Plan", "Joined Date", "Amount Paid", "Expiry Date", "Status", "Is Paid"];
  const rows = users.map(u => [
    u.displayId, u.name, u.email, u.mobile || 'N/A', u.selectedPlan || 'N/A', new Date(u.joinedAt).toLocaleDateString(), u.amountPaid || 0, u.expiryDate || 'N/A', u.status, u.isPaid ? 'Yes' : 'No'
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `trademind_user_registry_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
