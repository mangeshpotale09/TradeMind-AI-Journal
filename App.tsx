
import React, { useState, useEffect } from 'react';
import { Trade } from './types';
import { getStoredTrades, saveTrades, exportTradesToCSV } from './services/storageService';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeEntryForm from './components/TradeEntryForm';
import TradeDetail from './components/TradeDetail';
import AIInsightsView from './components/AIInsightsView';
import AnalysisView from './components/AnalysisView';
import MistakesView from './components/MistakesView';
import EmotionsView from './components/EmotionsView';

type Tab = 'dashboard' | 'journal' | 'analysis' | 'insights' | 'mistakes' | 'emotions';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    setTrades(getStoredTrades());
  }, []);

  const handleAddTrade = (newTrade: Trade) => {
    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);
    saveTrades(updatedTrades);
    setShowEntryForm(false);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    const updatedTrades = trades.map(t => t.id === updatedTrade.id ? updatedTrade : t);
    setTrades(updatedTrades);
    saveTrades(updatedTrades);
    setSelectedTrade(updatedTrade);
    setEditingTrade(null);
  };

  const handleDeleteTrade = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      const updatedTrades = trades.filter(t => t.id !== id);
      setTrades(updatedTrades);
      saveTrades(updatedTrades);
      setSelectedTrade(null);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setShowEntryForm(true);
    setSelectedTrade(null);
  };

  const handleExport = () => {
    exportTradesToCSV(trades);
  };

  const navItems = [
    { id: 'dashboard' as Tab, label: 'Stats', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> },
    { id: 'journal' as Tab, label: 'Journal', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
    { id: 'analysis' as Tab, label: 'Calendar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> },
    { id: 'mistakes' as Tab, label: 'Mistakes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: 'emotions' as Tab, label: 'Mindset', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> },
    { id: 'insights' as Tab, label: 'AI Hub', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-lg">T</div>
          <span className="font-bold text-lg tracking-tight">TradeMind <span className="text-blue-500">AI</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Export CSV"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          </button>
          <button 
            onClick={() => {
              setEditingTrade(null);
              setShowEntryForm(true);
            }}
            className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar Navigation */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">T</div>
          <span className="font-bold text-xl tracking-tight">TradeMind <span className="text-blue-500">AI</span></span>
        </div>

        <div className="mt-6 flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavButton 
              key={item.id}
              active={activeTab === item.id} 
              onClick={() => setActiveTab(item.id)} 
              icon={item.icon}
              label={item.label === 'Stats' ? 'Dashboard' : item.label}
            />
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={handleExport}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="text-sm">Export CSV</span>
          </button>
          <button 
            onClick={() => {
              setEditingTrade(null);
              setShowEntryForm(true);
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Log Trade</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Horizontal Tabs) */}
      <nav className="fixed bottom-0 left-0 w-full h-16 bg-slate-900 border-t border-slate-800 flex md:hidden items-center justify-around px-2 z-40">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full ${
              activeTab === item.id ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="md:pl-64 pt-20 md:pt-6 pb-24 md:pb-6 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
          <header className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {activeTab === 'dashboard' && 'Market Performance'}
                {activeTab === 'journal' && 'Trade Journal History'}
                {activeTab === 'analysis' && 'Advanced Analytical Data'}
                {activeTab === 'mistakes' && 'Leak Detection: Mistakes'}
                {activeTab === 'emotions' && 'Trading Psychology & Emotions'}
                {activeTab === 'insights' && 'AI Intelligence Hub'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {activeTab === 'dashboard' && 'Real-time overview of your trading statistics and discipline.'}
                {activeTab === 'journal' && 'Review every execution. Detailed notes for every ticker.'}
                {activeTab === 'analysis' && 'Deep dive into strategy, timing, and monthly patterns.'}
                {activeTab === 'mistakes' && 'Quantifying the cost of your behavioral mistakes.'}
                {activeTab === 'emotions' && 'Analyzing how your state of mind impacts your bottom line.'}
                {activeTab === 'insights' && 'Gemini models detecting leaks and refining your strategy.'}
              </p>
            </div>
          </header>

          <div className="pb-12">
            {activeTab === 'dashboard' && <Dashboard trades={trades} />}
            {activeTab === 'journal' && (
              <div className="grid grid-cols-1 gap-6">
                <TradeList trades={trades} onSelect={setSelectedTrade} />
              </div>
            )}
            {activeTab === 'analysis' && <AnalysisView trades={trades} />}
            {activeTab === 'mistakes' && <MistakesView trades={trades} />}
            {activeTab === 'emotions' && <EmotionsView trades={trades} />}
            {activeTab === 'insights' && <AIInsightsView trades={trades} />}
          </div>
        </div>
      </main>

      {/* Overlays */}
      {showEntryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <TradeEntryForm 
              initialTrade={editingTrade || undefined}
              onAdd={editingTrade ? handleUpdateTrade : handleAddTrade} 
              onCancel={() => {
                setShowEntryForm(false);
                setEditingTrade(null);
              }} 
            />
          </div>
        </div>
      )}

      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto">
            <TradeDetail 
              trade={selectedTrade} 
              onUpdate={handleUpdateTrade} 
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
              onClose={() => setSelectedTrade(null)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-blue-600/10 text-blue-400' 
        : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
    }`}
  >
    <div className={`${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
      {icon}
    </div>
    <span className="font-medium text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>}
  </button>
);

export default App;
