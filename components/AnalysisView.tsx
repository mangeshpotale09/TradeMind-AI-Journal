
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trade, TradeStatus } from '../types';
import { calculateGrossPnL } from '../services/storageService';

interface AnalysisViewProps {
  trades: Trade[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ trades }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const closedTrades = useMemo(() => trades.filter(t => t.status === TradeStatus.CLOSED), [trades]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Weekday Analysis
  const weekdayData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const results = days.map(day => ({ day, win: 0, loss: 0, pnl: 0, count: 0 }));

    closedTrades.forEach(t => {
      const dayIdx = new Date(t.entryDate).getDay();
      const pnl = calculateGrossPnL(t);
      results[dayIdx].count++;
      results[dayIdx].pnl += pnl;
      if (pnl > 0) results[dayIdx].win++;
      else if (pnl < 0) results[dayIdx].loss++;
    });

    return results.filter(r => r.day !== 'Sunday' && r.day !== 'Saturday');
  }, [closedTrades]);

  // Hourly Analysis
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, pnl: 0, count: 0 }));
    closedTrades.forEach(t => {
      const hour = new Date(t.entryDate).getHours();
      hours[hour].pnl += calculateGrossPnL(t);
      hours[hour].count++;
    });
    return hours.filter(h => h.count > 0);
  }, [closedTrades]);

  // Strategy Analysis
  const strategyData = useMemo(() => {
    const strategies: Record<string, { name: string; pnl: number; win: number; count: number }> = {};
    closedTrades.forEach(t => {
      t.strategies.forEach(s => {
        if (!strategies[s]) strategies[s] = { name: s, pnl: 0, win: 0, count: 0 };
        const pnl = calculateGrossPnL(t);
        strategies[s].pnl += pnl;
        strategies[s].count++;
        if (pnl > 0) strategies[s].win++;
      });
    });
    return Object.values(strategies).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  // Symbol Analysis
  const symbolData = useMemo(() => {
    const symbols: Record<string, { name: string; pnl: number; count: number }> = {};
    closedTrades.forEach(t => {
      if (!symbols[t.symbol]) symbols[t.symbol] = { name: t.symbol, pnl: 0, count: 0 };
      symbols[t.symbol].pnl += calculateGrossPnL(t);
      symbols[t.symbol].count++;
    });
    return Object.values(symbols).sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  }, [closedTrades]);

  // Calendar Heatmap
  const calendarData = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    closedTrades.forEach(t => {
      const date = new Date(t.exitDate!).toISOString().split('T')[0];
      if (!map[date]) map[date] = { pnl: 0, count: 0 };
      map[date].pnl += calculateGrossPnL(t);
      map[date].count++;
    });
    return map;
  }, [closedTrades]);

  return (
    <div className="space-y-8 pb-20">
      {/* Calendar View Section */}
      <section className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-200">Advanced P&L Calendar</h3>
            <p className="text-slate-500 text-sm">Track your daily and monthly performance cycles.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="px-2 md:px-4 font-bold text-slate-200 text-xs md:text-base min-w-[100px] md:min-w-[140px] text-center">
              {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>

        <PnLCalendar viewDate={viewDate} data={calendarData} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekday Performance */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Weekly Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-700">
                  <th className="pb-3">Day</th>
                  <th className="pb-3">Trades</th>
                  <th className="pb-3">Win/Loss</th>
                  <th className="pb-3 text-right">Gross P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {weekdayData.map(d => (
                  <tr key={d.day} className="group hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 font-semibold text-slate-300">{d.day}</td>
                    <td className="py-4">{d.count}</td>
                    <td className="py-4">
                      <span className="text-green-400">{d.win}W</span> / <span className="text-red-400">{d.loss}L</span>
                    </td>
                    <td className={`py-4 text-right font-mono font-bold ${d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{d.pnl.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hourly Analysis */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Best Time to Trade (P&L by Hour)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickFormatter={(h) => `${h}:00`} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                   formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'P&L']}
                />
                <Bar dataKey="pnl">
                  {hourlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Performance */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Strategy Performance Breakdown</h3>
          <div className="space-y-4">
            {strategyData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                <div>
                  <div className="font-bold text-slate-200">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {s.count} Trades • {((s.win/s.count)*100).toFixed(1)}% Win Rate
                  </div>
                </div>
                <div className={`font-mono font-bold ${s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{s.pnl.toLocaleString()}
                </div>
              </div>
            ))}
            {strategyData.length === 0 && <p className="text-slate-500 text-center py-10">No strategy tags applied to closed trades.</p>}
          </div>
        </div>

        {/* Top Symbols */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Top Performing Symbols</h3>
          <div className="space-y-4">
            {symbolData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.count} Total Executions</div>
                  </div>
                </div>
                <div className={`font-mono font-bold ${s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{s.pnl.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component: PnL Calendar
const PnLCalendar = ({ viewDate, data }: { viewDate: Date; data: Record<string, { pnl: number; count: number }> }) => {
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const monthDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const day = i - firstDayOfMonth + 1;
      if (day <= 0 || day > daysInMonth) return null;
      
      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stats = data[dateStr];
      
      return { day, stats, dateStr };
    });
  }, [viewDate, data, firstDayOfMonth, daysInMonth]);

  // Monthly stats
  const monthStats = useMemo(() => {
    let totalPnl = 0;
    let tradingDays = 0;
    let profitDays = 0;
    let lossDays = 0;

    monthDays.forEach(d => {
      if (d && d.stats) {
        tradingDays++;
        totalPnl += d.stats.pnl;
        if (d.stats.pnl > 0) profitDays++;
        else if (d.stats.pnl < 0) lossDays++;
      }
    });

    return { totalPnl, tradingDays, profitDays, lossDays };
  }, [monthDays]);

  return (
    <div className="w-full space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-slate-900/50 p-2 md:p-4 rounded-xl border border-slate-700">
          <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gross P&L</span>
          <div className={`text-sm md:text-xl font-black mt-1 ${monthStats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₹{monthStats.totalPnl.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900/50 p-2 md:p-4 rounded-xl border border-slate-700">
          <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Days</span>
          <div className="text-sm md:text-xl font-black mt-1 text-slate-200">
            {monthStats.tradingDays}
          </div>
        </div>
        <div className="bg-slate-900/50 p-2 md:p-4 rounded-xl border border-slate-700">
          <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profitable</span>
          <div className="text-sm md:text-xl font-black mt-1 text-green-400">
            {monthStats.profitDays}
          </div>
        </div>
        <div className="bg-slate-900/50 p-2 md:p-4 rounded-xl border border-slate-700">
          <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Losing</span>
          <div className="text-sm md:text-xl font-black mt-1 text-red-400">
            {monthStats.lossDays}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 md:gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest pb-1">{d}</div>
        ))}
        {monthDays.map((d, i) => (
          <div 
            key={i} 
            className={`min-h-[50px] md:min-h-[90px] p-1 md:p-2 rounded-lg md:rounded-xl border transition-all ${
              d ? 'bg-slate-900/30 border-slate-700/50 hover:border-slate-500' : 'border-transparent opacity-0 pointer-events-none'
            } ${d?.stats && (d.stats.pnl > 0 ? 'bg-green-500/5 border-green-500/20' : d.stats.pnl < 0 ? 'bg-red-500/5 border-red-500/20' : '')}`}
          >
            {d && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="text-[8px] md:text-[10px] font-bold text-slate-500 mb-0.5">{d.day}</div>
                {d.stats && (
                  <div className="flex flex-col h-full justify-between">
                    <div className={`text-[7px] sm:text-[9px] md:text-sm font-black truncate leading-none ${d.stats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {d.stats.pnl >= 0 ? '+' : ''}₹{Math.abs(d.stats.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[6px] sm:text-[8px] md:text-[10px] text-slate-500 font-medium truncate mt-0.5">
                      {d.stats.count} <span className="hidden sm:inline">Trades</span><span className="inline sm:hidden">T</span>
                    </div>
                    <div className={`mt-auto h-0.5 md:h-1 rounded-full w-full overflow-hidden ${d.stats.pnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                       <div 
                        className={`h-full rounded-full ${d.stats.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisView;
