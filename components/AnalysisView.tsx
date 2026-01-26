
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

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, pnl: 0, count: 0 }));
    closedTrades.forEach(t => {
      const hour = new Date(t.entryDate).getHours();
      hours[hour].pnl += calculateGrossPnL(t);
      hours[hour].count++;
    });
    return hours.filter(h => h.count > 0);
  }, [closedTrades]);

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

  const symbolData = useMemo(() => {
    const symbols: Record<string, { name: string; pnl: number; count: number }> = {};
    closedTrades.forEach(t => {
      if (!symbols[t.symbol]) symbols[t.symbol] = { name: t.symbol, pnl: 0, count: 0 };
      symbols[t.symbol].pnl += calculateGrossPnL(t);
      symbols[t.symbol].count++;
    });
    return Object.values(symbols).sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  }, [closedTrades]);

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
      <section className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-white">Performance Heatmap</h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-tight">Daily realization tracking</p>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0f1d] p-1 rounded-lg border border-[#1e293b]">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-[#111827] text-slate-400 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="px-4 font-black text-white text-sm uppercase">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-[#111827] text-slate-400 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
        <PnLCalendar viewDate={viewDate} data={calendarData} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
          <h3 className="text-lg font-black mb-6 text-white flex items-center gap-3">
             <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
             Top Performing Symbols (INR)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} vertical={true} />
                <XAxis type="number" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', color: '#f8fafc' }}
                   formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Total P&L']}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={40}>
                  {symbolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
          <h3 className="text-lg font-black mb-6 text-white">Strategy Breakdown</h3>
          <div className="space-y-4">
            {strategyData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b] transition-colors hover:border-emerald-500/30">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/20">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-black text-white">{s.name}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                      {s.count} Executions • {((s.win/s.count)*100).toFixed(0)}% Win Rate
                    </div>
                  </div>
                </div>
                <div className={`font-mono font-black text-lg ${s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-3">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
        <div key={i} className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest pb-4">{d}</div>
      ))}
      {monthDays.map((d, i) => (
        <div 
          key={i} 
          className={`min-h-[50px] md:min-h-[90px] p-2 rounded-2xl border transition-all ${
            d ? 'bg-[#0a0f1d] border-[#1e293b] hover:border-[#334155]' : 'border-transparent opacity-0'
          } ${d?.stats && (d.stats.pnl > 0 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : d.stats.pnl < 0 ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : '')}`}
        >
          {d && (
            <div className="flex flex-col h-full">
              <div className="text-[10px] font-black text-slate-500 mb-1">{d.day}</div>
              {d.stats && (
                <div className="flex flex-col h-full justify-center text-center">
                  <div className={`text-[10px] md:text-sm font-black ${d.stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {d.stats.pnl >= 0 ? '+' : ''}₹{Math.abs(d.stats.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[8px] text-slate-600 font-bold uppercase mt-1">{d.stats.count} T</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnalysisView;
