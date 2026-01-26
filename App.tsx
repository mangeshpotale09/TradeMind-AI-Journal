
import React, { useState, useEffect } from 'react';
import { Trade, User, UserRole, UserStatus } from './types';
import { getStoredTrades, saveTrades, exportTradesToCSV, getCurrentUser, setCurrentUser, getRegisteredUsers } from './services/storageService';
import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeEntryForm from './components/TradeEntryForm';
import TradeDetail from './components/TradeDetail';
import AIInsightsView from './components/AIInsightsView';
import AnalysisView from './components/AnalysisView';
import MistakesView from './components/MistakesView';
import EmotionsView from './components/EmotionsView';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import PaymentView from './components/PaymentView';
import UserVerificationStatus from './components/UserVerificationStatus';

type Tab = 'dashboard' | 'journal' | 'analysis' | 'insights' | 'mistakes' | 'emotions' | 'admin';

const App: React.FC = () => {
  const [currentUser, setAppUser] = useState<User | null>(getCurrentUser());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    if (currentUser) {
      // Re-fetch user from "DB" to check status updates from admin
      const allUsers = getRegisteredUsers();
      const freshUser = allUsers.find(u => u.id === currentUser.id);
      if (freshUser) {
        setAppUser(freshUser);
        setCurrentUser(freshUser);
      }
      
      // Admin sees ALL trades, Users see only theirs
      const tradesToLoad = freshUser?.role === UserRole.ADMIN 
        ? getStoredTrades() 
        : getStoredTrades(currentUser.id);
      setTrades(tradesToLoad);
    }
  }, [currentUser?.id, currentUser?.role, activeTab]);

  // Security guard for restricted tabs
  useEffect(() => {
    const adminOnlyTabs: Tab[] = ['admin']; // insights is now available to Pro users (Approved)
    if (adminOnlyTabs.includes(activeTab) && currentUser?.role !== UserRole.ADMIN) {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentUser]);

  const handleAddTrade = (newTradeData: Partial<Trade>) => {
    if (!currentUser) return;
    const newTrade: Trade = {
      ...(newTradeData as Trade),
      userId: currentUser.id
    };
    
    // Admin sees all, Users see theirs. We save to the global pool.
    const allStored = [...getStoredTrades(), newTrade];
    saveTrades(allStored);
    
    // Refresh local state based on role
    const tradesToLoad = currentUser.role === UserRole.ADMIN 
      ? allStored 
      : allStored.filter(t => t.userId === currentUser.id);
      
    setTrades(tradesToLoad);
    setShowEntryForm(false);
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
    if (!currentUser) return;
    // Check ownership if not admin
    if (currentUser.role !== UserRole.ADMIN && updatedTrade.userId !== currentUser.id) return;

    const allStored = getStoredTrades().map(t => t.id === updatedTrade.id ? updatedTrade : t);
    saveTrades(allStored);
    
    // Refresh local state
    const tradesToLoad = currentUser.role === UserRole.ADMIN 
      ? allStored 
      : allStored.filter(t => t.userId === currentUser.id);

    setTrades(tradesToLoad);
    setSelectedTrade(updatedTrade);
    setEditingTrade(null);
  };

  const handleDeleteTrade = (id: string) => {
    if (!currentUser) return;
    const allStored = getStoredTrades();
    const tradeToDelete = allStored.find(t => t.id === id);
    if (!tradeToDelete) return;

    // Check ownership if not admin
    if (currentUser.role !== UserRole.ADMIN && tradeToDelete.userId !== currentUser.id) return;

    const filteredStored = allStored.filter(t => t.id !== id);
    saveTrades(filteredStored);
    
    // Refresh local state
    const tradesToLoad = currentUser.role === UserRole.ADMIN 
      ? filteredStored 
      : filteredStored.filter(t => t.userId === currentUser.id);

    setTrades(tradesToLoad);
    setSelectedTrade(null);
  };

  const handleExport = () => {
    if (currentUser) {
      exportTradesToCSV(trades);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppUser(null);
    setActiveTab('dashboard');
  };

  // --- Render Flow Logic ---
  if (!currentUser) {
    return <AuthView onAuthComplete={setAppUser} />;
  }

  // Admin always bypasses verification flow
  if (currentUser.role !== UserRole.ADMIN) {
    if (currentUser.status === UserStatus.PENDING) {
      return <PaymentView user={currentUser} onPaymentSubmitted={() => setAppUser({...currentUser, status: UserStatus.WAITING_APPROVAL})} />;
    }

    if (currentUser.status === UserStatus.WAITING_APPROVAL || currentUser.status === UserStatus.REJECTED) {
      return <UserVerificationStatus user={currentUser} onLogout={handleLogout} onRetry={() => setAppUser({...currentUser, status: UserStatus.PENDING})} />;
    }
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Tabs list for navigation
  const navItems = [
    { id: 'dashboard' as Tab, label: 'Performance', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> },
    { id: 'journal' as Tab, label: 'Trade Logs', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> },
    { id: 'analysis' as Tab, label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> },
    { id: 'mistakes' as Tab, label: 'Discipline', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: 'emotions' as Tab, label: 'Psychology', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> },
    { id: 'insights' as Tab, label: 'AI Coach', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
    ...(isAdmin ? [
      { id: 'admin' as Tab, label: 'Admin Hub', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200">
      {/* Desktop Sidebar */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-[#0a0f1d] border-r border-[#1e293b] hidden md:flex flex-col z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20">T</div>
          <span className="font-bold text-xl tracking-tight text-white">TradeMind <span className="text-emerald-500">AI</span></span>
        </div>

        <div className="mt-6 flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-slate-500 hover:bg-[#111827]'}`}>
              {item.icon} <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[#1e293b] space-y-2">
          {isAdmin ? (
             <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center">Master Controller Mode</p>
             </div>
          ) : (
            <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-4">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">Personal Terminal Active</p>
            </div>
          )}
          
          <button onClick={handleLogout} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-red-500 mb-4 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout Terminal
          </button>
          
          <button onClick={handleExport} className="w-full bg-[#111827] hover:bg-[#1e293b] text-slate-300 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-[#1e293b]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span className="text-xs">Export CSV</span>
          </button>
          <button onClick={() => { setEditingTrade(null); setShowEntryForm(true); }} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Log Trade</span>
          </button>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 w-full h-16 bg-[#0a0f1d] border-b border-[#1e293b] flex items-center justify-between px-4 z-40 md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-lg">T</div>
          <span className="font-bold text-lg tracking-tight text-white">TradeMind <span className="text-emerald-500">AI</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="text-slate-500 p-2 hover:text-red-500 transition-colors" title="Logout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
          <button onClick={() => { setEditingTrade(null); setShowEntryForm(true); }} className="bg-emerald-500 p-2 rounded-lg text-slate-900 shadow-lg shadow-emerald-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full h-20 bg-[#0a0f1d] border-t border-[#1e293b] flex md:hidden items-center px-1 z-40 overflow-x-auto no-scrollbar">
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all min-w-[75px] h-full ${
              activeTab === item.id ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-black uppercase tracking-widest text-center">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="md:pl-64 pt-20 md:pt-6 pb-24 md:pb-6 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white capitalize tracking-tight">
                {activeTab === 'admin' ? 'System Console' : `${activeTab} Summary`}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {isAdmin 
                  ? 'Platform-wide oversight and performance auditing.' 
                  : `Terminal Session: ${currentUser.name}`}
              </p>
            </div>
            {/* Quick Desktop Logout Header Button */}
            <div className="hidden md:block">
               <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Exit Session
               </button>
            </div>
          </header>

          <div className="pb-12">
            {activeTab === 'dashboard' && <Dashboard trades={trades} />}
            {activeTab === 'journal' && <TradeList trades={trades} onSelect={setSelectedTrade} isAdmin={isAdmin} />}
            {activeTab === 'analysis' && <AnalysisView trades={trades} />}
            {activeTab === 'mistakes' && <MistakesView trades={trades} />}
            {activeTab === 'emotions' && <EmotionsView trades={trades} />}
            {activeTab === 'insights' && <AIInsightsView trades={trades} />}
            {activeTab === 'admin' && isAdmin && <AdminView onLogout={handleLogout} />}
          </div>
        </div>
      </main>

      {/* Overlays */}
      {showEntryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <TradeEntryForm initialTrade={editingTrade || undefined} onAdd={editingTrade ? handleUpdateTrade : handleAddTrade} onCancel={() => { setShowEntryForm(false); setEditingTrade(null); }} />
          </div>
        </div>
      )}

      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto">
            <TradeDetail 
              trade={selectedTrade} 
              onUpdate={handleUpdateTrade} 
              onEdit={(t) => { setEditingTrade(t); setShowEntryForm(true); setSelectedTrade(null); }} 
              onDelete={handleDeleteTrade} 
              onClose={() => setSelectedTrade(null)} 
              isAdmin={isAdmin}
              currentUserId={currentUser.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
