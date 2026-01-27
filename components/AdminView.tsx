
import React, { useMemo, useState, useEffect } from 'react';
import { getRegisteredUsers, getStoredTrades, saveUsers, updateUserStatus, registerUser, exportMasterDB, getMasterSyncString, importFromSyncString, exportUsersToCSV, getTransactions } from '../services/storageService';
import { User, UserRole, UserStatus, Trade, PlanType, Transaction } from '../types';
import { initializeGoogleSync, authenticateCloud, syncToCloud, restoreFromCloud, checkCloudVaultStatus } from '../services/googleDriveService';

type AdminTab = 'overview' | 'ledger' | 'registry' | 'sync';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncStr, setSyncStr] = useState('');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [cloudInfo, setCloudInfo] = useState<{ hasNewer: boolean, lastModified?: string } | null>(null);
  const [lastLocalSync, setLastLocalSync] = useState<string | null>(localStorage.getItem('tm_last_cloud_sync'));

  useEffect(() => {
    setUsers(getRegisteredUsers());
    setAllTrades(getStoredTrades());
    setTransactions(getTransactions());
  }, [activeSubTab]);

  useEffect(() => {
    const checkCloud = async () => {
      const status = await checkCloudVaultStatus();
      if (status) setCloudInfo(status);
    };
    checkCloud();
    const interval = setInterval(checkCloud, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = transactions.reduce((acc, tx) => acc + tx.amount, 0);
    const paidUsers = users.filter(u => u.isPaid).length;
    return {
      totalUsers: users.length,
      paidUsers,
      totalTrades: allTrades.length,
      totalRevenue,
      conversionRate: users.length > 1 ? ((paidUsers / (users.length - 1)) * 100).toFixed(1) : '0'
    };
  }, [users, allTrades, transactions]);

  const handleStatusChange = (userId: string, status: UserStatus) => {
    updateUserStatus(userId, status);
    setUsers(getRegisteredUsers());
  };

  const handleCloudBackup = async () => {
    setIsCloudLoading(true);
    try {
      await initializeGoogleSync();
      await authenticateCloud();
      const success = await syncToCloud();
      if (success) {
        setLastLocalSync(new Date().toISOString());
        setCloudInfo(prev => prev ? { ...prev, hasNewer: false } : null);
        alert('Vault successfully uploaded to Google Drive.');
      }
    } catch (err) {
      console.error(err);
      alert('Cloud Sync Failed.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!window.confirm('OVERWRITE all data with Cloud Vault?')) return;
    setIsCloudLoading(true);
    try {
      await initializeGoogleSync();
      await authenticateCloud();
      const success = await restoreFromCloud();
      if (success) {
        alert('Terminal State Restored!');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Cloud Restore Failed.');
    } finally {
      setIsCloudLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex bg-[#0a0f1d] p-1 rounded-2xl border border-[#1e293b] overflow-x-auto no-scrollbar items-center">
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Console', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
            { id: 'ledger', label: 'Ledger', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'registry', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'sync', label: 'Sync', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as AdminTab)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${activeSubTab === item.id ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Net Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} color="text-emerald-400" />
          <MetricCard label="Pro Traders" value={stats.paidUsers} color="text-blue-400" />
          <MetricCard label="System Trades" value={stats.totalTrades} color="text-orange-400" />
          <MetricCard label="Conversion" value={`${stats.conversionRate}%`} color="text-purple-400" />
        </div>
      )}

      {activeSubTab === 'ledger' && (
        <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-[#1e293b]">
            <h3 className="text-xl font-black text-white">Payment Ledger</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Direct credits to Mangesh Potale</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase border-b border-[#1e293b]">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-600 font-black uppercase opacity-40">No credits detected.</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-[#1e293b] hover:bg-[#111827]">
                    <td className="px-6 py-4 font-mono text-[9px] text-purple-400">{tx.id.substring(0,8)}...</td>
                    <td className="px-6 py-4 text-white font-bold text-xs">{tx.userName}</td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black uppercase text-slate-500">{tx.method}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[10px]">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-400">₹{tx.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'registry' && (
        <div className="bg-[#0e1421] border border-[#1e293b] rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-[#1e293b] flex justify-between items-center">
            <h3 className="text-xl font-black text-white">User Registry</h3>
            <button onClick={() => exportUsersToCSV(users)} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-black text-[9px] uppercase tracking-widest">Extract Registry</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase border-b border-[#1e293b]">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[#1e293b] hover:bg-[#111827]">
                    <td className="px-6 py-4 font-mono text-[10px] text-purple-400">{user.displayId}</td>
                    <td className="px-6 py-4 text-white font-bold text-xs">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {user.isPaid ? 'PRO' : 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleStatusChange(user.id, user.status === UserStatus.APPROVED ? UserStatus.PENDING : UserStatus.APPROVED)} className="text-emerald-400 text-[9px] font-black uppercase hover:underline">Toggle Access</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'sync' && (
        <div className="space-y-8">
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-10 rounded-[3rem]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white">Cloud Backup</h3>
                <p className="text-slate-400 text-[11px] max-w-md">Securely sync all users, trades, and transactions to the Merchant Cloud Vault.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleCloudBackup} disabled={isCloudLoading} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-5 rounded-2xl text-[10px] uppercase shadow-2xl">Push to Cloud</button>
                <button onClick={handleCloudRestore} disabled={isCloudLoading} className="bg-[#1e293b] text-white font-black px-8 py-5 rounded-2xl text-[10px] uppercase border border-[#334155]">Restore Vault</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ label, value, color }: any) => (
  <div className="bg-[#0e1421] p-6 rounded-[2rem] border border-[#1e293b] flex flex-col justify-center min-h-[140px]">
    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{label}</span>
    <div className={`text-4xl font-black font-mono tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default AdminView;
