
import React, { useState, useEffect } from 'react';
import { Trade, User, UserRole } from './types';
import { 
  getStoredTrades, 
  saveTrade,
  deleteTradeFromDB,
  exportTradesToCSV, 
  getOrCreateCurrentUser
} from './services/storageService';
import { initializeGoogleSync, authenticateCloud, syncToCloud, restoreFromCloud } from './services/googleDriveService';

import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeEntryForm from './components/TradeEntryForm';
import TradeDetail from './components/TradeDetail';
import AnalysisView from './components/AnalysisView';
import MistakesView from './components/MistakesView';
import EmotionsView from './components/EmotionsView';
import AIInsightsView from './components/AIInsightsView';
import AdminView from './components/AdminView';

const App: React.FC = () => {
  const [currentUser] = useState<User>(getOrCreateCurrentUser());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'analysis' | 'mistakes' | 'emotions' | 'ai' | 'admin'>('dashboard');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    initializeGoogleSync().catch(console.error);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    loadTrades();
  }, [currentUser.id]);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      const tradesToLoad = await getStoredTrades(currentUser.id);
      setTrades(tradesToLoad);
    } catch (err) {
      console.error("Failed to load trades:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloudSync = async (direction: 'up' | 'down') => {
    setIsCloudSyncing(true);
    setCloudStatus('idle');
    try {
      await authenticateCloud();
      const success = direction === 'up' ? await syncToCloud() : await restoreFromCloud();
      if (success) {
        setCloudStatus('success');
        if (direction === 'down') await loadTrades();
      } else {
        setCloudStatus('error');
      }
    } catch (err) {
      console.error("Cloud Sync Error:", err);
      setCloudStatus('error');
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudStatus('idle'), 3000);
    }
  };

  const handleAddTrade = async (trade: Trade) => {
    setIsLoading(true);
    try {
      await saveTrade(trade);
      await loadTrades();
      setIsEntryFormOpen(false);
      setEditingTrade(null);
      setSelectedTrade(null);
    } catch (err) {
      alert("Failed to save execution.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    setIsLoading(true);
    try {
      await saveTrade(updatedTrade);
      await loadTrades();
      if (selectedTrade?.id === updatedTrade.id) {
        setSelectedTrade(updatedTrade);
      }
    } catch (err) {
      alert("Update failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteTradeFromDB(id);
      await loadTrades();
      setSelectedTrade(null);
    } catch (err) {
      alert("Failed to purge record.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Booting Secure Terminal...</p>
      </div>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Perf' },
    { id: 'journal', label: 'Trades' },
    { id: 'analysis', label: 'Edge' },
    { id: 'mistakes', label: 'Leaks' },
    { id: 'emotions', label: 'Mind' },
    { id: 'ai', label: 'Coach' }
  ];

  if (currentUser.role === UserRole.ADMIN) {
    navigationItems.push({ id: 'admin', label: 'Admin' });
  }

  const activeTabLabel = navigationItems.find(item => item.id === activeTab)?.label || 'Terminal';

  const renderContent = () => {
    if (isLoading && trades.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Processing Tape...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard trades={trades} onExport={() => exportTradesToCSV(trades)} />;
      case 'journal': return <TradeList trades={trades} onSelect={setSelectedTrade} isAdmin={currentUser.role === UserRole.ADMIN} />;
      case 'analysis': return <AnalysisView trades={trades} />;
      case 'mistakes': return <MistakesView trades={trades} />;
      case 'emotions': return <EmotionsView trades={trades} />;
      case 'ai': return <AIInsightsView trades={trades} />;
      case 'admin': return <AdminView />;
      default: return <Dashboard trades={trades} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 font-sans selection:bg-emerald-500/30">
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1421]/90 backdrop-blur-xl border border-[#1e293b] p-1.5 rounded-[2rem] shadow-2xl flex items-center gap-1 md:gap-1.5 max-w-[95vw] overflow-x-auto no-scrollbar">
        {navigationItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center px-4 py-3 rounded-2xl transition-all relative whitespace-nowrap min-w-[70px] ${activeTab === tab.id ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">{currentUser.displayId}</span>
               <div className="flex items-center gap-2 bg-[#0e1421] px-2 py-0.5 rounded border border-[#1e293b]">
                  <div className={`w-1.5 h-1.5 rounded-full ${cloudStatus === 'success' ? 'bg-emerald-500' : cloudStatus === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{activeTabLabel} Module</span>
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              TradeMind <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Terminal</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-[#0a0f1d] p-1 rounded-2xl border border-[#1e293b]">
              <button 
                onClick={() => handleCloudSync('up')}
                disabled={isCloudSyncing}
                className="p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-emerald-500 transition-all disabled:opacity-30"
                title="Backup to Cloud"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </button>
              <button 
                onClick={() => handleCloudSync('down')}
                disabled={isCloudSyncing}
                className="p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-blue-500 transition-all disabled:opacity-30"
                title="Restore from Cloud"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 13l3 3m0 0l3-3m-3 3V10"></path></svg>
              </button>
            </div>

            <button 
              onClick={() => setIsEntryFormOpen(true)}
              className="group relative inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-emerald-500/20 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              <span className="text-xs uppercase tracking-[0.2em]">Log Execution</span>
            </button>
          </div>
        </header>
        {renderContent()}
      </main>

      {isEntryFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <TradeEntryForm 
            userId={currentUser.id}
            onAdd={handleAddTrade}
            onCancel={() => { setIsEntryFormOpen(false); setEditingTrade(null); }}
            initialTrade={editingTrade || undefined}
          />
        </div>
      )}

      {selectedTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-5xl">
            <TradeDetail 
              trade={selectedTrade}
              onClose={() => setSelectedTrade(null)}
              onUpdate={handleUpdateTrade}
              onDelete={handleDeleteTrade}
              onEdit={(t) => { setEditingTrade(t); setIsEntryFormOpen(true); }}
              isAdmin={currentUser.role === UserRole.ADMIN}
              currentUserId={currentUser.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
