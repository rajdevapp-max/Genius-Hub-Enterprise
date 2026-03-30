import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, ShieldCheck, Zap, Target, BrainCircuit, Loader2, ExternalLink } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const DEMO_ID = 'BATS-DEMO';
  const DEMO_PASS = 'GeniusHub2026';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    if (username === DEMO_ID && password === DEMO_PASS) {
      sessionStorage.setItem('bats_demo_auth', 'true');
      sessionStorage.setItem('bats_login_time', Date.now().toString());
      sessionStorage.setItem('bats_login_id', username);
      
      try {
        fetch('https://discord.com/api/webhooks/1488185677211238430/FKx2kBLSNK6Xyu1kVUT8MLDcPovQnKdiLb2ztl2bB0cLa35yJXPNB1fVid5-5CYWwcSp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: "🚨 **BATS Alert:** A client just accessed the GeniusHub Enterprise Demo!",
            embeds: [{
              title: "Client Session Started",
              color: 3447003,
              fields: [
                { name: "Time (Local)", value: new Date().toLocaleString(), inline: true },
                { name: "Access ID Used", value: username, inline: true }
              ],
              footer: { text: "BATS Telemetry System" }
            }]
          })
        });
      } catch (err) {}
      
      // 🎯 THE FIX: Ensure we keep the '?demo=demo-BATS' tag when redirecting to the dashboard!
      navigate('/?demo=demo-BATS');
    } else {
      setError('Invalid Access ID or Secure Password. Please contact BATS support.');
      setLoading(false);
    }
  };

  const features = [
    { icon: BrainCircuit, title: 'AI Semantic Search', desc: 'Bypass keyword stuffing with deep contextual talent matching.' },
    { icon: Target, title: 'Strict JD Matching', desc: 'Instantly filter out candidates lacking core technical requirements.' },
    { icon: ShieldCheck, title: 'Fraud Detection', desc: 'Identify invisible text and resume padding automatically.' },
    { icon: Zap, title: 'Real-Time Telemetry', desc: 'Live analytics and talent lifecycle tracking.' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#050914] text-slate-200 flex items-center justify-center relative overflow-hidden p-4">
      
      {/* 🌟 BRIGHTER CINEMATIC BACKGROUND WATERMARK 🌟 */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[0] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050914]/60 to-[#050914] z-[-1]" />
        
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[80vw] max-w-[700px] aspect-square flex items-center justify-center"
        >
          <motion.img 
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            src="/comp-logo.PNG" 
            alt="BATS Watermark" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_100px_rgba(56,189,248,0.8)]" 
          />
        </motion.div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 relative z-10 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <div className="bg-white/95 p-3 rounded-xl inline-block mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <img src="/bay-area-final.jpeg" alt="BATS Logo" className="h-10 object-contain" />
              </div>
              
              <h2 className="text-2xl font-extrabold font-display tracking-tight text-white mb-2">
                Bay Area Technology Solutions
              </h2>
              <p className="text-blue-400 font-bold tracking-widest uppercase text-xs mb-4">GeniusHub • Enterprise Evaluation</p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-4">
                Empowering businesses with elite IT staffing and custom software solutions. Experience our proprietary AI engine designed to analyze, filter, and strictly match top-tier technical talent at unprecedented speeds.
              </p>

              <motion.a 
                whileHover={{ x: 5 }}
                href="https://bayareatechsol.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
              >
                Visit BATS Corporate Website <ExternalLink className="w-3 h-3" />
              </motion.a>
            </motion.div>

            <div className="space-y-6 mt-8">
              {features.map((f, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                  className="flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                    <f.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{f.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-12 relative z-10 flex items-center gap-2 text-[10px] font-mono text-slate-500 tracking-widest uppercase">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             Secure Demo Node Online
          </motion.div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center bg-black/20 relative">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="max-w-sm w-full mx-auto">
            
            <div className="text-center mb-8">
              <motion.div 
                animate={{ boxShadow: ['0 0 15px rgba(59,130,246,0.2)', '0 0 30px rgba(59,130,246,0.4)', '0 0 15px rgba(59,130,246,0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 mx-auto bg-blue-950/50 rounded-2xl flex items-center justify-center border border-blue-500/30 mb-5 relative overflow-hidden"
              >
                <Lock className="w-7 h-7 text-blue-400 relative z-10" />
                <div className="absolute inset-0 bg-blue-500/10 blur-xl" />
              </motion.div>
              <h3 className="text-xl font-bold font-display text-white tracking-wide">Client Authentication</h3>
              <p className="text-xs text-slate-400 mt-1">Enter your assigned BATS credentials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Access ID</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                    placeholder="Enter Client ID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Secure Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-xs text-red-400 text-center bg-red-500/10 py-2.5 rounded-lg border border-red-500/20 font-medium flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={loading || !username || !password}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all font-bold tracking-wide py-3 rounded-xl mt-4 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Initialize Session <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-500 mt-8 px-4 leading-relaxed">
              Authorized personnel only. Activity on this evaluation node is securely monitored and logged by BATS.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}