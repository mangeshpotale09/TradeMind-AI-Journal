
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trade, TradeStatus } from '../types';
import { calculateGrossPnL } from '../services/storageService';

interface EmotionsViewProps {
  trades: Trade[];
}

const EmotionsView: React.FC<EmotionsViewProps> = ({ trades }) => {
  const closedTrades = useMemo(() => trades.filter(t => t.status === TradeStatus.CLOSED), [trades]);

  const emotionStats = useMemo(() => {
    const map: Record<string, { name: string; pnl: number; count: number; wins: number }> = {};
    
    closedTrades.forEach(t => {
      const pnl = calculateGrossPnL(t);
      if (t.emotions.length === 0) {
        if (!map['Neutral']) map['Neutral'] = { name: 'Neutral', pnl: 0, count: 0, wins: 0 };
        map['Neutral'].pnl += pnl;
        map['Neutral'].count++;
        if (pnl > 0) map['Neutral'].wins++;
      } else {
        t.emotions.forEach(e => {
          if (!map[e]) map[e] = { name: e, pnl: 0, count: 0, wins: 0 };
          map[e].pnl += pnl;
          map[e].count++;
          if (pnl > 0) map[e].wins++;
        });
      }
    });

    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  const pieData = useMemo(() => {
    return emotionStats.map(d => ({ name: d.name, value: d.count }));
  }, [emotionStats]);

  const bestEmotion = useMemo(() => emotionStats[0], [emotionStats]);
  const worstEmotion = useMemo(() => emotionStats[emotionStats.length - 1], [emotionStats]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500 text-2xl">😊</div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Most Profitable Mindset</span>
            <div className="text-2xl font-black text-slate-200">{bestEmotion?.name || 'N/A'}</div>
            <p className="text-green-500 text-sm font-bold">₹{bestEmotion?.pnl.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 text-2xl">😡</div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Least Profitable Mindset</span>
            <div className="text-2xl font-black text-slate-200">{worstEmotion?.name || 'N/A'}</div>
            <p className="text-red-500 text-sm font-bold">₹{worstEmotion?.pnl.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Total P&L by Emotional State</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'P&L']}
                />
                <Bar dataKey="pnl">
                  {emotionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center">
          <h3 className="text-lg font-bold mb-6 text-slate-200 w-full text-left">Frequency of Emotions</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{entry.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-lg font-bold mb-6 text-slate-200">Emotional Performance Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-700">
                <th className="pb-3 px-2">Emotion</th>
                <th className="pb-3 px-2">Count</th>
                <th className="pb-3 px-2">Win Rate</th>
                <th className="pb-3 px-2 text-right">Total P&L</th>
                <th className="pb-3 px-2 text-right">Avg P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {emotionStats.map(d => (
                <tr key={d.name} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-2 font-semibold text-slate-300">{d.name}</td>
                  <td className="py-4 px-2">{d.count}</td>
                  <td className="py-4 px-2">{((d.wins / d.count) * 100).toFixed(1)}%</td>
                  <td className={`py-4 px-2 text-right font-mono font-bold ${d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{d.pnl.toLocaleString()}
                  </td>
                  <td className={`py-4 px-2 text-right font-mono text-xs ${d.pnl / d.count >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{(d.pnl / d.count).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default EmotionsView;
