
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { getWeeklyInsights, queryTradeHistory } from '../services/geminiService';

interface AIInsightsViewProps {
  trades: Trade[];
}

const AIInsightsView: React.FC<AIInsightsViewProps> = ({ trades }) => {
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    // Only fetch if we have trades and no current summary
    if (trades.length > 0 && !weeklySummary && !isLoadingSummary) {
      handleRefreshSummary();
    }
  }, [trades]);

  const handleRefreshSummary = async () => {
    setIsLoadingSummary(true);
    const summary = await getWeeklyInsights(trades);
    setWeeklySummary(summary);
    setIsLoadingSummary(false);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsQuerying(true);
    const response = await queryTradeHistory(query, trades);
    setQueryResponse(response);
    setIsQuerying(false);
  };

  return (
    <div className="space-y-8 pb-20">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-purple-500/20 text-purple-400 p-2 rounded-xl">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
            </span>
            Weekly AI Performance Report
          </h2>
          <button 
            onClick={handleRefreshSummary}
            disabled={isLoadingSummary}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
          >
            {isLoadingSummary ? 'Analyzing...' : 'Refresh Summary'}
          </button>
        </div>

        {weeklySummary ? (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
              {weeklySummary}
            </div>
          </div>
        ) : (
          <div className="h-64 bg-slate-800 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
            {isLoadingSummary ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p>Gemini Pro is analyzing patterns across {trades.length} trades...</p>
              </div>
            ) : (
              <p>Click "Refresh Summary" to generate a deep weekly performance analysis.</p>
            )}
          </div>
        )}
      </section>

      <section className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Ask your Trading Data
        </h3>
        <p className="text-slate-400 text-sm mb-6">Ask natural language questions about your trade history, win rates, or mistakes.</p>
        
        <form onSubmit={handleQuery} className="flex gap-2">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What is my biggest mistake this week?"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
          />
          <button 
            type="submit"
            disabled={isQuerying}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-8 rounded-xl shadow-lg transition-all"
          >
            {isQuerying ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {queryResponse && (
          <div className="mt-6 p-6 bg-blue-500/5 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="prose prose-invert max-w-none text-blue-100 whitespace-pre-wrap leading-relaxed">
              {queryResponse}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AIInsightsView;
