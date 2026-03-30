import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ArrowRight, ShieldCheck, Zap, Target, BrainCircuit, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- HARDCODED DEMO CREDENTIALS ---
  const DEMO_ID = 'BATS-DEMO';
  const DEMO_PASS = 'GeniusHub2026';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a secure network verification delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (username === DEMO_ID && password === DEMO_PASS) {
      // 1. Unlock the app for this specific browser session
      sessionStorage.setItem('bats_demo_auth', 'true');
      sessionStorage.setItem('bats_login_time', Date.now().toString());
      sessionStorage.setItem('bats_login_id', username);
      
      // 2. 🚨 DISCORD WEBHOOK: LOGIN ALARM 🚨
      try {
        fetch('https://discord.com/api/webhooks/1488185677211238430/FKx2kBLSNK6Xyu1kVUT8MLDcPovQnKdiLb2ztl2bB0cLa35yJXPNB1fVid5-5CYWwcSp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: "🚨 **BATS Alert:** A client just accessed the GeniusHub Enterprise Demo!",
            embeds: [{
              title: "Client Session Started",
              color: 3447003, // Professional BATS Blue
              fields: [
                { name: "Time (Local)", value: new Date().toLocaleString(), inline: true },
                { name: "Access ID Used", value: username, inline: true }
              ],
              footer: { text: "BATS Telemetry System" }
            }]
          })
        });
      } catch (err) {
        console.error("Telemetry ping failed", err);
      }
      
      // 3. Redirect to the Dashboard
      navigate('/');
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
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden p-4">
      
      {/* 🌟 CINEMATIC BACKGROUND WATERMARK 🌟 */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[0] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[60vw] max-w-[500px] aspect-square flex items-center justify-center"
        >
          <motion.img 
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            src="/comp-logo.PNG" 
            alt="Watermark" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(56,189,248,0.4)]" 
          />
        </motion.div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 relative z-10 bg-sidebar/70 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* LEFT COLUMN: BRANDING & FEATURES */}
        <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col justify-between relative bg-primary/5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="bg-white/90 p-3 rounded-xl inline-block mb-6 shadow-lg">
                <img src="/bay-area-final.jpeg" alt="BATS Logo" className="h-10 object-contain" />
              </div>
              
              <h2 className="text-2xl font-extrabold font-display tracking-tight text-foreground mb-2">
                Bay Area Technology Solutions
              </h2>
              <p className="text-primary font-bold tracking-widest uppercase text-xs mb-4">GeniusHub • Enterprise Evaluation</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Empowering businesses with elite IT staffing and custom software solutions. Experience our proprietary AI engine designed to analyze, filter, and strictly match top-tier technical talent at unprecedented speeds.
              </p>
            </motion.div>

            <div className="space-y-5">
              {features.map((f, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{f.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-10 relative z-10 flex items-center gap-2 text-xs font-mono text-muted-foreground">
             <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
             SECURE DEMO ENVIRONMENT
          </motion.div>
        </div>

        {/* RIGHT COLUMN: LOGIN FORM */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-background/50 relative">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="max-w-sm w-full mx-auto">
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-secondary/50 rounded-2xl flex items-center justify-center border border-border/50 mb-4 shadow-inner relative overflow-hidden">
                <Lock className="w-8 h-8 text-primary relative z-10" />
                <div className="absolute inset-0 bg-primary/20 blur-xl" />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground">Client Access</h3>
              <p className="text-xs text-muted-foreground mt-1">Enter your provided BATS demo credentials</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Access ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                    placeholder="Enter Client ID"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Secure Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-destructive text-center bg-destructive/10 py-2 rounded-lg border border-destructive/20 font-medium">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={loading || !username || !password}
                className="w-full btn-primary-glow !py-3 !rounded-xl mt-2 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
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

            <p className="text-center text-[10px] text-muted-foreground mt-8 px-4">
              Authorized personnel only. Activity on this evaluation node is securely monitored and logged by BATS.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
}