
import React from 'react';
import { Trade, TradeStatus, TradeSide, TradeType } from '../types';
import { calculatePnL, getRegisteredUsers } from '../services/storageService';

interface TradeListProps {
  trades: Trade[];
  onSelect: (trade: Trade) => void;
  isAdmin?: boolean;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onSelect, isAdmin }) => {
  const sortedTrades = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  const users = isAdmin ? getRegisteredUsers() : [];

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const getCapitalUsed = (trade: Trade): number => {
    const multiplier = trade.type === TradeType.OPTION ? 100 : 1;
    return trade.entryPrice * trade.quantity * multiplier;
  };

  return (
    <div className="bg-[#0a0f1d] rounded-2xl border border-[#1e293b] shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0e1421] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-[#1e293b]">
              <th className="px-6 py-5">Symbol</th>
              {isAdmin && <th className="px-6 py-5">User</th>}
              <th className="px-6 py-5">Side</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Entry Price</th>
              <th className="px-6 py-5">Capital Used</th>
              <th className="px-6 py-5">Net P&L</th>
              <th className="px-6 py-5 text-right">Coach Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-slate-600 font-bold uppercase tracking-tighter italic">
                  No trades logged in {isAdmin ? 'the platform' : 'your tape'} yet.
                </td>
              </tr>
            ) : sortedTrades.map((trade) => {
              const pnl = calculatePnL(trade);
              const capitalUsed = getCapitalUsed(trade);
              return (
                <tr 
                  key={trade.id} 
                  onClick={() => onSelect(trade)}
                  className="hover:bg-[#111827] cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{trade.symbol}</div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">{trade.type}</div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-purple-400 uppercase tracking-tight">{getUserName(trade.userId)}</div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${trade.side === TradeSide.LONG ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trade.status === TradeStatus.OPEN ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e293b] text-slate-500'}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-slate-300">₹{trade.entryPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-600">{new Date(trade.entryDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-slate-400">₹{capitalUsed.toLocaleString()}</div>
                  </td>
                  <td className={`px-6 py-4 font-mono font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.status === TradeStatus.CLOSED ? `₹${pnl.toLocaleString()}` : '--'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {trade.aiReview ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-xs font-black text-emerald-400">{trade.aiReview.score}</span>
                      </div>
                    ) : (
                      <span className="text-slate-700 text-[10px] font-bold uppercase tracking-tighter">AI-Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeList;
