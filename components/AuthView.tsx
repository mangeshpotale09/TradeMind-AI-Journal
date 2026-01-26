
import React, { useState } from 'react';
import { User, UserRole, UserStatus, PlanType } from '../types';
import { getRegisteredUsers, setCurrentUser, registerUser } from '../services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'ADMIN'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.MONTHLY);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'REGISTER' && !termsAccepted) {
      alert('You must accept the Terms and Conditions to proceed.');
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      const users = getRegisteredUsers();
      
      if (mode === 'REGISTER') {
        if (users.find(u => u.email === email)) {
          alert('ID already exists in registry.');
          setIsSubmitting(false);
          return;
        }
        
        const newUser = registerUser({ email, password, name, mobile, selectedPlan, referredBy: referralCode });
        setCurrentUser(newUser);
        onAuthComplete(newUser);
      } else if (mode === 'LOGIN' || mode === 'ADMIN') {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          if (mode === 'ADMIN' && user.role !== UserRole.ADMIN) {
            alert('Unauthorized Access. Admin credentials required for Terminal Console.');
            setIsSubmitting(false);
            return;
          }
          setCurrentUser(user);
          onAuthComplete(user);
        } else {
          alert('Authentication Failed. Check credentials and try again.');
        }
      }
      setIsSubmitting(false);
    }, 1000);
  };

  const benefits = [
    { icon: "📈", title: "1. Improves Discipline", text: "Writing down each trade—entry, exit, reasoning—helps you trade with a plan instead of on impulse." },
    { icon: "📊", title: "2. Identifies Patterns", text: "Spot patterns in your winners vs. losers and adjust your strategy accordingly." },
    { icon: "✍️", title: "3. Better Decision-Making", text: "Learn what decisions led to profits and what led to losses through review." },
    { icon: "🧠", title: "4. Reduces Emotional Trading", text: "Seeing your history objectively helps you avoid repeating emotional mistakes." },
    { icon: "📅", title: "5. Tracks Progress Over Time", text: "A journal shows how your performance evolves—monthly, quarterly, yearly." },
    { icon: "💡", title: "6. Helps You Learn Faster", text: "Keeping notes on your thoughts during trades makes your learning concrete." }
  ];

  const plans = [
    { type: PlanType.MONTHLY, price: 299, duration: "1 Month" },
    { type: PlanType.SIX_MONTHS, price: 599, duration: "6 Months" },
    { type: PlanType.ANNUAL, price: 999, duration: "1 Year" }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Auth Card Section */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700 mb-24">
        <div className="flex flex-col items-center mb-8">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-purple-600 text-white rotate-12' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'}`}>
            {mode === 'ADMIN' ? 'A' : 'T'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={mode === 'ADMIN' ? 'text-purple-400' : 'text-emerald-500'}>AI</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Professional Terminal</p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-[#1a0b2e] border-purple-500/30' : 'bg-[#0e1421] border-[#1e293b]'}`}>
          {mode === 'REGISTER' && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
              </div>
              <div>
                <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Referral Offer</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">Enter a referral code to unlock <span className="text-blue-300 font-bold">10% OFF</span> on your renewal!</p>
              </div>
            </div>
          )}

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'REGISTER' ? 'Join the Elite' : mode === 'ADMIN' ? 'Admin Access' : 'Secure Login'}
            </h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              {mode === 'REGISTER' 
                ? 'Create your institutional-grade journaling terminal.' 
                : mode === 'ADMIN' 
                ? 'Authorized personnel only. Secure console entry.' 
                : 'Enter your credentials to access your terminal.'}
            </p>
          </div>
          
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-6">
            {mode === 'REGISTER' && (
              <>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                  <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                    placeholder="Trader Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Contact</label>
                  <input 
                    type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                    placeholder="+91 00000 00000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {plans.map(p => (
                      <button
                        key={p.type}
                        type="button"
                        onClick={() => setSelectedPlan(p.type)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                          selectedPlan === p.type 
                            ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg' 
                            : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tighter">{p.duration}</span>
                        <span className="text-sm font-black">₹{p.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Friend's Referral Code</label>
                  <input 
                    type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0a0f1d] border border-blue-500/20 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-white font-semibold transition-all uppercase placeholder:opacity-20"
                    placeholder="ENTER CODE"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email ID</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                placeholder="identity@trademind.ai"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passphrase</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                placeholder="••••••••••••"
              />
            </div>

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-3 p-1">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-[#1e293b] bg-[#0a0f1d] text-emerald-500 accent-emerald-500"
                    required
                  />
                </div>
                <div className="text-[11px]">
                  <label htmlFor="terms" className="font-medium text-slate-400 cursor-pointer select-none">
                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-400 hover:underline">Terms of Service</button> and Data Privacy Policy.
                  </label>
                </div>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={isSubmitting || (mode === 'REGISTER' && !termsAccepted)}
              className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                mode === 'ADMIN' 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  {mode === 'REGISTER' ? 'Register Now' : mode === 'ADMIN' ? 'Admin Portal' : 'Access Terminal'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-[#1e293b] flex-1"></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gateway</span>
              <div className="h-px bg-[#1e293b] flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')}
                className="py-3 px-4 rounded-xl border border-[#1e293b] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                {mode === 'REGISTER' ? 'Back to Login' : 'Create Account'}
              </button>
              <button 
                onClick={() => setMode(mode === 'ADMIN' ? 'LOGIN' : 'ADMIN')}
                className={`py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === 'ADMIN' ? 'border-emerald-500/30 text-emerald-400' : 'border-purple-500/30 text-purple-400'
                }`}
              >
                {mode === 'ADMIN' ? 'User Mode' : 'Admin Console'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="w-full max-w-6xl relative z-10 animate-in slide-in-from-bottom duration-1000 delay-300 grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="bg-[#0e1421] border border-[#1e293b] p-6 rounded-[1.5rem] hover:border-emerald-500/30 transition-all group">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform origin-left">{benefit.icon}</div>
            <h4 className="font-black text-white text-sm mb-1">{benefit.title}</h4>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">{benefit.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 pb-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
         TradeMind Infrastructure v3.5.1
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0e1421] border border-[#1e293b] rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]">
              <div>
                <h3 className="text-xl font-black text-white">Agreement Terms</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Version 2.4 • Effective Immediately</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 text-slate-400 text-xs leading-relaxed">
              <p>TradeMind is a self-audit tool for performance tracking. We do not provide financial advice. Trading derivatives involves significant risk of capital loss. Users are responsible for their own executions. Data entered is stored locally or in session-based storage. Admin accounts have audit access to global platform data for safety and verification.</p>
              <h5 className="font-black text-white uppercase">Referral Policy</h5>
              <p>The 10% referral discount is applied strictly at the time of renewal. To qualify, a user must have entered a valid referral code during the initial registration process. Referral codes are generated automatically upon successful account activation.</p>
            </div>
            <div className="p-8 border-t border-[#1e293b] bg-[#0a0f1d]">
              <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Acknowledge & Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
