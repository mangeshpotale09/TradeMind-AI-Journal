
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trade, TradeStatus } from '../types';
import { calculatePnL, calculateGrossPnL } from '../services/storageService';

interface DashboardProps {
  trades: Trade[];
}

type TimeFilter = 'WEEK' | 'MONTH' | '3MONTHS' | '6MONTHS' | '1YEAR' | 'ALL';

const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const [filter, setFilter] = useState<TimeFilter>('ALL');

  const filteredTrades = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED);
    if (filter === 'ALL') return closedTrades;

    const now = new Date();
    const filterMap: Record<TimeFilter, number> = {
      'WEEK': 7,
      'MONTH': 30,
      '3MONTHS': 90,
      '6MONTHS': 180,
      '1YEAR': 365,
      'ALL': 0
    };

    const days = filterMap[filter];
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    return closedTrades.filter(t => new Date(t.exitDate!) >= cutoff);
  }, [trades, filter]);

  const stats = useMemo(() => {
    const closedTrades = filteredTrades;
    const totalGrossPnL = closedTrades.reduce((acc, t) => acc + calculateGrossPnL(t), 0);
    const totalFees = closedTrades.reduce((acc, t) => acc + t.fees, 0);
    const totalNetPnL = totalGrossPnL - totalFees;

    const winningTrades = closedTrades.filter(t => calculateGrossPnL(t) > 0);
    const losingTrades = closedTrades.filter(t => calculateGrossPnL(t) < 0);

    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

    const totalWinAmount = winningTrades.reduce((acc, t) => acc + calculateGrossPnL(t), 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((acc, t) => acc + calculateGrossPnL(t), 0));

    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;

    // Corrected RRR Logic: Average Win / Average Loss
    const rrr = avgLoss !== 0 ? (avgWin / avgLoss) : (winCount > 0 ? 99 : 0);
    
    // Profit Factor: Total Wins / Total Losses
    const profitFactor = totalLossAmount !== 0 ? (totalWinAmount / totalLossAmount) : (totalWinAmount > 0 ? 99 : 0);

    const sortedByGross = [...closedTrades].sort((a, b) => calculateGrossPnL(b) - calculateGrossPnL(a));
    const bestTrade = sortedByGross.length > 0 ? sortedByGross[0] : null;
    const worstTrade = sortedByGross.length > 0 ? sortedByGross[sortedByGross.length - 1] : null;

    let runningTotal = 0;
    const chartData = [...closedTrades]
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime())
      .map(t => {
        runningTotal += calculatePnL(t); // Using Net PnL for equity curve
        return {
          date: new Date(t.exitDate!).toLocaleDateString(),
          pnl: runningTotal
        };
      });

    return { 
      totalGrossPnL, 
      totalNetPnL,
      totalFees,
      winRate, 
      winCount,
      lossCount,
      avgWin, 
      avgLoss,
      rrr,
      profitFactor,
      bestTrade,
      worstTrade,
      chartData, 
      closedCount: closedTrades.length 
    };
  }, [filteredTrades]);

  const assetDistribution = useMemo(() => {
    const counts = trades.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [trades]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4'];

  const filterButtons: { label: string; value: TimeFilter }[] = [
    { label: 'Weekly', value: 'WEEK' },
    { label: 'Monthly', value: 'MONTH' },
    { label: '3M', value: '3MONTHS' },
    { label: '6M', value: '6MONTHS' },
    { label: '1Y', value: '1YEAR' },
    { label: 'All', value: 'ALL' },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 w-full md:w-fit">
        {filterButtons.map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-sm font-semibold transition-all ${
              filter === btn.value 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          label="Net P&L (Realized)" 
          value={`₹${stats.totalNetPnL.toLocaleString()}`} 
          subValue={`After ₹${stats.totalFees.toLocaleString()} Brokerage`}
          trend={stats.totalNetPnL >= 0 ? 'up' : 'down'}
          color={stats.totalNetPnL >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard 
          label="Win Rate" 
          value={`${stats.winRate.toFixed(1)}%`} 
          subValue={`${stats.winCount} Wins / ${stats.lossCount} Losses`}
          color="text-blue-400"
        />
        <StatCard 
          label="Realized RRR" 
          value={`${stats.rrr.toFixed(2)}:1`} 
          subValue="Avg. Win / Avg. Loss"
          color="text-purple-400"
        />
        <StatCard 
          label="Profit Factor" 
          value={stats.profitFactor.toFixed(2)} 
          subValue="Total Gain / Total Loss"
          color={stats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard 
          label="Avg. Profit" 
          value={`₹${stats.avgWin.toFixed(0)}`} 
          subValue="Per Winning Trade"
          color="text-green-400"
        />
        <StatCard 
          label="Avg. Loss" 
          value={`₹${stats.avgLoss.toFixed(0)}`} 
          subValue="Per Losing Trade"
          color="text-red-400"
        />
        <StatCard 
          label="Largest WIN" 
          value={stats.bestTrade ? `₹${calculateGrossPnL(stats.bestTrade).toLocaleString()}` : 'N/A'} 
          subValue={stats.bestTrade ? stats.bestTrade.symbol : 'N/A'}
          color="text-green-500"
        />
        <StatCard 
          label="Brokerage" 
          value={`₹${stats.totalFees.toLocaleString()}`} 
          subValue="Total Paid Fees"
          color="text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200">Equity Curve (Net P&L)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Net P&L']}
                />
                <Area type="monotone" dataKey="pnl" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPnL)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col items-center">
          <h3 className="text-lg font-bold mb-6 text-slate-200 w-full">Asset Allocation</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4">
            {assetDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-xs text-slate-400 font-medium">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, trend, color }: any) => (
  <div className="bg-slate-800 p-3 md:p-5 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-between h-full">
    <div>
      <span className="text-slate-500 text-[9px] md:text-xs font-semibold uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline gap-1 md:gap-2 mt-1 md:mt-2">
        <span className={`text-sm md:text-2xl font-bold font-mono truncate ${color || 'text-slate-100'}`}>{value}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-green-500 text-[10px]' : 'text-red-500 text-[10px]'}>
            {trend === 'up' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </div>
    {subValue && <span className="text-slate-500 text-[8px] md:text-[10px] mt-1 md:mt-2 block font-medium border-t border-slate-700/50 pt-1 md:pt-2 truncate">{subValue}</span>}
  </div>
);

export default Dashboard;
