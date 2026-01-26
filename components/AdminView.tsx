
import React, { useMemo, useState, useEffect } from 'react';
import { getRegisteredUsers, getStoredTrades, saveUsers, updateUserStatus } from '../services/storageService';
import { User, UserRole, UserStatus, Trade, PlanType } from '../types';
import TradeList from './TradeList';
import TradeDetail from './TradeDetail';

type AdminTab = 'overview' | 'verifications' | 'registry' | 'global_logs';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [selectedProof, setSelectedProof] = useState<{ user: User, img: string } | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    setUsers(getRegisteredUsers());
    setAllTrades(getStoredTrades());
  }, [activeSubTab]);

  const stats = useMemo(() => {
    const paidUsers = users.filter(u => u.isPaid).length;
    const pendingApprovals = users.filter(u => u.status === UserStatus.WAITING_APPROVAL).length;
    
    return {
      totalUsers: users.length,
      paidUsers,
      pendingApprovals,
      totalTrades: allTrades.length,
      conversionRate: users.length > 1 ? ((paidUsers / (users.length - 1)) * 100).toFixed(1) : '0'
    };
  }, [users, allTrades]);

  const handleStatusChange = (userId: string, status: UserStatus) => {
    updateUserStatus(userId, status);
    const updatedUsers = getRegisteredUsers();
    setUsers(updatedUsers);
    if (selectedProof?.user.id === userId) {
      setSelectedProof(null);
    }
  };

  const handleToggleRole = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, role: u.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN };
      }
      return u;
    });
    setUsers(updated);
    saveUsers(updated);
  };

  const pendingUsers = users.filter(u => u.status === UserStatus.WAITING_APPROVAL);

  const subNavItems: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Console Home', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg> },
    { id: 'verifications', label: 'Verify Payments', count: pendingUsers.length, icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> },
    { id: 'registry', label: 'Registered User Data', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> },
    { id: 'global_logs', label: 'Global Trade Audit', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex bg-[#0a0f1d] p-1 rounded-2xl border border-[#1e293b] overflow-x-auto no-scrollbar items-center">
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {subNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
                activeSubTab === item.id 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.icon}
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeSubTab === item.id ? 'bg-purple-500 text-white' : 'bg-orange-500 text-white animate-pulse'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button 
          onClick={onLogout}
          className="ml-4 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          System Exit
        </button>
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Registry" value={stats.totalUsers} color="text-blue-400" />
            <MetricCard label="Pro Traders" value={stats.paidUsers} color="text-emerald-400" />
            <MetricCard label="System Trades" value={stats.totalTrades} color="text-orange-400" />
            <MetricCard label="Conversion" value={`${stats.conversionRate}%`} color="text-purple-400" />
          </div>

          <div className="bg-[#0e1421] p-12 rounded-[2.5rem] border border-[#1e293b] text-center space-y-6">
             <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             </div>
             <h2 className="text-3xl font-black text-white tracking-tight">System Authority Enabled</h2>
             <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed font-medium">
               Master Control Active: You have system-wide visibility of all identities and trade data. Oversee platform-wide discipline and verify transaction authenticity from this terminal.
             </p>
             <div className="flex justify-center gap-4 pt-4">
                <button onClick={() => setActiveSubTab('global_logs')} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all">Audit Global Logs</button>
             </div>
          </div>
        </div>
      )}

      {activeSubTab === 'verifications' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 bg-orange-500/5 flex items-center justify-between border-b border-[#1e293b]">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${pendingUsers.length > 0 ? 'bg-orange-500 text-slate-900 animate-pulse' : 'bg-[#1e293b] text-slate-500'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Payment Proof Queue</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Awaiting system activation ({pendingUsers.length} subjects)</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {pendingUsers.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-600">
                  <svg className="w-20 h-20 opacity-5 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span className="font-black uppercase text-[12px] tracking-widest">Verification queue is clear</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pendingUsers.map(user => (
                    <div key={user.id} className="bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 space-y-6 hover:border-orange-500/30 transition-all group">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-black text-white text-lg">{user.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{user.email}</div>
                          <div className="text-[9px] font-black text-orange-400 mt-1">PLAN: {user.selectedPlan}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">{user.displayId || 'NO-ID'}</div>
                          {user.referredBy && (
                             <div className="text-[9px] font-black text-blue-400 mt-1 uppercase">USED REF: {user.referredBy}</div>
                          )}
                        </div>
                      </div>
                      <div 
                        onClick={() => setSelectedProof({ user, img: user.paymentScreenshot! })}
                        className="aspect-video bg-[#070a13] rounded-2xl overflow-hidden cursor-zoom-in border border-[#1e293b] relative group/img"
                      >
                        <img src={user.paymentScreenshot} alt="Proof" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                          <span className="bg-white text-slate-900 font-black text-[10px] px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl">Audit Proof</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleStatusChange(user.id, UserStatus.APPROVED)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10">Approve</button>
                        <button onClick={() => handleStatusChange(user.id, UserStatus.REJECTED)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest border border-red-500/20">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'registry' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-[#1e293b] bg-[#0a0f1d]/50">
              <h3 className="text-2xl font-black text-white">Subject Identity & Rewards Audit</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Full registry analysis including referral eligibility for 10% renewal offer.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0a0f1d] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-[#1e293b]">
                    <th className="px-6 py-6">User ID</th>
                    <th className="px-6 py-6">Subject Identity</th>
                    <th className="px-6 py-6">Rewards Status</th>
                    <th className="px-6 py-6">Plan</th>
                    <th className="px-6 py-6">Reg. Date</th>
                    <th className="px-6 py-6">Payment Proof</th>
                    <th className="px-6 py-6">Amt Paid</th>
                    <th className="px-6 py-6">Expiry</th>
                    <th className="px-6 py-6">Status</th>
                    <th className="px-6 py-6 text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-[#111827] transition-colors group">
                      <td className="px-6 py-6">
                        <div className="text-xs font-mono font-black text-emerald-400">{user.displayId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-white/5 shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="font-black text-slate-200">
                            {user.name}
                            <div className="text-[9px] text-slate-500 font-medium normal-case">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">REF: {user.ownReferralCode}</div>
                          {user.hasReferralDiscount && (
                            <span className="w-fit bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap">
                              10% OFF ELIGIBLE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{user.selectedPlan || 'NONE'}</div>
                      </td>
                      <td className="px-6 py-6 text-xs text-slate-400 font-mono font-bold">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-6">
                        {user.paymentScreenshot ? (
                           <button 
                             onClick={() => setSelectedProof({ user, img: user.paymentScreenshot! })}
                             className="w-10 h-10 rounded-lg overflow-hidden border border-[#1e293b] hover:border-emerald-500/50 transition-all bg-[#070a13] group/btn relative"
                           >
                             <img src={user.paymentScreenshot} alt="Proof thumb" className="w-full h-full object-cover group-hover/btn:opacity-50" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                               <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                             </div>
                           </button>
                        ) : (
                          <span className="text-[10px] font-black text-slate-600 uppercase italic">No Proof</span>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className={`text-sm font-mono font-black ${user.amountPaid && user.amountPaid > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                          ₹{user.amountPaid?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className={`text-xs font-mono font-bold ${user.expiryDate === 'Lifetime' ? 'text-purple-400' : 'text-slate-400'}`}>
                          {user.expiryDate || '--'}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border ${
                          user.status === UserStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          user.status === UserStatus.WAITING_APPROVAL ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          user.status === UserStatus.REJECTED ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <button onClick={() => handleToggleRole(user.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${user.role === UserRole.ADMIN ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {user.role}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'global_logs' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-[#1e293b] bg-[#0a0f1d]/50">
                <h3 className="text-2xl font-black text-white">Global Trade Repository</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Cross-platform trade auditing and inspection</p>
              </div>
              <div className="p-0">
                <TradeList trades={allTrades} onSelect={setSelectedTrade} isAdmin={true} />
              </div>
           </div>
        </div>
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-12 animate-in fade-in duration-300" onClick={() => setSelectedProof(null)}>
          <div className="w-full max-w-6xl bg-[#0e1421] rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex-1 bg-[#070a13] p-6 flex items-center justify-center overflow-hidden">
              <img src={selectedProof.img} alt="Proof Large" className="max-w-full max-h-full object-contain shadow-2xl rounded-xl" />
            </div>
            <div className="w-full md:w-96 bg-[#0e1421] border-l border-[#1e293b] p-10 flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject Full Name</h4>
                  <p className="text-2xl font-black text-white">{selectedProof.user.name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Registry Subject ID</h4>
                  <p className="text-xs font-mono text-slate-300 break-all bg-[#0a0f1d] p-3 rounded-xl border border-[#1e293b]">{selectedProof.user.id}</p>
                </div>
              </div>
              <div className="space-y-4 pt-10">
                <button onClick={() => handleStatusChange(selectedProof.user.id, UserStatus.APPROVED)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all text-xs uppercase tracking-widest">Verify & Approve</button>
                <button onClick={() => handleStatusChange(selectedProof.user.id, UserStatus.REJECTED)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black py-5 rounded-2xl border border-red-500/20 transition-all text-xs uppercase tracking-widest">Decline Proof</button>
                <button onClick={() => setSelectedProof(null)} className="w-full bg-[#1e293b] hover:bg-[#2d3a4f] text-slate-300 font-black py-5 rounded-2xl transition-all text-xs uppercase tracking-widest border border-white/5">Cancel Audit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelectedTrade(null)}>
          <div className="w-full max-w-5xl my-auto" onClick={e => e.stopPropagation()}>
            <TradeDetail 
              trade={selectedTrade} 
              onUpdate={(updated) => {
                const updatedTrades = allTrades.map(t => t.id === updated.id ? updated : t);
                setAllTrades(updatedTrades);
                setSelectedTrade(updated);
              }} 
              onEdit={(t) => setSelectedTrade(null)} 
              onDelete={(id) => {
                setAllTrades(allTrades.filter(t => t.id !== id));
                setSelectedTrade(null);
              }} 
              onClose={() => setSelectedTrade(null)} 
              isAdmin={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, color }: any) => (
  <div className="bg-[#0e1421] p-6 rounded-[2rem] border border-[#1e293b] shadow-lg transition-all hover:border-white/10 group flex flex-col justify-center min-h-[140px]">
    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-slate-400 transition-colors mb-2">{label}</span>
    <div className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default AdminView;
