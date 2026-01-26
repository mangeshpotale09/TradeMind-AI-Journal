
import React, { useState } from 'react';
import { Trade, TradeStatus, TradeSide, TradeType } from '../types';
import { calculatePnL } from '../services/storageService';
import { getAIReviewForTrade } from '../services/geminiService';

interface TradeDetailProps {
  trade: Trade;
  onUpdate: (updatedTrade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isAdmin?: boolean;
}

const TradeDetail: React.FC<TradeDetailProps> = ({ trade, onUpdate, onEdit, onDelete, onClose, isAdmin = false }) => {
  const [exitPrice, setExitPrice] = useState(trade.exitPrice?.toString() || '');
  const [isReviewing, setIsReviewing] = useState(false);
  const pnl = calculatePnL(trade);

  const handleCloseTrade = () => {
    if (!isAdmin) return;
    const updatedTrade: Trade = {
      ...trade,
      status: TradeStatus.CLOSED,
      exitPrice: parseFloat(exitPrice),
      exitDate: new Date().toISOString()
    };
    onUpdate(updatedTrade);
  };

  const handleAIReview = async () => {
    if (!isAdmin) return;
    setIsReviewing(true);
    const review = await getAIReviewForTrade(trade);
    if (review) {
      onUpdate({ ...trade, aiReview: review });
    }
    setIsReviewing(false);
  };

  const confirmAndDelete = () => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to permanently delete this trade? This action cannot be undone.')) {
      onDelete(trade.id);
    }
  };

  return (
    <div className="bg-[#0e1421] rounded-2xl border border-[#1e293b] overflow-hidden animate-in slide-in-from-right duration-300 max-h-[90vh] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${trade.side === TradeSide.LONG ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {trade.symbol.substring(0, 1)}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              {trade.symbol} 
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-widest ${trade.side === TradeSide.LONG ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {trade.side}
              </span>
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">{new Date(trade.entryDate).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <button 
                onClick={() => onEdit(trade)}
                className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-400 transition-colors"
                title="Edit Trade"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button 
                onClick={confirmAndDelete}
                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Delete Trade"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </>
          )}
          <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-400 ml-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Entry Price</span>
              <span className="text-lg font-mono font-black text-slate-200">₹{trade.entryPrice.toLocaleString()}</span>
            </div>
            <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Quantity</span>
              <span className="text-lg font-mono font-black text-slate-200">{trade.quantity}</span>
            </div>
            {trade.status === TradeStatus.CLOSED && (
              <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
                <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Exit Price</span>
                <span className="text-lg font-mono font-black text-slate-200">₹{trade.exitPrice?.toLocaleString()}</span>
              </div>
            )}
            <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Brokerage</span>
              <span className="text-lg font-mono font-black text-red-400">₹{trade.fees.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center transition-all ${pnl >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]'}`}>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Net P&L</span>
            <span className={`text-4xl font-black font-mono tracking-tighter ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toLocaleString()}
            </span>
          </div>

          {/* Psychology and Strategy */}
          <div className="space-y-4">
            {trade.strategies.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Strategy Cluster</h3>
                <div className="flex flex-wrap gap-2">
                  {trade.strategies.map(s => (
                    <span key={s} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-lg border border-emerald-500/20 uppercase">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {trade.emotions.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mindset</h3>
                  <div className="flex flex-wrap gap-2">
                    {trade.emotions.map(e => (
                      <span key={e} className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-1 rounded-lg border border-blue-500/20 uppercase">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {trade.mistakes.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Psychological Leaks</h3>
                  <div className="flex flex-wrap gap-2">
                    {trade.mistakes.map(m => (
                      <span key={m} className="bg-red-500/10 text-red-400 text-[10px] font-black px-2 py-1 rounded-lg border border-red-500/20 uppercase">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {trade.status === TradeStatus.OPEN && isAdmin && (
            <div className="bg-[#0a0f1d] p-6 rounded-2xl border border-emerald-500/20 space-y-4 shadow-xl">
              <h3 className="font-black text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Realize Trade
              </h3>
              <div className="flex gap-2">
                <input 
                  type="number"
                  step="0.01"
                  placeholder="Exit Price (₹)"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="flex-1 bg-[#111827] border border-[#1e293b] rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
                />
                <button 
                  onClick={handleCloseTrade}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Execution Hypothesis
            </h3>
            <p className="bg-[#0a0f1d] p-5 rounded-2xl text-slate-300 whitespace-pre-wrap italic border border-[#1e293b] leading-relaxed">
              "{trade.notes || 'No notes provided for this trade.'}"
            </p>
          </div>

          {trade.screenshot && (
            <div className="space-y-2">
              <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
                Tape Capture
              </h3>
              <div className="border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl">
                <img src={trade.screenshot} alt="Trade Screenshot" className="w-full h-auto" />
              </div>
            </div>
          )}
        </div>

        {/* AI Section - Restricted to Admin (Modification / Chat rights) */}
        <div className="space-y-6">
          {isAdmin ? (
            <>
              <div className="flex justify-between items-center bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
                <h3 className="text-xl font-black flex items-center gap-2 text-white">
                  <span className="text-emerald-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM14.95 6.464a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM6.464 14.95a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0z"></path></svg>
                  </span>
                  Gemini AI Coach
                </h3>
                
                <button 
                  onClick={handleAIReview}
                  disabled={isReviewing}
                  className={`text-xs font-black py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg ${
                    trade.aiReview 
                      ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/10'
                  }`}
                >
                  {isReviewing ? 'Analyzing...' : trade.aiReview ? 'Re-analyze' : 'Run AI Audit'}
                </button>
              </div>

              {trade.aiReview ? (
                <div className="space-y-4">
                  {/* Score Indicator */}
                  <div className="bg-[#0a0f1d] rounded-2xl border border-[#1e293b] p-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl font-black text-emerald-400 shadow-inner">
                          {trade.aiReview.score}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-200">Execution Score</h4>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Logic-based review</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Gemini 3 Flash</span>
                    </div>
                  </div>

                  {/* Categorized AI Feedback */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/20 overflow-hidden">
                      <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/10 flex items-center gap-2">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Strengths</span>
                      </div>
                      <div className="p-4">
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{trade.aiReview.well}"</p>
                      </div>
                    </div>

                    <div className="bg-red-500/5 rounded-2xl border border-red-500/20 overflow-hidden">
                      <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/10 flex items-center gap-2">
                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Leaks</span>
                      </div>
                      <div className="p-4">
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{trade.aiReview.wrong}"</p>
                      </div>
                    </div>

                    <div className="bg-blue-500/5 rounded-2xl border border-blue-500/20 overflow-hidden">
                      <div className="bg-blue-500/10 px-4 py-2 border-b border-blue-500/10 flex items-center gap-2">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Improvement</span>
                      </div>
                      <div className="p-4">
                        <p className="text-white text-sm font-bold leading-relaxed">{trade.aiReview.improvement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 bg-[#0a0f1d] rounded-2xl border border-dashed border-[#1e293b] text-slate-600 text-center p-8">
                  <svg className="w-16 h-16 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <h4 className="font-black text-slate-400 text-lg mb-2">Audit System Standby</h4>
                  <p className="text-xs max-w-xs mb-6 text-slate-500">Enable AI Performance Reviews for deep tactical analysis.</p>
                  <button 
                    onClick={handleAIReview}
                    disabled={isReviewing}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 px-8 rounded-2xl shadow-lg transition-all"
                  >
                    {isReviewing ? 'Processing...' : 'Run Audit'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-[#0a0f1d] rounded-2xl border border-[#1e293b] p-10 text-center space-y-4">
               <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               </div>
               <h3 className="text-white font-black">AI Insights Locked</h3>
               <p className="text-slate-500 text-xs leading-relaxed">
                 AI Coaching, Weekly Reports, and Performance Audits are exclusive to active Terminal licenses. Standard Preview users can only view basic execution metrics.
               </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Footer Actions */}
      {isAdmin && (
        <div className="p-6 border-t border-[#1e293b] bg-[#0a0f1d] flex flex-col md:flex-row gap-4">
          <button 
            onClick={() => onEdit(trade)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-[#1e293b] text-emerald-400 font-black py-4 rounded-2xl border border-emerald-500/30 transition-all shadow-lg"
          >
            Modify Entry
          </button>
          <button 
            onClick={confirmAndDelete}
            className="flex-1 flex items-center justify-center gap-2 bg-[#111827] hover:bg-red-500/10 text-red-500 font-black py-4 rounded-2xl border border-red-500/30 transition-all shadow-lg"
          >
            Purge Record
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeDetail;
