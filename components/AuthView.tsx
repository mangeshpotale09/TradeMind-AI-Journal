
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { getRegisteredUsers, setCurrentUser, registerUser } from '../services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'ADMIN'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(e.currentTarget.id === 'auth-form');
    
    // Slight delay to simulate system handshake
    setTimeout(() => {
      const users = getRegisteredUsers();
      
      if (mode === 'REGISTER') {
        if (users.find(u => u.email === email)) {
          alert('ID already exists in registry.');
          setIsSubmitting(false);
          return;
        }
        const newUser = registerUser({ email, password, name });
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

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-purple-600 text-white rotate-12' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20'}`}>
            {mode === 'ADMIN' ? 'A' : 'T'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={mode === 'ADMIN' ? 'text-purple-400' : 'text-emerald-500'}>AI</span>
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-3">
            {mode === 'ADMIN' ? 'Security Protocol Enabled' : 'Professional Execution Portal'}
          </p>
        </div>

        <div className={`p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-[#1a0b2e] border-purple-500/30' : 'bg-[#0e1421] border-[#1e293b]'}`}>
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'REGISTER' ? 'New Account Registration' : mode === 'ADMIN' ? 'Admin System Console' : 'Terminal User Access'}
            </h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              {mode === 'REGISTER' 
                ? 'Join the community of disciplined, data-driven traders.' 
                : mode === 'ADMIN' 
                ? 'Authorized personnel only. Access verification logs and system state.' 
                : 'Enter your credentials to access your personal trading journal.'}
            </p>
          </div>
          
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-6">
            {mode === 'REGISTER' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Identity Name</label>
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                  placeholder="Trader Name"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Email ID</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                placeholder="identity@trademind.ai"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Passphrase</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all"
                placeholder="••••••••••••"
              />
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                mode === 'ADMIN' 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  {mode === 'REGISTER' ? 'Initialize Registration' : mode === 'ADMIN' ? 'Login to Master Console' : 'Secure Entry'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-[#1e293b] flex-1"></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Navigation</span>
              <div className="h-px bg-[#1e293b] flex-1"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')}
                className="py-3 px-4 rounded-xl border border-[#1e293b] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                {mode === 'REGISTER' ? 'Login Instead' : 'Create User ID'}
              </button>
              <button 
                onClick={() => setMode(mode === 'ADMIN' ? 'LOGIN' : 'ADMIN')}
                className={`py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === 'ADMIN' 
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' 
                    : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                {mode === 'ADMIN' ? 'User Login' : 'Admin Terminal'}
              </button>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          Encrypted End-to-End • TradeMind Security Protocol
        </p>
      </div>
    </div>
  );
};

export default AuthView;
