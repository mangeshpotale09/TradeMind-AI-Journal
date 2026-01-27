
import React, { useState, useRef, useMemo } from 'react';
import { User, UserStatus, PlanType } from '../types';
import { submitPaymentProof } from '../services/storageService';

interface PaymentViewProps {
  user: User;
  onPaymentSubmitted: () => void;
}

const PaymentView: React.FC<PaymentViewProps> = ({ user, onPaymentSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const planDetails = useMemo(() => {
    switch(user.selectedPlan) {
      case PlanType.MONTHLY: return { price: 299, name: "MONTHLY" };
      case PlanType.SIX_MONTHS: return { price: 599, name: "6 MONTHS" };
      case PlanType.ANNUAL: return { price: 999, name: "ANNUAL" };
      default: return { price: 999, name: "ANNUAL" };
    }
  }, [user.selectedPlan]);

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

  // Generate dynamic UPI URI based on plan price
  const upiUri = useMemo(() => {
    const vpa = "mangeshpotale10@oksbi";
    const name = "Mangesh Potale";
    const amount = planDetails.price;
    // upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
    return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
  }, [planDetails]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  }, [upiUri]);

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 pb-24">
      <div className="w-full max-w-xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-8 md:p-12 space-y-8">
          <div className="text-center space-y-2">
             <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
             </div>
             <h2 className="text-2xl font-black text-white tracking-tight">Terminal Activation</h2>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
               Plan: <span className="text-emerald-400">{planDetails.name} (₹{planDetails.price})</span>
             </p>
          </div>

          <div className="space-y-6">
            {/* Payment Steps */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 flex flex-col items-center gap-6">
                <div className="text-center space-y-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 1: Scan & Pay</h3>
                  <p className="text-[9px] text-slate-500 font-bold">Pay exactly ₹{planDetails.price} using any UPI app</p>
                </div>
                
                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-3xl shadow-2xl relative group">
                  <img 
                    src={qrCodeUrl} 
                    alt="Payment QR Code" 
                    className="w-40 h-40 md:w-48 md:h-48"
                  />
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-3xl pointer-events-none group-hover:border-emerald-500/40 transition-colors"></div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#070a13] px-4 py-2 rounded-full border border-[#1e293b]">
                    <span className="text-[9px] font-mono text-emerald-500 font-black">mangeshpotale10@oksbi</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Beneficiary: Mangesh Potale</span>
                </div>
              </div>

              <div className="bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2: Upload Evidence</h3>
                </div>

                <div className="flex flex-col gap-4">
                  {screenshot ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#1e293b] group h-48 bg-[#070a13]">
                      <img src={screenshot} alt="Payment Proof" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Change</button>
                        <button type="button" onClick={() => setScreenshot(null)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-[#1e293b] rounded-2xl flex flex-col items-center justify-center text-slate-600 hover:border-emerald-500/50 hover:text-emerald-500 transition-all group bg-[#070a13]/50">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/5 flex items-center justify-center mb-3 transition-all group-hover:scale-110">
                        <svg className="w-6 h-6 opacity-20 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <span className="font-black uppercase text-[9px] tracking-[0.2em] opacity-60">Attach Transfer Receipt</span>
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !screenshot}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl shadow-2xl shadow-emerald-500/20 disabled:opacity-30 transition-all text-[11px] uppercase tracking-[0.2em]"
            >
              {loading ? 'Submitting for Audit...' : 'Submit & Activate'}
            </button>
          </div>
          
          <div className="pt-2 text-center">
             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                <svg className="w-2.5 h-2.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                Secure Verification Gateway
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
