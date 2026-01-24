
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
  const now = new Date();
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const initialEntryDate = initialTrade?.entryDate ? formatDateTime(initialTrade.entryDate) : formatDateTime(now.toISOString());
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

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto w-full">
      <h2 className="text-xl font-bold mb-6 flex items-center sticky top-0 bg-slate-800 z-10 py-2">
        <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg mr-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
        </span>
        {initialTrade ? 'Edit Trade' : 'Log New Trade'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Details Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Trade Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Asset Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as TradeType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value={TradeType.STOCK}>Stock / Index / Commodity</option>
                <option value={TradeType.OPTION}>Option Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Symbol</label>
              <select 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-2"
              >
                {symbols.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {symbol === 'OTHER' && (
                <input 
                  type="text" 
                  required
                  placeholder="Enter custom ticker"
                  value={customSymbol}
                  onChange={(e) => setCustomSymbol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Side</label>
              <select 
                value={side} 
                onChange={(e) => setSide(e.target.value as TradeSide)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value={TradeSide.LONG}>Long (Buy)</option>
                <option value={TradeSide.SHORT}>Short (Sell)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
              <input 
                type="number" 
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Entry Price (₹)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Exit Price (Optional, ₹)</label>
              <input 
                type="number" 
                step="0.01"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Entry Time</label>
              <input 
                type="datetime-local" 
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Exit Time</label>
              <input 
                type="datetime-local" 
                disabled={exitPrice === ''}
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Brokerage (₹)</label>
            <input 
              type="number" 
              step="0.01"
              value={fees}
              onChange={(e) => setFees(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </section>

        {/* Option Section */}
        {type === TradeType.OPTION && (
          <section className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Option Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Strike</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={strike}
                  onChange={(e) => setStrike(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Exp.</label>
                <input 
                  type="date" 
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select 
                  value={optionType} 
                  onChange={(e) => setOptionType(e.target.value as OptionType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={OptionType.CALL}>Call</option>
                  <option value={OptionType.PUT}>Put</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Tickmark selections */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Psychology & Discipline</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Emotions</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMOTIONS.map(e => (
                <label key={e} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${selectedEmotions.includes(e) ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedEmotions.includes(e)} 
                    onChange={() => handleToggle(selectedEmotions, setSelectedEmotions, e)}
                    className="hidden"
                  />
                  <span>{selectedEmotions.includes(e) ? '✓' : ''} {e}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Mistakes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MISTAKES.map(m => (
                <label key={m} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${selectedMistakes.includes(m) ? 'bg-red-600/20 border-red-500 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedMistakes.includes(m)} 
                    onChange={() => handleToggle(selectedMistakes, setSelectedMistakes, m)}
                    className="hidden"
                  />
                  <span>{selectedMistakes.includes(m) ? '✓' : ''} {m}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Strategies Applied</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STRATEGIES.map(s => (
                <label key={s} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${selectedStrategies.includes(s) ? 'bg-green-600/20 border-green-500 text-green-200' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedStrategies.includes(s)} 
                    onChange={() => handleToggle(selectedStrategies, setSelectedStrategies, s)}
                    className="hidden"
                  />
                  <span>{selectedStrategies.includes(s) ? '✓' : ''} {s}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Attachment & Notes */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-1">Notes & Proof</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Screenshot / Trade Proof</label>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-lg border border-slate-600 transition-colors"
              >
                {screenshot ? 'Change Screenshot' : 'Upload Image'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {screenshot && (
                <div className="relative group">
                  <img src={screenshot} alt="Preview" className="w-16 h-16 object-cover rounded border border-slate-600" />
                  <button 
                    onClick={() => setScreenshot(undefined)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Final Notes / Thesis</label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Detail your mindset, why you entered/exited, etc."
            />
          </div>
        </section>

        <div className="flex gap-3 pt-6 sticky bottom-0 bg-slate-800 pb-2 z-10">
          <button 
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all transform active:scale-95"
          >
            {initialTrade ? 'Update Trade' : 'Save Trade Entry'}
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TradeEntryForm;
