
import { Trade } from "../types";

const TRADES_KEY = 'trademind_trades';

export const saveTrades = (trades: Trade[]) => {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
};

export const getStoredTrades = (): Trade[] => {
  const data = localStorage.getItem(TRADES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === 'OPEN' || !trade.exitPrice) return 0;
  
  let pnl = 0;
  const entryValue = trade.entryPrice * trade.quantity;
  const exitValue = trade.exitPrice * trade.quantity;
  
  if (trade.type === 'STOCK') {
    pnl = trade.side === 'LONG' ? (exitValue - entryValue) : (entryValue - exitValue);
  } else {
    // Options: quantity is contracts (x100)
    const entryTotal = trade.entryPrice * trade.quantity * 100;
    const exitTotal = trade.exitPrice * trade.quantity * 100;
    pnl = trade.side === 'LONG' ? (exitTotal - entryTotal) : (entryTotal - exitTotal);
  }
  
  return pnl;
};

export const calculatePnL = (trade: Trade): number => {
  const gross = calculateGrossPnL(trade);
  return gross - trade.fees;
};
