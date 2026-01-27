
import React, { useState, useEffect } from 'react';
import { Trade, User, UserRole, UserStatus } from './types';
import { 
  getStoredTrades, 
  saveTrades, 
  exportTradesToCSV, 
  getCurrentUser, 
  setCurrentUser 
} from './services/storageService';
import { checkCloudVaultStatus, initializeGoogleSync } from './services/googleDriveService';

import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeEntryForm from './components/TradeEntryForm';
import TradeDetail from './components/TradeDetail';
import AnalysisView from './components/AnalysisView';
import MistakesView from './components/MistakesView';
import EmotionsView from './components/EmotionsView';
import AIInsightsView from './components/AIInsightsView';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import PaymentView from './components/PaymentView';
import UserVerificationStatus from './components/UserVerificationStatus';

// Main Application Component
const App: React.FC = () => {
  const [currentUser, setAuthUser] = useState<User | null>(getCurrentUser());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'analysis' | 'mistakes' | 'emotions' | 'ai' | 'admin'>('dashboard');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'off' | 'active' | 'update'>('off');

  // Sync trades when user changes
  useEffect(() => {
    if (currentUser) {
      // Admins get all trades, regular users get only their own
      const tradesToLoad = currentUser.role === UserRole.ADMIN 
        ? getStoredTrades() 
        : getStoredTrades(currentUser.id);
      setTrades(tradesToLoad);
    }
  }, [currentUser]);

  // Cloud Monitoring for Admin
  useEffect(() => {
    if (currentUser?.role === UserRole.ADMIN) {
      const monitor = async () => {
        await initializeGoogleSync();
        const status = await checkCloudVaultStatus();
        if (status) {
          setCloudStatus(status.hasNewer ? 'update' : 'active');
        }
      };
      monitor();
      const interval = setInterval(monitor, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleAuthComplete = (user: User) => {
    setAuthUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthUser(null);
    setTrades([]);
  };

  const handleAddTrade = (trade: Trade) => {
    const allTrades = getStoredTrades();
    const tradeExists = allTrades.some(t => t.id === trade.id);
    let updatedAll;
    
    if (tradeExists) {
      updatedAll = allTrades.map(t => t.id === trade.id ? trade : t);
    } else {
      updatedAll = [...allTrades, trade];
    }
    
    saveTrades(updatedAll);
    if (currentUser) {
      setTrades(currentUser.role === UserRole.ADMIN ? updatedAll : updatedAll.filter(t => t.userId === currentUser.id));
    }
    setIsEntryFormOpen(false);
    setEditingTrade(null);
    setSelectedTrade(null);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    const allTrades = getStoredTrades();
    const updatedAll = allTrades.map(t => t.id === updatedTrade.id ? updatedTrade : t);
    saveTrades(updatedAll);
    if (currentUser) {
      setTrades(currentUser.role === UserRole.ADMIN ? updatedAll : updatedAll.filter(t => t.userId === currentUser.id));
    }
    
    if (selectedTrade?.id === updatedTrade.id) {
      setSelectedTrade(updatedTrade);
    }
  };

  const handleDeleteTrade = (id: string) => {
    const allTrades = getStoredTrades();
    const updatedAll = allTrades.filter(t => t.id !== id);
    saveTrades(updatedAll);
    if (currentUser) {
      setTrades(currentUser.role === UserRole.ADMIN ? updatedAll : updatedAll.filter(t => t.userId === currentUser.id));
    }
    setSelectedTrade(null);
  };

  // Auth & Access Control
  if (!currentUser) {
    return <AuthView onAuthComplete={handleAuthComplete} />;
  }

  // Payment required for new users (Admins are always approved)
  if (currentUser.role !== UserRole.ADMIN && currentUser.status === UserStatus.PENDING) {
    return <PaymentView user={currentUser} onPaymentSubmitted={() => setAuthUser(getCurrentUser())} />;
  }

  // Verification status gating (Admins are always approved)
  if (currentUser.role !== UserRole.ADMIN && (currentUser.status === UserStatus.WAITING_APPROVAL || currentUser.status === UserStatus.REJECTED)) {
    return (
      <UserVerificationStatus 
        user={currentUser} 
        onLogout={handleLogout} 
        onRetry={() => {
          const updated = { ...currentUser, status: UserStatus.PENDING };
          setAuthUser(updated);
        }} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trades={trades} onExport={() => exportTradesToCSV(trades)} />;
      case 'journal':
        return <TradeList trades={trades} onSelect={setSelectedTrade} isAdmin={currentUser.role === UserRole.ADMIN} />;
      case 'analysis':
        return <AnalysisView trades={trades} />;
      case 'mistakes':
        return <MistakesView trades={trades} />;
      case 'emotions':
        return <EmotionsView trades={trades} />;
      case 'ai':
        return <AIInsightsView trades={trades} />;
      case 'admin':
        return currentUser.role === UserRole.ADMIN ? <AdminView onLogout={handleLogout} /> : <Dashboard trades={trades} />;
      default:
        return <Dashboard trades={trades} />;
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'journal', label: 'Journal', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'analysis', label: 'Edge', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'mistakes', label: 'Leaks', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'emotions', label: 'Mindset', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'ai', label: 'AI Coach', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
  ];

  if (currentUser.role === UserRole.ADMIN) {
    navigationItems.push({ id: 'admin', label: 'Console', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' });
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Sidebar / Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1421]/80 backdrop-blur-xl border border-[#1e293b] p-2 rounded-3xl shadow-2xl flex items-center gap-1 md:gap-2">
        {navigationItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all relative ${activeTab === tab.id ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
            <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {tab.id === 'admin' && cloudStatus === 'update' && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 border-2 border-[#0e1421] rounded-full animate-bounce"></div>
            )}
          </button>
        ))}
        <div className="w-px h-6 bg-[#1e293b] mx-1"></div>
        <button onClick={handleLogout} className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all" title="Logout">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">{currentUser.displayId}</span>
               {currentUser.role === UserRole.ADMIN && (
                 <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-widest">Admin Console</span>
               )}
               {cloudStatus !== 'off' && (
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest flex items-center gap-1.5 ${cloudStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                   <div className={`w-1.5 h-1.5 rounded-full ${cloudStatus === 'active' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
                   Cloud Linked
                 </span>
               )}
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              {currentUser.name.split(' ')[0]}'s <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Terminal</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
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

      {/* Modals */}
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
