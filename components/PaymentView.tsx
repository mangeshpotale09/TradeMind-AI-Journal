
import React, { useState, useMemo } from 'react';
import { User, UserStatus, PlanType, Transaction } from '../types';
import { updateUserStatus, logTransaction } from '../services/storageService';

interface PaymentViewProps {
  user: User;
  onPaymentSubmitted: () => void;
}

const PaymentView: React.FC<PaymentViewProps> = ({ user, onPaymentSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'WALLET' | 'BANK'>('CARD');
  
  // Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const planDetails = useMemo(() => {
    switch(user.selectedPlan) {
      case PlanType.MONTHLY: return { price: 299, name: "MONTHLY" };
      case PlanType.SIX_MONTHS: return { price: 599, name: "6 MONTHS" };
      case PlanType.ANNUAL: return { price: 999, name: "ANNUAL" };
      default: return { price: 999, name: "ANNUAL" };
    }
  }, [user.selectedPlan]);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Payment Gateway Processing to Admin Account
    setTimeout(() => {
      // Log the transaction for the admin
      const tx: Transaction = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        amount: planDetails.price,
        plan: user.selectedPlan || PlanType.MONTHLY,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS'
      };
      
      logTransaction(tx);
      updateUserStatus(user.id, UserStatus.APPROVED);
      setPaymentSuccess(true);
      setLoading(false);
      
      setTimeout(() => {
        onPaymentSubmitted();
      }, 1500);
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return value;
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0e1421] rounded-[3rem] border border-emerald-500/30 p-12 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">Payment Credited</h2>
            <p className="text-slate-400 text-sm font-medium">Funds received by Mangesh Potale. Access granted.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 pb-24">
      <div className="w-full max-w-2xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          
          {/* Order Summary Sidebar */}
          <div className="md:col-span-2 bg-[#0a0f1d] p-8 md:p-10 border-r border-[#1e293b] space-y-8">
            <div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Activating Plan</h3>
              <p className="text-xl font-black text-white">{planDetails.name}</p>
            </div>

            <div className="bg-[#111827] p-5 rounded-2xl border border-[#1e293b] space-y-2">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payee Account</h4>
              <p className="text-white font-black text-sm">Mangesh Potale</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">TradeMind AI Merchant</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Price</span>
                <span className="text-slate-200">₹{planDetails.price}.00</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-200">₹0.00</span>
              </div>
              <div className="pt-4 border-t border-[#1e293b] flex justify-between items-baseline">
                <span className="text-slate-200 font-black text-xs uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-emerald-400">₹{planDetails.price}</span>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
              <p className="text-[9px] text-emerald-500/80 font-bold leading-relaxed">
                Safe & Secure payment credited directly to the admin terminal.
              </p>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="md:col-span-3 p-8 md:p-10 space-y-8">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setPaymentMethod('CARD')}
                className={`flex-1 min-w-[80px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'CARD' ? 'bg-[#1e293b] border-emerald-500/50 text-white shadow-lg' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}
              >
                Card
              </button>
              <button 
                onClick={() => setPaymentMethod('WALLET')}
                className={`flex-1 min-w-[80px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'WALLET' ? 'bg-[#1e293b] border-emerald-500/50 text-white shadow-lg' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}
              >
                Wallet
              </button>
              <button 
                onClick={() => setPaymentMethod('BANK')}
                className={`flex-1 min-w-[80px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${paymentMethod === 'BANK' ? 'bg-[#1e293b] border-emerald-500/50 text-white shadow-lg' : 'border-[#1e293b] text-slate-500 hover:text-slate-300'}`}
              >
                Direct
              </button>
            </div>

            {paymentMethod === 'CARD' && (
              <form onSubmit={handlePayment} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Cardholder Name</label>
                  <input type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="FULL NAME" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Card Number</label>
                  <input type="text" required maxLength={19} value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl p-4 text-sm text-white font-mono" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required maxLength={5} value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl p-4 text-sm text-white font-mono" placeholder="MM/YY" />
                  <input type="password" required maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-xl p-4 text-sm text-white font-mono" placeholder="CVV" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl shadow-xl transition-all text-[11px] uppercase tracking-widest disabled:opacity-50 mt-4">
                  {loading ? 'Authorizing...' : `Pay ₹${planDetails.price} to Mangesh`}
                </button>
              </form>
            )}

            {paymentMethod === 'WALLET' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <button onClick={handlePayment} className="w-full bg-black border border-[#1e293b] text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#111] transition-all">
                    <span className="font-black text-sm">G Pay</span>
                  </button>
                  <button onClick={handlePayment} className="w-full bg-white text-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                    <span className="font-black text-sm"> Pay</span>
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'BANK' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Bank Detail (Gray Transfer)</span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded">Verified Admin</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold">Account Name</p>
                    <p className="text-white font-black">Mangesh Potale</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold">Bank / IFSC</p>
                    <p className="text-white font-black text-xs">HDFC BANK / HDFC0001234</p>
                  </div>
                </div>
                <button onClick={handlePayment} className="w-full bg-[#1e293b] hover:bg-[#334155] text-white font-black py-4 rounded-2xl transition-all text-[11px] uppercase tracking-widest">
                  Mark as Sent to Admin
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                Merchant: TradeMind AI (Mangesh Potale)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
