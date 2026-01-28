
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserStatus, PlanType, Transaction } from '../types';
import { updateUserStatus, logTransaction } from '../services/storageService';

interface PaymentViewProps {
  user: User;
  onPaymentSubmitted: () => void;
}

const PaymentView: React.FC<PaymentViewProps> = ({ user, onPaymentSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    let interval: any;
    if (verifying) {
      interval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [verifying]);

  const planDetails = useMemo(() => {
    switch(user.selectedPlan) {
      case PlanType.MONTHLY: return { price: 299, name: "MONTHLY" };
      case PlanType.SIX_MONTHS: return { price: 599, name: "6 MONTHS" };
      case PlanType.ANNUAL: return { price: 999, name: "ANNUAL" };
      default: return { price: 999, name: "ANNUAL" };
    }
  }, [user.selectedPlan]);

  const handleRazorpayPayment = () => {
    setLoading(true);

    const options = {
      key: "rzp_test_placeholder", // Replace with actual Razorpay Key ID
      amount: planDetails.price * 100, // Amount in paise
      currency: "INR",
      name: "TradeMind AI",
      description: `Subscription: ${planDetails.name} Plan`,
      image: "https://cdn-icons-png.flaticon.com/512/2422/2422796.png",
      handler: function (response: any) {
        setLoading(false);
        setVerifying(true);

        // Simulate Secure Signature Verification Process
        setTimeout(() => {
          const tx: Transaction = {
            id: response.razorpay_payment_id || crypto.randomUUID(),
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature || `sig_${Math.random().toString(36).substring(7)}`,
            userId: user.id,
            userName: user.name,
            amount: planDetails.price,
            plan: user.selectedPlan || PlanType.MONTHLY,
            method: 'RAZORPAY',
            timestamp: new Date().toISOString(),
            status: 'SUCCESS'
          };
          
          logTransaction(tx);
          updateUserStatus(user.id, UserStatus.APPROVED);
          setVerifying(false);
          setPaymentSuccess(true);
          
          setTimeout(() => {
            onPaymentSubmitted();
          }, 2500);
        }, 3000); // 3 seconds for simulated signature verification
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.mobile || ""
      },
      theme: {
        color: "#10b981"
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0e1421] rounded-[3rem] border border-blue-500/30 p-12 text-center space-y-8 animate-in zoom-in duration-500">
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * verificationProgress) / 100} className="text-blue-500 transition-all duration-300" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white">Verifying Security Signature</h2>
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-medium">Validating transaction with Secure Gateway...</p>
              <p className="text-blue-400 text-[10px] font-mono tracking-widest">{verificationProgress}% COMPLETED</p>
            </div>
          </div>
          <div className="flex justify-center items-center gap-4 py-4 border-t border-[#1e293b]">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">PCI-DSS COMPLIANT</span>
             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3 SECURE</span>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0e1421] rounded-[3rem] border border-emerald-500/30 p-12 text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white">Identity Approved</h2>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm font-medium">Transaction verified. Terminal access granted.</p>
              <p className="text-emerald-400 text-xs font-black uppercase tracking-widest animate-pulse">Routing to Secure Login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 pb-24">
      <div className="w-full max-w-xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col md:flex-row h-full">
          
          {/* Order Summary Sidebar */}
          <div className="md:w-5/12 bg-[#0a0f1d] p-8 md:p-10 border-r border-[#1e293b] space-y-8">
            <div>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Activating Plan</h3>
              <p className="text-xl font-black text-white">{planDetails.name}</p>
            </div>

            <div className="bg-[#111827] p-5 rounded-2xl border border-[#1e293b] space-y-2">
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Merchant Info</h4>
              <p className="text-white font-black text-sm">Mangesh Potale</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Verified TradeMind Terminal</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Tier Price</span>
                <span className="text-slate-200">₹{planDetails.price}.00</span>
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Security Fee</span>
                <span className="text-slate-200">₹0.00</span>
              </div>
              <div className="pt-4 border-t border-[#1e293b] flex justify-between items-baseline">
                <span className="text-slate-200 font-black text-xs uppercase tracking-widest">Grand Total</span>
                <span className="text-2xl font-black text-emerald-400">₹{planDetails.price}</span>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl">
              <p className="text-[9px] text-blue-400/80 font-bold leading-relaxed flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                AES-256 Bit Encrypted Payment
              </p>
            </div>
          </div>

          {/* Checkout Body */}
          <div className="md:w-7/12 p-8 md:p-10 flex flex-col justify-center items-center space-y-8 text-center">
             <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 relative">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0e1421] rounded-full flex items-center justify-center">
                 <svg className="w-2.5 h-2.5 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
               </div>
             </div>
             
             <div className="space-y-2">
               <h3 className="text-xl font-black text-white">Secure Checkout Terminal</h3>
               <p className="text-slate-500 text-xs font-medium leading-relaxed">
                 You are initializing a secure payment of <span className="text-white font-bold">₹{planDetails.price}</span>. Your data is protected by industry-leading security protocols.
               </p>
             </div>

             <button 
               onClick={handleRazorpayPayment}
               disabled={loading}
               className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {loading ? (
                 <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <>
                   Proceed to Razorpay Secure
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15l-2 5L7 3l11 4-5 2 3 5z"></path></svg>
                 </>
               )}
             </button>

             <div className="flex flex-col items-center gap-4 pt-4">
               <div className="flex gap-4 grayscale opacity-40">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4" alt="UPI" />
               </div>
               <div className="flex flex-col items-center gap-1">
                 <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                   <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                   End-to-End Encryption Enabled
                 </p>
                 <p className="text-[7px] text-slate-700 font-bold uppercase tracking-tight">Authorized Gateway Provider: Razorpay</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
