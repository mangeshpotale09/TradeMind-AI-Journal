
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { authenticateGoogle, saveToDrive, isAuthenticated, initGoogleApi } from '../services/googleDriveService';
import { calculatePnL } from '../services/storageService';

interface DataHubProps {
  trades: Trade[];
}

const CLIENT_ID_STORAGE_KEY = 'trademind_google_client_id';

const DataHub: React.FC<DataHubProps> = ({ trades }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [clientId, setClientId] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (savedId) {
      setClientId(savedId);
    } else {
      setIsConfiguring(true);
    }
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    setIsConfiguring(false);
  };

  const handleBackup = async () => {
    if (!clientId) {
      setErrorMessage("Please configure your Google Client ID first.");
      setStatus('error');
      setIsConfiguring(true);
      return;
    }

    setStatus('loading');
    try {
      await initGoogleApi();
      if (!isAuthenticated()) {
        await authenticateGoogle(clientId);
      }

      const backupData = JSON.stringify(trades, null, 2);
      await saveToDrive('TradeMind_Backup.json', backupData);
      
      const report = generateMarkdownReport(trades);
      await saveToDrive('Trading_Performance_Report.md', report, 'text/markdown');

      setStatus('success');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      // Handle "Requested entity was not found" or Auth errors
      if (err.error === 'popup_closed_by_user') {
        setErrorMessage('Authentication window was closed before completion.');
      } else {
        setErrorMessage(err.message || 'Failed to sync with Google Drive. Verify your Client ID and API permissions.');
      }
    }
  };

  const generateMarkdownReport = (trades: Trade[]) => {
    const closed = trades.filter(t => t.status === 'CLOSED');
    const totalNet = closed.reduce((acc, t) => acc + calculatePnL(t), 0);
    const totalBrokerage = closed.reduce((acc, t) => acc + t.fees, 0);
    const winRate = closed.length > 0 ? (closed.filter(t => calculatePnL(t) > 0).length / closed.length * 100).toFixed(1) : 0;
    
    return `# TradeMind AI Performance Report\n` +
           `Generated on: ${new Date().toLocaleString()}\n\n` +
           `## Summary Metrics\n` +
           `- Total Closed Trades: ${closed.length}\n` +
           `- **Net P&L: ₹${totalNet.toLocaleString()}**\n` +
           `- Total Brokerage Paid: ₹${totalBrokerage.toLocaleString()}\n` +
           `- Win Rate: ${winRate}%\n\n` +
           `## Recent Trade Log\n` +
           `| Symbol | Type | Side | Net P&L | Date |\n` +
           `| :--- | :--- | :--- | :--- | :--- |\n` +
           closed.slice(0, 30).map(t => 
             `| ${t.symbol} | ${t.type} | ${t.side} | ₹${calculatePnL(t).toFixed(2)} | ${new Date(t.entryDate).toLocaleDateString()} |`
           ).join('\n') +
           `\n\n--- \n*This report is auto-generated and backed up by TradeMind AI. Analysis powered by Gemini.*`;
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trades, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `trademind_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                Google Drive Sync
              </h3>
              <p className="text-slate-400 text-sm max-w-xl">
                Securely store your trade history and AI-generated performance docs in your private cloud storage.
              </p>
            </div>
            <button 
              onClick={() => setIsConfiguring(!isConfiguring)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-2"
              title="Configuration"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
          </div>

          {isConfiguring ? (
            <form onSubmit={handleSaveConfig} className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50 mb-8 animate-in fade-in slide-in-from-top-4">
              <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-widest">Setup Google Integration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">OAuth Client ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter your Google Client ID..."
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-blue-400 underline">
                    How to get a Client ID?
                  </a>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all">
                    Save Configuration
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-4 mb-8">
              <button 
                onClick={handleBackup}
                disabled={status === 'loading'}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all ${
                  status === 'loading' ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
                }`}
              >
                {status === 'loading' ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                )}
                {status === 'loading' ? 'Syncing with Drive...' : 'Backup Data & Docs'}
              </button>

              <button 
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Export JSON (Offline)
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 text-green-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
              <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              Sync successful! Backup.json and Performance_Report.md saved to Drive.
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 text-red-400 text-sm p-4 bg-red-400/10 border border-red-400/20 rounded-xl flex items-start gap-3 animate-in shake duration-300">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <div>
                <p className="font-bold">Sync Error</p>
                <p className="opacity-80">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center mb-4">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h4 className="font-bold text-slate-200 mb-2">Auto-Generated Docs</h4>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Every time you sync, we generate a professional <strong>Trading_Performance_Report.md</strong>. It contains your key metrics, win rate, and a detailed trade tape formatted for easy reading.
          </p>
          <div className="text-blue-400 text-xs font-bold uppercase tracking-widest">Markdown Format</div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-slate-600 transition-colors">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mb-4">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h4 className="font-bold text-slate-200 mb-2">End-to-End Privacy</h4>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            TradeMind AI uses <strong>OAuth 2.0</strong> restricted scopes. We only have permission to access files we create. Your other personal Google Drive files remain completely invisible to the app.
          </p>
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-900/50 py-1 px-2 rounded inline-block">
            Secure Protocol
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataHub;
