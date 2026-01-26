
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

  const benefits = [
    { icon: "📈", title: "1. Improves Discipline", text: "Writing down each trade—entry, exit, reasoning—helps you trade with a plan instead of on impulse. You start following rules more consistently." },
    { icon: "📊", title: "2. Identifies Patterns", text: "Over time, you’ll see what strategies work and which don’t. You can spot patterns in your winners vs. losers and adjust accordingly." },
    { icon: "✍️", title: "3. Better Decision-Making", text: "When you review your past trades, you learn what decisions led to profits and what led to losses. This feedback loop helps refine your strategy." },
    { icon: "🧠", title: "4. Reduces Emotional Trading", text: "Seeing your trading history objectively helps you avoid repeating emotional mistakes (like revenge trading or panic exits)." },
    { icon: "📅", title: "5. Tracks Progress Over Time", text: "A journal shows how your performance evolves—monthly, quarterly, yearly—so you can celebrate progress or fix issues early." },
    { icon: "💡", title: "6. Helps You Learn Faster", text: "Keeping notes on what you were thinking during each trade makes your learning concrete. You don’t forget why you made a choice." },
    { icon: "🧮", title: "7. Quantifies Your Results", text: "Many apps provide analytics like win rate, average profit/loss, best setups, risk ratios, etc., which helps you measure performance precisely." },
    { icon: "🗂", title: "8. Creates Accountability", text: "Documenting trades makes you accountable to your own trading plan and goals." },
    { icon: "📱", title: "9. Convenience & Accessibility", text: "With an app, you can log trades instantly—even on the go—so nothing gets missed." },
    { icon: "🔍", title: "10. Supports Strategy Optimization", text: "By comparing different strategies side by side, you can see which ones are consistently profitable and refine or drop others." }
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
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'REGISTER' ? 'Register Account' : mode === 'ADMIN' ? 'Admin Access' : 'Secure Login'}
            </h2>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">
              {mode === 'REGISTER' 
                ? 'Join the community of disciplined, data-driven traders.' 
                : mode === 'ADMIN' 
                ? 'Authorized personnel only. Secure console entry.' 
                : 'Enter your credentials to access your terminal.'}
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

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-3 p-1">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded border-[#1e293b] bg-[#0a0f1d] text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 transition-all cursor-pointer accent-emerald-500"
                    required
                  />
                </div>
                <div className="text-xs">
                  <label htmlFor="terms" className="font-medium text-slate-400 cursor-pointer select-none">
                    I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-400 hover:underline">Terms & Conditions</button> and <span className="text-emerald-400 hover:underline">Privacy Policy</span>.
                  </label>
                </div>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={isSubmitting || (mode === 'REGISTER' && !termsAccepted)}
              className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest ${
                mode === 'ADMIN' 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20' 
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  {mode === 'REGISTER' ? 'Create Account' : mode === 'ADMIN' ? 'Login to Admin' : 'Enter Terminal'}
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
                onClick={() => {
                  setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER');
                  setTermsAccepted(false);
                }}
                className="py-3 px-4 rounded-xl border border-[#1e293b] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                {mode === 'REGISTER' ? 'Login' : 'Sign Up'}
              </button>
              <button 
                onClick={() => {
                  setMode(mode === 'ADMIN' ? 'LOGIN' : 'ADMIN');
                  setTermsAccepted(false);
                }}
                className={`py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  mode === 'ADMIN' 
                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' 
                    : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                {mode === 'ADMIN' ? 'User Portal' : 'Admin Console'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section - Below the Fold */}
      <div className="w-full max-w-6xl relative z-10 animate-in slide-in-from-bottom duration-1000 delay-300">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Why Use a <span className="text-emerald-500">Trading Journal?</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto">
            Professional results come from professional habits. Here is how a journal transforms your trading performance:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-[#0e1421] border border-[#1e293b] p-8 rounded-[2rem] hover:border-emerald-500/30 transition-all group hover:bg-[#111827] shadow-xl">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{benefit.icon}</div>
              <h4 className="font-black text-white text-lg mb-2">{benefit.title}</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{benefit.text}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-24 p-12 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] text-center">
            <h3 className="text-2xl font-black text-white mb-4">Ready to start your professional journey?</h3>
            <button 
                onClick={() => {
                    setMode('REGISTER');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-10 py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 transition-all"
            >
                Start Journaling Now
            </button>
        </div>

        <div className="mt-32 pb-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
           TradeMind Platform Architecture v3.4.0
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0e1421] border border-[#1e293b] rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]">
              <div>
                <h3 className="text-xl font-black text-white">Terms & Conditions</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">User Agreement • Last Updated: March 2024</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6 text-slate-400 text-sm leading-relaxed">
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">1. Acceptance of Terms</h4>
                <p>By registering, accessing, or using the App, you confirm that you have read, understood, and agreed to these Terms and Conditions. If you do not agree, please do not use the App.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">2. Purpose of the App</h4>
                <p>The App is designed only for journaling, tracking, and analyzing trades (stocks, options, derivatives, etc.). The App does not provide investment advice, trading tips, or recommendations. All data, analytics, charts, and insights are for educational and self-review purposes only.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">3. Eligibility</h4>
                <p>You must be at least 18 years old to use the App. You confirm that you are legally permitted to trade or analyze financial instruments under applicable laws.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">4. User Accounts</h4>
                <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to provide accurate and complete information during registration. You are fully responsible for all activities performed through your account. The Admin reserves the right to suspend or terminate accounts for violations of these Terms.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">5. User Responsibilities</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Not to upload false, misleading, or illegal trade data</li>
                  <li>Not to misuse the App for fraudulent, unlawful, or harmful activities</li>
                  <li>Not to attempt unauthorized access to the App or other users’ data</li>
                  <li>To comply with all applicable financial, cyber, and data protection laws</li>
                </ul>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">6. Trade Data & Accuracy</h4>
                <p>Trade entries, P&L calculations, and analytics depend on user-input data. We do not guarantee accuracy, completeness, or correctness of any results. Incorrect inputs may result in incorrect analytics.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2 text-red-400">7. No Financial Advice Disclaimer</h4>
                <p>The App does not constitute financial, investment, legal, or tax advice. Past performance shown in the App does not guarantee future results. You are solely responsible for your trading decisions and outcomes. We are not registered as a SEBI investment advisor or broker.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2 text-red-400">8. Risk Disclosure</h4>
                <p>Trading in stocks, options, and derivatives involves significant financial risk. Losses can exceed initial capital. The App does not assess your risk profile or suitability. You agree that you use the App at your own risk.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">9. File Uploads & Attachments</h4>
                <p>Users may upload documents or screenshots for journaling. You confirm that you own the rights to the uploaded content. Prohibited content includes malware, illegal material, or copyrighted content without permission.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">10. Data Privacy</h4>
                <p>User data is handled as per our Privacy Policy. We do not sell personal or trade data to third parties. You consent to data storage and processing required to provide App features.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">11. Intellectual Property</h4>
                <p>The App, design, features, logos, and content are owned by the App owner. Users may not copy, distribute, or reverse-engineer any part of the App.</p>
              </section>
              <section>
                <h4 className="font-black text-white uppercase tracking-wider mb-2">12. Limitation of Liability</h4>
                <p>We are not liable for trading losses, missed opportunities, or indirect damages. We are not responsible for technical failures, data loss, or system downtime.</p>
              </section>
              <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h4 className="font-black text-white uppercase tracking-wider mb-4">Contact Information</h4>
                <div className="space-y-2 text-xs font-mono">
                  <p>Support: 8600299477</p>
                  <p>Email: TradeMindAIJournal@gmail.com</p>
                </div>
              </section>
            </div>
            <div className="p-8 border-t border-[#1e293b] bg-[#0a0f1d]">
              <button 
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }} 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all"
              >
                I Accept These Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
