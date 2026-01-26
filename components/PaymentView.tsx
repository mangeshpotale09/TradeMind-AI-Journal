
import React, { useState, useRef } from 'react';
import { User, UserStatus } from '../types';
import { submitPaymentProof } from '../services/storageService';

interface PaymentViewProps {
  user: User;
  onPaymentSubmitted: () => void;
}

const PaymentView: React.FC<PaymentViewProps> = ({ user, onPaymentSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!screenshot) {
      alert('Please attach your payment screenshot.');
      return;
    }
    setLoading(true);
    submitPaymentProof(user.id, screenshot);
    setTimeout(() => {
      onPaymentSubmitted();
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-[#0e1421] rounded-3xl overflow-hidden border border-[#1e293b] shadow-2xl">
        <div className="p-10 bg-gradient-to-br from-emerald-600 to-emerald-900 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-black mb-4">TradeMind Pro</h2>
            <p className="opacity-80 mb-8 text-sm leading-relaxed font-medium">Activate your terminal. Unlimited trade logging, AI-driven weekly deep-dives, and real-time behavioral coaching.</p>
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20 flex flex-col items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Scan to Pay (UPI/QR)</span>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=trademind@bank&pn=TradeMindAI&am=1999&cu=INR" 
                alt="Payment QR Code" 
                className="w-48 h-48 bg-white p-2 rounded-xl"
              />
              <div className="text-center">
                <div className="text-2xl font-black">₹1,999</div>
                <div className="text-[10px] font-bold opacity-60">LIFETIME LICENSE</div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-[10px] font-bold opacity-60 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
            Secure P2P Transaction Verification
          </div>
        </div>

        <div className="p-10 flex flex-col justify-center">
          <h3 className="text-xl font-black mb-1 text-white uppercase tracking-tight">Proof of Payment</h3>
          <p className="text-slate-500 text-xs font-medium mb-8">Attach a screenshot of your successful transaction. An admin will verify it shortly.</p>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              {screenshot ? (
                <div className="relative rounded-2xl overflow-hidden border border-[#1e293b] group h-48 bg-[#0a0f1d]">
                  <img src={screenshot} alt="Payment Proof" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Change</button>
                    <button type="button" onClick={() => setScreenshot(null)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Remove</button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-[#1e293b] rounded-2xl flex flex-col items-center justify-center text-slate-600 hover:border-emerald-500/50 hover:text-emerald-500 transition-all group bg-[#0a0f1d]"
                >
                  <svg className="w-12 h-12 mb-2 opacity-20 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="font-black uppercase text-[9px] tracking-widest text-center px-4">Click to Upload Screenshot</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !screenshot}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/10 disabled:opacity-30 transition-all text-sm uppercase tracking-widest"
            >
              {loading ? 'Submitting Proof...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
