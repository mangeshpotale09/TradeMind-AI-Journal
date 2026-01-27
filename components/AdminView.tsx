
import React, { useMemo, useState, useEffect } from 'react';
import { getRegisteredUsers, getStoredTrades, saveUsers, updateUserStatus, registerUser, exportMasterDB, importMasterDB, getMasterSyncString, importFromSyncString, exportUsersToCSV } from '../services/storageService';
import { User, UserRole, UserStatus, Trade, PlanType } from '../types';
import { initializeGoogleSync, authenticateCloud, syncToCloud, restoreFromCloud } from '../services/googleDriveService';
import TradeList from './TradeList';
import TradeDetail from './TradeDetail';

type AdminTab = 'overview' | 'verifications' | 'registry' | 'sync';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [selectedProof, setSelectedProof] = useState<{ user: User, img: string } | null>(null);
  const [syncStr, setSyncStr] = useState('');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'connected' | 'error'>('idle');

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

  const handleCloudBackup = async () => {
    setIsCloudLoading(true);
    try {
      await initializeGoogleSync();
      await authenticateCloud();
      const success = await syncToCloud();
      if (success) {
        setCloudStatus('connected');
        alert('Vault successfully uploaded to Google Drive.');
      }
    } catch (err) {
      console.error(err);
      setCloudStatus('error');
      alert('Cloud Sync Failed. Check if API key supports Drive permissions.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!window.confirm('This will OVERWRITE all data on this laptop with the Cloud Vault. Continue?')) return;
    setIsCloudLoading(true);
    try {
      await initializeGoogleSync();
      await authenticateCloud();
      const success = await restoreFromCloud();
      if (success) {
        alert('Terminal State Restored! Reloading...');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Cloud Restore Failed. No vault found or permission denied.');
    } finally {
      setIsCloudLoading(false);
    }
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
            {pendingUsers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-600 font-black uppercase tracking-widest opacity-40">Queue is empty. No pending verifications.</div>
            ) : pendingUsers.map(user => (
              <div key={user.id} className="bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                <div className="font-black text-white">{user.name}</div>
                <img 
                  src={user.paymentScreenshot} 
                  className="rounded-xl border border-[#1e293b] h-32 w-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                  alt="Proof" 
                  onClick={() => setSelectedProof({ user, img: user.paymentScreenshot! })}
                />
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
            <button 
              onClick={() => exportUsersToCSV(users)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-black text-[9px] uppercase tracking-widest hover:bg-blue-500/20 transition-all shadow-lg"
            >
              Extract Registry
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase border-b border-[#1e293b]">
                  <th className="px-6 py-4">Identity ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Proof</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[#1e293b] hover:bg-[#111827] transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-purple-400 font-bold">{user.displayId}</td>
                    <td className="px-6 py-4 text-white font-bold text-xs">{user.name}</td>
                    <td className="px-6 py-4 flex justify-center">
                      {user.paymentScreenshot ? (
                        <div 
                          onClick={() => setSelectedProof({ user, img: user.paymentScreenshot! })}
                          className="w-10 h-10 rounded-lg border border-[#1e293b] overflow-hidden cursor-zoom-in bg-[#070a13]"
                        >
                          <img src={user.paymentScreenshot} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      ) : <span className="text-slate-700">--</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.status === UserStatus.APPROVED ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleStatusChange(user.id, user.status === UserStatus.APPROVED ? UserStatus.PENDING : UserStatus.APPROVED)} className={`${user.status === UserStatus.APPROVED ? 'text-red-400' : 'text-emerald-400'} text-[9px] font-black uppercase hover:underline`}>
                        {user.status === UserStatus.APPROVED ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'sync' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-emerald-400">Google Cloud Vault</h3>
              <p className="text-slate-400 text-[11px] max-w-md font-medium">Recommended for multi-device sync. Securely backup the entire terminal state (Users + Trades) to your private Google Drive.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleCloudBackup} 
                disabled={isCloudLoading}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl transition-all disabled:opacity-50"
              >
                {isCloudLoading ? 'Vaulting...' : 'Backup to Drive'}
              </button>
              <button 
                onClick={handleCloudRestore} 
                disabled={isCloudLoading}
                className="flex-1 md:flex-none bg-[#1e293b] hover:bg-[#334155] text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 border border-emerald-500/20"
              >
                Restore Vault
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0e1421] border border-[#1e293b] p-8 rounded-3xl space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Manual Key Bridge</h4>
              <p className="text-slate-500 text-[11px]">One-time transfer via clipboard. Best for small registries.</p>
              <button onClick={handleCopySyncString} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl transition-all">Copy Master Sync Key</button>
            </div>

            <div className="bg-[#0e1421] border border-[#1e293b] p-8 rounded-3xl space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-widest">Receive Key</h4>
              <textarea 
                value={syncStr} 
                onChange={(e) => setSyncStr(e.target.value)}
                placeholder="Paste Master Key..."
                className="w-full h-24 bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 text-[10px] text-purple-400 font-mono focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button onClick={handleClipboardImport} className="w-full bg-blue-500 hover:bg-blue-400 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">Import Key</button>
            </div>
          </div>
          
          <div className="bg-[#0e1421] border border-[#1e293b] p-8 rounded-3xl">
             <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Hard Backup (File)</h4>
             <p className="text-slate-500 text-[11px] mb-6">Download the raw JSON database for offline archiving.</p>
             <button onClick={exportMasterDB} className="bg-[#1e293b] hover:bg-[#334155] text-slate-200 font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest border border-[#334155] transition-all">Download Master DB (.json)</button>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-4xl max-h-[90vh] flex flex-col items-center gap-6">
              <div className="flex justify-between items-center w-full px-4">
                 <div className="space-y-1 text-left">
                    <h3 className="text-white font-black text-lg">Transaction Evidence: {selectedProof.user.name}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">ID: {selectedProof.user.displayId}</p>
                 </div>
                 <button onClick={() => setSelectedProof(null)} className="p-2 text-slate-400 hover:text-white transition-colors bg-[#1e293b] rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
              <div className="flex-1 w-full bg-[#0a0f1d] border border-[#1e293b] rounded-[3rem] overflow-hidden flex items-center justify-center relative">
                 <img src={selectedProof.img} alt="Payment Receipt" className="max-w-full max-h-[70vh] object-contain shadow-2xl" />
              </div>
              <div className="flex gap-4 w-full justify-center">
                 {selectedProof.user.status !== UserStatus.APPROVED && (
                    <button onClick={() => handleStatusChange(selectedProof.user.id, UserStatus.APPROVED)} className="bg-emerald-500 text-slate-900 font-black px-12 py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl">Approve</button>
                 )}
                 <button onClick={() => setSelectedProof(null)} className="bg-[#1e293b] text-white font-black px-12 py-4 rounded-2xl text-[11px] uppercase tracking-widest">Close</button>
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
