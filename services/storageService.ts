
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

export const exportTradesToCSV = (trades: Trade[]) => {
  if (trades.length === 0) return;

  const headers = [
    "ID", "Symbol", "Type", "Side", "Status", 
    "Entry Date", "Exit Date", "Entry Price", "Exit Price", 
    "Quantity", "Fees", "Gross PnL", "Net PnL", 
    "Strategies", "Emotions", "Mistakes", "AI Score", "Notes"
  ];

  const rows = trades.map(t => {
    const gross = calculateGrossPnL(t);
    const net = calculatePnL(t);
    return [
      t.id,
      t.symbol,
      t.type,
      t.side,
      t.status,
      new Date(t.entryDate).toLocaleString(),
      t.exitDate ? new Date(t.exitDate).toLocaleString() : "N/A",
      t.entryPrice,
      t.exitPrice || 0,
      t.quantity,
      t.fees,
      gross.toFixed(2),
      net.toFixed(2),
      `"${t.strategies.join(', ')}"`,
      `"${t.emotions.join(', ')}"`,
      `"${t.mistakes.join(', ')}"`,
      t.aiReview?.score || "N/A",
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `trademind-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
