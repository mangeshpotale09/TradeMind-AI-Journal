import React, { useState, useEffect } from 'react';
import { Trade, User, UserRole, UserStatus, PlanType } from './types';
import { 
  getStoredTrades, 
  saveTrade,
  deleteTradeFromDB,
  exportTradesToCSV, 
  getCurrentUser, 
  setCurrentUser
} from './services/storageService';
import { supabase } from './services/supabaseClient';

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

const App: React.FC = () => {
  const [currentUser, setAuthUser] = useState<User | null>(getCurrentUser());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'analysis' | 'mistakes' | 'emotions' | 'ai' | 'admin'>('dashboard');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const initTerminal = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            const mapped: User = { 
              ...profile, 
              displayId: profile.display_id, 
              joinedAt: profile.joined_at, 
              isPaid: profile.is_paid, 
              selectedPlan: profile.selected_plan, 
              ownReferralCode: profile.own_referral_code, 
              expiryDate: profile.expiry_date 
            };
            setAuthUser(mapped);
            setCurrentUser(mapped);
          }
        }
      } catch (err) {
        console.error("Terminal sync failed:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    initTerminal();

    // Listen for auth changes globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          const mapped: User = { 
            ...profile, 
            displayId: profile.display_id, 
            joinedAt: profile.joined_at, 
            isPaid: profile.is_paid, 
            selectedPlan: profile.selected_plan, 
            ownReferralCode: profile.own_referral_code, 
            expiryDate: profile.expiry_date 
          };
          setAuthUser(mapped);
          setCurrentUser(mapped);
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setCurrentUser(null);
        setTrades([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadTrades();
    }
  }, [currentUser]);

  const loadTrades = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const tradesToLoad = await getStoredTrades(currentUser.id);
      setTrades(tradesToLoad);
    } catch (err) {
      console.error("Failed to load trades from Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Sign out from secure terminal?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
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
      alert("Failed to sync execution to cloud.");
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
      alert("Update synchronization failed.");
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
      alert("Failed to purge record from cloud.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Initializing Secure Protocol...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onAuthComplete={(user) => { setAuthUser(user); setCurrentUser(user); }} />;
  }

  const renderContent = () => {
    if (isLoading && trades.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Scanning Global Tape...</p>
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
      case 'admin': return <AdminView onLogout={handleLogout} />;
      default: return <Dashboard trades={trades} />;
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
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1421]/80 backdrop-blur-xl border border-[#1e293b] p-2 rounded-3xl shadow-2xl flex items-center gap-1 md:gap-2">
        {navigationItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all relative ${activeTab === tab.id ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-200'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path></svg>
            <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
        <div className="w-px h-6 bg-[#1e293b] mx-1"></div>
        <button onClick={handleLogout} className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all" title="Sign Out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">{currentUser.displayId}</span>
               <span className="text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Secure Node
               </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              TradeMind <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Terminal</span>
            </h1>
          </div>
          
          <button 
            onClick={() => setIsEntryFormOpen(true)}
            className="group relative inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-emerald-500/20 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            <span className="text-xs uppercase tracking-[0.2em]">Log Execution</span>
          </button>
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
