
import React, { useState, useRef, useEffect } from 'react';
import { Trade, TradeType, TradeSide, OptionType, TradeStatus } from '../types';

interface TradeEntryFormProps {
  initialTrade?: Trade;
  onAdd: (trade: Trade) => void;
  onCancel: () => void;
}

const EMOTIONS = ['Calm', 'Fear', 'Greed', 'FOMO', 'Excited', 'Anxious', 'Confident', 'Impatient'];
const MISTAKES = [
  'Chasing', 
  'No Stop Loss', 
  'Over-leveraged', 
  'Early Exit', 
  'Late Entry', 
  'Averaging Down', 
  'Revenge Trade', 
  'Ignored Setup', 
  'FOMO', 
  'More than 3 Trades', 
  'No strategy'
];
const STRATEGIES = [
  'Breakout', 
  'Mean Reversion', 
  'Trend Following', 
  'Support/Resistance', 
  'EMA Cross', 
  'VWAP Bounce', 
  'Scalp', 
  'Gap Fill', 
  '200 EMA support', 
  'PIVOT Resistance', 
  'PIVOT Support', 
  'EMA Retested'
];

const TradeEntryForm: React.FC<TradeEntryFormProps> = ({ initialTrade, onAdd, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [type, setType] = useState<TradeType>(initialTrade?.type || TradeType.STOCK);
  const [symbol, setSymbol] = useState(initialTrade?.symbol || 'NIFTY 50');
  const [customSymbol, setCustomSymbol] = useState('');
  const [side, setSide] = useState<TradeSide>(initialTrade?.side || TradeSide.LONG);
  const [entryPrice, setEntryPrice] = useState(initialTrade?.entryPrice.toString() || '');
  const [exitPrice, setExitPrice] = useState(initialTrade?.exitPrice?.toString() || '');
  const [quantity, setQuantity] = useState(initialTrade?.quantity.toString() || '');
  const [fees, setFees] = useState(initialTrade?.fees.toString() || '0');
  const [notes, setNotes] = useState(initialTrade?.notes || '');
  
  // Date and Time
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const initialEntryDate = initialTrade?.entryDate ? formatDateTime(initialTrade.entryDate) : formatDateTime(new Date().toISOString());
  const initialExitDate = initialTrade?.exitDate ? formatDateTime(initialTrade.exitDate) : '';

  const [entryDate, setEntryDate] = useState(initialEntryDate);
  const [exitDate, setExitDate] = useState(initialExitDate);

  // Multi-selects
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(initialTrade?.emotions || []);
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>(initialTrade?.mistakes || []);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(initialTrade?.strategies || []);
  const [screenshot, setScreenshot] = useState<string | undefined>(initialTrade?.screenshot);

  // Option specific
  const [strike, setStrike] = useState(initialTrade?.optionDetails?.strike.toString() || '');
  const [expiration, setExpiration] = useState(initialTrade?.optionDetails?.expiration || '');
  const [optionType, setOptionType] = useState<OptionType>(initialTrade?.optionDetails?.option_type || OptionType.CALL);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const symbols = ['NIFTY 50', 'BANKNIFTY', 'SENSEX', 'GOLD', 'BTC', 'ETH', 'OTHER'];

  useEffect(() => {
    if (initialTrade && !symbols.includes(initialTrade.symbol)) {
      setSymbol('OTHER');
      setCustomSymbol(initialTrade.symbol);
    }
  }, [initialTrade]);

  const handleToggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSymbol = symbol === 'OTHER' ? customSymbol.toUpperCase() : symbol;
    const isClosed = exitPrice !== '' && !isNaN(parseFloat(exitPrice));

    const newTrade: Trade = {
      ...(initialTrade || {}),
      id: initialTrade?.id || crypto.randomUUID(),
      symbol: finalSymbol,
      type,
      side,
      entryPrice: parseFloat(entryPrice),
      exitPrice: isClosed ? parseFloat(exitPrice) : undefined,
      quantity: parseFloat(quantity),
      entryDate: new Date(entryDate).toISOString(),
      exitDate: isClosed ? (exitDate ? new Date(exitDate).toISOString() : new Date().toISOString()) : undefined,
      fees: parseFloat(fees),
      status: isClosed ? TradeStatus.CLOSED : TradeStatus.OPEN,
      tags: initialTrade?.tags || [],
      notes,
      emotions: selectedEmotions,
      mistakes: selectedMistakes,
      strategies: selectedStrategies,
      screenshot,
      ...(type === TradeType.OPTION ? {
        optionDetails: {
          strike: parseFloat(strike),
          expiration,
          option_type: optionType,
        }
      } : {})
    };

    onAdd(newTrade);
  };

  const steps = [
    { id: 1, name: 'Setup', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg> },
    { id: 2, name: 'Mindset', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
    { id: 3, name: 'Review', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> }
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="bg-[#0e1421] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col w-full max-w-2xl mx-auto">
      {/* Stepper Header */}
      <div className="bg-[#0a0f1d] border-b border-[#1e293b] p-6">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </span>
            {initialTrade ? 'Update Execution' : 'Log New Execution'}
          </h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex items-center justify-between relative px-2">
          {/* Progress Bar Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#1e293b] -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStep - 1) * 50}%` }}
          ></div>

          {steps.map(step => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                  currentStep >= step.id 
                    ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500'
                }`}
              >
                {step.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-emerald-400' : 'text-slate-600'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <form onSubmit={handleSubmit} id="trade-form" className="space-y-8">
          {/* Step 1: Core Details */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Category</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as TradeType)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all"
                  >
                    <option value={TradeType.STOCK}>Equities / Indices</option>
                    <option value={TradeType.OPTION}>F&O Contracts</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ticker / Pair</label>
                  <div className="space-y-2">
                    <select 
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all"
                    >
                      {symbols.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {symbol === 'OTHER' && (
                      <input 
                        type="text" 
                        required
                        placeholder="Type Symbol (e.g. RELIANCE)"
                        value={customSymbol}
                        onChange={(e) => setCustomSymbol(e.target.value)}
                        className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all uppercase"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Position Side</label>
                  <div className="flex bg-[#0a0f1d] p-1 rounded-2xl border border-[#1e293b]">
                    <button 
                      type="button"
                      onClick={() => setSide(TradeSide.LONG)}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${side === TradeSide.LONG ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Long
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSide(TradeSide.SHORT)}
                      className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${side === TradeSide.SHORT ? 'bg-red-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Short
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity / Lots</label>
                  <input 
                    type="number" 
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold transition-all"
                  />
                </div>
              </div>

              {type === TradeType.OPTION && (
                <div className="bg-[#0a0f1d] p-6 rounded-3xl border border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Strike Price</label>
                    <input type="number" step="0.5" value={strike} onChange={(e) => setStrike(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Expiry</label>
                    <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Contract Type</label>
                    <select value={optionType} onChange={(e) => setOptionType(e.target.value as OptionType)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-white font-bold">
                      <option value={OptionType.CALL}>Call (CE)</option>
                      <option value={OptionType.PUT}>Put (PE)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Quote (₹)</label>
                  <input 
                    type="number" step="0.01" required value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exit Quote (₹)</label>
                  <input 
                    type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold"
                    placeholder="Open"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Time</label>
                  <input type="datetime-local" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trading Fees (₹)</label>
                  <input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Psychology */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Emotional State During Trade
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EMOTIONS.map(e => (
                    <button 
                      key={e} 
                      type="button"
                      onClick={() => handleToggle(selectedEmotions, setSelectedEmotions, e)}
                      className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                        selectedEmotions.includes(e) 
                          ? 'bg-blue-500 border-blue-400 text-slate-900 shadow-lg shadow-blue-500/20' 
                          : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Psychological Leaks Detected
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MISTAKES.map(m => (
                    <button 
                      key={m} 
                      type="button"
                      onClick={() => handleToggle(selectedMistakes, setSelectedMistakes, m)}
                      className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                        selectedMistakes.includes(m) 
                          ? 'bg-red-500 border-red-400 text-slate-900 shadow-lg shadow-red-500/20' 
                          : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Applied Strategy Cluster
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STRATEGIES.map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => handleToggle(selectedStrategies, setSelectedStrategies, s)}
                      className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                        selectedStrategies.includes(s) 
                          ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20' 
                          : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Notes & Proof */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Thesis / Notes</label>
                <textarea 
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 leading-relaxed text-sm placeholder:text-slate-700"
                  placeholder="Why did you take this setup? What did the tape show? What was the outcome mindset?"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence capture</label>
                <div className="flex flex-col gap-6">
                  {screenshot ? (
                    <div className="relative rounded-3xl overflow-hidden border border-[#1e293b] shadow-2xl group">
                      <img src={screenshot} alt="Trade Preview" className="w-full h-auto" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-xs"
                        >
                          Change
                        </button>
                        <button 
                          type="button"
                          onClick={() => setScreenshot(undefined)}
                          className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-[#1e293b] rounded-3xl flex flex-col items-center justify-center text-slate-600 hover:border-emerald-500/50 hover:text-emerald-500 transition-all group"
                    >
                      <svg className="w-12 h-12 mb-2 opacity-20 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="font-black uppercase text-[10px] tracking-widest">Attach Tape Reading / Screenshot</span>
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Sticky Footer Actions */}
      <div className="p-6 bg-[#0a0f1d] border-t border-[#1e293b] flex gap-4">
        {currentStep > 1 && (
          <button 
            type="button"
            onClick={prevStep}
            className="flex-1 bg-[#111827] hover:bg-[#1e293b] text-slate-300 font-black py-4 rounded-2xl border border-[#1e293b] transition-all"
          >
            Previous
          </button>
        )}
        
        {currentStep < 3 ? (
          <button 
            type="button"
            onClick={nextStep}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all"
          >
            Continue
          </button>
        ) : (
          <button 
            type="submit"
            form="trade-form"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all"
          >
            {initialTrade ? 'Save Changes' : 'Commit to Journal'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TradeEntryForm;
