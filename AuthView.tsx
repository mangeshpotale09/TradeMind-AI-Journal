
import React, { useState } from 'react';
import { User, UserRole, UserStatus, PlanType } from './types';
// Corrected path to storageService relative to root
import { setCurrentUser, registerUser, validateLogin, resetUserPassword } from './services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      setErrorMessage("Email is required for terminal identification.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage(`Email address "${email}" is invalid format.`);
      return false;
    }
    if (mode !== 'FORGOT' && password.length < 6) {
      setErrorMessage("Password should be at least 6 characters.");
      return false;
    }
    if (mode === 'REGISTER' && !name.trim()) {
      setErrorMessage("Identity Name is required for profile initialization.");
      return false;
    }
    if (mode === 'REGISTER' && !termsAccepted) {
      setErrorMessage("You must accept the Disciplinary Terms to proceed.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateInputs()) return;

    setIsSubmitting(true);
    
    try {
      if (mode === 'REGISTER') {
        const newUser = await registerUser({ email, password, name, mobile });
        if (newUser) {
          onAuthComplete(newUser);
        }
      } else if (mode === 'LOGIN') {
        const user = await validateLogin(email, password);
        if (user) {
          onAuthComplete(user);
        } else {
          setErrorMessage("Invalid credentials. Logic access denied.");
        }
      } else if (mode === 'FORGOT') {
        const success = await resetUserPassword(email, mobile, newPassword);
        if (success) {
          alert('Passphrase reset successful. You can now login.');
          setMode('LOGIN');
        } else {
          setErrorMessage('Verification Error: No matching local profile found.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected logic error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: "📈", title: "Execution Discipline", text: "Transform impulsive gambling into systematic, rule-based execution through rigorous post-trade logging." },
    { icon: "📊", title: "Edge Identification", text: "Pinpoint high-probability setups by isolating the strategies that generate your highest profit factors." },
    { icon: "🛡️", title: "Risk Mitigation", text: "Instantly detect capital-draining leaks like over-leveraging or recurring stop-loss violations." },
    { icon: "🤖", title: "AI Risk Coaching", text: "Leverage Gemini AI to audit your logic and receive actionable directives for immediate improvement." }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden overflow-y-auto no-scrollbar pb-32">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 mt-8">
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-500 ${mode === 'FORGOT' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'}`}>
            {mode === 'FORGOT' ? '?' : 'T'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={mode === 'FORGOT' ? 'text-blue-400' : 'text-emerald-500'}>{mode === 'FORGOT' ? 'Reset' : 'AI'}</span>
          </h1>
          <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-[0.3em]">
            Institutional Logic Terminal
          </p>
        </div>

        <div className={`w-full p-8 md:p-10 rounded-[3rem] border shadow-2xl transition-all duration-500 ${mode === 'FORGOT' ? 'bg-[#0b142e]/90 border-blue-500/30' : 'bg-[#0e1421]/90 border-[#1e293b]'}`}>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              {mode === 'REGISTER' ? 'Initialize Identity' : mode === 'FORGOT' ? 'Reset Logic' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Local Session Authentication</p>
          </div>
          
          {errorMessage && (
            <div className={`mb-6 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-300 bg-red-500/10 border-red-500/20 text-red-400`}>
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'REGISTER' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all text-sm" placeholder="John Doe" />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Terminal ID</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all text-sm" placeholder="trader@mind.ai" />
            </div>

            {mode !== 'FORGOT' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Passphrase</label>
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline">Forgot?</button>
                  )}
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all text-sm" placeholder="••••••••" />
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-3 p-1">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-[#1e293b] bg-[#070a13] text-emerald-500 accent-emerald-500" required />
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  I accept the disciplinary terms.
                </label>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting} className={`w-full font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mt-4 ${mode === 'FORGOT' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'} disabled:opacity-50`}>
              {isSubmitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (mode === 'REGISTER' ? 'Initialize & Enter' : mode === 'FORGOT' ? 'Reset' : 'Enter')}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#1e293b]">
            <button 
              onClick={() => { setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER'); setErrorMessage(null); }} 
              className="w-full py-4 rounded-2xl border border-[#1e293b] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all shadow-sm"
            >
              {mode === 'REGISTER' ? 'Already have an Identity? Login' : 'New to TradeMind? Create Identity'}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="bg-[#0e1421]/40 border border-[#1e293b] p-6 rounded-[2rem] flex gap-5 items-center">
              <div className="text-2xl bg-[#070a13] p-4 rounded-2xl border border-[#1e293b]">{b.icon}</div>
              <div className="flex-1">
                <h4 className="font-black text-white text-[10px] uppercase tracking-widest mb-1">{b.title}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
