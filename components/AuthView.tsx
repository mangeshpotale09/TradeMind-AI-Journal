
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
        
        const newUser = registerUser({ email, password, name, mobile, selectedPlan });
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

  const plans = [
    { type: PlanType.MONTHLY, price: 299, duration: "1 Month" },
    { type: PlanType.SIX_MONTHS, price: 599, duration: "6 Months" },
    { type: PlanType.ANNUAL, price: 999, duration: "1 Year" }
  ];

  const benefits = [
    { icon: "📈", title: "Improves Discipline", text: "Writing down each trade helps you trade with a plan instead of on impulse. You start following rules more consistently." },
    { icon: "📊", title: "Identifies Patterns", text: "Over time, you’ll see what strategies work and which don’t. Spot patterns in winners vs. losers and adjust accordingly." },
    { icon: "✍️", title: "Better Decision-Making", text: "Reviewing past trades teaches you what decisions led to profits and what led to losses. This feedback loop refines your strategy." },
    { icon: "🧠", title: "Reduces Emotional Trading", text: "Seeing your trading history objectively helps you avoid repeating emotional mistakes like revenge trading or panic exits." },
    { icon: "📅", title: "Tracks Progress Over Time", text: "A journal shows how your performance evolves—monthly, quarterly, yearly—so you can celebrate progress or fix issues early." },
    { icon: "💡", title: "Helps You Learn Faster", text: "Keeping notes on what you were thinking during each trade makes your learning concrete. You don’t forget why you made a choice." },
    { icon: "🧮", title: "Quantifies Your Results", text: "Get analytics like win rate, average profit/loss, and risk ratios, which helps you measure performance precisely." },
    { icon: "🗂", title: "Creates Accountability", text: "Documenting trades makes you accountable to your own trading plan and goals." },
    { icon: "📱", title: "Convenience & Accessibility", text: "With our terminal, you can log trades instantly—even on the go—so nothing gets missed." },
    { icon: "🔍", title: "Supports Strategy Optimization", text: "By comparing different strategies side by side, you can see which ones are consistently profitable and refine or drop others." }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden overflow-y-auto">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700 mt-auto">
        
        {/* Centered Branding */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-purple-600 text-white rotate-12' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'}`}>
            {mode === 'ADMIN' ? 'A' : 'T'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={mode === 'ADMIN' ? 'text-purple-400' : 'text-emerald-500'}>{mode === 'ADMIN' ? 'Admin' : 'AI'}</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Professional Terminal</p>
        </div>

        {/* Centered Auth Card */}
        <div className={`w-full p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-[#1a0b2e] border-purple-500/30' : 'bg-[#0e1421] border-[#1e293b]'}`}>
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'REGISTER' ? 'Join the Elite' : mode === 'ADMIN' ? 'Admin Access' : 'Secure Login'}
            </h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              {mode === 'REGISTER' 
                ? 'Create your professional journaling terminal.' 
                : mode === 'ADMIN' 
                ? 'Authorized personnel only. Secure console entry.' 
                : 'Enter your credentials to access your terminal.'}
            </p>
          </div>
          
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-5">
            {mode === 'REGISTER' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                  <input 
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm"
                    placeholder="Trader Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Contact</label>
                  <input 
                    type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm"
                    placeholder="+91 00000 00000"
                  />
                </div>

                <div className="space-y-1.5">
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
                        <span className="text-[9px] font-black uppercase tracking-tighter">{p.duration}</span>
                        <span className="text-sm font-black">₹{p.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email ID</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm"
                placeholder="identity@trademind.ai"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passphrase</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm"
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
                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-400 hover:underline">Terms of Service</button>.
                  </label>
                </div>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={isSubmitting || (mode === 'REGISTER' && !termsAccepted)}
              className={`w-full font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-widest mt-4 ${
                mode === 'ADMIN' 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  {mode === 'REGISTER' ? 'Register Now' : mode === 'ADMIN' ? 'Admin Portal' : 'Access Terminal'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-[#1e293b] flex-1"></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Navigation</span>
              <div className="h-px bg-[#1e293b] flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')}
                className="py-3 px-4 rounded-xl border border-[#1e293b] text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                {mode === 'REGISTER' ? 'Back to Login' : 'Create Account'}
              </button>
              <button 
                onClick={() => setMode(mode === 'ADMIN' ? 'LOGIN' : 'ADMIN')}
                className={`py-3 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                  mode === 'ADMIN' ? 'border-emerald-500/30 text-emerald-400' : 'border-purple-500/30 text-purple-400'
                }`}
              >
                {mode === 'ADMIN' ? 'User Mode' : 'Admin Console'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section Below Registration */}
      <div className="w-full max-w-4xl relative z-10 mt-16 mb-20 animate-in slide-in-from-bottom duration-1000">
        <div className="text-center mb-10">
          <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">The Power of Journaling</h3>
          <div className="w-12 h-1 bg-emerald-500 mx-auto mt-2 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-[#0e1421]/50 border border-[#1e293b] p-5 rounded-2xl hover:border-emerald-500/30 transition-all flex gap-4 group">
              <div className="text-2xl group-hover:scale-110 transition-transform shrink-0">{benefit.icon}</div>
              <div>
                <h4 className="font-black text-white text-[11px] uppercase tracking-wider mb-1">
                  {index + 1}. {benefit.title}
                </h4>
                <p className="text-slate-500 text-[10px] leading-relaxed font-medium">
                  {benefit.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
            TradeMind Infrastructure v3.5.1 Active
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0e1421] border border-[#1e293b] rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]">
              <div>
                <h3 className="text-xl font-black text-white">Agreement Terms</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Version 2.4</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 text-slate-400 text-xs leading-relaxed">
              <p>TradeMind is a performance tracking utility. We do not provide financial advisory services. Trading financial instruments carries high risk. Users are solely responsible for their financial decisions. Data is handled according to our local storage policies.</p>
              <h5 className="font-black text-white uppercase">Privacy</h5>
              <p>We prioritize your trade data security. Aggregated anonymous patterns may be used to enhance AI feedback loops.</p>
            </div>
            <div className="p-8 border-t border-[#1e293b] bg-[#0a0f1d]">
              <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Accept & Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
