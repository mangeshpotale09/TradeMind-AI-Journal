
import React from 'react';
import { Trade, TradeStatus, TradeSide } from '../types';
import { calculatePnL } from '../services/storageService';

interface TradeListProps {
  trades: Trade[];
  onSelect: (trade: Trade) => void;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onSelect }) => {
  const sortedTrades = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-700">
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Side</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Entry</th>
              <th className="px-6 py-4">Exit</th>
              <th className="px-6 py-4">P&L</th>
              <th className="px-6 py-4">AI Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedTrades.map((trade) => {
              const pnl = calculatePnL(trade);
              return (
                <tr 
                  key={trade.id} 
                  onClick={() => onSelect(trade)}
                  className="hover:bg-slate-700/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{trade.symbol}</div>
                    <div className="text-xs text-slate-500">{trade.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${trade.side === TradeSide.LONG ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${trade.status === TradeStatus.OPEN ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-slate-300">₹{trade.entryPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">{new Date(trade.entryDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-slate-300">
                      {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : '--'}
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-mono font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.status === TradeStatus.CLOSED ? `₹${pnl.toFixed(2)}` : '--'}
                  </td>
                  <td className="px-6 py-4">
                    {trade.aiReview ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black flex items-center justify-center border border-blue-500/30">
                          {trade.aiReview.score}
                        </div>
                        {trade.aiReview.violations && (
                          <span className="text-amber-500" title="Rule Violation">⚠️</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">Unreviewed</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {trades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                  No trades found. Log your first trade to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeList;
