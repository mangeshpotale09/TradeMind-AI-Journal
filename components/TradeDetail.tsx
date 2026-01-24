
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
}

const TradeDetail: React.FC<TradeDetailProps> = ({ trade, onUpdate, onEdit, onDelete, onClose }) => {
  const [exitPrice, setExitPrice] = useState(trade.exitPrice?.toString() || '');
  const [isReviewing, setIsReviewing] = useState(false);
  const pnl = calculatePnL(trade);

  const handleCloseTrade = () => {
    const updatedTrade: Trade = {
      ...trade,
      status: TradeStatus.CLOSED,
      exitPrice: parseFloat(exitPrice),
      exitDate: new Date().toISOString()
    };
    onUpdate(updatedTrade);
  };

  const handleAIReview = async () => {
    setIsReviewing(true);
    const review = await getAIReviewForTrade(trade);
    if (review) {
      onUpdate({ ...trade, aiReview: review });
    }
    setIsReviewing(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden animate-in slide-in-from-right duration-300 max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {trade.symbol} 
              <span className={`text-xs px-2 py-0.5 rounded ${trade.side === TradeSide.LONG ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {trade.side}
              </span>
            </h2>
            <p className="text-slate-500 text-sm">{new Date(trade.entryDate).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(trade)}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
            title="Edit Trade"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button 
            onClick={() => onDelete(trade.id)}
            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
            title="Delete Trade"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-lg">
              <span className="block text-slate-500 text-xs mb-1">Entry Price</span>
              <span className="text-lg font-mono font-bold">₹{trade.entryPrice.toFixed(2)}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg">
              <span className="block text-slate-500 text-xs mb-1">Quantity</span>
              <span className="text-lg font-mono font-bold">{trade.quantity}</span>
            </div>
            {trade.status === TradeStatus.CLOSED && (
              <div className="bg-slate-900 p-4 rounded-lg">
                <span className="block text-slate-500 text-xs mb-1">Exit Price</span>
                <span className="text-lg font-mono font-bold">₹{trade.exitPrice?.toFixed(2)}</span>
              </div>
            )}
            <div className="bg-slate-900 p-4 rounded-lg col-span-1">
              <span className="block text-slate-500 text-xs mb-1">Brokerage</span>
              <span className="text-lg font-mono font-bold text-red-400">₹{trade.fees.toFixed(2)}</span>
            </div>
          </div>

          <div className={`p-6 rounded-lg border flex flex-col items-center justify-center ${pnl >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <span className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Total P&L</span>
            <span className={`text-4xl font-bold font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Psychology and Strategy */}
          <div className="space-y-4">
            {trade.strategies.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Strategy Applied</h3>
                <div className="flex flex-wrap gap-2">
                  {trade.strategies.map(s => (
                    <span key={s} className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {trade.emotions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Emotions</h3>
                  <div className="flex flex-wrap gap-2">
                    {trade.emotions.map(e => (
                      <span key={e} className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-500/20">{e}</span>
                    ))}
                  </div>
                </div>
              )}
              {trade.mistakes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mistakes</h3>
                  <div className="flex flex-wrap gap-2">
                    {trade.mistakes.map(m => (
                      <span key={m} className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-1 rounded border border-red-500/20">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {trade.status === TradeStatus.OPEN && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-4">
              <h3 className="font-semibold text-slate-300">Close this trade</h3>
              <div className="flex gap-2">
                <input 
                  type="number"
                  step="0.01"
                  placeholder="Exit Price (₹)"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={handleCloseTrade}
                  className="bg-slate-200 hover:bg-white text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-slate-400 font-semibold mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Notes
            </h3>
            <p className="bg-slate-900 p-4 rounded-lg text-slate-300 whitespace-pre-wrap italic">
              "{trade.notes || 'No notes provided for this trade.'}"
            </p>
          </div>

          {trade.screenshot && (
            <div className="space-y-2">
              <h3 className="text-slate-400 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Screenshot
              </h3>
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <img src={trade.screenshot} alt="Trade Screenshot" className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(trade.screenshot)} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-blue-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM14.95 6.464a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM6.464 14.95a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0z"></path></svg>
              </span>
              AI Coaching Review
            </h3>
            {!trade.aiReview && (
              <button 
                onClick={handleAIReview}
                disabled={isReviewing}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-3 rounded-full flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isReviewing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : 'Get AI Review'}
              </button>
            )}
          </div>

          {trade.aiReview ? (
            <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 flex items-center justify-center text-2xl font-black text-blue-400">
                  {trade.aiReview.score}
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Quality Score</h4>
                  <p className="text-slate-500 text-sm">Review generated on {new Date(trade.aiReview.timestamp).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-green-500">
                  <span className="text-xs font-bold text-green-400 uppercase">Success Patterns</span>
                  <p className="text-slate-300 mt-1">{trade.aiReview.well}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-red-500">
                  <span className="text-xs font-bold text-red-400 uppercase">Risk Areas</span>
                  <p className="text-slate-300 mt-1">{trade.aiReview.wrong}</p>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <span className="text-xs font-bold text-blue-400 uppercase">Action Item</span>
                  <p className="text-slate-200 mt-1 font-medium">{trade.aiReview.improvement}</p>
                </div>
              </div>

              {trade.aiReview.violations && (
                <div className="flex items-center gap-3 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  <span className="text-sm font-semibold">Rule Violations Detected</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-slate-500 text-center p-6">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              <p>Run a coach review to see deep insights and detect discipline patterns.</p>
              {isReviewing && <p className="mt-4 text-blue-400 animate-pulse font-mono text-sm">Gemini is processing your trade tape...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeDetail;
