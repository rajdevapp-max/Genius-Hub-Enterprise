import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, FileText, BarChart3, Upload, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle, useTheme } from '@/components/ThemeToggle';

const navItems = [
  { path: '/', label: 'GeniusHub Search', icon: Search, desc: 'Hybrid intelligence' },
  { path: '/jd-match', label: 'JD Match', icon: FileText, desc: 'Job description match' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Real-time dashboard' },
  { path: '/upload', label: 'Upload', icon: Upload, desc: 'Add resumes' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  // 🎯 THE FIX: Check if we are on the demo site using the secret key
  const isDemoSite = window.location.search.includes("demo=demo-BATS");

  // 🚨 TAB CLOSE TRACKER 🚨
  useEffect(() => {
    // If it's your original model, don't even run the tracker!
    if (!isDemoSite) return;

    const handleTabClose = () => {
      const isAuth = sessionStorage.getItem('bats_demo_auth');
      const loginTime = sessionStorage.getItem('bats_login_time');
      const userId = sessionStorage.getItem('bats_login_id');

      if (isAuth === 'true' && loginTime && userId) {
        const durationMs = Date.now() - parseInt(loginTime);
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        
        const payload = JSON.stringify({
          content: "🛑 **BATS Alert:** A client closed the browser tab and ended the session.",
          embeds: [{
            title: "Client Session Ended (Tab Closed)",
            color: 15548997,
            fields: [
              { name: "Access ID", value: userId, inline: true },
              { name: "Total Session Duration", value: `${minutes}m ${seconds}s`, inline: true }
            ],
            footer: { text: "BATS Telemetry System" }
          }]
        });

        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('https://discord.com/api/webhooks/1488185677211238430/FKx2kBLSNK6Xyu1kVUT8MLDcPovQnKdiLb2ztl2bB0cLa35yJXPNB1fVid5-5CYWwcSp', blob);
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => window.removeEventListener('beforeunload', handleTabClose);
  }, [isDemoSite]);

  const handleLogout = () => {
    const loginTime = sessionStorage.getItem('bats_login_time');
    const userId = sessionStorage.getItem('bats_login_id') || 'Unknown';
    let durationStr = "Unknown";

    if (loginTime) {
      const durationMs = Date.now() - parseInt(loginTime);
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      durationStr = `${minutes}m ${seconds}s`;
    }

    try {
      fetch('https://discord.com/api/webhooks/1488185677211238430/FKx2kBLSNK6Xyu1kVUT8MLDcPovQnKdiLb2ztl2bB0cLa35yJXPNB1fVid5-5CYWwcSp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: "🛑 **BATS Alert:** A client explicitly clicked Logout.",
          embeds: [{
            title: "Client Session Ended (Manual Logout)",
            color: 15548997,
            fields: [
              { name: "Access ID", value: userId, inline: true },
              { name: "Total Session Duration", value: durationStr, inline: true }
            ],
            footer: { text: "BATS Telemetry System" }
          }]
        })
      });
    } catch (err) {}

    sessionStorage.removeItem('bats_demo_auth');
    sessionStorage.removeItem('bats_login_time');
    sessionStorage.removeItem('bats_login_id');
    navigate('/login?demo=demo-BATS');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
        style={{ boxShadow: '4px 0 30px hsl(var(--background) / 0.5)' }}
      >
        <div className="flex items-center px-4 h-16 border-b border-sidebar-border shrink-0">
          <Link to={isDemoSite ? "/?demo=demo-BATS" : "/"} className="flex items-center gap-3 shrink-0 overflow-hidden cursor-pointer">
            <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/comp-logo.PNG" alt="BATS Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap">
                  <h1 className="text-xs font-bold font-display tracking-wider text-foreground">BATS GeniusHub</h1>
                  <p className="text-[9px] text-muted-foreground tracking-wide">INTELLIGENCE v6.0</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-foreground shrink-0 transition-colors">
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-1">
          {navItems.map(({ path, label, icon: Icon, desc }) => {
            const active = location.pathname === path;
            const targetPath = isDemoSite ? `${path}?demo=demo-BATS` : path; // Keep demo key in URLs when navigating!
            
            return (
              <Link key={path} to={targetPath} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}>
                {active && <motion.div layoutId="activeNav" className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15" style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.06)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all relative z-10 ${active ? 'bg-primary/15' : 'bg-secondary/40 group-hover:bg-secondary'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 relative z-10">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-[9px] text-muted-foreground">{desc}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-2' : 'justify-between px-2'}`}>
            <ThemeToggle theme={theme} toggle={toggle} />
            
            {/* 🎯 THE FIX: Only render the Logout button if it is the Demo Site! */}
            {isDemoSite && (
              <button 
                onClick={handleLogout} 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4" />
                {!collapsed && <span className="text-xs font-bold uppercase tracking-wider">Logout</span>}
              </button>
            )}

          </div>
          {!collapsed && (
            <div className="glass-panel p-2.5 flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
              <span className="text-[9px] text-muted-foreground font-mono">SYSTEM ONLINE • AUTO-SYNC</span>
            </div>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 transition-all duration-300 relative" style={{ marginLeft: collapsed ? 68 : 260 }}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}