
import React, { useState } from 'react';
import { User, UserRole, UserStatus, PlanType } from '../types';
import { getRegisteredUsers, setCurrentUser, registerUser, resetUserPassword } from '../services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'ADMIN' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.ANNUAL);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
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
      } else if (mode === 'FORGOT') {
        const success = resetUserPassword(email, mobile, newPassword);
        if (success) {
          alert('Passphrase reset successfully. You can now login.');
          setMode('LOGIN');
          setPassword('');
          setNewPassword('');
        } else {
          alert('Verification failed. Email or Mobile number did not match our records.');
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
    { icon: "📈", title: "Execution Discipline", text: "Transform impulsive gambling into systematic, rule-based execution through rigorous post-trade logging." },
    { icon: "📊", title: "Edge Identification", text: "Pinpoint high-probability setups by isolating the strategies that generate your highest profit factors." },
    { icon: "🛡️", title: "Risk Mitigation", text: "Instantly detect capital-draining leaks like over-leveraging or recurring stop-loss violations." },
    { icon: "🧠", title: "Emotional Intelligence", text: "Correlate your mental states (Fear, Greed, FOMO) with actual P&L to build psychological resilience." },
    { icon: "🤖", title: "AI Risk Coaching", text: "Leverage Gemini AI to audit your logic and receive actionable directives for immediate improvement." },
    { icon: "💹", title: "Equity Curve Mastery", text: "Visualize your growth trajectory to maintain professional perspective during natural market drawdowns." },
    { icon: "📸", title: "Strategic Evidence", text: "Store high-fidelity screenshots and context notes to build a reference library of your best setups." },
    { icon: "🔍", title: "Pattern Detection", text: "Spot recurring market behaviors and execution errors before they impact your long-term capital." },
    { icon: "⚖️", title: "Rule Accountability", text: "Quantify the exact cost of lack of discipline by tracking specific execution mistakes like 'Chasing'." },
    { icon: "📑", title: "Institutional Reporting", text: "Generate professional CSV reports for tax compliance, fund audits, and deep performance analysis." }
  ];

  const termsList = [
    { title: "1. High Financial Risk", content: "Trading stocks, options, and other financial instruments involves substantial risk of loss. You should only trade with risk capital." },
    { title: "2. No Financial Advice", content: "TradeMind AI is a journaling and analytical tool only. We do not provide investment, financial, tax, or legal advice." },
    { title: "3. User Responsibility", content: "All trading decisions are yours alone. We are not responsible for any financial losses incurred through your trading activities." },
    { title: "4. Data Accuracy", content: "The quality of AI insights depends on the accuracy of your input. We are not liable for conclusions based on incorrect data." },
    { title: "5. Subscription Finality", content: "All payments are non-refundable and non-transferable. Access is granted immediately upon verification of payment." },
    { title: "6. Local Data Persistence", content: "Trade data is primarily stored in your browser's local storage. Clearing browser data may result in permanent data loss." },
    { title: "7. AI Processing Disclosure", content: "We use Google Gemini AI to process your notes. By using the app, you agree to our processing of anonymized trade data via AI APIs." },
    { title: "8. No Profit Guarantee", content: "Use of this journal does not guarantee profitable results. Successful trading requires individual skill and market conditions." },
    { title: "9. Account Security", content: "You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately of unauthorized access." },
    { title: "10. Prohibited Activities", content: "Users may not use the platform for any illegal activities, market manipulation, or unauthorized scraping of platform data." },
    { title: "11. Intellectual Property", content: "All software, designs, and content within TradeMind AI are the exclusive property of the developers and protected by law." },
    { title: "12. Service Uptime", content: "While we strive for 100% availability, we do not guarantee uninterrupted service. Maintenance and updates may occur." },
    { title: "13. Limitation of Liability", content: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages." },
    { title: "14. Indemnification", content: "You agree to indemnify and hold TradeMind AI harmless from any claims arising from your use of the platform or trading outcomes." },
    { title: "15. Termination of Access", content: "We reserve the right to suspend or terminate accounts that violate these terms or engage in malicious behavior towards the platform." },
    { title: "16. Modification of Terms", content: "We may update these Terms & Conditions at any time. Continued use of the platform constitutes acceptance of updated terms." },
    { title: "17. Governing Law", content: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra." }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden overflow-y-auto no-scrollbar pb-32">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Right Actions */}
      <div className="absolute top-6 right-6 z-[60] flex items-center gap-3">
        <button 
          onClick={() => setShowPricingModal(true)}
          className="px-4 py-2 bg-[#0e1421] border border-[#1e293b] rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:border-emerald-500 transition-all shadow-xl hidden sm:block"
        >
          Pricing
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 bg-[#0e1421] border border-[#1e293b] rounded-xl flex flex-col items-center justify-center gap-1 hover:border-emerald-500 transition-all shadow-xl group"
          >
            <div className="w-5 h-0.5 bg-slate-400 group-hover:bg-emerald-400 transition-colors"></div>
            <div className="w-5 h-0.5 bg-slate-400 group-hover:bg-emerald-400 transition-colors"></div>
            <div className="w-5 h-0.5 bg-slate-400 group-hover:bg-emerald-400 transition-colors"></div>
          </button>

          {showMenu && (
            <div className="absolute top-12 right-0 w-64 bg-[#0e1421] border border-[#1e293b] rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <button 
                onClick={() => { setShowPricingModal(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-xl transition-all sm:hidden"
              >
                Pricing Plans
              </button>
              <button 
                onClick={() => { setShowRefundModal(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-xl transition-all"
              >
                Refund & Cancellation
              </button>
              <button 
                onClick={() => { setShowTermsModal(true); setShowMenu(false); }}
                className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-xl transition-all"
              >
                Terms & Conditions
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 mt-8">
        
        {/* Auth Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-purple-600 text-white shadow-purple-500/20' : (mode === 'FORGOT' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/20')}`}>
            {mode === 'ADMIN' ? 'A' : (mode === 'FORGOT' ? '?' : 'T')}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={mode === 'ADMIN' ? 'text-purple-400' : (mode === 'FORGOT' ? 'text-blue-400' : 'text-emerald-500')}>{mode === 'ADMIN' ? 'Admin' : (mode === 'FORGOT' ? 'Reset' : 'AI')}</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-xs font-medium">
            Professional Performance Journal & AI Risk Coach
          </p>
        </div>

        {/* Auth Card */}
        <div className={`w-full p-10 rounded-[3rem] border shadow-2xl transition-all duration-500 ${mode === 'ADMIN' ? 'bg-[#1a0b2e] border-purple-500/30' : (mode === 'FORGOT' ? 'bg-[#0b142e] border-blue-500/30' : 'bg-[#0e1421] border-[#1e293b]')}`}>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              {mode === 'REGISTER' ? 'Register Account' : mode === 'ADMIN' ? 'Terminal Access' : mode === 'FORGOT' ? 'Reset Passphrase' : 'Sign In'}
            </h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              {mode === 'REGISTER' ? 'Step 1: Create Identity' : mode === 'FORGOT' ? 'Identity Verification Required' : 'Authorized Access Only'}
            </p>
          </div>
          
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-6">
            {(mode === 'REGISTER' || mode === 'FORGOT') && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Registered Mobile No.</label>
                <input type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm" placeholder="+91" />
              </div>
            )}
            
            {mode === 'REGISTER' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm" placeholder="e.g. Rahul Sharma" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Select Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {plans.map(p => (
                      <button key={p.type} type="button" onClick={() => setSelectedPlan(p.type)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedPlan === p.type ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg' : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500 hover:border-slate-400'}`}>
                        <span className="text-[8px] font-black uppercase tracking-tighter">{p.duration}</span>
                        <span className="text-sm font-black">₹{p.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email ID</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm" placeholder="identity@trademind.ai" />
            </div>

            {mode !== 'FORGOT' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Passphrase</label>
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline">Forgot?</button>
                  )}
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-semibold transition-all text-sm" placeholder="••••••••" />
              </div>
            )}

            {mode === 'FORGOT' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">New Passphrase</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#0a0f1d] border border-blue-500/30 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-white font-semibold transition-all text-sm" placeholder="••••••••" />
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-3 p-1">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-[#1e293b] bg-[#0a0f1d] text-emerald-500 accent-emerald-500" required />
                <label className="text-[11px] font-medium text-slate-400">
                  I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-400 hover:underline">Terms & Conditions</button>.
                </label>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting || (mode === 'REGISTER' && !termsAccepted)} className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] mt-4 ${mode === 'ADMIN' ? 'bg-purple-600 hover:bg-purple-500 text-white' : (mode === 'FORGOT' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900')} disabled:opacity-30`}>
              {isSubmitting ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (mode === 'REGISTER' ? 'Submit Registration' : mode === 'FORGOT' ? 'Reset & Return' : 'Enter Terminal')}
            </button>
          </form>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <button onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : (mode === 'FORGOT' ? 'LOGIN' : 'REGISTER'))} className="py-4 rounded-2xl border border-[#1e293b] text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all">
              {mode === 'REGISTER' ? 'Back to Login' : (mode === 'FORGOT' ? 'Back to Login' : 'Create Account')}
            </button>
            <button onClick={() => setMode(mode === 'ADMIN' ? 'LOGIN' : 'ADMIN')} className={`py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'ADMIN' ? 'border-emerald-500/30 text-emerald-400' : 'border-purple-500/30 text-purple-400'}`}>
              {mode === 'ADMIN' ? 'Switch to User' : 'Admin Console'}
            </button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="w-full max-w-5xl mt-24">
        <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-1000">
          <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3 block">Elevate Your Execution</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">
            Master the Art of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Disciplined Trading</span>
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium leading-relaxed">
            Professional-grade tools designed to audit your mindset, track your edge, and eliminate capital-draining execution leaks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="bg-[#0e1421]/60 border border-[#1e293b] p-6 rounded-[2rem] flex gap-5 items-center transition-all hover:bg-[#0e1421]/80 hover:border-emerald-500/20 group">
              <div className="text-3xl bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b] group-hover:scale-110 transition-transform">{b.icon}</div>
              <div className="flex-1">
                <h4 className="font-black text-white text-xs uppercase tracking-widest mb-1">{b.title}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0e1421] border border-[#1e293b] rounded-[3rem] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
             <div className="p-10 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]">
                <h3 className="text-2xl font-black text-white tracking-tight">Refund & Cancellation Policy</h3>
                <button onClick={() => setShowRefundModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 text-slate-400 text-xs space-y-8 leading-relaxed custom-scrollbar">
                <div className="space-y-6">
                  <section className="space-y-3">
                    <h4 className="font-black text-emerald-400 uppercase text-[11px] tracking-widest">1) No Refund Policy</h4>
                    <p>All payments made to TradeMind AI Journal are final. As our services involve access to digital tools, analytics, and personal data management, once a subscription is purchased, it cannot be canceled, refunded, or transferred under any circumstances.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-black text-emerald-400 uppercase text-[11px] tracking-widest">2) Cancellation Policy</h4>
                    <p>Trade Diary operates on a subscription-based model. Once your subscription is activated, you will continue to have access until the end of the current billing cycle.</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You may choose to cancel your subscription at any time.</li>
                      <li>Cancellation will prevent the next renewal, but no refund will be issued for the remaining period of an active subscription.</li>
                    </ul>
                    <p className="pt-2 italic border-t border-white/5">The Trade Diary platform is intended for journaling, analysis, and performance tracking only. We do not provide trading advice, stock recommendations, or financial guidance. All insights and reports are based on user-input data and should be used at your own discretion. Trading and investing involve risk, and we make no guarantee of returns or outcomes based on the use of our platform.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-black text-emerald-400 uppercase text-[11px] tracking-widest">3) Transparency & Responsibility</h4>
                    <p>We urge users to fully understand the scope and features of TradeMind AI Journal before making any payment. Please carefully review our Terms of Service, Privacy Policy, and this Refund Policy prior to subscribing.</p>
                    <p className="font-bold text-slate-200">By subscribing to TradeMindaijournal, you acknowledge that you have read, understood, and agreed to the terms stated above.</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="font-black text-emerald-400 uppercase text-[11px] tracking-widest">Service Modifications</h4>
                    <p>The App reserves the right to:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Modify features</li>
                      <li>Update pricing</li>
                      <li>Add or remove content</li>
                    </ol>
                    <p className="pt-2">without affecting the validity of this No Refund & No Cancellation Policy.</p>
                  </section>

                  <section className="bg-[#0a0f1d] p-6 rounded-2xl border border-[#1e293b] space-y-2 mt-8">
                    <h4 className="font-black text-white uppercase text-[10px] tracking-widest mb-2">Contact Us</h4>
                    <p>For any queries or support regarding refunds or cancellations, please reach out to:</p>
                    <p className="font-black text-emerald-400">Email: trademindaijournal@gmail.com</p>
                    <p className="font-black text-emerald-400">Contact No: 8600299477</p>
                  </section>
                </div>
             </div>
             <div className="p-10 border-t border-[#1e293b] bg-[#0a0f1d]">
                <button onClick={() => setShowRefundModal(false)} className="w-full bg-emerald-500 text-slate-900 font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg transition-all">Close Policy</button>
             </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-[#0e1421] border border-[#1e293b] rounded-[3rem] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
             <div className="p-10 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]">
                <h3 className="text-2xl font-black text-white tracking-tight">Subscription Tiers</h3>
                <button onClick={() => setShowPricingModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="text-center mb-6">
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select the professional environment that matches your execution scale.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((p) => (
                    <div key={p.type} className={`p-8 rounded-[2.5rem] border flex flex-col items-center gap-4 transition-all relative ${p.type === PlanType.ANNUAL ? 'bg-emerald-500/10 border-emerald-500/40 shadow-2xl scale-105 z-10' : 'bg-[#0a0f1d] border-[#1e293b] opacity-80'}`}>
                      {p.type === PlanType.ANNUAL && (
                        <div className="absolute top-[-12px] bg-emerald-500 text-slate-900 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Most Professional Choice</div>
                      )}
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.duration}</span>
                      <div className="text-4xl font-black text-white">₹{p.price}</div>
                      <div className="w-full pt-4 border-t border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                          Full AI Coach Access
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                          <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                          Institutional Reports
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedPlan(p.type); setShowPricingModal(false); setMode('REGISTER'); }}
                        className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest mt-4 transition-all ${p.type === PlanType.ANNUAL ? 'bg-emerald-500 text-slate-900' : 'bg-[#1e293b] text-slate-300 hover:bg-[#334155]'}`}
                      >
                        Subscribe
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0a0f1d] p-8 rounded-3xl border border-[#1e293b] space-y-4">
                  <h4 className="font-black text-white text-[10px] uppercase tracking-widest">Terminal Guarantee</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "Real-time Logic Auditing",
                      "Behavioral Leak Detection",
                      "Strategic Evidence Vault",
                      "Performance Curve Tracking",
                      "Equity Risk Management",
                      "Institutional CSV Data Export"
                    ].map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-slate-400 text-[10px] font-medium">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
             <div className="p-10 border-t border-[#1e293b] bg-[#0a0f1d]">
                <button onClick={() => setShowPricingModal(false)} className="w-full bg-[#1e293b] text-white font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg transition-all">Close Plans</button>
             </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#0e1421] border border-[#1e293b] rounded-[3rem] flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
             <div className="p-10 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]">
                <h3 className="text-2xl font-black text-white tracking-tight">Terms & Conditions</h3>
                <button onClick={() => setShowTermsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 text-slate-400 text-xs space-y-8 leading-relaxed custom-scrollbar">
                <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 mb-6">
                  <p className="text-emerald-400 font-black uppercase text-[10px] tracking-widest mb-2">Legal Disclaimer</p>
                  <p>By registering for TradeMind AI, you acknowledge that capital markets trading involves significant financial risk. We do not provide financial advice. All tools are for performance analysis and educational purposes only.</p>
                </div>
                
                <div className="space-y-6">
                  {termsList.map((term, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-black text-white text-[10px] uppercase tracking-widest">{term.title}</p>
                      <p className="text-slate-400">{term.content}</p>
                    </div>
                  ))}
                </div>
             </div>
             <div className="p-10 border-t border-[#1e293b] bg-[#0a0f1d]">
                <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className="w-full bg-emerald-500 text-slate-900 font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-lg transition-all">Accept All Terms</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
