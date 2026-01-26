
import React, { useMemo, useState, useEffect } from 'react';
import { getRegisteredUsers, getStoredTrades, saveUsers, updateUserStatus, registerUser, exportMasterDB, importMasterDB, getMasterSyncString, importFromSyncString } from '../services/storageService';
import { User, UserRole, UserStatus, Trade, PlanType } from '../types';
import TradeList from './TradeList';
import TradeDetail from './TradeDetail';

type AdminTab = 'overview' | 'verifications' | 'registry' | 'global_logs' | 'sync';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [selectedProof, setSelectedProof] = useState<{ user: User, img: string } | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showManualRegister, setShowManualRegister] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [syncStr, setSyncStr] = useState('');

  useEffect(() => {
    setUsers(getRegisteredUsers());
    setAllTrades(getStoredTrades());
  }, [activeSubTab]);

  const stats = useMemo(() => {
    const paidUsers = users.filter(u => u.isPaid).length;
    return {
      totalUsers: users.length,
      paidUsers,
      totalTrades: allTrades.length,
      conversionRate: users.length > 1 ? ((paidUsers / (users.length - 1)) * 100).toFixed(1) : '0'
    };
  }, [users, allTrades]);

  const handleStatusChange = (userId: string, status: UserStatus) => {
    updateUserStatus(userId, status);
    setUsers(getRegisteredUsers());
    if (selectedProof?.user.id === userId) setSelectedProof(null);
  };

  const handleToggleRole = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) return { ...u, role: u.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN };
      return u;
    });
    setUsers(updated);
    saveUsers(updated);
  };

  const handleManualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = registerUser({ name: 'Manual Subject', email: 'manual@subject.ai', password: 'password', selectedPlan: PlanType.ANNUAL });
    updateUserStatus(newUser.id, UserStatus.APPROVED);
    setUsers(getRegisteredUsers());
    setShowManualRegister(false);
  };

  const handleClipboardImport = () => {
    if (!syncStr) return;
    if (window.confirm('This will OVERWRITE all data on this laptop. Proceed?')) {
      const success = importFromSyncString(syncStr);
      if (success) {
        alert('Terminal Synced successfully.');
        window.location.reload();
      } else {
        alert('Invalid Sync Key.');
      }
    }
  };

  const handleCopySyncString = () => {
    const str = getMasterSyncString();
    navigator.clipboard.writeText(str);
    alert('Master Sync Key copied to clipboard! Paste this on the other laptop.');
  };

  const pendingUsers = users.filter(u => u.status === UserStatus.WAITING_APPROVAL);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Navigation */}
      <div className="flex bg-[#0a0f1d] p-1 rounded-2xl border border-[#1e293b] overflow-x-auto no-scrollbar items-center">
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Console', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
            { id: 'verifications', label: 'Verify', count: pendingUsers.length, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'registry', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'sync', label: 'Sync Laptop', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as AdminTab)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeSubTab === item.id ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
              {item.count !== undefined && item.count > 0 && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white">{item.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Registry" value={stats.totalUsers} color="text-blue-400" />
          <MetricCard label="Pro Traders" value={stats.paidUsers} color="text-emerald-400" />
          <MetricCard label="System Trades" value={stats.totalTrades} color="text-orange-400" />
          <MetricCard label="Conversion" value={`${stats.conversionRate}%`} color="text-purple-400" />
        </div>
      )}

      {activeSubTab === 'verifications' && (
        <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl p-8">
          <h3 className="text-xl font-black text-white mb-6">Queue for Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                <div className="font-black text-white">{user.name}</div>
                <img src={user.paymentScreenshot} className="rounded-xl border border-[#1e293b] h-32 w-full object-cover" alt="Proof" />
                <div className="flex gap-2">
                  <button onClick={() => handleStatusChange(user.id, UserStatus.APPROVED)} className="flex-1 bg-emerald-500 text-slate-900 font-black py-3 rounded-xl text-[10px] uppercase">Approve</button>
                  <button onClick={() => handleStatusChange(user.id, UserStatus.REJECTED)} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl text-[10px] uppercase">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'registry' && (
        <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-[#1e293b] flex justify-between items-center">
            <h3 className="text-xl font-black text-white">Full User Registry</h3>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0a0f1d] text-slate-500 text-[10px] font-black uppercase border-b border-[#1e293b]">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[#1e293b]">
                  <td className="px-6 py-4 text-white font-bold">{user.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${user.status === UserStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status !== UserStatus.APPROVED ? (
                      <button onClick={() => handleStatusChange(user.id, UserStatus.APPROVED)} className="text-emerald-400 text-[10px] font-black uppercase">Grant Pro Access</button>
                    ) : (
                      <button onClick={() => handleStatusChange(user.id, UserStatus.PENDING)} className="text-red-400 text-[10px] font-black uppercase">Revoke Access</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'sync' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          {/* Multi-Device Guide */}
          <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-[2.5rem] space-y-4">
            <h3 className="text-xl font-black text-blue-400">Step-by-Step: Link Another Laptop</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
              <div className="space-y-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-slate-900 flex items-center justify-center font-black">1</span>
                <p className="font-bold text-slate-200 uppercase tracking-tighter">On THIS Laptop:</p>
                <p className="text-slate-400 font-medium">Click "Copy Master Sync Key". This copies the entire user registry and all trades into your clipboard.</p>
              </div>
              <div className="space-y-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-slate-900 flex items-center justify-center font-black">2</span>
                <p className="font-bold text-slate-200 uppercase tracking-tighter">On THE OTHER Laptop:</p>
                <p className="text-slate-400 font-medium">Open the project URL. Login as Admin. Go to this "Sync Laptop" tab.</p>
              </div>
              <div className="space-y-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-slate-900 flex items-center justify-center font-black">3</span>
                <p className="font-bold text-slate-200 uppercase tracking-tighter">Finalize Link:</p>
                <p className="text-slate-400 font-medium">Paste the key into the box below and click "Import Master Key". Both laptops are now synchronized.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0e1421] border border-[#1e293b] p-8 rounded-3xl space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">A. Share Terminal State</h4>
              <p className="text-slate-500 text-[11px]">Generate a master sync key to move your admin registry to a different device.</p>
              <button onClick={handleCopySyncString} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl transition-all">Copy Master Sync Key</button>
            </div>

            <div className="bg-[#0e1421] border border-[#1e293b] p-8 rounded-3xl space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">B. Receive Terminal State</h4>
              <textarea 
                value={syncStr} 
                onChange={(e) => setSyncStr(e.target.value)}
                placeholder="Paste the Sync Key from the other laptop here..."
                className="w-full h-32 bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 text-[10px] text-purple-400 font-mono focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button onClick={handleClipboardImport} className="w-full bg-blue-500 hover:bg-blue-400 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">Import Master Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, color }: any) => (
  <div className="bg-[#0e1421] p-6 rounded-[2rem] border border-[#1e293b] shadow-lg flex flex-col justify-center min-h-[140px]">
    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{label}</span>
    <div className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default AdminView;
